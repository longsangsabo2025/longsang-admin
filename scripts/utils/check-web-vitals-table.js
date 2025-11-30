const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTable() {
  console.log('🔍 Checking web_vitals_metrics table...\n');
  
  const { data, error } = await supabase
    .from('web_vitals_metrics')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Table NOT found or error:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
    console.log('Error hint:', error.hint);
  } else {
    console.log('✅ Table EXISTS!');
    console.log('Data:', data);
  }
}

checkTable();
