#!/usr/bin/env node
import path from 'path';
import { Client } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function verify() {
  await client.connect();
  console.log('🔍 Verifying Phase 4 Migrations...\n');

  // Check functions
  const functions = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND (
      routine_name LIKE '%master%' 
      OR routine_name LIKE '%session%' 
      OR routine_name LIKE '%orchestration%'
      OR routine_name LIKE '%graph%'
      OR routine_name LIKE '%routing%'
    )
    ORDER BY routine_name
  `);

  console.log('Phase 4 Functions:');
  functions.rows.forEach(r => console.log('  ✅', r.routine_name));

  // Check tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'brain_%'
    ORDER BY table_name
  `);

  console.log('\nAll Brain Tables:');
  tables.rows.forEach(r => console.log('  📊', r.table_name));

  // Summary
  console.log('\n========================================');
  console.log(`📊 Total Brain Tables: ${tables.rows.length}`);
  console.log(`⚡ Phase 4 Functions: ${functions.rows.length}`);
  console.log('========================================');

  await client.end();
}

verify().catch(e => {
  console.error('Error:', e);
  client.end();
  process.exit(1);
});
