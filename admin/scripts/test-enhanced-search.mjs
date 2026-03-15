/**
 * Test Enhanced Search with LLM Re-ranking
 * This should achieve 90%+ relevance!
 */

import OpenAI from 'openai';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

const USER_ID = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';
const EMBEDDING_MODEL = 'text-embedding-3-small';

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║         🎯 TEST ENHANCED SEARCH WITH 90%+ RELEVANCE                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function vectorSearch(query, limit = 10) {
  const embRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query
  });
  const embedding = embRes.data[0].embedding;
  
  const result = await pool.query(`
    SELECT id, title, content, 
           1 - (embedding <=> $1::vector) as similarity
    FROM brain_knowledge 
    WHERE user_id = $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `, ['[' + embedding.join(',') + ']', USER_ID, limit]);
  
  return result.rows;
}

async function rerankWithLLM(query, results, topK = 5) {
  const resultsForEval = results.slice(0, 15).map((r, i) => ({
    index: i,
    title: r.title,
    content: (r.content || '').substring(0, 500)
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a relevance scoring expert. Score each search result for how well it answers the user's query.

Output format: JSON array of objects with "index" and "score" (0-100).
Only include results with score >= 50.
Sort by score descending.

Example output:
[{"index": 2, "score": 95}, {"index": 0, "score": 82}]`
      },
      {
        role: 'user',
        content: `Query: "${query}"

Search Results:
${resultsForEval.map(r => `[${r.index}] ${r.title}\n${r.content}`).join('\n\n---\n\n')}

Score each result's relevance (0-100). Return JSON array only.`
      }
    ],
    max_tokens: 500,
    temperature: 0
  });

  const responseText = response.choices[0].message.content.trim();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  
  if (!jsonMatch) {
    console.warn('No valid JSON in response');
    return results.slice(0, topK);
  }

  const scores = JSON.parse(jsonMatch[0]);
  
  return scores
    .filter(s => s.score >= 50)
    .slice(0, topK)
    .map(s => ({
      ...results[s.index],
      llmScore: s.score,
      originalSimilarity: results[s.index].similarity
    }));
}

// ═══════════════════════════════════════════════════════════════
// TEST QUERIES
// ═══════════════════════════════════════════════════════════════

const testQueries = [
  'SABO là gì?',
  'tokenomics của dự án',
  'cách tính giá bất động sản',
  'how to setup development environment',
  'real estate investment calculator'
];

console.log('Testing Enhanced Search with LLM Re-ranking...\n');

for (const query of testQueries) {
  console.log('━'.repeat(70));
  console.log(`🔍 Query: "${query}"`);
  console.log('━'.repeat(70));
  
  // Step 1: Basic vector search
  const vectorResults = await vectorSearch(query, 10);
  
  console.log('\n📊 Vector Search Results:');
  vectorResults.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
  });
  
  // Step 2: LLM Re-ranking
  console.log('\n🎯 After LLM Re-ranking:');
  const rerankedResults = await rerankWithLLM(query, vectorResults, 5);
  
  if (rerankedResults.length === 0) {
    console.log('  No results above 50% relevance threshold');
  } else {
    rerankedResults.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.title}`);
      console.log(`     LLM Score: ${r.llmScore}% | Vector: ${(r.originalSimilarity * 100).toFixed(1)}%`);
    });
    
    // Check if we achieved 90%+
    const maxScore = Math.max(...rerankedResults.map(r => r.llmScore));
    if (maxScore >= 90) {
      console.log(`\n  ✅ Achieved 90%+ relevance! (${maxScore}%)`);
    } else if (maxScore >= 70) {
      console.log(`\n  ⚠️ Good relevance (${maxScore}%) - consider adding more specific knowledge`);
    } else {
      console.log(`\n  ❌ Low relevance (${maxScore}%) - knowledge gap detected`);
    }
  }
  
  console.log('\n');
  
  // Rate limiting
  await new Promise(r => setTimeout(r, 1000));
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════

console.log('═'.repeat(70));
console.log('📋 HOW TO USE ENHANCED SEARCH IN YOUR APP');
console.log('═'.repeat(70));
console.log(`
1. Via API:
   GET /api/brain/knowledge/search?q=your+query&enhanced=true

   Options:
   - enhanced=true : Enable LLM re-ranking
   - rerank=true   : Alias for enhanced
   - expand=true   : Enable query expansion (default: true)

2. Parameters:
   - matchThreshold: 0.3 (lower to get more candidates)
   - matchCount: 10 (number of final results)

3. Response includes:
   - llmScore: 0-100 relevance score from LLM
   - similarity: Original vector similarity
   - title, content, etc.

Example curl:
   curl "http://localhost:3001/api/brain/knowledge/search?q=SABO&enhanced=true&userId=${USER_ID}"
`);

await pool.end();
console.log('\n✅ Test complete!');
