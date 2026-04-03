// Pipeline Settings Types — Config for each step in the video pipeline

export type PipelineStepId = 'script' | 'visual' | 'tts' | 'video' | 'post';

export interface StepConfig {
  id: PipelineStepId;
  label: string;
  icon: string; // emoji
  enabled: boolean;
  model: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  /** Step-specific params (TTS rates, Ken Burns settings, etc.) */
  params: Record<string, string | number | boolean>;
}

export interface PipelineSettings {
  version: number;
  updatedAt: string;
  steps: StepConfig[];
}

// Available models per step type
export const STEP_MODELS: Record<PipelineStepId, { value: string; label: string }[]> = {
  script: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
  visual: [
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
    { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast' },
  ],
  tts: [
    { value: 'vi-VN-HoaiMyNeural', label: 'Edge TTS — Hoài My (VN)' },
    { value: 'vi-VN-NamMinhNeural', label: 'Edge TTS — Nam Minh (VN)' },
  ],
  video: [{ value: 'ffmpeg-kenburns', label: 'FFmpeg — Ken Burns + Text Overlay' }],
  post: [
    { value: 'telegram', label: 'Telegram Bot' },
    { value: 'youtube-shorts', label: 'YouTube Shorts (coming soon)' },
  ],
};
