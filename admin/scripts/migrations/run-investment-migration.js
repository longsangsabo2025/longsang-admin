/**
 * Run Investment Tables Migration
 * This script executes the SQL migration directly on Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

console.log('🚀 Investment Tables Migration');
console.log('='.repeat(60));
console.log('');

// Read migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241113_investment_tables.sql');

console.log('📄 Reading migration file...');
let sql;
try {
  sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`✅ Loaded ${sql.length} characters`);
} catch (error) {
  console.error('❌ Error reading migration file:', error.message);
  process.exit(1);
}

console.log('');
console.log('📡 Executing SQL on Supabase...');

// Execute SQL via Supabase REST API
const executeSQL = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Migration executed successfully!');
    console.log('');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    console.log('');
    console.log('💡 Alternative: Use Supabase SQL Editor');
    console.log('   1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new');
    console.log('   2. Copy SQL from: supabase/migrations/20241113_investment_tables.sql');
    console.log('   3. Click "Run"');
    process.exit(1);
  }
};

executeSQL().then(() => {
  console.log('');
  console.log('🎉 Migration complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Test form: http://localhost:8080/project-showcase/sabo-arena/investment/apply');
  console.log('   2. Check data: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/editor');
  console.log('   3. API endpoint: http://localhost:3001/api/investment/applications');
});
