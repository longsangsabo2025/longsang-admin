/**
 * 🧹 BRAIN CLEANUP STRATEGY
 * 
 * First Principles Approach:
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * PROBLEM: Brain có 194 items hỗn hợp (cũ + mới), không có cơ chế cleanup
 * 
 * SOLUTION: Single Source of Truth
 * - CORE_LOGIC.md files = nguồn duy nhất cho project knowledge
 * - Tất cả knowledge khác = thủ công hoặc deprecated
 * 
 * STRATEGY:
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 1. CATEGORIZE knowledge items:
 *    - SOURCE: "CORE_LOGIC.md" → Keep & update
 *    - SOURCE: manual/other → Review & decide
 * 
 * 2. MARK items với metadata:
 *    - contentHash: để detect changes
 *    - source: "CORE_LOGIC.md" | "manual" | "deprecated"
 *    - lastSyncedAt: timestamp
 * 
 * 3. CLEANUP LOGIC:
 *    - Items từ CORE_LOGIC.md nhưng không còn trong file → DELETE
 *    - Items manual nhưng outdated > 30 days → FLAG for review
 *    - Items deprecated → DELETE after confirmation
 * 
 * 4. SYNC WORKFLOW:
 *    a. Scan all CORE_LOGIC.md files
 *    b. Generate expected titles
 *    c. Compare with existing titles
 *    d. DELETE orphaned items (in CORE_LOGIC source but removed from file)
 *    e. UPSERT current items
 *    f. Report summary
 * 
 * ═══════════════════════════════════════════════════════════════════════
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
║   🧹 BRAIN CLEANUP - Single Source of Truth Strategy                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

// ═══════════════════════════════════════════════════════════════
// STEP 1: Analyze current state
// ═══════════════════════════════════════════════════════════════

async function analyzeCurrentState() {
  console.log('\n📊 STEP 1: Analyzing current Brain state...\n');
  
  const all = await pool.query(`
    SELECT 
      k.id, k.title, k.metadata, k.created_at, k.updated_at,
      d.name as domain
    FROM brain_knowledge k
    JOIN brain_domains d ON k.domain_id = d.id
    WHERE k.user_id = $1
    ORDER BY k.title
  `, [USER_ID]);
  
  const coreLogicItems = [];
  const manualItems = [];
  const unknownItems = [];
  
  for (const item of all.rows) {
    const source = item.metadata?.source;
    if (source === 'CORE_LOGIC.md') {
      coreLogicItems.push(item);
    } else if (source) {
      manualItems.push(item);
    } else {
      unknownItems.push(item);
    }
  }
  
  console.log(`   Total items: ${all.rows.length}`);
  console.log(`   - From CORE_LOGIC.md: ${coreLogicItems.length}`);
  console.log(`   - Manual/Other source: ${manualItems.length}`);
  console.log(`   - Unknown source: ${unknownItems.length}`);
  
  return { all: all.rows, coreLogicItems, manualItems, unknownItems };
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Get expected items from CORE_LOGIC.md files
// ═══════════════════════════════════════════════════════════════

function extractMetadata(content) {
  const lines = content.split('\n');
  const metadata = { lastUpdated: null, domain: null, projectName: null };
  
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
    
    if (sectionContent.length > 100) {
      chunks.push({
        title: `${metadata.projectName} - ${title}`,
        content: sectionContent,
        domain: metadata.domain || 'General',
        source: 'CORE_LOGIC.md'
      });
    }
  }
  
  return chunks;
}

async function getExpectedItems() {
  console.log('\n📂 STEP 2: Scanning CORE_LOGIC.md files...\n');
  
  const expectedTitles = new Set();
  
  for (const projectPath of PROJECT_PATHS) {
    const fullPath = path.join(WORKSPACE_ROOT, projectPath, 'CORE_LOGIC.md');
    
    if (!fs.existsSync(fullPath)) {
      console.log(`   ⏭️  ${projectPath}: No CORE_LOGIC.md`);
      continue;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const metadata = extractMetadata(content);
    const chunks = parseIntoChunks(content, metadata);
    
    chunks.forEach(c => expectedTitles.add(c.title));
    console.log(`   ✅ ${projectPath}: ${chunks.length} sections`);
  }
  
  console.log(`\n   Total expected items from CORE_LOGIC.md: ${expectedTitles.size}`);
  return expectedTitles;
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: Find orphaned items (in DB but not in CORE_LOGIC.md)
// ═══════════════════════════════════════════════════════════════

async function findOrphanedItems(state, expectedTitles) {
  console.log('\n🔍 STEP 3: Finding orphaned items...\n');
  
  const orphaned = state.coreLogicItems.filter(item => !expectedTitles.has(item.title));
  
  if (orphaned.length > 0) {
    console.log(`   Found ${orphaned.length} orphaned items (was in CORE_LOGIC.md but now removed):`);
    orphaned.forEach(item => {
      console.log(`   ❌ ${item.title}`);
    });
  } else {
    console.log('   ✅ No orphaned CORE_LOGIC.md items');
  }
  
  return orphaned;
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: Categorize non-CORE_LOGIC items
// ═══════════════════════════════════════════════════════════════

async function categorizeOtherItems(state) {
  console.log('\n📋 STEP 4: Categorizing non-CORE_LOGIC items...\n');
  
  const otherItems = [...state.manualItems, ...state.unknownItems];
  
  // Categorize by content patterns
  const categories = {
    valuable: [],      // Business rules, operations, guides - KEEP
    redundant: [],     // Duplicates old CORE_LOGIC content - DELETE
    deprecated: []     // Old project info - DELETE
  };
  
  const valuablePatterns = [
    /Business Rule/i,
    /Operations/i,
    /Setup/i,
    /Troubleshoot/i,
    /Best Practices/i,
    /How to/i,
    /Guide/i,
    /Security/i,
    /Checklist/i
  ];
  
  const redundantPatterns = [
    /Overview$/i,
    /Architecture$/i,
    /Project Structure/i,
    /Tech Stack/i,
    /Features$/i
  ];
  
  for (const item of otherItems) {
    const isValuable = valuablePatterns.some(p => p.test(item.title));
    const isRedundant = redundantPatterns.some(p => p.test(item.title));
    
    if (isValuable && !isRedundant) {
      categories.valuable.push(item);
    } else if (isRedundant) {
      categories.redundant.push(item);
    } else {
      // Check if it's a generic/old item
      const daysSinceUpdate = Math.floor((Date.now() - new Date(item.updated_at)) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 30) {
        categories.deprecated.push(item);
      } else {
        categories.valuable.push(item);
      }
    }
  }
  
  console.log(`   📗 Valuable (KEEP): ${categories.valuable.length} items`);
  categories.valuable.forEach(i => console.log(`      ✅ ${i.title}`));
  
  console.log(`\n   📕 Redundant (DELETE): ${categories.redundant.length} items`);
  categories.redundant.forEach(i => console.log(`      ❌ ${i.title}`));
  
  console.log(`\n   📙 Deprecated (REVIEW): ${categories.deprecated.length} items`);
  categories.deprecated.forEach(i => console.log(`      ⚠️  ${i.title}`));
  
  return categories;
}

// ═══════════════════════════════════════════════════════════════
// STEP 5: Execute cleanup (with confirmation)
// ═══════════════════════════════════════════════════════════════

async function executeCleanup(orphaned, categories, dryRun = true) {
  console.log(`\n🧹 STEP 5: ${dryRun ? 'DRY RUN - ' : ''}Executing cleanup...\n`);
  
  const toDelete = [
    ...orphaned,
    ...categories.redundant
  ];
  
  if (toDelete.length === 0) {
    console.log('   ✅ Nothing to delete!');
    return { deleted: 0 };
  }
  
  console.log(`   Items to delete: ${toDelete.length}`);
  
  if (dryRun) {
    console.log('\n   🔸 DRY RUN - No actual deletions. Run with --execute to apply.\n');
    toDelete.forEach(item => console.log(`      Would delete: ${item.title}`));
    return { deleted: 0, wouldDelete: toDelete.length };
  }
  
  // Actually delete
  let deleted = 0;
  for (const item of toDelete) {
    try {
      await pool.query('DELETE FROM brain_knowledge WHERE id = $1', [item.id]);
      console.log(`   🗑️  Deleted: ${item.title}`);
      deleted++;
    } catch (error) {
      console.log(`   ❌ Failed to delete ${item.title}: ${error.message}`);
    }
  }
  
  return { deleted };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  
  try {
    // Step 1: Analyze current state
    const state = await analyzeCurrentState();
    
    // Step 2: Get expected items from CORE_LOGIC.md
    const expectedTitles = await getExpectedItems();
    
    // Step 3: Find orphaned items
    const orphaned = await findOrphanedItems(state, expectedTitles);
    
    // Step 4: Categorize other items
    const categories = await categorizeOtherItems(state);
    
    // Step 5: Execute cleanup
    const result = await executeCleanup(orphaned, categories, !execute);
    
    // Summary
    console.log(`
═══════════════════════════════════════════════════════════════════════
📊 CLEANUP SUMMARY
═══════════════════════════════════════════════════════════════════════

Current state:
  - Total items: ${state.all.length}
  - From CORE_LOGIC.md: ${state.coreLogicItems.length}
  - Other sources: ${state.manualItems.length + state.unknownItems.length}

After cleanup:
  - Orphaned (removed from CORE_LOGIC.md): ${orphaned.length} → DELETE
  - Redundant (duplicated by CORE_LOGIC.md): ${categories.redundant.length} → DELETE
  - Valuable (keep): ${categories.valuable.length}
  - Deprecated (review): ${categories.deprecated.length}

${execute ? `✅ Deleted: ${result.deleted} items` : `🔸 DRY RUN - Would delete: ${result.wouldDelete || 0} items`}

${!execute ? '\n💡 To execute cleanup, run: node scripts/brain-cleanup-strategy.mjs --execute\n' : ''}
`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
