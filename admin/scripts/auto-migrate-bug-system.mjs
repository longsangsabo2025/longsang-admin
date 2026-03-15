/**
 * Auto-Migrate Bug System Database
 *
 * Executes SQL migrations directly using PostgreSQL connection
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

// Connection string from user
const CONNECTION_STRING = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('🚀 Auto-Migrating Bug System Database\n');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read SQL files
    console.log('📖 Reading migration files...');
    const sharedPath = join('D:', '0.PROJECTS', '_SHARED', 'bug-system', 'database', 'migrations');
    const outputPath = join('D:', '0.PROJECTS', '00-MASTER-ADMIN', 'longsang-admin', 'scripts', 'migration-output');

    let tablesSQL, functionsSQL;

    try {
      tablesSQL = readFileSync(join(sharedPath, '001_create_tables.sql'), 'utf-8');
      functionsSQL = readFileSync(join(sharedPath, '002_create_functions.sql'), 'utf-8');
    } catch (error) {
      // Try output path
      tablesSQL = readFileSync(join(outputPath, '001_create_tables.sql'), 'utf-8');
      functionsSQL = readFileSync(join(outputPath, '002_create_functions.sql'), 'utf-8');
    }

    console.log('✅ SQL files loaded\n');

    // Execute tables migration
    console.log('📊 Creating tables...');
    try {
      await client.query(tablesSQL);
      console.log('✅ Tables created successfully!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Tables already exist (skipping)\n');
      } else {
        throw error;
      }
    }

    // Execute functions migration
    console.log('⚙️  Creating functions...');
    try {
      await client.query(functionsSQL);
      console.log('✅ Functions created successfully!\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Functions already exist (skipping)\n');
      } else {
        throw error;
      }
    }

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = ['error_logs', 'bug_reports', 'healing_actions', 'error_patterns'];
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    `, [tables]);

    const existingTables = rows.map(r => r.table_name);
    tables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} (missing)`);
      }
    });

    // Verify functions
    console.log('\n🔍 Verifying functions...');
    const functions = ['classify_error', 'get_error_statistics', 'detect_error_patterns', 'get_healing_statistics', 'create_or_update_bug_report'];
    const { rows: funcRows } = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = ANY($1::text[])
    `, [functions]);

    const existingFunctions = funcRows.map(r => r.routine_name);
    functions.forEach(func => {
      if (existingFunctions.includes(func)) {
        console.log(`   ✅ ${func}`);
      } else {
        console.log(`   ❌ ${func} (missing)`);
      }
    });

    // Test error capture
    console.log('\n🧪 Testing error capture...');
    try {
      const { rows: testRows } = await client.query(`
        INSERT INTO error_logs (error_type, error_message, error_stack, severity, context)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        'SetupTestError',
        'Automated setup test - can be deleted',
        'Test stack',
        'low',
        JSON.stringify({ test: true, setup: 'automated' })
      ]);

      console.log('   ✅ Error capture works!');
      console.log(`   Test error ID: ${testRows[0].id}`);

      // Clean up
      await client.query('DELETE FROM error_logs WHERE id = $1', [testRows[0].id]);
      console.log('   Test error cleaned up');
    } catch (error) {
      console.log('   ⚠️  Error capture test failed:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Configure VITE_SENTRY_DSN in .env file');
    console.log('   2. Test error capture in your application');
    console.log('   3. Check Supabase dashboard for error logs');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📝 Alternative: Run SQL manually in Supabase SQL Editor');
    console.log('   URL: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);

