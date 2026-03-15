#!/usr/bin/env node
/**
 * YouTube Agent Crew — CLI Entry Point
 * 
 * Usage:
 *   node src/index.js --url https://youtube.com/watch?v=XXX
 *   node src/index.js --topic "Chu kỳ 18 năm bất động sản"
 *   node src/index.js --channel "@THUATTAIVAN" --latest
 */
import 'dotenv/config';
import chalk from 'chalk';
import { Conductor } from './core/conductor.js';
import { HarvesterAgent } from './agents/harvester.js';
import { BrainCuratorAgent } from './agents/brain-curator.js';
import { ScriptWriterAgent } from './agents/script-writer.js';
import { VoiceProducerAgent } from './agents/voice-producer.js';
import { VisualDirectorAgent } from './agents/visual-director.js';
import { VideoComposerAgent } from './agents/video-composer.js';
import { PublisherAgent } from './agents/publisher.js';
import { ShortsScriptWriterAgent } from './agents/shorts-script-writer.js';
import { youtubePodcastPipeline } from './pipelines/youtube-podcast.js';
import { youtubeShortsPipeline } from './pipelines/youtube-shorts.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// ─── Parse CLI args ──────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      opts.videoUrl = args[++i];
    } else if (args[i] === '--topic' && args[i + 1]) {
      opts.topic = args[++i];
    } else if (args[i] === '--channel' && args[i + 1]) {
      opts.channel = args[++i];
    } else if (args[i] === '--latest') {
      opts.latest = true;
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--resume' && args[i + 1]) {
      opts.resume = args[++i];
    } else if (args[i] === '--max-cost' && args[i + 1]) {
      opts.maxCost = parseFloat(args[++i]);
    } else if (args[i] === '--shorts') {
      opts.shorts = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      opts.help = true;
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
${chalk.bold.cyan('YouTube Agent Crew')} — AI-Powered Podcast Video Factory

${chalk.bold('Usage:')}
  node src/index.js [options]

${chalk.bold('Options:')}
  --url <url>        YouTube video URL to harvest
  --topic <topic>    Topic to create a podcast about
  --channel <name>   YouTube channel to harvest from
  --latest           Get latest video from channel
  --shorts           Run YouTube Shorts pipeline (60s vertical video)
  --dry-run          Run pipeline without TTS/video generation
  --resume <id>      Resume a failed/paused pipeline from checkpoint
  --max-cost <usd>   Max cost budget in USD (e.g. 0.50)
  --help, -h         Show this help

${chalk.bold('Examples:')}
  ${chalk.gray('# Transform a specific video into a podcast')}
  node src/index.js --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

  ${chalk.gray('# Create a podcast about a topic')}
  node src/index.js --topic "Tại sao Fed in tiền ảnh hưởng đến BĐS Việt Nam"

  ${chalk.gray('# Harvest latest from a channel')}
  node src/index.js --channel "THUẬT TÀI VẬN" --latest

  ${chalk.gray('# Resume a failed pipeline')}
  node src/index.js --resume youtube-podcast_abc123

  ${chalk.gray('# Create a 60-second YouTube Short')}
  node src/index.js --shorts --topic "97% người ngủ 8 tiếng vẫn mệt"

  ${chalk.gray('# Run with cost budget')}
  node src/index.js --topic "AI Trends 2026" --max-cost 0.30

${chalk.bold('Environment:')}
  Copy .env.example → .env and configure your API keys.
  Minimum required: OPENAI_API_KEY or GOOGLE_AI_API_KEY
`);
}

// ─── Main ────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  if (opts.help || (Object.keys(opts).length === 0)) {
    printHelp();
    process.exit(0);
  }

  // Resume mode — skip input validation
  if (opts.resume) {
    console.log(chalk.yellow(`♻️  RESUME MODE — Pipeline: ${opts.resume}`));
  }

  // Validate API keys
  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
    console.error(chalk.red('❌ No API key configured. Set OPENAI_API_KEY or GOOGLE_AI_API_KEY in .env'));
    process.exit(1);
  }

  const bannerTitle = opts.shorts ? 'Shorts Factory (60s Vertical)' : 'Podcast Factory';
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════╗
║          YOUTUBE AGENT CREW v1.0.0              ║
║          AI-Powered ${bannerTitle.padEnd(27)}║
╚══════════════════════════════════════════════════╝
`));

  // Create conductor
  const conductor = new Conductor();

  // Register all agents
  const agents = [
    new HarvesterAgent(),
    new BrainCuratorAgent(),
    new ScriptWriterAgent(),
    new ShortsScriptWriterAgent(),
    new VoiceProducerAgent(),
    new VisualDirectorAgent(),
    new VideoComposerAgent(),
    new PublisherAgent(),
  ];

  for (const agent of agents) {
    conductor.registerAgent(agent);
  }

  // Register pipelines
  conductor.registerPipeline(youtubePodcastPipeline);
  conductor.registerPipeline(youtubeShortsPipeline);

  // Build input
  const input = {};
  if (opts.videoUrl) input.videoUrl = opts.videoUrl;
  if (opts.topic) input.topic = opts.topic;
  if (opts.channel) input.channel = opts.channel;
  if (opts.latest) input.latest = true;
  if (opts.dryRun) input.dryRun = true;

  console.log(chalk.bold('Input:'), JSON.stringify(input, null, 2));
  console.log('');

  try {
    // Execute the pipeline (with resume + cost budget support)
    const pipelineOpts = {};
    if (opts.resume) pipelineOpts.resume = opts.resume;
    if (opts.maxCost) pipelineOpts.maxCost = opts.maxCost;
    const pipelineName = opts.shorts ? 'youtube-shorts' : 'youtube-podcast';
    const result = await conductor.executePipeline(pipelineName, input, pipelineOpts);

    // Save results
    const outputDir = process.env.OUTPUT_DIR || './output';
    const runDir = join(outputDir, result.pipelineId);
    await mkdir(runDir, { recursive: true });

    // Save full results JSON
    const resultsPath = join(runDir, 'results.json');
    await writeFile(resultsPath, JSON.stringify(result.results, null, 2));
    console.log(chalk.green(`\n📁 Results saved to: ${resultsPath}`));

    // Save script separately for easy reading
    const scriptKey = opts.shorts ? 'shorts_script' : 'podcast_script';
    if (result.results[scriptKey]) {
      try {
        const script = JSON.parse(result.results[scriptKey]);
        const scriptPath = join(runDir, 'script.json');
        await writeFile(scriptPath, JSON.stringify(script, null, 2));
        console.log(chalk.green(`📝 Script saved to: ${scriptPath}`));
        
        if (opts.shorts && script.sections) {
          const textScript = script.sections
            .map(s => `[${s.timestamp}] ${s.type.toUpperCase()}\n${s.text}\nSubtitle: ${s.subtitle || s.text}\n`)
            .join('\n---\n\n');
          const textPath = join(runDir, 'script.txt');
          await writeFile(textPath, `# ${script.title}\n\n${textScript}`);
          console.log(chalk.green(`📖 Readable script: ${textPath}`));
        } else if (script.script) {
          const textScript = script.script
            .map(s => `[${s.timestamp}] ${s.section.toUpperCase()}\n${s.text}\n`)
            .join('\n---\n\n');
          const textPath = join(runDir, 'script.txt');
          await writeFile(textPath, `# ${script.title}\n\n${textScript}`);
          console.log(chalk.green(`📖 Readable script: ${textPath}`));
        }
      } catch { /* script wasn't valid JSON */ }
    }

    // Save publish metadata
    const metaKey = opts.shorts ? 'shorts_metadata' : 'publish_metadata';
    if (result.results[metaKey]) {
      const metaPath = join(runDir, 'metadata.json');
      await writeFile(metaPath, result.results[metaKey]);
      console.log(chalk.green(`🏷️  Metadata saved to: ${metaPath}`));
    }

    console.log(chalk.bold.green('\n✅ Pipeline complete! Check the output directory.'));

  } catch (error) {
    console.error(chalk.red(`\n💥 Pipeline failed: ${error.message}`));
    console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

main();
