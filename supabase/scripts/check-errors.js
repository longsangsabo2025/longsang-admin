// Check error details
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkErrors() {
  console.log('\n🔍 Checking error details...\n')
  
  // Check queue errors
  const { data: queue } = await supabase
    .from('email_queue')
    .select('*')
    .not('error_message', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)

  if (queue && queue.length > 0) {
    console.log('❌ Queue Errors:')
    for (const item of queue) {
      console.log(`\n📧 ${item.to_email}`)
      console.log(`   Status: ${item.status}`)
      console.log(`   Error: ${item.error_message}`)
      console.log(`   Retry: ${item.retry_count}/${item.max_retries}`)
    }
  }

  // Check log errors
  const { data: logs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('status', 'failed')
    .order('sent_at', { ascending: false })
    .limit(3)

  if (logs && logs.length > 0) {
    console.log('\n\n❌ Log Errors:')
    for (const log of logs) {
      console.log(`\n📧 ${log.to_email}`)
      console.log(`   Subject: ${log.subject}`)
      console.log(`   Error: ${log.error_message}`)
    }
  }
}

checkErrors()
