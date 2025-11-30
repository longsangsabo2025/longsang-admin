const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addColumns() {
  const client = await pool.connect();
  try {
    console.log('Adding missing columns to copilot_feedback...');
    
    const columns = [
      'ai_response TEXT',
      'corrected_response TEXT', 
      'user_id TEXT',
      'feedback_type TEXT',
      'interaction_type TEXT',
      'reference_id TEXT',
      'reference_type TEXT',
      'comment TEXT',
      'rating INTEGER',
      "context JSONB DEFAULT '{}'",
      'original_message TEXT',
    ];
    
    for (const col of columns) {
      const colName = col.split(' ')[0];
      try {
        await client.query(`ALTER TABLE copilot_feedback ADD COLUMN IF NOT EXISTS ${col}`);
        console.log(`  ✅ ${colName}`);
      } catch (e) {
        console.log(`  ⚠️ ${colName}: ${e.message}`);
      }
    }
    
    console.log('\n✅ All columns added!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
addColumns();
