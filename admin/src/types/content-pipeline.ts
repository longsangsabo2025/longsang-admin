// Content Pipeline — Types & Constants

export type ContentStage = 'idea' | 'script' | 'visual' | 'production' | 'review' | 'published';
export type ContentChannel = 'lyblack' | 'dungdaydi' | 'ainewbie' | 'vtdreamhomes' | 'longsang';
export type ContentType =
  | 'youtube-long'
  | 'youtube-short'
  | 'tiktok'
  | 'blog'
  | 'newsletter'
  | 'social'
  | 'podcast';
export type ContentPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  stage: ContentStage;
  channel: ContentChannel;
  content_type: ContentType;
  priority: ContentPriority;
  tags: string[];
  assigned_agent: string;
  due_date: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  checklist: ChecklistItem[];
  ai_suggestions: string[];
  thumbnail_url: string | null;
  metrics: ContentMetrics | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContentMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  revenue?: number;
  platforms_posted?: string[];
  post_results?: Record<
    string,
    { success: boolean; postId?: string; url?: string; error?: string }
  >;
  posted_at?: string;
}

export interface ContentStats {
  total: number;
  byStage: Record<ContentStage, number>;
  byChannel: Record<string, number>;
  byPriority: Record<ContentPriority, number>;
  publishedThisWeek: number;
  overdueCount: number;
}

export const STAGES: { key: ContentStage; label: string; icon: string; color: string }[] = [
  {
    key: 'idea',
    label: 'Ý tưởng',
    icon: '💡',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  },
  {
    key: 'script',
    label: 'Kịch bản',
    icon: '✍️',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  },
  {
    key: 'visual',
    label: 'Thiết kế',
    icon: '🎨',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  },
  {
    key: 'production',
    label: 'Sản xuất',
    icon: '🎬',
    color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30',
  },
  {
    key: 'review',
    label: 'Duyệt',
    icon: '✅',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  },
  {
    key: 'published',
    label: 'Đã đăng',
    icon: '📤',
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  },
];

export const CHANNELS: { key: ContentChannel; label: string; icon: string; color: string }[] = [
  { key: 'lyblack', label: 'Lý Blạck', icon: '🏴', color: 'bg-purple-500/20 text-purple-300' },
  { key: 'dungdaydi', label: 'Đứng Dậy Đi', icon: '🎙️', color: 'bg-orange-500/20 text-orange-300' },
  { key: 'ainewbie', label: 'AI Newbie', icon: '🤖', color: 'bg-blue-500/20 text-blue-300' },
  {
    key: 'vtdreamhomes',
    label: 'VT Dream Homes',
    icon: '🏠',
    color: 'bg-green-500/20 text-green-300',
  },
  { key: 'longsang', label: 'LongSang', icon: '⚡', color: 'bg-cyan-500/20 text-cyan-300' },
];

export const CONTENT_TYPES: { key: ContentType; label: string; icon: string }[] = [
  { key: 'youtube-long', label: 'YouTube Long', icon: '📺' },
  { key: 'youtube-short', label: 'YouTube Short', icon: '⚡' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'blog', label: 'Blog', icon: '📝' },
  { key: 'newsletter', label: 'Newsletter', icon: '📬' },
  { key: 'social', label: 'Social Post', icon: '📱' },
  { key: 'podcast', label: 'Podcast', icon: '🎙️' },
];

export const PRIORITY_CONFIG: Record<
  ContentPriority,
  { label: string; color: string; icon: string }
> = {
  urgent: { label: 'Khẩn cấp', color: 'bg-red-500/20 text-red-300 border-red-500/40', icon: '🔴' },
  high: {
    label: 'Cao',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    icon: '🟠',
  },
  medium: {
    label: 'Trung bình',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    icon: '🟡',
  },
  low: { label: 'Thấp', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: '⚪' },
};
