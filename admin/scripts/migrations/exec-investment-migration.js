/**
 * Execute Investment Migration via Direct SQL Queries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

console.log('🚀 Investment Tables Migration - Direct SQL Execution');
console.log('='.repeat(70));
console.log('');

// Read and parse SQL statements
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241113_investment_tables.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Split into executable statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .map(s => s + ';');

console.log(`📄 Found ${statements.length} SQL statements to execute`);
console.log('');

// Execute each statement via Supabase REST API
async function executeStatement(sql, index, total) {
  const statementPreview = sql.substring(0, 60).replace(/\n/g, ' ') + '...';
  console.log(`[${index + 1}/${total}] ${statementPreview}`);

  try {
    // Use Supabase query endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (response.ok) {
      console.log('   ✅ Success');
      return { success: true };
    } else {
      const error = await response.text();
      console.log(`   ⚠️  Warning: ${error.substring(0, 100)}`);
      return { success: false, error };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runMigration() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const result = await executeStatement(statements[i], i, statements.length);
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Small delay between statements
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⚠️  Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);
  console.log('');

  // Since direct SQL execution via REST API doesn't work well,
  // provide clear manual instructions
  console.log('⚠️  Note: Supabase requires SQL execution via Dashboard');
  console.log('');
  console.log('📋 Manual Migration Steps:');
  console.log('   1. Open: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new');
  console.log('   2. Copy entire SQL content from: supabase/migrations/20241113_investment_tables.sql');
  console.log('   3. Paste into SQL Editor');
  console.log('   4. Click "Run" button');
  console.log('');
  console.log('✨ After running, verify tables:');
  console.log('   SELECT * FROM investment_applications LIMIT 1;');
  console.log('   SELECT * FROM project_interests LIMIT 1;');
}

runMigration().catch(console.error);
