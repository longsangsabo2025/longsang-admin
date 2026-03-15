/**
 * Debug embedding format issue
 */
import pg from 'pg';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

async function debug() {
  console.log('🔍 DEBUGGING EMBEDDING FORMAT\n');
  
  // 1. Get embedding from DB
  console.log('1. Getting embedding from database...');
  const dbEmb = await pool.query('SELECT embedding, title FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1');
  console.log('   Title:', dbEmb.rows[0].title);
  console.log('   DB embedding type:', typeof dbEmb.rows[0].embedding);
  console.log('   DB embedding is array:', Array.isArray(dbEmb.rows[0].embedding));
  
  // 2. Generate new embedding from OpenAI
  console.log('\n2. Generating new embedding from OpenAI...');
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: 'javascript best practices',
    dimensions: 1536
  });
  const newEmb = response.data[0].embedding;
  console.log('   New embedding type:', typeof newEmb);
  console.log('   New embedding is array:', Array.isArray(newEmb));
  console.log('   New embedding length:', newEmb.length);
  
  // 3. Test with DB embedding (should work)
  console.log('\n3. Testing RPC with DB embedding...');
  try {
    const r1 = await pool.query('SELECT title, similarity FROM match_knowledge($1, 0.3, 3, NULL, NULL)', [dbEmb.rows[0].embedding]);
    console.log('   Results:', r1.rows.length);
    r1.rows.forEach(r => console.log('     -', r.title, '|', (r.similarity * 100).toFixed(1) + '%'));
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  // 4. Test with new embedding as string
  console.log('\n4. Testing RPC with new embedding as string...');
  try {
    const vectorStr = `[${newEmb.join(',')}]`;
    console.log('   Vector string length:', vectorStr.length);
    console.log('   Vector preview:', vectorStr.substring(0, 100) + '...');
    
    const r2 = await pool.query('SELECT title, similarity FROM match_knowledge($1::vector, 0.3, 3, NULL, NULL)', [vectorStr]);
    console.log('   Results:', r2.rows.length);
    r2.rows.forEach(r => console.log('     -', r.title, '|', (r.similarity * 100).toFixed(1) + '%'));
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  // 5. Test with new embedding as array directly
  console.log('\n5. Testing RPC with new embedding as array...');
  try {
    const r3 = await pool.query('SELECT title, similarity FROM match_knowledge($1, 0.3, 3, NULL, NULL)', [newEmb]);
    console.log('   Results:', r3.rows.length);
    r3.rows.forEach(r => console.log('     -', r.title, '|', (r.similarity * 100).toFixed(1) + '%'));
  } catch (e) {
    console.log('   Error:', e.message);
  }
  
  await pool.end();
}

debug().catch(console.error);
