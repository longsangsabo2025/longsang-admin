/**
 * Knowledge Management Script
 * - List, Update, Delete knowledge
 * - Regenerate embeddings after update
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
const EMBEDDING_MODEL = 'text-embedding-3-small'; // MUST match existing embeddings!

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.substring(0, 8000) // Max 8k chars
  });
  return response.data[0].embedding;
}

/**
 * List all knowledge items
 */
async function listKnowledge(domainFilter = null) {
  let query = `
    SELECT k.id, k.title, k.domain_id, d.name as domain_name,
           k.created_at, k.updated_at,
           CASE WHEN k.embedding IS NOT NULL THEN true ELSE false END as has_embedding,
           LENGTH(k.content) as content_length
    FROM brain_knowledge k
    LEFT JOIN brain_domains d ON k.domain_id = d.id
    WHERE k.user_id = $1
  `;
  const params = [USER_ID];
  
  if (domainFilter) {
    query += ` AND d.name ILIKE $2`;
    params.push(`%${domainFilter}%`);
  }
  
  query += ` ORDER BY d.name, k.title`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get single knowledge item by ID or title
 */
async function getKnowledge(idOrTitle) {
  const query = `
    SELECT k.*, d.name as domain_name
    FROM brain_knowledge k
    LEFT JOIN brain_domains d ON k.domain_id = d.id
    WHERE k.user_id = $1 AND (k.id::text = $2 OR k.title ILIKE $3)
  `;
  const result = await pool.query(query, [USER_ID, idOrTitle, `%${idOrTitle}%`]);
  return result.rows[0];
}

/**
 * Update knowledge content and regenerate embedding
 */
async function updateKnowledge(id, updates) {
  const { title, content, metadata } = updates;
  
  // Build update query dynamically
  const setClauses = [];
  const params = [id, USER_ID];
  let paramIndex = 3;
  
  if (title) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(title);
  }
  if (content) {
    setClauses.push(`content = $${paramIndex++}`);
    params.push(content);
  }
  if (metadata) {
    setClauses.push(`metadata = $${paramIndex++}`);
    params.push(JSON.stringify(metadata));
  }
  
  setClauses.push('updated_at = NOW()');
  
  const query = `
    UPDATE brain_knowledge 
    SET ${setClauses.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, params);
  const updated = result.rows[0];
  
  if (!updated) {
    throw new Error('Knowledge not found');
  }
  
  // Regenerate embedding with new content
  console.log('🔄 Regenerating embedding...');
  const textForEmbedding = (updated.title || title) + '\n\n' + (updated.content || content);
  const embedding = await generateEmbedding(textForEmbedding);
  
  await pool.query(
    `UPDATE brain_knowledge SET embedding = $1 WHERE id = $2`,
    ['[' + embedding.join(',') + ']', id]
  );
  
  console.log('✅ Knowledge updated with new embedding');
  return updated;
}

/**
 * Delete knowledge item
 */
async function deleteKnowledge(id) {
  const result = await pool.query(
    `DELETE FROM brain_knowledge WHERE id = $1 AND user_id = $2 RETURNING title`,
    [id, USER_ID]
  );
  return result.rows[0];
}

/**
 * Regenerate ALL embeddings (use when switching models)
 */
async function regenerateAllEmbeddings() {
  const items = await pool.query(
    `SELECT id, title, content FROM brain_knowledge WHERE user_id = $1`,
    [USER_ID]
  );
  
  console.log(`🔄 Regenerating ${items.rows.length} embeddings...\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const item of items.rows) {
    try {
      const text = item.title + '\n\n' + item.content;
      const embedding = await generateEmbedding(text);
      
      await pool.query(
        `UPDATE brain_knowledge SET embedding = $1, updated_at = NOW() WHERE id = $2`,
        ['[' + embedding.join(',') + ']', item.id]
      );
      
      console.log(`✅ ${item.title}`);
      success++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`❌ ${item.title}: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${success} success, ${failed} failed`);
}

/**
 * Search knowledge (for testing)
 */
async function searchKnowledge(query, threshold = 0.3) {
  const embedding = await generateEmbedding(query);
  
  const result = await pool.query(`
    SELECT title, content, 
           1 - (embedding <=> $1::vector) as similarity
    FROM brain_knowledge 
    WHERE user_id = $2
    ORDER BY embedding <=> $1::vector
    LIMIT 10
  `, ['[' + embedding.join(',') + ']', USER_ID]);
  
  return result.rows.filter(r => r.similarity >= threshold);
}

// ═══════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
  try {
    switch (command) {
      case 'list':
        console.log('📚 Knowledge Items:\n');
        const items = await listKnowledge(arg1); // optional domain filter
        items.forEach((item, i) => {
          const embIcon = item.has_embedding ? '✅' : '❌';
          console.log(`${i+1}. [${item.domain_name || 'No Domain'}] ${item.title}`);
          console.log(`   ID: ${item.id} | Embed: ${embIcon} | Size: ${item.content_length} chars`);
        });
        console.log(`\nTotal: ${items.length} items`);
        break;
        
      case 'get':
        if (!arg1) {
          console.log('Usage: node manage-knowledge.mjs get <id-or-title>');
          break;
        }
        const item = await getKnowledge(arg1);
        if (item) {
          console.log('\n📖 Knowledge Item:');
          console.log('─'.repeat(50));
          console.log(`Title: ${item.title}`);
          console.log(`Domain: ${item.domain_name}`);
          console.log(`ID: ${item.id}`);
          console.log(`Has Embedding: ${item.embedding ? 'Yes' : 'No'}`);
          console.log('─'.repeat(50));
          console.log('Content:');
          console.log(item.content);
        } else {
          console.log('❌ Not found');
        }
        break;
        
      case 'search':
        if (!arg1) {
          console.log('Usage: node manage-knowledge.mjs search "query"');
          break;
        }
        console.log(`🔍 Searching for: "${arg1}"\n`);
        const results = await searchKnowledge(arg1, parseFloat(arg2) || 0.3);
        results.forEach((r, i) => {
          console.log(`${i+1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
        });
        if (results.length === 0) {
          console.log('No results above threshold');
        }
        break;
        
      case 'delete':
        if (!arg1) {
          console.log('Usage: node manage-knowledge.mjs delete <id>');
          break;
        }
        const deleted = await deleteKnowledge(arg1);
        if (deleted) {
          console.log(`✅ Deleted: ${deleted.title}`);
        } else {
          console.log('❌ Not found');
        }
        break;
        
      case 'regenerate':
        await regenerateAllEmbeddings();
        break;
        
      default:
        console.log(`
╔════════════════════════════════════════════════════════════╗
║         🧠 BRAIN KNOWLEDGE MANAGEMENT SCRIPT               ║
╚════════════════════════════════════════════════════════════╝

Commands:
  list [domain]         - List all knowledge (optionally filter by domain)
  get <id-or-title>     - Get single knowledge item
  search "query" [threshold] - Search knowledge (default threshold: 0.3)
  delete <id>           - Delete knowledge item
  regenerate            - Regenerate ALL embeddings (use after model change)

Examples:
  node manage-knowledge.mjs list
  node manage-knowledge.mjs list SABO
  node manage-knowledge.mjs get "SABO Arena"
  node manage-knowledge.mjs search "tokenomics"
  node manage-knowledge.mjs search "real estate" 0.2
  node manage-knowledge.mjs delete abc123-uuid-here
  node manage-knowledge.mjs regenerate
`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
