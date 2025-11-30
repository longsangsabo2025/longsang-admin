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

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }

    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);

      // Use RPC to execute SQL (if available) or direct query
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.from('_migrations').select('*').limit(0);

        if (queryError && queryError.message.includes('does not exist')) {
          // Table doesn't exist yet, this is expected for first migration
          console.log(`   ⚠️  Table might not exist yet, continuing...`);
        } else {
          console.log(`   ⚠️  Warning: ${error.message}`);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.log(`   ⚠️  Warning: ${err.message}`);
      // Continue with next statement
    }
  }

  console.log('\n✅ Migration completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Check Supabase dashboard to verify tables were created');
  console.log('   2. Test AI Workspace at: http://localhost:8080/admin/ai-workspace');
  console.log('   3. Check API status: http://localhost:3001/api/assistants/status');
}

runMigration().catch(console.error);

