// =====================================================
// TEST SUPABASE EMAIL SYSTEM
// =====================================================
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEmailSystem() {
  console.log('\n========================================')
  console.log('  🧪 TESTING SUPABASE EMAIL SYSTEM')
  console.log('========================================\n')

  try {
    // Test 1: Add email to queue
    console.log('📧 TEST 1: Adding email to queue...')
    
    // Get welcome template
    const { data: template } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_type', 'welcome')
      .single()

    if (!template) {
      console.log('❌ No welcome template found')
      return
    }

    const { data: queueItem, error: queueError } = await supabase
      .from('email_queue')
      .insert({
        template_id: template.id,
        to_email: 'longsangsabo@gmail.com',
        to_name: 'Test User',
        subject: 'Test Email from Supabase',
        variables: {
          name: 'Test User',
          email: 'longsangsabo@gmail.com',
          service: 'Testing',
          message: 'This is a test email from Supabase email automation'
        }
      })
      .select()

    if (queueError) {
      console.error('❌ Error:', queueError.message)
      return
    }

    console.log('✅ Email added to queue!')
    console.log(`   Queue ID: ${queueItem[0].id}`)
    console.log(`   Status: ${queueItem[0].status}`)

    // Test 2: Call process-queue function
    console.log('\n📨 TEST 2: Processing queue...')
    
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/process-queue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Queue processed!')
      console.log(`   Processed: ${result.processed}`)
      console.log(`   Errors: ${result.errors}`)
      console.log(`   Total: ${result.total}`)
    } else {
      console.log('❌ Error:', result.error)
    }

    // Test 3: Check email logs
    console.log('\n📜 TEST 3: Checking email logs...')
    
    const { data: logs } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5)

    if (logs && logs.length > 0) {
      console.log(`✅ Found ${logs.length} log entries:`)
      for (const log of logs) {
        console.log(`   - ${log.to_email}: ${log.status} (${new Date(log.sent_at).toLocaleString()})`)
      }
    } else {
      console.log('⚠️  No logs found yet')
    }

    console.log('\n========================================')
    console.log('  ✅ TEST COMPLETE!')
    console.log('========================================\n')
    console.log('📧 Check your inbox: longsangsabo@gmail.com\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testEmailSystem()
