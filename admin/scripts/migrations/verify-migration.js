import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('🔍 Verifying Consultation Booking Migration...')
console.log('=' .repeat(60))

const tables = [
  'consultations',
  'consultation_types', 
  'availability_settings',
  'unavailable_dates'
]

let allTablesExist = true

for (const table of tables) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Table '${table}': NOT FOUND - ${error.message}`)
      allTablesExist = false
    } else {
      console.log(`✅ Table '${table}': EXISTS (${count || 0} rows)`)
    }
  } catch (err) {
    console.log(`❌ Table '${table}': ERROR - ${err.message}`)
    allTablesExist = false
  }
}

if (allTablesExist) {
  console.log('\n📋 Default Consultation Types:')
  const { data: types, error } = await supabase
    .from('consultation_types')
    .select('*')
    .order('duration_minutes')
  
  if (error) {
    console.log('❌ Could not load types:', error.message)
  } else if (types && types.length > 0) {
    for (const t of types) {
      const price = t.price ? `${t.price.toLocaleString()}đ` : 'Miễn phí'
      console.log(`  • ${t.name}: ${t.duration_minutes} phút - ${price}`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('🎉 MIGRATION SUCCESSFUL!')
  console.log('=' .repeat(60))
  console.log('\n📌 Next Steps:')
  console.log('1. Visit: http://localhost:8083/consultation')
  console.log('2. Test booking form')
  console.log('3. Admin: http://localhost:8083/admin/consultations')
} else {
  console.log('\n' + '=' .repeat(60))
  console.log('❌ MIGRATION INCOMPLETE')
  console.log('=' .repeat(60))
  console.log('\nPlease run the SQL in Supabase SQL Editor.')
}
