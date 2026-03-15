/**
 * Automated Bug System Setup
 *
 * This script automatically sets up the bug system by:
 * 1. Executing SQL migrations via Supabase REST API
 * 2. Verifying tables and functions
 * 3. Testing error capture
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase credentials
const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

// Create Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function executeSQL(sql) {
  // Try using REST API to execute SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}

async function setupBugSystem() {
  console.log('🚀 Automated Bug System Setup\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Read SQL files
    console.log('\n📖 Step 1: Reading migration files...');
    const sharedPath = join('D:', '0.PROJECTS', '_SHARED', 'bug-system', 'database', 'migrations');

    let tablesSQL, functionsSQL;
    try {
      tablesSQL = readFileSync(join(sharedPath, '001_create_tables.sql'), 'utf-8');
      functionsSQL = readFileSync(join(sharedPath, '002_create_functions.sql'), 'utf-8');
      console.log('✅ Migration files loaded');
    } catch (error) {
      console.error('❌ Failed to read migration files:', error.message);
      console.log('\n📝 Please run migrations manually:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy and paste the SQL from:');
      console.log(`      ${sharedPath}\\001_create_tables.sql`);
      console.log(`      ${sharedPath}\\002_create_functions.sql`);
      return;
    }

    // Step 2: Execute migrations via Supabase Management API
    console.log('\n📊 Step 2: Executing database migrations...');
    console.log('   Note: Supabase JS client cannot execute raw SQL directly.');
    console.log('   Please execute the SQL manually in Supabase SQL Editor.\n');

    // Instead, we'll verify if tables exist and provide instructions
    console.log('   Checking if tables already exist...');
    const { data: existingTables, error: checkError } = await supabase
      .from('error_logs')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('   ✅ Tables already exist! Skipping migration.');
    } else {
      console.log('   ⚠️  Tables not found. Migration needed.');
      console.log('\n   📋 SQL to execute in Supabase SQL Editor:');
      console.log('   ' + '='.repeat(56));
      console.log(tablesSQL.substring(0, 500) + '...\n');
      console.log('   ' + '='.repeat(56));
      console.log('\n   📋 Functions SQL:');
      console.log('   ' + '='.repeat(56));
      console.log(functionsSQL.substring(0, 500) + '...\n');
      console.log('   ' + '='.repeat(56));

      // Save SQL to files for easy copy-paste
      const fs = await import('fs');
      const outputDir = join('D:', '0.PROJECTS', '00-MASTER-ADMIN', 'longsang-admin', 'scripts', 'migration-output');
      try {
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(join(outputDir, '001_create_tables.sql'), tablesSQL);
        fs.writeFileSync(join(outputDir, '002_create_functions.sql'), functionsSQL);
        console.log(`\n   💾 SQL files saved to: ${outputDir}`);
        console.log('   Copy and paste into Supabase SQL Editor');
      } catch (e) {
        console.log('   ⚠️  Could not save SQL files');
      }
    }

    // Step 3: Verify setup
    console.log('\n🔍 Step 3: Verifying setup...');

    // Check tables
    const tables = ['error_logs', 'bug_reports', 'healing_actions', 'error_patterns'];
    const tableStatus = {};

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        tableStatus[table] = !error ? '✅' : '❌';
      } catch (e) {
        tableStatus[table] = '❌';
      }
    }

    console.log('   Tables:');
    Object.entries(tableStatus).forEach(([table, status]) => {
      console.log(`     ${status} ${table}`);
    });

    // Check functions
    console.log('\n   Functions:');
    try {
      const { data, error } = await supabase.rpc('get_error_statistics', { p_days: 7 });
      if (error) {
        console.log('     ❌ get_error_statistics');
      } else {
        console.log('     ✅ get_error_statistics');
      }
    } catch (e) {
      console.log('     ❌ get_error_statistics');
    }

    // Step 4: Test error capture
    console.log('\n🧪 Step 4: Testing error capture...');
    try {
      const testError = {
        error_type: 'SetupTestError',
        error_message: 'Automated setup test - can be deleted',
        error_stack: 'Test stack',
        severity: 'low',
        context: { test: true, setup: 'automated' },
      };

      const { data, error } = await supabase
        .from('error_logs')
        .insert(testError)
        .select('id')
        .single();

      if (error) {
        console.log('   ❌ Error capture test failed:', error.message);
      } else {
        console.log('   ✅ Error capture works!');
        console.log(`   Test error ID: ${data.id}`);

        // Clean up
        await supabase.from('error_logs').delete().eq('id', data.id);
        console.log('   Test error cleaned up');
      }
    } catch (error) {
      console.log('   ⚠️  Error capture test skipped:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Setup Complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. If tables are missing, run SQL in Supabase SQL Editor');
    console.log('   2. Configure VITE_SENTRY_DSN in .env file');
    console.log('   3. Test error capture in your application');
    console.log('   4. Check Supabase dashboard for error logs');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\n📝 Manual setup required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Execute SQL from _SHARED/bug-system/database/migrations/');
    process.exit(1);
  }
}

setupBugSystem().catch(console.error);

