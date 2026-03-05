/**
 * 🎥 Video Assembly Agent — combines images + audio into final video
 *
 * REAL-TIME rendering approach:
 * - audioCtx.currentTime is the SINGLE clock source for perfect A/V sync
 * - setInterval renders frames at FPS rate, reading audio clock each tick
 * - canvas.captureStream(FPS) captures whatever is on the canvas
 * - MediaRecorder records both video + audio streams simultaneously
 * - No OffscreenCanvas → no expensive getImageData/putImageData copies
 *
 * Single-narration handling:
 * - Detects voiceover.json { singleNarration: true, fullNarrationUrl }
 * - Plays the single audio file ONCE from the start
 * - Per-scene mode: schedules each clip at its scene's startTime
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { supabase } from '@/lib/supabase';
import { getRun, startProgressTracker, saveStepResult, failRun, findLatestRunWithFile } from './run-tracker';

// ─── Types ─────────────────────────────────────────────────

interface SceneImage {
  scene: number;
  url: string;
}

interface VoiceoverClip {
  scene: number;
  url: string;
  duration: number;
}

interface VoiceoverJson {
  clips?: VoiceoverClip[];
  totalDuration?: number;
  singleNarration?: boolean;
  fullNarrationUrl?: string;
  fullAudioUrl?: string;
}

interface StoryboardScene {
  scene: number;
  dialogue: string;
  prompt?: string;
  motion?: string;
  transition?: string;
}

interface AssemblyConfig {
  format: string;
  transitions: string;
  bgMusic: boolean;
  textOverlay: boolean;
  panZoom: string;
  fps: number;
  fadeInOut: boolean;
  transitionDuration: number;
  scenePadding: number;
  watermarkUrl: string;
}

interface SceneTimeline {
  scene: number;
  startTime: number;
  duration: number;
  image: HTMLImageElement | null;
  dialogue: string;
}

interface AssemblyResult {
  videoUrl: string;
  format: string;
  duration: number;
  totalScenes: number;
  resolution: string;
  fileSize: number;
  transitions: string;
  bgMusic: boolean;
  panZoom: string;
  textOverlay: boolean;
  fps: number;
}

// ─── Helpers ───────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

async function fetchAudioBuffer(url: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${url}`);
  const arrayBuf = await res.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuf);
}

function getResolution(format: string): { width: number; height: number } {
  if (format === 'mp4-4k') return { width: 3840, height: 2160 };
  return { width: 1920, height: 1080 };
}

/** Draw image covering the canvas (object-fit: cover). Draws directly — no OffscreenCanvas. */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  opacity = 1,
  scale = 1,
  offsetX = 0,
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const imgAspect = img.width / img.height;
  const canvasAspect = cw / ch;
  let sw: number, sh: number, sx: number, sy: number;

  if (imgAspect > canvasAspect) {
    sh = img.height;
    sw = img.height * canvasAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / canvasAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  const scaledW = cw * scale;
  const scaledH = ch * scale;
  const dx = (cw - scaledW) / 2 + offsetX;
  const dy = (ch - scaledH) / 2;

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, scaledW, scaledH);
  ctx.restore();
}

const PAN_ZOOM_OPTIONS = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right'] as const;

/** Get pan/zoom effect for a scene. For 'random' mode, uses scene index as seed. */
function resolvePanZoom(configValue: string, sceneIdx: number): string {
  if (configValue === 'random') return PAN_ZOOM_OPTIONS[sceneIdx % PAN_ZOOM_OPTIONS.length];
  return configValue;
}

/** Apply pan & zoom motion to the image draw. Returns scale and offsetX. */
function getPanZoomParams(panZoom: string, progress: number): { scale: number; offsetX: number } {
  switch (panZoom) {
    case 'zoom-in':  return { scale: 1 + progress * 0.12, offsetX: 0 };
    case 'zoom-out': return { scale: 1.12 - progress * 0.12, offsetX: 0 };
    case 'pan-left': return { scale: 1.08, offsetX: progress * -60 };
    case 'pan-right':return { scale: 1.08, offsetX: progress * 60 };
    default:         return { scale: 1, offsetX: 0 };
  }
}

/** Draw text overlay (subtitle) on the canvas bottom area */
function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
) {
  if (!text) return;
  const fontSize = Math.round(height * 0.032); // ~35px at 1080p
  const padding = Math.round(height * 0.04);
  const maxWidth = width * 0.82;

  ctx.save();
  ctx.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // Word-wrap text
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Draw semi-transparent background box
  const lineHeight = fontSize * 1.35;
  const boxH = lines.length * lineHeight + padding * 0.6;
  const boxY = height - padding - boxH;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  const r = 8;
  const boxX = (width - maxWidth - padding) / 2;
  const boxW = maxWidth + padding;
  ctx.roundRect(boxX, boxY, boxW, boxH + padding * 0.3, r);
  ctx.fill();

  // Draw text lines
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, boxY + (i + 1) * lineHeight + padding * 0.15);
  }
  ctx.restore();
}

/** Draw watermark image at bottom-right corner */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: HTMLImageElement,
  width: number,
  height: number,
) {
  const wmH = Math.round(height * 0.06); // 6% of video height
  const wmW = Math.round(wmH * (watermark.width / watermark.height));
  const margin = Math.round(height * 0.02);
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.drawImage(watermark, width - wmW - margin, height - wmH - margin, wmW, wmH);
  ctx.restore();
}

/** Render the correct frame for a given elapsed time (with all effects) */
function renderFrame(
  ctx: CanvasRenderingContext2D,
  timeline: SceneTimeline[],
  elapsed: number,
  totalDuration: number,
  width: number,
  height: number,
  config: AssemblyConfig,
  watermarkImg: HTMLImageElement | null,
) {
  // Find current scene
  let currentIdx = 0;
  for (let i = 0; i < timeline.length; i++) {
    if (elapsed >= timeline[i].startTime) currentIdx = i;
  }
  const scene = timeline[currentIdx];
  const nextScene = currentIdx + 1 < timeline.length ? timeline[currentIdx + 1] : null;
  const sceneElapsed = elapsed - scene.startTime;
  const sceneProgress = scene.duration > 0 ? sceneElapsed / scene.duration : 0;
  const transitionDur = config.transitionDuration;

  // Clear to black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  if (!scene.image) return;

  // Pan & zoom motion applied during the entire scene
  const panZoom = resolvePanZoom(config.panZoom, currentIdx);
  const { scale: pzScale, offsetX: pzOffsetX } = getPanZoomParams(panZoom, sceneProgress);

  // Transition zone: last transitionDur seconds of a scene
  const isInTransition = nextScene && (scene.duration - sceneElapsed) < transitionDur;
  const tProgress = isInTransition
    ? 1 - (scene.duration - sceneElapsed) / transitionDur
    : 0;

  const transitionType = config.transitions;

  if (transitionType === 'crossfade' && isInTransition && nextScene?.image) {
    drawImageCover(ctx, scene.image, width, height, 1 - tProgress, pzScale, pzOffsetX);
    const nextPz = getPanZoomParams(resolvePanZoom(config.panZoom, currentIdx + 1), 0);
    drawImageCover(ctx, nextScene.image, width, height, tProgress, nextPz.scale, nextPz.offsetX);
  } else if (transitionType === 'fade-black' && isInTransition && nextScene?.image) {
    // Fade to black then fade in next
    if (tProgress < 0.5) {
      drawImageCover(ctx, scene.image, width, height, 1 - tProgress * 2, pzScale, pzOffsetX);
    } else {
      const nextPz = getPanZoomParams(resolvePanZoom(config.panZoom, currentIdx + 1), 0);
      drawImageCover(ctx, nextScene.image, width, height, (tProgress - 0.5) * 2, nextPz.scale, nextPz.offsetX);
    }
  } else if (transitionType === 'wipe' && isInTransition && nextScene?.image) {
    // Horizontal wipe: next scene revealed from left
    const nextPz = getPanZoomParams(resolvePanZoom(config.panZoom, currentIdx + 1), 0);
    drawImageCover(ctx, scene.image, width, height, 1, pzScale, pzOffsetX);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width * tProgress, height);
    ctx.clip();
    drawImageCover(ctx, nextScene.image, width, height, 1, nextPz.scale, nextPz.offsetX);
    ctx.restore();
  } else if (transitionType === 'zoom' && isInTransition && nextScene?.image) {
    // Legacy zoom transition: zoom into current, then show next
    const zoom = pzScale * (1 + tProgress * 0.15);
    drawImageCover(ctx, scene.image, width, height, 1 - tProgress, zoom, pzOffsetX);
    const nextPz = getPanZoomParams(resolvePanZoom(config.panZoom, currentIdx + 1), 0);
    drawImageCover(ctx, nextScene.image, width, height, tProgress, nextPz.scale, nextPz.offsetX);
  } else if (transitionType === 'slide' && isInTransition && nextScene?.image) {
    const offset = -tProgress * width;
    drawImageCover(ctx, scene.image, width, height, 1, pzScale, pzOffsetX + offset);
    const nextPz = getPanZoomParams(resolvePanZoom(config.panZoom, currentIdx + 1), 0);
    drawImageCover(ctx, nextScene.image, width, height, 1, nextPz.scale, nextPz.offsetX + offset + width);
  } else {
    // Cut or default (+ non-transition zone)
    drawImageCover(ctx, scene.image, width, height, 1, pzScale, pzOffsetX);
  }

  // Text overlay (subtitle)
  if (config.textOverlay && scene.dialogue) {
    drawTextOverlay(ctx, scene.dialogue, width, height);
  }

  // Watermark
  if (watermarkImg) {
    drawWatermark(ctx, watermarkImg, width, height);
  }

  // Fade in at start / fade out at end
  if (config.fadeInOut) {
    const FADE_DUR = 1.0; // 1s fade
    let overlay = 0;
    if (elapsed < FADE_DUR) {
      overlay = 1 - elapsed / FADE_DUR; // fade in from black
    } else if (elapsed > totalDuration - FADE_DUR) {
      overlay = (elapsed - (totalDuration - FADE_DUR)) / FADE_DUR; // fade out to black
    }
    if (overlay > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${overlay})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

async function uploadVideo(blob: Blob, channelId: string, runId: string): Promise<{ url: string; fileSize: number }> {
  const filePath = `pipeline-video/${channelId}/${runId}/video.webm`;
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, blob, { contentType: 'video/webm', upsert: true });

  if (error) throw new Error(`Video upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath);
  return { url: urlData?.publicUrl || '', fileSize: blob.size };
}

// ─── Main Assembly Function ────────────────────────────────

export async function runAssembly(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const channelId = req.channelId || 'default';

  const r = req as Record<string, unknown>;
  const assemblyConfig: AssemblyConfig = {
    format: r.assemblyFormat as string || 'mp4-1080p',
    transitions: r.assemblyTransitions as string || 'crossfade',
    bgMusic: r.assemblyBgMusic !== false,
    textOverlay: r.assemblyTextOverlay !== false,
    panZoom: r.assemblyPanZoom as string || 'none',
    fps: Number(r.assemblyFps) || 24,
    fadeInOut: r.assemblyFadeInOut !== false,
    transitionDuration: Number(r.assemblyTransitionDuration) || 0.5,
    scenePadding: Number(r.assemblyScenePadding) || 0,
    watermarkUrl: (r.assemblyWatermarkUrl as string) || '',
  };

  // ── 1. Gather images from Step 3 ──
  let imagesJson = run.result?.files?.['images.json'] as { images?: SceneImage[] } | undefined;
  if (!imagesJson?.images?.length) {
    const imgRun = findLatestRunWithFile('images.json', req.channelId, runId);
    imagesJson = imgRun?.result?.files?.['images.json'] as { images?: SceneImage[] } | undefined;
  }
  if (!imagesJson?.images?.length) {
    failRun(run, 'Cần có images từ Step 3 (Image Generation) trước! Chạy Step 3 trước khi assembly.');
    return;
  }

  // ── 2. Gather voiceover from Step 4 ──
  let voiceoverJson = run.result?.files?.['voiceover.json'] as VoiceoverJson | undefined;
  if (!voiceoverJson?.clips?.length) {
    const voRun = findLatestRunWithFile('voiceover.json', req.channelId, runId);
    voiceoverJson = voRun?.result?.files?.['voiceover.json'] as VoiceoverJson | undefined;
  }
  if (!voiceoverJson?.clips?.length) {
    failRun(run, 'Cần có voiceover từ Step 4 (Voiceover/TTS) trước! Chạy Step 4 trước khi assembly.');
    return;
  }

  // ── 2b. Gather storyboard for text overlay ──
  let storyboardJson: { scenes?: StoryboardScene[] } | undefined;
  if (assemblyConfig.textOverlay) {
    storyboardJson = run.result?.files?.['storyboard.json'] as { scenes?: StoryboardScene[] } | undefined;
    if (!storyboardJson?.scenes?.length) {
      const sbRun = findLatestRunWithFile('storyboard.json', req.channelId, runId);
      storyboardJson = sbRun?.result?.files?.['storyboard.json'] as { scenes?: StoryboardScene[] } | undefined;
    }
  }
  const dialogueMap = new Map<number, string>();
  if (storyboardJson?.scenes) {
    for (const s of storyboardJson.scenes) {
      if (s.dialogue) dialogueMap.set(s.scene, s.dialogue);
    }
  }

  const images = imagesJson.images;
  const clips = voiceoverJson.clips;
  const isSingleNarration = voiceoverJson.singleNarration === true;
  const fullNarrationUrl = voiceoverJson.fullNarrationUrl || voiceoverJson.fullAudioUrl || '';
  const totalScenes = images.length;

  const activeEffects = [
    assemblyConfig.transitions,
    assemblyConfig.panZoom !== 'none' ? `pan:${assemblyConfig.panZoom}` : '',
    assemblyConfig.textOverlay ? 'subtitle' : '',
    assemblyConfig.fadeInOut ? 'fade' : '',
    assemblyConfig.watermarkUrl ? 'watermark' : '',
    assemblyConfig.scenePadding > 0 ? `pad:${assemblyConfig.scenePadding}s` : '',
  ].filter(Boolean).join(', ');

  run.logs.push({
    t: Date.now(), level: 'info',
    msg: `🎥 Starting assembly: ${totalScenes} scenes, audio=${isSingleNarration ? 'single-narration' : `${clips.length} clips`}, ${assemblyConfig.fps}fps, effects=[${activeEffects}]`,
    step: 'assembly',
  });

  // ── 3. Progress tracking ──
  const phases: ProgressPhase[] = [
    { pct: 5, msg: '📥 Loading images...' },
    { pct: 15, msg: '🔊 Loading audio...' },
    { pct: 25, msg: '🎬 Setting up real-time renderer...' },
    { pct: 30, msg: '🎞️ Rendering in real-time (A/V sync)...' },
    { pct: 85, msg: '🔄 Finalizing recording...' },
    { pct: 90, msg: '💾 Uploading to storage...' },
    { pct: 95, msg: '✅ Saving result...' },
  ];
  const tracker = startProgressTracker(run, phases, totalScenes * 12000);

  try {
    // ── 4. Load all images ──
    run.logs.push({ t: Date.now(), level: 'info', msg: `📥 Loading ${totalScenes} images...`, step: 'assembly' });
    const loadedImages = new Map<number, HTMLImageElement>();
    const imgLoadResults = await Promise.allSettled(
      images.map(async (img) => {
        const loaded = await loadImage(img.url);
        loadedImages.set(img.scene, loaded);
      }),
    );
    const imgFailCount = imgLoadResults.filter(r => r.status === 'rejected').length;
    if (imgFailCount > 0) {
      run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ ${imgFailCount}/${totalScenes} images failed to load`, step: 'assembly' });
    }
    if (loadedImages.size === 0) {
      failRun(run, 'Không load được image nào. Kiểm tra URLs từ Step 3.');
      clearInterval(tracker);
      return;
    }

    // ── 5. Load audio ──
    const audioCtx = new AudioContext();

    // For single narration: load the ONE audio file
    // For per-scene: load each clip's unique URL
    let singleNarrationBuffer: AudioBuffer | null = null;
    const perSceneBuffers = new Map<number, AudioBuffer>();

    if (isSingleNarration && fullNarrationUrl) {
      run.logs.push({ t: Date.now(), level: 'info', msg: '🔊 Loading single narration audio...', step: 'assembly' });
      singleNarrationBuffer = await fetchAudioBuffer(fullNarrationUrl, audioCtx);
      run.logs.push({ t: Date.now(), level: 'info', msg: `🔊 Single narration loaded: ${singleNarrationBuffer.duration.toFixed(1)}s`, step: 'assembly' });
    } else {
      run.logs.push({ t: Date.now(), level: 'info', msg: `🔊 Loading ${clips.length} audio clips...`, step: 'assembly' });
      // Deduplicate URLs to avoid loading the same file multiple times
      const uniqueUrls = new Map<string, AudioBuffer>();
      for (const clip of clips) {
        if (!uniqueUrls.has(clip.url)) {
          try {
            const buf = await fetchAudioBuffer(clip.url, audioCtx);
            uniqueUrls.set(clip.url, buf);
          } catch (e) {
            run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ Failed to load audio for scene ${clip.scene}`, step: 'assembly' });
          }
        }
        const buf = uniqueUrls.get(clip.url);
        if (buf) perSceneBuffers.set(clip.scene, buf);
      }
      const audioFailCount = clips.length - perSceneBuffers.size;
      if (audioFailCount > 0) {
        run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ ${audioFailCount}/${clips.length} audio clips failed`, step: 'assembly' });
      }
    }

    // ── 6. Load watermark (if configured) ──
    let watermarkImg: HTMLImageElement | null = null;
    if (assemblyConfig.watermarkUrl) {
      try {
        watermarkImg = await loadImage(assemblyConfig.watermarkUrl);
        run.logs.push({ t: Date.now(), level: 'info', msg: '🔒 Watermark loaded', step: 'assembly' });
      } catch {
        run.logs.push({ t: Date.now(), level: 'warn', msg: '⚠️ Watermark failed to load, skipping', step: 'assembly' });
      }
    }

    // ── 7. Build timeline ──
    const DEFAULT_SCENE_DURATION = 5;
    const pad = assemblyConfig.scenePadding;

    const timeline: SceneTimeline[] = [];
    let timeOffset = 0;

    const sceneNumbers = [...new Set([...images.map(i => i.scene), ...clips.map(c => c.scene)])].sort((a, b) => a - b);

    if (isSingleNarration && singleNarrationBuffer) {
      const totalEstimated = clips.reduce((sum, c) => sum + (c.duration || 1), 0);
      const actualTotal = singleNarrationBuffer.duration;
      const totalPadding = pad * sceneNumbers.length;

      for (const sceneNum of sceneNumbers) {
        const clipData = clips.find(c => c.scene === sceneNum);
        const estimatedDur = clipData?.duration || DEFAULT_SCENE_DURATION;
        const duration = actualTotal * (estimatedDur / totalEstimated) + pad;

        timeline.push({
          scene: sceneNum,
          startTime: timeOffset,
          duration,
          image: loadedImages.get(sceneNum) || null,
          dialogue: dialogueMap.get(sceneNum) || '',
        });
        timeOffset += duration;
      }
      // Single narration total = audio + all padding
      // (audio still plays from 0 for its natural duration)
    } else {
      for (const sceneNum of sceneNumbers) {
        const audioBuf = perSceneBuffers.get(sceneNum);
        const clipData = clips.find(c => c.scene === sceneNum);
        const baseDuration = audioBuf ? audioBuf.duration : (clipData?.duration || DEFAULT_SCENE_DURATION);
        const duration = baseDuration + pad;

        timeline.push({
          scene: sceneNum,
          startTime: timeOffset,
          duration,
          image: loadedImages.get(sceneNum) || null,
          dialogue: dialogueMap.get(sceneNum) || '',
        });
        timeOffset += duration;
      }
    }

    const totalDuration = isSingleNarration && singleNarrationBuffer
      ? singleNarrationBuffer.duration + pad * sceneNumbers.length
      : timeOffset;

    run.logs.push({ t: Date.now(), level: 'info', msg: `⏱️ Total video duration: ${totalDuration.toFixed(1)}s (${timeline.length} scenes)`, step: 'assembly' });

    // ── 7. Set up canvas (direct draw — no OffscreenCanvas) ──
    const { width, height } = getResolution(assemblyConfig.format);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      failRun(run, 'Failed to create canvas 2D context');
      clearInterval(tracker);
      return;
    }

    const FPS = assemblyConfig.fps;
    const videoStream = canvas.captureStream(FPS);

    // ── 8. Schedule audio playback ──
    const audioDestination = audioCtx.createMediaStreamDestination();
    const scheduledSources: AudioBufferSourceNode[] = [];

    if (isSingleNarration && singleNarrationBuffer) {
      // SINGLE audio source — play once from the start
      const source = audioCtx.createBufferSource();
      source.buffer = singleNarrationBuffer;
      source.connect(audioDestination);
      source.start(audioCtx.currentTime);
      scheduledSources.push(source);
      run.logs.push({ t: Date.now(), level: 'info', msg: '🔊 Single narration audio scheduled (1 source)', step: 'assembly' });
    } else {
      // Per-scene: schedule each clip at its scene's startTime
      for (const scene of timeline) {
        const buf = perSceneBuffers.get(scene.scene);
        if (buf) {
          const source = audioCtx.createBufferSource();
          source.buffer = buf;
          source.connect(audioDestination);
          source.start(audioCtx.currentTime + scene.startTime);
          scheduledSources.push(source);
        }
      }
      run.logs.push({ t: Date.now(), level: 'info', msg: `🔊 ${scheduledSources.length} audio sources scheduled`, step: 'assembly' });
    }

    // ── 9. Set up MediaRecorder ──
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ]);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: assemblyConfig.format === 'mp4-4k' ? 8_000_000 : 4_000_000,
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    const recordingDone = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(recordedChunks, { type: 'video/webm' }));
      };
    });

    recorder.start(1000);

    run.logs.push({ t: Date.now(), level: 'info', msg: `🎬 Real-time rendering: ${totalDuration.toFixed(1)}s at ${width}x${height} ${FPS}fps...`, step: 'assembly' });

    // ── 10. REAL-TIME render loop ──
    // audioCtx.currentTime is the single source of truth for A/V sync.
    // setInterval fires at FPS rate; each tick reads the audio clock and
    // draws the correct scene frame. captureStream captures automatically.
    const renderStartTime = audioCtx.currentTime;
    let lastLoggedSecond = -1;

    await new Promise<void>((resolve, reject) => {
      const intervalMs = 1000 / FPS;

      const intervalId = setInterval(() => {
        try {
          // Check for cancellation
          if (run.status !== 'running') {
            clearInterval(intervalId);
            resolve();
            return;
          }

          const elapsed = audioCtx.currentTime - renderStartTime;

          // Done rendering
          if (elapsed >= totalDuration) {
            clearInterval(intervalId);
            resolve();
            return;
          }

          // Render the current frame directly to canvas
          renderFrame(ctx, timeline, elapsed, totalDuration, width, height, assemblyConfig, watermarkImg);

          // Update progress every 5 seconds
          const sec = Math.floor(elapsed);
          if (sec > 0 && sec % 5 === 0 && sec !== lastLoggedSecond) {
            lastLoggedSecond = sec;
            const pct = Math.round((elapsed / totalDuration) * 100);
            run.logs.push({
              t: Date.now(), level: 'info',
              msg: `🎞️ Rendering ${sec}s / ${totalDuration.toFixed(0)}s (${pct}%)`,
              step: 'assembly',
            });
            // Update progress in the 30-85% range proportionally
            run.progress = 30 + Math.round((elapsed / totalDuration) * 55);
          }
        } catch (err) {
          clearInterval(intervalId);
          reject(err);
        }
      }, intervalMs);
    });

    // ── 11. Finalize recording ──
    run.logs.push({ t: Date.now(), level: 'info', msg: '🔄 Finalizing recording...', step: 'assembly' });

    // Small delay to ensure last frames are captured by MediaRecorder
    await new Promise(r => setTimeout(r, 500));

    recorder.stop();
    scheduledSources.forEach(s => { try { s.stop(); } catch { /* already stopped */ } });

    const videoBlob = await recordingDone;
    await audioCtx.close();

    run.logs.push({ t: Date.now(), level: 'info', msg: `📦 Video encoded: ${(videoBlob.size / 1024 / 1024).toFixed(1)} MB`, step: 'assembly' });

    // ── 12. Upload to Supabase ──
    run.logs.push({ t: Date.now(), level: 'info', msg: '💾 Uploading video to storage...', step: 'assembly' });
    const { url: videoUrl, fileSize } = await uploadVideo(videoBlob, channelId, runId);

    // ── 13. Save result ──
    const result: AssemblyResult = {
      videoUrl,
      format: 'webm',
      duration: totalDuration,
      totalScenes: timeline.length,
      resolution: `${width}x${height}`,
      fileSize,
      transitions: assemblyConfig.transitions,
      bgMusic: assemblyConfig.bgMusic,
      panZoom: assemblyConfig.panZoom,
      textOverlay: assemblyConfig.textOverlay,
      fps: FPS,
    };

    clearInterval(tracker);

    saveStepResult(run, {
      outputDir: 'remote',
      files: {
        ...run.result?.files,
        'assembly.json': result,
      },
    });

    run.logs.push({
      t: Date.now(), level: 'info',
      msg: `✅ Video assembly complete! ${totalDuration.toFixed(1)}s, ${timeline.length} scenes, ${(fileSize / 1024 / 1024).toFixed(1)} MB`,
      step: 'assembly',
    });
    run.progress = 100;

  } catch (err) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
