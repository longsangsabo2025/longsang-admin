/**
 * Check embedding format in database
 */
import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

async function check() {
  console.log('🔍 CHECKING EMBEDDING FORMAT\n');
  
  // Get sample embedding
  const sample = await pool.query("SELECT id, title, LEFT(embedding::text, 100) as emb_sample FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1");
  console.log('Sample record:');
  console.log('  ID:', sample.rows[0].id);
  console.log('  Title:', sample.rows[0].title);
  console.log('  Embedding preview:', sample.rows[0].emb_sample);
  
  // Check column type
  const colType = await pool.query("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'brain_knowledge' AND column_name = 'embedding'");
  console.log('\nColumn type:', colType.rows[0]);
  
  // Test RPC with proper format
  console.log('\n🧪 Testing match_knowledge RPC...');
  try {
    // Get real embedding from a record
    const realEmb = await pool.query("SELECT embedding FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1");
    
    // Call RPC using Supabase client
    const result = await pool.query(`
      SELECT * FROM match_knowledge(
        (SELECT embedding FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1),
        0.5, 5, NULL, NULL
      )
    `);
    
    console.log('RPC Result:', result.rows.length, 'rows');
    result.rows.forEach(r => console.log('  -', r.title, '| similarity:', r.similarity?.toFixed(3)));
  } catch (e) {
    console.log('RPC Error:', e.message);
  }
  
  await pool.end();
}

check().catch(console.error);
