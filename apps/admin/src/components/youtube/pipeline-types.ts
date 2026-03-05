// ─── Pipeline types & defaults (extracted for Fast Refresh) ──

export interface VisualIdentity {
  style: string;             // e.g. 'dark-cinematic'
  colorPalette: string;      // dominant colors for consistent look
  lighting: string;          // e.g. 'low-key dramatic', 'soft natural'
  cameraStyle: string;       // e.g. 'close-up focus', 'wide establishing'
  characterPresence: 'none' | 'silhouette' | 'faceless' | 'consistent-character';
  characterDesc: string;     // e.g. 'Vietnamese man, 30s, dark hoodie'
  environment: string;       // recurring setting/backdrop
  moodKeywords: string;      // comma-separated mood tags
  negativePrompt: string;    // what to avoid
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
  };
}

export const DEFAULT_VISUAL_IDENTITY: VisualIdentity = {
  style: 'dark-cinematic',
  colorPalette: 'deep blacks, dark blues, golden highlights',
  lighting: 'low-key dramatic, single spotlight',
  cameraStyle: 'slow zoom in, close-up focus',
  characterPresence: 'silhouette',
  characterDesc: '',
  environment: 'dark urban, moody interiors',
  moodKeywords: 'cinematic, dramatic, mysterious, powerful',
  negativePrompt: 'text, watermark, logo, cartoon, anime, bright colors, cheerful',
};

export const DEFAULT_PIPELINE: PipelineConfig = {
  scriptWriter: {
    enabled: true,
    model: 'gemini-2.0-flash',
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
  },
};
