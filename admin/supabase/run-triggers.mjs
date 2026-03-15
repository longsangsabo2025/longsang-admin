#!/usr/bin/env node
/**
 * Run the realtime triggers migration as one single query (no splitting)
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONNECTION_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new pg.Client({ connectionString: CONNECTION_URL });
  await client.connect();
  console.log('✅ Connected');

  // The first ALTER PUBLICATION already succeeded — skip it
  // Run the DO block for health_logs publication
  try {
    await client.query(`
      DO $$ BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_health_logs;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('✅ ecosystem_health_logs added to realtime (or already there)');
  } catch (e) { console.log('⚠️ realtime publication:', e.message); }

  // Create notify function
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.notify_pipeline_completion()
      RETURNS TRIGGER AS $$
      DECLARE
        _bot_token TEXT;
        _chat_id TEXT;
        _message TEXT;
        _topic TEXT;
        _duration_sec NUMERIC;
        _cost TEXT;
      BEGIN
        IF NEW.status NOT IN ('completed', 'failed', 'paused_cost') THEN
          RETURN NEW;
        END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
          RETURN NEW;
        END IF;
        BEGIN
          SELECT value INTO _bot_token FROM public.app_settings WHERE key = 'telegram_bot_token';
          SELECT value INTO _chat_id FROM public.app_settings WHERE key = 'telegram_chat_id';
        EXCEPTION WHEN OTHERS THEN
          RETURN NEW;
        END;
        IF _bot_token IS NULL OR _bot_token = '' OR _chat_id IS NULL OR _chat_id = '' THEN
          RETURN NEW;
        END IF;
        _topic := COALESCE(NEW.input->>'topic', NEW.pipeline_id, 'Unknown');
        _duration_sec := ROUND(COALESCE(NEW.total_duration_ms, 0) / 1000.0, 1);
        _cost := COALESCE(TO_CHAR(NEW.total_cost, 'FM$0.0000'), '$0');
        IF NEW.status = 'completed' THEN
          _message := E'\\u2705 *Pipeline Completed*\\n\\U0001F4CC ' || _topic || E'\\n\\u23F1 ' || _duration_sec || E's | \\U0001F4B0 ' || _cost || E'\\n\\U0001F194 ' || NEW.id;
        ELSIF NEW.status = 'failed' THEN
          _message := E'\\U0001F525 *Pipeline Failed*\\n\\U0001F4CC ' || _topic || E'\\n\\u23F1 ' || _duration_sec || E's\\n\\U0001F4A5 ' || COALESCE(LEFT(NEW.error_message, 200), 'Unknown error') || E'\\n\\U0001F194 ' || NEW.id;
        ELSIF NEW.status = 'paused_cost' THEN
          _message := E'\\u23F8 *Pipeline Paused (Cost Limit)*\\n\\U0001F4CC ' || _topic || E'\\n\\U0001F4B0 ' || _cost || E'\\n\\U0001F194 ' || NEW.id;
        END IF;
        PERFORM net.http_post(
          url := 'https://api.telegram.org/bot' || _bot_token || '/sendMessage',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object('chat_id', _chat_id, 'text', _message, 'parse_mode', 'Markdown')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ notify_pipeline_completion() created');
  } catch (e) { console.error('❌ notify function:', e.message); }

  // Create sync function
  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION public.sync_pipeline_queue_status()
      RETURNS TRIGGER AS $$
      DECLARE
        _topic TEXT;
      BEGIN
        IF NEW.status NOT IN ('completed', 'failed') THEN
          RETURN NEW;
        END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
          RETURN NEW;
        END IF;
        _topic := NEW.input->>'topic';
        IF _topic IS NOT NULL THEN
          UPDATE public.pipeline_queue
          SET 
            status = CASE WHEN NEW.status = 'completed' THEN 'completed' ELSE 'failed' END,
            completed_at = NOW(),
            result = jsonb_build_object('pipeline_run_id', NEW.id, 'total_cost', NEW.total_cost, 'duration_ms', NEW.total_duration_ms)
          WHERE topic = _topic AND status = 'processing';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ sync_pipeline_queue_status() created');
  } catch (e) { console.error('❌ sync function:', e.message); }

  // Create triggers
  try {
    await client.query(`DROP TRIGGER IF EXISTS trg_pipeline_telegram ON public.pipeline_runs`);
    await client.query(`
      CREATE TRIGGER trg_pipeline_telegram
        AFTER INSERT OR UPDATE OF status ON public.pipeline_runs
        FOR EACH ROW
        EXECUTE FUNCTION public.notify_pipeline_completion()
    `);
    console.log('✅ trg_pipeline_telegram created');
  } catch (e) { console.error('❌ telegram trigger:', e.message); }

  try {
    await client.query(`DROP TRIGGER IF EXISTS trg_pipeline_queue_sync ON public.pipeline_runs`);
    await client.query(`
      CREATE TRIGGER trg_pipeline_queue_sync
        AFTER INSERT OR UPDATE OF status ON public.pipeline_runs
        FOR EACH ROW
        EXECUTE FUNCTION public.sync_pipeline_queue_status()
    `);
    console.log('✅ trg_pipeline_queue_sync created');
  } catch (e) { console.error('❌ queue sync trigger:', e.message); }

  // Seed telegram settings
  try {
    await client.query(`
      INSERT INTO public.app_settings (key, value, category, is_secret)
      VALUES 
        ('telegram_bot_token', '', 'telegram', true),
        ('telegram_chat_id', '', 'telegram', false)
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ Telegram settings seeded');
  } catch (e) { console.error('❌ seed:', e.message); }

  // Verify
  const { rows: triggers } = await client.query(`
    SELECT trigger_name FROM information_schema.triggers 
    WHERE trigger_schema = 'public' AND event_object_table = 'pipeline_runs'
  `);
  console.log('\n📋 Triggers on pipeline_runs:', triggers.map(t => t.trigger_name).join(', ') || 'NONE');

  const { rows: funcs } = await client.query(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN ('notify_pipeline_completion', 'sync_pipeline_queue_status')
  `);
  console.log('📋 Functions:', funcs.map(f => f.routine_name).join(', ') || 'NONE');

  await client.end();
  console.log('\n🎉 Done!');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
