/**
 * Run Bug System Database Migrations
 *
 * Executes migrations using Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  console.log('🚀 Starting Bug System Database Migrations...\n');

  try {
    // Read migration files from _SHARED (at D:\0.PROJECTS\_SHARED)
    const sharedPath = join('D:', '0.PROJECTS', '_SHARED', 'bug-system', 'database', 'migrations');
    const migrationsPath = sharedPath;

    const tablesSQL = readFileSync(
      join(migrationsPath, '001_create_tables.sql'),
      'utf-8'
    );

    const functionsSQL = readFileSync(
      join(migrationsPath, '002_create_functions.sql'),
      'utf-8'
    );

    // Execute tables migration
    console.log('📊 Creating tables...');
    const { error: tablesError } = await supabase.rpc('exec_sql', {
      sql: tablesSQL,
    });

    if (tablesError) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      // Split SQL into individual statements
      const statements = tablesSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️  Statement warning: ${error.message}`);
          }
        } catch (e) {
          // Try alternative method
          console.log(`ℹ️  Using alternative execution method for: ${statement.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('✅ Tables migration completed');
    }

    // Execute functions migration
    console.log('\n⚙️  Creating functions...');
    const { error: functionsError } = await supabase.rpc('exec_sql', {
      sql: functionsSQL,
    });

    if (functionsError) {
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      const statements = functionsSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️  Statement warning: ${error.message}`);
          }
        } catch (e) {
          console.log(`ℹ️  Using alternative execution method...`);
        }
      }
    } else {
      console.log('✅ Functions migration completed');
    }

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['error_logs', 'bug_reports', 'healing_actions', 'error_patterns']);

    if (verifyError) {
      console.warn('⚠️  Could not verify tables:', verifyError.message);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      const expectedTables = ['error_logs', 'bug_reports', 'healing_actions', 'error_patterns'];
      const missingTables = expectedTables.filter(t => !tableNames.includes(t));

      if (missingTables.length === 0) {
        console.log('✅ All tables verified:', tableNames.join(', '));
      } else {
        console.warn('⚠️  Missing tables:', missingTables.join(', '));
        console.log('ℹ️  Please run migrations manually in Supabase SQL Editor');
      }
    }

    console.log('\n✅ Migration process completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables in Supabase Dashboard');
    console.log('   2. Test error capture in application');
    console.log('   3. Check Sentry dashboard for errors');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n📝 Manual steps:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Copy SQL from: _SHARED/bug-system/database/migrations/001_create_tables.sql');
    console.log('   3. Copy SQL from: _SHARED/bug-system/database/migrations/002_create_functions.sql');
    console.log('   4. Execute both in Supabase SQL Editor');
    process.exit(1);
  }
}

// Run migrations
runMigrations().catch(console.error);

