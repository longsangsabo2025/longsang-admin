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
    console.log(`❌ ${name} failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Phase 3 SQL Migrations...');
  console.log('=' .repeat(50));
  
  await client.connect();
  console.log('✅ Connected to database\n');

  const migrationsDir = 'd:\\0.PROJECTS\\01-MAIN-PRODUCTS\\long-sang-forge\\supabase\\migrations\\brain';
  
  const migrations = [
    { file: '006_core_logic_queue.sql', name: 'Migration 006: Core Logic Queue' },
    { file: '007_core_logic_versioning.sql', name: 'Migration 007: Core Logic Versioning' }
  ];
  
  let success = 0;
  let failed = 0;
  
  for (const m of migrations) {
    const result = await applyMigration(path.join(migrationsDir, m.file), m.name);
    if (result) success++;
    else failed++;
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 PHASE 3 MIGRATION RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  
  // Verify
  console.log('\n📋 Verifying...');
  
  // Check queue table
  const { rows: queueCheck } = await client.query(`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brain_core_logic_queue')
  `);
  console.log(`   Queue table: ${queueCheck[0].exists ? '✅' : '❌'}`);
  
  // Check versioning columns
  const { rows: versionCols } = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'brain_core_logic' 
    AND column_name IN ('parent_version_id', 'is_active', 'change_summary')
  `);
  console.log(`   Versioning columns: ${versionCols.length >= 3 ? '✅' : '⚠️'} (${versionCols.length}/3)`);
  
  // Check functions
  const { rows: funcs } = await client.query(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%distillation%' OR routine_name LIKE '%core_logic%')
  `);
  console.log(`   Functions: ${funcs.length} found`);
  funcs.forEach(f => console.log(`      - ${f.routine_name}`));
  
  await client.end();
  console.log('\n🎉 Phase 3 migrations complete!');
}

main();
