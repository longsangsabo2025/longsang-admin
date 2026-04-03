/**
 * 🎤 Voiceover Agent — generates TTS audio from script/storyboard
 *
 * Supports:
 * - Gemini TTS (primary) — uses VITE_GEMINI_API_KEY
 * - ElevenLabs (premium fallback) — uses VITE_ELEVENLABS_API_KEY
 *
 * If storyboard exists → generates per-scene audio from dialogues.
 * If only script → splits into chunks and generates sequential narration.
 * Saves results to Supabase storage.
 */

import { supabase } from '@/integrations/supabase/client';
import { PIPELINE_BASE, pipelineHeaders } from './api-client';
import { disableKey, getNextKey, getPoolForEngine, reportError } from './api-key-pool';
import { trackCost } from './cost-tracker';
import {
  failRun,
  findLatestRunWithFile,
  getRun,
  saveStepResult,
  startProgressTracker,
} from './run-tracker';
import type { GenerateRequest, ProgressPhase } from './types';

const GEMINI_TTS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
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

// ─── Shared Helpers ─────────────────────────────────────────

/** Decode base64 string to Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  const byteChars = atob(b64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
  return byteArray;
}

/** Build a 44-byte WAV header for raw PCM data */
function buildWavHeader(
  pcmLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): ArrayBuffer {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  v.setUint32(4, 36 + pcmLength, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
  v.setUint16(32, (numChannels * bitsPerSample) / 8, true);
  v.setUint16(34, bitsPerSample, true);
  w(36, 'data');
  v.setUint32(40, pcmLength, true);
  return header;
}

/** Get max chunk length per engine (single source of truth) */
function getMaxChunkLen(engine: string): number {
  switch (engine) {
    case 'elevenlabs':
      return 5000;
    case 'gemini-tts':
      // Gemini TTS docs: session context window is 32k tokens.
      // Use a conservative chunk (~8k chars) to reduce voice drift caused by over-chunking
      // while still staying comfortably below practical request limits.
      return 8000;
    default:
      return 3000;
  }
}

// ─── TTS Engines ───────────────────────────────────────────

/** Gemini TTS via backend proxy (keeps API key server-side) */
async function geminiTTS(
  text: string,
  voice: string,
  _speed: number,
  _apiKey: string
): Promise<Blob> {
  const decodeGeminiAudio = (data: unknown): Blob => {
    const obj = data as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
      }>;
    };
    const parts = obj.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((p) => p.inlineData?.data);
    if (!audioPart?.inlineData?.data) throw new Error('No audio returned from Gemini');
    const byteArray = base64ToBytes(audioPart.inlineData.data);
    const mime = audioPart.inlineData.mimeType || '';
    if (mime.includes('L16') || mime.includes('pcm') || mime.includes('raw')) {
      return new Blob([buildWavHeader(byteArray.length), byteArray], { type: 'audio/wav' });
    }
    return new Blob([byteArray], { type: mime || 'audio/wav' });
  };

  const directGeminiTTS = async (): Promise<Blob> => {
    const apiKey = _apiKey || ((import.meta.env.VITE_GEMINI_API_KEY || '') as string);
    if (!apiKey) throw new Error('No Gemini API key for direct TTS fallback');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `You are a single professional narrator named "${voice || 'Kore'}". CRITICAL: maintain EXACTLY the same vocal identity, tone, pitch, pace, and speaking style for every piece of text you read.`,
              },
            ],
          },
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            temperature: 0.1,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Kore' } },
            },
          },
        }),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message ||
          `Gemini direct TTS error ${response.status}`
      );
    }
    const data = await response.json();
    return decodeGeminiAudio(data);
  };

  const response = await fetch(`${PIPELINE_BASE}/api/admin/proxy/tts`, {
    method: 'POST',
    headers: pipelineHeaders(),
    body: JSON.stringify({
      text,
      engine: 'gemini-tts',
      voice: voice || 'Kore',
      // Send client key pool to backend proxy so rotation works instantly
      // without requiring server env changes/redeploy.
      apiKey: _apiKey || undefined,
      apiKeys: getPoolForEngine('gemini').map((e) => e.key),
    }),
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 503) {
      return directGeminiTTS();
    }
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || `TTS proxy error ${response.status}`);
  }

  const data = (await response.json()) as {
    audioBase64?: string;
    mimeType?: string;
    error?: string;
  };
  if (data.error || !data.audioBase64) throw new Error(data.error || 'TTS proxy returned no audio');

  const byteArray = base64ToBytes(data.audioBase64);
  const mime = data.mimeType || '';
  if (mime.includes('L16') || mime.includes('pcm') || mime.includes('raw')) {
    return new Blob([buildWavHeader(byteArray.length), byteArray], { type: 'audio/wav' });
  }
  return new Blob([byteArray], { type: mime || 'audio/wav' });
}

async function elevenLabsTTS(
  text: string,
  voiceId: string,
  speed: number,
  _apiKey: string
): Promise<Blob> {
  const response = await fetch(`${PIPELINE_BASE}/api/admin/proxy/tts`, {
    method: 'POST',
    headers: pipelineHeaders(),
    body: JSON.stringify({ text, engine: 'elevenlabs', voice: voiceId, speed }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || `TTS proxy error ${response.status}`);
  }

  const data = (await response.json()) as {
    audioBase64?: string;
    mimeType?: string;
    error?: string;
  };
  if (data.error || !data.audioBase64) throw new Error(data.error || 'TTS proxy returned no audio');

  const byteArray = base64ToBytes(data.audioBase64);
  return new Blob([byteArray], { type: data.mimeType || 'audio/mpeg' });
}

async function googleTTS(
  text: string,
  voiceName: string,
  speed: number,
  apiKey: string
): Promise<Blob> {
  const voice = voiceName || 'vi-VN-Neural2-D';
  const langMatch = voice.match(/^([a-z]{2}-[A-Z]{2})-/);
  const languageCode = langMatch?.[1] || 'vi-VN';

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voice },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speed || 1.0,
          pitch: 0,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `Google TTS error ${response.status}`
    );
  }

  const data = (await response.json()) as { audioContent?: string };
  if (!data.audioContent) throw new Error('Google TTS returned no audio');

  const byteArray = base64ToBytes(data.audioContent);
  return new Blob([byteArray], { type: 'audio/mpeg' });
}

// ─── Helpers ───────────────────────────────────────────────

async function uploadAudio(
  blob: Blob,
  channelId: string,
  runId: string,
  filename: string
): Promise<string> {
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
    .replace(/===SCRIPT_START===|===SCRIPT_END===/g, '') // pipeline delimiters
    .replace(/^---\s*\[.*?\]\s*.*?---$/gm, '') // section markers: --- [0:00] HOOK ---
    .replace(/^---\s+\S+.*$/gm, '') // alt section markers: --- HOOK ---
    .replace(/^\[\d+:\d+(?::\d+)?\]\s*/gm, '') // timestamps: [0:00] or [0:00:00]
    .replace(/^#+\s+.*$/gm, '') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/\[.*?\]\(.*?\)/g, '') // links
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]*`/g, '') // inline code
    .replace(/^\s*[-*]\s+/gm, '') // bullets
    .replace(/^\s*\d+\.\s+/gm, '') // numbered lists
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu,
      ''
    ) // emojis
    .replace(/\n{3,}/g, '\n\n') // collapse newlines
    .trim();
}

/** Estimate audio duration from character count (~4.5 chars/sec for Vietnamese) */
function estimateDuration(charCount: number, speed: number): number {
  return Math.round(charCount / (4.5 * speed));
}

/** Rough token estimate for planning chunk sizes safely. */
function estimateTokens(text: string): number {
  // Vietnamese prose is commonly around 3-4 chars/token.
  return Math.ceil(text.length / 3.2);
}

/** Adaptive chunk size to reduce voice drift while staying under model limits. */
function getAdaptiveChunkLen(engine: string, text: string): number {
  if (engine !== 'gemini-tts') return getMaxChunkLen(engine);

  const tokens = estimateTokens(text);
  // Gemini TTS context window is 32k tokens (official docs).
  // Keep conservative headroom for prompt wrappers/system instructions.
  if (tokens <= 7000) return 20000; // one-shot for typical scripts
  if (tokens <= 14000) return 12000;
  return 9000;
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
      if (cur.trim()) {
        chunks.push(cur.trim());
        cur = '';
      }
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
  // If blob available, detect from actual MIME type
  if (blob?.type) {
    if (blob.type.includes('mpeg') || blob.type.includes('mp3')) return 'mp3';
    if (blob.type.includes('wav') || blob.type.includes('pcm') || blob.type.includes('L16'))
      return 'wav';
  }
  return engine === 'gemini-tts' ? 'wav' : 'mp3';
}

function isQuotaError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('rate') ||
    msg.includes('429') ||
    lower.includes('resource_exhausted')
  );
}

function isGoogleUnavailableError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('cloud text-to-speech api has not been used') ||
    lower.includes('texttospeech.googleapis.com') ||
    lower.includes('api disabled') ||
    lower.includes('permission denied') ||
    msg.includes('403')
  );
}

/** Save current voiceover.json to history before overwriting */
function pushVoiceoverHistory(run: {
  result?: { outputDir: string; files: Record<string, unknown> };
}): void {
  const existing = run.result?.files?.['voiceover.json'] as Record<string, unknown> | undefined;
  if (!existing?.clips) return; // nothing to archive
  const history = (run.result?.files?.['voiceover-history.json'] || []) as Record<
    string,
    unknown
  >[];
  history.push({ ...existing, archivedAt: new Date().toISOString() });
  if (run.result) run.result.files['voiceover-history.json'] = history;
}

/** Merge all clip blobs into a single full-audio WAV file using Web Audio API */
async function mergeClipsToFullAudio(
  clips: VoiceoverClip[],
  channelId: string,
  runId: string
): Promise<string> {
  // Fetch all clip blobs
  const audioCtx = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  )({ sampleRate: 24000 });
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
    } else if (bytes.length > 4 && (bytes[0] === 0xff || bytes[0] === 0x49 || bytes[0] === 0x4f)) {
      // MP3/OGG
      decodable = arrBuf;
    } else {
      // Raw PCM → wrap in WAV header for decoding
      const hdr = buildWavHeader(bytes.length);
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
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Build WAV
  const pcmBytes = new Uint8Array(pcm16.buffer);
  const wavBlob = new Blob([buildWavHeader(pcmBytes.length, sampleRate), pcmBytes], {
    type: 'audio/wav',
  });
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

function getGeminiEnvPoolKeys(): string[] {
  const raw = [
    (import.meta.env.VITE_GEMINI_API_KEYS || '') as string,
    (import.meta.env.VITE_GEMINI_KEY_POOL || '') as string,
  ]
    .filter(Boolean)
    .join(',');

  if (!raw.trim()) return [];
  return raw
    .split(/[\n,;|]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function getAllGeminiCandidates(currentKey?: string): string[] {
  const poolKeys = getPoolForEngine('gemini').map((e) => e.key);
  const envSingle = ((import.meta.env.VITE_GEMINI_API_KEY || '') as string).trim();
  const envPool = getGeminiEnvPoolKeys();
  const ordered = [currentKey || '', ...poolKeys, envSingle, ...envPool].filter(Boolean);
  return Array.from(new Set(ordered));
}

/** Default ElevenLabs voice for Vietnamese narration fallback */
const ELEVENLABS_DEFAULT_VOICE = 'pNInz6obpgDQGcFmaJgB'; // Adam — multilingual

/** Find a working Gemini key — skip exhausted ones, try pool then env fallback */
function getWorkingGeminiKey(currentKey: string): string | null {
  const candidates = getAllGeminiCandidates(currentKey);
  for (const key of candidates) {
    if (!isGeminiKeyExhausted(key)) return key;
  }
  return null;
}

/** Fallback: try ElevenLabs when Gemini fails */
async function fallbackTTS(
  text: string,
  _voice: string,
  speed: number,
  _geminiKey: string,
  _exhaustedCount: number,
  log: (msg: string) => void,
  allowEngineFallback = true
): Promise<Blob> {
  if (!allowEngineFallback) {
    throw new Error(
      `Gemini TTS lỗi sau nhiều lần thử và đang ở chế độ Gemini-only (không fallback engine).` +
        `\n→ Kiểm tra quota/key pool Gemini.`
    );
  }

  const elKey = (import.meta.env.VITE_ELEVENLABS_API_KEY || '') as string;
  if (elKey) {
    log(`🔄 Fallback → ElevenLabs TTS...`);
    try {
      return await elevenLabsTTS(text, ELEVENLABS_DEFAULT_VOICE, speed, elKey);
    } catch (elErr: unknown) {
      log(
        `⚠️ ElevenLabs fallback failed: ${elErr instanceof Error ? elErr.message : String(elErr)}`
      );
    }
  }

  throw new Error(
    `Gemini TTS lỗi sau nhiều lần thử.` +
      (elKey ? ' ElevenLabs cũng lỗi.' : ' Không có ElevenLabs API key.') +
      `\n→ Kiểm tra Gemini API key còn quota không.\n→ Hoặc thêm VITE_ELEVENLABS_API_KEY để dùng ElevenLabs làm fallback.`
  );
}

/** Generate a single TTS blob using the chosen engine, with retry on transient errors.
 *  On Gemini quota: waits & retries same key first → tries other keys → ElevenLabs fallback. */
async function synthesize(
  text: string,
  engine: string,
  voice: string,
  speed: number,
  apiKey: string,
  _logFn?: (msg: string) => void,
  options?: { allowEngineFallback?: boolean }
): Promise<Blob> {
  const log = _logFn || ((m: string) => console.log('[TTS]', m));
  const allowEngineFallback = options?.allowEngineFallback !== false;

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
        log(
          `⏳ All ${exhaustedGeminiKeyCount()} Gemini keys exhausted — waiting ${Math.ceil(remaining / 1000)}s for cooldown...`
        );
        await new Promise((r) => setTimeout(r, remaining + 1000));
        // After cooldown, keys auto-recover
        const recovered = getWorkingGeminiKey(apiKey);
        if (recovered) {
          log(`✅ Gemini key recovered after cooldown`);
          activeKey = recovered;
        } else {
          log(`⚠️ All Gemini keys still exhausted after cooldown`);
          return await fallbackTTS(
            text,
            voice,
            speed,
            apiKey,
            exhaustedGeminiKeyCount(),
            log,
            allowEngineFallback
          );
        }
      } else {
        log(`⚠️ All ${exhaustedGeminiKeyCount()} Gemini keys exhausted`);
        return await fallbackTTS(
          text,
          voice,
          speed,
          apiKey,
          exhaustedGeminiKeyCount(),
          log,
          allowEngineFallback
        );
      }
    }
  }

  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let blob: Blob;
      if (engine === 'elevenlabs') blob = await elevenLabsTTS(text, voice, speed, activeKey);
      else if (engine === 'google-tts') blob = await googleTTS(text, voice, speed, activeKey);
      else blob = await geminiTTS(text, voice, speed, activeKey);
      trackCost({
        step: 'voiceover',
        model: engine === 'gemini-tts' ? 'gemini-tts' : engine,
        type: 'tts',
        quantity: text.length,
      });
      return blob;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      if (engine === 'google-tts' && isGoogleUnavailableError(msg)) {
        const geminiKey = getNextKey('gemini');
        if (geminiKey) {
          const fallbackVoice = voice?.startsWith('vi-') ? 'Algenib' : 'Kore';
          log('⚠️ Google TTS unavailable/disabled for current key — fallback to Gemini TTS...');
          return await synthesize(
            text,
            'gemini-tts',
            fallbackVoice,
            speed,
            geminiKey,
            _logFn,
            options
          );
        }
      }

      // ─── Gemini quota/rate-limit handling with smart backoff ───
      if (engine === 'gemini-tts' && isQuotaError(msg)) {
        reportError('gemini', activeKey, msg);

        // Fast failover on quota: more retries in gemini-only mode before giving up.
        const maxQuotaRetries = !allowEngineFallback ? 3 : 1;
        const waitSec = !allowEngineFallback ? 15 : 8;
        if (attempt < maxQuotaRetries) {
          log(
            `⏳ Gemini rate limited (attempt ${attempt + 1}/${maxQuotaRetries}) — waiting ${waitSec}s before retry...`
          );
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          continue;
        }

        // After all retries failed → mark key exhausted (with TTL auto-recovery)
        markGeminiKeyExhausted(activeKey);
        disableKey('gemini', activeKey, 'Quota exhausted');
        log(
          `⚠️ Gemini key quota exceeded; key marked exhausted (${exhaustedGeminiKeyCount()} key(s) exhausted, auto-recover in ${GEMINI_KEY_COOLDOWN_MS / 1000}s)`
        );

        // Try another Gemini API key
        const nextKey = getWorkingGeminiKey(activeKey);
        if (nextKey) {
          log(`🔄 Rotating to next Gemini key...`);
          return await synthesize(text, engine, voice, speed, nextKey, _logFn, options);
        }

        // gemini-only mode: wait full cooldown and retry before hard failing
        if (!allowEngineFallback) {
          log(
            `⏳ Gemini-only: tất cả key đang bị quota. Chờ ${GEMINI_KEY_COOLDOWN_MS / 1000}s rồi tự động thử lại...`
          );
          await new Promise((r) => setTimeout(r, GEMINI_KEY_COOLDOWN_MS + 2000));
          const recovered = getWorkingGeminiKey('');
          if (recovered) {
            log(`✅ Gemini key phục hồi sau cooldown, thử lại...`);
            return await synthesize(text, engine, voice, speed, recovered, _logFn, options);
          }
        }

        // No more Gemini keys → fallback to ElevenLabs
        return await fallbackTTS(
          text,
          voice,
          speed,
          activeKey,
          exhaustedGeminiKeyCount(),
          log,
          allowEngineFallback
        );
      }

      const isRetryable =
        msg.includes('internal') ||
        msg.includes('500') ||
        msg.includes('503') ||
        msg.includes('retry') ||
        msg.includes('INTERNAL') ||
        msg.includes('Failed to fetch') ||
        msg.includes('fetch');
      if (isRetryable && attempt < maxRetries) {
        const delay = (attempt + 1) * 3000;
        log(`Attempt ${attempt + 1} failed (${msg}), retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // ─── Gemini persistent internal errors → fallback chain (preserves voice gender) ───
      if (engine === 'gemini-tts' && isRetryable) {
        log(`⚠️ Gemini TTS internal error after ${maxRetries} retries — falling back...`);
        // gemini-only mode: try rotating to another key before hard failing
        if (!allowEngineFallback) {
          const altKey = getWorkingGeminiKey(activeKey);
          if (altKey) {
            log(`🔄 Gemini key rotation after retryable error...`);
            return await synthesize(text, engine, voice, speed, altKey, _logFn, options);
          }
        }
        return await fallbackTTS(text, voice, speed, activeKey, 0, log, allowEngineFallback);
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
  const voice = req.voiceoverVoice || (req.channelId === 'dung-day-di' ? 'Algenib' : 'Kore');
  const speed = req.voiceoverSpeed || 1.0;
  const geminiOnlyMode = engine === 'gemini-tts' && req.channelId === 'dung-day-di';

  // Get API key from pool (falls back to env vars)
  const engineKey =
    engine === 'elevenlabs' ? 'elevenlabs' : engine === 'google-tts' ? 'google-tts' : 'gemini';
  const apiKey = getNextKey(engineKey) || (engine === 'google-tts' ? getNextKey('gemini') : null);
  if (!apiKey) {
    failRun(
      run,
      `Không có API key cho ${engine}. Thêm key trong API Key Pool hoặc cấu hình env var.`
    );
    return;
  }

  const channelId = req.channelId || 'default';

  // ── Find source text ──────────────────────────────────────
  // Prefer storyboard scenes (per-scene dialogues) → fall back to script.txt
  let scenes: StoryboardScene[] | null = null;
  const runTopic = req.topic || req.transcript || null;
  let storyboardJson = run.result?.files?.['storyboard.json'] as
    | { scenes?: StoryboardScene[] }
    | undefined;
  if (!storyboardJson?.scenes) {
    const sbRun = findLatestRunWithFile('storyboard.json', req.channelId, runId, runTopic);
    storyboardJson = sbRun?.result?.files?.['storyboard.json'] as
      | { scenes?: StoryboardScene[] }
      | undefined;
  }
  if (storyboardJson?.scenes?.some((s) => s.dialogue?.trim())) {
    scenes = storyboardJson.scenes;
  }

  // Prefer script-tts.txt (TTS-ready) → fall back to script.txt (raw with markers)
  let scriptTxt =
    (run.result?.files?.['script-tts.txt'] as string | undefined) ||
    (run.result?.files?.['script.txt'] as string | undefined);
  if (!scriptTxt) {
    const scriptRun =
      findLatestRunWithFile('script-tts.txt', req.channelId, runId, runTopic) ||
      findLatestRunWithFile('script.txt', req.channelId, runId, runTopic);
    scriptTxt =
      (scriptRun?.result?.files?.['script-tts.txt'] as string | undefined) ||
      (scriptRun?.result?.files?.['script.txt'] as string | undefined);
  }

  if (!scenes && !scriptTxt) {
    failRun(
      run,
      'Cần generate Script hoặc Storyboard trước rồi mới tạo voiceover. Chạy Step 1 hoặc 2 trước!'
    );
    return;
  }

  // If user applied TTS-optimized cleanedScript → always use full-script mode (skip storyboard)
  const hasCleanedScript = !!req.voiceoverCleanedScript?.trim();
  if (hasCleanedScript) {
    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: '📝 TTS-optimized script detected — using full-script mode (skipping storyboard scenes)',
    });
    scenes = null;
    if (!scriptTxt) scriptTxt = req.voiceoverCleanedScript!;
  }

  // ── Per-scene mode (storyboard available) ─────────────────
  if (scenes?.some((s) => s.dialogue?.trim())) {
    const validScenes = scenes.filter((s) => s.dialogue?.trim());
    const total = validScenes.length;

    // ── SINGLE-NARRATION MODE (Gemini TTS / ElevenLabs, >1 scene) ──
    // Gộp tất cả dialogue thành 1 text → 1 API call → giọng 100% nhất quán
    // ElevenLabs: gộp nếu tổng text ≤ 5000 chars (API limit an toàn)
    const combinedLength = validScenes.reduce((s, sc) => s + (sc.dialogue?.length || 0), 0);
    const combinedTextForPlan = validScenes
      .map((s) => cleanTextForTTS(s.dialogue))
      .join('\n\n... \n\n');
    const combinedTokens = estimateTokens(combinedTextForPlan);
    const GEMINI_SAFE_LIMIT = 20000; // aggressively prefer one-shot for consistency/cost
    const EDGE_SAFE_LIMIT = 8000; // Edge TTS handles long text very well
    const FISH_SAFE_LIMIT = 5000; // Fish Speech handles medium-length text well
    const useSingleNarration =
      total > 1 &&
      ((engine === 'edge-tts' && combinedLength <= EDGE_SAFE_LIMIT) ||
        (engine === 'fish-speech' && combinedLength <= FISH_SAFE_LIMIT) ||
        (engine === 'gemini-tts' &&
          combinedLength <= GEMINI_SAFE_LIMIT &&
          combinedTokens <= 7000) ||
        (engine === 'elevenlabs' && combinedLength <= 5000));

    if (useSingleNarration) {
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `🎤 Single-narration mode: gộp ${total} scenes → 1 API call (${engine}) — giọng nhất quán 100%`,
      });
    } else if (total > 1 && combinedLength > GEMINI_SAFE_LIMIT) {
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `📏 Combined dialogue ${combinedLength} chars > ${GEMINI_SAFE_LIMIT} limit — sẽ chia thành 2-3 phần thay vì ${total} clips riêng`,
      });
    }

    // ── COMBINED-CHUNKED MODE (text too long for single call, but NOT per-scene) ──
    // Gộp tất cả dialogue → chia 2-3 chunk lớn → mỗi chunk 1 API call
    if (!useSingleNarration && total > 1 && combinedLength > 0) {
      const sceneCleaned = validScenes.map((s) => cleanTextForTTS(s.dialogue)).filter(Boolean);
      const combinedText = sceneCleaned.join('\n\n... \n\n');
      if (!combinedText.trim()) {
        failRun(run, 'Tất cả scene dialogues đều trống sau khi clean.');
        return;
      }

      const maxChunkLen = getAdaptiveChunkLen(engine, combinedText);
      const chunks = splitIntoChunks(combinedText, maxChunkLen);
      const totalChunks = chunks.length;
      const tokenEstimate = estimateTokens(combinedText);
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `🎤 Chunked mode: ${combinedText.length} chars (~${tokenEstimate} tok) → ${totalChunks} phần (max ${maxChunkLen}/chunk, ${engine})`,
      });

      const phases: ProgressPhase[] = chunks.map((_, i) => ({
        pct: Math.round((i / totalChunks) * 90) + 5,
        msg: `🎙️ Generating audio part ${i + 1}/${totalChunks}...`,
      }));
      phases.push({ pct: 95, msg: '💾 Saving audio...' });
      const tracker = startProgressTracker(run, phases, totalChunks * 10000);

      const clips: VoiceoverClip[] = [];
      let totalDuration = 0;

      try {
        for (let i = 0; i < chunks.length; i++) {
          if (run.status !== 'running') break;
          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: `[${Math.round(((i + 0.5) / totalChunks) * 90) + 5}%] 🎙️ Part ${i + 1}: generating (${chunks[i].length} chars)...`,
          });

          const logFn = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
          const blob = await synthesize(chunks[i], engine, voice, speed, apiKey, logFn, {
            allowEngineFallback: !geminiOnlyMode,
          });
          const ext = audioExt(engine, blob);
          const filename =
            totalChunks === 1
              ? `narration.${ext}`
              : `part-${String(i + 1).padStart(2, '0')}.${ext}`;
          const url = await uploadAudio(blob, channelId, runId, filename);
          const dur = estimateDuration(chunks[i].length, speed);
          totalDuration += dur;
          clips.push({ scene: i + 1, url, duration: dur, charCount: chunks[i].length, engine });

          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: `[${Math.round(((i + 1) / totalChunks) * 90) + 5}%] ✅ Part ${i + 1} done (~${dur}s)`,
          });
          if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 1500));
        }

        clearInterval(tracker);

        if (clips.length === 0) {
          failRun(run, `Không tạo được audio nào (${totalChunks} chunks failed)`);
          return;
        }

        // Merge all clips into full audio
        let fullAudioUrl = '';
        if (clips.length > 0) {
          try {
            run.logs.push({
              t: Date.now(),
              level: 'info',
              msg: '🔗 Merging parts into full audio...',
            });
            fullAudioUrl = await mergeClipsToFullAudio(clips, channelId, runId);
            run.logs.push({ t: Date.now(), level: 'info', msg: '✅ Full audio created' });
          } catch (err: unknown) {
            run.logs.push({
              t: Date.now(),
              level: 'warn',
              msg: `⚠️ Full audio merge failed: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }

        // Build per-scene clips referencing full audio (proportional durations)
        // Chunked clips have scene: chunkIndex, but assembly needs scene: storyboardSceneNumber
        const perSceneClips: VoiceoverClip[] = validScenes.map((s) => {
          const charLen = cleanTextForTTS(s.dialogue).length || 1;
          const totalCharsAll = validScenes.reduce(
            (acc, sc) => acc + (cleanTextForTTS(sc.dialogue).length || 1),
            0
          );
          return {
            scene: s.scene,
            url: fullAudioUrl || clips[0]?.url || '',
            duration: Math.round(totalDuration * (charLen / totalCharsAll)),
            charCount: charLen,
            engine,
          };
        });

        const existingFiles = run.result?.files || {};
        pushVoiceoverHistory(run);
        saveStepResult(run, {
          outputDir: 'remote',
          files: {
            ...existingFiles,
            'voiceover.json': {
              clips: fullAudioUrl ? perSceneClips : clips,
              totalClips: fullAudioUrl ? validScenes.length : totalChunks,
              successCount: clips.length,
              failCount: totalChunks - clips.length,
              totalDuration,
              engine,
              voice,
              speed,
              singleNarration: !!fullAudioUrl,
              fullNarrationUrl: fullAudioUrl || undefined,
              fullAudioUrl,
            },
          },
        });

        const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
        run.logs.push({
          t: Date.now(),
          level: 'info',
          msg: `[100%] ✅ Voiceover hoàn thành: ${clips.length} phần, ~${totalDuration}s total (${elapsed}s)`,
        });
      } catch (err: unknown) {
        clearInterval(tracker);
        failRun(run, err instanceof Error ? err.message : String(err));
      }
      return;
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
        const sceneCleaned = validScenes.map((s) => cleanTextForTTS(s.dialogue)).filter(Boolean);
        const combinedText = sceneCleaned.join('\n\n... \n\n');

        if (!combinedText.trim()) {
          clearInterval(tracker);
          failRun(run, 'Tất cả scene dialogues đều trống sau khi clean.');
          return;
        }

        run.logs.push({
          t: Date.now(),
          level: 'info',
          msg: `[30%] 🎙️ Generating single narration (${combinedText.length} chars, ${total} scenes)...`,
        });

        const logFn = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
        const blob = await synthesize(combinedText, engine, voice, speed, apiKey, logFn, {
          allowEngineFallback: !geminiOnlyMode,
        });
        const ext = audioExt(engine, blob);
        const filename = `full-narration.${ext}`;
        const url = await uploadAudio(blob, channelId, runId, filename);

        // Estimate per-scene durations proportionally based on char count
        const sceneLengths = sceneCleaned.map((s) => s.length);
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
        pushVoiceoverHistory(run);
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
              engine,
              voice,
              speed,
            },
          },
        });

        const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
        run.logs.push({
          t: Date.now(),
          level: 'info',
          msg: `[100%] ✅ Single narration hoàn thành: ${total} scenes, ~${totalDuration}s (${elapsed}s) — 1 API call`,
        });
        return;
      } catch (err: unknown) {
        clearInterval(tracker);
        const msg = err instanceof Error ? err.message : String(err);
        run.logs.push({
          t: Date.now(),
          level: 'warn',
          msg: `⚠️ Single narration failed: ${msg} — fallback to chunked mode...`,
        });
        // Fall through — the chunked mode block above already returned, so we need to re-invoke it
        // Re-combine and use chunked mode
        const sceneCleaned2 = validScenes.map((s) => cleanTextForTTS(s.dialogue)).filter(Boolean);
        const combinedText2 = sceneCleaned2.join('\n\n... \n\n');
        const maxChunkLen2 = getAdaptiveChunkLen(engine, combinedText2);
        const chunks2 = splitIntoChunks(combinedText2, maxChunkLen2);
        const tokenEstimate2 = estimateTokens(combinedText2);
        run.logs.push({
          t: Date.now(),
          level: 'info',
          msg: `🎤 Fallback chunked: ${combinedText2.length} chars (~${tokenEstimate2} tok) → ${chunks2.length} phần (max ${maxChunkLen2})`,
        });

        const clips2: VoiceoverClip[] = [];
        let totalDur2 = 0;
        for (let i = 0; i < chunks2.length; i++) {
          if (run.status !== 'running') break;
          try {
            const logFn2 = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
            const blob2 = await synthesize(chunks2[i], engine, voice, speed, apiKey, logFn2, {
              allowEngineFallback: !geminiOnlyMode,
            });
            const ext2 = audioExt(engine, blob2);
            const filename2 = `part-${String(i + 1).padStart(2, '0')}.${ext2}`;
            const url2 = await uploadAudio(blob2, channelId, runId, filename2);
            const dur2 = estimateDuration(chunks2[i].length, speed);
            totalDur2 += dur2;
            clips2.push({
              scene: i + 1,
              url: url2,
              duration: dur2,
              charCount: chunks2[i].length,
              engine,
            });
          } catch {
            /* skip */
          }
          if (i < chunks2.length - 1) await new Promise((r) => setTimeout(r, 1500));
        }
        if (clips2.length > 0) {
          let fullAudio2 = '';
          try {
            fullAudio2 = await mergeClipsToFullAudio(clips2, channelId, runId);
          } catch {
            /* ignore */
          }
          // Build per-scene clips for assembly (proportional durations)
          const perSceneClips2: VoiceoverClip[] = fullAudio2
            ? validScenes.map((s) => {
                const charLen = cleanTextForTTS(s.dialogue).length || 1;
                const totalCharsAll = validScenes.reduce(
                  (acc, sc) => acc + (cleanTextForTTS(sc.dialogue).length || 1),
                  0
                );
                return {
                  scene: s.scene,
                  url: fullAudio2,
                  duration: Math.round(totalDur2 * (charLen / totalCharsAll)),
                  charCount: charLen,
                  engine,
                };
              })
            : clips2;
          const existingFiles2 = run.result?.files || {};
          saveStepResult(run, {
            outputDir: 'remote',
            files: {
              ...existingFiles2,
              'voiceover.json': {
                clips: perSceneClips2,
                totalClips: fullAudio2 ? validScenes.length : chunks2.length,
                successCount: clips2.length,
                failCount: chunks2.length - clips2.length,
                totalDuration: totalDur2,
                engine,
                voice,
                speed,
                singleNarration: !!fullAudio2,
                fullNarrationUrl: fullAudio2 || undefined,
                fullAudioUrl: fullAudio2,
              },
            },
          });
          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: `[100%] ✅ Fallback chunked hoàn thành: ${clips2.length} phần, ~${totalDur2}s`,
          });
          return;
        }
        failRun(run, 'Single narration + chunked fallback both failed');
        return;
      }
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

  run.logs.push({
    t: Date.now(),
    level: 'info',
    msg: `📝 Using ${sourceLabel} script (${fullScript.length} chars)`,
  });

  const maxChunkLen = getAdaptiveChunkLen(engine, fullScript);
  const chunks = splitIntoChunks(fullScript, maxChunkLen);
  const total = chunks.length;
  const tokenEstimate = estimateTokens(fullScript);
  run.logs.push({
    t: Date.now(),
    level: 'info',
    msg: `🎤 Full-script mode: ${fullScript.length} chars (~${tokenEstimate} tok) → ${total} chunk(s) (max ${maxChunkLen}/chunk, ${engine})`,
  });

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

      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `[${Math.round(((i + 0.5) / total) * 90) + 5}%] 🎙️ Part ${i + 1}: generating (${chunks[i].length} chars)...`,
      });

      const logFn = (m: string) => run.logs.push({ t: Date.now(), level: 'info', msg: m });
      const blob = await synthesize(chunks[i], engine, voice, speed, apiKey, logFn, {
        allowEngineFallback: !geminiOnlyMode,
      });
      const ext = audioExt(engine, blob);
      const filename =
        total === 1 ? `narration.${ext}` : `part-${String(i + 1).padStart(2, '0')}.${ext}`;
      const url = await uploadAudio(blob, channelId, runId, filename);
      const dur = estimateDuration(chunks[i].length, speed);
      totalDuration += dur;
      clips.push({ scene: i + 1, url, duration: dur, charCount: chunks[i].length, engine });

      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `[${Math.round(((i + 1) / total) * 90) + 5}%] ✅ Part ${i + 1} done (~${dur}s)`,
      });

      if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 1500));

      // Progressive save after each clip — data is never lost if merge hangs later
      const existingFilesPartial = run.result?.files || {};
      saveStepResult(run, {
        outputDir: 'remote',
        files: {
          ...existingFilesPartial,
          'voiceover.json': {
            clips: [...clips],
            totalClips: total,
            successCount: clips.length,
            failCount: total - clips.length,
            totalDuration,
            engine,
            voice,
            speed,
            partial: clips.length < total,
          },
        },
      });
    }

    clearInterval(tracker);

    // Merge all clips into a single full-audio file
    let fullAudioUrl = '';
    if (clips.length > 0) {
      try {
        run.logs.push({ t: Date.now(), level: 'info', msg: '🔗 Merging parts into full audio...' });
        const MERGE_TIMEOUT_MS = 90_000;
        fullAudioUrl = await Promise.race([
          mergeClipsToFullAudio(clips, channelId, runId),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Merge timeout after 90s')), MERGE_TIMEOUT_MS)
          ),
        ]);
        run.logs.push({ t: Date.now(), level: 'info', msg: '✅ Full audio created' });
      } catch (err: unknown) {
        run.logs.push({
          t: Date.now(),
          level: 'warn',
          msg: `⚠️ Full audio merge skipped: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    const existingFiles = run.result?.files || {};
    pushVoiceoverHistory(run);
    saveStepResult(run, {
      outputDir: 'remote',
      files: {
        ...existingFiles,
        'voiceover.json': {
          clips,
          totalClips: total,
          successCount: clips.length,
          failCount: total - clips.length,
          totalDuration,
          engine,
          voice,
          speed,
          singleNarration: !!fullAudioUrl,
          fullNarrationUrl: fullAudioUrl || undefined,
          fullAudioUrl,
        },
      },
    });

    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: `[100%] ✅ Full voiceover complete: ${clips.length} part(s), ~${totalDuration}s total (${elapsed}s)`,
    });
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
  const engineKey =
    engine === 'elevenlabs' ? 'elevenlabs' : engine === 'google-tts' ? 'google-tts' : 'gemini';
  const apiKey = engine === 'edge-tts' ? 'edge-tts-no-key' : getNextKey(engineKey);
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
