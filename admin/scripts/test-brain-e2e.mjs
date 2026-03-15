/**
 * Brain E2E Test Script
 * Tests the complete Brain workflow: embedding, search, CRUD
 */

const API = 'http://localhost:3001';
const userId = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e'; // Real user ID from database

async function testBrain() {
  console.log('🧪 BRAIN E2E TEST\n');
  console.log('='.repeat(50));
  
  // Test 1: API Health
  console.log('\n1️⃣ Testing API Health...');
  try {
    const health = await fetch(API + '/api/brain/health');
    const healthData = await health.json();
    console.log('   Status:', health.ok ? '✅ OK' : '❌ FAILED');
    console.log('   Response:', JSON.stringify(healthData).substring(0, 100));
  } catch (e) {
    console.log('   ❌ API not running:', e.message);
    console.log('\n⚠️  Please start API server first: npm run server');
    process.exit(1);
  }
  
  // Test 2: Embedding Generation
  console.log('\n2️⃣ Testing Embedding Generation...');
  try {
    const embRes = await fetch(API + '/api/brain/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test embedding for SABO Arena deployment' })
    });
    const embData = await embRes.json();
    console.log('   Status:', embRes.ok ? '✅ OK' : '❌ FAILED');
    console.log('   Vector dimensions:', embData.embedding?.length || 'N/A');
    if (embData.embedding) {
      console.log('   Sample values:', embData.embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ') + '...');
    }
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 3: Knowledge Search (Semantic)
  console.log('\n3️⃣ Testing Semantic Search...');
  try {
    const searchRes = await fetch(API + '/api/brain/knowledge/search?q=sabo%20arena%20architecture&userId=' + userId);
    const searchData = await searchRes.json();
    console.log('   Status:', searchRes.ok ? '✅ OK' : '❌ FAILED');
    console.log('   Results found:', searchData.count || 0);
    if (searchData.data && searchData.data.length > 0) {
      console.log('   Top results:');
      searchData.data.slice(0, 3).forEach((r, i) => {
        console.log(`     ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
      });
    }
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 4: List All Knowledge
  console.log('\n4️⃣ Testing List Knowledge...');
  try {
    const listRes = await fetch(API + '/api/brain/knowledge?limit=5', {
      headers: { 'x-user-id': userId }
    });
    const listData = await listRes.json();
    console.log('   Status:', listRes.ok ? '✅ OK' : '❌ FAILED');
    console.log('   Total items:', listData.total || 0);
    console.log('   Returned:', listData.count || 0);
    if (listData.data && listData.data.length > 0) {
      console.log('   Sample items:');
      listData.data.slice(0, 3).forEach((k, i) => {
        console.log(`     ${i+1}. ${k.title}`);
      });
    }
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 5: List Domains
  console.log('\n5️⃣ Testing List Domains...');
  try {
    const domRes = await fetch(API + '/api/brain/domains', {
      headers: { 'x-user-id': userId }
    });
    const domData = await domRes.json();
    console.log('   Status:', domRes.ok ? '✅ OK' : '❌ FAILED');
    console.log('   Domains:', domData.data?.length || 0);
    if (domData.data && domData.data.length > 0) {
      domData.data.slice(0, 5).forEach(d => {
        console.log(`     - ${d.name}`);
      });
    }
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
  }
  
  // Test 6: Multi-query search (different topics)
  console.log('\n6️⃣ Testing Multi-topic Search...');
  const queries = [
    'real estate vung tau',
    'javascript coding standards', 
    'API authentication'
  ];
  
  for (const q of queries) {
    try {
      const res = await fetch(API + '/api/brain/knowledge/search?q=' + encodeURIComponent(q) + '&matchCount=2&userId=' + userId);
      const data = await res.json();
      console.log(`   🔍 "${q}"`);
      if (data.data && data.data.length > 0) {
        data.data.forEach(r => {
          console.log(`      → ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('      → No results');
      }
    } catch (e) {
      console.log(`      → Error: ${e.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ BRAIN E2E TEST COMPLETE');
}

testBrain().catch(console.error);
