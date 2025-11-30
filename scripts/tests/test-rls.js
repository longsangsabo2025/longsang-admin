import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedTest() {
  console.log('🔐 Testing with ANON key...\n');
  
  // Test 1: Simple count
  console.log('Test 1: Count all rows');
  const { count, error: countError } = await supabase
    .from('ai_agents')
    .select('*', { count: 'exact', head: true });
  
  console.log('Result:', { count, error: countError });
  
  // Test 2: Select all
  console.log('\nTest 2: Select all agents');
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*');
  
  console.log('Result:', { 
    success: !error, 
    count: data?.length || 0,
    error: error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : null,
    data: data ? data.map(a => ({ id: a.id, name: a.name, type: a.type })) : null
  });
  
  // Test 3: Check RLS
  if (error && error.code === 'PGRST301') {
    console.log('\n❌ RLS POLICY ERROR: Row Level Security is blocking access!');
    console.log('   Solution: Run this SQL in Supabase SQL Editor:\n');
    console.log('   ALTER TABLE ai_agents DISABLE ROW LEVEL SECURITY;');
  }
}

detailedTest();
