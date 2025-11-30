/**
 * Update project_social_links table:
 * 1. Disable RLS (admin không cần)
 * 2. Add credential_id column để liên kết với API keys của từng platform
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function updateSocialLinksTable() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Disable RLS
    console.log('🔓 Disabling RLS for project_social_links...');
    await client.query(`ALTER TABLE project_social_links DISABLE ROW LEVEL SECURITY`);
    console.log('✅ RLS disabled\n');

    // 2. Drop existing policies if any
    console.log('🧹 Dropping existing RLS policies...');
    try {
      await client.query(`DROP POLICY IF EXISTS "Enable all access for authenticated users" ON project_social_links`);
      await client.query(`DROP POLICY IF EXISTS "Enable read access for all users" ON project_social_links`);
      await client.query(`DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON project_social_links`);
      await client.query(`DROP POLICY IF EXISTS "Enable update for authenticated users only" ON project_social_links`);
      await client.query(`DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON project_social_links`);
    } catch (e) {
      // Ignore errors if policies don't exist
    }
    console.log('✅ Policies cleaned\n');

    // 3. Add credential_id column if not exists
    console.log('📝 Adding credential_id column...');
    await client.query(`
      ALTER TABLE project_social_links 
      ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES project_credentials(id) ON DELETE SET NULL
    `);
    console.log('✅ credential_id column added\n');

    // 4. Add more useful columns
    console.log('📝 Adding additional columns...');
    
    // API endpoint for posting
    await client.query(`
      ALTER TABLE project_social_links 
      ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(500)
    `);
    
    // Page/Channel ID (for Facebook Page, YouTube Channel, etc.)
    await client.query(`
      ALTER TABLE project_social_links 
      ADD COLUMN IF NOT EXISTS page_id VARCHAR(255)
    `);
    
    // Access token expiry
    await client.query(`
      ALTER TABLE project_social_links 
      ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ
    `);
    
    // Last sync time
    await client.query(`
      ALTER TABLE project_social_links 
      ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ
    `);
    
    // Auto post enabled
    await client.query(`
      ALTER TABLE project_social_links 
      ADD COLUMN IF NOT EXISTS auto_post_enabled BOOLEAN DEFAULT false
    `);
    
    console.log('✅ Additional columns added\n');

    // 5. Show final schema
    console.log('📋 Final table schema:');
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'project_social_links' 
      ORDER BY ordinal_position
    `);
    console.table(schema.rows);

    console.log('\n✨ Table updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

updateSocialLinksTable();
