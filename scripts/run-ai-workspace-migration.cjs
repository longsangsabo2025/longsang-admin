/**
 * Run AI Workspace Migration
 * Chạy migration SQL trực tiếp qua Supabase client
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting AI Workspace migration...\n');

  const migrationFile = path.join(__dirname, '../supabase/migrations/20250128_ai_workspace_rag.sql');

  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('📝 Migration file loaded successfully!');
  console.log('⚠️  Note: Running SQL migrations directly requires Supabase CLI or manual execution.');
  console.log('\n📋 To run migration manually:');
  console.log('   1. Go to Supabase Dashboard > SQL Editor');
  console.log('   2. Copy content from: supabase/migrations/20250128_ai_workspace_rag.sql');
  console.log('   3. Paste and execute');
  console.log('\n✅ Or install Supabase CLI: npm install -g supabase');
  console.log('   Then run: supabase db push');

  // Try to check if tables already exist
  console.log('\n🔍 Checking if tables already exist...');

  const tables = ['documents', 'conversations', 'agent_executions', 'response_cache'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(0);
    if (error && error.code === 'PGRST116') {
      console.log(`   ❌ Table '${table}' does not exist`);
    } else if (error) {
      console.log(`   ⚠️  Table '${table}': ${error.message}`);
    } else {
      console.log(`   ✅ Table '${table}' exists`);
    }
  }
}

runMigration().catch(console.error);

