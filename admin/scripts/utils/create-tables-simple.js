/**
 * Create Tables - Simple Version (No Foreign Keys)
 * Tạo tables đơn giản không có foreign key constraints
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  console.error('   Please add: DATABASE_URL=postgresql://...');
  process.exit(1);
}

console.log('🔧 Creating AI Tables (Simple - No Foreign Keys)...');
console.log('='.repeat(60));

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const tables = [
  {
    name: 'ai_suggestions',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('action', 'workflow', 'optimization', 'alert')),
        priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        reason TEXT NOT NULL,
        suggested_workflow_id UUID,
        suggested_action JSONB,
        estimated_impact TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        dismissed_at TIMESTAMP,
        executed_at TIMESTAMP,
        user_id UUID
      );
    `
  },
  {
    name: 'intelligent_alerts',
    sql: `
      CREATE TABLE IF NOT EXISTS intelligent_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('anomaly', 'threshold', 'pattern', 'opportunity')),
        severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
        message TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT NOW(),
        suggested_workflow_id UUID,
        auto_resolve BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by UUID,
        metadata JSONB,
        user_id UUID
      );
    `
  },
  {
    name: 'workflow_metrics',
    sql: `
      CREATE TABLE IF NOT EXISTS workflow_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id UUID NOT NULL,
        execution_id UUID,
        node_id TEXT,
        execution_time_ms INTEGER,
        success BOOLEAN,
        cost_usd DECIMAL(10,4),
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      );
    `
  }
];

async function main() {
  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    for (const table of tables) {
      console.log(`📝 Creating ${table.name}...`);
      try {
        await client.query(table.sql);
        console.log(`✅ ${table.name}: Created successfully\n`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  ${table.name}: Already exists (OK)\n`);
        } else {
          console.log(`❌ ${table.name}: ${error.message}\n`);
        }
      }
    }

    // Create indexes
    console.log('📝 Creating indexes...\n');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(type);',
      'CREATE INDEX IF NOT EXISTS idx_ai_suggestions_priority ON ai_suggestions(priority);',
      'CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_type ON intelligent_alerts(type);',
      'CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_severity ON intelligent_alerts(severity);',
      'CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_detected_at ON intelligent_alerts(detected_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_id ON workflow_metrics(workflow_id);',
    ];

    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
      } catch (error) {
        // Ignore index errors
      }
    }
    console.log('✅ Indexes created\n');

    // Verify
    console.log('🔍 Verifying tables...\n');
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table.name]
      );
      if (result.rows[0].exists) {
        console.log(`✅ ${table.name}: EXISTS`);
      } else {
        console.log(`❌ ${table.name}: MISSING`);
      }
    }

    await client.end();
    console.log('\n✨ Done! Tables created successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

main().catch(console.error);

