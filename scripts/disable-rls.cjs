/**
 * Disable RLS on all tables
 * App chỉ có 1 user nên không cần RLS
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function disableRLS() {
  const client = await pool.connect();
  console.log('🔓 Disabling RLS on all tables...\n');
  
  try {
    // Disable RLS on all AI Workspace tables
    const tables = [
      'documents',
      'conversations', 
      'agent_executions',
      'response_cache',
      'news_digests',
      'financial_summaries'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
        console.log(`   ✅ ${table} - RLS disabled`);
      } catch (err) {
        console.log(`   ⚠️ ${table} - ${err.message}`);
      }
    }
    
    // Drop all existing policies
    console.log('\n🗑️ Dropping existing policies...\n');
    
    const policiesResult = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    
    if (policiesResult.rows.length === 0) {
      console.log('   No policies found');
    } else {
      for (const row of policiesResult.rows) {
        try {
          await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON ${row.tablename}`);
          console.log(`   ✅ Dropped: ${row.policyname} on ${row.tablename}`);
        } catch (err) {
          console.log(`   ⚠️ ${err.message}`);
        }
      }
    }
    
    console.log('\n🎉 All RLS disabled successfully!');
    
  } finally {
    client.release();
    await pool.end();
  }
}

disableRLS();
