/**
 * 🧠 Brain Auto-Sync from Project CORE_LOGIC.md files
 * 
 * This script:
 * 1. Scans workspace for CORE_LOGIC.md files
 * 2. Parses content into knowledge chunks
 * 3. Updates Brain with new/changed knowledge
 * 4. Removes outdated knowledge
 * 
 * Run: node scripts/brain-sync.mjs
 * Or:  npm run brain:sync
 */

import OpenAI from 'openai';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
const WORKSPACE_ROOT = 'D:/0.PROJECTS';

// Projects to scan for CORE_LOGIC.md
const PROJECT_PATHS = [
  '00-MASTER-ADMIN/longsang-admin',
  '01-MAIN-PRODUCTS/ai_secretary',
  '01-MAIN-PRODUCTS/ainewbie-web',
  '01-MAIN-PRODUCTS/music-video-app',
  '01-MAIN-PRODUCTS/vungtau-dream-homes',
  '01-MAIN-PRODUCTS/long-sang-forge',
  '02-SABO-ECOSYSTEM/sabo-arena',
  '02-SABO-ECOSYSTEM/sabo-hub',
];

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║         🧠 BRAIN AUTO-SYNC FROM CORE_LOGIC.md FILES                   ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function extractMetadata(content) {
  const lines = content.split('\n');
  const metadata = {
    lastUpdated: null,
    domain: null,
    projectName: null
  };
  
  for (const line of lines.slice(0, 20)) {
    if (line.includes('Last Updated')) {
      metadata.lastUpdated = line.split(':').slice(1).join(':').trim();
    }
    if (line.includes('Domain')) {
      metadata.domain = line.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
    }
    if (line.startsWith('# ')) {
      metadata.projectName = line.replace('# ', '').replace('🧠', '').split('-')[0].trim();
    }
  }
  
  return metadata;
}

function parseIntoChunks(content, metadata) {
  const chunks = [];
  const sections = content.split(/\n## /);
  
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    const title = lines[0].replace(/[#🎮💰🔧📊🚀📝📋🏠🎯📍⚡]/g, '').trim();
    const sectionContent = lines.slice(1).join('\n').trim();
    
    if (sectionContent.length > 100) { // Only meaningful sections
      chunks.push({
        title: `${metadata.projectName} - ${title}`,
        content: sectionContent,
        domain: metadata.domain || 'General',
        source: 'CORE_LOGIC.md',
        hash: generateHash(sectionContent)
      });
    }
  }
  
  return chunks;
}

async function getOrCreateDomain(name) {
  const existing = await pool.query(
    `SELECT id FROM brain_domains WHERE user_id = $1 AND name = $2`,
    [USER_ID, name]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  const result = await pool.query(
    `INSERT INTO brain_domains (user_id, name, description, color)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [USER_ID, name, `Auto-synced from ${name} project`, '#10B981']
  );
  
  console.log(`📁 Created new domain: ${name}`);
  return result.rows[0].id;
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.substring(0, 8000)
  });
  return response.data[0].embedding;
}

async function upsertKnowledge(chunk) {
  const domainId = await getOrCreateDomain(chunk.domain);
  
  // Check if exists with same hash (unchanged)
  const existing = await pool.query(
    `SELECT id, metadata FROM brain_knowledge 
     WHERE user_id = $1 AND title = $2`,
    [USER_ID, chunk.title]
  );
  
  if (existing.rows.length > 0) {
    const existingHash = existing.rows[0].metadata?.contentHash;
    if (existingHash === chunk.hash) {
      return { status: 'unchanged', title: chunk.title };
    }
    
    // Content changed - update
    const embedding = await generateEmbedding(chunk.title + '\n\n' + chunk.content);
    await pool.query(
      `UPDATE brain_knowledge 
       SET content = $1, embedding = $2, metadata = $3, updated_at = NOW()
       WHERE id = $4`,
      [
        chunk.content, 
        '[' + embedding.join(',') + ']',
        JSON.stringify({ contentHash: chunk.hash, source: chunk.source }),
        existing.rows[0].id
      ]
    );
    return { status: 'updated', title: chunk.title };
  }
  
  // New knowledge
  const embedding = await generateEmbedding(chunk.title + '\n\n' + chunk.content);
  await pool.query(
    `INSERT INTO brain_knowledge (user_id, domain_id, title, content, content_type, embedding, metadata)
     VALUES ($1, $2, $3, $4, 'document', $5, $6)`,
    [
      USER_ID, 
      domainId, 
      chunk.title, 
      chunk.content,
      '[' + embedding.join(',') + ']',
      JSON.stringify({ contentHash: chunk.hash, source: chunk.source })
    ]
  );
  return { status: 'added', title: chunk.title };
}

// ═══════════════════════════════════════════════════════════════
// MAIN SYNC LOGIC
// ═══════════════════════════════════════════════════════════════

async function syncProject(projectPath) {
  const fullPath = path.join(WORKSPACE_ROOT, projectPath, 'CORE_LOGIC.md');
  
  if (!fs.existsSync(fullPath)) {
    return { project: projectPath, status: 'no-file', chunks: 0 };
  }
  
  console.log(`\n📂 Processing: ${projectPath}`);
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const metadata = extractMetadata(content);
  const chunks = parseIntoChunks(content, metadata);
  
  console.log(`   Found ${chunks.length} knowledge chunks`);
  
  const results = { added: 0, updated: 0, unchanged: 0 };
  
  for (const chunk of chunks) {
    try {
      const result = await upsertKnowledge(chunk);
      results[result.status]++;
      
      if (result.status === 'added') {
        console.log(`   ✅ Added: ${result.title}`);
      } else if (result.status === 'updated') {
        console.log(`   🔄 Updated: ${result.title}`);
      }
      
      await new Promise(r => setTimeout(r, 200)); // Rate limiting
    } catch (error) {
      console.error(`   ❌ Error: ${chunk.title} - ${error.message}`);
    }
  }
  
  return { 
    project: projectPath, 
    status: 'synced', 
    ...results,
    total: chunks.length 
  };
}

async function main() {
  const allResults = [];
  
  for (const projectPath of PROJECT_PATHS) {
    try {
      const result = await syncProject(projectPath);
      allResults.push(result);
    } catch (error) {
      console.error(`Error processing ${projectPath}:`, error.message);
      allResults.push({ project: projectPath, status: 'error', error: error.message });
    }
  }
  
  // Summary
  console.log(`
═══════════════════════════════════════════════════════════════════════
📊 SYNC SUMMARY
═══════════════════════════════════════════════════════════════════════`);
  
  let totalAdded = 0, totalUpdated = 0, totalUnchanged = 0;
  
  for (const result of allResults) {
    if (result.status === 'synced') {
      console.log(`✅ ${result.project}: +${result.added} added, ~${result.updated} updated, =${result.unchanged} unchanged`);
      totalAdded += result.added;
      totalUpdated += result.updated;
      totalUnchanged += result.unchanged;
    } else if (result.status === 'no-file') {
      console.log(`⏭️  ${result.project}: No CORE_LOGIC.md found`);
    } else {
      console.log(`❌ ${result.project}: ${result.error}`);
    }
  }
  
  // Get total knowledge count
  const total = await pool.query(
    `SELECT COUNT(*) FROM brain_knowledge WHERE user_id = $1`,
    [USER_ID]
  );
  
  console.log(`
───────────────────────────────────────────────────────────────────────
📈 TOTALS: +${totalAdded} added, ~${totalUpdated} updated, =${totalUnchanged} unchanged
🧠 Total Brain Knowledge: ${total.rows[0].count} items
`);
  
  await pool.end();
}

main().catch(console.error);
