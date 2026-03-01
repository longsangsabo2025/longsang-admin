/**
 * Shared types, constants, and helpers for SeriesPlannerContent
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Episode {
  id: string;
  number: number;
  title: string;
  synopsis: string;
  hook?: string;
  story?: string;
  punchline?: string;
  cta?: string;
  visualNotes?: string;
  duration: number; // seconds
  status: 'outline' | 'scripted' | 'in_production' | 'completed';
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesArc {
  phase: string;
  description: string;
  episodes: number[]; // episode numbers in this phase
}

export interface Series {
  id: string;
  title: string;
  description: string;
  theme: string;
  targetAudience: string;
  tone: string;
  location: string;
  mainCharacter: string;
  totalEpisodes: number;
  arcs: SeriesArc[];
  episodes: Episode[];
  status: 'planning' | 'in_production' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface SeriesSettings {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: '⭐ Tốt nhất, miễn phí' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', description: 'Mạnh hơn, phức tạp hơn' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Nhanh, tiết kiệm' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Thông minh nhất OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Sáng tạo, tự nhiên' },
];

export const DEFAULT_AI_SETTINGS = {
  model: 'gemini-2.5-flash',
  temperature: 0.8,
  maxTokens: 2000,
  systemPrompt: `Bạn là biên kịch chuyên nghiệp cho short-form video content (TikTok, YouTube Shorts, Reels).

Nhiệm vụ: Viết series kịch bản có mạch truyện xuyên suốt, hài hước, viral.

Phong cách:
- Hook mạnh mẽ trong 3 giây đầu
- Storytelling cuốn hút, có cao trào
- Punchline bất ngờ, hài hước
- CTA tự nhiên, không gượng ép
- Ngôn ngữ Gen Z, trending

Format mỗi episode:
- Duration: 30-60 giây
- Hook (3-5s): Câu mở đầu gây chú ý
- Story (20-40s): Nội dung chính
- Punchline: Điểm nhấn/twist
- CTA: Kêu gọi follow, like, comment

Đảm bảo các episode có sự liên kết, nhân vật phát triển qua từng tập.`,
};

export const SERIES_SETTINGS_KEY = 'series-planner-settings';

// =============================================================================
// HELPERS
// =============================================================================

// Load settings from localStorage (fast local cache, synced with Supabase)
export const loadSettings = (): Partial<SeriesSettings> => {
  try {
    const saved = localStorage.getItem(SERIES_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save settings to localStorage cache
export const saveSettingsLocal = (settings: Partial<SeriesSettings>) => {
  try {
    const current = loadSettings();
    localStorage.setItem(SERIES_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

// Save AI settings to Supabase
export const saveSettingsToSupabase = async (settings: Partial<SeriesSettings>) => {
  try {
    await fetch('/api/series/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    // Also save to localStorage for fast access
    saveSettingsLocal(settings);
  } catch (error) {
    console.error('Failed to save AI settings:', error);
  }
};

// Helper to safely render content that might be object or string
export const renderContentSafe = (content: unknown): string => {
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }
  return String(content);
};

// Simple render helper used in script dialog
export const renderContent = (content?: string): string => content || '';

// Helper to transform Supabase data to Series format
export const transformSupabaseToSeries = (data: any): Series => {
  return {
    id: data.id,
    title: data.title || data.name,
    description: data.description || '',
    theme: data.theme || '',
    targetAudience: data.metadata?.targetAudience || 'Gen Z',
    tone: data.tone || 'Hài hước',
    location: data.location || 'SABO Billiards',
    mainCharacter: data.character || 'Anh Long Magic',
    totalEpisodes: data.total_episodes || data.episodes?.length || 0,
    arcs: data.arcs || data.metadata?.arcs || [], // Load from JSONB column first
    episodes: (data.episodes || []).map((ep: any) => ({
      id: ep.id,
      number: ep.episode_number,
      title: ep.title,
      synopsis: ep.description || '',
      hook: ep.hook || '',
      story: ep.script_content || '',
      punchline: ep.punchline || '',
      cta: ep.cta || '',
      visualNotes: ep.visual_prompt || '',
      duration: ep.duration_seconds || 45,
      status: ep.status === 'scripted' ? 'scripted' : 'outline',
      createdAt: ep.created_at,
      updatedAt: ep.updated_at
    })),
    status: data.status || 'planning',
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};
