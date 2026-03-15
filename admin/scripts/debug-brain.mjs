/**
 * Debug Brain API
 */
import pg from 'pg';

const userId = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';
const API = 'http://localhost:3001';

async function debug() {
  console.log('🔍 DEBUG BRAIN API\n');
  
  // Test domains with different approaches
  console.log('1. Domains API Response:');
  const domRes = await fetch(API + '/api/brain/domains', {
    headers: { 'x-user-id': userId }
  });
  const domText = await domRes.text();
  console.log('   Status:', domRes.status);
  console.log('   Body:', domText.substring(0, 300));
  
  // Test search directly  
  console.log('\n2. Search API Response:');
  const searchRes = await fetch(API + '/api/brain/knowledge/search?q=javascript&userId=' + userId);
  const searchText = await searchRes.text();
  console.log('   Status:', searchRes.status);
  console.log('   Body:', searchText.substring(0, 500));

  // Check DB
  console.log('\n3. Direct DB check:');
  const pool = new pg.Pool({ 
    connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
  });
  
  // Check domains in DB
  const domains = await pool.query('SELECT id, name FROM brain_domains WHERE user_id = $1', [userId]);
  console.log('   Domains in DB:', domains.rows.length);
  domains.rows.slice(0, 3).forEach(d => console.log('     -', d.name));
  
  // Check embeddings
  const embCheck = await pool.query(`SELECT id, title, embedding IS NOT NULL as has_emb FROM brain_knowledge WHERE title ILIKE '%javascript%' LIMIT 3`);
  console.log('\n   JavaScript knowledge:');
  embCheck.rows.forEach(r => console.log('     -', r.title, '| has embedding:', r.has_emb));
  
  // Count items with embeddings
  const withEmb = await pool.query('SELECT COUNT(*) FROM brain_knowledge WHERE embedding IS NOT NULL');
  const total = await pool.query('SELECT COUNT(*) FROM brain_knowledge');
  console.log('\n   Embeddings:', withEmb.rows[0].count, '/', total.rows[0].count);
  
  await pool.end();
}

debug().catch(console.error);
