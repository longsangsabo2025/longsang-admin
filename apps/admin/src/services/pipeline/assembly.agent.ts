/**
 * 🎥 Video Assembly Agent — combines images + audio into final video
 *
 * Uses browser Canvas + MediaRecorder API to:
 * 1. Load all scene images + audio clips from previous steps
 * 2. Render each scene image as frames for the clip's duration
 * 3. Apply transitions (crossfade, cut, zoom, slide)
 * 4. Mix audio clips into the timeline
 * 5. Export as WebM video → upload to Supabase
 *
 * No server-side FFmpeg needed — runs entirely in the browser.
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { supabase } from '@/lib/supabase';
import { getRun, startProgressTracker, saveStepResult, failRun, findLatestRunWithFile } from './run-tracker';

interface SceneImage {
  scene: number;
  url: string;
}

interface VoiceoverClip {
  scene: number;
  url: string;
  duration: number;
}

interface AssemblyConfig {
  format: string;
  transitions: string;
  bgMusic: boolean;
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
}

// ─── Helpers ───────────────────────────────────────────────

/** Load an image from URL into an HTMLImageElement */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/** Fetch audio clip as ArrayBuffer */
async function fetchAudioBuffer(url: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audio: ${url}`);
  const arrayBuf = await res.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuf);
}

/** Get resolution from format string */
function getResolution(format: string): { width: number; height: number } {
  if (format === 'mp4-4k') return { width: 3840, height: 2160 };
  // Default 1080p for both mp4-1080p and webm-1080p
  return { width: 1920, height: 1080 };
}

/** Draw image covering the canvas (cover mode) */
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

  // Apply scale (for zoom transition)
  const scaledW = cw * scale;
  const scaledH = ch * scale;
  const dx = (cw - scaledW) / 2 + offsetX;
  const dy = (ch - scaledH) / 2;

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, scaledW, scaledH);
  ctx.restore();
}

/** Concatenate AudioBuffers into a single AudioBuffer */
function concatenateAudioBuffers(
  audioCtx: AudioContext,
  buffers: { buffer: AudioBuffer; startTime: number }[],
  totalDuration: number,
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = Math.ceil(totalDuration * sampleRate);
  const output = audioCtx.createBuffer(1, totalSamples, sampleRate);
  const outputData = output.getChannelData(0);

  for (const { buffer, startTime } of buffers) {
    const startSample = Math.floor(startTime * sampleRate);
    const sourceData = buffer.getChannelData(0);
    for (let i = 0; i < sourceData.length && (startSample + i) < totalSamples; i++) {
      outputData[startSample + i] += sourceData[i];
    }
  }

  return output;
}

/** Upload video blob to Supabase storage */
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

  // Parse assembly config from request
  const assemblyConfig: AssemblyConfig = {
    format: (req as Record<string, unknown>).assemblyFormat as string || 'mp4-1080p',
    transitions: (req as Record<string, unknown>).assemblyTransitions as string || 'crossfade',
    bgMusic: (req as Record<string, unknown>).assemblyBgMusic !== false,
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

  // ── 2. Gather audio from Step 4 ──
  let voiceoverJson = run.result?.files?.['voiceover.json'] as { clips?: VoiceoverClip[]; totalDuration?: number } | undefined;
  if (!voiceoverJson?.clips?.length) {
    const voRun = findLatestRunWithFile('voiceover.json', req.channelId, runId);
    voiceoverJson = voRun?.result?.files?.['voiceover.json'] as { clips?: VoiceoverClip[]; totalDuration?: number } | undefined;
  }

  if (!voiceoverJson?.clips?.length) {
    failRun(run, 'Cần có voiceover từ Step 4 (Voiceover/TTS) trước! Chạy Step 4 trước khi assembly.');
    return;
  }

  const images = imagesJson.images;
  const clips = voiceoverJson.clips;
  const totalScenes = images.length;

  run.logs.push({
    t: Date.now(), level: 'info',
    msg: `🎥 Starting assembly: ${totalScenes} scenes, ${clips.length} audio clips, format=${assemblyConfig.format}, transitions=${assemblyConfig.transitions}`,
    step: 'assembly',
  });

  // ── 3. Progress tracking ──
  const phases: ProgressPhase[] = [
    { pct: 5, msg: '📥 Loading images...' },
    { pct: 15, msg: '🔊 Loading audio clips...' },
    { pct: 25, msg: '🎬 Setting up canvas renderer...' },
    ...images.map((_, i) => ({
      pct: 30 + Math.round((i / totalScenes) * 50),
      msg: `🎞️ Rendering scene ${i + 1}/${totalScenes}...`,
    })),
    { pct: 85, msg: '🔄 Encoding video...' },
    { pct: 90, msg: '💾 Uploading to storage...' },
    { pct: 95, msg: '✅ Finalizing...' },
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

    // ── 5. Load all audio clips ──
    run.logs.push({ t: Date.now(), level: 'info', msg: `🔊 Loading ${clips.length} audio clips...`, step: 'assembly' });
    const audioCtx = new AudioContext();
    const audioBuffers = new Map<number, AudioBuffer>();
    const audioLoadResults = await Promise.allSettled(
      clips.map(async (clip) => {
        const buf = await fetchAudioBuffer(clip.url, audioCtx);
        audioBuffers.set(clip.scene, buf);
      }),
    );
    const audioFailCount = audioLoadResults.filter(r => r.status === 'rejected').length;
    if (audioFailCount > 0) {
      run.logs.push({ t: Date.now(), level: 'warn', msg: `⚠️ ${audioFailCount}/${clips.length} audio clips failed to load`, step: 'assembly' });
    }

    // ── 6. Calculate timeline ──
    // Each scene's duration = its audio clip duration (or 5s fallback)
    const DEFAULT_SCENE_DURATION = 5;
    const TRANSITION_DURATION = 0.5; // seconds for transition between scenes

    interface SceneTimeline {
      scene: number;
      startTime: number;
      duration: number;
      image: HTMLImageElement | null;
      audioBuffer: AudioBuffer | null;
    }

    const timeline: SceneTimeline[] = [];
    let currentTime = 0;

    // Build timeline ordered by scene number
    const sceneNumbers = [...new Set([...images.map(i => i.scene), ...clips.map(c => c.scene)])].sort((a, b) => a - b);

    for (const sceneNum of sceneNumbers) {
      const audioBuf = audioBuffers.get(sceneNum);
      const img = loadedImages.get(sceneNum);
      const clipData = clips.find(c => c.scene === sceneNum);
      const duration = audioBuf ? audioBuf.duration : (clipData?.duration || DEFAULT_SCENE_DURATION);

      timeline.push({
        scene: sceneNum,
        startTime: currentTime,
        duration,
        image: img || null,
        audioBuffer: audioBuf || null,
      });

      currentTime += duration;
    }

    const totalDuration = currentTime;
    run.logs.push({ t: Date.now(), level: 'info', msg: `⏱️ Total video duration: ${totalDuration.toFixed(1)}s (${timeline.length} scenes)`, step: 'assembly' });

    // ── 7. Render video using Canvas + MediaRecorder ──
    const { width, height } = getResolution(assemblyConfig.format);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    if (!ctx) {
      failRun(run, 'Browser does not support OffscreenCanvas');
      clearInterval(tracker);
      return;
    }

    // Create a visible canvas for MediaRecorder (OffscreenCanvas doesn't have captureStream)
    const visibleCanvas = document.createElement('canvas');
    visibleCanvas.width = width;
    visibleCanvas.height = height;
    const visibleCtx = visibleCanvas.getContext('2d')!;

    // Set up MediaRecorder
    const FPS = 30;
    const videoStream = visibleCanvas.captureStream(FPS);

    // Mix audio into the stream
    const audioDestination = audioCtx.createMediaStreamDestination();
    const scheduledSources: AudioBufferSourceNode[] = [];

    for (const scene of timeline) {
      if (scene.audioBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = scene.audioBuffer;
        source.connect(audioDestination);
        source.start(audioCtx.currentTime + scene.startTime);
        scheduledSources.push(source);
      }
    }

    // Combine video + audio tracks
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

    recorder.start(1000); // Collect data every 1s

    run.logs.push({ t: Date.now(), level: 'info', msg: `🎬 Rendering ${totalDuration.toFixed(1)}s video at ${width}x${height} ${FPS}fps...`, step: 'assembly' });

    // ── 8. Frame-by-frame rendering loop ──
    const frameDuration = 1000 / FPS;
    const totalFrames = Math.ceil(totalDuration * FPS);

    for (let frame = 0; frame < totalFrames; frame++) {
      if (run.status !== 'running') {
        recorder.stop();
        scheduledSources.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
        audioCtx.close();
        clearInterval(tracker);
        return;
      }

      const currentTime = frame / FPS;

      // Find current scene
      let currentScene = timeline[0];
      let nextScene: SceneTimeline | null = null;
      for (let i = 0; i < timeline.length; i++) {
        if (currentTime >= timeline[i].startTime) {
          currentScene = timeline[i];
          nextScene = i + 1 < timeline.length ? timeline[i + 1] : null;
        }
      }

      const sceneElapsed = currentTime - currentScene.startTime;
      const sceneProgress = sceneElapsed / currentScene.duration;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (currentScene.image) {
        const transitionType = assemblyConfig.transitions;

        // Check if we're in transition zone (last TRANSITION_DURATION of a scene)
        const isInTransition = nextScene && (currentScene.duration - sceneElapsed) < TRANSITION_DURATION;
        const transitionProgress = isInTransition
          ? 1 - ((currentScene.duration - sceneElapsed) / TRANSITION_DURATION)
          : 0;

        if (transitionType === 'crossfade' && isInTransition && nextScene?.image) {
          // Crossfade: blend current + next
          drawImageCover(ctx as unknown as CanvasRenderingContext2D, currentScene.image, width, height, 1 - transitionProgress);
          drawImageCover(ctx as unknown as CanvasRenderingContext2D, nextScene.image, width, height, transitionProgress);
        } else if (transitionType === 'zoom') {
          // Ken Burns effect: slow zoom throughout scene
          const zoom = 1 + sceneProgress * 0.1;
          drawImageCover(ctx as unknown as CanvasRenderingContext2D, currentScene.image, width, height, 1, zoom);
        } else if (transitionType === 'slide' && isInTransition && nextScene?.image) {
          // Slide: current slides left, next slides in from right
          const offset = -transitionProgress * width;
          drawImageCover(ctx as unknown as CanvasRenderingContext2D, currentScene.image, width, height, 1, 1, offset);
          drawImageCover(ctx as unknown as CanvasRenderingContext2D, nextScene.image, width, height, 1, 1, offset + width);
        } else {
          // Cut or default: just show current image
          drawImageCover(ctx as unknown as CanvasRenderingContext2D, currentScene.image, width, height, 1);
        }
      }

      // Copy offscreen → visible canvas for MediaRecorder
      const imageData = ctx.getImageData(0, 0, width, height);
      visibleCtx.putImageData(imageData as unknown as ImageData, 0, 0);

      // Log progress every 5 seconds
      if (frame % (FPS * 5) === 0 && frame > 0) {
        run.logs.push({
          t: Date.now(), level: 'info',
          msg: `🎞️ Rendered ${(currentTime).toFixed(0)}s / ${totalDuration.toFixed(0)}s (${Math.round((frame / totalFrames) * 100)}%)`,
          step: 'assembly',
        });
      }

      // Yield to browser to prevent blocking
      if (frame % FPS === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    // ── 9. Stop recording and get video blob ──
    run.logs.push({ t: Date.now(), level: 'info', msg: '🔄 Encoding final video...', step: 'assembly' });
    recorder.stop();
    scheduledSources.forEach(s => { try { s.stop(); } catch { /* ignore */ } });

    const videoBlob = await recordingDone;
    await audioCtx.close();

    run.logs.push({ t: Date.now(), level: 'info', msg: `📦 Video encoded: ${(videoBlob.size / 1024 / 1024).toFixed(1)} MB`, step: 'assembly' });

    // ── 10. Upload to Supabase ──
    run.logs.push({ t: Date.now(), level: 'info', msg: '💾 Uploading video to storage...', step: 'assembly' });
    const { url: videoUrl, fileSize } = await uploadVideo(videoBlob, channelId, runId);

    // ── 11. Save result ──
    const result: AssemblyResult = {
      videoUrl,
      format: 'webm', // Browser MediaRecorder outputs WebM
      duration: totalDuration,
      totalScenes: timeline.length,
      resolution: `${width}x${height}`,
      fileSize,
      transitions: assemblyConfig.transitions,
      bgMusic: assemblyConfig.bgMusic,
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
