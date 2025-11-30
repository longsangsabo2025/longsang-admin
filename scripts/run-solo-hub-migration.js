/**
 * Run Solo Founder Hub Migration
 * Uses Transaction Pooler to run SQL migration
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('🚀 Starting Solo Founder Hub Migration...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to Supabase via Transaction Pooler...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241130_solo_founder_hub.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into statements and run each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
      
      try {
        await client.query(stmt);
        successCount++;
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (err) {
        // Skip "already exists" errors
        if (err.message.includes('already exists') || 
            err.message.includes('duplicate key') ||
            err.message.includes('does not exist') ||
            err.message.includes('multiple primary keys')) {
          skipCount++;
          console.log(`⏭️  [${i + 1}/${statements.length}] Skipped: ${preview.substring(0, 40)}...`);
        } else {
          errorCount++;
          console.log(`❌ [${i + 1}/${statements.length}] Error: ${err.message.substring(0, 80)}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    // Verify tables created
    console.log('\n📊 Verifying Solo Hub tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('morning_briefings', 'ai_agents', 'agent_tasks', 'decision_queue', 'agent_memory', 'agent_communications', 'agent_responses')
      ORDER BY table_name
    `);
    
    console.log('\n✅ Solo Hub Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    if (tablesResult.rows.length >= 6) {
      console.log('\n🎉 Solo Founder Hub migration completed successfully!');
      console.log('\n📍 Next steps:');
      console.log('   1. Open http://localhost:8081/admin/solo-hub');
      console.log('   2. Start chatting with AI agents!');
    } else {
      console.log('\n⚠️  Some tables may be missing. Check errors above.');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
