/**
 * 📊 Check Database Schema
 * Verifies which tables exist and their columns
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
  console.log('\n🔍 Checking Supabase Database Schema...\n');
  
  const tables = [
    'content_queue',
    'workflow_executions', 
    'ai_fix_suggestions',
    'predictions_log',
    'project_workflows',
    'project_posts'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.code} - ${error.message}`);
      } else if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`✅ ${table}:`);
        console.log(`   Columns: ${columns.join(', ')}`);
        console.log(`   Has project_id: ${columns.includes('project_id') ? '✅ Yes' : '❌ No'}`);
        console.log(`   Has scheduled_for: ${columns.includes('scheduled_for') ? '✅ Yes' : '❌ No'}`);
      } else {
        console.log(`⚪ ${table}: Empty (no rows to inspect columns)`);
      }
      console.log('');
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  process.exit(0);
}

checkSchema();
