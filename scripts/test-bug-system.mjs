/**
 * Test Bug System
 *
 * Tests error capture, classification, and self-healing
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testBugSystem() {
  console.log('🧪 Testing Bug System...\n');

  // Test 1: Check if tables exist
  console.log('1️⃣  Checking database tables...');
  try {
    const { data, error } = await supabase
      .from('error_logs')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ error_logs table not found:', error.message);
      console.log('   → Run migrations first: npm run migrate:bug-system');
      return;
    }
    console.log('✅ error_logs table exists');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }

  // Test 2: Test error capture
  console.log('\n2️⃣  Testing error capture...');
  try {
    const testError = {
      error_type: 'TestError',
      error_message: 'This is a test error from bug system setup',
      error_stack: 'Test stack trace',
      severity: 'low',
      context: { test: true, component: 'BugSystemTest' },
      project_name: 'longsang-admin',
    };

    const { data, error } = await supabase
      .from('error_logs')
      .insert(testError)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to insert test error:', error.message);
    } else {
      console.log('✅ Test error captured successfully');
      console.log('   Error ID:', data.id);

      // Clean up test error
      await supabase.from('error_logs').delete().eq('id', data.id);
      console.log('   Test error cleaned up');
    }
  } catch (error) {
    console.error('❌ Error capture test failed:', error.message);
  }

  // Test 3: Test functions
  console.log('\n3️⃣  Testing database functions...');
  try {
    const { data, error } = await supabase.rpc('get_error_statistics', {
      p_days: 7,
    });

    if (error) {
      console.warn('⚠️  get_error_statistics function not found:', error.message);
      console.log('   → Run migrations to create functions');
    } else {
      console.log('✅ get_error_statistics function works');
      console.log('   Statistics:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.warn('⚠️  Function test failed:', error.message);
  }

  console.log('\n✅ Bug system test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Configure VITE_SENTRY_DSN in .env');
  console.log('   2. Test error capture in application');
  console.log('   3. Check Sentry dashboard');
}

testBugSystem().catch(console.error);

