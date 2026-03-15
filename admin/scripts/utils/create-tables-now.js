/**
 * Create AI Tables Now
 * Uses Supabase REST API to create tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = readFileSync(join(__dirname, 'create-ai-tables-direct.sql'), 'utf8');

console.log('🔧 Creating AI Tables...');
console.log('='.repeat(60));

// Split SQL into statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements\n`);

// Try to execute via REST API
async function executeSQL() {
  try {
    // Use Supabase Management API or direct connection
    // For now, we'll use the REST API with a custom function

    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (response.ok) {
      console.log('✅ Tables created successfully!');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️  Could not execute via API');
      console.log('📋 Please run the SQL manually in Supabase SQL Editor:');
      console.log('\n' + '='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60));
      return false;
    }
  } catch (error) {
    console.log('⚠️  Could not execute via API');
    console.log('📋 Please run the SQL manually in Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('\nFile location: create-ai-tables-direct.sql');
    return false;
  }
}

// Test if tables exist
async function testTables() {
  console.log('\n🔍 Testing if tables exist...\n');

  const tables = ['ai_suggestions', 'intelligent_alerts', 'workflow_metrics'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message.includes('not find the table')) {
          console.log(`❌ ${table}: Table does not exist`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Table exists`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

async function main() {
  await testTables();

  const allExist = await testTables().then(() => {
    // Check again
    return Promise.all([
      supabase.from('ai_suggestions').select('id').limit(1),
      supabase.from('intelligent_alerts').select('id').limit(1)
    ]).then(([r1, r2]) => {
      return !r1.error && !r2.error;
    }).catch(() => false);
  });

  if (!allExist) {
    console.log('\n📋 Creating tables...');
    await executeSQL();

    // Wait a bit and test again
    await new Promise(r => setTimeout(r, 2000));
    await testTables();
  } else {
    console.log('\n✅ All tables exist!');
  }
}

main().catch(console.error);

