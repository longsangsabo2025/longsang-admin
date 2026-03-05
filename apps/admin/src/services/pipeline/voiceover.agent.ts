/**
 * 🎤 Voiceover Agent — generates TTS audio from script/storyboard
 *
 * Supports:
 * - Gemini TTS (default) — uses VITE_GEMINI_API_KEY, no extra API to enable
 * - Google Cloud TTS — uses same key but requires Cloud TTS API enabled in GCP
 * - ElevenLabs (premium) — uses VITE_ELEVENLABS_API_KEY
 *
 * If storyboard exists → generates per-scene audio from dialogues.
 * If only script → splits into chunks and generates sequential narration.
 * Saves results to Supabase storage.
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { supabase } from '@/lib/supabase';
import { getRun, startProgressTracker, saveStepResult, failRun, findLatestRunWithFile } from './run-tracker';
import { getNextKey, reportError } from './api-key-pool';

const GEMINI_TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

interface StoryboardScene {
  scene: number;
  dialogue: string;
  prompt: string;
}

export interface VoiceoverClip {
  scene: number;
  url: string;
  duration: number;
  charCount: number;
  engine: string;
}

// ─── TTS Engines ───────────────────────────────────────────

/** Gemini TTS — uses the same Gemini API key, no extra API to enable */
async function geminiTTS(text: string, voice: string, _speed: number, apiKey: string): Promise<Blob> {
  const voiceName = voice || 'Kore';
  const response = await fetch(`${GEMINI_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini TTS error ${response.status}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('audio/')) {
      const b64 = part.inlineData.data as string;
      const byteChars = atob(b64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const mime = (part.inlineData.mimeType as string) || '';
      // Gemini returns raw PCM (audio/L16) — browser can't play it, wrap in WAV
      if (mime.includes('L16') || mime.includes('pcm') || mime.includes('raw')) {
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + byteArray.length, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
        view.setUint16(32, numChannels * bitsPerSample / 8, true);
        view.setUint16(34, bitsPerSample, true);
        writeStr(36, 'data');
        view.setUint32(40, byteArray.length, true);
        return new Blob([wavHeader, byteArray], { type: 'audio/wav' });
      }
      return new Blob([byteArray], { type: mime || 'audio/wav' });
    }
  }
  throw new Error('Gemini TTS returned no audio data');
}

async function googleTTS(text: string, voice: string, speed: number, apiKey: string): Promise<Blob> {
  const langCode = voice.startsWith('en-') ? 'en-US' : 'vi-VN';

  const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: langCode, name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: speed, pitch: 0 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Google TTS error ${response.status}`);
  }

  const data = await response.json() as { audioContent: string };
  const byteChars = atob(data.audioContent);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
  return new Blob([byteArray], { type: 'audio/mpeg' });
}

async function elevenLabsTTS(text: string, voiceId: string, speed: number, apiKey: string): Promise<Blob> {
  const response = await fetch(`${ELEVENLABS_URL}/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: { message?: string } })?.detail?.message || `ElevenLabs error ${response.status}`);
  }

  return response.blob();
}

// ─── Helpers ───────────────────────────────────────────────

async function uploadAudio(blob: Blob, channelId: string, runId: string, filename: string): Promise<string> {
  const filePath = `pipeline-audio/${channelId}/${runId}/${filename}`;
  const contentType = blob.type || 'audio/mpeg';
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, blob, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath);
  return urlData?.publicUrl || '';
}

function cleanTextForTTS(text: string): string {
  return text
    .replace(/^#+\s+.*$/gm, '')                               // headings
    .replace(/\*\*(.*?)\*\*/g, '$1')                           // bold
    .replace(/\*(.*?)\*/g, '$1')                               // italic
    .replace(/\[.*?\]\(.*?\)/g, '')                            // links
    .replace(/```[\s\S]*?```/g, '')                            // code blocks
    .replace(/`[^`]*`/g, '')                                   // inline code
    .replace(/^\s*[-*]\s+/gm, '')                              // bullets
    .replace(/^\s*\d+\.\s+/gm, '')                             // numbered lists
    .replace(/\n{3,}/g, '\n\n')                                // collapse newlines
    .trim();
}

/** Estimate audio duration from character count (~4.5 chars/sec for Vietnamese) */
function estimateDuration(charCount: number, speed: number): number {
  return Math.round(charCount / (4.5 * speed));
}

/** Split text into ~1500-char chunks at paragraph/sentence boundaries for natural TTS */
function splitIntoChunks(text: string, maxLen = 1500): string[] {
  if (text.length <= maxLen) return [text];

  // First split by paragraphs
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let cur = '';

  for (const p of paragraphs) {
    // If adding this paragraph exceeds maxLen, try to flush current
    if ((cur + '\n\n' + p).length > maxLen && cur) {
      chunks.push(cur.trim());
      cur = '';
    }

    // If a single paragraph is too long, split by sentences
    if (p.length > maxLen) {
      if (cur.trim()) { chunks.push(cur.trim()); cur = ''; }
      const sentences = p.split(/(?<=[.!?。]\s)/);
      let sentBuf = '';
      for (const s of sentences) {
        if ((sentBuf + ' ' + s).length > maxLen && sentBuf) {
          chunks.push(sentBuf.trim());
          sentBuf = s;
        } else {
          sentBuf = sentBuf ? sentBuf + ' ' + s : s;
        }
      }
      if (sentBuf.trim()) cur = sentBuf;
    } else {
      cur = cur ? cur + '\n\n' + p : p;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

/** Get file extension from engine type */
function audioExt(engine: string): string {
  return engine === 'gemini-tts' ? 'wav' : 'mp3';
}

/** Generate a single TTS blob using the chosen engine */
async function synthesize(text: string, engine: string, voice: string, speed: number, apiKey: string): Promise<Blob> {
  if (engine === 'elevenlabs') return elevenLabsTTS(text, voice, speed, apiKey);
  if (engine === 'google-tts') return googleTTS(text, voice, speed, apiKey);
  return geminiTTS(text, voice, speed, apiKey);
}

// ─── Main ──────────────────────────────────────────────────

export async function runVoiceover(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const engine = req.voiceoverEngine || 'gemini-tts';
  const voice = req.voiceoverVoice || 'Kore';
  const speed = req.voiceoverSpeed || 1.0;

  // Get API key from pool (falls back to env vars)
  const engineKey = engine === 'elevenlabs' ? 'elevenlabs' : engine === 'google-tts' ? 'google-tts' : 'gemini';
  const apiKey = getNextKey(engineKey);
  if (!apiKey) {
    failRun(run, `Không có API key cho ${engine}. Thêm key trong API Key Pool hoặc cấu hình env var.`);
    return;
  }

  const channelId = req.channelId || 'default';

  // ── Find source text ──────────────────────────────────────
  // Prefer storyboard scenes (per-scene dialogues) → fall back to script.txt
  let scenes: StoryboardScene[] | null = null;
  let storyboardJson = run.result?.files?.['storyboard.json'] as { scenes?: StoryboardScene[] } | undefined;
  if (!storyboardJson?.scenes) {
    const sbRun = findLatestRunWithFile('storyboard.json', req.channelId, runId);
    storyboardJson = sbRun?.result?.files?.['storyboard.json'] as { scenes?: StoryboardScene[] } | undefined;
  }
  if (storyboardJson?.scenes?.some(s => s.dialogue?.trim())) {
    scenes = storyboardJson.scenes;
  }

  let scriptTxt = run.result?.files?.['script.txt'] as string | undefined;
  if (!scriptTxt) {
    const scriptRun = findLatestRunWithFile('script.txt', req.channelId, runId);
    scriptTxt = scriptRun?.result?.files?.['script.txt'] as string | undefined;
  }

  if (!scenes && !scriptTxt) {
    failRun(run, 'Cần generate Script hoặc Storyboard trước rồi mới tạo voiceover. Chạy Step 1 hoặc 2 trước!');
    return;
  }

  // If user applied TTS-optimized cleanedScript → always use full-script mode
  const hasCleanedScript = !!req.voiceoverCleanedScript?.trim();
  if (hasCleanedScript && scriptTxt) {
    run.logs.push({ t: Date.now(), level: 'info', msg: '📝 TTS-optimized script detected — using full-script mode (skipping storyboard scenes)' });
    scenes = null;
  }

  // ── Per-scene mode (storyboard available) ─────────────────
  if (scenes && scenes.some(s => s.dialogue?.trim())) {
    const validScenes = scenes.filter(s => s.dialogue?.trim());
    const total = validScenes.length;
    run.logs.push({ t: Date.now(), level: 'info', msg: `🎤 Found ${total} scene dialogues — generating per-scene voiceover (${engine})...` });

    const phases: ProgressPhase[] = validScenes.map((s, i) => ({
      pct: Math.round((i / total) * 90) + 5,
      msg: `🎙️ Generating voiceover scene ${s.scene}/${total}...`,
    }));
    phases.push({ pct: 95, msg: '💾 Saving audio clips...' });
    const tracker = startProgressTracker(run, phases, total * 8000);

    const clips: VoiceoverClip[] = [];
    let successCount = 0;
    let failCount = 0;
    let totalDuration = 0;

    try {
      for (let i = 0; i < validScenes.length; i++) {
        const scene = validScenes[i];
        if (run.status !== 'running') break;

        const clean = cleanTextForTTS(scene.dialogue);
        if (!clean) { failCount++; continue; }

        run.logs.push({ t: Date.now(), level: 'info', msg: `[${Math.round(((i + 0.5) / total) * 90) + 5}%] 🎙️ Scene ${scene.scene}: generating (${clean.length} chars)...` });

        try {
          const blob = await synthesize(clean, engine, voice, speed, apiKey);
          const ext = audioExt(engine);
          const filename = `scene-${String(scene.scene).padStart(2, '0')}.${ext}`;
          const url = await uploadAudio(blob, channelId, runId, filename);
          const dur = estimateDuration(clean.length, speed);
          totalDuration += dur;
          clips.push({ scene: scene.scene, url, duration: dur, charCount: clean.length, engine });
          successCount++;
          run.logs.push({ t: Date.now(), level: 'info', msg: `[${Math.round(((i + 1) / total) * 90) + 5}%] ✅ Scene ${scene.scene} voiceover done (~${dur}s)` });
        } catch (err: unknown) {
          failCount++;
          const msg = err instanceof Error ? err.message : String(err);
          run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ Scene ${scene.scene} TTS failed: ${msg}` });
          if (msg.includes('429') || msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('quota')) {
            reportError(engineKey, apiKey, msg);
            run.logs.push({ t: Date.now(), level: 'info', msg: '⏳ Rate limited — waiting 10s...' });
            await new Promise(r => setTimeout(r, 10000));
          }
        }

        if (i < validScenes.length - 1) await new Promise(r => setTimeout(r, 1500));
      }

      clearInterval(tracker);

      if (successCount === 0) {
        failRun(run, `Không tạo được audio clip nào (${failCount} scenes failed)`);
        return;
      }

      const existingFiles = run.result?.files || {};
      saveStepResult(run, {
        outputDir: 'remote',
        files: { ...existingFiles, 'voiceover.json': { clips, totalClips: total, successCount, failCount, totalDuration, engine, voice, speed } },
      });

      const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
      run.logs.push({ t: Date.now(), level: 'info', msg: `[100%] ✅ Voiceover complete: ${successCount}/${total} clips, ~${totalDuration}s total (${elapsed}s)` });
    } catch (err: unknown) {
      clearInterval(tracker);
      failRun(run, err instanceof Error ? err.message : String(err));
    }
    return;
  }

  // ── Full-script mode (no storyboard) ──────────────────────
  // Use cleanedScript (TTS-optimized) if available, otherwise fall back to raw script
  const rawScript = req.voiceoverCleanedScript?.trim() || scriptTxt!;
  const sourceLabel = req.voiceoverCleanedScript?.trim() ? 'TTS-optimized' : 'raw';
  const fullScript = cleanTextForTTS(rawScript);
  if (!fullScript) {
    failRun(run, 'Script trống hoặc không có nội dung text hợp lệ.');
    return;
  }

  run.logs.push({ t: Date.now(), level: 'info', msg: `📝 Using ${sourceLabel} script (${fullScript.length} chars)` });

  const chunks = splitIntoChunks(fullScript);
  const total = chunks.length;
  run.logs.push({ t: Date.now(), level: 'info', msg: `🎤 Full-script mode: ${fullScript.length} chars, ${total} chunk(s) (${engine})...` });

  const phases: ProgressPhase[] = chunks.map((_, i) => ({
    pct: Math.round((i / total) * 90) + 5,
    msg: `🎙️ Generating audio part ${i + 1}/${total}...`,
  }));
  phases.push({ pct: 95, msg: '💾 Saving audio files...' });
  const tracker = startProgressTracker(run, phases, total * 10000);

  const clips: VoiceoverClip[] = [];
  let totalDuration = 0;

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (run.status !== 'running') break;

      run.logs.push({ t: Date.now(), level: 'info', msg: `[${Math.round(((i + 0.5) / total) * 90) + 5}%] 🎙️ Part ${i + 1}: generating (${chunks[i].length} chars)...` });

      const blob = await synthesize(chunks[i], engine, voice, speed, apiKey);
      const ext = audioExt(engine);
      const filename = total === 1 ? `narration.${ext}` : `part-${String(i + 1).padStart(2, '0')}.${ext}`;
      const url = await uploadAudio(blob, channelId, runId, filename);
      const dur = estimateDuration(chunks[i].length, speed);
      totalDuration += dur;
      clips.push({ scene: i + 1, url, duration: dur, charCount: chunks[i].length, engine });

      run.logs.push({ t: Date.now(), level: 'info', msg: `[${Math.round(((i + 1) / total) * 90) + 5}%] ✅ Part ${i + 1} done (~${dur}s)` });

      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 1500));
    }

    clearInterval(tracker);

    const existingFiles = run.result?.files || {};
    saveStepResult(run, {
      outputDir: 'remote',
      files: { ...existingFiles, 'voiceover.json': { clips, totalClips: total, successCount: clips.length, failCount: total - clips.length, totalDuration, engine, voice, speed } },
    });

    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    run.logs.push({ t: Date.now(), level: 'info', msg: `[100%] ✅ Full voiceover complete: ${clips.length} part(s), ~${totalDuration}s total (${elapsed}s)` });
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}

// ─── Single clip regeneration ──────────────────────────────

export async function regenerateSingleClip(opts: {
  text: string;
  engine: string;
  voice: string;
  speed: number;
  channelId: string;
  runId: string;
  sceneNum: number;
}): Promise<{ url: string; duration: number; charCount: number }> {
  const { text, engine, voice, speed, channelId, runId, sceneNum } = opts;
  const engineKey = engine === 'elevenlabs' ? 'elevenlabs' : engine === 'google-tts' ? 'google-tts' : 'gemini';
  const apiKey = getNextKey(engineKey);
  if (!apiKey) throw new Error(`Không có API key cho ${engine}`);

  const clean = cleanTextForTTS(text);
  if (!clean) throw new Error('Text trống');

  const blob = await synthesize(clean, engine, voice, speed, apiKey);
  const ext = audioExt(engine);
  const filename = `scene-${String(sceneNum).padStart(2, '0')}-regen.${ext}`;
  const url = await uploadAudio(blob, channelId, runId, filename);
  const duration = estimateDuration(clean.length, speed);

  return { url, duration, charCount: clean.length };
}
