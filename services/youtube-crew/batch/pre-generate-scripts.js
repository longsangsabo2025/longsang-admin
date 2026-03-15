#!/usr/bin/env node
/**
 * Pre-Generate Scripts — Batch run stages 1-3 for multiple topics
 * 
 * Decouples script generation (AI API calls) from video production (GPU).
 * Run this when you have API access, then use quick-produce.js later.
 *
 * Usage:
 *   node batch/pre-generate-scripts.js                        # Run all topics
 *   node batch/pre-generate-scripts.js --start-from 3         # Resume from topic 3
 *   node batch/pre-generate-scripts.js --topics week2.json    # Custom topics file
 *   node batch/pre-generate-scripts.js --dry-run              # Validate setup only
 */
import 'dotenv/config';
import chalk from 'chalk';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Conductor } from '../src/core/conductor.js';
import { HarvesterAgent } from '../src/agents/harvester.js';
import { BrainCuratorAgent } from '../src/agents/brain-curator.js';
import { ScriptWriterAgent } from '../src/agents/script-writer.js';
import { youtubePodcastPipeline } from '../src/pipelines/youtube-podcast.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'output', '_pre_generated');
const DEFAULT_TOPICS = join(__dirname, 'week1-topics.json');

const STAGE_MAP = [
  { num: 1, file: 'stage1_harvest', outputKey: 'harvested_content', agentId: 'harvester' },
  { num: 2, file: 'stage2_brain', outputKey: 'curated_knowledge', agentId: 'brain-curator' },
  { num: 3, file: 'stage3_script', outputKey: 'podcast_script', agentId: 'script-writer' },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { startFrom: 1 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start-from' && args[i + 1]) opts.startFrom = parseInt(args[++i]);
    else if (args[i] === '--topics' && args[i + 1]) opts.topicsFile = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--help' || args[i] === '-h') opts.help = true;
  }
  return opts;
}

function printHelp() {
  console.log(`
${chalk.bold.cyan('Pre-Generate Scripts')} — Batch stages 1-3 for video topics

${chalk.bold('Usage:')}
  node batch/pre-generate-scripts.js [options]

${chalk.bold('Options:')}
  --start-from <N>     Resume from topic N (1-indexed, default: 1)
  --topics <file>      Path to topics JSON file (default: batch/week1-topics.json)
  --dry-run            Validate setup without calling APIs
  --help, -h           Show this help

${chalk.bold('Pipeline (stages 1-3 only):')}
  1: Harvester         — Research topic, extract key points
  2: Brain Curator     — Analyze research, find unique angle
  3: Script Writer     — Write full Vietnamese podcast script

${chalk.bold('Output:')}
  output/_pre_generated/topic_1/stage1_harvest.json
  output/_pre_generated/topic_1/stage2_brain.json
  output/_pre_generated/topic_1/stage3_script.json

${chalk.bold('Examples:')}
  ${chalk.gray('# Run all 5 topics from week1')}
  node batch/pre-generate-scripts.js

  ${chalk.gray('# Resume from topic 3 (topics 1-2 already done)')}
  node batch/pre-generate-scripts.js --start-from 3

  ${chalk.gray('# Use different topics file')}
  node batch/pre-generate-scripts.js --topics batch/week2-topics.json

  ${chalk.gray('# After pre-generation, produce videos:')}
  node batch/quick-produce.js --topic 1
`);
}

async function saveStageOutput(topicNum, stageFile, data) {
  const dir = join(OUTPUT_DIR, `topic_${topicNum}`);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${stageFile}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

async function loadStageOutput(topicNum, stageFile) {
  const filePath = join(OUTPUT_DIR, `topic_${topicNum}`, `${stageFile}.json`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, 'utf-8'));
}

function isStageComplete(topicNum) {
  return existsSync(join(OUTPUT_DIR, `topic_${topicNum}`, 'stage3_script.json'));
}

async function runStagesForTopic(conductor, topicEntry, topicNum) {
  const { topic, category, target_audience, notes } = topicEntry;
  const pipeline = youtubePodcastPipeline;
  const memory = {};
  const results = {};

  for (const stage of STAGE_MAP) {
    const existing = await loadStageOutput(topicNum, stage.file);
    if (existing?.output) {
      console.log(chalk.gray(`    ⏭️  Stage ${stage.num}: ${pipeline.stages[stage.num - 1].name} — cached`));
      memory[stage.outputKey] = existing.output;
      results[stage.num] = { skipped: true };
      continue;
    }

    const pipelineStageDef = pipeline.stages[stage.num - 1];
    const input = { topic, category, target_audience, notes };
    const task = pipelineStageDef.task(memory, input);

    const agent = conductor.agents.get(stage.agentId);
    if (!agent) throw new Error(`Agent not found: ${stage.agentId}`);

    console.log(chalk.cyan(`    🚀 Stage ${stage.num}: ${pipelineStageDef.name}...`));
    const t0 = Date.now();

    try {
      const result = await agent.execute(task, { responseFormat: 'text' });
      const content = result.content || (typeof result === 'string' ? result : JSON.stringify(result));
      const elapsed = Date.now() - t0;

      memory[stage.outputKey] = content;
      results[stage.num] = { elapsed, chars: content.length, cost: result.meta?.cost };

      await saveStageOutput(topicNum, stage.file, {
        topic,
        topicId: topicEntry.id,
        category,
        stage: stage.num,
        stageName: pipelineStageDef.name,
        outputKey: stage.outputKey,
        output: content,
        meta: result.meta || {},
        timestamp: new Date().toISOString(),
        elapsedMs: elapsed,
      });

      console.log(chalk.green(`    ✅ Stage ${stage.num} — ${(elapsed / 1000).toFixed(1)}s, ${content.length} chars`));
    } catch (err) {
      console.log(chalk.red(`    ❌ Stage ${stage.num} FAILED: ${err.message}`));
      results[stage.num] = { error: err.message };
      throw err;
    }
  }

  return results;
}

async function main() {
  const opts = parseArgs();
  if (opts.help) { printHelp(); process.exit(0); }

  const topicsFile = opts.topicsFile || DEFAULT_TOPICS;
  if (!existsSync(topicsFile)) {
    console.error(chalk.red(`Topics file not found: ${topicsFile}`));
    process.exit(1);
  }

  const topicsData = JSON.parse(await readFile(topicsFile, 'utf-8'));
  const topics = topicsData.topics;

  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════╗
║    PRE-GENERATE SCRIPTS — Stages 1→2→3 Batch    ║
║    Harvester → Brain Curator → Script Writer     ║
╚══════════════════════════════════════════════════╝`));

  console.log(chalk.bold(`\n  Batch:    ${topicsData.batch_name}`));
  console.log(chalk.bold(`  Channel:  ${topicsData.channel}`));
  console.log(chalk.bold(`  Topics:   ${topics.length}`));
  console.log(chalk.bold(`  Start:    Topic ${opts.startFrom}`));
  console.log(chalk.bold(`  Output:   ${OUTPUT_DIR}\n`));

  for (const t of topics) {
    const icon = t.id < opts.startFrom ? chalk.gray('⏭️  skip')
      : isStageComplete(t.id) ? chalk.green('✅ done')
      : chalk.yellow('⏳ pending');
    console.log(`  ${icon}  [${t.id}] ${t.topic.substring(0, 65)}`);
  }

  if (opts.dryRun) {
    console.log(chalk.yellow('\n  DRY RUN — setup validated, no API calls.\n'));
    process.exit(0);
  }

  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
    console.error(chalk.red('\n❌ No API key. Set OPENAI_API_KEY or GOOGLE_AI_API_KEY in .env'));
    process.exit(1);
  }

  const conductor = new Conductor();
  for (const a of [new HarvesterAgent(), new BrainCuratorAgent(), new ScriptWriterAgent()]) {
    conductor.registerAgent(a);
  }

  const startTime = Date.now();
  const summary = {};
  let completedCount = 0;
  let failedTopic = null;

  for (const entry of topics) {
    if (entry.id < opts.startFrom) {
      summary[entry.id] = { skipped: true };
      continue;
    }

    console.log(chalk.bold.yellow(`\n${'─'.repeat(60)}`));
    console.log(chalk.bold.yellow(`  📝 [${entry.id}/${topics.length}] ${entry.topic}`));
    console.log(chalk.gray(`     ${entry.category} · Viral: ${entry.estimated_viral_score}/10`));
    console.log(chalk.bold.yellow(`${'─'.repeat(60)}`));

    try {
      summary[entry.id] = await runStagesForTopic(conductor, entry, entry.id);
      completedCount++;
    } catch {
      failedTopic = entry.id;
      summary[entry.id] = { error: `Failed at topic ${entry.id}` };
      break;
    }
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(join(OUTPUT_DIR, 'batch_summary.json'), JSON.stringify({
    batchName: topicsData.batch_name,
    channel: topicsData.channel,
    topicsFile,
    totalTopics: topics.length,
    startedFrom: opts.startFrom,
    completedCount,
    totalElapsedMs: Date.now() - startTime,
    results: summary,
    timestamp: new Date().toISOString(),
  }, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(chalk.bold.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.bold.cyan('  BATCH PRE-GENERATION COMPLETE'));
  console.log(chalk.bold.cyan(`${'═'.repeat(60)}`));
  console.log(`  Time: ${elapsed}s · Completed: ${completedCount}/${topics.length}`);

  for (const [id, r] of Object.entries(summary)) {
    if (r.skipped) {
      console.log(chalk.gray(`  ⏭️  Topic ${id}: skipped`));
    } else if (r.error) {
      console.log(chalk.red(`  ❌ Topic ${id}: ${r.error}`));
    } else {
      const parts = Object.entries(r)
        .filter(([k]) => !isNaN(k))
        .map(([k, v]) => v.skipped ? `S${k}:cached` : `S${k}:${(v.elapsed / 1000).toFixed(1)}s`)
        .join(' → ');
      console.log(chalk.green(`  ✅ Topic ${id}: ${parts}`));
    }
  }

  if (failedTopic) {
    console.log(chalk.yellow(`\n  Resume: node batch/pre-generate-scripts.js --start-from ${failedTopic}`));
  } else {
    console.log(chalk.bold(`\n  All scripts pre-generated! Next step:`));
    console.log(chalk.bold(`  node batch/quick-produce.js --topic 1`));
    console.log(chalk.bold(`  node batch/quick-produce.js --all`));
  }
  console.log('');
}

main().catch(err => {
  console.error(chalk.red(`\n💥 Fatal: ${err.message}`));
  console.error(chalk.gray(err.stack));
  process.exit(1);
});
