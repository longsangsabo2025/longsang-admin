/**
 * 📚 BULK IMPORT SCRIPT - Feed the Brain
 * 
 * Imports all existing knowledge from:
 * 1. Sách đã đọc (.docx files from "Trợ lý đọc sách/")
 * 2. Marketing Skills (.md files from "marketingskills/skills/")
 * 3. CORE_LOGIC.md files from all projects
 * 4. README.md files from all projects
 * 5. AGENTS.md, SOUL.md knowledge files
 * 
 * Usage:
 *   node bulk-import.js              # Full import
 *   node bulk-import.js --dry-run    # Preview only, no writes
 *   node bulk-import.js --verbose    # Detailed logging
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const mammoth = require('mammoth');
const { chunkText, estimateTokens, needsChunking } = require('./text-chunker');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
  USER_ID: process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e',
  EMBEDDING_MODEL: 'text-embedding-3-small',
  PROJECTS_ROOT: path.resolve(__dirname, '..', '..', '..', '..'), // D:\0.PROJECTS
  DRY_RUN: process.argv.includes('--dry-run'),
  VERBOSE: process.argv.includes('--verbose'),
  CHUNK_MAX_TOKENS: 500,
  CHUNK_OVERLAP_TOKENS: 100,
  BATCH_SIZE: 5, // Embeddings per batch (rate limit friendly)
  DELAY_MS: 500, // Delay between batches
  DEDUP_THRESHOLD: 0.95, // Cosine similarity threshold for duplicates
};

// ═══════════════════════════════════════════════════════════════
// Sources to import
// ═══════════════════════════════════════════════════════════════

const IMPORT_SOURCES = [
  {
    name: '📚 Sách đã đọc',
    basePath: '00-MASTER-ADMIN/Trợ lý đọc sách',
    pattern: '**/*.docx',
    domain: 'books-reading',
    domainDescription: 'Kiến thức từ sách đã đọc - business, leadership, finance, productivity',
    contentType: 'document',
    importance: 4,
  },
  {
    name: '📈 Marketing Skills',
    basePath: '00-MASTER-ADMIN/marketingskills/skills',
    pattern: '**/*.md',
    domain: 'marketing-skills',
    domainDescription: 'Digital marketing skills, frameworks, và best practices',
    contentType: 'document',
    importance: 3,
  },
  {
    name: '🧠 CORE_LOGIC Files',
    basePath: '',
    globPaths: [
      '01-MAIN-PRODUCTS/*/CORE_LOGIC.md',
      '00-MASTER-ADMIN/apps/admin/CORE_LOGIC*.md',
    ],
    domain: 'project-core-logic',
    domainDescription: 'Core logic và kiến trúc từ các dự án - source of truth',
    contentType: 'code',
    importance: 5,
  },
  {
    name: '📖 README Files',
    basePath: '',
    globPaths: [
      '01-MAIN-PRODUCTS/*/README.md',
      '00-MASTER-ADMIN/*/README.md',
      '00-MASTER-ADMIN/apps/*/README.md',
    ],
    domain: 'project-documentation',
    domainDescription: 'Technical documentation và README từ các dự án',
    contentType: 'document',
    importance: 3,
  },
  {
    name: '🤖 AI Agent Knowledge',
    basePath: '',
    globPaths: [
      '01-MAIN-PRODUCTS/AGENTS.md',
      '01-MAIN-PRODUCTS/SOUL.md',
      '01-MAIN-PRODUCTS/TOOLS.md',
      '00-MASTER-ADMIN/apps/admin/BRAIN_*.md',
      '00-MASTER-ADMIN/apps/admin/SOLO_HUB_GUIDE.md',
      '00-MASTER-ADMIN/apps/admin/N8N_MCP_SETUP.md',
    ],
    domain: 'ai-agent-knowledge',
    domainDescription: 'AI Agent rules, configurations, brain system docs',
    contentType: 'document',
    importance: 4,
  },
];

// ═══════════════════════════════════════════════════════════════
// Initialize clients
// ═══════════════════════════════════════════════════════════════

let supabase, openai;

function initClients() {
  if (!CONFIG.SUPABASE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY or VITE_SUPABASE_ANON_KEY required in .env');
    process.exit(1);
  }
  if (!CONFIG.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY required in .env');
    process.exit(1);
  }
  
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  openai = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY });
  
  console.log(`✅ Supabase: ${CONFIG.SUPABASE_URL}`);
  console.log(`✅ OpenAI: text-embedding-3-small`);
  console.log(`✅ User: ${CONFIG.USER_ID}`);
  console.log(`✅ Projects root: ${CONFIG.PROJECTS_ROOT}`);
  if (CONFIG.DRY_RUN) console.log('⚠️  DRY RUN MODE — no data will be written\n');
}

// ═══════════════════════════════════════════════════════════════
// File discovery
// ═══════════════════════════════════════════════════════════════

function findFiles(basePath, extensions = ['.md', '.docx']) {
  const results = [];
  const fullPath = path.join(CONFIG.PROJECTS_ROOT, basePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️ Path not found: ${fullPath}`);
    return results;
  }

  function walk(dir, depth = 0) {
    if (depth > 5) return; // Prevent deep recursion
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullEntryPath = path.join(dir, entry.name);
        
        // Skip hidden dirs, node_modules, .git, build dirs
        if (entry.isDirectory()) {
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' || 
              entry.name === 'build' || 
              entry.name === 'dist' ||
              entry.name === '.venv') continue;
          walk(fullEntryPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            results.push(fullEntryPath);
          }
        }
      }
    } catch (e) {
      // Permission errors etc.
    }
  }

  walk(fullPath);
  return results;
}

function findGlobFiles(globPaths) {
  const results = [];
  for (const globPath of globPaths) {
    // Simple glob: replace * with directory listing
    const parts = globPath.split('/');
    let currentPaths = [CONFIG.PROJECTS_ROOT];
    
    for (const part of parts) {
      const nextPaths = [];
      for (const currentPath of currentPaths) {
        if (part === '*' || part === '**') {
          // List directories
          try {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory() && !entry.name.startsWith('.') && 
                  entry.name !== 'node_modules' && entry.name !== 'build') {
                nextPaths.push(path.join(currentPath, entry.name));
              }
            }
          } catch (e) { /* skip */ }
        } else {
          const next = path.join(currentPath, part);
          if (fs.existsSync(next)) {
            nextPaths.push(next);
          }
        }
      }
      currentPaths = nextPaths;
    }
    
    results.push(...currentPaths.filter(p => fs.existsSync(p) && fs.statSync(p).isFile()));
  }
  return [...new Set(results)]; // Deduplicate
}

// ═══════════════════════════════════════════════════════════════
// Content extraction
// ═══════════════════════════════════════════════════════════════

async function extractContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.docx') {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (e) {
      console.warn(`  ⚠️ Failed to extract .docx: ${path.basename(filePath)} — ${e.message}`);
      return null;
    }
  }
  
  if (ext === '.md' || ext === '.txt') {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

function extractTitle(filePath, content) {
  const basename = path.basename(filePath, path.extname(filePath));
  
  // Try to extract title from markdown h1
  const h1Match = content?.match(/^#\s+(.+)/m);
  if (h1Match) return h1Match[1].trim();
  
  // Try from docx first line
  const firstLine = content?.split('\n').find(l => l.trim().length > 3);
  if (firstLine && firstLine.length < 200) return firstLine.trim();
  
  // Fallback to filename
  return basename.replace(/[-_]/g, ' ');
}

// ═══════════════════════════════════════════════════════════════
// Embedding generation
// ═══════════════════════════════════════════════════════════════

async function generateEmbedding(text) {
  const truncated = text.substring(0, 8000);
  const response = await openai.embeddings.create({
    model: CONFIG.EMBEDDING_MODEL,
    input: truncated,
  });
  return response.data[0].embedding;
}

async function generateEmbeddingsBatch(texts) {
  const results = [];
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    const batch = texts.slice(i, i + CONFIG.BATCH_SIZE);
    const truncated = batch.map(t => t.substring(0, 8000));
    
    const response = await openai.embeddings.create({
      model: CONFIG.EMBEDDING_MODEL,
      input: truncated,
    });
    
    results.push(...response.data.map(d => d.embedding));
    
    if (i + CONFIG.BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, CONFIG.DELAY_MS));
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// Domain management
// ═══════════════════════════════════════════════════════════════

const domainCache = {};

async function ensureDomain(domainSlug, description = '') {
  if (domainCache[domainSlug]) return domainCache[domainSlug];
  
  // Check if exists
  const { data: existing } = await supabase
    .from('brain_domains')
    .select('id')
    .eq('user_id', CONFIG.USER_ID)
    .eq('name', domainSlug)
    .single();
  
  if (existing) {
    domainCache[domainSlug] = existing.id;
    return existing.id;
  }
  
  if (CONFIG.DRY_RUN) {
    domainCache[domainSlug] = 'dry-run-id';
    return 'dry-run-id';
  }
  
  // Create domain
  const { data: created, error } = await supabase
    .from('brain_domains')
    .insert({
      user_id: CONFIG.USER_ID,
      name: domainSlug,
      description: description,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`  ❌ Failed to create domain "${domainSlug}": ${error.message}`);
    return null;
  }
  
  domainCache[domainSlug] = created.id;
  console.log(`  ✨ Created domain: ${domainSlug}`);
  return created.id;
}

// ═══════════════════════════════════════════════════════════════
// Duplicate detection
// ═══════════════════════════════════════════════════════════════

async function isDuplicate(title, domainId) {
  const { data } = await supabase
    .from('brain_knowledge')
    .select('id, title')
    .eq('user_id', CONFIG.USER_ID)
    .eq('domain_id', domainId)
    .ilike('title', `%${title.substring(0, 50)}%`)
    .limit(1);
  
  return data && data.length > 0;
}

// ═══════════════════════════════════════════════════════════════
// Knowledge insertion
// ═══════════════════════════════════════════════════════════════

async function insertKnowledge(item) {
  if (CONFIG.DRY_RUN) return true;
  
  const { data, error } = await supabase
    .from('brain_knowledge')
    .insert({
      user_id: CONFIG.USER_ID,
      domain_id: item.domainId,
      title: item.title,
      content: item.content,
      content_type: item.contentType || 'document',
      source_url: item.sourceFile || null,
      tags: item.tags || [],
      importance_score: item.importance || 3,
      embedding: item.embedding ? `[${item.embedding.join(',')}]` : null,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`  ❌ Insert failed: ${item.title.substring(0, 50)} — ${error.message}`);
    return false;
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Main import logic
// ═══════════════════════════════════════════════════════════════

async function processSource(source) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${source.name}`);
  console.log(`${'═'.repeat(60)}`);
  
  // Find files
  let files = [];
  if (source.basePath) {
    const extensions = source.pattern?.includes('.docx') ? ['.docx'] : ['.md'];
    files = findFiles(source.basePath, extensions);
  }
  if (source.globPaths) {
    files = [...files, ...findGlobFiles(source.globPaths)];
  }
  
  if (files.length === 0) {
    console.log('  No files found.');
    return { processed: 0, chunks: 0, skipped: 0 };
  }
  
  console.log(`  Found ${files.length} files`);
  
  // Ensure domain exists
  const domainId = await ensureDomain(source.domain, source.domainDescription);
  if (!domainId) return { processed: 0, chunks: 0, skipped: 0 };
  
  let processed = 0, totalChunks = 0, skipped = 0;
  
  for (const filePath of files) {
    const relativePath = path.relative(CONFIG.PROJECTS_ROOT, filePath);
    const content = await extractContent(filePath);
    
    if (!content || content.trim().length < 50) {
      if (CONFIG.VERBOSE) console.log(`  ⏭️ Skip (too short): ${relativePath}`);
      skipped++;
      continue;
    }
    
    const title = extractTitle(filePath, content);
    
    // Check for duplicates
    const dup = await isDuplicate(title, domainId);
    if (dup) {
      if (CONFIG.VERBOSE) console.log(`  ⏭️ Skip (duplicate): ${title}`);
      skipped++;
      continue;
    }
    
    // Chunk if needed
    const chunks = chunkText(content, {
      maxTokens: CONFIG.CHUNK_MAX_TOKENS,
      overlapTokens: CONFIG.CHUNK_OVERLAP_TOKENS,
      title: title,
    });
    
    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(c => c.text);
    let embeddings = [];
    
    if (!CONFIG.DRY_RUN) {
      try {
        embeddings = await generateEmbeddingsBatch(chunkTexts);
      } catch (e) {
        console.error(`  ❌ Embedding failed for ${title}: ${e.message}`);
        continue;
      }
    }
    
    // Insert each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = chunks.length > 1 
        ? `${title} [${i + 1}/${chunks.length}]` 
        : title;
      
      const success = await insertKnowledge({
        domainId,
        title: chunkTitle,
        content: chunks[i].text,
        contentType: source.contentType,
        sourceFile: relativePath,
        tags: [source.domain, path.extname(filePath).replace('.', '')],
        importance: source.importance,
        embedding: embeddings[i] || null,
      });
      
      if (success) totalChunks++;
    }
    
    processed++;
    const tokens = estimateTokens(content);
    console.log(`  ✅ ${title} (${tokens} tokens → ${chunks.length} chunks)`);
  }
  
  return { processed, chunks: totalChunks, skipped };
}

// ═══════════════════════════════════════════════════════════════
// Entry point
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🧠 BRAIN BULK IMPORT — Feed the Second Brain v3.0     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  initClients();
  
  // Get current Brain stats
  const { count: currentCount } = await supabase
    .from('brain_knowledge')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', CONFIG.USER_ID);
  
  console.log(`📊 Current Brain items: ${currentCount || 0}`);
  console.log('');
  
  const results = {};
  let totalProcessed = 0, totalChunks = 0, totalSkipped = 0;
  
  for (const source of IMPORT_SOURCES) {
    const result = await processSource(source);
    results[source.name] = result;
    totalProcessed += result.processed;
    totalChunks += result.chunks;
    totalSkipped += result.skipped;
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('═'.repeat(60));
  
  for (const [name, result] of Object.entries(results)) {
    console.log(`  ${name}: ${result.processed} files → ${result.chunks} chunks (${result.skipped} skipped)`);
  }
  
  console.log(`\n  TOTAL: ${totalProcessed} files → ${totalChunks} chunks imported`);
  console.log(`  Skipped: ${totalSkipped} (duplicates or empty)`);
  
  if (!CONFIG.DRY_RUN) {
    const { count: newCount } = await supabase
      .from('brain_knowledge')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', CONFIG.USER_ID);
    
    console.log(`\n  Brain items: ${currentCount || 0} → ${newCount || 0} (+${(newCount || 0) - (currentCount || 0)})`);
  } else {
    console.log('\n  ⚠️  DRY RUN — no data was written. Run without --dry-run to import.');
  }
  
  console.log('\n✅ Done!\n');
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e);
  process.exit(1);
});
