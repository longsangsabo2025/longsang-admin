/**
 * Create Credentials Vault Table
 * Stores all API keys, passwords, and secrets securely
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const migrations = [
  // Main credentials vault table
  `CREATE TABLE IF NOT EXISTS credentials_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Categorization
    category VARCHAR(50) NOT NULL CHECK (category IN (
      'supabase', 'database', 'ai', 'google', 'email', 
      'payment', 'hosting', 'social', 'analytics', 'n8n', 'other'
    )),
    
    -- Project association (optional - null means global/shared)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Credential info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- The actual credentials (encrypted at rest by Supabase)
    credential_type VARCHAR(50) NOT NULL CHECK (credential_type IN (
      'api_key', 'password', 'token', 'secret', 'connection_string', 
      'oauth', 'service_account', 'certificate', 'other'
    )),
    credential_value TEXT NOT NULL,
    credential_preview VARCHAR(50), -- e.g., "sk-proj-xxx...xxx"
    
    -- Additional metadata
    environment VARCHAR(50) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production', 'all')),
    provider VARCHAR(100), -- e.g., "OpenAI", "Supabase", "Google Cloud"
    
    -- URLs and docs
    dashboard_url VARCHAR(500), -- Link to provider dashboard
    docs_url VARCHAR(500), -- Link to documentation
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked', 'rotating')),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_rotated_at TIMESTAMPTZ,
    rotation_reminder_days INTEGER DEFAULT 90,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Tags and notes
    tags TEXT[] DEFAULT '{}',
    notes TEXT
  )`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_credentials_vault_category ON credentials_vault(category)`,
  `CREATE INDEX IF NOT EXISTS idx_credentials_vault_project_id ON credentials_vault(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_credentials_vault_status ON credentials_vault(status)`,
  `CREATE INDEX IF NOT EXISTS idx_credentials_vault_provider ON credentials_vault(provider)`,

  // Enable RLS
  `ALTER TABLE credentials_vault ENABLE ROW LEVEL SECURITY`,

  // RLS Policy - Only admin can access
  `DO $$ 
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_policies WHERE tablename = 'credentials_vault' AND policyname = 'Admin full access to vault'
     ) THEN
       CREATE POLICY "Admin full access to vault" ON credentials_vault
         FOR ALL USING (
           EXISTS (
             SELECT 1 FROM auth.users
             WHERE auth.uid() = id 
             AND raw_user_meta_data->>'role' = 'admin'
           )
         );
     END IF;
   END $$`,

  // Trigger for updated_at
  `CREATE OR REPLACE FUNCTION update_vault_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ language 'plpgsql'`,

  `DROP TRIGGER IF EXISTS update_credentials_vault_updated_at ON credentials_vault`,
  
  `CREATE TRIGGER update_credentials_vault_updated_at
     BEFORE UPDATE ON credentials_vault
     FOR EACH ROW EXECUTE FUNCTION update_vault_updated_at()`,
];

async function runMigrations() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const shortSql = sql.substring(0, 70).replace(/\n/g, ' ').trim() + '...';
      
      try {
        await client.query(sql);
        console.log(`✅ [${i + 1}/${migrations.length}] ${shortSql}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  [${i + 1}/${migrations.length}] Already exists`);
        } else {
          console.log(`❌ [${i + 1}/${migrations.length}] Error: ${err.message}`);
        }
      }
    }
    
    console.log('\n🎉 Credentials Vault table created!');
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
