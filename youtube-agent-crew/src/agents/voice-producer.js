/**
 * AGENT 4: Voice Producer
 * 
 * Mission: Convert script to natural-sounding Vietnamese audio via VoxCPM-1.5-VN
 * - Self-hosted VoxCPM-1.5-VN (800M params) on RTX 4090
 * - Voice cloning with 10s reference audio
 * - TTS Preprocessor: foreign name transliteration, breathing pauses, text normalization
 * - Smart text chunking (no LLM needed — deterministic split)
 * - Per-chunk TTS → FFmpeg concat → final podcast audio
 * 
 * Input: Podcast script with voice directions
 * Output: Audio file(s) path
 */
import { BaseAgent } from '../core/agent.js';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { preprocessForTTS } from './tts-preprocessor.js';
import { probeTest, auditChunk, ttsVerifyChunk } from './tts-auditor.js';

/**
 * Split Vietnamese text into TTS-friendly chunks at natural boundaries.
 * Each chunk ≤ maxChars characters, split at sentence endings.
 */
function splitTextToChunks(text, maxChars = 400) {
  // Clean the text: remove stage directions, markdown, etc.
  const cleaned = text
    .replace(/\[.*?\]/g, '')              // [stage directions]
    .replace(/\*\*.*?\*\*/g, '')          // **bold markers**
    .replace(/#{1,3}\s+/g, '')            // ### headings
    .replace(/---+/g, '')                 // --- separators
    .replace(/\n{3,}/g, '\n\n')           // excess newlines
    .trim();

  // Split into sentences (Vietnamese + general punctuation)
  const sentences = cleaned
    .split(/(?<=[.!?…。]\s)|(?<=\n\n)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

export class VoiceProducerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'voice-producer',
      name: '🎙️ Voice Producer',
      role: 'TTS Audio Production via VoxCPM-1.5-VN',
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: 'You are a voice production assistant.',
      temperature: 0.3,
      maxTokens: 1024,
    });
    this.ttsUrl = process.env.VOXCPM_API_URL || 'http://localhost:8100';
    this.outputDir = process.env.OUTPUT_DIR || './output';
  }

  /**
   * Check if VoxCPM TTS API is running
   */
  async healthCheck() {
    try {
      const res = await fetch(`${this.ttsUrl}/v1/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate audio for a single text chunk using VoxCPM-1.5-VN TTS
   * Returns the output path on success
   */
  async generateChunk(text, outputPath, retries = 2) {
    const body = JSON.stringify({
      text,
      voice_clone: true,
      cfg_value: 2.0,
      inference_timesteps: 25,   // higher = better quality
      max_len: 2000,
      min_len: 50,
      normalize: false,
      speed: 0.92,               // slightly slower for podcast pacing
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.ttsUrl}/v1/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => 'unknown');
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 1000) {
          throw new Error(`Suspiciously small audio: ${buffer.length} bytes`);
        }

        await writeFile(outputPath, buffer);
        return outputPath;
      } catch (error) {
        if (attempt < retries) {
          this.log(`Chunk retry ${attempt + 1}/${retries}: ${error.message}`, 'warn');
          await new Promise(r => setTimeout(r, 2000));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Concatenate WAV files using FFmpeg
   */
  async concatAudio(wavPaths, outputPath) {
    if (wavPaths.length === 0) throw new Error('No audio files to concat');
    if (wavPaths.length === 1) {
      // Just copy the single file
      const data = await readFile(wavPaths[0]);
      await writeFile(outputPath, data);
      return outputPath;
    }

    // Create FFmpeg concat list file with absolute paths
    const listPath = outputPath.replace(/\.\w+$/, '_list.txt');
    const { resolve } = await import('path');
    const listContent = wavPaths
      .map(p => `file '${resolve(p).replace(/\\/g, '/')}'`)
      .join('\n');
    await writeFile(listPath, listContent);

    try {
      const absOutput = resolve(outputPath).replace(/\\/g, '/');
      const absListPath = resolve(listPath).replace(/\\/g, '/');
      execSync(
        `ffmpeg -y -f concat -safe 0 -i "${absListPath}" -c:a pcm_s16le "${absOutput}"`,
        { timeout: 120000, stdio: 'pipe' }
      );
      this.log(`Concatenated ${wavPaths.length} chunks → ${outputPath}`, 'success');
      return outputPath;
    } catch (error) {
      this.log(`FFmpeg concat failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Convert WAV to MP3 for final output
   */
  async convertToMp3(wavPath, mp3Path) {
    try {
      const { resolve } = await import('path');
      const absWav = resolve(wavPath).replace(/\\/g, '/');
      const absMp3 = resolve(mp3Path).replace(/\\/g, '/');
      execSync(
        `ffmpeg -y -i "${absWav}" -codec:a libmp3lame -b:a 192k -ar 44100 "${absMp3}"`,
        { timeout: 120000, stdio: 'pipe' }
      );
      return mp3Path;
    } catch (error) {
      this.log(`MP3 conversion failed: ${error.message}`, 'warn');
      return wavPath; // fallback to WAV
    }
  }

  /**
   * Extract clean Vietnamese text from script JSON, raw text, or pipeline task prompt.
   * Handles: JSON with .script array, raw text with [PAUSE] markers, or pipeline task wrappers.
   */
  extractScriptText(raw) {
    if (!raw || typeof raw !== 'string') return '';

    // Try to find JSON embedded in a larger string (pipeline task wraps it)
    const jsonMatches = raw.match(/\{[\s\S]*"script"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    const jsonCandidate = jsonMatches ? jsonMatches[0] : raw;

    try {
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.script && Array.isArray(parsed.script)) {
        return parsed.script
          .map(s => s.text || '')
          .filter(t => t.length > 0)
          .join('\n\n');
      }
      if (parsed.text) return parsed.text;
      if (typeof parsed === 'string') return parsed;
    } catch {
      // Not JSON — check for Vietnamese text with voice markers
    }

    // Strip pipeline task instructions, keep only script content
    const scriptStart = raw.indexOf('--- [');
    if (scriptStart > 0) return raw.substring(scriptStart);

    // If it has Vietnamese chars + voice markers, it's probably already script text
    if (/[àáảãạăắằẳẵặâấầẩẫậ]/.test(raw) && raw.length > 200) {
      return raw;
    }

    return raw;
  }

  /**
   * Override execute: probe → preprocess → chunk → audit each → concat
   * SpaceX approach: static fire test before every launch.
   */
  async execute(task, context = {}) {
    // ─── GATE 0: Health check ───
    const healthy = await this.healthCheck();
    if (!healthy) {
      this.log('❌ VoxCPM TTS API not reachable at ' + this.ttsUrl, 'error');
      return JSON.stringify({
        error: 'VoxCPM TTS API not running',
        hint: 'Start server: cd voxcpm-tts && .venv/Scripts/python server.py --port 8100',
      });
    }
    this.log('✅ VoxCPM TTS API healthy', 'success');

    // ─── GATE 1: Probe test — 1 sentence, validate before batch ───
    this.log('🧪 PROBE TEST — testing TTS with 1 sentence...', 'info');
    const probe = await probeTest(this.ttsUrl);
    if (!probe.pass) {
      this.log(`❌ PROBE FAILED — aborting TTS batch`, 'error');
      for (const check of (probe.checks || [])) {
        const icon = check.pass ? '✓' : '✗';
        this.log(`  ${icon} ${check.name}${check.detail ? ` (${check.detail})` : ''}`, check.pass ? 'info' : 'error');
      }
      return JSON.stringify({ error: 'TTS probe test failed', probe });
    }
    this.log(`✅ PROBE PASS — ${probe.audioDuration?.toFixed(1)}s audio, RTF=${probe.rtf?.toFixed(2)}`, 'success');

    // ─── Extract & preprocess script ───
    let scriptText = '';
    if (context.scriptText) {
      scriptText = context.scriptText;
    } else if (context.previousResults) {
      const scriptResult = context.previousResults['script-writer'] || 
                           context.previousResults['brain-curator'] || '';
      scriptText = typeof scriptResult === 'string' ? scriptResult : JSON.stringify(scriptResult);
    } else if (typeof task === 'string') {
      scriptText = task;
    }

    scriptText = this.extractScriptText(scriptText);

    if (!scriptText || scriptText.length < 50) {
      this.log('No script text found', 'error');
      return JSON.stringify({ error: 'No script text provided' });
    }

    this.log(`📝 Script: ${scriptText.length} chars`, 'info');

    this.log('🔧 Preprocessing text for TTS...', 'info');
    const preprocessed = await preprocessForTTS(scriptText, { useLLM: true });
    this.log(`🔧 Preprocessed: ${preprocessed.length} chars (was ${scriptText.length})`, 'info');

    const chunks = splitTextToChunks(preprocessed, 250);
    this.log(`🔪 Split into ${chunks.length} chunks (avg ${Math.round(preprocessed.length / chunks.length)} chars)`, 'info');

    // ─── GATE 2: Generate + audit first 3 chunks before full batch ───
    const pipelineId = context.pipelineId || `standalone_${Date.now()}`;
    const audioDir = join(this.outputDir, pipelineId, 'audio');
    await mkdir(audioDir, { recursive: true });

    const audioPaths = [];
    const auditResults = [];
    const errors = [];
    const startTime = Date.now();
    let consecutiveFails = 0;
    const MAX_CONSECUTIVE_FAILS = 3;

    const MIN_SIMILARITY = 0.5;
    this.log(`🔥 GATE 2: Testing first 3 chunks with Whisper language audit (min_sim=${MIN_SIMILARITY})...`, 'info');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const outputPath = join(audioDir, `chunk_${String(i).padStart(3, '0')}.wav`);
      const isEarlyGate = i < 3;

      try {
        this.log(`🎤 [${i + 1}/${chunks.length}] ${chunk.substring(0, 60)}...`, 'info');

        // Use tts-verify for early gate (TTS + Whisper in one call)
        if (isEarlyGate) {
          const verify = await ttsVerifyChunk(chunk, this.ttsUrl, MIN_SIMILARITY);
          if (verify.error) throw new Error(verify.error);

          if (!verify.pass) {
            this.log(`❌ LANGUAGE FAIL chunk ${i + 1}: sim=${verify.similarity?.toFixed(2)}`, 'error');
            this.log(`   IN:  ${chunk.substring(0, 70)}`, 'warn');
            this.log(`   OUT: ${(verify.transcribed || '').substring(0, 70)}`, 'warn');
            consecutiveFails++;

            if (consecutiveFails >= 2) {
              return JSON.stringify({
                error: `Early gate language audit failed: ${consecutiveFails} chunks below similarity threshold`,
                similarity: verify.similarity,
                original: chunk.substring(0, 100),
                transcribed: (verify.transcribed || '').substring(0, 100),
                hint: 'Vietnamese TTS quality too low — check model, voice ref, or text preprocessing',
              });
            }
            continue;
          }

          // Write verified audio to file
          if (verify.audioBase64) {
            await writeFile(outputPath, Buffer.from(verify.audioBase64, 'base64'));
          }

          audioPaths.push(outputPath);
          auditResults.push({ chunk: i, pass: true, similarity: verify.similarity, duration: verify.duration });
          this.log(`✅ Chunk ${i + 1} VERIFIED (sim=${verify.similarity?.toFixed(2)}, ${verify.duration}s)`, 'success');

          if (i === 2 && audioPaths.length >= 2) {
            const avgSim = auditResults.reduce((s, a) => s + (a.similarity || 0), 0) / auditResults.length;
            this.log(`🚀 GATE 2 PASS — avg similarity: ${avgSim.toFixed(2)}. Full batch go!`, 'success');
          }
        } else {
          // For remaining chunks: generate without Whisper verify (faster)
          // Whisper verify is expensive — early gate already confirmed quality
          await this.generateChunk(chunk, outputPath);

          // Quick file-level sanity check only
          const audit = await auditChunk(outputPath, chunk);
          auditResults.push({ chunk: i, ...audit });

          if (!audit.pass) {
            const issues = audit.layers.flatMap(l => l.issues || []);
            this.log(`⚠️  Chunk ${i + 1} audit: ${issues.join('; ')}`, 'warn');
            consecutiveFails++;
            if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
              this.log(`❌ ${MAX_CONSECUTIVE_FAILS} consecutive failures — aborting`, 'error');
              break;
            }
          } else {
            consecutiveFails = 0;
          }
          audioPaths.push(outputPath);
        }

      } catch (error) {
        this.log(`❌ Chunk ${i + 1} failed: ${error.message}`, 'error');
        errors.push({ chunk: i, error: error.message });
        consecutiveFails++;

        if (isEarlyGate && consecutiveFails >= 2) {
          return JSON.stringify({
            error: `Early gate failed on chunk ${i + 1}: ${error.message}`,
            totalGenerated: i,
          });
        }

        if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
          this.log(`❌ ${MAX_CONSECUTIVE_FAILS} consecutive failures — aborting`, 'error');
          break;
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    this.log(`⏱️ TTS: ${audioPaths.length}/${chunks.length} chunks in ${elapsed}s`, 'info');

    if (audioPaths.length === 0) {
      return JSON.stringify({ error: 'All TTS chunks failed', errors });
    }

    // ─── Concatenate + convert ───
    const finalWav = join(audioDir, 'podcast_full.wav');
    await this.concatAudio(audioPaths, finalWav);

    const finalMp3 = join(audioDir, 'podcast_full.mp3');
    const finalPath = await this.convertToMp3(finalWav, finalMp3);

    const { memory } = await import('../core/memory.js');
    memory.set(pipelineId, 'audio_paths', audioPaths);
    memory.set(pipelineId, 'audio_dir', audioDir);
    memory.set(pipelineId, 'final_audio', finalPath);

    const totalDuration = auditResults
      .filter(a => a.layers?.[0]?.duration)
      .reduce((sum, a) => sum + a.layers[0].duration, 0);

    const avgScore = auditResults.length > 0
      ? auditResults.reduce((sum, a) => sum + (a.score || 0), 0) / auditResults.length
      : 0;

    // ─── Save manifest for chunk-level repair ───
    const manifest = {
      version: 1,
      pipelineId,
      audioDir,
      finalAudio: finalPath,
      totalChunks: chunks.length,
      createdAt: new Date().toISOString(),
      chunks: chunks.map((text, i) => ({
        index: i,
        text,
        audioFile: join(audioDir, `chunk_${String(i).padStart(3, '0')}.wav`),
        status: audioPaths.includes(join(audioDir, `chunk_${String(i).padStart(3, '0')}.wav`)) ? 'ok' : 'failed',
        similarity: auditResults.find(a => a.chunk === i)?.similarity || null,
        duration: auditResults.find(a => a.chunk === i)?.duration
          || auditResults.find(a => a.chunk === i)?.layers?.[0]?.duration || null,
      })),
    };

    const manifestPath = join(audioDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    this.log(`📋 Manifest saved: ${manifestPath}`, 'info');

    const result = {
      provider: 'voxcpm-1.5-vn',
      model: 'VoxCPM-1.5-VN (800M)',
      voiceClone: !!this.voiceRef,
      totalChunks: chunks.length,
      successChunks: audioPaths.length,
      failedChunks: errors.length,
      totalDuration,
      avgQualityScore: +avgScore.toFixed(2),
      audioFiles: audioPaths.map((p, i) => ({
        path: p,
        audit: auditResults[i] || null,
      })),
      finalAudio: finalPath,
      audioDir,
      manifestPath,
      elapsed: `${elapsed}s`,
      errors: errors.length > 0 ? errors : undefined,
    };

    this.log(`🎧 Final audio: ${finalPath} (${totalDuration.toFixed(1)}s, quality: ${avgScore.toFixed(2)})`, 'success');
    return JSON.stringify(result);
  }

  /**
   * Repair specific chunks by index. Regenerate only bad chunks, re-concat.
   * Like replacing a bad Raptor engine without rebuilding the whole rocket.
   * 
   * @param {string} manifestPath - Path to manifest.json
   * @param {number[]} chunkIndexes - Which chunks to regenerate
   * @param {object} opts - { verify: true } to run Whisper back-check on repairs
   */
  async repairChunks(manifestPath, chunkIndexes, opts = {}) {
    const manifestData = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const { audioDir, chunks: chunkList } = manifestData;

    this.log(`🔧 REPAIR MODE — fixing ${chunkIndexes.length} chunks: [${chunkIndexes.join(', ')}]`, 'info');

    const repaired = [];

    for (const idx of chunkIndexes) {
      const chunk = chunkList[idx];
      if (!chunk) {
        this.log(`⚠️ Chunk ${idx} not found in manifest`, 'warn');
        continue;
      }

      const outputPath = chunk.audioFile;
      this.log(`🎤 Repairing chunk ${idx}: ${chunk.text.substring(0, 60)}...`, 'info');

      try {
        if (opts.verify) {
          const verify = await ttsVerifyChunk(chunk.text, this.ttsUrl, 0.5);
          if (verify.error) throw new Error(verify.error);

          if (!verify.pass) {
            this.log(`❌ Repair chunk ${idx} still fails (sim=${verify.similarity?.toFixed(2)})`, 'error');
            this.log(`   OUT: ${(verify.transcribed || '').substring(0, 70)}`, 'warn');
            repaired.push({ index: idx, status: 'still_bad', similarity: verify.similarity });
            continue;
          }

          if (verify.audioBase64) {
            await writeFile(outputPath, Buffer.from(verify.audioBase64, 'base64'));
          }
          chunk.status = 'repaired';
          chunk.similarity = verify.similarity;
          this.log(`✅ Chunk ${idx} repaired (sim=${verify.similarity?.toFixed(2)})`, 'success');
        } else {
          await this.generateChunk(chunk.text, outputPath);
          chunk.status = 'repaired';
          this.log(`✅ Chunk ${idx} regenerated`, 'success');
        }

        repaired.push({ index: idx, status: 'repaired' });
      } catch (err) {
        this.log(`❌ Chunk ${idx} repair failed: ${err.message}`, 'error');
        repaired.push({ index: idx, status: 'error', error: err.message });
      }
    }

    // Update manifest
    manifestData.lastRepair = { at: new Date().toISOString(), chunks: repaired };
    await writeFile(manifestPath, JSON.stringify(manifestData, null, 2));

    // Re-concat all chunks
    const allPaths = chunkList
      .filter(c => c.status === 'ok' || c.status === 'repaired')
      .map(c => c.audioFile)
      .filter(p => existsSync(p));

    if (allPaths.length > 0) {
      const finalWav = join(audioDir, 'podcast_full.wav');
      await this.concatAudio(allPaths, finalWav);
      const finalMp3 = join(audioDir, 'podcast_full.mp3');
      await this.convertToMp3(finalWav, finalMp3);
      this.log(`🎧 Re-concatenated ${allPaths.length} chunks → ${finalMp3}`, 'success');
    }

    return { repaired, totalFixed: repaired.filter(r => r.status === 'repaired').length };
  }
}

export default VoiceProducerAgent;
