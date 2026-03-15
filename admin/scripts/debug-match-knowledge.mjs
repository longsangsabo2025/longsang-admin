/**
 * Debug match_knowledge function
 */
import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

async function test() {
  console.log('Testing match_knowledge with different params...\n');
  
  // Get sample embedding from existing knowledge
  const sample = await pool.query('SELECT embedding FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1');
  const emb = sample.rows[0].embedding;
  
  // Test 1: WITHOUT user filter
  console.log('1. Without user_id filter (NULL):');
  const r1 = await pool.query('SELECT title, similarity FROM match_knowledge($1, 0.3, 5, NULL, NULL)', [emb]);
  console.log('   Found:', r1.rows.length, 'results');
  r1.rows.forEach(r => console.log('   -', r.title, '|', (r.similarity * 100).toFixed(1) + '%'));
  
  // Test 2: WITH user filter
  console.log('\n2. With user_id filter:');
  const userId = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';
  const r2 = await pool.query('SELECT title, similarity FROM match_knowledge($1, 0.3, 5, NULL, $2)', [emb, userId]);
  console.log('   Found:', r2.rows.length, 'results');
  r2.rows.forEach(r => console.log('   -', r.title, '|', (r.similarity * 100).toFixed(1) + '%'));
  
  // Test 3: Check user_id in knowledge
  console.log('\n3. Checking user_id in brain_knowledge:');
  const users = await pool.query('SELECT DISTINCT user_id, COUNT(*) as cnt FROM brain_knowledge GROUP BY user_id');
  users.rows.forEach(r => console.log('   -', r.user_id, '| count:', r.cnt));
  
  // Test 4: Check RPC function definition
  console.log('\n4. Checking match_knowledge function:');
  const funcDef = await pool.query("SELECT prosrc FROM pg_proc WHERE proname = 'match_knowledge'");
  if (funcDef.rows.length > 0) {
    console.log('   Function exists');
    // Check if it has user_id filter
    const src = funcDef.rows[0].prosrc;
    console.log('   Has user_id_filter:', src.includes('user_id_filter'));
    console.log('   First 800 chars:');
    console.log(src.substring(0, 800));
  } else {
    console.log('   ❌ Function NOT FOUND!');
  }
  
  await pool.end();
}

test().catch(console.error);
