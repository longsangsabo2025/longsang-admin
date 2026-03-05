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
import { getNextKey, getPoolForEngine, reportError, disableKey } from './api-key-pool';

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
      systemInstruction: {
        parts: [{
          text: `You are a single professional narrator named "${voiceName}". CRITICAL: maintain EXACTLY the same vocal identity, tone, pitch, pace, and speaking style for every piece of text you read. You are narrating different parts of the same video — they must all sound like the same person speaking continuously. Do NOT change your voice character between readings.`,
        }],
      },
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        temperature: 0.1,
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

/** Get file extension from engine type or blob type */
function audioExt(engine: string, blob?: Blob): string {
  // If blob available, detect from actual MIME type (handles Gemini→Google fallback)
  if (blob?.type) {
    if (blob.type.includes('mpeg') || blob.type.includes('mp3')) return 'mp3';
    if (blob.type.includes('wav') || blob.type.includes('pcm') || blob.type.includes('L16')) return 'wav';
  }
  return engine === 'gemini-tts' ? 'wav' : 'mp3';
}

/** Gemini voice → best Google Cloud TTS Vietnamese voice mapping for fallback */
const GEMINI_TO_GOOGLE_VOICE: Record<string, string> = {
  Kore: 'vi-VN-Neural2-A',  Aoede: 'vi-VN-Wavenet-A', Leda: 'vi-VN-Wavenet-C',
  Zephyr: 'vi-VN-Neural2-A', Achernar: 'vi-VN-Wavenet-A', Autonoe: 'vi-VN-Neural2-A',
  Callirrhoe: 'vi-VN-Wavenet-C', Despina: 'vi-VN-Neural2-A', Erinome: 'vi-VN-Wavenet-A',
  Laomedeia: 'vi-VN-Neural2-A', Sulafat: 'vi-VN-Wavenet-C', Vindemiatrix: 'vi-VN-Wavenet-A',
  Charon: 'vi-VN-Neural2-D', Fenrir: 'vi-VN-Wavenet-D', Puck: 'vi-VN-Wavenet-B',
  Orus: 'vi-VN-Neural2-D', Gacrux: 'vi-VN-Wavenet-D', Iapetus: 'vi-VN-Wavenet-B',
  Umbriel: 'vi-VN-Neural2-D', Algenib: 'vi-VN-Wavenet-D', Rasalgethi: 'vi-VN-Neural2-D',
};

function isQuotaError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes('quota') || lower.includes('rate') || msg.includes('429') || lower.includes('resource_exhausted');
}

/** Merge all clip blobs into a single full-audio WAV file using Web Audio API */
async function mergeClipsToFullAudio(
  clips: VoiceoverClip[],
  channelId: string,
  runId: string,
): Promise<string> {
  // Fetch all clip blobs
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
  const decoded: AudioBuffer[] = [];

  for (const clip of clips) {
    const res = await fetch(clip.url);
    const arrBuf = await res.arrayBuffer();
    const bytes = new Uint8Array(arrBuf);
    // If raw PCM, wrap in WAV so AudioContext can decode
    let decodable: ArrayBuffer;
    if (bytes.length > 4 && bytes[0] === 0x52 && bytes[1] === 0x49) {
      // Already has RIFF header
      decodable = arrBuf;
    } else if (bytes.length > 4 && (bytes[0] === 0xFF || bytes[0] === 0x49 || bytes[0] === 0x4F)) {
      // MP3/OGG
      decodable = arrBuf;
    } else {
      // Raw PCM → wrap in WAV header for decoding
      const sr = 24000, ch = 1, bps = 16;
      const hdr = new ArrayBuffer(44);
      const v = new DataView(hdr);
      const w = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + bytes.length, true); w(8, 'WAVE');
      w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, ch, true); v.setUint32(24, sr, true);
      v.setUint32(28, sr * ch * bps / 8, true); v.setUint16(32, ch * bps / 8, true);
      v.setUint16(34, bps, true); w(36, 'data'); v.setUint32(40, bytes.length, true);
      const combined = new Uint8Array(44 + bytes.length);
      combined.set(new Uint8Array(hdr), 0);
      combined.set(bytes, 44);
      decodable = combined.buffer;
    }
    try {
      const buf = await audioCtx.decodeAudioData(decodable.slice(0));
      decoded.push(buf);
    } catch {
      // skip undecodable clip
    }
  }

  audioCtx.close();

  if (decoded.length === 0) throw new Error('No clips could be decoded for merging');

  // Calculate total length and merge
  const sampleRate = decoded[0].sampleRate;
  let totalSamples = 0;
  for (const buf of decoded) totalSamples += buf.length;

  // Interleave into one PCM buffer
  const merged = new Float32Array(totalSamples);
  let offset = 0;
  for (const buf of decoded) {
    merged.set(buf.getChannelData(0), offset);
    offset += buf.length;
  }

  // Convert Float32 → Int16 PCM
  const pcm16 = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1, Math.min(1, merged[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Build WAV
  const pcmBytes = new Uint8Array(pcm16.buffer);
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + pcmBytes.length, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); writeStr(36, 'data'); view.setUint32(40, pcmBytes.length, true);

  const wavBlob = new Blob([wavHeader, pcmBytes], { type: 'audio/wav' });
  return await uploadAudio(wavBlob, channelId, runId, 'full-audio.wav');
}

/** Track exhausted Gemini API keys with TTL-based auto-recovery.
 *  After GEMINI_KEY_COOLDOWN_MS, keys auto-recover and can be retried. */
const GEMINI_KEY_COOLDOWN_MS = 60_000; // 60s cooldown then auto-recover
const _exhaustedGeminiKeys = new Map<string, number>(); // key → timestamp when exhausted

function markGeminiKeyExhausted(key: string) {
  _exhaustedGeminiKeys.set(key, Date.now());
}

function isGeminiKeyExhausted(key: string): boolean {
  const ts = _exhaustedGeminiKeys.get(key);
  if (!ts) return false;
  if (Date.now() - ts >= GEMINI_KEY_COOLDOWN_MS) {
    _exhaustedGeminiKeys.delete(key); // auto-recover after cooldown
    return false;
  }
  return true;
}

function exhaustedGeminiKeyCount(): number {
  // Clean up expired entries and return count
  for (const [k, ts] of _exhaustedGeminiKeys) {
    if (Date.now() - ts >= GEMINI_KEY_COOLDOWN_MS) _exhaustedGeminiKeys.delete(k);
  }
  return _exhaustedGeminiKeys.size;
}

/** Default ElevenLabs voice for Vietnamese narration fallback */
const ELEVENLABS_DEFAULT_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam — multilingual

/** Find a working Gemini key — skip exhausted ones, try pool then env fallback */
function getWorkingGeminiKey(currentKey: string): string | null {
  if (!isGeminiKeyExhausted(currentKey)) return currentKey;
  const remaining = getPoolForEngine('gemini').filter(e => !isGeminiKeyExhausted(e.key));
  if (remaining.length > 0) return remaining[0].key;
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;
  if (envKey && !isGeminiKeyExhausted(envKey)) return envKey;
  return null;
}

/** Try ElevenLabs → Google Cloud TTS → clear error message */
async function fallbackTTS(
  text: string, voice: string, speed: number, geminiKey: string,
  exhaustedCount: number, log: (msg: string) => void,
): Promise<Blob> {
  // 1. Try ElevenLabs (if key available)
  const elKey = (import.meta.env.VITE_ELEVENLABS_API_KEY || '') as string;
  if (elKey) {
    log(`🔄 Fallback → ElevenLabs TTS...`);
    try {
      return await elevenLabsTTS(text, ELEVENLABS_DEFAULT_VOICE, speed, elKey);
    } catch (elErr: unknown) {
      log(`⚠️ ElevenLabs fallback failed: ${elErr instanceof Error ? elErr.message : String(elErr)}`);
    }
  }

  // 2. Try Google Cloud TTS
  const fbVoice = GEMINI_TO_GOOGLE_VOICE[voice] || 'vi-VN-Neural2-D';
  log(`🔄 Fallback → Google Cloud TTS (${fbVoice})...`);
  try {
    return await googleTTS(text, fbVoice, speed, geminiKey);
  } catch (fbErr: unknown) {
    const fbMsg = fbErr instanceof Error ? fbErr.message : String(fbErr);
    if (fbMsg.includes('has not been used') || fbMsg.includes('disabled') || fbMsg.includes('PERMISSION_DENIED')) {
      throw new Error(
        `Gemini TTS đã hết quota (${exhaustedCount} key).` +
        (elKey ? ' ElevenLabs cũng lỗi.' : '') +
        ` Google Cloud TTS chưa bật.\n` +
        `→ Bật Google TTS tại: https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview\n` +
        `→ Hoặc thêm Gemini API key mới vào Key Pool, hoặc đợi reset quota (24h).`
      );
    }
    throw fbErr;
  }
}

/** Generate a single TTS blob using the chosen engine, with retry on transient errors.
 *  On Gemini quota: waits & retries same key first → tries other keys → fallback chain. */
async function synthesize(
  text: string, engine: string, voice: string, speed: number, apiKey: string,
  _logFn?: (msg: string) => void,
): Promise<Blob> {
  const log = _logFn || ((m: string) => console.log('[TTS]', m));

  // Early check: if this Gemini key is already exhausted, find a working one immediately
  let activeKey = apiKey;
  if (engine === 'gemini-tts' && isGeminiKeyExhausted(apiKey)) {
    const fresh = getWorkingGeminiKey(apiKey);
    if (fresh) {
      log(`⚡ Key exhausted — switching to next Gemini key`);
      activeKey = fresh;
    } else {
      // Check if cooldown is almost done — wait for it
      const oldestTs = Math.min(...[..._exhaustedGeminiKeys.values()]);
      const remaining = GEMINI_KEY_COOLDOWN_MS - (Date.now() - oldestTs);
      if (remaining > 0 && remaining <= GEMINI_KEY_COOLDOWN_MS) {
        log(`⏳ All ${exhaustedGeminiKeyCount()} Gemini keys exhausted — waiting ${Math.ceil(remaining / 1000)}s for cooldown...`);
        await new Promise(r => setTimeout(r, remaining + 1000));
        // After cooldown, keys auto-recover
        const recovered = getWorkingGeminiKey(apiKey);
        if (recovered) {
          log(`✅ Gemini key recovered after cooldown`);
          activeKey = recovered;
        } else {
          log(`⚠️ All Gemini keys still exhausted after cooldown`);
          return await fallbackTTS(text, voice, speed, apiKey, exhaustedGeminiKeyCount(), log);
        }
      } else {
        log(`⚠️ All ${exhaustedGeminiKeyCount()} Gemini keys exhausted`);
        return await fallbackTTS(text, voice, speed, apiKey, exhaustedGeminiKeyCount(), log);
      }
    }
  }

  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (engine === 'elevenlabs') return await elevenLabsTTS(text, voice, speed, activeKey);
      if (engine === 'google-tts') return await googleTTS(text, voice, speed, activeKey);
      return await geminiTTS(text, voice, speed, activeKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // ─── Gemini quota/rate-limit handling with smart backoff ───
      if (engine === 'gemini-tts' && isQuotaError(msg)) {
        reportError('gemini', activeKey, msg);

        // Smart backoff: on 429, wait 30s and retry SAME key before marking exhausted
        if (attempt < maxRetries) {
          const waitSec = 30;
          log(`⏳ Gemini rate limited (attempt ${attempt + 1}/${maxRetries}) — waiting ${waitSec}s before retry...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }

        // After all retries failed → mark key exhausted (with TTL auto-recovery)
        markGeminiKeyExhausted(activeKey);
        disableKey('gemini', activeKey, 'Quota exhausted');
        log(`⚠️ Gemini key quota exceeded after ${maxRetries} retries (${exhaustedGeminiKeyCount()} key(s) exhausted, auto-recover in ${GEMINI_KEY_COOLDOWN_MS / 1000}s)`);

        // Try another Gemini API key
        const nextKey = getWorkingGeminiKey(activeKey);
        if (nextKey) {
          log(`🔄 Rotating to next Gemini key...`);
          return await synthesize(text, engine, voice, speed, nextKey, _logFn);
        }

        // No more Gemini keys → fallback chain: ElevenLabs → Google TTS
        return await fallbackTTS(text, voice, speed, activeKey, exhaustedGeminiKeyCount(), log);
      }

      const isRetryable = msg.includes('internal') || msg.includes('500') || msg.includes('503') || msg.includes('retry') || msg.includes('INTERNAL') || msg.includes('Failed to fetch') || msg.includes('fetch');
      if (isRetryable && attempt < maxRetries) {
        const delay = (attempt + 1) * 3000;
        log(`Attempt ${attempt + 1} failed (${msg}), retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('TTS failed after retries');
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

    // ── SINGLE-NARRATION MODE (Gemini TTS / ElevenLabs, >1 scene) ──
    // Gộp tất cả dialogue thành 1 text → 1 API call → giọng 100% nhất quán
    // ElevenLabs: gộp nếu tổng text ≤ 5000 chars (API limit an toàn)
    const combinedLength = validScenes.reduce((s, sc) => s + (sc.dialogue?.length || 0), 0);
    const GEMINI_SAFE_LIMIT = 3500; // Gemini TTS often 500s on long text
    const useSingleNarration = total > 1 && (
      (engine === 'gemini-tts' && combinedLength <= GEMINI_SAFE_LIMIT) ||
      (engine === 'elevenlabs' && combinedLength <= 5000)
    );

    if (useSingleNarration) {
      run.logs.push({ t: Date.now(), level: 'info', msg: `🎤 Single-narration mode: gộp ${total} scenes → 1 API call (${engine}) — giọng nhất quán 100%` });
    } else if (total > 1 && engine === 'gemini-tts' && combinedLength > GEMINI_SAFE_LIMIT) {
      run.logs.push({ t: Date.now(), level: 'info', msg: `📏 Combined dialogue ${combinedLength} chars > ${GEMINI_SAFE_LIMIT} limit — using per-scene mode to avoid Gemini 500 errors` });
    }

    if (useSingleNarration) {

      const phases: ProgressPhase[] = [
        { pct: 10, msg: '📝 Gộp dialogue các scene...' },
        { pct: 30, msg: '🎙️ Generating single narration...' },
        { pct: 80, msg: '✂️ Ước tính timing per scene...' },
        { pct: 95, msg: '💾 Saving audio...' },
      ];
      const tracker = startProgressTracker(run, phases, total * 6000);

      try {
        // Concatenate all scene dialogues with natural pause markers
        const sceneCleaned = validScenes.map(s => cleanTextForTTS(s.dialogue)).filter(Boolean);
        const combinedText = sceneCleaned.join('\n\n... \n\n');

        if (!combinedText.trim()) {
          clearInterval(tracker);
          failRun(run, 'Tất cả scene dialogues đều trống sau khi clean.');
          return;
        }

        run.logs.push({ t: Date.now(), level: 'info', msg: `[30%] 🎙️ Generating single narration (${combinedText.length} chars, ${total} scenes)...` });

        const logFn = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
        const blob = await synthesize(combinedText, engine, voice, speed, apiKey, logFn);
        const ext = audioExt(engine, blob);
        const filename = `full-narration.${ext}`;
        const url = await uploadAudio(blob, channelId, runId, filename);

        // Estimate per-scene durations proportionally based on char count
        const sceneLengths = sceneCleaned.map(s => s.length);
        const totalChars = sceneLengths.reduce((a, b) => a + b, 0);
        const totalDuration = estimateDuration(totalChars, speed);

        // Create clips — all reference the same full narration URL
        const clips: VoiceoverClip[] = validScenes.map((s, i) => ({
          scene: s.scene,
          url,
          duration: Math.round(totalDuration * (sceneLengths[i] / totalChars)),
          charCount: sceneLengths[i],
          engine,
        }));

        clearInterval(tracker);

        const existingFiles = run.result?.files || {};
        saveStepResult(run, {
          outputDir: 'remote',
          files: {
            ...existingFiles,
            'voiceover.json': {
              clips,
              fullNarrationUrl: url,
              singleNarration: true,
              totalClips: total,
              successCount: total,
              failCount: 0,
              totalDuration,
              engine, voice, speed,
            },
          },
        });

        const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
        run.logs.push({ t: Date.now(), level: 'info', msg: `[100%] ✅ Single narration hoàn thành: ${total} scenes, ~${totalDuration}s (${elapsed}s) — 1 API call` });
        return;
      } catch (err: unknown) {
        clearInterval(tracker);
        const msg = err instanceof Error ? err.message : String(err);
        run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ Single narration failed: ${msg} — fallback to per-scene mode...` });
        // Fall through to per-scene mode below
      }
    }

    // ── PER-SCENE MODE (non-Gemini engines, fallback, or single scene) ─
    run.logs.push({ t: Date.now(), level: 'info', msg: `🎤 Per-scene mode: ${total} scenes (${engine})...` });

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
          const logFn = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
          const blob = await synthesize(clean, engine, voice, speed, apiKey, logFn);
          const ext = audioExt(engine, blob);
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
          if (msg.includes('429') || msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('quota') || msg.includes('Failed to fetch')) {
            reportError(engineKey, apiKey, msg);
            const waitSec = engine === 'elevenlabs' ? 15 : 10;
            run.logs.push({ t: Date.now(), level: 'info', msg: `⏳ Rate limited — waiting ${waitSec}s...` });
            await new Promise(r => setTimeout(r, waitSec * 1000));
          }
        }

        if (i < validScenes.length - 1) await new Promise(r => setTimeout(r, engine === 'elevenlabs' ? 4000 : 1500));
      }

      clearInterval(tracker);

      if (successCount === 0) {
        failRun(run, `Không tạo được audio clip nào (${failCount} scenes failed)`);
        return;
      }

      // Merge all clips into a single full-audio file
      let fullAudioUrl = '';
      if (clips.length > 0) {
        try {
          run.logs.push({ t: Date.now(), level: 'info', msg: '🔗 Merging clips into full audio...' });
          fullAudioUrl = await mergeClipsToFullAudio(clips, channelId, runId);
          run.logs.push({ t: Date.now(), level: 'info', msg: '✅ Full audio created' });
        } catch (err: unknown) {
          run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ Full audio merge failed: ${err instanceof Error ? err.message : String(err)}` });
        }
      }

      const existingFiles = run.result?.files || {};
      saveStepResult(run, {
        outputDir: 'remote',
        files: { ...existingFiles, 'voiceover.json': { clips, totalClips: total, successCount, failCount, totalDuration, engine, voice, speed, fullAudioUrl } },
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

      const logFn = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
      const blob = await synthesize(chunks[i], engine, voice, speed, apiKey, logFn);
      const ext = audioExt(engine, blob);
      const filename = total === 1 ? `narration.${ext}` : `part-${String(i + 1).padStart(2, '0')}.${ext}`;
      const url = await uploadAudio(blob, channelId, runId, filename);
      const dur = estimateDuration(chunks[i].length, speed);
      totalDuration += dur;
      clips.push({ scene: i + 1, url, duration: dur, charCount: chunks[i].length, engine });

      run.logs.push({ t: Date.now(), level: 'info', msg: `[${Math.round(((i + 1) / total) * 90) + 5}%] ✅ Part ${i + 1} done (~${dur}s)` });

      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 1500));
    }

    clearInterval(tracker);

    // Merge all clips into a single full-audio file
    let fullAudioUrl = '';
    if (clips.length > 0) {
      try {
        run.logs.push({ t: Date.now(), level: 'info', msg: '🔗 Merging parts into full audio...' });
        fullAudioUrl = await mergeClipsToFullAudio(clips, channelId, runId);
        run.logs.push({ t: Date.now(), level: 'info', msg: '✅ Full audio created' });
      } catch (err: unknown) {
        run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ Full audio merge failed: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    const existingFiles = run.result?.files || {};
    saveStepResult(run, {
      outputDir: 'remote',
      files: { ...existingFiles, 'voiceover.json': { clips, totalClips: total, successCount: clips.length, failCount: total - clips.length, totalDuration, engine, voice, speed, fullAudioUrl } },
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
  const ext = audioExt(engine, blob);
  const filename = `scene-${String(sceneNum).padStart(2, '0')}-regen.${ext}`;
  const url = await uploadAudio(blob, channelId, runId, filename);
  const duration = estimateDuration(clean.length, speed);

  return { url, duration, charCount: clean.length };
}
