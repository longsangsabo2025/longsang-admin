#!/usr/bin/env node
/**
 * Quick Produce — Run stages 4-7 using pre-generated scripts
 * 
 * Takes pre-generated stage 1-3 outputs and runs only video production.
 * Script generation (AI API) is decoupled from video production (GPU).
 *
 * Usage:
 *   node batch/quick-produce.js --topic 1                  # Produce topic 1
 *   node batch/quick-produce.js --all                      # Produce all topics
 *   node batch/quick-produce.js --topic 1 --start-stage 5  # Resume from stage 5
 */
import 'dotenv/config';
import chalk from 'chalk';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Conductor } from '../src/core/conductor.js';
import { VoiceProducerAgent } from '../src/agents/voice-producer.js';
import { VisualDirectorAgent } from '../src/agents/visual-director.js';
import { VideoComposerAgent } from '../src/agents/video-composer.js';
import { PublisherAgent } from '../src/agents/publisher.js';
import { youtubePodcastPipeline } from '../src/pipelines/youtube-podcast.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PRE_GEN_DIR = join(PROJECT_ROOT, 'output', '_pre_generated');

const PRODUCTION_STAGES = [
  { idx: 3, num: 4, name: 'Voice Production', agentId: 'voice-producer', outputKey: 'audio_data', file: 'stage4_voice' },
  { idx: 4, num: 5, name: 'Visual Direction', agentId: 'visual-director', outputKey: 'visual_storyboard', file: 'stage5_visual' },
  { idx: 5, num: 6, name: 'Video Assembly', agentId: 'video-assembler', outputKey: 'video_data', file: 'stage6_video' },
  { idx: 6, num: 7, name: 'Publishing', agentId: 'publisher', outputKey: 'publish_metadata', file: 'stage7_publish' },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { startStage: 4 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) opts.topicNum = parseInt(args[++i]);
    else if (args[i] === '--all') opts.all = true;
    else if (args[i] === '--start-stage' && args[i + 1]) opts.startStage = parseInt(args[++i]);
    else if (args[i] === '--dir' && args[i + 1]) opts.dir = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--help' || args[i] === '-h') opts.help = true;
  }
  return opts;
}

function printHelp() {
  console.log(`
${chalk.bold.cyan('Quick Produce')} — Video production from pre-generated scripts (Stages 4→7)

${chalk.bold('Usage:')}
  node batch/quick-produce.js [options]

${chalk.bold('Options:')}
  --topic <N>          Topic number to produce (from pre-generated batch)
  --all                Produce all pre-generated topics
  --start-stage <N>    Start from stage N (default: 4, range: 4-7)
  --dir <path>         Custom pre-generated directory
  --dry-run            Validate pre-generated files without running
  --help, -h           Show this help

${chalk.bold('Stages (production only):')}
  4: Voice Producer    — TTS audio (needs VoxCPM on localhost:8100)
  5: Visual Director   — Storyboard + images (needs ComfyUI on localhost:8188)
  6: Video Assembler   — FFmpeg video assembly
  7: Publisher         — SEO metadata + YouTube upload

${chalk.bold('Prerequisites:')}
  1. Run pre-generate-scripts.js first (stages 1-3)
  2. VoxCPM TTS running (stage 4)
  3. ComfyUI running (stage 5, optional — gradient fallback)
  4. FFmpeg installed (stage 6)

${chalk.bold('Examples:')}
  ${chalk.gray('# Produce video for topic 1')}
  node batch/quick-produce.js --topic 1

  ${chalk.gray('# Produce all pre-generated topics')}
  node batch/quick-produce.js --all

  ${chalk.gray('# Resume topic 2 from stage 6 (voice already done)')}
  node batch/quick-produce.js --topic 2 --start-stage 6
`);
}

async function loadPreGenerated(topicDir) {
  const memory = {};
  const scriptInputs = [
    { file: 'stage1_harvest.json', key: 'harvested_content' },
    { file: 'stage2_brain.json', key: 'curated_knowledge' },
    { file: 'stage3_script.json', key: 'podcast_script' },
  ];

  for (const s of scriptInputs) {
    const filePath = join(topicDir, s.file);
    if (!existsSync(filePath)) {
      throw new Error(`Missing: ${s.file} in ${topicDir}`);
    }
    const data = JSON.parse(await readFile(filePath, 'utf-8'));
    memory[s.key] = data.output;
  }

  return memory;
}

async function produceVideo(conductor, topicDir, topicLabel, opts) {
  const memory = await loadPreGenerated(topicDir);
  const pipeline = youtubePodcastPipeline;
  const results = {};

  for (const stage of PRODUCTION_STAGES) {
    if (stage.num < opts.startStage) {
      const cached = join(topicDir, `${stage.file}.json`);
      if (existsSync(cached)) {
        const data = JSON.parse(await readFile(cached, 'utf-8'));
        memory[stage.outputKey] = data.output;
        console.log(chalk.gray(`    ⏭️  Stage ${stage.num}: ${stage.name} — loaded from cache`));
      }
      continue;
    }

    const pipelineStageDef = pipeline.stages[stage.idx];
    const task = pipelineStageDef.task(memory, {});
    const agent = conductor.agents.get(stage.agentId);
    if (!agent) throw new Error(`Agent not found: ${stage.agentId}`);

    console.log(chalk.cyan(`    🚀 Stage ${stage.num}: ${stage.name}...`));
    const t0 = Date.now();

    try {
      const result = await agent.execute(task, { responseFormat: 'text' });
      const content = result.content || (typeof result === 'string' ? result : JSON.stringify(result));
      const elapsed = Date.now() - t0;

      memory[stage.outputKey] = content;
      results[stage.num] = { elapsed, chars: content.length };

      await writeFile(join(topicDir, `${stage.file}.json`), JSON.stringify({
        stage: stage.num,
        stageName: stage.name,
        outputKey: stage.outputKey,
        output: content,
        meta: result.meta || {},
        timestamp: new Date().toISOString(),
        elapsedMs: elapsed,
      }, null, 2));

      console.log(chalk.green(`    ✅ Stage ${stage.num} — ${(elapsed / 1000).toFixed(1)}s, ${content.length} chars`));
    } catch (err) {
      console.log(chalk.red(`    ❌ Stage ${stage.num} FAILED: ${err.message}`));
      console.log(chalk.yellow(`       Resume: --topic ${topicLabel} --start-stage ${stage.num}`));
      results[stage.num] = { error: err.message };
      throw err;
    }
  }

  return results;
}

function findPreGeneratedTopics() {
  if (!existsSync(PRE_GEN_DIR)) return [];
  return readdirSync(PRE_GEN_DIR)
    .filter(d => d.startsWith('topic_'))
    .filter(d => existsSync(join(PRE_GEN_DIR, d, 'stage3_script.json')))
    .map(d => parseInt(d.replace('topic_', '')))
    .sort((a, b) => a - b);
}

async function main() {
  const opts = parseArgs();
  if (opts.help || (!opts.topicNum && !opts.all && !opts.dir)) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════╗
║    QUICK PRODUCE — Stages 4→5→6→7 from Cache    ║
║    Voice → Visual → Video → Publish              ║
╚══════════════════════════════════════════════════╝`));

  let topicDirs;
  if (opts.dir) {
    topicDirs = [{ num: 'custom', dir: opts.dir }];
  } else if (opts.all) {
    const available = findPreGeneratedTopics();
    if (available.length === 0) {
      console.error(chalk.red('\n  No pre-generated topics found. Run pre-generate-scripts.js first.\n'));
      process.exit(1);
    }
    topicDirs = available.map(n => ({ num: n, dir: join(PRE_GEN_DIR, `topic_${n}`) }));
    console.log(chalk.bold(`\n  Found ${topicDirs.length} pre-generated topics: [${available.join(', ')}]`));
  } else {
    const dir = join(PRE_GEN_DIR, `topic_${opts.topicNum}`);
    if (!existsSync(dir)) {
      console.error(chalk.red(`\n  Topic ${opts.topicNum} not found at: ${dir}`));
      console.error(chalk.yellow('  Run pre-generate-scripts.js first.\n'));
      process.exit(1);
    }
    topicDirs = [{ num: opts.topicNum, dir }];
  }

  console.log(chalk.bold(`  Starting from stage: ${opts.startStage}\n`));

  if (opts.dryRun) {
    for (const { num, dir } of topicDirs) {
      try {
        await loadPreGenerated(dir);
        console.log(chalk.green(`  ✅ Topic ${num}: pre-generated files OK`));
      } catch (err) {
        console.log(chalk.red(`  ❌ Topic ${num}: ${err.message}`));
      }
    }
    console.log(chalk.yellow('\n  DRY RUN — files validated, no production.\n'));
    process.exit(0);
  }

  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
    console.error(chalk.red('\n❌ No API key. Set OPENAI_API_KEY or GOOGLE_AI_API_KEY in .env'));
    process.exit(1);
  }

  const conductor = new Conductor();
  for (const a of [new VoiceProducerAgent(), new VisualDirectorAgent(), new VideoComposerAgent(), new PublisherAgent()]) {
    conductor.registerAgent(a);
  }

  const startTime = Date.now();
  const summary = {};

  for (const { num, dir } of topicDirs) {
    let topicName = `Topic ${num}`;
    try {
      const s1 = JSON.parse(await readFile(join(dir, 'stage1_harvest.json'), 'utf-8'));
      topicName = s1.topic || topicName;
    } catch { /* use default */ }

    console.log(chalk.bold.yellow(`\n${'─'.repeat(60)}`));
    console.log(chalk.bold.yellow(`  🎬 [${num}] ${topicName}`));
    console.log(chalk.bold.yellow(`${'─'.repeat(60)}`));

    try {
      summary[num] = await produceVideo(conductor, dir, num, opts);
    } catch {
      summary[num] = { error: `Failed — see above` };
      if (!opts.all) break;
      console.log(chalk.yellow('  Continuing to next topic...\n'));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(chalk.bold.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.bold.cyan('  PRODUCTION SUMMARY'));
  console.log(chalk.bold.cyan(`${'═'.repeat(60)}`));
  console.log(`  Total time: ${elapsed}s`);

  for (const [id, r] of Object.entries(summary)) {
    if (r.error) {
      console.log(chalk.red(`  ❌ Topic ${id}: ${r.error}`));
    } else {
      const parts = Object.entries(r)
        .filter(([k]) => !isNaN(k))
        .map(([k, v]) => v.error ? `S${k}:fail` : `S${k}:${(v.elapsed / 1000).toFixed(1)}s`)
        .join(' → ');
      console.log(chalk.green(`  ✅ Topic ${id}: ${parts}`));
    }
  }
  console.log('');
}

main().catch(err => {
  console.error(chalk.red(`\n💥 Fatal: ${err.message}`));
  console.error(chalk.gray(err.stack));
  process.exit(1);
});
