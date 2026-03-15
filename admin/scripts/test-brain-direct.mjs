/**
 * Brain E2E Test - Direct Database Test
 * Tests the complete Brain workflow without relying on local API
 */
import pg from 'pg';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

const userId = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.substring(0, 8000),
    dimensions: 1536
  });
  return response.data[0].embedding;
}

async function testBrain() {
  console.log('🧪 BRAIN E2E TEST (Direct DB)\n');
  console.log('='.repeat(50));
  
  // Test 1: Database Connection
  console.log('\n1️⃣ Testing Database Connection...');
  try {
    const result = await pool.query('SELECT NOW() as time');
    console.log('   Status: ✅ Connected');
    console.log('   Time:', result.rows[0].time);
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    process.exit(1);
  }
  
  // Test 2: OpenAI Embedding Generation
  console.log('\n2️⃣ Testing Embedding Generation...');
  let testEmbedding;
  try {
    testEmbedding = await generateEmbedding('SABO Arena architecture and deployment guide');
    console.log('   Status: ✅ OK');
    console.log('   Vector dimensions:', testEmbedding.length);
    console.log('   Sample:', testEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ') + '...');
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    process.exit(1);
  }
  
  // Test 3: List Domains
  console.log('\n3️⃣ Testing List Domains...');
  try {
    const domains = await pool.query(
      'SELECT id, name, description FROM brain_domains WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    console.log('   Status: ✅ OK');
    console.log('   Domains found:', domains.rows.length);
    domains.rows.slice(0, 5).forEach(d => {
      console.log(`     - ${d.name}`);
    });
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 4: List Knowledge
  console.log('\n4️⃣ Testing List Knowledge...');
  try {
    const knowledge = await pool.query(
      'SELECT id, title, content_type FROM brain_knowledge WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    console.log('   Status: ✅ OK');
    console.log('   Knowledge items found:', knowledge.rows.length);
    knowledge.rows.forEach(k => {
      console.log(`     - ${k.title} (${k.content_type})`);
    });
    
    // Count total
    const count = await pool.query('SELECT COUNT(*) as total FROM brain_knowledge WHERE user_id = $1', [userId]);
    console.log('   Total items:', count.rows[0].total);
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 5: Semantic Search (using match_knowledge RPC)
  console.log('\n5️⃣ Testing Semantic Search...');
  try {
    // First, generate a proper query embedding
    const queryEmbedding = await generateEmbedding('javascript programming best practices coding standards');
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    
    // Use lower threshold (0.3 instead of 0.5)
    const result = await pool.query(`
      SELECT id, title, content_type, similarity 
      FROM match_knowledge($1::vector, 0.3, 5, NULL, $2)
    `, [vectorStr, userId]);
    
    console.log('   Status: ✅ OK');
    console.log('   Query: "javascript programming best practices"');
    console.log('   Threshold: 30%');
    console.log('   Results found:', result.rows.length);
    result.rows.forEach((r, i) => {
      console.log(`     ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
    });
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 6: Multi-topic Search
  console.log('\n6️⃣ Testing Multi-topic Search...');
  const queries = [
    { query: 'real estate property vung tau beach house', topic: 'Real Estate' },
    { query: 'sabo arena gaming platform architecture', topic: 'SABO Arena' },
    { query: 'API authentication security endpoints', topic: 'API Auth' }
  ];
  
  for (const { query, topic } of queries) {
    try {
      const embedding = await generateEmbedding(query);
      const vectorStr = `[${embedding.join(',')}]`;
      
      // Use 30% threshold for better results
      const result = await pool.query(`
        SELECT title, similarity 
        FROM match_knowledge($1::vector, 0.3, 2, NULL, $2)
      `, [vectorStr, userId]);
      
      console.log(`   🔍 "${topic}"`);
      if (result.rows.length > 0) {
        result.rows.forEach(r => {
          console.log(`      → ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('      → No results (threshold: 30%)');
      }
    } catch (e) {
      console.log(`      → Error: ${e.message}`);
    }
  }
  
  // Test 7: Knowledge with Embeddings Status
  console.log('\n7️⃣ Checking Embeddings Status...');
  try {
    const withEmb = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge WHERE embedding IS NOT NULL AND user_id = $1', [userId]);
    const total = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge WHERE user_id = $1', [userId]);
    console.log(`   Status: ✅ ${withEmb.rows[0].count}/${total.rows[0].count} items have embeddings`);
    console.log(`   Coverage: ${((withEmb.rows[0].count / total.rows[0].count) * 100).toFixed(1)}%`);
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ BRAIN E2E TEST COMPLETE');
  
  await pool.end();
}

testBrain().catch(console.error);
