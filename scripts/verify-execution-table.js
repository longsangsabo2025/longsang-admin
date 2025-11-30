import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function verifyTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'execution_history'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ execution_history table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Test insert
    const testInsert = await pool.query(`
      INSERT INTO execution_history (command, steps, status)
      VALUES ('test command', '[]'::jsonb, 'completed')
      RETURNING id
    `);
    console.log('\n✅ Test insert successful, ID:', testInsert.rows[0].id);
    
    // Clean up test
    await pool.query('DELETE FROM execution_history WHERE command = $1', ['test command']);
    console.log('✅ Test cleanup done');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyTable();
