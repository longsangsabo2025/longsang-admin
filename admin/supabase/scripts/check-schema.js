// Check current database schema
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('\n📊 Checking database schema...\n')
  
  // Check if email_templates table exists
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Error:', error.message)
    console.log('\n🔧 Table might not exist or schema is different')
  } else {
    console.log('✅ email_templates table exists!')
    if (data.length > 0) {
      console.log('\n📋 Sample row structure:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('\n📋 Table is empty')
    }
  }
}

checkSchema()
