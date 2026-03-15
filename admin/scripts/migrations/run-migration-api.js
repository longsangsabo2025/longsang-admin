import fetch from 'node-fetch'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase credentials
const PROJECT_REF = 'diexsbzqwsbpilsymnfb'
const ACCESS_TOKEN = 'sbp_aada094fea2708e19311a8e59f0b0526a0592da1'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'

console.log('🚀 Consultation Booking Migration via Supabase API')
console.log('=' .repeat(60))

// Read migration SQL
const migrationPath = join(__dirname, 'supabase', 'migrations', '20250111_create_consultation_booking.sql')
const sqlContent = readFileSync(migrationPath, 'utf-8')

console.log(`📄 Loaded ${sqlContent.length} characters from migration file`)
console.log('\n📡 Executing SQL via Supabase Management API...')

try {
  // Use Supabase Management API to execute SQL
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    }
  )

  const result = await response.json()

  if (!response.ok) {
    console.log('❌ API Error:', response.status, response.statusText)
    console.log('Details:', JSON.stringify(result, null, 2))
    process.exit(1)
  }

  console.log('✅ SQL executed successfully!')
  console.log('Response:', JSON.stringify(result, null, 2).substring(0, 500))

} catch (error) {
  console.log('❌ Error:', error.message)
  console.log('\n⚠️ Management API might not support direct SQL execution.')
  console.log('Trying alternative method via PostgREST...')
  
  // Alternative: Use PostgREST with service role key
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_ROLE_KEY
  )
  
  console.log('\n🔍 Verifying existing tables...')
  
  const tables = [
    'consultations',
    'consultation_types',
    'availability_settings',
    'unavailable_dates'
  ]
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Table '${table}': NOT FOUND`)
    } else {
      console.log(`✅ Table '${table}': EXISTS (${count || 0} rows)`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('⚠️ MIGRATION REQUIRES MANUAL EXECUTION')
  console.log('=' .repeat(60))
  console.log('\n📋 Please follow these steps:')
  console.log('1. Open: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new')
  console.log('2. Paste SQL from: supabase/migrations/20250111_create_consultation_booking.sql')
  console.log('3. Click RUN (or press Ctrl+Enter)')
  console.log('4. Run: node verify-migration.js')
  
  process.exit(1)
}

// Verify tables were created
console.log('\n🔍 Verifying tables...')

const { createClient } = await import('@supabase/supabase-js')

const supabase = createClient(
  `https://${PROJECT_REF}.supabase.co`,
  SERVICE_ROLE_KEY
)

const tables = [
  'consultations',
  'consultation_types',
  'availability_settings',
  'unavailable_dates'
]

let allSuccess = true

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.log(`❌ Table '${table}': NOT FOUND`)
    allSuccess = false
  } else {
    console.log(`✅ Table '${table}': EXISTS (${count || 0} rows)`)
  }
}

if (allSuccess) {
  // Show consultation types
  console.log('\n📋 Default Consultation Types:')
  const { data: types } = await supabase
    .from('consultation_types')
    .select('*')
    .order('duration')
  
  if (types && types.length > 0) {
    for (const t of types) {
      console.log(`  • ${t.name}: ${t.duration} phút - ${t.price.toLocaleString()}đ`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!')
  console.log('=' .repeat(60))
  console.log('\n📌 Next Steps:')
  console.log('1. Visit: http://localhost:8083/consultation')
  console.log('2. Test booking form')
  console.log('3. Admin panel: http://localhost:8083/admin/consultations')
} else {
  console.log('\n❌ Some tables are missing. Please check the SQL execution.')
}
