export const IMGBB_API_KEY = '2c3d34ab82d9b3b679cc9303087a7769';
export const KIE_API_KEY = 'eb957901436a99006ef620bd3a532c82';
export const STORAGE_KEY = 'video-generator-history';
export const SETTINGS_KEY = 'video-generator-settings';

// AI Models for prompt enhancement
export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: '⭐ Tốt nhất, miễn phí' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Nhanh, 1M context' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Nhanh, tiết kiệm' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Chất lượng cao' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Sáng tạo, tự nhiên' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Nhanh, hiệu quả' },
];

// Default AI settings
export const DEFAULT_AI_SETTINGS = {
  model: 'gemini-2.5-flash',
  temperature: 0.8,
  maxTokens: 800,
  systemPrompt: `You are an expert Veo 3 video prompt engineer. Create detailed, cinematic video descriptions.

Output a comprehensive prompt with:
- [SCENE DESCRIPTION]: Detailed scene, lighting, atmosphere, camera angles
- [CHARACTER/SUBJECT]: Appearance, clothing, actions, expressions
- [CAMERA MOVEMENT]: Specific camera work (pan, zoom, orbit, dolly)
- [TECHNICAL SPECS]: Resolution, frame rate, duration, style

Be descriptive and specific. Output ONLY the prompt, no explanations.`,
};

// Video Generation Models
export const VIDEO_MODELS = [
  {
    id: 'runway',
    name: '🎬 Runway Gen-3 Alpha',
    description: 'Video chất lượng cao, chuyển động mượt',
    apiPath: 'runway/generate',
    features: ['Image-to-Video', 'Text-to-Video', 'Video Extension'],
    durations: [5, 10],
    qualities: ['720p', '1080p'],
  },
  {
    id: 'veo3',
    name: '🌟 Google Veo 3.1',
    description: 'Mới nhất từ Google, độ phân giải cao',
    apiPath: 'veo/generate',
    features: ['Image-to-Video', 'Text-to-Video', 'HD 1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    models: ['veo3', 'veo3_fast'],
  },
];

// Motion Style Presets
export const MOTION_PRESETS = [
  { id: 'none', name: 'Mặc định', suffix: '' },
  { id: 'smooth', name: '🌊 Smooth Pan', suffix: ', smooth camera pan, gentle movement, cinematic' },
  { id: 'dynamic', name: '⚡ Dynamic', suffix: ', dynamic camera movement, energetic, action shot' },
  { id: 'zoom', name: '🔍 Zoom In', suffix: ', slow zoom in, focus reveal, dramatic' },
  { id: 'orbit', name: '🔄 Orbit', suffix: ', camera orbit around subject, 360 view, showcase' },
  { id: 'parallax', name: '📐 Parallax', suffix: ', parallax effect, depth layers, 3D feel' },
  { id: 'static', name: '🎯 Static', suffix: ', static camera, minimal movement, focus on subject' },
  { id: 'dolly', name: '🚂 Dolly', suffix: ', dolly camera movement, forward motion, immersive' },
];
