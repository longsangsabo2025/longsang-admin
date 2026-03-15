import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

const pool = new pg.Pool({ connectionString });

async function main() {
  console.log('🔍 Checking Brain Database Functions...\n');
  
  // Check for match_knowledge function
  const functions = await pool.query(`
    SELECT routine_name, routine_schema 
    FROM information_schema.routines 
    WHERE routine_name LIKE '%match%' OR routine_name LIKE '%brain%'
  `);
  
  console.log('📂 Database Functions:');
  if (functions.rows.length === 0) {
    console.log('  ⚠️ No match functions found!');
  } else {
    functions.rows.forEach(r => console.log(`  - ${r.routine_schema}.${r.routine_name}`));
  }
  
  // Check knowledge count
  const knowledge = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge');
  console.log(`\n📚 Knowledge items: ${knowledge.rows[0].count}`);
  
  // Check if embeddings exist
  const embeddings = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge WHERE embedding IS NOT NULL');
  console.log(`🧬 Items with embeddings: ${embeddings.rows[0].count}`);
  
  // Test direct vector search if function exists
  console.log('\n🧪 Testing search...');
  try {
    const testResult = await pool.query(`
      SELECT id, title, 
        1 - (embedding <=> (SELECT embedding FROM brain_knowledge LIMIT 1)) as similarity
      FROM brain_knowledge
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> (SELECT embedding FROM brain_knowledge LIMIT 1)
      LIMIT 3
    `);
    
    console.log('Direct vector search results:');
    testResult.rows.forEach(r => {
      console.log(`  - ${r.title} (similarity: ${(r.similarity * 100).toFixed(1)}%)`);
    });
  } catch (e) {
    console.log('  ❌ Vector search error:', e.message);
  }
  
  await pool.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  pool.end();
});
