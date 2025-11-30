/**
 * Run Solo Hub Migration
 * Execute SQL migration directly to Supabase via Transaction Pooler
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Transaction Pooler URL from .env.local
const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('🚀 Starting Solo Hub Migration...\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read migration SQL
    const sqlPath = path.join(__dirname, 'supabase/migrations/20241130_solo_founder_hub.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`📄 SQL file loaded: ${sql.length} characters`);
    
    // Connect and run
    const client = await pool.connect();
    console.log('✅ Connected to Supabase via Transaction Pooler\n');
    
    console.log('⏳ Running migration...');
    await client.query(sql);
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify tables created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('morning_briefings', 'ai_agents', 'agent_tasks', 'decision_queue', 'agent_memory', 'agent_communications')
    `);
    
    console.log('\n📋 Tables created:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
  } finally {
    await pool.end();
    console.log('\n🔌 Connection closed');
  }
}

runMigration();
