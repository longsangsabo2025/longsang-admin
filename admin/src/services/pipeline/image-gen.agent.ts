/**
 * 🖼️ Image Generation Agent — generates images for each storyboard scene
 *
 * Uses Gemini's image generation API (gemini-2.5-flash-image / Nano Banana)
 * to generate images client-side from storyboard visual prompts.
 *
 * Saves results to Supabase storage for persistence.
 */

import { supabase } from '@/integrations/supabase/client';
import { getNextKey, reportError } from './api-key-pool';
import { PIPELINE_BASE, pipelineHeaders } from './api-client';
import { trackCost } from './cost-tracker';
import { addToLibrary, extractKeywords, findBestMatch, type LibraryImage } from './image-library';
import {
  failRun,
  findLatestRunWithFile,
  getRun,
  saveStepResult,
  startProgressTracker,
} from './run-tracker';
import type { GenerateRequest, ProgressPhase } from './types';

const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface StoryboardScene {
  scene: number;
  dialogue: string;
  prompt: string;
  motion: string;
  transition: string;
}

export interface GeneratedImage {
  scene: number;
  url: string; // Supabase public URL or data URL fallback
  prompt: string; // The prompt used
  mimeType: string;
}

/** Generate a single image — uses key pool for direct calls, proxy as fallback */
export async function generateSingleImage(
  prompt: string,
  apiKey?: string
): Promise<{ dataUrl: string; mimeType: string } | null> {
  // 1) Try direct Gemini call with rotated key from pool
  const poolKey = apiKey || getNextKey('gemini');
  if (poolKey) {
    try {
      const directRes = await fetch(`${GEMINI_URL}?key=${poolKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      });

      if (directRes.ok) {
        const directData = (await directRes.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
          }>;
        };
        const parts = directData.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          const inline = part.inlineData;
          if (inline?.mimeType?.startsWith('image/') && inline.data) {
            return {
              dataUrl: `data:${inline.mimeType};base64,${inline.data}`,
              mimeType: inline.mimeType,
            };
          }
        }
      } else {
        const errBody = await directRes.json().catch(() => ({}));
        const errMsg =
          (errBody as { error?: { message?: string } }).error?.message ||
          `HTTP ${directRes.status}`;
        // Report error to pool (auto-disables after 3 consecutive)
        reportError('gemini', poolKey, errMsg);
        // If 429, try proxy as fallback
        if (directRes.status === 429 || errMsg.includes('quota')) {
          console.warn(`[ImageGen] Key quota hit, falling back to proxy...`);
        } else {
          throw new Error(`Gemini direct: ${errMsg}`);
        }
      }
    } catch (err) {
      // Network error on direct call — fall through to proxy
      if (err instanceof Error && !err.message.includes('Gemini direct:')) {
        console.warn(`[ImageGen] Direct call failed, trying proxy: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // 2) Fallback: use backend proxy (server-side key rotation)
  let proxyError = '';
  try {
    const response = await fetch(`${PIPELINE_BASE}/api/admin/proxy/image-gen`, {
      method: 'POST',
      headers: pipelineHeaders(),
      body: JSON.stringify({ prompt }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        dataUrl?: string;
        mimeType?: string;
        error?: string;
      };
      if (data.dataUrl) {
        return { dataUrl: data.dataUrl, mimeType: data.mimeType || 'image/png' };
      }
      proxyError = data.error || 'No image returned from proxy';
    } else {
      const errBody = await response.json().catch(() => ({}));
      proxyError = (errBody as { error?: string }).error || `Image proxy error ${response.status}`;
    }
  } catch (err) {
    proxyError = err instanceof Error ? err.message : 'Image proxy request failed';
  }

  throw new Error(proxyError || 'Image generation failed');
}

/** Convert a data URL (any image format) to a WebP Blob via canvas — ~75-80% smaller than PNG */
async function toWebpBlob(dataUrl: string, quality = 0.82): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/** Upload an image to Supabase storage as WebP, return public URL */
export async function uploadToStorage(
  dataUrl: string,
  channelId: string,
  sceneNum: number,
  runId: string
): Promise<string> {
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return dataUrl;

  // Try WebP compression first (canvas-based, browser-only)
  const webpBlob = await toWebpBlob(dataUrl, 0.82);
  let blob: Blob;
  let contentType: string;
  let ext: string;

  if (webpBlob && webpBlob.size > 0) {
    blob = webpBlob;
    contentType = 'image/webp';
    ext = 'webp';
  } else {
    // Fallback: upload original PNG
    const byteChars = atob(base64Data);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
    blob = new Blob([byteArray], { type: 'image/png' });
    contentType = 'image/png';
    ext = 'png';
  }

  const filePath = `pipeline-images/${channelId}/${runId}/scene-${String(sceneNum).padStart(2, '0')}.${ext}`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, blob, { contentType, upsert: true });

  if (error) return dataUrl; // fallback to data URL

  const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath);
  return urlData?.publicUrl || dataUrl;
}

/**
 * Scan Supabase Storage for already-uploaded images in a run.
 * Returns records ready to be saved into images.json.
 * Useful when a generation was interrupted AFTER upload but BEFORE images.json was written.
 */
export async function scanStorageForImages(
  channelId: string,
  runId: string,
  scenePromptMap?: Map<number, string>
): Promise<GeneratedImage[]> {
  const prefix = `pipeline-images/${channelId}/${runId}`;
  const { data: files, error } = await supabase.storage
    .from('post-images')
    .list(prefix, { limit: 200 });
  if (error || !files) return [];

  const results: GeneratedImage[] = [];
  for (const file of files) {
    // filename: scene-01.png, scene-08.png, etc.
    const match = file.name.match(/^scene-(\d+)\./);
    if (!match) continue;
    const sceneNum = parseInt(match[1], 10);
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(`${prefix}/${file.name}`);
    if (!urlData?.publicUrl) continue;
    results.push({
      scene: sceneNum,
      url: urlData.publicUrl,
      prompt: scenePromptMap?.get(sceneNum) || '',
      mimeType: 'image/png',
    });
  }
  results.sort((a, b) => a.scene - b.scene);
  return results;
}

/** Build a visual prompt for a scene — style is already baked into scene.prompt by storyboard */
function buildScenePrompt(
  scene: StoryboardScene,
  vi?: GenerateRequest['visualIdentity'],
  aspectRatio?: string
): string {
  const parts: string[] = [];

  parts.push(scene.prompt);

  const ratio = aspectRatio || '16:9';
  parts.push(`${ratio} aspect ratio, photorealistic cinematic quality, film grain.`);

  if (vi?.negativePrompt) parts.push(`Do NOT include: ${vi.negativePrompt}.`);

  return parts.join(' ');
}

export async function runImageGen(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  // Find storyboard: check current run first, then previous runs
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

  const scenes = storyboardJson?.scenes;
  if (!scenes || scenes.length === 0) {
    failRun(run, 'Cần generate Storyboard trước rồi mới tạo hình ảnh. Chạy Storyboard trước!');
    return;
  }

  const channelId = req.channelId || 'default';
  const totalScenes = scenes.length;
  run.logs.push({
    t: Date.now(),
    level: 'info',
    msg: `🎨 Found ${totalScenes} scenes — starting image generation...`,
    step: 'imageGen',
  });

  // Build progress phases dynamically based on scene count
  const phases: ProgressPhase[] = scenes.map((s, i) => ({
    pct: Math.round((i / totalScenes) * 90) + 5,
    msg: `🖼️ Generating scene ${s.scene}/${totalScenes}...`,
  }));
  phases.push({ pct: 95, msg: '💾 Saving images to storage...' });

  const tracker = startProgressTracker(run, phases, Math.ceil(totalScenes / 3) * 15000, 'imageGen'); // ~15s per batch of 3

  const generatedImages: GeneratedImage[] = [];
  let successCount = 0;
  let failCount = 0;

  const BATCH_SIZE = 3; // Process 3 scenes concurrently
  let reusedCount = 0;

  try {
    for (let batchStart = 0; batchStart < scenes.length; batchStart += BATCH_SIZE) {
      if (run.status !== 'running') break; // early exit if cancelled

      const batch = scenes.slice(batchStart, batchStart + BATCH_SIZE);
      const batchLabel = batch.map((s) => s.scene).join(', ');
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `[${Math.round((batchStart / totalScenes) * 90) + 5}%] 🖼️ Batch generating scenes ${batchLabel}...`,
        step: 'imageGen',
      });

      const batchResults = await Promise.allSettled(
        batch.map(async (scene) => {
          const fullPrompt = buildScenePrompt(scene, req.visualIdentity, req.aspectRatio);

          // 🔍 Check image library for a reusable match first
          const match = findBestMatch(fullPrompt, channelId, 0.35);
          if (match) {
            reusedCount++;
            run.logs.push({
              t: Date.now(),
              level: 'info',
              msg: `♻️ Scene ${scene.scene} — reusing existing image (similarity: ${(match.similarity * 100).toFixed(0)}%)`,
              step: 'imageGen',
            });
            return {
              scene,
              fullPrompt,
              success: true as const,
              url: match.url,
              mimeType: match.mimeType || 'image/png',
              reused: true,
            };
          }

          const result = await generateSingleImage(fullPrompt);
          if (!result) return { scene, fullPrompt, success: false as const };
          const publicUrl = await uploadToStorage(result.dataUrl, channelId, scene.scene, runId);
          return {
            scene,
            fullPrompt,
            success: true as const,
            url: publicUrl,
            mimeType: result.mimeType,
            reused: false,
          };
        })
      );

      let batchHit429 = false;
      const newLibraryEntries: LibraryImage[] = [];
      for (const settled of batchResults) {
        if (settled.status === 'fulfilled' && settled.value.success) {
          const v = settled.value;
          generatedImages.push({
            scene: v.scene.scene,
            url: v.url,
            prompt: v.fullPrompt,
            mimeType: v.mimeType,
          });
          successCount++;

          // Only track cost for newly generated images
          if (!v.reused) {
            trackCost({
              step: 'imageGen',
              model: 'gemini-2.5-flash-image',
              type: 'image',
              quantity: 1,
              runId,
              channelId,
              detail: `Scene ${v.scene.scene}`,
            });

            // Add newly generated image to library for future reuse
            newLibraryEntries.push({
              id: `${runId}_scene_${v.scene.scene}`,
              url: v.url,
              prompt: v.fullPrompt,
              keywords: extractKeywords(v.fullPrompt),
              channelId,
              runId,
              scene: v.scene.scene,
              createdAt: new Date().toISOString(),
            });
          }

          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: `✅ Scene ${v.scene.scene} done${v.reused ? ' (reused)' : ''}`,
            step: 'imageGen',
          });
        } else {
          const sceneNum = settled.status === 'fulfilled' ? settled.value.scene.scene : '?';
          const errMsg =
            settled.status === 'rejected'
              ? settled.reason instanceof Error
                ? settled.reason.message
                : String(settled.reason)
              : 'no image returned';
          failCount++;
          run.logs.push({
            t: Date.now(),
            level: 'warn',
            msg: `⚠️ Scene ${sceneNum} failed: ${errMsg}`,
            step: 'imageGen',
          });
          if (
            errMsg.includes('429') ||
            errMsg.toLowerCase().includes('rate') ||
            errMsg.toLowerCase().includes('quota')
          ) {
            batchHit429 = true;
          }
        }
      }

      const pct = Math.round(((batchStart + batch.length) / totalScenes) * 90) + 5;
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `[${pct}%] 📊 Progress: ${successCount}/${totalScenes} images done${reusedCount > 0 ? ` (${reusedCount} reused)` : ''}`,
        step: 'imageGen',
      });

      // Index newly generated images into library for future reuse
      if (newLibraryEntries.length > 0) {
        addToLibrary(newLibraryEntries);
      }

      // Longer delay if we hit rate limits, shorter otherwise
      // Skip delay when all images in batch were reused
      const allReused =
        batch.length > 0 &&
        batchResults.every(
          (r) =>
            r.status === 'fulfilled' && r.value.success && 'reused' in r.value && r.value.reused
        );
      if (batchStart + BATCH_SIZE < scenes.length && !allReused) {
        const delay = batchHit429 ? 5000 : 1000;
        if (batchHit429) {
          run.logs.push({
            t: Date.now(),
            level: 'warn',
            msg: `⏳ Rate limit hit — waiting ${delay / 1000}s before next batch...`,
            step: 'imageGen',
          });
        }
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    clearInterval(tracker);

    if (successCount === 0) {
      failRun(run, `Failed to generate any images (${failCount} scenes failed)`);
      return;
    }

    // Merge with existing files
    const existingFiles = run.result?.files || {};
    saveStepResult(run, {
      outputDir: 'remote',
      files: {
        ...existingFiles,
        'images.json': {
          images: generatedImages,
          totalScenes,
          successCount,
          failCount,
          reusedCount,
        },
      },
    });

    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    const newGen = successCount - reusedCount;
    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: `[100%] ✅ Image generation complete: ${successCount}/${totalScenes} images (${newGen} new, ${reusedCount} reused, ${failCount} failed) — ${elapsed}s`,
      step: 'imageGen',
    });
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
