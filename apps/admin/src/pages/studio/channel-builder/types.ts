/**
 * Types and constants for Channel Builder
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Channel {
  id: string;
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram';
  name: string;
  handle: string;
  avatarUrl?: string;
  followers: number;
  isConnected: boolean;
  lastSync?: Date;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  platform: string[];
  type: 'video' | 'image' | 'story' | 'reel' | 'short';
  status: 'idea' | 'scripted' | 'scheduled' | 'published';
  scheduledAt?: Date;
  aiGenerated: boolean;
  tags: string[];
}

export interface ScheduledPost {
  id: string;
  ideaId: string;
  platform: string;
  scheduledAt: Date;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  contentUrl?: string;
  postUrl?: string;
}

export interface ChannelStats {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  growth: number; // percentage
}

export interface ChannelAISettings {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PLATFORM_CONFIG = {
  youtube: {
    name: 'YouTube',
    emoji: '▶️',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    formats: ['Video', 'Short', 'Live'],
  },
  tiktok: {
    name: 'TikTok',
    emoji: '🎵',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    formats: ['Video', 'Story'],
  },
  facebook: {
    name: 'Facebook',
    emoji: '👥',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    formats: ['Post', 'Video', 'Reel', 'Story'],
  },
  instagram: {
    name: 'Instagram',
    emoji: '📸',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    formats: ['Post', 'Reel', 'Story'],
  },
} as const;

export const CONTENT_CATEGORIES = [
  { id: 'tutorial', name: 'Hướng dẫn', icon: '📚' },
  { id: 'entertainment', name: 'Giải trí', icon: '🎬' },
  { id: 'education', name: 'Kiến thức', icon: '🧠' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨' },
  { id: 'tech', name: 'Công nghệ', icon: '💻' },
  { id: 'motivation', name: 'Động lực', icon: '🔥' },
] as const;

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: '⭐ Tốt nhất, miễn phí' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', description: 'Mạnh hơn, phức tạp hơn' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Nhanh, tiết kiệm' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Thông minh nhất OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Sáng tạo, tự nhiên' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'anthropic', description: 'Nhanh, tiết kiệm' },
] as const;

export const DEFAULT_AI_SETTINGS = {
  model: 'gemini-2.5-flash',
  temperature: 0.8,
  maxTokens: 1000,
  systemPrompt: `Bạn là chuyên gia content creator và social media strategist.
Nhiệm vụ: Tạo ý tưởng nội dung sáng tạo, viral, phù hợp với persona và thương hiệu.

Khi tạo ý tưởng, hãy:
1. Phân tích xu hướng hiện tại trên các nền tảng
2. Kết hợp chủ đề hot với phong cách persona
3. Đề xuất format phù hợp (video ngắn, dài, story, reel)
4. Gợi ý hashtag và timing đăng bài
5. Tập trung vào engagement và virality

Output format: Trả về JSON array với các field: title, description, platform[], type, tags[]`,
} as const;

export const CHANNEL_SETTINGS_KEY = 'channel-builder-ai-settings';
