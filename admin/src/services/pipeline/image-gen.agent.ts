/**
 * 🖼️ Image Generation Agent — generates images for each storyboard scene
 *
 * Uses Gemini's image generation API (gemini-2.5-flash-image / Nano Banana)
 * to generate images client-side from storyboard visual prompts.
 *
 * Saves results to Supabase storage for persistence.
 */

import { supabase } from '@/integrations/supabase/client';
import { PIPELINE_BASE, pipelineHeaders } from './api-client';
import { trackCost } from './cost-tracker';
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

/** Generate a single image via backend proxy (keeps API key server-side) */
export async function generateSingleImage(
  prompt: string,
  apiKey?: string
): Promise<{ dataUrl: string; mimeType: string } | null> {
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

  // Fallback for manual generation flows where user key is available.
  if (!apiKey) {
    throw new Error(proxyError || 'Image generation failed');
  }

  const directRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!directRes.ok) {
    const errBody = await directRes.json().catch(() => ({}));
    const directError =
      (errBody as { error?: { message?: string } }).error?.message ||
      `Gemini direct error ${directRes.status}`;
    throw new Error(`${proxyError ? `Proxy: ${proxyError}. ` : ''}Direct: ${directError}`);
  }

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

  throw new Error(
    `${proxyError ? `Proxy: ${proxyError}. ` : ''}Direct: No image returned from model`
  );
}

/** Upload an image to Supabase storage, return public URL */
export async function uploadToStorage(
  dataUrl: string,
  channelId: string,
  sceneNum: number,
  runId: string
): Promise<string> {
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return dataUrl;

  const byteChars = atob(base64Data);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArray], { type: 'image/png' });

  const filePath = `pipeline-images/${channelId}/${runId}/scene-${String(sceneNum).padStart(2, '0')}.png`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, blob, { contentType: 'image/png', upsert: true });

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
          const result = await generateSingleImage(fullPrompt);
          if (!result) return { scene, fullPrompt, success: false as const };
          const publicUrl = await uploadToStorage(result.dataUrl, channelId, scene.scene, runId);
          return {
            scene,
            fullPrompt,
            success: true as const,
            url: publicUrl,
            mimeType: result.mimeType,
          };
        })
      );

      let batchHit429 = false;
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
          trackCost({
            step: 'imageGen',
            model: 'gemini-2.5-flash-image',
            type: 'image',
            quantity: 1,
            runId,
            channelId,
            detail: `Scene ${v.scene.scene}`,
          });
          run.logs.push({
            t: Date.now(),
            level: 'info',
            msg: `✅ Scene ${v.scene.scene} done`,
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
        msg: `[${pct}%] 📊 Progress: ${successCount}/${totalScenes} images done`,
        step: 'imageGen',
      });

      // Longer delay if we hit rate limits, shorter otherwise
      if (batchStart + BATCH_SIZE < scenes.length) {
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
        'images.json': { images: generatedImages, totalScenes, successCount, failCount },
      },
    });

    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: `[100%] ✅ Image generation complete: ${successCount}/${totalScenes} images (${failCount} failed) — ${elapsed}s`,
      step: 'imageGen',
    });
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
