// Run SQL directly via transaction pooler
const { Client } = require('pg');
require('dotenv').config();

async function runSQL() {
  console.log('🔧 Connecting to PostgreSQL via transaction pooler...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Drop old constraint and add new one with threads
    console.log('📝 Updating platform constraint...');
    
    await client.query(`
      ALTER TABLE social_media_credentials 
      DROP CONSTRAINT IF EXISTS social_media_credentials_platform_check
    `);
    console.log('   ✓ Dropped old constraint');
    
    await client.query(`
      ALTER TABLE social_media_credentials 
      ADD CONSTRAINT social_media_credentials_platform_check 
      CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'telegram', 'discord', 'threads'))
    `);
    console.log('   ✓ Added new constraint with threads');
    
    // Now import threads
    console.log('\n🧵 Importing Threads credentials...');
    
    const threadsResult = await client.query(`
      INSERT INTO social_media_credentials (user_id, platform, credentials, account_info, settings, is_active, last_tested_at, updated_at)
      VALUES (
        '89917901-cf15-45c4-a7ad-8c4c9513347e',
        'threads',
        $1::jsonb,
        $2::jsonb,
        $3::jsonb,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        credentials = EXCLUDED.credentials,
        account_info = EXCLUDED.account_info,
        settings = EXCLUDED.settings,
        is_active = true,
        updated_at = NOW()
      RETURNING id, platform, account_info
    `, [
      JSON.stringify({
        accessToken: process.env.THREADS_ACCESS_TOKEN,
        userId: process.env.THREADS_USER_ID,
        appId: process.env.THREADS_APP_ID
      }),
      JSON.stringify({
        name: 'Vũng Tàu',
        username: '@baddie.4296',
        id: process.env.THREADS_USER_ID,
        profileUrl: 'https://threads.net/@baddie.4296'
      }),
      JSON.stringify({
        tokenExpiry: '60 days',
        connectedAt: '2025-11-26'
      })
    ]);
    
    console.log('✅ Threads imported:', threadsResult.rows[0].account_info.username);
    
    // List all credentials
    console.log('\n📋 All stored credentials:');
    console.log('─'.repeat(60));
    
    const allResult = await client.query(`
      SELECT platform, account_info, is_active 
      FROM social_media_credentials 
      WHERE user_id = '89917901-cf15-45c4-a7ad-8c4c9513347e'
      ORDER BY platform
    `);
    
    for (const row of allResult.rows) {
      const name = row.account_info?.name || row.account_info?.username || 'Connected';
      const status = row.is_active ? '✅' : '❌';
      console.log(`${status} ${row.platform.padEnd(12)} ${name}`);
    }
    
    console.log('─'.repeat(60));
    console.log(`🎉 Total: ${allResult.rows.length} platforms connected!`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

runSQL();
