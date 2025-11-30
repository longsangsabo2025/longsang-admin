import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  // Test agents table
  const { data: agents, error } = await supabase
    .from('ai_agents')
    .select('id, name, type, status')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log(`✅ Connected! Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.type})`);
    });
  }
}

testConnection();
