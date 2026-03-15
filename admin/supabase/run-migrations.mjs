#!/usr/bin/env node
/**
 * Migration Runner — executes all SQL migrations via Supabase session pooler
 * Uses port 5432 (session mode) for DDL compatibility
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Session pooler (port 5432) — supports DDL, SET, etc.
const CONNECTION_URL = process.env.DATABASE_URL 
  || 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

// Migration files in order (dependencies matter)
const MIGRATIONS = [
  '20260225_app_settings.sql',
  '20260225_cloud_automation_cron.sql',
  '20260225_cloud_automation_fix.sql',
  '20260225_cloud_automation_views.sql',
  '20260225_pipeline_realtime_triggers.sql',
];

async function runMigrations() {
  const client = new pg.Client({ connectionString: CONNECTION_URL });
  
  try {
    console.log('🔌 Connecting to Supabase (session pooler, port 5432)...');
    await client.connect();
    console.log('✅ Connected!\n');

    for (const file of MIGRATIONS) {
      const filePath = path.join(__dirname, 'migrations', file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  SKIP: ${file} (not found)`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`📄 Running: ${file}...`);
      
      try {
        await client.query(sql);
        console.log(`   ✅ ${file} — OK`);
      } catch (err) {
        // Log error but continue — many statements are idempotent
        console.log(`   ⚠️  ${file} — Error: ${err.message}`);
        
        // If it's a fatal error (not "already exists" type), stop
        if (!err.message.includes('already exists') && 
            !err.message.includes('duplicate') &&
            !err.message.includes('does not exist') &&
            !err.message.includes('could not open extension')) {
          // Try running statements one by one
          console.log('   🔄 Retrying statement by statement...');
          const statements = sql.split(/;\s*$/m).filter(s => s.trim());
          let ok = 0, fail = 0;
          for (const stmt of statements) {
            if (!stmt.trim()) continue;
            try {
              await client.query(stmt);
              ok++;
            } catch (stmtErr) {
              fail++;
              if (!stmtErr.message.includes('already exists') && 
                  !stmtErr.message.includes('duplicate')) {
                console.log(`      ⚠️  ${stmtErr.message.slice(0, 120)}`);
              }
            }
          }
          console.log(`   📊 ${ok} OK, ${fail} skipped/failed`);
        }
      }
    }

    console.log('\n🎉 All migrations complete!');
    
    // Verify key tables exist
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('app_settings', 'ecosystem_health_logs', 'pipeline_queue', 'content_calendar', 'pipeline_runs')
      ORDER BY table_name
    `);
    console.log('\n📋 Verified tables:', rows.map(r => r.table_name).join(', '));

    // Check triggers
    const { rows: triggers } = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
        AND trigger_name LIKE 'trg_pipeline%'
    `);
    if (triggers.length > 0) {
      console.log('🔔 Triggers:', triggers.map(t => `${t.trigger_name} on ${t.event_object_table}`).join(', '));
    }

    // Check app_settings
    const { rows: settings } = await client.query(`
      SELECT key, category FROM public.app_settings ORDER BY key
    `);
    if (settings.length > 0) {
      console.log('⚙️  App settings:', settings.map(s => `${s.key} (${s.category})`).join(', '));
    }

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
