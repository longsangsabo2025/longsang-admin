#!/usr/bin/env node
/**
 * Fix pg_cron jobs: replace current_setting() → read from app_settings table
 * Also seeds supabase_url + service_role_key into app_settings
 */
import pg from 'pg';
const { Client } = pg;

const SESSION_POOLER =
  'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const client = new Client({ connectionString: SESSION_POOLER, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('🔌 Connected\n');

// ── Step 1: Seed supabase_url + service_role_key into app_settings ──
console.log('📦 Step 1: Seeding keys into app_settings...');
const seeds = [
  { key: 'supabase_url', value: SUPABASE_URL, category: 'infrastructure', is_secret: false },
  { key: 'service_role_key', value: SERVICE_ROLE_KEY, category: 'infrastructure', is_secret: true },
];

for (const s of seeds) {
  await client.query(
    `INSERT INTO app_settings (key, value, category, is_secret)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO UPDATE SET value = $2, category = $3, is_secret = $4, updated_at = now()`,
    [s.key, s.value, s.category, s.is_secret]
  );
  console.log(`  ✅ ${s.key} → ${s.is_secret ? '***' : s.value}`);
}

// ── Step 2: Recreate pg_cron jobs to read from app_settings ──
console.log('\n🔄 Step 2: Updating pg_cron jobs to use app_settings...');

// Unschedule existing
for (const name of ['ecosystem-health-check', 'daily-content-scheduler', 'process-email-queue']) {
  try {
    await client.query(`SELECT cron.unschedule('${name}')`);
    console.log(`  🗑️  Unscheduled: ${name}`);
  } catch {
    console.log(`  ℹ️  ${name} not found (already removed)`);
  }
}

// Recreate with app_settings subquery
const jobs = [
  {
    name: 'ecosystem-health-check',
    schedule: '*/15 * * * *',
    endpoint: '/functions/v1/ecosystem-health-check',
  },
  {
    name: 'daily-content-scheduler',
    schedule: '0 1 * * *',
    endpoint: '/functions/v1/daily-content-scheduler',
  },
  {
    name: 'process-email-queue',
    schedule: '* * * * *',
    endpoint: '/functions/v1/process-queue',
  },
];

for (const job of jobs) {
  const sql = `
    SELECT cron.schedule(
      '${job.name}',
      '${job.schedule}',
      $$SELECT net.http_post(
        url   := (SELECT value FROM app_settings WHERE key = 'supabase_url') || '${job.endpoint}',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (SELECT value FROM app_settings WHERE key = 'service_role_key'),
          'Content-Type',  'application/json'
        ),
        body  := '{}'::jsonb
      )$$
    )`;
  await client.query(sql);
  console.log(`  ✅ Scheduled: ${job.name} (${job.schedule})`);
}

// ── Step 3: Verify ──
console.log('\n🔍 Step 3: Verifying...');
const { rows: cronJobs } = await client.query(
  `SELECT jobname, schedule, active, command FROM cron.job WHERE active = true ORDER BY jobname`
);
console.log(`  Active pg_cron jobs: ${cronJobs.length}`);
for (const j of cronJobs) {
  const usesAppSettings = j.command.includes('app_settings');
  const usesCurrentSetting = j.command.includes('current_setting');
  console.log(`  ${usesAppSettings ? '✅' : usesCurrentSetting ? '❌ STILL uses current_setting!' : '⚪'} ${j.jobname} (${j.schedule})`);
}

const { rows: keys } = await client.query(
  `SELECT key, CASE WHEN is_secret THEN '***' ELSE value END as display FROM app_settings ORDER BY key`
);
console.log(`\n  app_settings (${keys.length} items):`);
for (const k of keys) {
  console.log(`    ${k.key} = ${k.display}`);
}

await client.end();
console.log('\n✅ Done! pg_cron jobs now read from app_settings table — no superuser needed.');
