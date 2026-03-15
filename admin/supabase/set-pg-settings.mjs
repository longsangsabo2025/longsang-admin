#!/usr/bin/env node
/**
 * Set database app settings for pg_cron
 */
import pg from 'pg';

const CONNECTION_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new pg.Client({ connectionString: CONNECTION_URL });
  await client.connect();
  console.log('✅ Connected');

  // Set app settings for pg_cron Edge Function calls
  const settings = [
    { key: 'app.supabase_url', value: 'https://diexsbzqwsbpilsymnfb.supabase.co' },
    { key: 'app.service_role_key', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY' },
  ];

  for (const { key, value } of settings) {
    try {
      await client.query(`ALTER DATABASE postgres SET ${key} = '${value}'`);
      console.log(`✅ ${key} — set`);
    } catch (e) {
      console.log(`⚠️ ${key} — ${e.message}`);
    }
  }

  // Also seed Telegram credentials into app_settings table
  const telegramToken = '8453714974:AAFbagp2TU1j70HuC1IZ2ykr8AVEdVs0qLs';
  try {
    await client.query(`
      UPDATE public.app_settings SET value = $1 WHERE key = 'telegram_bot_token'
    `, [telegramToken]);
    console.log('✅ telegram_bot_token — seeded in app_settings');
  } catch (e) { console.log('⚠️ telegram seed:', e.message); }

  // Verify pg_cron jobs
  try {
    const { rows } = await client.query(`SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname`);
    console.log('\n📋 pg_cron jobs:');
    for (const r of rows) {
      console.log(`  ${r.active ? '🟢' : '🔴'} ${r.jobname} — ${r.schedule}`);
    }
  } catch (e) { console.log('⚠️ pg_cron check:', e.message); }

  // Verify Edge Function reachability
  console.log('\n🔗 Testing Edge Function endpoint...');
  try {
    const resp = await fetch('https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/ecosystem-health-check', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings[1].value}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    const text = await resp.text();
    console.log(`  ecosystem-health-check: ${resp.status} — ${text.slice(0, 200)}`);
  } catch (e) { console.log('  ⚠️', e.message); }

  await client.end();
  console.log('\n🎉 Done!');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
