/**
 * Check và Create Tables trực tiếp từ Supabase
 * Sử dụng service key để query và tạo tables
 */

import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log('🔍 Checking Tables Structure from Supabase...');
console.log('='.repeat(60));

async function checkTableExists(tableName) {
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('not find the table')) {
        return { exists: false, error: null };
      }
      return { exists: false, error: error.message };
    }
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function getTableStructure(tableName) {
  try {
    // Query information_schema to get table structure
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `
    }).catch(() => {
      // Fallback: try direct query
      return { data: null, error: 'RPC not available' };
    });

    if (error) {
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

async function createTableWithPG(tableName, sql) {
  if (!dbUrl) {
    return { success: false, error: 'DATABASE_URL not found' };
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(sql);
    await client.end();
    return { success: true };
  } catch (error) {
    await client.end().catch(() => {});
    if (error.message.includes('already exists')) {
      return { success: true }; // Table already exists, that's OK
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  // Check if project_workflows exists first
  console.log('🔍 Checking dependencies...\n');
  const workflowsCheck = await checkTableExists('project_workflows');
  const workflowsExist = workflowsCheck.exists;
  console.log(`project_workflows: ${workflowsExist ? '✅ EXISTS' : '❌ NOT FOUND'}\n`);

  const tables = [
    { name: 'ai_suggestions', sql: workflowsExist ? `
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('action', 'workflow', 'optimization', 'alert')),
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        reason TEXT NOT NULL,
        suggested_workflow_id UUID REFERENCES project_workflows(id) ON DELETE SET NULL,
        suggested_action JSONB,
        estimated_impact TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        dismissed_at TIMESTAMP,
        executed_at TIMESTAMP,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
      );
    ` : `
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('action', 'workflow', 'optimization', 'alert')),
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        reason TEXT NOT NULL,
        suggested_workflow_id UUID,
        suggested_action JSONB,
        estimated_impact TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        dismissed_at TIMESTAMP,
        executed_at TIMESTAMP,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
      );
    `},
    { name: 'intelligent_alerts', sql: workflowsExist ? `
      CREATE TABLE IF NOT EXISTS intelligent_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('anomaly', 'threshold', 'pattern', 'opportunity')),
        severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
        message TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT NOW(),
        suggested_workflow_id UUID REFERENCES project_workflows(id) ON DELETE SET NULL,
        auto_resolve BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        metadata JSONB,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
      );
    ` : `
      CREATE TABLE IF NOT EXISTS intelligent_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('anomaly', 'threshold', 'pattern', 'opportunity')),
        severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
        message TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT NOW(),
        suggested_workflow_id UUID,
        auto_resolve BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        metadata JSONB,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
      );
    `},
    { name: 'workflow_metrics', sql: workflowsExist ? `
      CREATE TABLE IF NOT EXISTS workflow_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id UUID NOT NULL REFERENCES project_workflows(id) ON DELETE CASCADE,
        execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
        node_id TEXT,
        execution_time_ms INTEGER,
        success BOOLEAN,
        cost_usd DECIMAL(10,4),
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      );
    ` : `
      CREATE TABLE IF NOT EXISTS workflow_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id UUID NOT NULL,
        execution_id UUID,
        node_id TEXT,
        execution_time_ms INTEGER,
        success BOOLEAN,
        cost_usd DECIMAL(10,4),
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      );
    `}
  ];

  console.log('\n📊 Checking existing tables...\n');

  for (const table of tables) {
    const check = await checkTableExists(table.name);

    if (check.exists) {
      console.log(`✅ ${table.name}: Table exists`);

      // Try to get structure
      const structure = await getTableStructure(table.name);
      if (structure) {
        console.log(`   Columns: ${structure.length}`);
      }
    } else {
      console.log(`❌ ${table.name}: Table does not exist`);

      if (check.error && !check.error.includes('not find')) {
        console.log(`   Error: ${check.error}`);
      } else {
        console.log(`   📝 Creating table...`);

        // Try to create via pg client
        const result = await createTableWithPG(table.name, table.sql);

        if (result.success) {
          console.log(`   ✅ Table created!`);
        } else {
          console.log(`   ⚠️  Could not create: ${result.error}`);
          if (result.error.includes('DATABASE_URL')) {
            console.log(`   💡 Add DATABASE_URL to .env (connection pooler URL)`);
          }
          console.log(`   📋 SQL to run manually:`);
          console.log(`   ${table.sql.trim()}`);
        }
      }
    }
  }

  // Verify again
  console.log('\n🔍 Final Verification...\n');

  let allExist = true;
  for (const table of tables) {
    const check = await checkTableExists(table.name);
    if (check.exists) {
      console.log(`✅ ${table.name}: OK`);
    } else {
      console.log(`❌ ${table.name}: Still missing`);
      allExist = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allExist) {
    console.log('✨ All tables exist!');
    console.log('\n🧪 Testing endpoints...');

    // Test endpoints
    const API_URL = `http://localhost:${process.env.API_PORT || 3001}`;

    try {
      const response = await fetch(`${API_URL}/api/ai/suggestions`);
      if (response.ok) {
        console.log('✅ /api/ai/suggestions: OK');
      } else {
        const data = await response.json().catch(() => ({}));
        console.log(`❌ /api/ai/suggestions: ${response.status} - ${data.error || 'Error'}`);
      }
    } catch (e) {
      console.log(`⚠️  /api/ai/suggestions: Server not running`);
    }

    try {
      const response = await fetch(`${API_URL}/api/ai/alerts`);
      if (response.ok) {
        console.log('✅ /api/ai/alerts: OK');
      } else {
        const data = await response.json().catch(() => ({}));
        console.log(`❌ /api/ai/alerts: ${response.status} - ${data.error || 'Error'}`);
      }
    } catch (e) {
      console.log(`⚠️  /api/ai/alerts: Server not running`);
    }
  } else {
    console.log('⚠️  Some tables are missing.');
    console.log('   Please run the SQL manually in Supabase SQL Editor.');
    console.log('   File: create-ai-tables-direct.sql');
  }
}

main().catch(console.error);

