// ─── Pipeline types & defaults (extracted for Fast Refresh) ──

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
    scenes: number;
    duration: number;
    style: string;
    aspectRatio: string;
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
  };
  assembly: {
    enabled: boolean;
    format: string;
    transitions: string;
    bgMusic: boolean;
  };
}

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
    scenes: 12,
    duration: 6,
    style: 'dark-cinematic',
    aspectRatio: '16:9',
  },
  imageGen: {
    enabled: false,
    provider: 'hailuo-2.3',
    quality: 'standard',
    negativePrompt: 'text, watermark, logo',
  },
  voiceover: {
    enabled: false,
    engine: 'elevenlabs',
    voice: 'default-vi',
    speed: 1.0,
  },
  assembly: {
    enabled: false,
    format: 'mp4-1080p',
    transitions: 'crossfade',
    bgMusic: true,
  },
};
