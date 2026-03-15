#!/usr/bin/env node
/**
 * Stage Test Harness — SpaceX-style stage-by-stage testing
 * 
 * Test individual pipeline stages, validate output, save checkpoints.
 * Like a static fire test before a full launch.
 * 
 * Usage:
 *   node src/test-stage.js --stage 1                    # Test Harvester only
 *   node src/test-stage.js --stage 2 --from-checkpoint  # Test Brain Curator with Stage 1 output
 *   node src/test-stage.js --stage 4 --from-checkpoint  # Test TTS with saved script
 *   node src/test-stage.js --stage all --stop-on-fail   # Run all, stop at first failure
 *   node src/test-stage.js --validate 3                 # Validate Stage 3 output only
 */
import 'dotenv/config';
import chalk from 'chalk';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { Conductor } from './core/conductor.js';
import { HarvesterAgent } from './agents/harvester.js';
import { BrainCuratorAgent } from './agents/brain-curator.js';
import { ScriptWriterAgent } from './agents/script-writer.js';
import { VoiceProducerAgent } from './agents/voice-producer.js';
import { VisualDirectorAgent } from './agents/visual-director.js';
import { VideoComposerAgent } from './agents/video-composer.js';
import { PublisherAgent } from './agents/publisher.js';

const CHECKPOINT_DIR = './output/_stage_tests';
const TOPIC = process.argv.find((_, i, a) => a[i - 1] === '--topic') 
  || 'Bí mật giấc ngủ mà 99 phần trăm người không biết';

const STAGES = {
  1: { name: 'Harvester', agent: 'harvester', key: 'harvested_content' },
  2: { name: 'Brain Curator', agent: 'brain-curator', key: 'curated_knowledge' },
  3: { name: 'Script Writer', agent: 'script-writer', key: 'podcast_script' },
  4: { name: 'Voice Producer', agent: 'voice-producer', key: 'audio_data' },
  5: { name: 'Visual Director', agent: 'visual-director', key: 'visual_storyboard' },
  6: { name: 'Video Assembler', agent: 'video-assembler', key: 'video_data' },
  7: { name: 'Publisher', agent: 'publisher', key: 'publish_metadata' },
};

const VALIDATORS = {
  1: (output) => {
    const checks = [];
    checks.push({ name: 'Has content', pass: output.length > 100 });
    checks.push({ name: 'Has JSON structure', pass: output.includes('{') });
    try {
      const parsed = JSON.parse(output.replace(/```json\n?/g, '').replace(/```/g, ''));
      checks.push({ name: 'Valid JSON', pass: true });
      checks.push({ name: 'Has keyPoints', pass: Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0 });
      checks.push({ name: 'Has coreTopic', pass: !!parsed.coreTopic });
    } catch {
      checks.push({ name: 'Valid JSON', pass: false, detail: 'Failed to parse' });
    }
    return checks;
  },
  2: (output) => {
    const checks = [];
    checks.push({ name: 'Has content', pass: output.length > 200 });
    try {
      const parsed = JSON.parse(output);
      checks.push({ name: 'Valid JSON', pass: true });
      checks.push({ name: 'Has relatedBooks', pass: Array.isArray(parsed.relatedBooks) });
      checks.push({ name: 'Has atomicIdeas', pass: Array.isArray(parsed.atomicIdeas) });
      checks.push({ name: 'Has podcastPotential', pass: !!parsed.podcastPotential });
      checks.push({ name: 'Podcast score >= 7', pass: parsed.podcastPotential?.score >= 7 });
    } catch {
      checks.push({ name: 'Valid JSON', pass: false });
    }
    return checks;
  },
  3: (output) => {
    const checks = [];
    checks.push({ name: 'Has content', pass: output.length > 500 });

    let scriptText = output;
    let parsed = null;
    try {
      parsed = JSON.parse(output);
      checks.push({ name: 'Valid JSON', pass: true });
      if (parsed.script && Array.isArray(parsed.script)) {
        scriptText = parsed.script.map(s => s.text || '').join('\n');
        const sectionNames = parsed.script.map(s => s.section);
        checks.push({ name: `Sections (${sectionNames.length})`, pass: sectionNames.length >= 5, detail: sectionNames.join(', ') });
        const requiredSections = ['hook', 'signature_intro', 'ket'];
        const hasCritical = requiredSections.filter(r => sectionNames.includes(r));
        checks.push({ name: `Structure (${hasCritical.length}/3)`, pass: hasCritical.length >= 2, detail: 'hook + signature_intro + ket' });
      } else {
        checks.push({ name: 'Has script array', pass: false });
      }
    } catch {
      checks.push({ name: 'JSON parse', pass: false, detail: 'Raw text' });
    }

    const wordCount = scriptText.split(/\s+/).filter(Boolean).length;
    checks.push({ name: `Word count (${wordCount})`, pass: wordCount >= 1000, detail: 'Target: 1500-2500' });

    // ─── Voice DNA = STYLE checks, not keyword checklist ───
    checks.push({ name: 'Vietnamese text', pass: /[àáảãạăắằẳẵặâấầẩẫậ]/i.test(scriptText) });
    checks.push({ name: 'Voice markers', pass: /\[(PAUSE|EMPHASIS|SLOW|INTENSE|WHISPER)\]/.test(scriptText) });

    // Signature Intro (fixed phrase — MUST have)
    const hasSignatureIntro = /Chào mừng đến với ĐỨNG DẬY ĐI/i.test(scriptText) || /Đứng Dậy Đi/i.test(scriptText);
    checks.push({ name: 'Signature Intro', pass: hasSignatureIntro });

    // Signature Outro (fixed phrase — MUST have)
    const hasSignatureOutro = /Không ai cứu bạn ngoài chính bạn/i.test(scriptText) || /Đứng dậy đi/i.test(scriptText);
    checks.push({ name: 'Signature Outro', pass: hasSignatureOutro });

    // "The Wave" rhythm — mix of short (<8 words) and long (>20 words) sentences
    const sentences = scriptText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length <= 8).length;
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length >= 20).length;
    const hasWaveRhythm = shortSentences >= 5 && longSentences >= 3;
    checks.push({ name: `Wave rhythm (${shortSentences} short + ${longSentences} long)`, pass: hasWaveRhythm, detail: 'Mix ngắn-dài' });

    // Tone: NOT textbook, NOT hype — check for banned patterns
    const bannedPatterns = [/SIÊU ĐỈNH/i, /CỰC SỐC/i, /KHÔNG THỂ TIN/i, /Theo định nghĩa/i];
    const hasBanned = bannedPatterns.some(p => p.test(scriptText));
    checks.push({ name: 'Tone (no hype/textbook)', pass: !hasBanned });

    if (parsed) {
      checks.push({ name: 'Has title', pass: !!parsed.title });
      const estMin = parsed.estimatedMinutes || (wordCount / 150);
      checks.push({ name: `Duration ~${estMin.toFixed(0)} min`, pass: estMin >= 8 && estMin <= 20 });
    }

    return checks;
  },
  4: (output) => {
    const checks = [];
    try {
      const parsed = typeof output === 'string' ? JSON.parse(output) : output;
      checks.push({ name: 'Has audio files', pass: Array.isArray(parsed.audioFiles) && parsed.audioFiles.length > 0 });
      checks.push({ name: 'Has total duration', pass: parsed.totalDuration > 0 });
      checks.push({ name: 'Duration > 60s', pass: parsed.totalDuration > 60, detail: `Got: ${parsed.totalDuration?.toFixed(1)}s` });
      checks.push({ name: 'Audio files exist', pass: parsed.audioFiles?.some(f => existsSync(f.path)) });
      const failedChunks = parsed.failedChunks || 0;
      checks.push({ name: `Failed chunks (${failedChunks})`, pass: failedChunks === 0 });
    } catch {
      checks.push({ name: 'Valid audio data', pass: false, detail: 'Cannot parse' });
    }
    return checks;
  },
  5: (output) => {
    const checks = [];
    checks.push({ name: 'Has content', pass: output.length > 200 });
    checks.push({ name: 'Has visual segments', pass: /segment|scene|visual/i.test(output) });
    checks.push({ name: 'Has thumbnail', pass: /thumbnail/i.test(output) });
    return checks;
  },
  7: (output) => {
    const checks = [];
    try {
      const parsed = JSON.parse(output);
      checks.push({ name: 'Valid JSON', pass: true });
      const yt = parsed.metadata?.youtube || parsed.youtube || parsed;
      checks.push({ name: 'Has title', pass: !!(yt.title) && yt.title.length <= 100, detail: yt.title?.substring(0, 60) });
      checks.push({ name: 'Has description', pass: !!(yt.description) && yt.description.length > 50 });
      const tags = yt.tags || parsed.tags || [];
      checks.push({ name: `Has tags (${tags.length})`, pass: Array.isArray(tags) && tags.length >= 10 });
      checks.push({ name: 'Title is Vietnamese', pass: /[àáảãạăắằẳẵặâấầẩẫậ]/i.test(yt.title || '') });
    } catch {
      checks.push({ name: 'Valid JSON', pass: false });
    }
    return checks;
  },
};

function printValidation(stageNum, checks) {
  const passed = checks.filter(c => c.pass).length;
  const total = checks.length;
  const allPass = passed === total;
  
  console.log(chalk.bold(`\n  Validation: Stage ${stageNum} (${STAGES[stageNum].name})`));
  console.log(chalk.gray('  ' + '─'.repeat(50)));
  
  for (const check of checks) {
    const icon = check.pass ? chalk.green('✓') : chalk.red('✗');
    const detail = check.detail ? chalk.gray(` — ${check.detail}`) : '';
    console.log(`  ${icon} ${check.name}${detail}`);
  }
  
  const summary = allPass 
    ? chalk.bold.green(`  PASS ${passed}/${total}`) 
    : chalk.bold.red(`  FAIL ${passed}/${total}`);
  console.log(`\n  ${summary}`);
  return allPass;
}

async function loadCheckpoint(stageNum) {
  const path = join(CHECKPOINT_DIR, `stage_${stageNum}.json`);
  if (!existsSync(path)) return null;
  const data = JSON.parse(await readFile(path, 'utf-8'));
  return data;
}

async function saveCheckpoint(stageNum, result) {
  await mkdir(CHECKPOINT_DIR, { recursive: true });
  const path = join(CHECKPOINT_DIR, `stage_${stageNum}.json`);
  await writeFile(path, JSON.stringify({
    stage: stageNum,
    name: STAGES[stageNum].name,
    key: STAGES[stageNum].key,
    output: result.content || result,
    meta: result.meta || {},
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log(chalk.gray(`  💾 Checkpoint saved: ${path}`));
}

async function runStage(conductor, stageNum, memory) {
  const stage = STAGES[stageNum];
  if (!stage) {
    console.log(chalk.red(`Unknown stage: ${stageNum}`));
    return null;
  }

  console.log(chalk.bold.cyan(`\n${'═'.repeat(60)}`));
  console.log(chalk.bold.cyan(`  🚀 STATIC FIRE TEST — Stage ${stageNum}: ${stage.name}`));
  console.log(chalk.bold.cyan(`${'═'.repeat(60)}`));

  const agent = conductor.agents.get(stage.agent);
  if (!agent) {
    console.log(chalk.red(`  Agent not found: ${stage.agent}`));
    return null;
  }

  const { youtubePodcastPipeline } = await import('./pipelines/youtube-podcast.js');
  const pipelineStageDef = youtubePodcastPipeline.stages[stageNum - 1];
  const task = pipelineStageDef.task(memory, { topic: TOPIC });

  console.log(chalk.gray(`  Task: ${task.substring(0, 100)}...`));
  console.log(chalk.gray(`  Model: ${agent.model}`));
  
  // Build execution context for stages that need file paths from prior stages
  const context = {};
  if (stageNum === 6 && memory.audio_data) {
    try {
      const audioInfo = typeof memory.audio_data === "string" ? JSON.parse(memory.audio_data) : memory.audio_data;
      if (audioInfo.audioFiles && audioInfo.audioFiles.length > 0) {
        const audioDir = audioInfo.audioFiles[0].path.replace(/[\\\/][^\\\/]+$/, "");
        const fullMp3 = join(audioDir, "podcast_full.mp3");
        const fullWav = join(audioDir, "podcast_full.wav");
        if (existsSync(fullMp3)) context.audioPath = fullMp3;
        else if (existsSync(fullWav)) context.audioPath = fullWav;
        else if (existsSync(audioInfo.audioFiles[0].path)) context.audioPath = audioInfo.audioFiles[0].path;
        if (context.audioPath) console.log(chalk.gray(`  Audio path: ${context.audioPath}`));
      }
    } catch (e) { /* audio_data parse failed */ }
  }

  const t0 = Date.now();
  try {
    const result = await agent.execute(task, context);
    const elapsed = Date.now() - t0;

    console.log(chalk.green(`\n  ✅ Stage ${stageNum} completed in ${(elapsed / 1000).toFixed(1)}s`));
    
    const content = result.content || (typeof result === 'string' ? result : JSON.stringify(result));
    console.log(chalk.gray(`  Output size: ${content.length} chars`));
    
    const preview = content.substring(0, 300).replace(/\n/g, ' ');
    console.log(chalk.gray(`  Preview: ${preview}...`));

    if (result.meta) {
      console.log(chalk.gray(`  Tokens: ${result.meta.tokens?.input || '?'} in / ${result.meta.tokens?.output || '?'} out`));
      console.log(chalk.gray(`  Cost: $${result.meta.cost?.toFixed(4) || '?'}`));
    }

    await saveCheckpoint(stageNum, { content, meta: result.meta });

    if (VALIDATORS[stageNum]) {
      const valid = printValidation(stageNum, VALIDATORS[stageNum](content));
      return { content, meta: result.meta, valid, elapsed };
    }

    return { content, meta: result.meta, valid: true, elapsed };
  } catch (err) {
    const elapsed = Date.now() - t0;
    console.log(chalk.red(`\n  ❌ Stage ${stageNum} FAILED after ${(elapsed / 1000).toFixed(1)}s`));
    console.log(chalk.red(`  Error: ${err.message}`));
    return { content: null, error: err.message, valid: false, elapsed };
  }
}

async function buildMemory(upToStage) {
  const memory = {};
  for (let i = 1; i < upToStage; i++) {
    const cp = await loadCheckpoint(i);
    if (cp) {
      memory[cp.key] = cp.output;
      console.log(chalk.gray(`  📂 Loaded Stage ${i} checkpoint (${cp.output.length} chars)`));
    }
  }
  return memory;
}

async function main() {
  const args = process.argv.slice(2);
  const stageArg = args.find((_, i, a) => a[i - 1] === '--stage') || args[0];
  const fromCheckpoint = args.includes('--from-checkpoint') || args.includes('-c');
  const validateOnly = args.find((_, i, a) => a[i - 1] === '--validate');
  const stopOnFail = args.includes('--stop-on-fail');

  if (!stageArg && !validateOnly) {
    console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════╗
║      STAGE TEST HARNESS — SpaceX Mode           ║
║      Test each rocket stage before launch        ║
╚══════════════════════════════════════════════════╝

Usage:
  --stage <1-7|all>    Run specific stage or all
  --topic <text>       Topic to test with
  --from-checkpoint    Use saved outputs from previous stages
  --stop-on-fail       Stop running when a stage fails
  --validate <1-7>     Validate existing checkpoint only

Stages:
  1: Harvester        — Content extraction
  2: Brain Curator    — Knowledge curation
  3: Script Writer    — Podcast script generation
  4: Voice Producer   — TTS audio generation
  5: Visual Director  — Storyboard creation
  6: Video Assembler  — FFmpeg command generation
  7: Publisher        — SEO metadata creation

Examples:
  node src/test-stage.js --stage 1 --topic "AI trends 2026"
  node src/test-stage.js --stage 3 -c           # Uses Stage 1+2 checkpoints
  node src/test-stage.js --stage all --stop-on-fail
  node src/test-stage.js --validate 3           # Check Stage 3 output
`));
    process.exit(0);
  }

  if (validateOnly) {
    const num = parseInt(validateOnly);
    const cp = await loadCheckpoint(num);
    if (!cp) {
      console.log(chalk.red(`No checkpoint for Stage ${num}`));
      process.exit(1);
    }
    if (VALIDATORS[num]) {
      printValidation(num, VALIDATORS[num](cp.output));
    } else {
      console.log(chalk.yellow(`No validator for Stage ${num}`));
    }
    process.exit(0);
  }

  const conductor = new Conductor();
  const agents = [
    new HarvesterAgent(), new BrainCuratorAgent(), new ScriptWriterAgent(),
    new VoiceProducerAgent(), new VisualDirectorAgent(),
    new VideoComposerAgent(), new PublisherAgent(),
  ];
  for (const agent of agents) conductor.registerAgent(agent);

  console.log(chalk.bold(`\n  Topic: ${TOPIC}`));

  if (stageArg === 'all') {
    console.log(chalk.bold.yellow('\n  🚀 FULL SEQUENCE TEST — Stage by stage\n'));
    const results = {};
    const memory = {};

    for (let i = 1; i <= 7; i++) {
      if (fromCheckpoint) {
        const cp = await loadCheckpoint(i);
        if (cp) {
          console.log(chalk.gray(`  ⏭️  Stage ${i} — using checkpoint`));
          memory[cp.key] = cp.output;
          results[i] = { valid: true, skipped: true };
          continue;
        }
      }

      const result = await runStage(conductor, i, memory);
      results[i] = result;

      if (result?.content) {
        memory[STAGES[i].key] = result.content;
      }

      if (!result?.valid && stopOnFail) {
        console.log(chalk.red(`\n  🛑 ABORT — Stage ${i} failed validation. Fix before continuing.`));
        break;
      }
    }

    console.log(chalk.bold.cyan(`\n${'═'.repeat(60)}`));
    console.log(chalk.bold.cyan('  MISSION SUMMARY'));
    console.log(chalk.bold.cyan(`${'═'.repeat(60)}`));
    for (const [num, r] of Object.entries(results)) {
      const icon = r?.skipped ? '⏭️' : r?.valid ? '✅' : '❌';
      const time = r?.elapsed ? `${(r.elapsed / 1000).toFixed(1)}s` : 'skipped';
      console.log(`  ${icon} Stage ${num}: ${STAGES[num].name} — ${time}`);
    }
  } else {
    const num = parseInt(stageArg);
    const memory = fromCheckpoint ? await buildMemory(num) : {};
    if (num === 1) memory.topic = TOPIC;
    await runStage(conductor, num, memory);
  }
}

main().catch(console.error);
