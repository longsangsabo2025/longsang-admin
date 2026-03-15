// Run migration to add threads platform
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔄 Running migration to add threads platform...\n');
  
  // Try to insert a test record with threads platform
  // If constraint blocks it, we need to run the migration via Supabase Dashboard
  
  const testResult = await supabase
    .from('social_media_credentials')
    .insert({
      user_id: '89917901-cf15-45c4-a7ad-8c4c9513347e',
      platform: 'threads',
      credentials: { test: true },
      is_active: false
    })
    .select();
  
  if (testResult.error) {
    if (testResult.error.message.includes('violates check constraint')) {
      console.log('⚠️  Threads platform not yet in constraint.');
      console.log('\n📝 Please run this SQL in Supabase Dashboard (SQL Editor):');
      console.log('═'.repeat(60));
      console.log(`
ALTER TABLE social_media_credentials 
DROP CONSTRAINT IF EXISTS social_media_credentials_platform_check;

ALTER TABLE social_media_credentials 
ADD CONSTRAINT social_media_credentials_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'telegram', 'discord', 'threads'));
      `);
      console.log('═'.repeat(60));
      console.log('\n🔗 Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql');
      return false;
    }
    console.log('Error:', testResult.error.message);
    return false;
  }
  
  // Clean up test record
  await supabase
    .from('social_media_credentials')
    .delete()
    .eq('platform', 'threads')
    .eq('credentials->>test', 'true');
  
  console.log('✅ Threads platform is supported!');
  return true;
}

runMigration();
