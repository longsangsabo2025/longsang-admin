/**
 * Debug vector format issue
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

const userId = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';

async function debug() {
  console.log('🔍 DEBUGGING VECTOR FORMAT\n');
  
  // 1. Get SABO Arena embedding from DB
  console.log('1. Getting SABO Arena embedding from DB...');
  const saboItem = await pool.query("SELECT title, embedding FROM brain_knowledge WHERE title = 'SABO Arena Overview'");
  
  if (saboItem.rows.length === 0) {
    console.log('   ❌ SABO Arena Overview not found!');
    await pool.end();
    return;
  }
  
  console.log('   ✅ Found:', saboItem.rows[0].title);
  console.log('   Embedding type:', typeof saboItem.rows[0].embedding);
  
  // 2. Search using SABO's own embedding
  console.log('\n2. Searching with SABO Arena\'s own embedding...');
  const r1 = await pool.query('SELECT title, similarity FROM match_knowledge($1, 0.1, 10, NULL, $2)', 
    [saboItem.rows[0].embedding, userId]);
  console.log('   Results:', r1.rows.length);
  r1.rows.slice(0, 5).forEach((r, i) => console.log(`     ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`));
  
  // 3. Generate NEW embedding for exact same title
  console.log('\n3. Generating NEW embedding for "SABO Arena Overview"...');
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: 'SABO Arena Overview',
    dimensions: 1536
  });
  const newEmb = response.data[0].embedding;
  console.log('   New embedding length:', newEmb.length);
  
  // 4. Compare first few values
  console.log('\n4. Comparing embeddings...');
  const dbEmb = saboItem.rows[0].embedding;
  console.log('   DB embedding preview:', dbEmb.substring(0, 80) + '...');
  console.log('   New embedding preview:', '[' + newEmb.slice(0, 5).join(',') + '...]');
  
  // 5. Test different vector formats
  console.log('\n5. Testing different vector formats...');
  
  // Format A: Plain array
  try {
    const r2 = await pool.query('SELECT title, similarity FROM match_knowledge($1, 0.01, 5, NULL, $2)', 
      [newEmb, userId]);
    console.log('   Array format results:', r2.rows.length);
    r2.rows.slice(0, 3).forEach((r, i) => console.log(`     ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`));
  } catch (e) {
    console.log('   Array format error:', e.message.substring(0, 100));
  }
  
  // Format B: String with ::vector cast  
  try {
    const vectorStr = `[${newEmb.join(',')}]`;
    const r3 = await pool.query('SELECT title, similarity FROM match_knowledge($1::vector, 0.01, 5, NULL, $2)', 
      [vectorStr, userId]);
    console.log('   String::vector format results:', r3.rows.length);
    r3.rows.slice(0, 3).forEach((r, i) => console.log(`     ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`));
  } catch (e) {
    console.log('   String::vector format error:', e.message.substring(0, 100));
  }
  
  // Format C: JSON stringify then cast
  try {
    const vectorJson = JSON.stringify(newEmb);
    const r4 = await pool.query('SELECT title, similarity FROM match_knowledge($1::vector, 0.01, 5, NULL, $2)', 
      [vectorJson, userId]);
    console.log('   JSON::vector format results:', r4.rows.length);
    r4.rows.slice(0, 3).forEach((r, i) => console.log(`     ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`));
  } catch (e) {
    console.log('   JSON::vector format error:', e.message.substring(0, 100));
  }
  
  await pool.end();
  console.log('\n✅ Debug complete');
}

debug().catch(console.error);
