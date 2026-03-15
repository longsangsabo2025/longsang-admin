import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running Investment Tables Migration...\n');

  try {
    // Check if tables exist
    console.log('📊 Checking existing tables...');
    
    const { data: tables, error: tableError } = await supabase
      .from('investment_applications')
      .select('id')
      .limit(1);

    if (!tableError) {
      console.log('✅ Tables already exist! Migration not needed.\n');
      
      // Show table stats
      const { count: appCount } = await supabase
        .from('investment_applications')
        .select('*', { count: 'exact', head: true });
      
      const { count: interestCount } = await supabase
        .from('project_interests')
        .select('*', { count: 'exact', head: true });

      console.log(`📈 Current Data:`);
      console.log(`   - Investment Applications: ${appCount || 0}`);
      console.log(`   - Project Interests: ${interestCount || 0}`);
      
      return;
    }

    console.log('⚠️  Tables not found. Please create them via Supabase SQL Editor:\n');
    console.log('📝 Steps:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new');
    console.log('   2. Copy the SQL from: supabase/migrations/20241113_investment_tables.sql');
    console.log('   3. Click "Run" to execute\n');

    // Read and display the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20241113_investment_tables.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('📄 SQL Migration Content:\n');
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
