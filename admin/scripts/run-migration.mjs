#!/usr/bin/env node
/**
 * Run SQL Migration via Supabase REST API
 * Uses service_role key for admin access
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase credentials
const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL statements to run individually
const sqlStatements = [
  // 1. Create projects table
  `CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '📁',
    color VARCHAR(100) DEFAULT 'from-blue-500 to-indigo-600',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'development', 'paused', 'archived')),
    local_url VARCHAR(500),
    production_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
  )`,

  // 2. Create project_credentials table
  `CREATE TABLE IF NOT EXISTS project_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('api', 'database', 'cloud', 'email', 'payment', 'deployment', 'analytics', 'cdn', 'social', 'other')),
    key_value TEXT NOT NULL,
    key_preview VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    environment VARCHAR(50) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_rotated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}'
  )`,

  // 3. Create project_agents table
  `CREATE TABLE IF NOT EXISTS project_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model VARCHAR(100) NOT NULL,
    provider VARCHAR(50) DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic', 'google', 'openrouter', 'local', 'other')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'development', 'deprecated')),
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    total_runs INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    total_cost_usd DECIMAL(10,4) DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
  )`,

  // 4. Create project_workflows table
  `CREATE TABLE IF NOT EXISTS project_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    n8n_workflow_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'development', 'error')),
    trigger_type VARCHAR(50) DEFAULT 'webhook' CHECK (trigger_type IN ('webhook', 'schedule', 'manual', 'event')),
    webhook_url VARCHAR(500),
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    last_execution_at TIMESTAMPTZ,
    last_execution_status VARCHAR(50),
    average_execution_time_ms INTEGER,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
  )`,

  // 5. Create workflow_executions table
  `CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES project_workflows(id) ON DELETE CASCADE,
    n8n_execution_id VARCHAR(100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    triggered_by VARCHAR(100)
  )`,

  // 6. Create indexes
  `CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`,
  `CREATE INDEX IF NOT EXISTS idx_project_credentials_project_id ON project_credentials(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_credentials_type ON project_credentials(type)`,
  `CREATE INDEX IF NOT EXISTS idx_project_credentials_status ON project_credentials(status)`,
  `CREATE INDEX IF NOT EXISTS idx_project_agents_project_id ON project_agents(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_agents_status ON project_agents(status)`,
  `CREATE INDEX IF NOT EXISTS idx_project_workflows_project_id ON project_workflows(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_project_workflows_status ON project_workflows(status)`,
  `CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status)`,

  // 7. Enable RLS
  `ALTER TABLE projects ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_credentials ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_workflows ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY`,

  // 8. Seed data
  `INSERT INTO projects (slug, name, description, icon, color, status, local_url, production_url, github_url)
   VALUES 
    ('longsang-portfolio', 'Long Sang Portfolio', 'Website portfolio cá nhân với AI integration', '🏠', 'from-blue-500 to-indigo-600', 'active', 'http://localhost:8081', 'https://longsang.com', 'https://github.com/longsangsabo2025/longsang-portfolio'),
    ('ainewbie-web', 'AI Newbie Web', 'Platform học AI cho người mới bắt đầu', '🤖', 'from-purple-500 to-pink-600', 'active', 'http://localhost:5173', 'https://ainewbie.vn', 'https://github.com/longsangsabo2025/ainewbie-web'),
    ('sabo-hub', 'Sabo Hub', 'Hệ sinh thái quản lý doanh nghiệp', '🏢', 'from-green-500 to-emerald-600', 'development', 'http://localhost:3000', NULL, 'https://github.com/longsangsabo2025/sabo-hub'),
    ('vungtau-dream-homes', 'Vũng Tàu Dream Homes', 'Website bất động sản Vũng Tàu', '🏡', 'from-orange-500 to-red-600', 'active', 'http://localhost:5174', 'https://vungtaudreamhomes.com', 'https://github.com/longsangsabo2025/vungtau-dream-homes'),
    ('ai-secretary', 'AI Secretary', 'Trợ lý AI thông minh đa năng', '💼', 'from-cyan-500 to-blue-600', 'development', 'http://localhost:3001', NULL, 'https://github.com/longsangsabo2025/ai-secretary'),
    ('sabo-arena', 'Sabo Arena', 'Gaming và giải trí platform', '🎮', 'from-violet-500 to-purple-600', 'paused', NULL, NULL, 'https://github.com/longsangsabo2025/sabo-arena')
   ON CONFLICT (slug) DO NOTHING`
];

async function runMigration() {
  console.log('🚀 Starting migration...\n');

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const shortSql = sql.substring(0, 60).replace(/\n/g, ' ').trim() + '...';
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Try using raw SQL
        console.log(`⚠️  [${i + 1}/${sqlStatements.length}] ${shortSql}`);
        console.log(`   Note: ${error.message}`);
      } else {
        console.log(`✅ [${i + 1}/${sqlStatements.length}] ${shortSql}`);
      }
    } catch (err) {
      console.log(`⚠️  [${i + 1}/${sqlStatements.length}] ${shortSql}`);
      console.log(`   Error: ${err.message}`);
    }
  }

  console.log('\n✨ Migration script completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Run SQL manually in Supabase Dashboard if needed');
  console.log('2. Regenerate types: npx supabase gen types typescript');
}

// Alternative: Direct test of table creation
async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Try to query projects table
  const { data, error } = await supabase
    .from('projects')
    .select('count')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      console.log('❌ Table "projects" does not exist yet.');
      console.log('\n📋 Please run the SQL migration manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql');
      console.log('2. Copy content from: supabase/migrations/20251125_project_management.sql');
      console.log('3. Run the SQL query\n');
      return false;
    }
    console.log('Error:', error.message);
    return false;
  }
  
  console.log('✅ Connection successful! Table exists.');
  return true;
}

// Run
testConnection().then(exists => {
  if (!exists) {
    console.log('Attempting to create tables via API...');
    runMigration();
  } else {
    console.log('\n🎉 Migration already completed!');
  }
});
