/**
 * 🖼️ Image Generation Agent — generates images for each storyboard scene
 * 
 * Uses Gemini's image generation API (gemini-2.5-flash-image / Nano Banana)
 * to generate images client-side from storyboard visual prompts.
 * 
 * Saves results to Supabase storage for persistence.
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { supabase } from '@/lib/supabase';
import { getRun, startProgressTracker, saveStepResult, failRun, findLatestRunWithFile } from './run-tracker';
import { getNextKey, reportError } from './api-key-pool';
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
  url: string;         // Supabase public URL or data URL fallback
  prompt: string;      // The prompt used
  mimeType: string;
}

/** Generate a single image from a text prompt via Gemini */
async function generateSingleImage(prompt: string, apiKey: string): Promise<{ dataUrl: string; mimeType: string } | null> {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error((errBody as { error?: { message?: string } }).error?.message || `Gemini API error ${response.status}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const mimeType = part.inlineData.mimeType as string;
      const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
      return { dataUrl, mimeType };
    }
  }
  return null;
}

/** Upload an image to Supabase storage, return public URL */
async function uploadToStorage(dataUrl: string, channelId: string, sceneNum: number, runId: string): Promise<string> {
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

/** Build a rich visual prompt for a scene using visual identity + scene prompt */
function buildScenePrompt(scene: StoryboardScene, vi?: GenerateRequest['visualIdentity'], aspectRatio?: string): string {
  const parts: string[] = [];

  parts.push(scene.prompt);

  if (vi) {
    if (vi.style) parts.push(`Visual style: ${vi.style.replace(/-/g, ' ')}.`);
    if (vi.colorPalette) parts.push(`Color palette: ${vi.colorPalette}.`);
    if (vi.lighting) parts.push(`Lighting: ${vi.lighting}.`);
    if (vi.cameraStyle) parts.push(`Camera: ${vi.cameraStyle}.`);
    if (vi.environment) parts.push(`Environment: ${vi.environment}.`);
    if (vi.moodKeywords) parts.push(`Mood: ${vi.moodKeywords}.`);
    if (vi.negativePrompt) parts.push(`Do NOT include: ${vi.negativePrompt}.`);
  }

  const ratio = aspectRatio || '16:9';
  parts.push(`${ratio} aspect ratio, photorealistic cinematic quality, film grain.`);

  return parts.join(' ');
}

export async function runImageGen(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const apiKey = getNextKey('gemini');
  if (!apiKey) {
    failRun(run, 'Không có Gemini API key. Thêm key trong API Key Pool hoặc cấu hình VITE_GEMINI_API_KEY');
    return;
  }

  // Find storyboard: check current run first, then previous runs
  let storyboardJson = run.result?.files?.['storyboard.json'] as { scenes?: StoryboardScene[] } | undefined;
  if (!storyboardJson?.scenes) {
    const sbRun = findLatestRunWithFile('storyboard.json', req.channelId, runId);
    storyboardJson = sbRun?.result?.files?.['storyboard.json'] as { scenes?: StoryboardScene[] } | undefined;
  }

  const scenes = storyboardJson?.scenes;
  if (!scenes || scenes.length === 0) {
    failRun(run, 'Cần generate Storyboard trước rồi mới tạo hình ảnh. Chạy Storyboard trước!');
    return;
  }

  const channelId = req.channelId || 'default';
  const totalScenes = scenes.length;
  run.logs.push({ t: Date.now(), level: 'info', msg: `🎨 Found ${totalScenes} scenes — starting image generation...`, step: 'imageGen' });

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
      const batchLabel = batch.map(s => s.scene).join(', ');
      run.logs.push({ t: Date.now(), level: 'info', msg: `[${Math.round((batchStart / totalScenes) * 90) + 5}%] 🖼️ Batch generating scenes ${batchLabel}...`, step: 'imageGen' });

      const batchResults = await Promise.allSettled(
        batch.map(async (scene) => {
          const fullPrompt = buildScenePrompt(scene, req.visualIdentity, req.aspectRatio);
          const result = await generateSingleImage(fullPrompt, apiKey);
          if (!result) return { scene, fullPrompt, success: false as const };
          const publicUrl = await uploadToStorage(result.dataUrl, channelId, scene.scene, runId);
          return { scene, fullPrompt, success: true as const, url: publicUrl, mimeType: result.mimeType };
        })
      );

      for (const settled of batchResults) {
        if (settled.status === 'fulfilled' && settled.value.success) {
          const v = settled.value;
          generatedImages.push({ scene: v.scene.scene, url: v.url, prompt: v.fullPrompt, mimeType: v.mimeType });
          successCount++;
          run.logs.push({ t: Date.now(), level: 'info', msg: `✅ Scene ${v.scene.scene} done`, step: 'imageGen' });
        } else {
          const sceneNum = settled.status === 'fulfilled' ? settled.value.scene.scene : '?';
          const errMsg = settled.status === 'rejected' ? (settled.reason instanceof Error ? settled.reason.message : String(settled.reason)) : 'no image returned';
          failCount++;
          run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ Scene ${sceneNum} failed: ${errMsg}`, step: 'imageGen' });
          if (errMsg.includes('429') || errMsg.toLowerCase().includes('rate') || errMsg.toLowerCase().includes('quota')) {
            reportError('gemini', apiKey, errMsg);
          }
        }
      }

      const pct = Math.round(((batchStart + batch.length) / totalScenes) * 90) + 5;
      run.logs.push({ t: Date.now(), level: 'info', msg: `[${pct}%] 📊 Progress: ${successCount}/${totalScenes} images done`, step: 'imageGen' });

      // Small delay between batches to respect rate limits
      if (batchStart + BATCH_SIZE < scenes.length) {
        await new Promise(r => setTimeout(r, 1000));
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
