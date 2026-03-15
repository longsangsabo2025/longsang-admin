/**
 * PROJECT COMMAND CENTER - Database Schema
 * =========================================
 * Thiết kế schema để quản lý TẤT CẢ thông tin của từng project
 * 
 * Mỗi project sẽ có:
 * 1. Basic Info - Thông tin cơ bản
 * 2. Credentials - API keys, passwords
 * 3. Social Links - Tất cả links social media
 * 4. Domains & URLs - Domains, hosting info
 * 5. AI Agents - Các AI agents được sử dụng
 * 6. Workflows - n8n workflows
 * 7. Integrations - Third-party integrations
 * 8. Contacts - Team members, clients
 * 9. Notes & Docs - Ghi chú, tài liệu
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const migrations = [
  // ============================================
  // 1. ENHANCED PROJECTS TABLE
  // ============================================
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS tagline VARCHAR(255)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(500)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack TEXT[]`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS features TEXT[]`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_date DATE`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT`,

  // ============================================
  // 2. PROJECT SOCIAL LINKS
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    username VARCHAR(100),
    follower_count INTEGER,
    is_verified BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // 3. PROJECT DOMAINS
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    domain_type VARCHAR(50) DEFAULT 'production',
    registrar VARCHAR(100),
    expires_at DATE,
    ssl_expires_at DATE,
    dns_provider VARCHAR(100),
    hosting_provider VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // 4. PROJECT INTEGRATIONS
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // 5. PROJECT CONTACTS
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    telegram VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // 6. PROJECT ANALYTICS CONNECTIONS
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    property_id VARCHAR(100),
    tracking_id VARCHAR(100),
    api_credentials_id UUID REFERENCES credentials_vault(id),
    is_active BOOLEAN DEFAULT true,
    last_data_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // 7. PROJECT DOCUMENTS / NOTES
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'note',
    content TEXT,
    url VARCHAR(500),
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // 8. PROJECT ENVIRONMENTS
  // ============================================
  `CREATE TABLE IF NOT EXISTS project_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    env_name VARCHAR(50) NOT NULL,
    url VARCHAR(500),
    branch VARCHAR(100),
    auto_deploy BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    last_deploy_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ============================================
  // INDEXES
  // ============================================
  `CREATE INDEX IF NOT EXISTS idx_project_social_links_project ON project_social_links(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_domains_project ON project_domains(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_integrations_project ON project_integrations(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON project_contacts(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_analytics_project ON project_analytics(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_environments_project ON project_environments(project_id)`,

  // ============================================
  // ENABLE RLS
  // ============================================
  `ALTER TABLE project_social_links ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_domains ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_integrations ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_analytics ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_environments ENABLE ROW LEVEL SECURITY`,
];

async function runMigrations() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🚀 Running migrations for Project Command Center...\n');

    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const shortSql = sql.substring(0, 60).replace(/\n/g, ' ').trim();
      
      try {
        await client.query(sql);
        console.log(`✅ [${i + 1}/${migrations.length}] ${shortSql}...`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  [${i + 1}/${migrations.length}] Already exists`);
        } else {
          console.log(`❌ [${i + 1}/${migrations.length}] Error: ${err.message}`);
        }
      }
    }

    console.log('\n🎉 Project Command Center schema created!');
    console.log('\n📋 Tables created:');
    console.log('   - projects (enhanced)');
    console.log('   - project_social_links');
    console.log('   - project_domains');
    console.log('   - project_integrations');
    console.log('   - project_contacts');
    console.log('   - project_analytics');
    console.log('   - project_documents');
    console.log('   - project_environments');
    console.log('   - credentials_vault (existing)');

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
