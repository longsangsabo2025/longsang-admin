// =====================================================
// TEST EMAIL SYSTEM WITH EXISTING SCHEMA
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
  console.log('  🧪 TESTING EMAIL SYSTEM')
  console.log('========================================\n')

  try {
    // Check templates
    console.log('📧 Checking email templates...')
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*')

    if (templatesError) throw templatesError

    console.log(`✅ Found ${templates.length} templates:`)
    templates.forEach(t => {
      console.log(`   - ${t.name} (${t.template_type})`)
    })

    // Check if we have email_queue table
    console.log('\n📨 Checking email_queue table...')
    const { data: queue, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .limit(1)

    if (queueError) {
      console.log(`❌ email_queue error: ${queueError.message}`)
      console.log('⚠️  You might need to create email_queue table')
    } else {
      console.log('✅ email_queue table exists!')
    }

    console.log('\n========================================')
    console.log('  ✅ SCHEMA CHECK COMPLETE')
    console.log('========================================\n')
    console.log('📋 Current schema uses:')
    console.log('   - email_templates.body (not html_content)')
    console.log('   - Simple text-based templates')
    console.log('\n💡 Next step: Create email sending workflow')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testEmailSystem()
