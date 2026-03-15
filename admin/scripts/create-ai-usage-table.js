/**
 * Create AI Usage Table in Supabase
 * Tracks API calls, tokens, and costs for AI services
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env (not api/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAiUsageTable() {
  console.log('🔧 Creating ai_usage table...\n');

  // Create the table using raw SQL
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create ai_usage table if not exists
      CREATE TABLE IF NOT EXISTS ai_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model VARCHAR(50) NOT NULL,
        action_type VARCHAR(100),
        page_id VARCHAR(100),
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
        cost_usd DECIMAL(10, 6) DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for faster queries
      CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage(model);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_action_type ON ai_usage(action_type);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_page_id ON ai_usage(page_id);
    `
  });

  if (createError) {
    // Try alternative approach - direct insert to check if table exists
    console.log('📝 RPC not available, checking table directly...');
    
    const { data, error: selectError } = await supabase
      .from('ai_usage')
      .select('id')
      .limit(1);

    if (selectError && selectError.code === '42P01') {
      console.log('❌ Table does not exist. Please create it manually in Supabase SQL Editor:');
      console.log(`
-- Run this SQL in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model VARCHAR(50) NOT NULL,
  action_type VARCHAR(100),
  page_id VARCHAR(100),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage(model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_action_type ON ai_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_page_id ON ai_usage(page_id);
      `);
      return;
    } else if (!selectError || data !== null) {
      console.log('✅ Table ai_usage already exists!');
    }
  } else {
    console.log('✅ Table ai_usage created successfully!');
  }

  // Test insert
  console.log('\n🧪 Testing insert...');
  const { data: testData, error: insertError } = await supabase
    .from('ai_usage')
    .insert({
      model: 'gpt-4o-mini',
      action_type: 'test_setup',
      page_id: 'system',
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
      cost_usd: 0.000105,
      metadata: { test: true, setup_date: new Date().toISOString() }
    })
    .select();

  if (insertError) {
    console.log('❌ Insert test failed:', insertError.message);
    
    if (insertError.code === '42P01') {
      console.log('\n📋 Table not found. SQL to create:');
      printCreateTableSQL();
    }
  } else {
    console.log('✅ Test insert successful:', testData[0]?.id);
    
    // Clean up test data
    await supabase.from('ai_usage').delete().eq('action_type', 'test_setup');
    console.log('🧹 Test data cleaned up');
  }

  // Show stats
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Current ai_usage records: ${count || 0}`);
  console.log('\n✅ AI Usage table setup complete!');
}

function printCreateTableSQL() {
  console.log(`
-- ================================================
-- AI USAGE TABLE - Run in Supabase SQL Editor
-- ================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model VARCHAR(50) NOT NULL,
  action_type VARCHAR(100),
  page_id VARCHAR(100),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage(model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_action_type ON ai_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_page_id ON ai_usage(page_id);

-- Grant permissions
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ai_usage" ON ai_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);
  `);
}

createAiUsageTable().catch(console.error);
