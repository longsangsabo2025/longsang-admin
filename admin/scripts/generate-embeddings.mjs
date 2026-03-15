/**
 * Generate embeddings for knowledge items missing embeddings
 */

import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

async function main() {
  console.log('🧬 GENERATING EMBEDDINGS FOR NEW KNOWLEDGE...\n');
  
  const missing = await pool.query(
    'SELECT id, title, content FROM brain_knowledge WHERE embedding IS NULL'
  );
  
  console.log(`Found ${missing.rows.length} items without embeddings\n`);
  
  if (missing.rows.length === 0) {
    console.log('✅ All items have embeddings!');
    await pool.end();
    return;
  }
  
  let success = 0;
  let failed = 0;
  
  for (const item of missing.rows) {
    try {
      const text = item.title + '\n\n' + item.content;
      const response = await fetch('http://localhost:3001/api/brain/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 8000) })
      });
      
      if (!response.ok) {
        const err = await response.text();
        console.log(`❌ Failed: ${item.title} - ${err}`);
        failed++;
        continue;
      }
      
      const data = await response.json();
      
      if (!data.embedding) {
        console.log(`❌ No embedding returned for: ${item.title}`);
        failed++;
        continue;
      }
      
      await pool.query(
        'UPDATE brain_knowledge SET embedding = $1 WHERE id = $2',
        [`[${data.embedding.join(',')}]`, item.id]
      );
      
      console.log(`✅ ${item.title}`);
      success++;
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`❌ Error for ${item.title}: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${success} success, ${failed} failed`);
  
  const total = await pool.query('SELECT COUNT(*) FROM brain_knowledge');
  const withEmb = await pool.query('SELECT COUNT(*) FROM brain_knowledge WHERE embedding IS NOT NULL');
  console.log(`Total with embeddings: ${withEmb.rows[0].count}/${total.rows[0].count}`);
  
  await pool.end();
}

main();
