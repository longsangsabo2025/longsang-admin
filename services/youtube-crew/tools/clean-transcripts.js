#!/usr/bin/env node
/**
 * Transcript Cleaner CLI
 * 
 * Batch process raw transcripts through AI to fix errors, remove ads, clean up text.
 * 
 * Usage:
 *   node --max-old-space-size=2048 tools/clean-transcripts.js                    # Process ALL 315 transcripts
 *   node --max-old-space-size=2048 tools/clean-transcripts.js --category tam-ly  # Process one category
 *   node --max-old-space-size=2048 tools/clean-transcripts.js --file tam-ly/9NhdSLhA9eU.md  # One file
 *   node --max-old-space-size=2048 tools/clean-transcripts.js --dry-run          # Show what would be processed
 *   node --max-old-space-size=2048 tools/clean-transcripts.js --resume           # Resume from last checkpoint
 *   node --max-old-space-size=2048 tools/clean-transcripts.js --limit 5          # Process only first N files
 * 
 * Output: src/knowledge/transcripts-clean/{category}/{videoId}.md
 * 
 * Estimated cost: ~$1.2 for all 315 transcripts (GPT-4o-mini)
 */
import { TranscriptCleanerAgent } from '../src/agents/transcript-cleaner.js';
import { loadTranscriptIndex } from '../src/knowledge/loader.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import chalk from 'chalk';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHECKPOINT_FILE = join(ROOT, 'data', '.clean-checkpoint.json');

// ─── Parse CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const targetCategory = getArg('category');
const targetFile = getArg('file');
const isDryRun = hasFlag('dry-run');
const shouldResume = hasFlag('resume');
const limit = getArg('limit') ? parseInt(getArg('limit')) : null;

// ─── Load checkpoint ────────────────────────────────────────────────
async function loadCheckpoint() {
  if (!shouldResume) return new Set();
  try {
    const raw = await readFile(CHECKPOINT_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return new Set(data.completed || []);
  } catch {
    return new Set();
  }
}

async function saveCheckpoint(completed, stats) {
  await mkdir(dirname(CHECKPOINT_FILE), { recursive: true });
  await writeFile(CHECKPOINT_FILE, JSON.stringify({
    completed: [...completed],
    lastUpdated: new Date().toISOString(),
    stats,
  }, null, 2), 'utf-8');
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log(chalk.bold.cyan('\n🧹 Transcript Cleaner — Batch Processor\n'));

  // Load transcript index
  const index = await loadTranscriptIndex();
  if (!index.videos?.length) {
    console.log(chalk.red('No transcripts found in index'));
    process.exit(1);
  }

  // Filter files to process
  let files = index.videos.map(v => v.file);
  
  if (targetFile) {
    files = files.filter(f => f === targetFile);
    if (files.length === 0) {
      console.log(chalk.red(`File not found: ${targetFile}`));
      process.exit(1);
    }
  } else if (targetCategory) {
    files = files.filter(f => f.startsWith(targetCategory + '/'));
    if (files.length === 0) {
      console.log(chalk.red(`No files in category: ${targetCategory}`));
      process.exit(1);
    }
  }

  // Resume: skip already completed
  const completed = await loadCheckpoint();
  if (shouldResume && completed.size > 0) {
    const before = files.length;
    files = files.filter(f => !completed.has(f));
    console.log(chalk.yellow(`Resuming: ${completed.size} already done, ${files.length}/${before} remaining`));
  }

  // Apply limit
  if (limit) {
    files = files.slice(0, limit);
  }

  // Summary
  console.log(chalk.white(`Files to process: ${chalk.bold(files.length)}`));
  console.log(chalk.white(`Model: ${chalk.bold(process.env.TRANSCRIPT_CLEANER_MODEL || 'gpt-4o-mini')}`));
  
  // Category breakdown
  const catCounts = {};
  for (const f of files) {
    const cat = f.split('/')[0];
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(chalk.gray(`  ${cat}: ${count}`));
  }

  // Estimate cost
  const totalChars = index.videos
    .filter(v => files.includes(v.file))
    .reduce((sum, v) => sum + v.chars, 0);
  const estTokens = Math.ceil(totalChars / 3.5); // ~3.5 chars per token for Vietnamese
  const estCost = (estTokens * 0.15 + estTokens * 0.60) / 1_000_000; // input + output
  console.log(chalk.white(`Total chars: ${(totalChars / 1_000_000).toFixed(2)}M (~${(estTokens / 1000).toFixed(0)}K tokens)`));
  console.log(chalk.white(`Estimated cost: ${chalk.bold.green('$' + estCost.toFixed(2))}`));

  if (isDryRun) {
    console.log(chalk.yellow('\n--dry-run: No files processed.'));
    for (const f of files.slice(0, 10)) {
      const v = index.videos.find(vi => vi.file === f);
      console.log(chalk.gray(`  ${f} (${v?.chars || '?'} chars)`));
    }
    if (files.length > 10) console.log(chalk.gray(`  ... and ${files.length - 10} more`));
    return;
  }

  console.log(chalk.cyan('\nStarting processing...\n'));

  // Initialize agent
  const agent = new TranscriptCleanerAgent();
  
  const results = [];
  let totalCost = 0;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const video = index.videos.find(v => v.file === file);
    const progress = `[${i + 1}/${files.length}]`;

    try {
      console.log(chalk.cyan(`${progress} Processing: ${file} (${video?.chars || '?'} chars)`));

      const result = await agent.processFile(file);
      
      if (result) {
        results.push(result);
        totalCost += result.cost || 0;
        success++;

        const titleInfo = result.titleChanged
          ? chalk.yellow(` | title: "${result.originalTitle.substring(0, 30)}..." → "${result.cleanedTitle.substring(0, 30)}..."`)
          : '';
        console.log(chalk.green(
          `  ✅ ${result.reduction} reduction | $${(result.cost || 0).toFixed(4)}${titleInfo}`
        ));

        // Save checkpoint
        completed.add(file);
        if ((i + 1) % 5 === 0) { // Save every 5 files
          await saveCheckpoint(completed, { success, failed, totalCost });
        }
      } else {
        console.log(chalk.yellow(`  ⚠️ Skipped (too short or no frontmatter)`));
      }

    } catch (error) {
      failed++;
      console.log(chalk.red(`  ❌ Error: ${error.message}`));
      
      // Rate limit? Wait and retry
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        console.log(chalk.yellow('  Rate limited — waiting 30s...'));
        await new Promise(r => setTimeout(r, 30000));
        i--; // Retry this file
        continue;
      }
    }
  }

  // Final checkpoint
  await saveCheckpoint(completed, { success, failed, totalCost });

  // Summary
  console.log(chalk.bold.cyan('\n═══════════════════════════════════════'));
  console.log(chalk.bold.cyan('  🧹 Transcript Cleaning Complete'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════'));
  console.log(chalk.white(`  ✅ Success: ${chalk.bold.green(success)}`));
  if (failed > 0) console.log(chalk.white(`  ❌ Failed: ${chalk.bold.red(failed)}`));
  console.log(chalk.white(`  💰 Total cost: ${chalk.bold.green('$' + totalCost.toFixed(4))}`));
  console.log(chalk.white(`  📊 Agent stats: ${agent.executionCount} calls, ${agent.totalTokens.input + agent.totalTokens.output} tokens`));
  console.log(chalk.white(`  📁 Output: src/knowledge/transcripts-clean/`));
  console.log();

  // Write summary report
  const reportPath = join(ROOT, 'data', 'clean-report.json');
  await writeFile(reportPath, JSON.stringify({
    processedAt: new Date().toISOString(),
    total: files.length,
    success,
    failed,
    totalCost,
    results,
  }, null, 2), 'utf-8');
  console.log(chalk.gray(`Report saved: data/clean-report.json`));
}

main().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
