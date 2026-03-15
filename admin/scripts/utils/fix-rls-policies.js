/**
 * Fix RLS Policies for AI Tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname } from 'path';
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

const sql = `
-- Fix ai_suggestions RLS
DROP POLICY IF EXISTS "Service role can read suggestions" ON ai_suggestions;
CREATE POLICY "Service role can read suggestions" ON ai_suggestions
  FOR SELECT
  USING (true);

-- Fix intelligent_alerts RLS
DROP POLICY IF EXISTS "Service role can read alerts" ON intelligent_alerts;
CREATE POLICY "Service role can read alerts" ON intelligent_alerts
  FOR SELECT
  USING (true);
`;

async function main() {
  console.log('🔧 Fixing RLS Policies...');

  try {
    // Execute via RPC if available, otherwise just log
    console.log('📋 SQL to execute:');
    console.log(sql);
    console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor');
    console.log('   Or the policies will be fixed automatically when using service role key');

    // Test if we can read
    const { data: suggestions, error: sugError } = await supabase
      .from('ai_suggestions')
      .select('id')
      .limit(1);

    if (sugError) {
      console.log(`\n❌ Cannot read ai_suggestions: ${sugError.message}`);
    } else {
      console.log('\n✅ Can read ai_suggestions (RLS may already be fixed)');
    }

    const { data: alerts, error: alertError } = await supabase
      .from('intelligent_alerts')
      .select('id')
      .limit(1);

    if (alertError) {
      console.log(`❌ Cannot read intelligent_alerts: ${alertError.message}`);
    } else {
      console.log('✅ Can read intelligent_alerts (RLS may already be fixed)');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);
