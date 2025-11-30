/**
 * Phase 6 Migration Runner
 * Runs SQL migrations 013-018 via Supabase connection
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection - Using pooler from .env (aws-1-us-east-2)
// Session mode (port 5432) for DDL operations
const pool = new Pool({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,  // Session mode - required for DDL
  database: 'postgres',
  user: 'postgres.diexsbzqwsbpilsymnfb',
  password: 'Acookingoil123',
  ssl: { rejectUnauthorized: false }
});

const migrationsDir = path.join(__dirname, '../supabase/migrations/brain');

const phase6Files = [
  '019_phase6_fixes.sql'
];

async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 Running: ${filename}`);
  console.log(`${'='.repeat(60)}`);
  
  const client = await pool.connect();
  try {
    // Set search path first (required for Supabase pooler)
    await client.query('SET search_path TO public, extensions;');
    await client.query(sql);
    console.log(`✅ ${filename} - SUCCESS`);
    return { file: filename, success: true };
  } catch (error) {
    console.log(`❌ ${filename} - ERROR: ${error.message}`);
    if (error.position) {
      const position = parseInt(error.position);
      const context = sql.substring(Math.max(0, position - 100), position + 100);
      console.log(`   Near: ...${context}...`);
    }
    return { file: filename, success: false, error: error.message };
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Phase 6 Migration Runner');
  console.log('=' .repeat(60));
  console.log('Files to migrate:', phase6Files.length);
  
  const results = [];
  
  for (const file of phase6Files) {
    const result = await runMigration(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Succeeded: ${succeeded}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed migrations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
