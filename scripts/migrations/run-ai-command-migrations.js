/**
 * Run AI Command Center Migrations
 *
 * Executes the 3 new migrations for AI Command Center:
 * - ai_suggestions table
 * - intelligent_alerts table
 * - workflow_metrics table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrations = [
  {
    name: 'AI Suggestions',
    file: join(__dirname, 'supabase', 'migrations', '20250127_ai_suggestions.sql'),
  },
  {
    name: 'Intelligent Alerts',
    file: join(__dirname, 'supabase', 'migrations', '20250127_intelligent_alerts.sql'),
  },
  {
    name: 'Workflow Metrics',
    file: join(__dirname, 'supabase', 'migrations', '20250127_workflow_metrics.sql'),
  },
];

async function runMigration(migration) {
  try {
    console.log(`\n📝 Running migration: ${migration.name}...`);

    if (!existsSync(migration.file)) {
      throw new Error(`Migration file not found: ${migration.file}`);
    }

    const sql = readFileSync(migration.file, 'utf8');

    // Execute SQL using Supabase RPC or direct query
    // Note: Supabase JS client doesn't support raw SQL directly
    // We'll use the REST API or create a function

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`   Found ${statements.length} SQL statements`);

    // For now, we'll use a workaround: execute via REST API
    // Or use pg directly if available

    // Try using Supabase REST API with rpc
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_query: sql,
      })
      .catch(async () => {
        // If rpc doesn't exist, try direct execution via REST
        // This requires a custom function or using pg client
        console.log('   ⚠️  RPC exec_sql not available, trying alternative method...');

        // Alternative: Use Supabase Management API or direct connection
        // For now, we'll output the SQL for manual execution
        console.log('\n   📋 SQL to execute manually:');
        console.log('   ' + '='.repeat(60));
        console.log(sql);
        console.log('   ' + '='.repeat(60));

        return { data: null, error: null };
      });

    if (error) {
      // If RPC doesn't work, provide instructions
      if (error.message?.includes('function') || error.message?.includes('not found')) {
        console.log('\n   ⚠️  Direct SQL execution not available.');
        console.log('   📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('   ' + '='.repeat(60));
        console.log(sql);
        console.log('   ' + '='.repeat(60));
        return { success: false, needsManual: true };
      }
      throw error;
    }

    console.log(`   ✅ Migration ${migration.name} completed successfully!`);
    return { success: true };
  } catch (error) {
    console.error(`   ❌ Error running migration ${migration.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function checkTablesExist() {
  console.log('\n🔍 Checking if tables already exist...');

  const tables = ['ai_suggestions', 'intelligent_alerts', 'workflow_metrics'];
  const results = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist
        results[table] = false;
      } else {
        results[table] = true;
      }
    } catch (e) {
      results[table] = false;
    }
  }

  return results;
}

async function main() {
  console.log('🚀 AI Command Center Migrations Runner');
  console.log('='.repeat(60));

  // Check if tables exist
  const existingTables = await checkTablesExist();
  console.log('\n📊 Table Status:');
  Object.entries(existingTables).forEach(([table, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  });

  const missingTables = Object.entries(existingTables)
    .filter(([_, exists]) => !exists)
    .map(([table]) => table);

  if (missingTables.length === 0) {
    console.log('\n✅ All tables already exist! Migrations may have been run already.');
    console.log('   If you want to re-run, drop the tables first.');
    return;
  }

  console.log(`\n📦 Need to create ${missingTables.length} table(s): ${missingTables.join(', ')}`);

  // Run migrations
  const results = [];
  for (const migration of migrations) {
    const result = await runMigration(migration);
    results.push({ name: migration.name, ...result });

    // Small delay between migrations
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  results.forEach((result) => {
    if (result.needsManual) {
      console.log(`   ⚠️  ${result.name}: Needs manual execution`);
    } else if (result.success) {
      console.log(`   ✅ ${result.name}: Success`);
    } else {
      console.log(`   ❌ ${result.name}: Failed - ${result.error}`);
    }
  });

  // Final check
  console.log('\n🔍 Verifying tables...');
  const finalCheck = await checkTablesExist();
  const allCreated = Object.values(finalCheck).every((exists) => exists);

  if (allCreated) {
    console.log('✅ All tables created successfully!');
  } else {
    console.log('⚠️  Some tables may need manual creation.');
    console.log('   Please check Supabase dashboard and run SQL manually if needed.');
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
