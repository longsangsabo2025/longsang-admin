import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n📋 Checking activity_logs schema...\n');

  // Try to fetch one row to see the columns
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Sample row:', data);
    if (data && data.length > 0) {
      console.log('\n📊 Columns:', Object.keys(data[0]));
    } else {
      console.log('\n⚠️ No rows in table yet');
    }
  }
}

checkSchema();
