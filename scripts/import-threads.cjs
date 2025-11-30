// Import Threads credentials (run AFTER updating constraint)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_USER_ID = '89917901-cf15-45c4-a7ad-8c4c9513347e';

async function importThreads() {
  console.log('🧵 Importing Threads credentials...\n');
  
  const { data, error } = await supabase
    .from('social_media_credentials')
    .upsert({
      user_id: ADMIN_USER_ID,
      platform: 'threads',
      credentials: {
        accessToken: process.env.THREADS_ACCESS_TOKEN,
        userId: process.env.THREADS_USER_ID,
        appId: process.env.THREADS_APP_ID,
      },
      account_info: {
        name: 'Vũng Tàu',
        username: '@baddie.4296',
        id: process.env.THREADS_USER_ID,
        profileUrl: 'https://threads.net/@baddie.4296'
      },
      settings: {
        tokenExpiry: '60 days',
        connectedAt: '2025-11-26'
      },
      is_active: true,
      last_tested_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,platform' })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Failed:', error.message);
    
    if (error.message.includes('check constraint')) {
      console.log('\n⚠️  Run this SQL in Supabase Dashboard first:');
      console.log('═'.repeat(50));
      console.log(`
ALTER TABLE social_media_credentials 
DROP CONSTRAINT IF EXISTS social_media_credentials_platform_check;

ALTER TABLE social_media_credentials 
ADD CONSTRAINT social_media_credentials_platform_check 
CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'telegram', 'discord', 'threads'));
      `);
    }
    return;
  }
  
  console.log('✅ Threads imported successfully!');
  console.log('   Account: @baddie.4296');
  console.log('   ID:', data.id);
  
  // Show all credentials
  console.log('\n📋 All stored credentials:');
  const { data: all } = await supabase
    .from('social_media_credentials')
    .select('platform, account_info, is_active')
    .eq('user_id', ADMIN_USER_ID)
    .order('platform');
  
  console.log('─'.repeat(50));
  for (const row of all || []) {
    const name = row.account_info?.name || row.account_info?.username || 'Connected';
    console.log(`${row.is_active ? '✅' : '❌'} ${row.platform.padEnd(12)} ${name}`);
  }
  console.log('─'.repeat(50));
  console.log(`Total: ${all?.length || 0} platforms connected`);
}

importThreads().catch(console.error);
