// =====================================================
// TEST EMAIL AUTOMATION SYSTEM
// =====================================================
// Usage: node scripts/test-email.js
// =====================================================

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// =====================================================
// TEST 1: WELCOME EMAIL (Auto-triggered)
// =====================================================
async function testWelcomeEmail() {
  console.log('\n🧪 TEST 1: Welcome Email (Auto-triggered)')
  console.log('─'.repeat(50))

  try {
    const { data, error } = await supabase
      .from('user_registrations')
      .insert({
        email: 'longsangsabo@gmail.com',
        name: 'Test User',
        activation_token: `token_${Date.now()}`
      })
      .select()

    if (error) throw error

    console.log('✅ User registered:', data[0].email)
    console.log('📧 Welcome email queued automatically via trigger')
    console.log('⏳ Check email_queue table in 5 seconds...')

    // Wait and check queue
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const { data: queue } = await supabase
      .from('email_queue')
      .select('*')
      .eq('to_email', 'longsangsabo@gmail.com')
      .order('created_at', { ascending: false })
      .limit(1)

    if (queue && queue.length > 0) {
      console.log('✅ Email in queue:', {
        status: queue[0].status,
        subject: queue[0].subject,
        template_id: queue[0].template_id
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// =====================================================
// TEST 2: ORDER CONFIRMATION EMAIL (Manual)
// =====================================================
async function testOrderConfirmation() {
  console.log('\n🧪 TEST 2: Order Confirmation Email (Manual)')
  console.log('─'.repeat(50))

  try {
    // Get template ID
    const { data: template } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_type', 'order-confirmation')
      .single()

    if (!template) throw new Error('Order confirmation template not found')

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        template_id: template.id,
        to_email: 'longsangsabo@gmail.com',
        to_name: 'Test Customer',
        subject: 'Order Confirmation #12345',
        variables: {
          customer_name: 'Test Customer',
          order_id: '12345',
          order_date: new Date().toLocaleDateString(),
          items: '<div>Product 1 - $99</div><div>Product 2 - $149</div>',
          total_amount: '$248',
          shipping_address: '123 Test Street\nHanoi, Vietnam',
          tracking_link: 'https://longsang.org/track/12345',
          company_name: 'LongSang.org',
          support_email: 'support@longsang.org'
        }
      })
      .select()

    if (error) throw error

    console.log('✅ Order confirmation queued:', data[0].id)
    console.log('📧 Will be sent by cron job')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// =====================================================
// TEST 3: PASSWORD RESET EMAIL
// =====================================================
async function testPasswordReset() {
  console.log('\n🧪 TEST 3: Password Reset Email')
  console.log('─'.repeat(50))

  try {
    const { data: template } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_type', 'password-reset')
      .single()

    if (!template) throw new Error('Password reset template not found')

    const resetToken = `reset_${Date.now()}`

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        template_id: template.id,
        to_email: 'longsangsabo@gmail.com',
        to_name: 'Test User',
        subject: 'Reset Your Password - LongSang.org',
        variables: {
          user_name: 'Test User',
          reset_link: `https://longsang.org/reset-password?token=${resetToken}`,
          expiry_time: '1 hour',
          company_name: 'LongSang.org',
          support_email: 'support@longsang.org'
        }
      })
      .select()

    if (error) throw error

    console.log('✅ Password reset queued:', data[0].id)
    console.log('🔗 Reset token:', resetToken)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// =====================================================
// TEST 4: NEWSLETTER EMAIL
// =====================================================
async function testNewsletter() {
  console.log('\n🧪 TEST 4: Newsletter Email')
  console.log('─'.repeat(50))

  try {
    const { data: template } = await supabase
      .from('email_templates')
      .select('id')
      .eq('template_type', 'newsletter')
      .single()

    if (!template) throw new Error('Newsletter template not found')

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        template_id: template.id,
        to_email: 'longsangsabo@gmail.com',
        to_name: 'Subscriber',
        subject: 'November 2025 Update - LongSang.org',
        variables: {
          subscriber_name: 'Subscriber',
          newsletter_title: 'November 2025 Update',
          main_content: '<p>🎉 <strong>Big news!</strong> We just migrated from N8N to Supabase.</p><p>Our email system is now faster, simpler, and more reliable.</p>',
          cta_text: 'Read Full Article',
          cta_link: 'https://longsang.org/blog/supabase-migration',
          company_name: 'LongSang.org',
          unsubscribe_link: 'https://longsang.org/unsubscribe?email=longsangsabo@gmail.com',
          social_links: '<a href="https://twitter.com/longsang" style="margin: 0 10px;">Twitter</a><a href="https://github.com/longsang" style="margin: 0 10px;">GitHub</a>'
        }
      })
      .select()

    if (error) throw error

    console.log('✅ Newsletter queued:', data[0].id)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// =====================================================
// TEST 5: CHECK QUEUE STATUS
// =====================================================
async function checkQueueStatus() {
  console.log('\n📊 EMAIL QUEUE STATUS')
  console.log('─'.repeat(50))

  try {
    const { data: queue, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    console.log(`Total in queue: ${queue.length}`)
    console.log('')

    queue.forEach((item, index) => {
      console.log(`${index + 1}. ${item.to_email}`)
      console.log(`   Status: ${item.status}`)
      console.log(`   Subject: ${item.subject}`)
      console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// =====================================================
// TEST 6: CHECK EMAIL LOGS
// =====================================================
async function checkEmailLogs() {
  console.log('\n📜 EMAIL LOGS (Last 5)')
  console.log('─'.repeat(50))

  try {
    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5)

    if (error) throw error

    if (logs.length === 0) {
      console.log('No emails sent yet')
      return
    }

    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.to_email}`)
      console.log(`   Status: ${log.status}`)
      console.log(`   Subject: ${log.subject}`)
      console.log(`   Sent: ${new Date(log.sent_at).toLocaleString()}`)
      if (log.error_message) {
        console.log(`   Error: ${log.error_message}`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// =====================================================
// RUN ALL TESTS
// =====================================================
async function runAllTests() {
  console.log('\n' + '='.repeat(50))
  console.log('🚀 SUPABASE EMAIL AUTOMATION TEST SUITE')
  console.log('='.repeat(50))

  await testWelcomeEmail()
  await testOrderConfirmation()
  await testPasswordReset()
  await testNewsletter()
  await checkQueueStatus()
  await checkEmailLogs()

  console.log('\n' + '='.repeat(50))
  console.log('✅ ALL TESTS COMPLETED')
  console.log('='.repeat(50))
  console.log('\n📧 Check your inbox: longsangsabo@gmail.com')
  console.log('⏱️  Emails will be sent within 1 minute (cron job)')
  console.log('')
}

// Run tests
runAllTests()
