/**
 * Auto-run Migrations via Supabase SQL
 * Simple version that executes SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Auto-running Database Migrations...\n');

  try {
    // Read SQL file
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20250101_academy_complete_system.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('✅ Migration file loaded');
    console.log(`📊 Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Check if tables already exist
    console.log('🔍 Checking existing tables...\n');

    const { error: checkError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tables already exist!');
      console.log('📊 Database is ready for seeding.\n');
      console.log('Run: node scripts/quick-seed.mjs\n');
      return true;
    }

    console.log('⚠️  Tables do not exist yet');
    console.log('📝 Attempting to create tables...\n');

    // Try to execute SQL via Supabase
    // Note: This requires proper permissions
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} statements\n`);

    // Since we can't execute raw SQL via client, we need to use manual approach
    console.log('❌ Cannot auto-execute migrations via Supabase client\n');
    console.log('📝 Please run migrations manually:\n');
    console.log('1. Open: https://app.supabase.com/project/diexsbzqwsbpilsymnfb');
    console.log('2. SQL Editor → New Query');
    console.log('3. Copy from: supabase/migrations/20250101_academy_complete_system.sql');
    console.log('4. Paste and Run');
    console.log('5. Then run: node scripts/quick-seed.mjs\n');

    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

const success = await migrate();
process.exit(success ? 0 : 1);
