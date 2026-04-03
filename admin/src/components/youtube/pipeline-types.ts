// ─── Pipeline types & defaults (extracted for Fast Refresh) ──

/**
 * Channel visual style — a single free-text prompt that defines the visual identity.
 * Injected into storyboard system prompt so ALL scene prompts inherit the style.
 * No duplicate wrapping at image-gen step.
 */
export interface VisualIdentity {
  /** Free-text style description for the channel (1-3 sentences) */
  stylePrompt: string;
  /** Optional: what to avoid in images */
  negativePrompt: string;
}

export interface PipelineConfig {
  scriptWriter: {
    enabled: boolean;
    model: string;
    tone: string;
    wordTarget: number;
    customPrompt: string;
  };
  storyboard: {
    enabled: boolean;
    model: string;
    scenes: number;
    duration: number;
    style: string;
    aspectRatio: string;
    visualIdentity: VisualIdentity;
    customPrompt: string;
  };
  imageGen: {
    enabled: boolean;
    provider: string;
    quality: string;
    negativePrompt: string;
  };
  voiceover: {
    enabled: boolean;
    engine: string;
    voice: string;
    speed: number;
    cleanedScript?: string;
  };
  assembly: {
    enabled: boolean;
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
  };
}

export const DEFAULT_VISUAL_IDENTITY: VisualIdentity = {
  stylePrompt:
    'Dark cinematic style. Deep blacks, dark blues, golden highlights. Low-key dramatic lighting with single spotlight. Slow zoom in, close-up focus. Silhouette figures in dark urban, moody interiors. Cinematic, dramatic, mysterious, powerful mood.',
  negativePrompt: 'text, watermark, logo, cartoon, anime, bright colors, cheerful',
};

export const DEFAULT_PIPELINE: PipelineConfig = {
  scriptWriter: {
    enabled: true,
    model: 'gemini-2.5-flash',
    tone: 'dark-philosophical',
    wordTarget: 2500,
    customPrompt: '',
  },
  storyboard: {
    enabled: true,
    model: 'gpt-4o-mini',
    scenes: 12,
    duration: 6,
    style: 'dark-cinematic',
    aspectRatio: '16:9',
    visualIdentity: DEFAULT_VISUAL_IDENTITY,
    customPrompt: '',
  },
  imageGen: {
    enabled: false,
    provider: 'gemini',
    quality: 'standard',
    negativePrompt: 'text, watermark, logo',
  },
  voiceover: {
    enabled: false,
    engine: 'gemini-tts',
    voice: 'Kore',
    speed: 1.0,
    cleanedScript: '',
  },
  assembly: {
    enabled: false,
    format: 'mp4-1080p',
    transitions: 'crossfade',
    bgMusic: true,
    textOverlay: true,
    panZoom: 'random',
    fps: 24,
    fadeInOut: true,
    transitionDuration: 0.5,
    scenePadding: 0.5,
    watermarkUrl: '',
  },
};
