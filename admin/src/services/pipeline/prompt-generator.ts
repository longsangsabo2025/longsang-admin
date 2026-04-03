/**
 * Prompt Generator — Lite Pipeline
 * Script gốc → image-prompts.txt + motion-prompts.txt
 *
 * Quy trình: 2 câu script → concept (start frame) → image prompt → motion prompt
 */

import JSZip from 'jszip';
import { getNextKey } from './api-key-pool';
import type { GenerationRun } from './types';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';
const API_BASE = '/api/youtube-channels';

const STYLE_SUFFIX =
  'dark cinematic, high contrast chiaroscuro, noir aesthetic, hyperrealistic, dramatic shadows, 9:16 vertical format';

// ── Tính số scenes từ word count ─────────────────────────────────
// ~20 từ tiếng Việt / 2 câu / 6s clip
export function calcSceneCount(wordCount: number): number {
  const scenes = Math.round(wordCount / 20);
  // Min 10, max 80 — cap ở 80 để tránh Gemini bị truncate output với script dài
  return Math.max(10, Math.min(80, scenes));
}

// ── Gemini call ───────────────────────────────────────────────────
async function callGemini(prompt: string, retries = 0): Promise<unknown[]> {
  const key = getNextKey('gemini');
  if (!key) throw new Error('Không tìm thấy Gemini API key trong key pool');

  const resp = await fetch(`${GEMINI_API}/models/${GEMINI_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: 'application/json',
        maxOutputTokens: 65536,
      },
    }),
  });

  const data = await resp.json();

  if (data.error) {
    if (data.error.code === 429 && retries < 3) {
      await new Promise((r) => setTimeout(r, 3000));
      return callGemini(prompt, retries + 1);
    }
    throw new Error(`Gemini: ${data.error.message}`);
  }

  const text: string = data.candidates[0].content.parts[0].text.trim();

  // Parse JSON — thử nhiều cách
  try {
    return JSON.parse(text);
  } catch {}
  const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (m) {
    try {
      return JSON.parse(m[1].trim());
    } catch {}
  }
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1));
  throw new Error('Cannot parse JSON from Gemini response');
}

// ── Kiểu trả về cho 1 scene ──────────────────────────────────────
export interface ScenePrompt {
  lines: string;
  concept: string;
  imagePrompt: string;
  motionPrompt: string;
}

// ── Generate prompts cho 1 script ────────────────────────────────
export async function generatePromptsFromScript(
  scriptTxt: string,
  title: string,
  sceneCount: number,
  onProgress?: (msg: string) => void
): Promise<ScenePrompt[]> {
  onProgress?.(`Phân tích script → ${sceneCount} scenes...`);

  const prompt = `Bạn là storyboard director + prompt engineer. Nhiệm vụ: chuyển script voice-over thành ${sceneCount} cặp (image prompt + motion prompt).

QUY TRÌNH BẮT BUỘC cho từng scene:
1. Chia script thành ${sceneCount} đoạn, mỗi đoạn khoảng 2 câu (clip 6 giây)
2. Đọc 2 câu đó: người nói đang truyền đạt ĐIỀU GÌ? Cảm xúc gì? Ý nghĩa gì?
3. Hình dung START FRAME: khung hình đầu tiên cần TRÔNG như thế nào để người xem hiểu ngay 2 câu đó — không cần chữ, không cần audio, chỉ nhìn hình là hiểu được thông điệp
4. Viết IMAGE PROMPT: mô tả chi tiết start frame đó (subject + trạng thái/hành động + bối cảnh + lighting + camera angle) kết thúc bằng style suffix
5. Viết MOTION PROMPT: từ start frame, camera/subject chuyển động như thế nào trong 6 giây để giúp diễn đạt thêm nội dung 2 câu đó

SCRIPT (tiêu đề: "${title}"):
---
${scriptTxt}
---

STYLE SUFFIX (bắt buộc kết thúc mỗi image prompt): ${STYLE_SUFFIX}

OUTPUT FORMAT — JSON array gồm ĐÚNG ${sceneCount} objects:
[
  {
    "lines": "2 câu từ script tương ứng",
    "concept": "một câu mô tả start frame bằng tiếng Việt",
    "imagePrompt": "chi tiết start frame bằng tiếng Anh, ..., ${STYLE_SUFFIX}",
    "motionPrompt": "camera/subject movement trong 6s bằng tiếng Anh, specific timing"
  }
]

KHÔNG có markdown wrapper. Chỉ trả về JSON array.`;

  const result = await callGemini(prompt);
  return result as ScenePrompt[];
}

// ── Extract script từ run ─────────────────────────────────────────
export function extractScriptFromRun(run: GenerationRun): {
  scriptTxt: string;
  title: string;
  wordCount: number;
} | null {
  const files = (run.result?.files as Record<string, unknown>) || {};
  const scriptTxt = files['script.txt'];
  const scriptMeta = (files['script.json'] as { title?: string; wordCount?: number }) || {};

  if (typeof scriptTxt !== 'string' || !scriptTxt) return null;

  return {
    scriptTxt,
    title: scriptMeta.title || run.input?.topic || 'Untitled',
    wordCount: scriptMeta.wordCount || scriptTxt.split(/\s+/).length,
  };
}

// ── Download helper ───────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Fetch pre-generated prompts từ API (file đã có từ CLI) ────────
export async function fetchExistingPrompts(
  channelId: string,
  episodeSlug: string
): Promise<PromptsData | null> {
  try {
    const resp = await fetch(`${API_BASE}/prompts/${channelId}/${episodeSlug}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.scenes?.length) return null;
    return data as PromptsData;
  } catch {
    return null;
  }
}

/** Tìm episode slug từ run — match theo episode number hoặc title slug */
export async function findEpisodeSlug(
  channelId: string,
  run: GenerationRun
): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/prompts/${channelId}`);
    if (!resp.ok) return null;
    const { episodes } = (await resp.json()) as {
      episodes: { slug: string; sceneCount: number }[];
    };
    if (!episodes?.length) return null;

    const ep = run.episodeNumber;
    const padded = ep ? String(ep).padStart(2, '0') : null;

    // Match by episode number prefix (tap-01-, tap-02-, ...)
    if (padded) {
      const match = episodes.find((e) => e.slug.startsWith(`tap-${padded}-`));
      if (match) return match.slug;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Generate data only (không download) — dùng cho viewer dialog ──
export interface PromptsData {
  title: string;
  scenes: ScenePrompt[];
  slug: string;
}

export async function generatePromptsData(
  run: GenerationRun,
  onProgress?: (msg: string) => void,
  channelId?: string
): Promise<PromptsData> {
  // 1. Thử load file đã generate sẵn từ CLI
  if (channelId) {
    onProgress?.('Tìm prompts đã có sẵn...');
    const slug = await findEpisodeSlug(channelId, run);
    if (slug) {
      const existing = await fetchExistingPrompts(channelId, slug);
      if (existing) {
        onProgress?.(`✅ Đọc từ file có sẵn (${existing.scenes.length} scenes)`);
        return existing;
      }
    }
  }

  // 2. Fallback: generate mới bằng Gemini
  const scriptData = extractScriptFromRun(run);
  if (!scriptData) throw new Error('Run này chưa có script.txt');

  const sceneCount = calcSceneCount(scriptData.wordCount);
  onProgress?.(`Generating ${sceneCount} scenes bằng Gemini...`);

  const scenes = await generatePromptsFromScript(
    scriptData.scriptTxt,
    scriptData.title,
    sceneCount,
    onProgress
  );

  const slug = scriptData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  return { title: scriptData.title, scenes, slug };
}

// ── Download ZIP từ PromptsData đã có sẵn ────────────────────────
export async function downloadPromptsAsZip(data: PromptsData): Promise<void> {
  const imagePrompts = data.scenes.map((s) => s.imagePrompt).join('\n');
  const motionPrompts = data.scenes.map((s) => s.motionPrompt).join('\n');
  const concepts = data.scenes
    .map((s, i) => `[Scene ${i + 1}]\nScript: ${s.lines}\nConcept: ${s.concept}`)
    .join('\n\n');

  const zip = new JSZip();
  zip.file('image-prompts.txt', imagePrompts);
  zip.file('motion-prompts.txt', motionPrompts);
  zip.file('concepts.txt', concepts);

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `prompts-${data.slug}.zip`);
}

// ── Generate + Download ZIP cho 1 run ─────────────────────────────
export async function generateAndDownloadForRun(
  run: GenerationRun,
  onProgress?: (msg: string) => void
): Promise<void> {
  const scriptData = extractScriptFromRun(run);
  if (!scriptData) throw new Error('Run này chưa có script.txt');

  const sceneCount = calcSceneCount(scriptData.wordCount);
  onProgress?.(`Tính được ${sceneCount} scenes (${scriptData.wordCount} từ)`);

  const scenes = await generatePromptsFromScript(
    scriptData.scriptTxt,
    scriptData.title,
    sceneCount,
    onProgress
  );

  const imagePrompts = scenes.map((s) => s.imagePrompt).join('\n');
  const motionPrompts = scenes.map((s) => s.motionPrompt).join('\n');
  const concepts = scenes
    .map((s, i) => `[Scene ${i + 1}]\nScript: ${s.lines}\nConcept: ${s.concept}`)
    .join('\n\n');

  const slug = scriptData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  const zip = new JSZip();
  zip.file('image-prompts.txt', imagePrompts);
  zip.file('motion-prompts.txt', motionPrompts);
  zip.file('concepts.txt', concepts);

  onProgress?.('Tạo ZIP...');
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `prompts-${slug}.zip`);
  onProgress?.(`✅ Done — ${scenes.length} scenes`);
}

// ── Generate + Download ZIP cho tất cả completed runs của channel ─
export async function generateAndDownloadForAllRuns(
  runs: GenerationRun[],
  onProgress?: (msg: string) => void
): Promise<void> {
  const completedRuns = runs.filter((r) => r.status === 'completed' && r.result);
  if (!completedRuns.length) throw new Error('Không có tập nào đã completed');

  const zip = new JSZip();

  for (let i = 0; i < completedRuns.length; i++) {
    const run = completedRuns[i];
    const ep = run.episodeNumber || i + 1;
    onProgress?.(`[${i + 1}/${completedRuns.length}] Xử lý Tập ${ep}...`);

    const scriptData = extractScriptFromRun(run);
    if (!scriptData) {
      onProgress?.(`⚠️  Tập ${ep}: không có script, bỏ qua`);
      continue;
    }

    const sceneCount = calcSceneCount(scriptData.wordCount);
    try {
      const scenes = await generatePromptsFromScript(
        scriptData.scriptTxt,
        scriptData.title,
        sceneCount,
        (msg) => onProgress?.(`  Tập ${ep}: ${msg}`)
      );

      const folder = zip.folder(`tap-${String(ep).padStart(2, '0')}`);
      if (!folder) continue;

      folder.file('image-prompts.txt', scenes.map((s) => s.imagePrompt).join('\n'));
      folder.file('motion-prompts.txt', scenes.map((s) => s.motionPrompt).join('\n'));
      folder.file(
        'concepts.txt',
        scenes
          .map((s, idx) => `[Scene ${idx + 1}]\nScript: ${s.lines}\nConcept: ${s.concept}`)
          .join('\n\n')
      );

      onProgress?.(`  ✅ Tập ${ep}: ${scenes.length} scenes`);
    } catch (err) {
      onProgress?.(`  ❌ Tập ${ep}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Rate limit buffer giữa các tập
    if (i < completedRuns.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  onProgress?.('Tạo ZIP tổng hợp...');
  const blob = await zip.generateAsync({ type: 'blob' });
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `all-prompts-${date}.zip`);
  onProgress?.(`✅ Hoàn tất ${completedRuns.length} tập`);
}
