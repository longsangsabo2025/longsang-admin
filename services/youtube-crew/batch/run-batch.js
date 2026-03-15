#!/usr/bin/env node
/**
 * Batch Runner — Run multiple topics through the YouTube Agent Crew pipeline
 *
 * Usage:
 *   node batch/run-batch.js                          # Run week1-topics.json
 *   node batch/run-batch.js --file batch/custom.json # Run custom topic file
 *   node batch/run-batch.js --start-from 3           # Resume from topic ID 3
 *   node batch/run-batch.js --max-cost 0.50          # Per-topic cost limit
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    file: join(__dirname, 'week1-topics.json'),
    startFrom: 1,
    maxCost: null,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) opts.file = args[++i];
    if (args[i] === '--start-from' && args[i + 1]) opts.startFrom = parseInt(args[++i], 10);
    if (args[i] === '--max-cost' && args[i + 1]) opts.maxCost = args[++i];
  }
  return opts;
}

function runPipeline(topic, maxCost) {
  return new Promise((resolve) => {
    const args = ['src/index.js', '--topic', topic];
    if (maxCost) args.push('--max-cost', maxCost);

    const child = spawn('node', args, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      resolve({ exitCode: code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ exitCode: 1, stdout, stderr: err.message });
    });
  });
}

function extractStats(stdout) {
  const costMatch = stdout.match(/Total Cost: \$([0-9.]+)/);
  const durationMatch = stdout.match(/Duration: ([0-9.]+)s/);
  const pipelineIdMatch = stdout.match(/Run ID: (\S+)/);
  return {
    cost: costMatch ? parseFloat(costMatch[1]) : null,
    durationSec: durationMatch ? parseFloat(durationMatch[1]) : null,
    pipelineId: pipelineIdMatch ? pipelineIdMatch[1] : null,
  };
}

async function main() {
  const opts = parseArgs();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║       BATCH RUNNER — ĐỨNG DẬY ĐI                ║');
  console.log('║       YouTube Agent Crew Batch Pipeline          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const raw = await readFile(opts.file, 'utf-8');
  const batch = JSON.parse(raw);

  console.log(`Batch:  ${batch.batch_name}`);
  console.log(`Topics: ${batch.topics.length}`);
  console.log(`Start:  Topic #${opts.startFrom}`);
  if (opts.maxCost) console.log(`Budget: $${opts.maxCost}/topic`);
  console.log('─'.repeat(50));

  const results = {
    batch_name: batch.batch_name,
    started_at: new Date().toISOString(),
    completed_at: null,
    total_topics: batch.topics.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    total_cost: 0,
    total_duration_sec: 0,
    topic_results: [],
  };

  for (const topic of batch.topics) {
    if (topic.id < opts.startFrom) {
      results.skipped++;
      results.topic_results.push({
        id: topic.id,
        topic: topic.topic,
        status: 'skipped',
        reason: `Before start-from (${opts.startFrom})`,
      });
      continue;
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`▶ [${topic.id}/${batch.topics.length}] ${topic.topic}`);
    console.log(`  Category: ${topic.category}`);
    console.log(`${'═'.repeat(50)}\n`);

    const startTime = Date.now();

    try {
      const { exitCode, stdout, stderr } = await runPipeline(topic.topic, opts.maxCost);
      const elapsed = (Date.now() - startTime) / 1000;
      const stats = extractStats(stdout);

      if (exitCode === 0) {
        results.succeeded++;
        results.total_cost += stats.cost || 0;
        results.total_duration_sec += elapsed;

        results.topic_results.push({
          id: topic.id,
          topic: topic.topic,
          category: topic.category,
          status: 'success',
          exit_code: exitCode,
          duration_sec: Math.round(elapsed * 10) / 10,
          cost: stats.cost,
          pipeline_id: stats.pipelineId,
          completed_at: new Date().toISOString(),
        });

        console.log(`\n✅ Topic ${topic.id} COMPLETE — ${elapsed.toFixed(1)}s — $${(stats.cost || 0).toFixed(4)}`);
      } else {
        results.failed++;
        results.topic_results.push({
          id: topic.id,
          topic: topic.topic,
          category: topic.category,
          status: 'failed',
          exit_code: exitCode,
          duration_sec: Math.round(elapsed * 10) / 10,
          error: stderr.slice(-500),
          completed_at: new Date().toISOString(),
        });

        console.log(`\n❌ Topic ${topic.id} FAILED (exit ${exitCode}) — skipping to next`);
      }
    } catch (err) {
      results.failed++;
      results.topic_results.push({
        id: topic.id,
        topic: topic.topic,
        category: topic.category,
        status: 'error',
        error: err.message,
        completed_at: new Date().toISOString(),
      });

      console.log(`\n💥 Topic ${topic.id} ERROR: ${err.message} — skipping to next`);
    }

    // Save intermediate results after each topic
    const resultsPath = join(__dirname, 'week1-results.json');
    results.completed_at = new Date().toISOString();
    await writeFile(resultsPath, JSON.stringify(results, null, 2));
  }

  results.completed_at = new Date().toISOString();

  const resultsPath = join(__dirname, 'week1-results.json');
  await writeFile(resultsPath, JSON.stringify(results, null, 2));

  console.log(`\n${'═'.repeat(50)}`);
  console.log('BATCH COMPLETE');
  console.log(`${'═'.repeat(50)}`);
  console.log(`✅ Succeeded: ${results.succeeded}/${results.total_topics}`);
  console.log(`❌ Failed:    ${results.failed}/${results.total_topics}`);
  console.log(`⏭  Skipped:   ${results.skipped}/${results.total_topics}`);
  console.log(`💰 Total Cost: $${results.total_cost.toFixed(4)}`);
  console.log(`⏱  Total Time: ${results.total_duration_sec.toFixed(1)}s`);
  console.log(`📁 Results:    ${resultsPath}`);
  console.log(`${'═'.repeat(50)}\n`);
}

main().catch((err) => {
  console.error(`Fatal batch error: ${err.message}`);
  process.exit(1);
});
