/**
 * Check Supabase Tables Script
 * Run with: node scripts/check-supabase-tables.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Supabase Table Check\n');
console.log('URL:', SUPABASE_URL);
console.log('Service Key:', SERVICE_KEY ? '✅ Found' : '❌ Missing');
console.log('Anon Key:', ANON_KEY ? '✅ Found' : '❌ Missing');
console.log('\n' + '='.repeat(60) + '\n');

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

const tables = [
  'projects',
  'marketing_campaigns', 
  'campaign_posts',
  'contacts',
  'ai_agents',
  'automation_triggers',
  'workflows',
  'activity_logs',
  'content_queue',
  'admin_settings',
  'brain_documents',
  'brain_tags',
  'social_connections',
  'scheduled_posts'
];

async function checkTables() {
  console.log('📊 Checking tables with SERVICE ROLE key (bypass RLS):\n');
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table.padEnd(25)} - Error: ${error.message.substring(0, 50)}`);
      } else {
        console.log(`✅ ${table.padEnd(25)} - OK (${count || 0} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${table.padEnd(25)} - Exception: ${e.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📊 Checking tables with ANON key (with RLS):\n');

  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAnon
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42501' || error.message.includes('permission')) {
          console.log(`🔒 ${table.padEnd(25)} - RLS: No permission (need auth)`);
        } else if (error.code === '42P01') {
          console.log(`❌ ${table.padEnd(25)} - Table not found`);
        } else {
          console.log(`⚠️  ${table.padEnd(25)} - Error: ${error.message.substring(0, 40)}`);
        }
      } else {
        console.log(`✅ ${table.padEnd(25)} - OK (${count || 0} rows visible)`);
      }
    } catch (e) {
      console.log(`❌ ${table.padEnd(25)} - Exception: ${e.message}`);
    }
  }
}

checkTables().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
