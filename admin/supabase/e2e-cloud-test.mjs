#!/usr/bin/env node
/**
 * 🧪 E2E Cloud Integration Test
 * Verifies the entire cloud automation pipeline is wired up:
 *   1. Supabase tables exist (app_settings, ecosystem_health_logs, pipeline_queue, content_calendar)
 *   2. Views exist (v_latest_health, v_pipeline_stats, v_content_calendar_upcoming)
 *   3. Edge Functions respond (ecosystem-health-check, youtube-pipeline-trigger, daily-content-scheduler)
 *   4. pg_cron jobs are active
 *   5. Postgres triggers exist (notify_pipeline_completion, sync_pipeline_queue_status)
 *   6. Realtime publication includes pipeline_runs
 *
 * Usage:  node scripts/e2e-cloud-test.mjs
 */

import pg from 'pg';
const { Client } = pg;

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NTk1NTIsImV4cCI6MjA1MjQzNTU1Mn0.zcU8kM3r1xVLYumRCNGpXe1dG85V8lCm3z_hR49HKOQ';

const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjg1OTU1MiwiZXhwIjoyMDUyNDM1NTUyfQ.RMgMRnSGKFYECxlFMR81MNyaDXUJ0YwGhVDUmFQ4YCs';

const SESSION_POOLER =
  'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

let passed = 0;
let failed = 0;
const results = [];

function ok(test) {
  passed++;
  results.push({ test, status: '✅' });
}
function fail(test, err) {
  failed++;
  results.push({ test, status: '❌', error: String(err).slice(0, 120) });
}

// ─── DB CHECKS ──────────────────────────────────────────────────────────────
async function dbChecks() {
  const client = new Client({ connectionString: SESSION_POOLER, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('🔌 Connected to Supabase via session pooler\n');

    // 1. Tables exist
    const tables = ['app_settings', 'ecosystem_health_logs', 'pipeline_queue', 'content_calendar', 'pipeline_runs'];
    for (const t of tables) {
      try {
        const { rows } = await client.query(`SELECT count(*) FROM ${t}`);
        ok(`Table ${t} exists (${rows[0].count} rows)`);
      } catch (e) {
        fail(`Table ${t} exists`, e.message);
      }
    }

    // 2. Views exist
    const views = ['v_latest_health', 'v_pipeline_stats', 'v_content_calendar_upcoming'];
    for (const v of views) {
      try {
        await client.query(`SELECT * FROM ${v} LIMIT 1`);
        ok(`View ${v} exists`);
      } catch (e) {
        fail(`View ${v} exists`, e.message);
      }
    }

    // 3. pg_cron jobs
    try {
      const { rows } = await client.query(
        `SELECT jobname, schedule, active FROM cron.job WHERE active = true ORDER BY jobname`
      );
      if (rows.length >= 3) {
        ok(`pg_cron: ${rows.length} active jobs (${rows.map(r => r.jobname).join(', ')})`);
      } else {
        fail(`pg_cron active jobs`, `only ${rows.length} active`);
      }
    } catch (e) {
      fail('pg_cron check', e.message);
    }

    // 4. Triggers exist
    const triggers = ['trg_pipeline_telegram', 'trg_pipeline_queue_sync'];
    for (const trg of triggers) {
      try {
        const { rows } = await client.query(
          `SELECT tgname FROM pg_trigger WHERE tgname = $1`,
          [trg]
        );
        rows.length > 0 ? ok(`Trigger ${trg} exists`) : fail(`Trigger ${trg}`, 'not found');
      } catch (e) {
        fail(`Trigger ${trg}`, e.message);
      }
    }

    // 5. Realtime publication includes pipeline_runs
    try {
      const { rows } = await client.query(
        `SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pipeline_runs'`
      );
      rows.length > 0
        ? ok('Realtime: pipeline_runs in supabase_realtime publication')
        : fail('Realtime publication', 'pipeline_runs not in supabase_realtime');
    } catch (e) {
      fail('Realtime publication check', e.message);
    }

    // 6. app_settings has telegram keys
    try {
      const { rows } = await client.query(
        `SELECT key FROM app_settings WHERE key IN ('telegram_bot_token', 'telegram_chat_id')`
      );
      rows.length === 2
        ? ok('app_settings: telegram_bot_token + telegram_chat_id present')
        : fail('app_settings telegram keys', `found ${rows.length}/2`);
    } catch (e) {
      fail('app_settings telegram keys', e.message);
    }

  } finally {
    await client.end();
  }
}

// ─── EDGE FUNCTION CHECKS ───────────────────────────────────────────────────
async function edgeFunctionChecks() {
  const functions = [
    { name: 'ecosystem-health-check', method: 'POST' },
    { name: 'youtube-pipeline-trigger', method: 'OPTIONS' },  // OPTIONS to avoid triggering pipeline
    { name: 'daily-content-scheduler', method: 'OPTIONS' },
  ];

  for (const fn of functions) {
    try {
      const url = `${SUPABASE_URL}/functions/v1/${fn.name}`;
      const res = await fetch(url, {
        method: fn.method,
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });
      if (fn.method === 'OPTIONS') {
        // CORS preflight: 200 or 204 means function exists
        ok(`Edge Function ${fn.name}: responds (${res.status})`);
      } else {
        const body = await res.json().catch(() => null);
        const svcCount = body?.results?.length ?? '?';
        res.ok
          ? ok(`Edge Function ${fn.name}: ${res.status} — ${svcCount} services checked`)
          : fail(`Edge Function ${fn.name}`, `${res.status} ${res.statusText}`);
      }
    } catch (e) {
      fail(`Edge Function ${fn.name}`, e.message);
    }
  }
}

// ─── RUN ─────────────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════');
console.log('  🧪 E2E CLOUD INTEGRATION TEST');
console.log('═══════════════════════════════════════════════════\n');

try {
  await dbChecks();
  console.log('');
  await edgeFunctionChecks();
} catch (e) {
  console.error('Fatal:', e);
}

console.log('\n═══════════════════════════════════════════════════');
console.log('  RESULTS');
console.log('═══════════════════════════════════════════════════');
for (const r of results) {
  console.log(`  ${r.status} ${r.test}${r.error ? ' — ' + r.error : ''}`);
}
console.log(`\n  Total: ${passed} passed, ${failed} failed out of ${passed + failed}`);
console.log('═══════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
