#!/usr/bin/env node
/**
 * Chunk Repair Tool — Fix individual TTS chunks without regenerating everything.
 * 
 * Usage:
 *   node src/repair-chunks.js --manifest <path>                    # Review all chunks
 *   node src/repair-chunks.js --manifest <path> --repair 5,12,25   # Repair specific chunks
 *   node src/repair-chunks.js --manifest <path> --verify-all       # Whisper audit every chunk
 *   node src/repair-chunks.js --manifest <path> --repair-bad       # Auto-repair failed chunks
 */
import 'dotenv/config';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { VoiceProducerAgent } from './agents/voice-producer.js';
import { ttsVerifyChunk } from './agents/tts-auditor.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest' && args[i + 1]) opts.manifest = args[++i];
    else if (args[i] === '--repair' && args[i + 1]) opts.repair = args[++i].split(',').map(Number);
    else if (args[i] === '--verify-all') opts.verifyAll = true;
    else if (args[i] === '--repair-bad') opts.repairBad = true;
    else if (args[i] === '--help' || args[i] === '-h') opts.help = true;
  }
  return opts;
}

async function reviewChunks(manifest) {
  console.log(chalk.bold.cyan('\n  CHUNK MANIFEST REVIEW'));
  console.log(chalk.gray('  ' + '─'.repeat(60)));
  console.log(chalk.gray(`  Pipeline: ${manifest.pipelineId}`));
  console.log(chalk.gray(`  Created: ${manifest.createdAt}`));
  console.log(chalk.gray(`  Total chunks: ${manifest.totalChunks}`));
  console.log();

  const okCount = manifest.chunks.filter(c => c.status === 'ok' || c.status === 'repaired').length;
  const failCount = manifest.chunks.filter(c => c.status === 'failed').length;

  for (const chunk of manifest.chunks) {
    const exists = existsSync(chunk.audioFile);
    const statusIcon = chunk.status === 'ok' ? chalk.green('OK') 
      : chunk.status === 'repaired' ? chalk.blue('FIXED')
      : chalk.red('FAIL');
    const fileIcon = exists ? '' : chalk.red(' [missing]');
    const sim = chunk.similarity ? chalk.gray(` sim=${chunk.similarity.toFixed(2)}`) : '';
    const dur = chunk.duration ? chalk.gray(` ${chunk.duration.toFixed(1)}s`) : '';

    console.log(`  ${String(chunk.index).padStart(3)} ${statusIcon}${sim}${dur}${fileIcon}  ${chalk.gray(chunk.text.substring(0, 65))}...`);
  }

  console.log();
  console.log(chalk.bold(`  Summary: ${chalk.green(okCount + ' OK')} / ${chalk.red(failCount + ' failed')} / ${manifest.totalChunks} total`));
  
  if (failCount > 0) {
    const failedIndexes = manifest.chunks.filter(c => c.status === 'failed').map(c => c.index);
    console.log(chalk.yellow(`\n  To repair: node src/repair-chunks.js --manifest ${process.argv[3]} --repair ${failedIndexes.join(',')}`));
  }

  return { okCount, failCount };
}

async function verifyAllChunks(manifest) {
  const ttsUrl = process.env.VOXCPM_API_URL || 'http://localhost:8100';
  console.log(chalk.bold.cyan('\n  WHISPER VERIFICATION — All Chunks'));
  console.log(chalk.gray('  ' + '─'.repeat(60)));

  const badChunks = [];

  for (const chunk of manifest.chunks) {
    if (chunk.status === 'failed') {
      console.log(chalk.red(`  ${String(chunk.index).padStart(3)} SKIP (already failed)`));
      badChunks.push(chunk.index);
      continue;
    }

    process.stdout.write(chalk.gray(`  ${String(chunk.index).padStart(3)} verifying...`));
    const result = await ttsVerifyChunk(chunk.text, ttsUrl, 0.5);

    if (result.error) {
      console.log(chalk.red(` ERROR: ${result.error}`));
      badChunks.push(chunk.index);
    } else if (!result.pass) {
      console.log(chalk.red(` FAIL sim=${result.similarity?.toFixed(2)}`));
      console.log(chalk.gray(`        OUT: ${(result.transcribed || '').substring(0, 60)}`));
      badChunks.push(chunk.index);
      chunk.similarity = result.similarity;
    } else {
      console.log(chalk.green(` PASS sim=${result.similarity?.toFixed(2)}`));
      chunk.similarity = result.similarity;
    }
  }

  console.log();
  if (badChunks.length === 0) {
    console.log(chalk.bold.green('  ALL CHUNKS VERIFIED!'));
  } else {
    console.log(chalk.bold.red(`  ${badChunks.length} chunks need repair: [${badChunks.join(', ')}]`));
    console.log(chalk.yellow(`\n  Auto-fix: node src/repair-chunks.js --manifest ${process.argv[3]} --repair ${badChunks.join(',')}`));
  }

  return badChunks;
}

async function main() {
  const opts = parseArgs();

  if (opts.help || !opts.manifest) {
    console.log(chalk.bold.cyan(`
  CHUNK REPAIR TOOL — Fix TTS without regenerating everything

  Usage:
    --manifest <path>       Path to manifest.json
    --repair 5,12,25        Repair specific chunk indexes
    --verify-all            Whisper-check every chunk
    --repair-bad            Auto-repair all failed chunks

  Example workflow:
    1. node src/repair-chunks.js --manifest output/.../audio/manifest.json
       → Review all chunks, see which are OK/failed
    2. node src/repair-chunks.js --manifest ... --verify-all
       → Whisper-check each chunk for pronunciation quality
    3. node src/repair-chunks.js --manifest ... --repair 5,12
       → Regenerate only chunks 5 and 12, re-concat audio
`));
    return;
  }

  if (!existsSync(opts.manifest)) {
    console.log(chalk.red(`Manifest not found: ${opts.manifest}`));
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(opts.manifest, 'utf-8'));

  if (opts.verifyAll) {
    const badChunks = await verifyAllChunks(manifest);
    if (opts.repairBad && badChunks.length > 0) {
      opts.repair = badChunks;
    } else {
      return;
    }
  }

  if (opts.repair) {
    const agent = new VoiceProducerAgent();
    const result = await agent.repairChunks(opts.manifest, opts.repair, { verify: true });
    console.log(chalk.bold(`\n  Repaired: ${result.totalFixed}/${opts.repair.length} chunks`));
  } else if (opts.repairBad) {
    const badIndexes = manifest.chunks.filter(c => c.status === 'failed').map(c => c.index);
    if (badIndexes.length === 0) {
      console.log(chalk.green('  No failed chunks to repair!'));
      return;
    }
    const agent = new VoiceProducerAgent();
    const result = await agent.repairChunks(opts.manifest, badIndexes, { verify: true });
    console.log(chalk.bold(`\n  Repaired: ${result.totalFixed}/${badIndexes.length} chunks`));
  } else {
    await reviewChunks(manifest);
  }
}

main().catch(console.error);
