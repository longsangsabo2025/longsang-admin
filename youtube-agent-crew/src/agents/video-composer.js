/**
 * AGENT 6: Video Composer (Podcast-Style)
 * 
 * Creates podcast videos in THE HIDDEN SELF style:
 * ┌─────────────────────────────────────┐
 * │         ĐỨNG DẬY ĐI                │  ← Channel name
 * │            🎙️                       │  ← Mic icon
 * │     ▐▌█▌▐█▌▐▌█▐▌▐▌                │  ← Audio waveform
 * │     ─────────●──────────            │  ← Progress bar
 * │         ◄◄  ▐▐  ►►                 │  ← Controls
 * │                                     │
 * │   "Phụ đề hiện ở đây"              │  ← Subtitles
 * └─────────────────────────────────────┘
 * 
 * Pipeline: Audio → Whisper subtitles → ComfyUI/SD background → FFmpeg composite
 * 
 * Input: Audio file path (from voice-producer)
 * Output: Final MP4 video path
 */
import { BaseAgent } from '../core/agent.js';
import { chat } from '../core/llm.js';
import { writeFile, mkdir, readFile, access } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { execSync, execFile, spawn } from 'child_process';
import { existsSync, statSync, readdirSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────

const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  // Channel branding
  channelName: 'ĐỨNG DẬY ĐI',
  // Colors  
  bgColor: '0x0a0a0f',        // Very dark blue-black
  textColor: 'white',
  accentColor: '0xe8e8e8',    // Light gray for subtle elements
  progressColor: 'white',
  // Fonts (Windows paths — colons escaped at filter build time)
  fontBold: 'C:/Windows/Fonts/arialbd.ttf',
  fontRegular: 'C:/Windows/Fonts/arial.ttf',
  // Subtitle style
  subtitleFontSize: 44,
  subtitleMarginBottom: 80,
  // Encoding
  preset: 'medium',          // medium for quality/speed balance
  crf: 20,                   // Good quality
};

export class VideoComposerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'video-assembler',                // Same ID to replace old agent
      name: '🎬 Video Composer',
      role: 'Podcast Video Production',
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt: 'You are a video production assistant.',
      temperature: 0.3,
      maxTokens: 1024,
    });
    this.outputDir = process.env.OUTPUT_DIR || './output';
    this.assetsDir = resolve(__dirname, '../../assets');

    // Resolve FFmpeg path — handle directory vs exe path
    let ffmpegBase = process.env.FFMPEG_PATH || 'C:/ffmpeg/bin';
    if (ffmpegBase.endsWith('/bin') || ffmpegBase.endsWith('\\bin')) {
      this.ffmpeg = ffmpegBase + '/ffmpeg.exe';
      this.ffprobe = ffmpegBase + '/ffprobe.exe';
    } else if (ffmpegBase.endsWith('.exe')) {
      this.ffmpeg = ffmpegBase;
      this.ffprobe = ffmpegBase.replace('ffmpeg.exe', 'ffprobe.exe');
    } else {
      this.ffmpeg = ffmpegBase + '/ffmpeg.exe';
      this.ffprobe = ffmpegBase + '/ffprobe.exe';
    }
    // Normalize path separators
    this.ffmpeg = this.ffmpeg.replace(/\\/g, '/');
    this.ffprobe = this.ffprobe.replace(/\\/g, '/');
  }

  // ── 1. Audio Duration ──────────────────────────────

  getAudioDuration(audioPath) {
    const absPath = resolve(audioPath).replace(/\\/g, '/');
    const result = execSync(
      `"${this.ffprobe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${absPath}"`,
      { encoding: 'utf-8', timeout: 30000 }
    ).trim();
    return parseFloat(result);
  }

  // ── 2. Generate Background Image (ComfyUI / Local SD) ──

  // ComfyUI config
  static COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
  static COMFYUI_DIR = process.env.COMFYUI_DIR || 'D:/Private_AI_Workspace/ComfyUI';
  
  /**
   * Ensure ComfyUI is running, start it if not
   */
  async ensureComfyUI() {
    const url = VideoComposerAgent.COMFYUI_URL;
    try {
      const res = await fetch(`${url}/system_stats`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        this.log('🎨 ComfyUI already running', 'info');
        return true;
      }
    } catch {}
    
    // Start ComfyUI
    this.log('🎨 Starting ComfyUI...', 'info');
    const comfyDir = VideoComposerAgent.COMFYUI_DIR;
    const pythonExe = join(comfyDir, 'venv/Scripts/python.exe').replace(/\\/g, '/');
    const mainPy = join(comfyDir, 'main.py').replace(/\\/g, '/');
    
    if (!existsSync(pythonExe)) {
      this.log('⚠️ ComfyUI venv not found, falling back to DALL-E', 'warn');
      return false;
    }
    
    const child = spawn(pythonExe, [
      mainPy,
      '--highvram', '--fast', '--fp16-vae',
      '--listen', '127.0.0.1', '--port', '8188',
    ], {
      cwd: comfyDir,
      stdio: 'ignore',
      detached: true,
      env: { ...process.env, PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:512' },
    });
    child.unref();
    
    // Wait for ComfyUI to be ready (max 60s)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch(`${url}/system_stats`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          this.log('🎨 ComfyUI started successfully', 'success');
          return true;
        }
      } catch {}
    }
    
    this.log('⚠️ ComfyUI failed to start after 60s', 'warn');
    return false;
  }

  // ── Model Profiles (2026 State-of-Art) ──────────────────
  //
  // Priority: FLUX.1 Schnell (best) → SDXL → SD 1.5 (fallback)
  // FLUX.1 Schnell: 12B params, 4 steps, Apache 2.0, ~2-3s on RTX 4090
  //
  static MODEL_PROFILES = {
    // FLUX.1 Schnell — State-of-art, 12B params, 4 steps (!)
    flux_schnell: {
      type: 'flux',
      width: 1344,
      height: 768,
      steps: 4,           // Distilled to 4 steps!
      cfg: 1.0,           // FLUX uses no CFG guidance
      sampler: 'euler',
      scheduler: 'simple',
      hiresEnabled: false, // Not needed — FLUX native quality is superb
      negative: '',        // FLUX doesn't use negative prompts
    },
    // SDXL — good fallback
    sdxl: {
      type: 'sdxl',
      width: 1344,
      height: 768,
      steps: 30,
      cfg: 6.5,
      sampler: 'dpmpp_2m_sde',
      scheduler: 'karras',
      hiresEnabled: true,
      hiresSteps: 12,
      hiresDenoise: 0.35,
      hiresScale: 1.5,
      negative: [
        'worst quality, low quality, normal quality, lowres, bad quality',
        'jpeg artifacts, compression artifacts, noise, blurry, out of focus, pixelated',
        'text, watermark, logo, words, letters, numbers, signature, username, artist name, copyright, stamp, banner, subtitle, caption, label',
        'bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, mutated, deformed, ugly, disfigured',
        'cropped, frame, border, bright, overexposed, oversaturated, split image, collage, duplicate',
        'cartoon, anime, 3d render, cgi, illustration, sketch, drawing',
      ].join(', '),
    },
    // SD 1.5 — legacy fallback
    sd15: {
      type: 'sd15',
      width: 768,
      height: 512,
      steps: 35,
      cfg: 7.5,
      sampler: 'dpmpp_2m',
      scheduler: 'karras',
      hiresEnabled: true,
      hiresSteps: 15,
      hiresDenoise: 0.45,
      hiresScale: 2.0,
      negative: [
        'worst quality, low quality, normal quality, lowres, bad quality, poor quality',
        'jpeg artifacts, compression artifacts, noise, grain, pixelated, blurry, out of focus',
        'text, watermark, logo, words, letters, numbers, signature, username, artist name, copyright, stamp, banner, subtitle, caption, label, title',
        'bad anatomy, bad hands, bad fingers, extra fingers, missing fingers, extra limbs, missing limbs, fused fingers, too many fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, disfigured, mutation',
        'cropped, frame, border, bright, overexposed, underexposed, oversaturated, split image, collage, grid, tiling, duplicate, clone',
        'cartoon, anime, 3d render, cgi, illustration, painting, sketch, drawing, comic, manga',
      ].join(', '),
    },
  };

  /**
   * Detect best available checkpoint: FLUX > SDXL > SD1.5
   */
  detectCheckpoint() {
    const comfyDir = VideoComposerAgent.COMFYUI_DIR;
    const checkpointDir = join(comfyDir, 'models/checkpoints');
    const PROFILES = VideoComposerAgent.MODEL_PROFILES;

    if (!existsSync(checkpointDir)) {
      return { checkpoint: 'sd15.safetensors', profile: PROFILES.sd15 };
    }

    const files = readdirSync(checkpointDir)
      .filter(f => (f.endsWith('.safetensors') || f.endsWith('.ckpt')) && f !== 'put_checkpoints_here');

    // Priority 1: FLUX.1 Schnell (best quality + fastest)
    const fluxModel = files.find(f => /flux.*schnell/i.test(f));
    if (fluxModel) {
      return { checkpoint: fluxModel, profile: PROFILES.flux_schnell };
    }

    // Priority 2: Any FLUX model (dev, etc.)
    const fluxAny = files.find(f => /flux/i.test(f));
    if (fluxAny) {
      // FLUX Dev uses more steps
      const devProfile = { ...PROFILES.flux_schnell, steps: 20, sampler: 'euler', scheduler: 'simple' };
      return { checkpoint: fluxAny, profile: devProfile };
    }

    // Priority 3: SDXL
    const sdxlModel = files.find(f => /sdxl|xl_base|xl-base/i.test(f));
    if (sdxlModel) {
      return { checkpoint: sdxlModel, profile: PROFILES.sdxl };
    }

    // Priority 4: SD 1.5 / any other
    const fallback = files[0] || 'sd15.safetensors';
    return { checkpoint: fallback, profile: PROFILES.sd15 };
  }

  /**
   * Generate image via ComfyUI API — supports FLUX, SDXL, and SD1.5
   */
  async generateViaComfyUI(prompt, outputPath) {
    const url = VideoComposerAgent.COMFYUI_URL;
    const { checkpoint, profile } = this.detectCheckpoint();
    
    const modelLabel = profile.type === 'flux' ? 'FLUX.1' : profile.type === 'sdxl' ? 'SDXL' : 'SD1.5';
    this.log(`🎨 Model: ${checkpoint} (${modelLabel}) | ${profile.sampler}/${profile.scheduler} | ${profile.steps} steps`, 'info');

    // Build appropriate workflow for model architecture
    const workflow = profile.type === 'flux'
      ? this.buildFluxWorkflow(prompt, checkpoint, profile)
      : this.buildSDWorkflow(prompt, profile.negative, checkpoint, profile);
    
    const saveNodeId = workflow._saveNodeId;
    delete workflow._saveNodeId;
    
    // Queue prompt
    const queueRes = await fetch(`${url}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });
    
    if (!queueRes.ok) {
      const err = await queueRes.text();
      throw new Error(`ComfyUI queue failed: ${err}`);
    }
    
    const { prompt_id } = await queueRes.json();
    this.log(`🎨 Queued: ${prompt_id}`, 'info');
    
    // Adaptive timeout: FLUX Schnell (4 steps) is fast, SDXL/SD1.5+hires needs more
    const maxPollSec = profile.type === 'flux' && profile.steps <= 4 ? 120 : 300;
    const maxPolls = Math.ceil(maxPollSec / 2);
    let outputImages = null;
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const histRes = await fetch(`${url}/history/${prompt_id}`);
        const hist = await histRes.json();
        if (hist[prompt_id]?.outputs?.[saveNodeId]?.images?.length > 0) {
          outputImages = hist[prompt_id].outputs[saveNodeId].images;
          break;
        }
        if (hist[prompt_id]?.status?.status_str === 'error') {
          const msgs = hist[prompt_id].status.messages || [];
          throw new Error(`ComfyUI execution error: ${JSON.stringify(msgs.slice(-2))}`);
        }
        // Progress logging every 30s
        if (i > 0 && i % 15 === 0) {
          this.log(`🎨 Still generating... (${i * 2}s / ${maxPollSec}s max)`, 'info');
        }
      } catch (e) {
        if (e.message.includes('ComfyUI execution error')) throw e;
      }
    }
    
    if (!outputImages) throw new Error(`ComfyUI generation timed out after ${maxPollSec}s`);
    
    // Download generated image
    const img = outputImages[0];
    const imgRes = await fetch(`${url}/view?filename=${img.filename}&subfolder=${img.subfolder || ''}&type=${img.type || 'output'}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    await writeFile(outputPath, imgBuffer);
    
    this.log(`🎨 Background: ${(imgBuffer.length / 1024).toFixed(0)}KB [${modelLabel} - $0]`, 'success');
    return outputPath;
  }

  /**
   * FLUX workflow: CheckpointLoader → CLIP → KSampler → VAEDecode → Save
   * FLUX uses CFG=1.0, no negative prompt, 4 steps for schnell
   */
  buildFluxWorkflow(prompt, checkpoint, profile) {
    const seed = Math.floor(Math.random() * 2**32);
    
    return {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: checkpoint },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: { text: prompt, clip: ['1', 1] },
      },
      // FLUX: empty negative (required node but no content)
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: { text: '', clip: ['1', 1] },
      },
      '4': {
        class_type: 'EmptyLatentImage',
        inputs: { width: profile.width, height: profile.height, batch_size: 1 },
      },
      '5': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: profile.steps,
          cfg: profile.cfg,       // 1.0 for FLUX
          sampler_name: profile.sampler,
          scheduler: profile.scheduler,
          denoise: 1.0,
          model: ['1', 0],
          positive: ['2', 0],
          negative: ['3', 0],
          latent_image: ['4', 0],
        },
      },
      '6': {
        class_type: 'VAEDecode',
        inputs: { samples: ['5', 0], vae: ['1', 2] },
      },
      '7': {
        class_type: 'SaveImage',
        inputs: { filename_prefix: 'podcast_bg_flux', images: ['6', 0] },
      },
      _saveNodeId: '7',
    };
  }

  /**
   * SD/SDXL workflow: txt2img + optional hi-res fix upscale
   */
  buildSDWorkflow(prompt, negative, checkpoint, profile) {
    const seed = Math.floor(Math.random() * 2**32);
    
    const workflow = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: checkpoint },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: { text: prompt, clip: ['1', 1] },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: { text: negative, clip: ['1', 1] },
      },
      '4': {
        class_type: 'EmptyLatentImage',
        inputs: { width: profile.width, height: profile.height, batch_size: 1 },
      },
      '5': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: profile.steps,
          cfg: profile.cfg,
          sampler_name: profile.sampler,
          scheduler: profile.scheduler,
          denoise: 1.0,
          model: ['1', 0],
          positive: ['2', 0],
          negative: ['3', 0],
          latent_image: ['4', 0],
        },
      },
    };

    if (profile.hiresEnabled) {
      // Hi-Res Fix: LatentUpscale → KSampler refine
      workflow['6'] = {
        class_type: 'LatentUpscale',
        inputs: {
          upscale_method: 'bilinear',
          width: Math.round(profile.width * profile.hiresScale),
          height: Math.round(profile.height * profile.hiresScale),
          crop: 'disabled',
          samples: ['5', 0],
        },
      };
      workflow['7'] = {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps: profile.hiresSteps,
          cfg: profile.cfg,
          sampler_name: profile.sampler,
          scheduler: profile.scheduler,
          denoise: profile.hiresDenoise,
          model: ['1', 0],
          positive: ['2', 0],
          negative: ['3', 0],
          latent_image: ['6', 0],
        },
      };
      workflow['8'] = {
        class_type: 'VAEDecode',
        inputs: { samples: ['7', 0], vae: ['1', 2] },
      };
      workflow['9'] = {
        class_type: 'SaveImage',
        inputs: { filename_prefix: 'podcast_bg_hires', images: ['8', 0] },
      };
      workflow._saveNodeId = '9';
    } else {
      workflow['6'] = {
        class_type: 'VAEDecode',
        inputs: { samples: ['5', 0], vae: ['1', 2] },
      };
      workflow['7'] = {
        class_type: 'SaveImage',
        inputs: { filename_prefix: 'podcast_bg', images: ['6', 0] },
      };
      workflow._saveNodeId = '7';
    }

    return workflow;
  }

  async generateBackground(topic, outputPath) {
    // Detect model type for prompt optimization
    const { profile } = this.detectCheckpoint();
    
    // Select expert prompt system by model architecture
    let systemPrompt;
    switch (profile.type) {
      case 'flux':
        systemPrompt = this.getFluxPromptSystem();
        break;
      case 'sdxl':
        systemPrompt = this.getSDXLPromptSystem();
        break;
      default:
        systemPrompt = this.getSD15PromptSystem();
    }
    
    const { content: imagePrompt } = await chat({
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt,
      userMessage: `Topic: ${topic}`,
      temperature: 0.75,
      maxTokens: 300,
    });

    // Clean and finalize prompt
    const cleanPrompt = imagePrompt
      .replace(/^["']|["']$/g, '')  // Remove quotes
      .replace(/\n/g, ', ')         // Flatten newlines
      .trim();
    
    this.log(`🎨 ${profile.type.toUpperCase()} Prompt: ${cleanPrompt.substring(0, 120)}...`, 'info');

    // Try ComfyUI first (FREE, local)
    const comfyReady = await this.ensureComfyUI();
    if (comfyReady) {
      try {
        return await this.generateViaComfyUI(cleanPrompt, outputPath);
      } catch (error) {
        this.log(`🎨 ComfyUI failed: ${error.message}, falling back...`, 'warn');
      }
    }

    // Fallback: DALL-E 3 ($0.04/image)
    this.log('🎨 Falling back to DALL-E 3...', 'warn');
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${cleanPrompt}. Style: ultra dark cinematic, bokeh background, moody ambient lighting, 16:9 aspect ratio, no text or words in image.`,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
      });
      const imgResponse = await fetch(response.data[0].url);
      const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      await writeFile(outputPath, imgBuffer);
      this.log(`🎨 Background saved: ${outputPath} (${(imgBuffer.length / 1024).toFixed(0)}KB) [DALL-E $0.04]`, 'success');
      return outputPath;
    } catch (dalleErr) {
      this.log(`🎨 DALL-E also failed: ${dalleErr.message}, using gradient fallback`, 'warn');
      const absOut = resolve(outputPath).replace(/\\/g, '/');
      execSync(
        `"${this.ffmpeg}" -y -f lavfi -i "gradients=s=1920x1080:c0=0x0a0a1f:c1=0x000000:duration=1:speed=0.01" -frames:v 1 "${absOut}"`,
        { timeout: 15000, stdio: 'pipe' }
      );
      return outputPath;
    }
  }

  /**
   * Expert FLUX.1 prompt engineering system
   * FLUX uses natural language descriptions — NO weighted tags, NO (tag:1.2) syntax
   * 12B parameter model understands complex scene descriptions natively
   */
  getFluxPromptSystem() {
    return `You are an expert FLUX.1 prompt engineer creating backgrounds for a Vietnamese self-help podcast channel "ĐỨNG DẬY ĐI" (Stand Up).

CRITICAL REQUIREMENTS:
- Image must be DARK with moody atmosphere — white text will overlay this image
- Dark tones should dominate (70-80% of image area) with strategic highlights
- NO text, NO words, NO letters, NO numbers in the image
- NO clearly visible faces (dark silhouettes are acceptable)
- Cinematic, atmospheric, emotionally evocative
- Must work as a podcast video background (needs dark space for text overlays)

FLUX.1 PROMPT RULES:
- Write in NATURAL LANGUAGE, like describing a photograph to a cinematographer
- FLUX understands complex descriptions without weighted tags
- DO NOT use (tag:1.2) weighted syntax — FLUX doesn't support it
- DO NOT use comma-separated tag lists — use flowing sentences instead
- Be specific about lighting direction, color temperature, and atmosphere
- Describe the exact mood and emotional quality you want
- FLUX excels at photorealistic scenes with complex lighting

OUTPUT FORMAT: Return ONLY the scene description. NO explanations, NO markdown, NO quotes.

PROMPT STRUCTURE:
1. SCENE: Describe what we see (subject, environment, setting)
2. LIGHTING: Direction, quality, color temperature, intensity
3. ATMOSPHERE: Fog, mist, particles, depth, ambiance
4. MOOD: Emotional quality, feeling, tension
5. CAMERA: Perspective, depth of field, lens characteristics
6. STYLE: Photographic style and finish quality

TOPIC → SCENE MAPPING:
- Philosophy/meaning: A vast dimly lit ancient library stretching into darkness, warm candlelight casting long shadows across leather-bound books
- Relationships/emotions: A moody cafe interior at twilight, rain streaking down window glass, warm lamp glow against dark blue shadows outside
- Success/motivation: A dramatic night cityscape seen from a rooftop, city lights creating bokeh below, single figure silhouetted against the sky
- Psychology/self-help: A mysterious corridor with a door slightly ajar at the end, warm golden light spilling through the crack into deep surrounding darkness
- Spirituality: A serene temple interior at dusk, incense smoke curling through shafts of dying sunlight, everything bathed in deep shadow
- Struggle/resilience: A solitary figure walking on a rain-soaked road at night, street lamps creating pools of warm light in the surrounding darkness

EXCELLENT FLUX PROMPT EXAMPLE:
A dimly lit vintage library interior at night, rows of old leather-bound books on dark mahogany shelves stretching deep into shadow. A single warm candle flame illuminates dust particles floating lazily through the air. Volumetric light rays cut through the darkness from a distant window. The scene is captured with a shallow depth of field on a 35mm lens, creating beautiful circular bokeh in the background. Deep rich shadows dominate the frame with muted warm amber tones against near-black surroundings. Professional cinematic photography with film grain texture, ultra detailed, photorealistic.`;
  }

  /**
   * Expert SD 1.5 prompt engineering system
   * Uses weighted tags, quality boosters, and style-specific knowledge
   */
  getSD15PromptSystem() {
    return `You are an expert Stable Diffusion 1.5 prompt engineer creating backgrounds for a Vietnamese self-help podcast channel "ĐỨNG DẬY ĐI" (Stand Up).

CRITICAL REQUIREMENTS:
- Image must be VERY DARK (85%+ dark tones) — white text will overlay this
- NO text, NO words, NO letters, NO numbers in the image
- NO faces clearly visible (silhouettes OK)
- Atmospheric, moody, cinematic feel
- MUST work as a podcast background (text overlay space)

OUTPUT FORMAT: Return ONLY comma-separated SD tags. NO explanations, NO markdown, NO quotes.

PROMPT STRUCTURE (follow this exact order):
1. SUBJECT: Brief scene description with mood (1-2 phrases)
2. LIGHTING: (critical for mood) — use terms like: volumetric lighting, rim lighting, backlit, low key lighting, chiaroscuro, god rays, lens flare
3. ATMOSPHERE: mist, fog, haze, smoke, dust particles, bokeh, light leaks
4. COLOR: dark color palette terms — deep shadows, dark tones, muted colors, desaturated, teal and orange, cool blue tones
5. CAMERA: shallow depth of field, 35mm film, cinematic composition, wide angle, anamorphic
6. QUALITY BOOSTERS (always end with these): (masterpiece:1.2), (best quality:1.2), (highres:1.1), professional photography, photorealistic, ultra detailed, 8k uhd, dslr, film grain

STYLE VOCABULARY for topics:
- Philosophy/meaning of life: dark library, old books, candlelight, antique desk, hourglass, window light
- Relationships/emotions: two silhouettes, coffee shop at night, rain on window, warm lamp, empty chair
- Success/motivation: city skyline at night, mountain peak, sunrise through clouds, lone figure walking
- Psychology/self-help: mirror reflection, crossroads, foggy path, open door with light
- Spirituality: temple interior, meditation space, incense smoke, zen garden at night
- General: moody cafe interior, rainy street at night, starry sky, ocean at twilight

WEIGHTED TAGS: Use (tag:weight) format for emphasis. Example: (volumetric lighting:1.3), (dark:1.4), (cinematic:1.2)
Always emphasize darkness: (dark:1.4), (dimly lit:1.3), (shadows:1.2)

EXAMPLE OUTPUT:
dimly lit vintage library interior, old leather books on wooden shelves, single candle flame, dust particles floating in warm light, (volumetric lighting:1.3), (dark:1.4), (shadows:1.2), (low key lighting:1.2), shallow depth of field, bokeh, dark tones, muted warm colors, cinematic composition, 35mm film, (masterpiece:1.2), (best quality:1.2), (highres:1.1), professional photography, photorealistic, ultra detailed, 8k uhd, dslr, film grain`;
  }

  /**
   * Expert SDXL prompt engineering system
   * SDXL responds better to natural language + quality tags
   */
  getSDXLPromptSystem() {
    return `You are an expert SDXL prompt engineer creating backgrounds for a Vietnamese self-help podcast channel "ĐỨNG DẬY ĐI" (Stand Up).

CRITICAL REQUIREMENTS:
- Image must be VERY DARK (85%+ dark tones) — white text will overlay this image
- NO text, NO words, NO letters, NO numbers in the image at all
- NO clearly visible faces (dark silhouettes are fine)
- Atmospheric, moody, cinematic feel — think Netflix opening scene
- Must work as background (needs empty/dark space for text overlays)

OUTPUT FORMAT: Return ONLY the prompt. NO explanations, NO markdown, NO quotes.

SDXL PROMPT STRUCTURE (SDXL prefers slightly more natural language than SD1.5):
1. MAIN SCENE: Describe the scene naturally but concisely (1-2 sentences)
2. LIGHTING: volumetric lighting, rim light, backlit silhouette, low key, chiaroscuro, god rays, neon glow, ambient light
3. ATMOSPHERE: fog, mist, haze, bokeh, dust particles, light rays, smoke
4. MOOD: melancholic, contemplative, serene, dramatic, mysterious, intimate
5. TECHNICAL: cinematic, shallow depth of field, 35mm film, anamorphic lens, wide establishing shot
6. QUALITY: masterpiece, best quality, ultra detailed, photorealistic, award-winning photography, 8k resolution

TOPIC → SCENE MAPPING:
- Philosophy: Ancient library with candlelight, cosmic void, meditation chamber
- Relationships: Two silhouettes in dimly lit cafe, rain-streaked window, lone figure
- Success: Night cityscape, mountain summit at golden hour, winding road ahead
- Psychology: Mirror in dark room, fog-shrouded crossroads, door ajar with warm light
- Spirituality: Temple at dusk, incense smoke trails, starlit sky over calm water

KEY DIFFERENCES FROM SD1.5:
- SDXL handles longer descriptive phrases better
- Quality tags still important but less weighted-tag-dependent
- Natural language descriptions produce excellent results
- Can handle more complex scene compositions

EXAMPLE:
A dimly lit vintage library interior at night, rows of old leather-bound books on dark wooden shelves stretching into shadow, a single warm candle illuminating dust particles floating in the air, volumetric light rays cutting through darkness, deep shadows, low key cinematic lighting, shallow depth of field with beautiful bokeh, muted warm tones against deep blacks, 35mm film photography, masterpiece, best quality, ultra detailed, photorealistic, award-winning photography`;
  }

  // ── 3. Generate Subtitles (Whisper) ────────────────

  async generateSubtitles(audioPath, outputDir) {
    this.log('📝 Generating subtitles via Whisper...', 'info');
    
    const srtPath = join(outputDir, 'subtitles.srt');
    const assPath = join(outputDir, 'subtitles.ass');
    const absAudio = resolve(audioPath).replace(/\\/g, '/');
    const absOutputDir = resolve(outputDir).replace(/\\/g, '/');

    // Prefer faster-whisper (CUDA GPU, ~10x faster) over openai-whisper (CPU)
    const fasterWhisperPython = process.env.VOXCPM_PYTHON
      || 'D:/0.PROJECTS/00-MASTER-ADMIN/voxcpm-tts/.venv/Scripts/python.exe';
    const fasterWhisperScript = resolve(__dirname, '../utils/faster-whisper-srt.py').replace(/\\/g, '/');
    const useFasterWhisper = existsSync(fasterWhisperPython) && existsSync(fasterWhisperScript);

    try {
      if (useFasterWhisper) {
        this.log('📝 Using faster-whisper (CUDA GPU)', 'info');
        await new Promise((resolveP, rejectP) => {
          execFile(fasterWhisperPython, [
            fasterWhisperScript,
            absAudio,
            absOutputDir,
            'medium',
          ], {
            timeout: 600000, // 10 min — GPU is fast, but model loading takes ~15s
            maxBuffer: 50 * 1024 * 1024,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            windowsHide: true,
          }, (error, stdout, stderr) => {
            if (stderr) console.log(stderr.trim());
            if (error) rejectP(error);
            else resolveP(stdout);
          });
        });
      } else {
        // Fallback: openai-whisper on CPU (much slower)
        this.log('📝 faster-whisper not found, falling back to openai-whisper (CPU)', 'warn');
        const whisperBin = process.platform === 'win32'
          ? join(process.env.APPDATA || '', 'Python', 'Python313', 'Scripts', 'whisper.exe')
          : 'whisper';
        const useWhisperExe = existsSync(whisperBin);
        const args = [
          absAudio,
          '--model', 'medium',
          '--language', 'vi',
          '--output_format', 'srt',
          '--output_dir', absOutputDir,
          '--task', 'transcribe',
        ];
        await new Promise((resolveP, rejectP) => {
          const cmd = useWhisperExe ? whisperBin : 'python';
          const fullArgs = useWhisperExe ? args : ['-m', 'whisper', ...args];
          this.log(`📝 Running: ${cmd} (timeout 20min)`, 'info');
          execFile(cmd, fullArgs, {
            timeout: 1200000,
            maxBuffer: 50 * 1024 * 1024,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            windowsHide: true,
          }, (error, stdout, stderr) => {
            if (error) rejectP(error);
            else resolveP(stdout);
          });
        });
      }
      
      // Whisper outputs filename-based .srt, rename if needed
      const expectedName = audioPath.split(/[\\/]/).pop().replace(/\.[^.]+$/, '.srt');
      const whisperSrt = join(outputDir, expectedName);
      if (existsSync(whisperSrt) && whisperSrt !== srtPath) {
        const srtContent = await readFile(whisperSrt, 'utf-8');
        await writeFile(srtPath, srtContent);
      }

      this.log('📝 SRT subtitles generated', 'success');
    } catch (error) {
      this.log(`📝 Whisper failed: ${error.message}`, 'warn');
      this.log('📝 Creating subtitle from script text instead...', 'info');
      
      // Fallback: create simple subtitles from script timing estimate
      return this.createFallbackSubtitles(audioPath, srtPath);
    }

    // Convert SRT → ASS with podcast styling
    await this.srtToAss(srtPath, assPath);
    return assPath;
  }

  /**
   * Create fallback subtitles when Whisper is not available
   * Estimates timing from audio duration and text chunks
   */
  async createFallbackSubtitles(audioPath, srtPath) {
    const assPath = srtPath.replace('.srt', '.ass');
    // Create empty ASS so FFmpeg won't error
    await this.createEmptyAss(assPath);
    this.log('📝 No subtitles (Whisper not installed)', 'warn');
    return assPath;
  }

  /**
   * Convert SRT to ASS with podcast-appropriate styling
   */
  async srtToAss(srtPath, assPath) {
    const srtContent = await readFile(srtPath, 'utf-8');
    
    // Parse SRT entries
    const entries = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;
      const text = lines.slice(2).join('\\N');
      entries.push({
        start: this.srtTimeToAss(timeMatch[1]),
        end: this.srtTimeToAss(timeMatch[2]),
        text,
      });
    }

    // Build ASS file
    const assContent = `[Script Info]
Title: Podcast Subtitles
ScriptType: v4.00+
PlayResX: ${VIDEO_CONFIG.width}
PlayResY: ${VIDEO_CONFIG.height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${VIDEO_CONFIG.subtitleFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2.5,1,2,40,40,${VIDEO_CONFIG.subtitleMarginBottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${entries.map(e => `Dialogue: 0,${e.start},${e.end},Default,,0,0,0,,${e.text}`).join('\n')}
`;

    await writeFile(assPath, assContent, 'utf-8');
    this.log(`📝 ASS subtitles: ${entries.length} entries`, 'success');
    return assPath;
  }

  srtTimeToAss(srtTime) {
    // 00:01:23,456 → 0:01:23.46
    return srtTime
      .replace(/^0/, '')
      .replace(',', '.')
      .replace(/(\.\d{2})\d$/, '$1');
  }

  async createEmptyAss(assPath) {
    const content = `[Script Info]
Title: Empty
ScriptType: v4.00+
PlayResX: ${VIDEO_CONFIG.width}
PlayResY: ${VIDEO_CONFIG.height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${VIDEO_CONFIG.subtitleFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2.5,1,2,40,40,${VIDEO_CONFIG.subtitleMarginBottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    await writeFile(assPath, content, 'utf-8');
  }

  // ── 4. FFmpeg Video Assembly ───────────────────────

  /**
   * Compose final video: bg image + Ken Burns + overlay + waveform + subtitles + audio
   */
  async composeVideo({ bgImagePath, audioPath, assPath, outputPath, duration }) {
    this.log('🎬 Composing final video...', 'info');

    const absBg = resolve(bgImagePath).replace(/\\/g, '/');
    const absAudio = resolve(audioPath).replace(/\\/g, '/');
    const absAss = resolve(assPath).replace(/\\/g, '/');
    const absOut = resolve(outputPath).replace(/\\/g, '/');
    const C = VIDEO_CONFIG;
    const dur = Math.ceil(duration);

    // Build filter graph — written to file to bypass Windows shell escaping
    // FFmpeg still needs \: to escape colons in paths within filter syntax
    const esc = (p) => p.replace(/:/g, '\\:');
    const filterComplex = [
      `[0:v]loop=loop=-1:size=1:start=0,`,
      `trim=duration=${dur},fps=${C.fps},`,
      `scale=${C.width}:${C.height}:force_original_aspect_ratio=increase,`,
      `crop=${C.width}:${C.height},`,
      `setsar=1,`,
      `colorlevels=rimax=0.55:gimax=0.55:bimax=0.55,`,
      `vignette=PI/4,`,
      `drawtext=text='${C.channelName}':fontfile='${esc(C.fontBold)}':`,
      `fontsize=64:fontcolor=white:`,
      `x=(w-text_w)/2:y=55:`,
      `shadowcolor=black@0.7:shadowx=3:shadowy=3,`,
      `drawbox=x=(iw-500)/2:y=145:w=500:h=2:color=0x666666:thickness=fill,`,
      `drawbox=x=120:y=ih-55:w=iw-240:h=3:color=0x333333:thickness=fill,`,
      `drawbox=x=120:y=ih-55:w='(iw-240)*t/${dur}':h=3:color=white:thickness=fill,`,
      `ass='${esc(absAss)}'[vout]`,
    ].join('');

    // Save filter to file and use -filter_complex_script (avoids shell escaping)
    const filterFile = join(dirname(outputPath), 'filter_complex.txt');
    await writeFile(filterFile, filterComplex, 'utf-8');
    const absFilter = resolve(filterFile).replace(/\\/g, '/');

    const cmd = [
      `"${this.ffmpeg}" -y`,
      `-i "${absBg}"`,
      `-i "${absAudio}"`,
      `-filter_complex_script "${absFilter}"`,
      `-map "[vout]"`,
      `-map 1:a`,
      `-c:v libx264`,
      `-preset ${C.preset}`,
      `-crf ${C.crf}`,
      `-pix_fmt yuv420p`,
      `-c:a aac -b:a 192k`,
      `-shortest`,
      `-movflags +faststart`,
      `"${absOut}"`,
    ].join(' ');

    try {
      this.log('🎬 Running FFmpeg (this may take a few minutes)...', 'info');
      execSync(cmd, { 
        timeout: 1800000,   // 30 min timeout
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024,
      });
      
      // Get file size
      const stats = statSync(outputPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
      
      this.log(`🎬 Video created: ${outputPath} (${sizeMB}MB, ${duration.toFixed(1)}s)`, 'success');
      return outputPath;
    } catch (error) {
      this.log(`🎬 Complex filter failed, trying simplified version...`, 'warn');
      return this.composeVideoSimple({ bgImagePath, audioPath, assPath, outputPath, duration });
    }
  }

  /**
   * Simplified video composition (fallback if complex filter fails)
   */
  async composeVideoSimple({ bgImagePath, audioPath, assPath, outputPath, duration }) {
    const absBg = resolve(bgImagePath).replace(/\\/g, '/');
    const absAudio = resolve(audioPath).replace(/\\/g, '/');
    const absAss = resolve(assPath).replace(/\\/g, '/');
    const absOut = resolve(outputPath).replace(/\\/g, '/');
    const C = VIDEO_CONFIG;
    const dur = Math.ceil(duration);

    // Build simplified filter graph — written to file to bypass shell escaping
    const esc = (p) => p.replace(/:/g, '\\:');
    const filterComplex = [
      `[0:v]loop=loop=-1:size=1:start=0,trim=duration=${dur},fps=${C.fps},`,
      `scale=${C.width}:${C.height}:force_original_aspect_ratio=decrease,`,
      `pad=${C.width}:${C.height}:(ow-iw)/2:(oh-ih)/2:color=black,`,
      `colorlevels=rimax=0.6:gimax=0.6:bimax=0.6,`,
      `drawtext=text='${C.channelName}':fontfile='${esc(C.fontBold)}':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=60:shadowcolor=black@0.6:shadowx=2:shadowy=2,`,
      `drawbox=x=100:y=ih-50:w=iw-200:h=3:color=0x333333:thickness=fill,`,
      `drawbox=x=100:y=ih-50:w='(iw-200)*t/${dur}':h=3:color=white:thickness=fill,`,
      `ass='${esc(absAss)}'[vout]`,
    ].join('');

    const filterFile = join(dirname(outputPath), 'filter_simple.txt');
    await writeFile(filterFile, filterComplex, 'utf-8');
    const absFilter = resolve(filterFile).replace(/\\/g, '/');

    const cmd = [
      `"${this.ffmpeg}" -y`,
      `-i "${absBg}"`,
      `-i "${absAudio}"`,
      `-filter_complex_script "${absFilter}"`,
      `-map "[vout]" -map 1:a`,
      `-c:v libx264 -preset ${C.preset} -crf ${C.crf} -pix_fmt yuv420p`,
      `-c:a aac -b:a 192k`,
      `-shortest -movflags +faststart`,
      `"${absOut}"`,
    ].join(' ');

    execSync(cmd, { timeout: 1800000, stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 });
    this.log(`🎬 Video created (simple mode): ${outputPath}`, 'success');
    return outputPath;
  }

  // ── 4b. Thumbnail Generator ────────────────────────

  /**
   * Generate YouTube thumbnail: FLUX background + text overlay via FFmpeg
   * YouTube standard: 1280x720
   */
  async generateThumbnail(topic, outputPath) {
    this.log('🖼️ Generating thumbnail...', 'info');

    const { profile } = this.detectCheckpoint();
    const systemPrompt = this.getThumbnailPromptSystem(profile.type);

    const { content: imagePrompt } = await chat({
      model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      systemPrompt,
      userMessage: `Topic: ${topic}`,
      temperature: 0.8,
      maxTokens: 300,
    });

    const cleanPrompt = imagePrompt.replace(/^["']|["']$/g, '').replace(/\n/g, ', ').trim();
    this.log(`🖼️ Thumb prompt: ${cleanPrompt.substring(0, 100)}...`, 'info');

    // Generate base image via ComfyUI at 1280x720
    const basePath = outputPath.replace('.png', '_base.png');
    const comfyReady = await this.ensureComfyUI();

    let baseGenerated = false;
    if (comfyReady) {
      try {
        // Override resolution for thumbnail
        const savedW = profile.width, savedH = profile.height;
        profile.width = 1280;
        profile.height = 720;
        await this.generateViaComfyUI(cleanPrompt, basePath);
        profile.width = savedW;
        profile.height = savedH;
        baseGenerated = true;
      } catch (error) {
        this.log(`🖼️ ComfyUI thumb failed: ${error.message}`, 'warn');
      }
    }

    // Fallback: gradient
    if (!baseGenerated) {
      const absOut = resolve(basePath).replace(/\\/g, '/');
      execSync(
        `"${this.ffmpeg}" -y -f lavfi -i "gradients=s=1280x720:c0=0x1a0a2e:c1=0x000000:duration=1:speed=0.01" -frames:v 1 "${absOut}"`,
        { timeout: 15000, stdio: 'pipe' }
      );
    }

    // Add text overlay + branding
    await this.addThumbnailOverlay(basePath, outputPath, topic);
    try { unlinkSync(basePath); } catch {}
    this.log(`🖼️ Thumbnail: ${outputPath}`, 'success');
    return outputPath;
  }

  /**
   * Add text overlay + channel branding to thumbnail via FFmpeg
   */
  async addThumbnailOverlay(basePath, outputPath, topic) {
    const C = VIDEO_CONFIG;
    const absBase = resolve(basePath).replace(/\\/g, '/');
    const absOut = resolve(outputPath).replace(/\\/g, '/');
    const esc = (p) => p.replace(/:/g, '\\:').replace(/'/g, "'\\''");

    // Short title for thumbnail (max ~40 chars)
    const thumbTitle = topic.length > 40 ? topic.substring(0, 40).trim() : topic;

    const filterComplex = [
      `[0:v]colorlevels=rimax=0.5:gimax=0.5:bimax=0.5,`,
      `vignette=angle=PI/4:mode=forward,`,
      `drawtext=text='${esc(C.channelName)}':fontfile='${esc(C.fontBold)}':fontsize=36:fontcolor=white@0.8:x=(w-text_w)/2:y=30,`,
      `drawtext=text='${esc(thumbTitle)}':fontfile='${esc(C.fontBold)}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.8:shadowx=4:shadowy=4,`,
      `drawbox=x=200:y=660:w=880:h=4:color=white@0.6:thickness=fill`,
      `[vout]`,
    ].join('');

    const filterFile = join(dirname(outputPath), 'filter_thumb.txt');
    await writeFile(filterFile, filterComplex, 'utf-8');
    const absFilter = resolve(filterFile).replace(/\\/g, '/');

    execSync(
      `"${this.ffmpeg}" -y -i "${absBase}" -filter_complex_script "${absFilter}" -map "[vout]" -frames:v 1 "${absOut}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
  }

  /**
   * Thumbnail prompt system — dramatic & eye-catching
   */
  getThumbnailPromptSystem(modelType) {
    if (modelType === 'flux') {
      return `You are an expert FLUX.1 prompt engineer creating YOUTUBE THUMBNAILS for channel "ĐỨNG DẬY ĐI".

THUMBNAIL RULES (different from video backgrounds):
- MORE DRAMATIC and eye-catching than regular backgrounds  
- Dark overall but with ONE strong focal point of light/color
- Should create INSTANT emotional reaction
- Text will overlay center — leave dark space there

FLUX RULES: Write in natural language. No weighted tags. No (tag:1.2) syntax.

STYLE: Netflix movie poster / viral YouTube thumbnail background
- Strong single focal element (glowing object, dramatic beam, silhouette)
- High contrast: very dark + one bright accent
- Dramatic, urgent, mysterious mood

TOPIC MAPPING:
- Money/Finance: Glowing gold coins in darkness, dramatic spotlight
- Self-improvement: Silhouette at crossroads with dramatic backlight  
- Psychology: Mysterious eye with reflections, moody lighting
- Success: Person on mountain peak, epic sunrise beginning
- Philosophy: Ancient hourglass with golden sand, dramatic side light

OUTPUT: ONLY scene description. NO markdown, NO quotes.

EXAMPLE: A single glowing hourglass suspended in complete darkness, golden sand flowing creating a luminous trail, dramatic rim lighting from behind casting warm amber glow, deep shadow everywhere else, ultra sharp, cinematic, photorealistic, hyper detailed`;
    }
    return `Create dramatic YouTube thumbnail background. Dark with ONE bright focal point. Comma-separated SD tags. End with (masterpiece:1.2), (best quality:1.2), (dramatic lighting:1.3), photorealistic, 8k uhd`;
  }

  // ── 5. Main Execute ────────────────────────────────

  async execute(task, context = {}) {
    const pipelineId = context.pipelineId || `standalone_${Date.now()}`;
    const { memory } = await import('../core/memory.js');
    
    // Get audio from previous stage
    const finalAudio = memory.get(pipelineId, 'final_audio');
    const audioDir = memory.get(pipelineId, 'audio_dir');
    
    // Determine audio path
    let audioPath = null;
    if (finalAudio && existsSync(finalAudio)) {
      audioPath = finalAudio;
    } else if (context.audioPath && existsSync(context.audioPath)) {
      audioPath = context.audioPath;
    } else if (typeof task === 'string' && existsSync(task)) {
      audioPath = task;
    }
    
    if (!audioPath) {
      this.log('❌ No audio file found for video composition', 'error');
      return JSON.stringify({
        error: 'No audio file provided',
        hint: 'Run voice-producer first, or provide audio path as task',
      });
    }

    const startTime = Date.now();
    
    // Setup output directory
    const videoDir = audioPath.includes('audio') 
      ? resolve(dirname(audioPath), '..', 'video')
      : join(this.outputDir, pipelineId, 'video');
    await mkdir(videoDir, { recursive: true });

    // Get audio duration
    const duration = this.getAudioDuration(audioPath);
    this.log(`🎵 Audio: ${audioPath} (${duration.toFixed(1)}s)`, 'info');

    // Step 1: Get topic for background generation
    let topic = 'triết học cuộc sống, chiêm nghiệm, tìm kiếm ý nghĩa';
    const scriptOutput = memory.get(pipelineId, 'podcast_script');
    if (scriptOutput) {
      try {
        const script = JSON.parse(scriptOutput);
        topic = script.title || script.topic || topic;
      } catch {
        // Use first 200 chars of script as topic hint
        topic = scriptOutput.substring(0, 200);
      }
    }

    // Step 2: Generate background image
    const bgPath = join(videoDir, 'background.png');
    await this.generateBackground(topic, bgPath);

    // Step 3: Generate thumbnail (1280x720, YouTube standard)
    const thumbPath = join(videoDir, 'thumbnail.png');
    await this.generateThumbnail(topic, thumbPath);

    // Step 4: Generate subtitles
    const assPath = await this.generateSubtitles(audioPath, videoDir);

    // Step 5: Compose final video
    const videoPath = join(videoDir, 'podcast_video.mp4');
    await this.composeVideo({
      bgImagePath: bgPath,
      audioPath,
      assPath,
      outputPath: videoPath,
      duration,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Store in memory for publisher stage
    memory.set(pipelineId, 'video_path', videoPath);
    memory.set(pipelineId, 'video_dir', videoDir);
    memory.set(pipelineId, 'thumbnail_path', thumbPath);

    const result = {
      videoPath,
      videoDir,
      thumbnailPath: thumbPath,
      duration: `${duration.toFixed(1)}s`,
      background: bgPath,
      subtitles: assPath,
      elapsed: `${elapsed}s`,
    };

    this.log(`🎬 Final video: ${videoPath} (${elapsed}s processing)`, 'success');
    return JSON.stringify(result);
  }
}

export default VideoComposerAgent;
