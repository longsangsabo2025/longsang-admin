import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function applyMigration(filePath, name) {
  console.log(`\n📄 Applying: ${name}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await client.query(sql);
    console.log(`✅ ${name} applied successfully!`);
    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`⚠️ ${name} - already exists (skipping)`);
      return true;
    }
    console.error(`❌ ${name} failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Phase 5 SQL Migrations...');
  console.log('==================================================');
  
  await client.connect();
  console.log('✅ Connected to database\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations', 'brain');
  
  const migrations = [
    { file: '011_actions_and_workflows.sql', name: 'Migration 011: Actions & Workflows' },
    { file: '012_tasks_and_notifications.sql', name: 'Migration 012: Tasks & Notifications' },
  ];

  let success = 0;
  let failed = 0;

  for (const m of migrations) {
    const result = await applyMigration(path.join(migrationsDir, m.file), m.name);
    if (result) success++;
    else failed++;
  }

  console.log('\n==================================================');
  console.log('📊 PHASE 5 MIGRATION RESULTS');
  console.log('==================================================');
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);

  // Verify tables
  console.log('\n📋 Verifying tables...');
  const tables = ['brain_actions', 'brain_workflows', 'brain_tasks', 'brain_notifications'];
  for (const table of tables) {
    const result = await client.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
      [table]
    );
    console.log(`   ${table}: ${result.rows[0].exists ? '✅' : '❌'}`);
  }

  // Verify RLS
  console.log('\n🔒 Verifying RLS...');
  const rlsResult = await client.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('brain_actions', 'brain_workflows', 'brain_tasks', 'brain_notifications')
  `);
  rlsResult.rows.forEach(r => {
    console.log(`   ${r.tablename}: RLS ${r.rowsecurity ? '✅ enabled' : '❌ disabled'}`);
  });

  // Count indexes
  const indexResult = await client.query(`
    SELECT COUNT(*) as count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (indexname LIKE 'idx_brain_action%' OR indexname LIKE 'idx_brain_workflow%' 
         OR indexname LIKE 'idx_brain_task%' OR indexname LIKE 'idx_brain_notification%')
  `);
  console.log(`\n📊 Phase 5 Indexes: ${indexResult.rows[0].count} found`);

  await client.end();
  console.log('\n🎉 Phase 5 migrations complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  client.end();
  process.exit(1);
});
