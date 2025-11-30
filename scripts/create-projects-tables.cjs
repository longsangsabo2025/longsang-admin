/**
 * Create projects tables directly
 */

require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function createTables() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔗 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    // 1. Create projects table
    console.log('📝 Creating projects table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        logo_url TEXT,
        color TEXT DEFAULT '#3B82F6',
        website_url TEXT,
        is_active BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✅ projects table created');

    // 2. Create project_social_accounts table
    console.log('📝 Creating project_social_accounts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_social_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        account_id TEXT NOT NULL,
        account_name TEXT NOT NULL,
        account_username TEXT,
        account_avatar TEXT,
        account_type TEXT DEFAULT 'page',
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        credentials_ref UUID,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, platform, account_id)
      )
    `);
    console.log('  ✅ project_social_accounts table created');

    // 3. Create project_posts table
    console.log('📝 Creating project_posts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID,
        content TEXT NOT NULL,
        media_urls TEXT[],
        hashtags TEXT[],
        link_url TEXT,
        platforms TEXT[] NOT NULL,
        status TEXT DEFAULT 'draft',
        scheduled_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        results JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✅ project_posts table created');

    // 4. Create indexes
    console.log('📝 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_psa_project ON project_social_accounts(project_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_psa_platform ON project_social_accounts(platform)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pp_project ON project_posts(project_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pp_status ON project_posts(status)`);
    console.log('  ✅ indexes created');

    console.log('\n✅ All tables created successfully!');

    // Verify
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'project_social_accounts', 'project_posts')
    `);
    console.log('\n📊 Tables in database:');
    for (const row of result.rows) {
      console.log(`  ✅ ${row.table_name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTables();
