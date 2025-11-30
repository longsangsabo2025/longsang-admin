import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'

console.log('🚀 Consultation Booking Migration')
console.log('=' .repeat(60))

// Read migration SQL
const migrationPath = join(__dirname, 'supabase', 'migrations', '20250111_create_consultation_booking.sql')
const sql = readFileSync(migrationPath, 'utf-8')

console.log(`📄 Loaded ${sql.length} characters from migration file`)

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n📡 Executing SQL via Supabase...')

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📝 Found ${statements.length} SQL statements`)

// Execute each statement
let successCount = 0
let errorCount = 0

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';'
  
  // Skip comments
  if (statement.trim().startsWith('--')) continue
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
    
    if (error) {
      console.log(`❌ Statement ${i + 1} failed:`, error.message)
      errorCount++
    } else {
      console.log(`✅ Statement ${i + 1} executed`)
      successCount++
    }
  } catch (err) {
    console.log(`⚠️ Statement ${i + 1} error:`, err.message)
    errorCount++
  }
}

console.log('\n' + '=' .repeat(60))
console.log(`✅ Success: ${successCount} statements`)
console.log(`❌ Failed: ${errorCount} statements`)

// Verify tables
console.log('\n🔍 Verifying tables...')

const tables = [
  'consultations',
  'consultation_types', 
  'availability_settings',
  'unavailable_dates'
]

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Table '${table}': NOT FOUND`)
    } else {
      console.log(`✅ Table '${table}': EXISTS`)
    }
  } catch (err) {
    console.log(`❌ Table '${table}': ERROR - ${err.message}`)
  }
}

// Show consultation types
console.log('\n📋 Consultation Types:')
const { data: types, error: typesError } = await supabase
  .from('consultation_types')
  .select('*')
  .order('duration')

if (typesError) {
  console.log('❌ Could not load consultation types:', typesError.message)
} else if (types && types.length > 0) {
  types.forEach(t => {
    console.log(`  • ${t.name}: ${t.duration} phút - ${t.price.toLocaleString()}đ`)
  })
} else {
  console.log('  (No data found)')
}

console.log('\n' + '=' .repeat(60))
console.log('🎉 MIGRATION COMPLETED!')
console.log('=' .repeat(60))
console.log('\n📌 Next Steps:')
console.log('1. Visit: http://localhost:8083/consultation')
console.log('2. Test booking form')
console.log('3. Admin panel: http://localhost:8083/admin/consultations')
