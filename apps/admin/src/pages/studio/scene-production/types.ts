/**
 * 🎬 Scene Production Types
 * Shared types for Scene Production components
 * 
 * @author LongSang (Elon Mode 🚀)
 */



// =============================================================================
// CORE TYPES
// =============================================================================

export interface Scene {
  id: string;
  number: number;
  duration: number;
  description: string;
  dialogue?: string;
  visualPrompt: string;       // Prompt cho tạo ảnh
  videoPrompt?: string;       // Prompt riêng cho tạo video (nếu khác)
  cameraMovement: string;
  mood: string;
  referenceImageIds: string[];
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  status: SceneStatus;
  error?: string;
}

export type SceneStatus = 
  | 'pending' 
  | 'image_generating' 
  | 'image_ready' 
  | 'video_generating' 
  | 'video_ready' 
  | 'error';

// Video Provider (Google Direct vs Kie.ai)
export type VideoProvider = 'google' | 'kie';

export interface VideoProviderInfo {
  id: VideoProvider;
  name: string;
  description: string;
  configured: boolean;
  pricing: string;
}

// EpisodeScript: Internal structure for episode content
export interface EpisodeScript {
  hook: string;
  story: string;
  punchline: string;
  cta: string;
  visualNotes: string;
}

// EpisodeScriptItem: For selection dialogs with metadata
export interface EpisodeScriptItem {
  id: string;
  episodeTitle: string;
  seriesTitle: string;
  episodeNumber: number;
  content: string;
  status: 'draft' | 'approved' | 'in_production';
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeData {
  id: string;
  title: string;
  duration: number;
  script: EpisodeScript;
  seriesId?: string;
  seriesTitle?: string;
  number?: number;
}

export interface ReferenceImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  tags: string[];
  category?: string;
}

// =============================================================================
// API REQUEST TYPES
// =============================================================================

export interface ImageGenRequest {
  prompt: string;
  reference_images: string[];
  aspect_ratio: string;
  scene: Scene;
}

export interface VideoGenRequest {
  prompt: string;
  image_url: string;
  duration: number;
  aspect_ratio: string;
  scene: Scene;
}

// =============================================================================
// PRODUCTION TYPES
// =============================================================================

export interface ProductionItem {
  id: string;
  episode_title: string;
  status: string;
  total_scenes: number;
  completed_scenes: number;
  created_at: string;
}

// ProductionData: Full production with scenes
export interface ProductionData {
  id: string;
  seriesTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  scenes: Scene[];
  settings: Settings;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ProductionProgress {
  total: number;
  imagesReady: number;
  videosReady: number;
  totalDuration: number;
}

export type ProductionStep = 'input' | 'scenes' | 'production' | 'review';

// =============================================================================
// SETTINGS TYPES
// =============================================================================

export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// Settings: Main settings for Scene Production
export interface Settings {
  imageModel: 'imagen-3' | 'imagen-4' | 'gpt-image';
  videoModel: 'veo-3' | 'veo-3.1' | 'minimax';
  videoProvider: VideoProvider; // google or kie
  textModel: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gpt-4o' | 'claude-sonnet-4';
  autoEnhance: boolean;
  quality: 'draft' | 'standard' | 'high';
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
}

export const DEFAULT_SETTINGS: Settings = {
  imageModel: 'imagen-4',
  videoModel: 'veo-3.1',
  videoProvider: 'google',
  textModel: 'gemini-2.5-flash',
  autoEnhance: true,
  quality: 'standard',
  aspectRatio: '9:16',
};

export interface GlobalAIEnhanceSettings {
  enableImageEnhance: boolean;
  enableVideoEnhance: boolean;
  imageSystemPrompt: string;
  videoSystemPrompt: string;
}

// =============================================================================
// UI HELPER TYPES
// =============================================================================

export interface FullscreenImage {
  url: string;
  title: string;
}

export interface StatusBadgeInfo {
  variant: 'default' | 'secondary' | 'outline';
  label: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '⚡ Nhanh, miễn phí' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '🧠 Chất lượng cao' },
  { id: 'gpt-4o', name: 'GPT-4o', description: '🤖 Đa năng' },
] as const;

export const IMAGE_GEN_MODES = [
  { id: 'nano-banana', name: 'Nano Banana', description: '⚡ Nhanh (1024px, 3 refs)', model: 'gemini-2.5-flash-image', maxRefs: 3 },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', description: '🚀 4K, 14 refs', model: 'gemini-3-pro-image-preview', maxRefs: 14 },
  { id: 'imagen-3', name: 'Imagen 3', description: '🎨 Photorealistic', model: 'imagen-3.0-generate-002', maxRefs: 0 },
  { id: 'imagen-4', name: 'Imagen 4', description: '✨ Latest', model: 'imagen-4.0-generate-001', maxRefs: 0 },
] as const;

export const RESOLUTION_OPTIONS = [
  { id: '1K', name: '1K', description: '1024px' },
  { id: '2K', name: '2K', description: '2048px' },
  { id: '4K', name: '4K', description: '4096px' },
] as const;

export const CAMERA_MOVEMENTS = [
  'Static - Cố định',
  'Pan Left - Lia trái',
  'Pan Right - Lia phải', 
  'Tilt Up - Ngẩng lên',
  'Tilt Down - Cúi xuống',
  'Zoom In - Zoom vào',
  'Zoom Out - Zoom ra',
  'Dolly In - Tiến vào',
  'Dolly Out - Lùi ra',
  'Tracking - Theo chân',
  'Handheld - Cầm tay',
] as const;

export const ASPECT_RATIOS = [
  { id: '9:16', name: '9:16 (Reels/TikTok)', description: 'Dọc - Mobile first' },
  { id: '16:9', name: '16:9 (YouTube)', description: 'Ngang - Desktop' },
  { id: '1:1', name: '1:1 (Square)', description: 'Vuông - Instagram Feed' },
  { id: '4:5', name: '4:5 (Portrait)', description: 'Dọc nhẹ - Instagram' },
] as const;

export const MOODS = [
  'Vui vẻ - Upbeat',
  'Hài hước - Comedic',
  'Dramatic - Kịch tính',
  'Mysterious - Bí ẩn',
  'Relaxed - Thư giãn',
  'Energetic - Năng động',
  'Emotional - Xúc động',
  'Professional - Chuyên nghiệp',
] as const;

export const SCENE_PRODUCTION_KEY = 'scene-production-data';
export const SCENE_SETTINGS_KEY = 'scene-production-settings';

export const DEFAULT_IMAGE_SYSTEM_PROMPT = `Bạn là chuyên gia tối ưu prompt cho AI Image Generation (Gemini Imagen).

NHIỆM VỤ: Nâng cấp prompt để tạo ảnh chất lượng cao, cinematic, phù hợp với video ngắn viral.

NGUYÊN TẮC:
1. Giữ nguyên ý chính của prompt gốc
2. Thêm chi tiết về ánh sáng (lighting), góc chụp (angle), độ sâu trường ảnh (DOF)
3. Thêm style keywords: cinematic, 8K, ultra detailed, sharp focus
4. Mô tả biểu cảm, tư thế nhân vật rõ ràng
5. Tối đa 200 từ

OUTPUT: Chỉ trả về prompt đã nâng cấp, không giải thích.`;

export const DEFAULT_VIDEO_SYSTEM_PROMPT = `Bạn là chuyên gia tối ưu motion prompt cho AI Video Generation (Google VEO 3).

NHIỆM VỤ: Nâng cấp motion prompt để tạo video mượt mà, cinematic.

NGUYÊN TẮC:
1. Mô tả chuyển động camera rõ ràng (pan, tilt, dolly, zoom)
2. Mô tả motion của subject (slow, fast, smooth, dramatic)
3. Thêm atmospheric details (particle effects, lighting changes)
4. Giữ prompt ngắn gọn, tập trung vào motion
5. Tối đa 150 từ

OUTPUT: Chỉ trả về motion prompt đã nâng cấp, không giải thích.`;

export const DEFAULT_SCENE_PROMPT = `Bạn là chuyên gia sản xuất video ngắn (short-form content) với phong cách TikTok/Reels viral.

🎯 NHIỆM VỤ: Phân tích script và chia thành ĐÚNG 4-5 SCENES tối ưu (mỗi scene 6-10 giây).

⚡ NGUYÊN TẮC TỐI ƯU CHI PHÍ:
- LUÔN giới hạn 4-5 scenes (không nhiều hơn!)
- Gộp các ý nhỏ thành scene lớn hơn nếu cần
- Ưu tiên scene có nhiều chuyển động để tận dụng VEO 3.1
- Mỗi scene phải "đáng đồng tiền" - có hook hoặc visual impact mạnh

📝 YÊU CẦU MỖI SCENE:
1. Duration: 6-10 giây (linh hoạt, đủ để kể chuyện)
2. Visual Prompt (IMAGE): Mô tả SIÊU CHI TIẾT cho AI tạo ẢNH tĩnh
3. Video Prompt (VIDEO): Mô tả CHUYỂN ĐỘNG + DIALOGUE cho VEO 3.1 (VEO hỗ trợ audio!)
4. Camera Movement: Chọn 1 trong: Static/Pan/Tilt/Zoom/Dolly/Tracking
5. Mood: Cảm xúc chính của scene
6. Dialogue: Lời thoại/Voiceover (VEO 3.1 sẽ tạo giọng nói thật!)

🎬 LƯU Ý VỀ VIDEO PROMPT (QUAN TRỌNG - VEO 3.1 HỖ TRỢ AUDIO!):
- BAO GỒM DIALOGUE trong video prompt - VEO sẽ tạo giọng nói thật
- Format: [VOICE] "Lời thoại..." (giọng nam/nữ, tông giọng)
- Mô tả âm thanh môi trường: tiếng búa va chạm, nhạc nền...
- Tập trung vào CHUYỂN ĐỘNG: người, camera, vật thể
- Kết hợp camera movement với subject movement

📤 OUTPUT JSON:
{
  "scenes": [
    {
      "number": 1,
      "duration": 7,
      "description": "Mô tả 1 dòng",
      "dialogue": "Lời thoại của nhân vật...",
      "visualPrompt": "[SUBJECT] ... | [SETTING] ... | [POSE/EXPRESSION] ... | [STYLE] cinematic, 8K",
      "videoPrompt": "[CAMERA] Dolly in slowly | [ACTION] Man lifts pool cue confidently | [VOICE] Vietnamese man says: 'Bida không chỉ là trò chơi...' in deep confident tone | [SOUND] Pool balls clicking, ambient bar noise | [MOOD] Mysterious, dramatic",
      "cameraMovement": "Dolly In",
      "mood": "Mysterious"
    }
  ]
}`;
