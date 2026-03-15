/**
 * Migrate AI Usage Table - Add missing columns
 * Run this to update existing ai_usage table schema
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateAiUsageTable() {
  console.log('🔧 Migrating ai_usage table...\n');

  const client = await pool.connect();
  
  try {
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ai_usage'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📝 Creating ai_usage table from scratch...');
      await client.query(`
        CREATE TABLE ai_usage (
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
      `);
      console.log('✅ Table created!');
    } else {
      console.log('📋 Table exists, checking columns...');
      
      // Get existing columns
      const columnsResult = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'ai_usage';
      `);
      const existingColumns = columnsResult.rows.map(r => r.column_name);
      console.log('   Existing columns:', existingColumns.join(', '));

      // Required columns
      const requiredColumns = {
        'action_type': 'VARCHAR(100)',
        'page_id': 'VARCHAR(100)',
        'input_tokens': 'INTEGER DEFAULT 0',
        'output_tokens': 'INTEGER DEFAULT 0',
        'total_tokens': 'INTEGER DEFAULT 0',
        'cost_usd': 'DECIMAL(10, 6) DEFAULT 0',
        'metadata': 'JSONB DEFAULT \'{}\'',
        'model': 'VARCHAR(50)',
        'created_at': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
      };

      // Add missing columns
      for (const [col, type] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(col)) {
          console.log(`   ➕ Adding column: ${col}`);
          await client.query(`ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS ${col} ${type};`);
        }
      }
      
      console.log('✅ Schema updated!');
    }

    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage(model);',
      'CREATE INDEX IF NOT EXISTS idx_ai_usage_action_type ON ai_usage(action_type);',
      'CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_ai_usage_page_id ON ai_usage(page_id);'
    ];
    
    for (const idx of indexes) {
      await client.query(idx);
    }
    console.log('✅ Indexes created!');

    // Test insert
    console.log('\n🧪 Testing insert...');
    const testResult = await client.query(`
      INSERT INTO ai_usage (service, model, action_type, page_id, input_tokens, output_tokens, total_tokens, cost_usd, metadata)
      VALUES ('openai', 'gpt-4o-mini', 'migration_test', 'system', 100, 50, 150, 0.000105, '{"test": true}'::jsonb)
      RETURNING id;
    `);
    console.log('✅ Test insert successful:', testResult.rows[0].id);

    // Clean up
    await client.query(`DELETE FROM ai_usage WHERE action_type = 'migration_test';`);
    console.log('🧹 Test data cleaned up');

    // Show final schema
    const finalColumns = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'ai_usage' ORDER BY ordinal_position;
    `);
    console.log('\n📋 Final schema:');
    finalColumns.rows.forEach(r => console.log(`   ${r.column_name}: ${r.data_type}`));

    // Count records
    const countResult = await client.query('SELECT COUNT(*) FROM ai_usage;');
    console.log(`\n📊 Total records: ${countResult.rows[0].count}`);

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAiUsageTable().catch(console.error);
