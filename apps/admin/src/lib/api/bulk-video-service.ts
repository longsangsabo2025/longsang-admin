/**
 * Bulk Video Production API Service
 * Connects frontend to Node.js bridge service on port 3012
 */

// Types
export interface VideoTemplate {
  id: string;
  name: string;
  description: string | null;
  duration_seconds: number;
  aspect_ratio: '16:9' | '9:16' | '1:1';
  background_music_url: string | null;
  intro_template: string | null;
  outro_template: string | null;
  watermark_url: string | null;
  style_config: Record<string, unknown>;
  is_active: boolean;
}

export interface ProductionJob {
  id: string;
  title: string;
  topic: string;
  status: 'pending' | 'generating_script' | 'generating_voice' | 'composing_video' | 'uploading' | 'completed' | 'failed';
  progress: number;
  script?: string;
  voice_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoRequest {
  topic: string;
  template_id?: string;
  voice_id?: string;
  duration?: number;
  keywords?: string[];
  language?: string;
  style?: string;
}

export interface BatchCreateRequest {
  topics: string[];
  template_id?: string;
  voice_id?: string;
  duration?: number;
  language?: string;
  style?: string;
}

export interface ScriptGenerateRequest {
  topic: string;
  duration?: number;
  style?: string;
  language?: string;
}

export interface StockSearchRequest {
  query: string;
  per_page?: number;
  page?: number;
}

export interface StockVideo {
  id: number;
  url: string;
  image: string;
  duration: number;
  user: {
    name: string;
    url: string;
  };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_BULK_VIDEO_API_URL || 'http://localhost:3012';

class BulkVideoApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
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
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || 'API request failed');
    }

    return response.json();
  }

  // ===============================
  // VIDEO PRODUCTION
  // ===============================

  /**
   * Create a single video production job
   */
  async createVideo(data: CreateVideoRequest): Promise<{ job_id: string; message: string }> {
    return this.request('/api/produce', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create multiple video production jobs in batch
   */
  async createBatch(data: BatchCreateRequest): Promise<{ job_ids: string[]; message: string }> {
    return this.request('/api/produce/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all production jobs
   */
  async getJobs(status?: string): Promise<ProductionJob[]> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/jobs${params}`);
  }

  /**
   * Get a specific job by ID
   */
  async getJob(jobId: string): Promise<ProductionJob> {
    return this.request(`/api/job/${jobId}`);
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/job/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<{ job_id: string; message: string }> {
    return this.request(`/api/job/${jobId}/retry`, {
      method: 'POST',
    });
  }

  // ===============================
  // SCRIPT GENERATION
  // ===============================

  /**
   * Generate a video script using AI
   */
  async generateScript(data: ScriptGenerateRequest): Promise<{ script: string; duration_estimate: number }> {
    return this.request('/api/script/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===============================
  // STOCK VIDEOS
  // ===============================

  /**
   * Search for stock videos from Pexels
   */
  async searchStockVideos(data: StockSearchRequest): Promise<{ videos: StockVideo[]; total: number }> {
    return this.request('/api/stock/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===============================
  // VOICES
  // ===============================

  /**
   * Get available TTS voices
   */
  async getVoices(): Promise<Voice[]> {
    return this.request('/api/voices');
  }

  // ===============================
  // TEMPLATES
  // ===============================

  /**
   * Get all video templates
   */
  async getTemplates(): Promise<VideoTemplate[]> {
    return this.request('/api/templates');
  }

  /**
   * Create a new template
   */
  async createTemplate(data: Partial<VideoTemplate>): Promise<VideoTemplate> {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===============================
  // HEALTH CHECK
  // ===============================

  /**
   * Check API health status
   */
  async healthCheck(): Promise<{ status: string; services: { node: string; python: string } }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const bulkVideoApi = new BulkVideoApiService();

// Export class for custom instances
export { BulkVideoApiService };
