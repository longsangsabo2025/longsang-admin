#!/usr/bin/env node
/**
 * Batch Shorts Generator
 * 
 * Takes existing podcast scripts (from pipeline output) and extracts
 * 3-5 viral-worthy Shorts per episode using AI analysis.
 * 
 * Two modes:
 *   1. Extract mode: Analyze podcast scripts → generate shorts-topics.json
 *   2. Run mode: Execute the shorts pipeline for each extracted topic
 * 
 * Usage:
 *   node batch/generate-shorts.js --extract                       # Scan output/ for podcast scripts → extract topics
 *   node batch/generate-shorts.js --extract --dir output/youtube-podcast_abc123
 *   node batch/generate-shorts.js --run                           # Run shorts pipeline for all extracted topics
 *   node batch/generate-shorts.js --run --start-from 3            # Resume from topic #3
 *   node batch/generate-shorts.js --extract --run                 # Extract + immediately run
 *   node batch/generate-shorts.js --run --max-cost 0.10           # Per-short cost limit
 */
import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = process.env.OUTPUT_DIR || join(PROJECT_ROOT, 'output');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    extract: false,
    run: false,
    dir: null,
    startFrom: 1,
    maxCost: null,
    outputFile: join(__dirname, 'extracted-shorts.json'),
    maxPerEpisode: 5,
    minPerEpisode: 3,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--extract') opts.extract = true;
    if (args[i] === '--run') opts.run = true;
    if (args[i] === '--dir' && args[i + 1]) opts.dir = args[++i];
    if (args[i] === '--start-from' && args[i + 1]) opts.startFrom = parseInt(args[++i], 10);
    if (args[i] === '--max-cost' && args[i + 1]) opts.maxCost = args[++i];
    if (args[i] === '--output' && args[i + 1]) opts.outputFile = args[++i];
    if (args[i] === '--max-per-episode' && args[i + 1]) opts.maxPerEpisode = parseInt(args[++i], 10);
    if (args[i] === '--help' || args[i] === '-h') opts.help = true;
  }
  return opts;
}

function printHelp() {
  console.log(`
Batch Shorts Generator — Extract Shorts from Podcast Scripts

Usage:
  node batch/generate-shorts.js [options]

Options:
  --extract              Scan output/ for podcast scripts and extract short topics
  --run                  Run shorts pipeline for extracted topics
  --dir <path>           Specific pipeline output directory to extract from
  --start-from <n>       Resume run from topic #n
  --max-cost <usd>       Per-short cost budget
  --output <path>        Output file for extracted topics (default: batch/extracted-shorts.json)
  --max-per-episode <n>  Max shorts per episode (default: 5)
  --help, -h             Show this help

Examples:
  # Extract shorts topics from all podcast runs
  node batch/generate-shorts.js --extract

  # Extract from a specific run
  node batch/generate-shorts.js --extract --dir output/youtube-podcast_abc123

  # Extract and immediately run all shorts
  node batch/generate-shorts.js --extract --run

  # Run previously extracted shorts
  node batch/generate-shorts.js --run --start-from 5
`);
}

async function findPodcastScripts(baseDir) {
  const scripts = [];
  try {
    const entries = await readdir(baseDir);
    for (const entry of entries) {
      if (!entry.startsWith('youtube-podcast_')) continue;
      const runDir = join(baseDir, entry);
      const runStat = await stat(runDir);
      if (!runStat.isDirectory()) continue;

      const scriptPath = join(runDir, 'script.json');
      try {
        const raw = await readFile(scriptPath, 'utf-8');
        const script = JSON.parse(raw);
        scripts.push({
          pipelineId: entry,
          scriptPath,
          title: script.title || 'Untitled',
          sections: script.script || script.sections || [],
          totalWords: script.stats?.totalWords || 0,
        });
      } catch {
        // No script.json or invalid JSON
      }
    }
  } catch {
    // Output dir doesn't exist
  }
  return scripts;
}

async function extractShortsFromScript(script, maxPerEpisode) {
  let llmAvailable = false;
  let chat, estimateCost;
  try {
    const llmModule = await import('../src/core/llm.js');
    chat = llmModule.chat;
    estimateCost = llmModule.estimateCost;
    llmAvailable = true;
  } catch {
    // LLM not available, use rule-based extraction
  }

  const fullText = script.sections
    .map(s => `[${s.section || s.type}] ${s.text}`)
    .join('\n\n');

  if (llmAvailable && fullText.length > 100) {
    try {
      const model = process.env.DEFAULT_MODEL || 'gpt-4o-mini';
      const result = await chat({
        model,
        systemPrompt: `Bạn là content strategist cho kênh YouTube "ĐỨNG DẬY ĐI". 
Phân tích podcast script và trích xuất ${maxPerEpisode} ý tưởng YouTube Shorts viral nhất.
Mỗi Short = 1 insight duy nhất, 60 giây, dừng lướt trong 3 giây đầu.
Return JSON array.`,
        userMessage: `Phân tích podcast script này và trích xuất ${maxPerEpisode} Shorts:

TITLE: ${script.title}

SCRIPT:
${fullText.substring(0, 8000)}

Cho mỗi Short, return:
{
  "topic": "Tiêu đề Short (<80 chars, Vietnamese, gây tò mò)",
  "source_section": "Tên section gốc (hook/boi_canh/giai_phau/twist/etc)",
  "key_insight": "Insight chính trong 1-2 câu",
  "hook_style": "shocking_stat|provocative_question|contrast|reframe|challenge|tough_love",
  "emotional_trigger": "curiosity|shock|fear|hope|anger",
  "viral_score": 1-10,
  "notes": "Ghi chú cho script writer"
}

Return JSON: { "shorts": [...] }
Sort by viral_score descending.`,
        temperature: 0.7,
        maxTokens: 2048,
        responseFormat: 'json',
      });

      const parsed = JSON.parse(result.content);
      return parsed.shorts || parsed;
    } catch (err) {
      console.log(`  LLM extraction failed: ${err.message} — falling back to rule-based`);
    }
  }

  return extractShortsRuleBased(script, maxPerEpisode);
}

function extractShortsRuleBased(script, maxPerEpisode) {
  const shorts = [];
  const sectionPriority = ['twist', 'hook', 'giai_phau', 'dung_day', 'boi_canh'];

  for (const section of script.sections) {
    const sectionName = (section.section || section.type || '').toLowerCase();
    const priority = sectionPriority.indexOf(sectionName);
    if (priority === -1) continue;

    const sentences = section.text
      .replace(/\[.*?\]/g, '')
      .split(/[.!?。]\s+/)
      .filter(s => s.length > 20 && s.length < 200);

    if (sentences.length === 0) continue;

    const hookStyles = {
      twist: 'reframe',
      hook: 'shocking_stat',
      giai_phau: 'contrast',
      dung_day: 'tough_love',
      boi_canh: 'provocative_question',
    };

    const bestSentence = sentences.reduce((best, s) =>
      s.length > best.length ? s : best, sentences[0]);

    shorts.push({
      topic: bestSentence.substring(0, 80),
      source_section: sectionName,
      key_insight: bestSentence,
      hook_style: hookStyles[sectionName] || 'contrast',
      emotional_trigger: sectionName === 'twist' ? 'shock' : 'curiosity',
      viral_score: 10 - priority * 2,
      notes: `Extracted from ${sectionName} section of "${script.title}"`,
    });
  }

  return shorts
    .sort((a, b) => b.viral_score - a.viral_score)
    .slice(0, maxPerEpisode);
}

async function runExtract(opts) {
  console.log('\n--- EXTRACT MODE: Scanning for podcast scripts ---\n');

  let scripts;
  if (opts.dir) {
    const scriptPath = join(opts.dir, 'script.json');
    try {
      const raw = await readFile(scriptPath, 'utf-8');
      const script = JSON.parse(raw);
      scripts = [{
        pipelineId: basename(opts.dir),
        scriptPath,
        title: script.title || 'Untitled',
        sections: script.script || script.sections || [],
        totalWords: script.stats?.totalWords || 0,
      }];
    } catch (err) {
      console.error(`Failed to read script from ${opts.dir}: ${err.message}`);
      return null;
    }
  } else {
    scripts = await findPodcastScripts(OUTPUT_DIR);
  }

  if (scripts.length === 0) {
    console.log('No podcast scripts found in output/. Run some podcast pipelines first.');
    console.log(`Searched: ${OUTPUT_DIR}`);
    return null;
  }

  console.log(`Found ${scripts.length} podcast script(s):\n`);
  scripts.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title} (${s.totalWords} words) — ${s.pipelineId}`);
  });
  console.log('');

  const allShorts = [];
  let globalId = 1;

  for (const script of scripts) {
    console.log(`Extracting shorts from: ${script.title}...`);
    const shorts = await extractShortsFromScript(script, opts.maxPerEpisode);
    console.log(`  Found ${shorts.length} shorts\n`);

    for (const short of shorts) {
      allShorts.push({
        id: globalId++,
        ...short,
        source_pipeline: script.pipelineId,
        source_title: script.title,
      });
    }
  }

  const batch = {
    batch_name: `Extracted Shorts — ${scripts.length} episodes → ${allShorts.length} shorts`,
    created_at: new Date().toISOString(),
    channel: 'ĐỨNG DẬY ĐI',
    source: `Auto-extracted from ${scripts.length} podcast script(s)`,
    pipeline: 'youtube-shorts',
    extraction_stats: {
      episodes_scanned: scripts.length,
      shorts_extracted: allShorts.length,
      avg_per_episode: (allShorts.length / scripts.length).toFixed(1),
    },
    topics: allShorts,
  };

  await writeFile(opts.outputFile, JSON.stringify(batch, null, 2));
  console.log(`\nExtracted ${allShorts.length} shorts → ${opts.outputFile}\n`);

  allShorts.forEach(s => {
    console.log(`  #${s.id} [${s.hook_style}] ${s.topic}`);
    console.log(`     Source: ${s.source_section} from "${s.source_title}" (viral: ${s.viral_score}/10)`);
  });

  return batch;
}

function runShortsPipeline(topic, maxCost) {
  return new Promise((resolve) => {
    const args = ['src/index.js', '--shorts', '--topic', topic];
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

async function runBatch(opts, batch) {
  console.log('\n--- RUN MODE: Executing shorts pipeline ---\n');

  if (!batch) {
    try {
      const raw = await readFile(opts.outputFile, 'utf-8');
      batch = JSON.parse(raw);
    } catch {
      console.error(`No extracted topics found at ${opts.outputFile}`);
      console.error('Run with --extract first, or specify --output <file>');
      return;
    }
  }

  console.log(`Batch:  ${batch.batch_name}`);
  console.log(`Shorts: ${batch.topics.length}`);
  console.log(`Start:  #${opts.startFrom}`);
  if (opts.maxCost) console.log(`Budget: $${opts.maxCost}/short`);
  console.log('─'.repeat(50));

  const results = {
    batch_name: batch.batch_name,
    started_at: new Date().toISOString(),
    completed_at: null,
    total_shorts: batch.topics.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    total_cost: 0,
    total_duration_sec: 0,
    shorts_results: [],
  };

  for (const topic of batch.topics) {
    if (topic.id < opts.startFrom) {
      results.skipped++;
      results.shorts_results.push({
        id: topic.id,
        topic: topic.topic,
        status: 'skipped',
      });
      continue;
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`▶ Short [${topic.id}/${batch.topics.length}] ${topic.topic}`);
    console.log(`  Source: ${topic.source_section || 'direct'} | Hook: ${topic.hook_style}`);
    console.log(`${'═'.repeat(50)}\n`);

    const startTime = Date.now();

    try {
      const { exitCode, stdout } = await runShortsPipeline(topic.topic, opts.maxCost);
      const elapsed = (Date.now() - startTime) / 1000;
      const stats = extractStats(stdout);

      if (exitCode === 0) {
        results.succeeded++;
        results.total_cost += stats.cost || 0;
        results.total_duration_sec += elapsed;

        results.shorts_results.push({
          id: topic.id,
          topic: topic.topic,
          hook_style: topic.hook_style,
          source_pipeline: topic.source_pipeline,
          status: 'success',
          duration_sec: Math.round(elapsed * 10) / 10,
          cost: stats.cost,
          pipeline_id: stats.pipelineId,
          completed_at: new Date().toISOString(),
        });

        console.log(`\nShort ${topic.id} DONE — ${elapsed.toFixed(1)}s — $${(stats.cost || 0).toFixed(4)}`);
      } else {
        results.failed++;
        results.shorts_results.push({
          id: topic.id,
          topic: topic.topic,
          status: 'failed',
          exit_code: exitCode,
          completed_at: new Date().toISOString(),
        });

        console.log(`\nShort ${topic.id} FAILED (exit ${exitCode})`);
      }
    } catch (err) {
      results.failed++;
      results.shorts_results.push({
        id: topic.id,
        topic: topic.topic,
        status: 'error',
        error: err.message,
      });

      console.log(`\nShort ${topic.id} ERROR: ${err.message}`);
    }

    results.completed_at = new Date().toISOString();
    const resultsPath = join(__dirname, 'shorts-batch-results.json');
    await writeFile(resultsPath, JSON.stringify(results, null, 2));
  }

  results.completed_at = new Date().toISOString();
  const finalPath = join(__dirname, 'shorts-batch-results.json');
  await writeFile(finalPath, JSON.stringify(results, null, 2));

  console.log(`\n${'═'.repeat(50)}`);
  console.log('SHORTS BATCH COMPLETE');
  console.log(`${'═'.repeat(50)}`);
  console.log(`Succeeded: ${results.succeeded}/${results.total_shorts}`);
  console.log(`Failed:    ${results.failed}/${results.total_shorts}`);
  console.log(`Skipped:   ${results.skipped}/${results.total_shorts}`);
  console.log(`Total Cost: $${results.total_cost.toFixed(4)}`);
  console.log(`Total Time: ${results.total_duration_sec.toFixed(1)}s`);
  console.log(`Avg/Short:  ${(results.total_duration_sec / Math.max(results.succeeded, 1)).toFixed(1)}s, $${(results.total_cost / Math.max(results.succeeded, 1)).toFixed(4)}`);
  console.log(`Results:    ${finalPath}`);
  console.log(`${'═'.repeat(50)}\n`);
}

async function main() {
  const opts = parseArgs();

  if (opts.help || (!opts.extract && !opts.run)) {
    printHelp();
    process.exit(0);
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   SHORTS GENERATOR — ĐỨNG DẬY ĐI               ║');
  console.log('║   Extract Shorts from Podcast Scripts            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  let batch = null;

  if (opts.extract) {
    batch = await runExtract(opts);
    if (!batch && opts.run) {
      console.error('No topics extracted — cannot run batch.');
      process.exit(1);
    }
  }

  if (opts.run) {
    await runBatch(opts, batch);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
