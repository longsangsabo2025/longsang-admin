/**
 * Create AI Tables using Connection Pooler
 * Uses Supabase connection pooler from .env to execute SQL directly
 */

import { Client } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get connection string from env
// Supabase connection pooler format: postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract connection details from Supabase URL
// Format: https://[project-ref].supabase.co
// Pooler: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString && supabaseUrl && supabaseKey) {
  // Try to construct pooler URL
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (urlMatch) {
    const projectRef = urlMatch[1];
    // Extract password from service key (JWT) - we need the actual DB password
    // For now, try to use the service key as password or look for DB_PASSWORD
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

    if (dbPassword) {
      // Try transaction pooler (port 6543)
      connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    }
  }
}

if (!connectionString) {
  console.error('❌ No database connection string found!');
  console.error('   Please set one of:');
  console.error('   - DATABASE_URL');
  console.error('   - SUPABASE_DB_URL');
  console.error('   - Or SUPABASE_DB_PASSWORD with SUPABASE_URL');
  process.exit(1);
}

console.log('🔧 Creating AI Tables using Connection Pooler...');
console.log('='.repeat(60));

const sql = readFileSync(join(__dirname, 'create-ai-tables-direct.sql'), 'utf8');

async function createTables() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute statements one by one (no transaction for DDL)
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length}: OK`);
      } catch (error) {
        // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length}: Already exists (OK)`);
        } else if (error.message.includes('does not exist') && (statement.includes('DROP') || statement.includes('INDEX'))) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length}: Does not exist (OK to skip)`);
        } else {
          console.log(`❌ Statement ${i + 1}/${statements.length}: ${error.message.split('\n')[0]}`);
          // Continue with other statements
        }
      }
    }

    console.log('\n✅ SQL execution complete!');

    // Verify tables
    console.log('\n🔍 Verifying tables...\n');
    const tables = ['ai_suggestions', 'intelligent_alerts', 'workflow_metrics'];

    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`,
          [table]
        );

        if (result.rows[0].exists) {
          console.log(`✅ ${table}: Table exists`);
        } else {
          console.log(`❌ ${table}: Table does not exist`);
        }
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }

    await client.end();
    console.log('\n✨ Done!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Connection failed. Please check:');
      console.error('   1. DATABASE_URL or SUPABASE_DB_PASSWORD in .env');
      console.error('   2. Or run SQL manually in Supabase SQL Editor');
      console.error('\n📋 SQL to run manually:');
      console.log('='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60));
    }

    await client.end().catch(() => {});
    process.exit(1);
  }
}

createTables().catch(console.error);

