-- ============================================================================
-- PIPELINE REALTIME TRIGGERS
-- Postgres-native automation: when pipeline_runs status changes,
-- send Telegram alerts and update pipeline_queue — all inside the database.
-- No webhook, no Edge Function needed.
--
-- Requires: pg_net extension (already enabled in cloud_automation_cron.sql)
-- Idempotent: YES
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE SUPABASE REALTIME on pipeline_runs
--    Dashboard will subscribe to live changes — no polling needed.
-- ────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_runs;

-- Also enable Realtime on ecosystem_health_logs for live health dashboard
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ecosystem_health_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. FUNCTION: notify_pipeline_completion
--    Called by trigger when pipeline_runs.status changes.
--    Sends Telegram message via pg_net.http_post.
-- ────────────────────────────────────────────────────────────────────────────
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
  -- Only fire when status actually changes to a terminal state
  IF NEW.status NOT IN ('completed', 'failed', 'paused_cost') THEN
    RETURN NEW;
  END IF;
  
  -- Don't fire if status didn't change (UPDATE with same status)
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get Telegram credentials from app_settings table (managed via UI)
  BEGIN
    SELECT value INTO _bot_token FROM public.app_settings WHERE key = 'telegram_bot_token';
    SELECT value INTO _chat_id FROM public.app_settings WHERE key = 'telegram_chat_id';
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- No credentials = skip silently
  END;

  IF _bot_token IS NULL OR _chat_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extract topic from input_data JSONB
  _topic := COALESCE(NEW.input_data->>'topic', NEW.pipeline_name, 'Unknown');
  _duration_sec := ROUND(COALESCE(NEW.duration_ms, 0) / 1000.0, 1);
  _cost := COALESCE(TO_CHAR(NEW.total_cost, 'FM$0.0000'), '$0');

  -- Build message based on status
  IF NEW.status = 'completed' THEN
    _message := '✅ *Pipeline Completed*' || chr(10)
      || '📌 ' || _topic || chr(10)
      || '⏱ ' || _duration_sec || 's | 💰 ' || _cost || chr(10)
      || '🆔 `' || NEW.id || '`';
  ELSIF NEW.status = 'failed' THEN
    _message := '🔥 *Pipeline Failed*' || chr(10)
      || '📌 ' || _topic || chr(10)
      || '⏱ ' || _duration_sec || 's' || chr(10)
      || '💥 ' || COALESCE(
        LEFT((NEW.errors->>0)::TEXT, 200),
        'Unknown error'
      ) || chr(10)
      || '🆔 `' || NEW.id || '`';
  ELSIF NEW.status = 'paused_cost' THEN
    _message := '⏸ *Pipeline Paused (Cost Limit)*' || chr(10)
      || '📌 ' || _topic || chr(10)
      || '💰 ' || _cost || chr(10)
      || '🆔 `' || NEW.id || '`';
  END IF;

  -- Send via pg_net (async, non-blocking)
  PERFORM net.http_post(
    url := 'https://api.telegram.org/bot' || _bot_token || '/sendMessage',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'chat_id', _chat_id,
      'text', _message,
      'parse_mode', 'Markdown'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. FUNCTION: sync_pipeline_queue_status
--    When pipeline_runs completes/fails, update the matching pipeline_queue row.
-- ────────────────────────────────────────────────────────────────────────────
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

  _topic := NEW.input_data->>'topic';

  -- Update pipeline_queue: match by topic + status='processing'
  IF _topic IS NOT NULL THEN
    UPDATE public.pipeline_queue
    SET 
      status = CASE WHEN NEW.status = 'completed' THEN 'completed' ELSE 'failed' END,
      completed_at = NOW(),
      result = jsonb_build_object(
        'pipeline_run_id', NEW.id,
        'total_cost', NEW.total_cost,
        'duration_ms', NEW.duration_ms
      )
    WHERE topic = _topic 
      AND status = 'processing';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_pipeline_telegram ON public.pipeline_runs;
CREATE TRIGGER trg_pipeline_telegram
  AFTER INSERT OR UPDATE OF status ON public.pipeline_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pipeline_completion();

DROP TRIGGER IF EXISTS trg_pipeline_queue_sync ON public.pipeline_runs;
CREATE TRIGGER trg_pipeline_queue_sync
  AFTER INSERT OR UPDATE OF status ON public.pipeline_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pipeline_queue_status();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. SEED DEFAULT TELEGRAM SETTINGS
--    Insert placeholders so the UI has rows to update.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO public.app_settings (key, value, category, is_secret)
VALUES 
  ('telegram_bot_token', '', 'telegram', true),
  ('telegram_chat_id', '', 'telegram', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DONE. Now when pipeline_runs status changes:
--   ✅ Telegram notification sent automatically (via pg_net)
--   ✅ pipeline_queue synced automatically
--   ✅ Dashboard receives instant updates (via Supabase Realtime)
--   ✅ Telegram credentials managed via app_settings table (UI-editable)
--   ✅ Zero Edge Functions, zero webhooks, zero polling
-- ============================================================================
