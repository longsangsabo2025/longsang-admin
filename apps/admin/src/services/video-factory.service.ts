/**
 * Video Factory Service Layer
 * Connects Admin Dashboard to Video Factory API (port 8210)
 */

const VIDEO_FACTORY_API = import.meta.env.VITE_VIDEO_FACTORY_API || 'http://localhost:8210';

// ─── Types ────────────────────────────────────────────────────────────────────

// Higgsfield.ai Unlimited Models (365 subscription)
export type VideoModel = 
  // VIDEO Models (Unlimited)
  | 'minimax-hailuo' | 'higgsfield-soul' | 'higgsfield-popcorn' | 'reve'
  // IMAGE Models (can use for image-to-video, Unlimited)
  | 'seedream-v5' | 'flux2-pro' | 'nano-banana-pro' | 'gpt-image' | 'z-image'
  | 'seedream-4.5' | 'kling-o1-image' | 'flux-kontext' | 'nano-banana'
  | 'seedream-4.0' | 'higgsfield-faceswap'
  // Legacy (may not be unlimited)
  | 'sora2' | 'kling3' | 'kling25-turbo' | 'veo31' | 'wan25-fast';

export type JobStatus = 'pending' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface VideoJob {
  id: string;
  channel_id?: string;
  strategy_id?: string;
  prompt: string;
  negative_prompt?: string;
  model: string;
  resolution: string;
  duration: number;
  aspect_ratio: string;
  status: JobStatus;
  priority: number;
  output_url?: string;
  output_path?: string;
  thumbnail_url?: string;
  error_message?: string;
  retry_count: number;
  generation_time_seconds?: number;
  credits_used?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  scheduled_at?: string;
}

export interface Channel {
  id: string;
  name: string;
  platform: string;
  niche: string;
  language: string;
  videos_per_day: number;
  preferred_model: string;
  is_active: boolean;
  created_at: string;
}

export interface ContentStrategy {
  id: string;
  channel_id: string;
  name: string;
  content_type: string;
  prompt_template: string;
  style_preset?: string;
  priority: number;
  frequency: string;
  is_active: boolean;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed_today: number;
  failed_today: number;
  total_in_queue: number;
}

export interface CreateVideoRequest {
  channel_id?: string;
  strategy_id?: string;
  prompt: string;
  negative_prompt?: string;
  model?: VideoModel;
  resolution?: '480p' | '720p' | '1080p' | '4k';
  duration?: number;
  aspect_ratio?: string;
  reference_image_url?: string;
  priority?: number;
  scheduled_at?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateChannelRequest {
  name: string;
  platform: string;
  niche: string;
  language?: string;
  videos_per_day?: number;
  preferred_model?: VideoModel;
}

// ─── Composition Types ────────────────────────────────────────────────────────

export type CompositionStatus = 'draft' | 'ready' | 'composing' | 'completed' | 'failed';
export type ClipReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_regen';

export interface Composition {
  id: string;
  name: string;
  description?: string;
  channel_id?: string;
  aspect_ratio: string;
  transition_type: string;
  transition_duration: number;
  background_music_url?: string;
  music_volume: number;
  output_url?: string;
  output_path?: string;
  status: CompositionStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
  clips?: CompositionClip[];
}

export interface CompositionClip {
  id: string;
  composition_id: string;
  video_queue_id?: string;
  name: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  sequence_order: number;
  trim_start: number;
  trim_end?: number;
  review_status: ClipReviewStatus;
  review_notes?: string;
  reviewed_at?: string;
  is_downloaded: boolean;
}

export interface PendingClip {
  id: string;
  title: string;
  prompt: string;
  video_url: string;
  thumbnail_url?: string;
  model: string;
  completed_at: string;
}

export interface Capacity {
  video: { current: number; limit: number; available: number };
  image: { current: number; limit: number; available: number };
  at_capacity: boolean;
}

// ─── Model Intelligence Types ─────────────────────────────────────────────────

export interface ModelPerfData {
  model: string;
  total_jobs: number;
  completed: number;
  failed: number;
  success_rate: number;
  avg_gen_time: number;
  min_gen_time: number;
  max_gen_time: number;
  p95_gen_time: number;
  consecutive_failures: number;
  daily_trend: Array<{ date: string; completed: number; failed: number }>;
  top_errors: Array<{ error: string; count: number }>;
}

export interface ModelAlert {
  model: string;
  type: 'low_success_rate' | 'slow_generation' | 'consecutive_failures' | 'degradation';
  severity: 'critical' | 'warning';
  value?: number;
  message: string;
  recommendation?: string | null;
}

export interface ModelPerformanceResponse {
  models: ModelPerfData[];
  alerts: ModelAlert[];
  period_days: number;
  generated_at: string;
}

export interface ABTestRequest {
  prompt: string;
  models: string[];
  resolution?: string;
  duration?: number;
  aspect_ratio?: string;
  negative_prompt?: string;
}

export interface ABTestResponse {
  test_id: string;
  prompt: string;
  models: string[];
  jobs: Array<{ id: string; model: string }>;
  count: number;
}

export interface ABTestResultResponse {
  test_id: string;
  prompt: string;
  status: 'in_progress' | 'completed';
  jobs: VideoJob[];
  completed_count: number;
  total_count: number;
  winner: { model: string; generation_time: number | null; output_url: string | null } | null;
}

export interface ModelAlertsResponse {
  alerts: ModelAlert[];
  checked_models: string[];
  checked_at: string;
}

// ─── AI Skills Types ─────────────────────────────────────────────────────────

export interface ViralScript {
  title: string;
  hook_text: string;
  hook_visual: string;
  scenes: Array<{
    timestamp: string;
    narration: string;
    visual_prompt: string;
    recommended_model: string;
  }>;
  cta: string;
  caption: string;
  estimated_duration: string;
  viral_score: number;
  viral_reason: string;
}

export interface ViralScriptsResponse {
  series_name: string;
  strategy_summary: string;
  scripts: ViralScript[];
  posting_tips: string[];
}

export interface CalendarPost {
  time_utc: string;
  title: string;
  content_type: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  platform: string;
  caption: string;
  priority: number;
  is_pillar: boolean;
  notes?: string;
}

export interface CalendarDay {
  day: number;
  date_label: string;
  posts: CalendarPost[];
}

export interface ContentCalendarResponse {
  calendar_name: string;
  period: string;
  total_pieces: number;
  content_mix: Record<string, string>;
  days: CalendarDay[];
  tips: string[];
}

export interface RepurposeVariation {
  platform: string;
  title: string;
  prompt: string;
  aspect_ratio: string;
  media_type: string;
  duration: string | null;
  model: string;
  caption: string;
  hashtags: string[];
  adaptation_notes: string;
}

export interface RepurposeResponse {
  original_concept: string;
  variations: RepurposeVariation[];
  total_reach_multiplier: string;
  tip: string;
}

export interface TrendIdea {
  title: string;
  prompt: string;
  model: string;
  hook: string;
  estimated_views: string;
}

export interface Trend {
  trend_name: string;
  category: string;
  virality_score: number;
  description: string;
  why_trending: string;
  content_ideas: TrendIdea[];
  best_platforms: string[];
  timing: string;
  difficulty: string;
}

export interface TrendScoutResponse {
  niche: string;
  analysis_date: string;
  trend_score: number;
  trends: Trend[];
  recommended_priority: string[];
  avoid: string[];
}

export interface VideoScriptScene {
  scene_number: number;
  timestamp: string;
  narration: string;
  visual_description: string;
  ai_prompt: string;
  model: string;
  text_overlay?: string;
  transition: string;
}

export interface VideoScriptResponse {
  title: string;
  total_duration: string;
  style: string;
  voiceover_full_text: string;
  scenes: VideoScriptScene[];
  music_suggestion: string;
  thumbnail_prompt: string;
  seo: { title: string; description: string; tags: string[] };
}

export interface SEOMetadataResponse {
  titles: Array<{ text: string; style: string }>;
  descriptions: Record<string, string>;
  hashtags: {
    primary: string[];
    secondary: string[];
    trending: string[];
    per_platform: Record<string, string[]>;
  };
  hooks: string[];
  cta_options: string[];
  seo_score: number;
  tips: string[];
}

// ─── API Client ───────────────────────────────────────────────────────────────

class VideoFactoryService {
  private baseUrl: string;

  constructor(baseUrl: string = VIDEO_FACTORY_API) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ─── Health ─────────────────────────────────────────────────────────────────

  async checkHealth(): Promise<{ status: string; service: string; version: string }> {
    return this.request('/health');
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  async getStats(): Promise<QueueStats> {
    return this.request('/stats');
  }

  // ─── Queue Management ───────────────────────────────────────────────────────

  async addToQueue(request: CreateVideoRequest): Promise<VideoJob> {
    return this.request('/queue/add', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async batchAddToQueue(videos: CreateVideoRequest[], channelId?: string): Promise<VideoJob[]> {
    return this.request('/queue/batch', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, videos }),
    });
  }

  async getJobStatus(jobId: string): Promise<VideoJob> {
    return this.request(`/queue/status/${jobId}`);
  }

  async listQueue(params?: {
    status?: JobStatus;
    channel_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: VideoJob[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.channel_id) searchParams.set('channel_id', params.channel_id);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    return this.request(`/queue/list${query ? `?${query}` : ''}`);
  }

  async cancelJob(jobId: string): Promise<{ message: string; id: string }> {
    return this.request(`/queue/${jobId}`, { method: 'DELETE' });
  }

  async retryJob(jobId: string): Promise<{ message: string; id: string }> {
    return this.request(`/queue/${jobId}/retry`, { method: 'POST' });
  }

  // ─── Channel Management ─────────────────────────────────────────────────────

  async listChannels(): Promise<{ channels: Channel[] }> {
    return this.request('/channels');
  }

  async createChannel(request: CreateChannelRequest): Promise<{ id: string; message: string }> {
    return this.request('/channels', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getChannel(channelId: string): Promise<Channel> {
    return this.request(`/channels/${channelId}`);
  }

  async getChannelQueue(channelId: string): Promise<{ queue: VideoJob[] }> {
    return this.request(`/channels/${channelId}/queue`);
  }

  // ─── Content Strategy ───────────────────────────────────────────────────────

  async listStrategies(channelId?: string): Promise<{ strategies: ContentStrategy[] }> {
    const query = channelId ? `?channel_id=${channelId}` : '';
    return this.request(`/strategies${query}`);
  }

  async createStrategy(request: {
    channel_id: string;
    name: string;
    content_type: string;
    prompt_template: string;
    style_preset?: string;
    priority?: number;
    frequency?: string;
  }): Promise<{ id: string; message: string }> {
    return this.request('/strategies', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateFromStrategy(
    strategyId: string,
    count: number = 1,
    variables: Record<string, string> = {}
  ): Promise<{ generated: number; jobs: VideoJob[] }> {
    return this.request(`/strategies/${strategyId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ count, ...variables }),
    });
  }

  // ─── AI Prompt Generation (Gemini 2.0 Flash) ─────────────────────────────

  async getAIStatus(): Promise<{ available: boolean; model: string | null; features: string[] }> {
    return this.request('/ai/status');
  }

  async generateAIPrompt(request: {
    topic: string;
    media_type?: 'image' | 'video' | 'auto';
    model?: string;
    style?: string;
    niche?: string;
  }): Promise<{ prompt: string; style: string; tags: string[]; tip: string; media_type: string }> {
    return this.request('/ai/generate-prompt', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateAIBatch(request: {
    topic: string;
    count?: number;
    media_type?: 'image' | 'video' | 'mixed';
    niche?: string;
    style?: string;
    auto_queue?: boolean;
    channel_id?: string;
  }): Promise<{
    prompts: Array<{ prompt: string; style: string; hook: string; recommended_model: string; recommended_aspect: string }>;
    count: number;
    queued: number;
    queued_ids: string[];
  }> {
    return this.request('/ai/generate-batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async enhanceStrategy(
    strategyId: string,
    count: number = 3
  ): Promise<{
    strategy_id: string;
    strategy_name: string;
    prompts: Array<{ prompt: string; variation_name: string; style: string }>;
    count: number;
  }> {
    return this.request(`/ai/enhance-strategy/${strategyId}?count=${count}`, {
      method: 'POST',
    });
  }

  async analyzeVideo(params: {
    url: string;
    count?: number;
    context?: string;
    auto_queue?: boolean;
    channel_id?: string;
  }): Promise<{
    analysis: {
      description: string;
      style: string;
      mood: string;
      camera_work: string;
      viral_factor: string;
      content_type: string;
    };
    prompts: Array<{
      prompt: string;
      variation: string;
      recommended_model: string;
      recommended_aspect: string;
      media_type: string;
    }>;
    tags: string[];
    tip: string;
    source_url: string;
    media_type_detected: string;
    queued_jobs?: string[];
    queued_count?: number;
  }> {
    return this.request('/ai/analyze-video', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ─── Capacity ───────────────────────────────────────────────────────────────

  async getCapacity(): Promise<Capacity> {
    return this.request('/capacity');
  }

  // ─── Compositions ───────────────────────────────────────────────────────────

  async listCompositions(params?: {
    status?: CompositionStatus;
    channel_id?: string;
  }): Promise<Composition[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.channel_id) searchParams.set('channel_id', params.channel_id);
    
    const query = searchParams.toString();
    return this.request(`/compositions${query ? `?${query}` : ''}`);
  }

  async createComposition(request: {
    name: string;
    description?: string;
    channel_id?: string;
    aspect_ratio?: string;
    transition_type?: string;
    transition_duration?: number;
  }): Promise<{ id: string; message: string }> {
    return this.request('/compositions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getComposition(compId: string): Promise<Composition> {
    return this.request(`/compositions/${compId}`);
  }

  async addClipToComposition(
    compId: string,
    request: { video_queue_id?: string; video_url?: string; name?: string }
  ): Promise<{ id: string; message: string }> {
    const params = new URLSearchParams();
    if (request.video_queue_id) params.set('video_queue_id', request.video_queue_id);
    if (request.video_url) params.set('video_url', request.video_url);
    if (request.name) params.set('name', request.name);
    
    return this.request(`/compositions/${compId}/clips?${params.toString()}`, {
      method: 'POST',
    });
  }

  async reviewClip(
    compId: string,
    clipId: string,
    review: { review_status: ClipReviewStatus; review_notes?: string }
  ): Promise<{ message: string }> {
    return this.request(`/compositions/${compId}/clips/${clipId}/review`, {
      method: 'PUT',
      body: JSON.stringify(review),
    });
  }

  async reorderClip(
    compId: string,
    clipId: string,
    newOrder: number
  ): Promise<{ message: string }> {
    return this.request(`/compositions/${compId}/clips/${clipId}/reorder?new_order=${newOrder}`, {
      method: 'PUT',
    });
  }

  async removeClip(compId: string, clipId: string): Promise<{ message: string }> {
    return this.request(`/compositions/${compId}/clips/${clipId}`, {
      method: 'DELETE',
    });
  }

  async getPendingClips(): Promise<PendingClip[]> {
    return this.request('/clips/review-pending');
  }

  async startComposition(
    compId: string,
    request?: { output_filename?: string; background_music_url?: string; music_volume?: number }
  ): Promise<{ message: string; composition_id: string }> {
    return this.request(`/compositions/${compId}/compose`, {
      method: 'POST',
      body: JSON.stringify(request || {}),
    });
  }

  // ─── Model Intelligence ───────────────────────────────────────────────────

  async getModelPerformance(days: number = 30): Promise<ModelPerformanceResponse> {
    return this.request(`/models/performance?days=${days}`);
  }

  async createABTest(request: ABTestRequest): Promise<ABTestResponse> {
    return this.request('/models/ab-test', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getABTestResults(testId: string): Promise<ABTestResultResponse> {
    return this.request(`/models/ab-test/${testId}`);
  }

  async switchChannelModel(channelId: string, model: string): Promise<{ message: string; channel_id: string; old_model: string; new_model: string }> {
    return this.request(`/channels/${channelId}/model`, {
      method: 'PUT',
      body: JSON.stringify({ model }),
    });
  }

  async getModelAlerts(): Promise<ModelAlertsResponse> {
    return this.request('/models/alerts');
  }

  // ─── AI Skills ────────────────────────────────────────────────────────────

  async generateViralScripts(request: {
    niche: string;
    platform?: string;
    topic?: string;
    count?: number;
    style?: string;
  }): Promise<ViralScriptsResponse> {
    return this.request('/ai/viral-scripts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateContentCalendar(request: {
    niche: string;
    platforms?: string[];
    days?: number;
    posts_per_day?: number;
  }): Promise<ContentCalendarResponse> {
    return this.request('/ai/content-calendar', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async repurposeContent(request: {
    prompt: string;
    source_platform?: string;
    target_platforms?: string[];
    niche?: string;
  }): Promise<RepurposeResponse> {
    return this.request('/ai/repurpose', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async scoutTrends(request: {
    niche: string;
    platform?: string;
    count?: number;
  }): Promise<TrendScoutResponse> {
    return this.request('/ai/trend-scout', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateVideoScript(request: {
    topic: string;
    duration?: string;
    style?: string;
    niche?: string;
    platform?: string;
  }): Promise<VideoScriptResponse> {
    return this.request('/ai/video-script', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateSEOMetadata(request: {
    content_description: string;
    niche: string;
    platforms?: string[];
    existing_prompt?: string;
  }): Promise<SEOMetadataResponse> {
    return this.request('/ai/seo-metadata', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Singleton instance
export const videoFactoryService = new VideoFactoryService();

// Export class for testing
export { VideoFactoryService };
