// Execute Missing Tables Migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Creating Missing Academy Tables\n');
console.log('='.repeat(50));
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log('='.repeat(50) + '\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Read SQL file
const sqlPath = path.join(__dirname, 'create-missing-tables.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Split into individual statements
const statements = sql
  .split(/;(?!\s*\$)/) // Split on semicolons but not inside $$ blocks
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

// Execute each statement
async function runMigration() {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.length < 5) continue;

    // Get first line for logging
    const firstLine = stmt.split('\n')[0].slice(0, 60);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      
      if (error) {
        // Try direct query for CREATE statements
        if (stmt.toLowerCase().includes('create') || stmt.toLowerCase().includes('alter')) {
          console.log(`⏭️  Skipping (needs admin): ${firstLine}...`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ ${firstLine}...`);
        success++;
      }
    } catch (error) {
      // Don't count skipped statements as failures
      if (!error.message?.includes('function') && !stmt.toLowerCase().includes('create table')) {
        console.log(`❌ ${firstLine}...`);
        console.log(`   Error: ${error.message}`);
        failed++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Executed: ${success}`);
  console.log(`⏭️  Skipped (needs Supabase Dashboard): Some CREATE statements`);
  console.log('='.repeat(50));

  console.log(`
📌 IMPORTANT: Run the SQL in Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb
2. Click "SQL Editor" in sidebar
3. Copy content from: scripts/create-missing-tables.sql
4. Click "Run" to execute

This is required because table creation needs admin privileges.
  `);
}

runMigration().catch(console.error);
