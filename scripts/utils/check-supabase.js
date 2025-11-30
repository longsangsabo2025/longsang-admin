import fetch from 'node-fetch';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const tables = ['ai_agents', 'automation_triggers', 'workflows', 'activity_logs', 'content_queue'];

async function checkTables() {
  console.log('🔍 Checking Supabase automation tables...\n');
  
  for (const table of tables) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });
      
      const contentRange = res.headers.get('content-range');
      const count = contentRange ? contentRange.split('/')[1] : '0';
      
      if (res.status === 200) {
        console.log(`✅ ${table.padEnd(25)} EXISTS (${count} rows)`);
      } else {
        console.log(`❌ ${table.padEnd(25)} ERROR ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ ${table.padEnd(25)} ERROR: ${e.message}`);
    }
  }
  
  console.log('\n✅ Check complete!');
}

checkTables();
