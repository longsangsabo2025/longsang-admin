// Direct database operations with service key
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  console.log('📊 CHECKING SOCIAL_MEDIA_CREDENTIALS TABLE\n');
  console.log('=' .repeat(60));
  
  // 1. Check if table exists and get current data
  const { data, error } = await supabase
    .from('social_media_credentials')
    .select('*');
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('\nTable might not exist or have issues.');
    return;
  }
  
  console.log(`\n📋 Current records: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\nExisting credentials:');
    for (const row of data) {
      console.log(`  - ${row.platform}: ${row.account_info?.name || 'No name'} (active: ${row.is_active})`);
    }
  }
  
  // 2. Try to insert threads directly (bypassing RLS with service role)
  console.log('\n🧪 Testing threads platform insert...');
  
  const testInsert = await supabase
    .from('social_media_credentials')
    .insert({
      user_id: '89917901-cf15-45c4-a7ad-8c4c9513347e',
      platform: 'threads',
      credentials: { test: 'checking_constraint' },
      is_active: false
    });
  
  if (testInsert.error) {
    console.log('❌ Threads insert failed:', testInsert.error.message);
    
    if (testInsert.error.message.includes('check constraint')) {
      console.log('\n⚠️  Need to update platform constraint!');
      console.log('   Will try alternative approach...');
    }
  } else {
    console.log('✅ Threads platform is supported!');
    
    // Clean up test
    await supabase
      .from('social_media_credentials')
      .delete()
      .match({ platform: 'threads', is_active: false });
    
    console.log('   (test record cleaned up)');
  }
  
  // 3. Show table structure info
  console.log('\n📊 Table info:');
  console.log('   Name: social_media_credentials');
  console.log('   Columns: id, user_id, platform, credentials, settings, account_info, is_active, last_tested_at, last_error, created_at, updated_at');
}

checkTable().catch(console.error);
