#!/usr/bin/env node
/**
 * Clean transcripts from a crawled JSON file (any channel)
 * 
 * Reads the raw crawl JSON, cleans each transcript via AI, outputs individual .md files.
 * Works for ANY channel — YouTube, TikTok, etc.
 * 
 * Usage:
 *   node --max-old-space-size=2048 tools/clean-channel-transcripts.js --input data/thuattaivan-transcripts.json --output-dir src/knowledge/transcripts-thuattaivan
 *   node --max-old-space-size=2048 tools/clean-channel-transcripts.js --input data/thuattaivan-transcripts.json --resume
 *   node --max-old-space-size=2048 tools/clean-channel-transcripts.js --input data/thuattaivan-transcripts.json --limit 5 --dry-run
 */
import { TranscriptCleanerAgent } from '../src/agents/transcript-cleaner.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import chalk from 'chalk';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
dotenv.config({ path: join(ROOT, '.env') });

// ─── Parse CLI args ─────────────────────────────────────────────────
function getArg(name) {
  const eqForm = process.argv.find(a => a.startsWith(`--${name}=`));
  if (eqForm) return eqForm.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(`--${name}`);
  if (idx > -1 && idx + 1 < process.argv.length && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1];
  }
  return null;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const inputFile = getArg('input');
const outputDirArg = getArg('output-dir');
const isDryRun = hasFlag('dry-run');
const shouldResume = hasFlag('resume');
const limit = getArg('limit') ? parseInt(getArg('limit')) : null;

if (!inputFile) {
  console.error(chalk.red('Usage: node tools/clean-channel-transcripts.js --input <file.json> [--output-dir <dir>] [--resume] [--limit N] [--dry-run]'));
  process.exit(1);
}

const INPUT_PATH = inputFile.startsWith('/') || inputFile.includes(':')
  ? inputFile
  : join(ROOT, inputFile);

// Derive output dir and checkpoint from input filename
const channelSlug = basename(inputFile, '.json').replace('-transcripts', '');
const OUTPUT_DIR = outputDirArg
  ? (outputDirArg.startsWith('/') || outputDirArg.includes(':') ? outputDirArg : join(ROOT, outputDirArg))
  : join(ROOT, 'src', 'knowledge', `transcripts-${channelSlug}`);
const CHECKPOINT_FILE = join(ROOT, 'data', `.clean-${channelSlug}-checkpoint.json`);

// ─── Checkpoint management ──────────────────────────────────────────
async function loadCheckpoint() {
  if (!shouldResume) return new Set();
  try {
    const raw = await readFile(CHECKPOINT_FILE, 'utf-8');
    return new Set(JSON.parse(raw).completed || []);
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
  console.log(chalk.bold.cyan('\n🧹 Channel Transcript Cleaner\n'));

  // Load crawl data
  if (!existsSync(INPUT_PATH)) {
    console.error(chalk.red(`Input file not found: ${INPUT_PATH}`));
    process.exit(1);
  }

  const data = JSON.parse(await readFile(INPUT_PATH, 'utf-8'));
  const channel = data.channel || channelSlug;
  const allVideos = data.videos || [];

  console.log(chalk.white(`Channel: ${chalk.bold(channel)}`));
  console.log(chalk.white(`Total videos: ${allVideos.length}`));
  console.log(chalk.white(`Output dir: ${OUTPUT_DIR}`));

  // Filter videos with transcripts
  let videos = allVideos.filter(v => v.hasTranscript && v.transcript && v.transcript.length > 100);
  console.log(chalk.white(`With transcript (>100 chars): ${videos.length}`));

  // Resume: skip completed
  const completed = await loadCheckpoint();
  if (shouldResume && completed.size > 0) {
    const before = videos.length;
    videos = videos.filter(v => !completed.has(v.videoId));
    console.log(chalk.yellow(`Resuming: ${completed.size} done, ${videos.length}/${before} remaining`));
  }

  // Apply limit
  if (limit) videos = videos.slice(0, limit);

  // Estimate cost
  const totalChars = videos.reduce((sum, v) => sum + (v.transcriptChars || v.transcript.length), 0);
  const estTokens = Math.ceil(totalChars / 3.5);
  const estCost = (estTokens * 0.15 + estTokens * 0.60) / 1_000_000;
  console.log(chalk.white(`Total chars: ${(totalChars / 1_000_000).toFixed(2)}M (~${(estTokens / 1000).toFixed(0)}K tokens)`));
  console.log(chalk.white(`Estimated cost: ${chalk.bold.green('$' + estCost.toFixed(2))}`));
  console.log(chalk.white(`Files to process: ${chalk.bold(videos.length)}`));

  if (isDryRun) {
    console.log(chalk.yellow('\n--dry-run mode. Sample videos:'));
    for (const v of videos.slice(0, 10)) {
      console.log(chalk.gray(`  ${v.videoId} | ${(v.transcriptChars || v.transcript.length)} chars | ${v.title?.substring(0, 60)}`));
    }
    if (videos.length > 10) console.log(chalk.gray(`  ... and ${videos.length - 10} more`));
    return;
  }

  console.log(chalk.cyan('\nStarting cleaning...\n'));

  // Init agent
  const agent = new TranscriptCleanerAgent();
  await mkdir(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let failed = 0;
  let totalCost = 0;
  const indexEntries = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const progress = `[${i + 1}/${videos.length}]`;
    const chars = video.transcriptChars || video.transcript.length;

    console.log(chalk.cyan(`${progress} ${video.videoId} (${chars} chars) — ${video.title?.substring(0, 50) || 'untitled'}...`));

    try {
      // Clean transcript
      const { cleaned, stats } = await agent.cleanTranscript(
        video.transcript,
        video.title || '',
        channel
      );

      // Clean title if garbled
      let cleanedTitle = video.title || `Video ${video.videoId}`;
      if (agent._isTitleGarbled(cleanedTitle)) {
        cleanedTitle = await agent._cleanTitle(cleanedTitle, channel);
      }

      // Create .md file with frontmatter
      const duration = video.duration || 0;
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr = `${mins}:${String(secs).padStart(2, '0')}`;

      const mdContent = [
        '---',
        `videoId: "${video.videoId}"`,
        `title: "${cleanedTitle.replace(/"/g, '\\"')}"`,
        `channel: "${channel}"`,
        `duration: "${durationStr}"`,
        `views: ${video.viewCount || 0}`,
        `lang: "${video.transcriptLang || 'vi'}"`,
        `uploadDate: "${video.uploadDate || ''}"`,
        `cleanedAt: "${new Date().toISOString()}"`,
        '---',
        '',
        `# ${cleanedTitle}`,
        '',
        `**Kênh:** ${channel} | **Thời lượng:** ${durationStr} | **Views:** ${(video.viewCount || 0).toLocaleString()}`,
        '',
        '---',
        '',
        cleaned,
        '',
      ].join('\n');

      const outPath = join(OUTPUT_DIR, `${video.videoId}.md`);
      await writeFile(outPath, mdContent, 'utf-8');

      success++;
      totalCost += stats.cost || 0;

      indexEntries.push({
        videoId: video.videoId,
        title: cleanedTitle,
        duration,
        views: video.viewCount || 0,
        chars: cleaned.length,
        lang: video.transcriptLang || 'vi',
        uploadDate: video.uploadDate || '',
        file: `${video.videoId}.md`,
      });

      const titleInfo = cleanedTitle !== video.title
        ? chalk.yellow(` | title fixed`)
        : '';
      console.log(chalk.green(
        `  ✅ ${stats.reduction} reduction | ${stats.chunks} chunks | $${(stats.cost || 0).toFixed(4)}${titleInfo}`
      ));

      // Update checkpoint every 3 files
      completed.add(video.videoId);
      if ((i + 1) % 3 === 0) {
        await saveCheckpoint(completed, { success, failed, totalCost });
      }

    } catch (error) {
      failed++;
      console.log(chalk.red(`  ❌ ${error.message?.substring(0, 80)}`));

      // Rate limit? Wait
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        console.log(chalk.yellow('  Rate limited — waiting 30s...'));
        await new Promise(r => setTimeout(r, 30000));
        i--; // Retry
        continue;
      }
    }
  }

  // Final checkpoint
  await saveCheckpoint(completed, { success, failed, totalCost });

  // Write index file
  const indexPath = join(OUTPUT_DIR, '_index.json');
  await writeFile(indexPath, JSON.stringify({
    channel,
    totalVideos: indexEntries.length,
    processedAt: new Date().toISOString(),
    videos: indexEntries,
  }, null, 2), 'utf-8');

  // Summary
  console.log(chalk.bold.cyan('\n═══════════════════════════════════════'));
  console.log(chalk.bold.cyan('  🧹 Channel Transcript Cleaning Complete'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════'));
  console.log(chalk.white(`  Channel: ${channel}`));
  console.log(chalk.white(`  ✅ Success: ${chalk.bold.green(success)}`));
  if (failed > 0) console.log(chalk.white(`  ❌ Failed: ${chalk.bold.red(failed)}`));
  console.log(chalk.white(`  💰 Total cost: ${chalk.bold.green('$' + totalCost.toFixed(4))}`));
  console.log(chalk.white(`  📊 Agent stats: ${agent.executionCount} calls, ${agent.totalTokens.input + agent.totalTokens.output} tokens`));
  console.log(chalk.white(`  📁 Output: ${OUTPUT_DIR}`));
  console.log(chalk.white(`  📋 Index: ${indexPath}`));
  console.log();
}

main().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
