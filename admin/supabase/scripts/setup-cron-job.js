// =====================================================
// SETUP CRON JOB FOR AUTO FETCH EMAILS
// =====================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupCronJob() {
  console.log('\n========================================')
  console.log('  ⏰ SETTING UP CRON JOB')
  console.log('========================================\n')

  const cronSQL = `
    SELECT cron.schedule(
        'fetch-support-emails',
        '*/5 * * * *',
        $$
        SELECT
          net.http_post(
              url:='https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/fetch-emails',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${process.env.SUPABASE_ANON_KEY}"}'::jsonb,
              body:='{}'::jsonb
          ) AS request_id;
        $$
    );
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: cronSQL })
    
    if (error) {
      console.error('❌ Error:', error.message)
      console.log('\n📝 Manual Setup Required:')
      console.log('1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/database/cron-jobs')
      console.log('2. Click "Create a new cron job"')
      console.log('3. Schedule: */5 * * * * (Every 5 minutes)')
      console.log('4. SQL Query:')
      console.log(`
SELECT
  net.http_post(
      url:='https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/fetch-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${process.env.SUPABASE_ANON_KEY}"}'::jsonb,
      body:='{}'::jsonb
  ) AS request_id;
      `)
      console.log('\n5. Click "Save"')
    } else {
      console.log('✅ Cron Job created successfully!')
    }

  } catch (err) {
    console.error('\n❌ Failed to create cron job programmatically')
    console.log('\n📝 MANUAL SETUP (2 minutes):')
    console.log('\n1. Vào Dashboard:')
    console.log('   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/database/cron-jobs')
    console.log('\n2. Click "Create a new cron job"')
    console.log('\n3. Điền:')
    console.log('   Name: fetch-support-emails')
    console.log('   Schedule: */5 * * * * (Every 5 minutes)')
    console.log('\n4. SQL Query (copy paste):')
    console.log('```sql')
    console.log(`SELECT
  net.http_post(
      url:='https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/fetch-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${process.env.SUPABASE_ANON_KEY}"}'::jsonb,
      body:='{}'::jsonb
  ) AS request_id;`)
    console.log('```')
    console.log('\n5. Click "Save"')
  }

  console.log('\n========================================\n')
}

setupCronJob()
