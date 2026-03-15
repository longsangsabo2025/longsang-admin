const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function deployMigration() {
  const sqlFile = path.join(__dirname, 'supabase', 'migrations', '20241115_web_vitals_metrics.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('🚀 Deploying web_vitals_metrics table...\n');
  console.log('SQL:', sql.substring(0, 200) + '...\n');
  
  try {
    // Execute raw SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('❌ Error deploying migration:');
      console.log(error);
      
      // Try alternative: Create table directly
      console.log('\n🔄 Trying direct table creation...\n');
      const { error: createError } = await supabase
        .from('web_vitals_metrics')
        .select('*')
        .limit(0);
      
      if (createError && createError.code === 'PGRST205') {
        console.log('⚠️  Table does not exist. Creating via schema...');
        console.log('Please run this SQL in Supabase SQL Editor:');
        console.log('\n' + sql + '\n');
      }
    } else {
      console.log('✅ Migration deployed successfully!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('💥 Exception:', err.message);
  }
}

deployMigration();
