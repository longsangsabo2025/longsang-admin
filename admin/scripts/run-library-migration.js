/**
 * 🚀 RUN LIBRARY MIGRATIONS DIRECTLY
 * Run: node scripts/run-library-migration.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Client } = pg;

async function runMigration() {
  console.log('🚀 Running library tables migration...\n');

  const client = new Client({
    connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251205_library_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute
    console.log('📋 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration completed!\n');

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('library_workspace', 'library_products', 'library_activity_log')
    `);

    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
