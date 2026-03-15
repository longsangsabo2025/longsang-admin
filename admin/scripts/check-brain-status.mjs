/**
 * Brain Status Check - Complete overview of AI Second Brain
 */

import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

async function main() {
  console.log('═'.repeat(60));
  console.log('🧠 AI SECOND BRAIN - STATUS CHECK');
  console.log('═'.repeat(60));
  
  try {
    // 1. Check Domains
    console.log('\n📁 DOMAINS:');
    console.log('─'.repeat(40));
    const domains = await pool.query(`
      SELECT id, name, description, icon, color
      FROM brain_domains 
      ORDER BY name
    `);
    
    if (domains.rows.length === 0) {
      console.log('  ⚠️  No domains found - need to create domains first!');
    } else {
      // Get knowledge count per domain
      const domainCounts = await pool.query(`
        SELECT domain_id, COUNT(*) as count 
        FROM brain_knowledge 
        GROUP BY domain_id
      `);
      const countMap = {};
      domainCounts.rows.forEach(r => { countMap[r.domain_id] = r.count; });
      
      domains.rows.forEach(d => {
        const count = countMap[d.id] || 0;
        console.log(`  ${d.icon || '📂'} ${d.name}`);
        console.log(`     Items: ${count} | ${d.description?.substring(0, 50) || 'No description'}...`);
      });
    }
    
    // 2. Check Knowledge Items
    console.log('\n📚 KNOWLEDGE:');
    console.log('─'.repeat(40));
    const knowledge = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge');
    const withEmbeddings = await pool.query('SELECT COUNT(*) as count FROM brain_knowledge WHERE embedding IS NOT NULL');
    console.log(`  Total Items: ${knowledge.rows[0].count}`);
    console.log(`  With Embeddings: ${withEmbeddings.rows[0].count}`);
    
    // By content type
    const byType = await pool.query(`
      SELECT content_type, COUNT(*) as count 
      FROM brain_knowledge 
      GROUP BY content_type 
      ORDER BY count DESC
    `);
    console.log('\n  By Content Type:');
    byType.rows.forEach(r => {
      console.log(`    - ${r.content_type}: ${r.count}`);
    });
    
    // By domain
    console.log('\n  By Domain:');
    const byDomain = await pool.query(`
      SELECT d.name, COUNT(k.id) as count
      FROM brain_domains d
      LEFT JOIN brain_knowledge k ON k.domain_id = d.id
      GROUP BY d.id, d.name
      ORDER BY count DESC
    `);
    byDomain.rows.forEach(r => {
      console.log(`    - ${r.name}: ${r.count}`);
    });
    
    // 3. Recent Knowledge
    console.log('\n🕐 RECENT KNOWLEDGE (last 10):');
    console.log('─'.repeat(40));
    const recent = await pool.query(`
      SELECT k.title, k.content_type, d.name as domain, k.created_at
      FROM brain_knowledge k
      LEFT JOIN brain_domains d ON d.id = k.domain_id
      ORDER BY k.created_at DESC
      LIMIT 10
    `);
    recent.rows.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString('vi-VN');
      console.log(`  - ${r.title}`);
      console.log(`    [${r.content_type}] Domain: ${r.domain || 'None'} | ${date}`);
    });
    
    // 4. Check Functions
    console.log('\n⚙️  DATABASE FUNCTIONS:');
    console.log('─'.repeat(40));
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name IN ('match_knowledge', 'match_documents')
      AND routine_schema = 'public'
    `);
    if (functions.rows.length > 0) {
      functions.rows.forEach(f => console.log(`  ✅ ${f.routine_name}`));
    } else {
      console.log('  ⚠️  No search functions found!');
    }
    
    // 5. Test Vector Search
    console.log('\n🔍 VECTOR SEARCH TEST:');
    console.log('─'.repeat(40));
    try {
      const testResult = await pool.query(`
        SELECT id, title, 
          1 - (embedding <=> (SELECT embedding FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1)) as similarity
        FROM brain_knowledge
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> (SELECT embedding FROM brain_knowledge WHERE embedding IS NOT NULL LIMIT 1)
        LIMIT 5
      `);
      
      testResult.rows.forEach(r => {
        console.log(`  - ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
      });
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`  Domains: ${domains.rows.length}`);
    console.log(`  Knowledge Items: ${knowledge.rows[0].count}`);
    console.log(`  With Embeddings: ${withEmbeddings.rows[0].count}`);
    console.log(`  Search Ready: ${functions.rows.length > 0 ? '✅ Yes' : '❌ No'}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (domains.rows.length === 0) {
      console.log('  1. Run setup-brain-knowledge.js to create domains');
    }
    if (knowledge.rows[0].count < 50) {
      console.log('  2. Add more knowledge (current: ' + knowledge.rows[0].count + ', recommended: 50+)');
    }
    const noEmbeddings = knowledge.rows[0].count - withEmbeddings.rows[0].count;
    if (noEmbeddings > 0) {
      console.log(`  3. Generate embeddings for ${noEmbeddings} items`);
    }
    
    console.log('\n' + '═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await pool.end();
}

main();
