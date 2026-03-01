/**
 * AI Creative Jobs Service
 * Save all AI generation tasks to database for tracking & analytics
 */

const API_BASE = '/api/ai-jobs';

export interface AIJob {
  id?: string;
  user_id?: string;
  job_type: 'text-to-image' | 'image-to-video' | 'bg-removal' | 'upscale' | 'enhance-prompt' | 'face-swap' | 'style-transfer';
  status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  original_prompt?: string;
  enhanced_prompt?: string;
  input_images?: Array<{ url: string; source?: string; description?: string }>;
  model?: string;
  provider?: string;
  settings?: Record<string, unknown>;
  output_url?: string;
  output_metadata?: Record<string, unknown>;
  external_task_id?: string;
  external_task_url?: string;
  cloudinary_id?: string;
  cloudinary_url?: string;
  drive_id?: string;
  drive_url?: string;
  cost_usd?: number;
  processing_time_ms?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  user_rating?: number;
  is_favorite?: boolean;
  notes?: string;
  tags?: string[];
}

export interface JobsListResponse {
  success: boolean;
  jobs: AIJob[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Create a new AI job
 */
export async function createJob(job: Omit<AIJob, 'id' | 'created_at'>): Promise<AIJob | null> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      console.error('[AI Jobs] Create failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.job : null;
  } catch (error) {
    console.error('[AI Jobs] Create error:', error);
    return null;
  }
}

/**
 * Update an existing job
 */
export async function updateJob(jobId: string, updates: Partial<AIJob>): Promise<AIJob | null> {
  try {
    const response = await fetch(`${API_BASE}/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error('[AI Jobs] Update failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.job : null;
  } catch (error) {
    console.error('[AI Jobs] Update error:', error);
    return null;
  }
}

/**
 * Get a specific job by ID
 */
export async function getJob(jobId: string): Promise<AIJob | null> {
  try {
    const response = await fetch(`${API_BASE}/${jobId}`);

    if (!response.ok) {
      console.error('[AI Jobs] Get failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.job : null;
  } catch (error) {
    console.error('[AI Jobs] Get error:', error);
    return null;
  }
}

/**
 * List jobs with filters
 */
export async function listJobs(params?: {
  job_type?: string;
  status?: string;
  model?: string;
  provider?: string;
  is_favorite?: boolean;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'ASC' | 'DESC';
}): Promise<JobsListResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE}?${searchParams.toString()}`);

    if (!response.ok) {
      console.error('[AI Jobs] List failed:', response.status);
      return { success: false, jobs: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
    }

    return await response.json();
  } catch (error) {
    console.error('[AI Jobs] List error:', error);
    return { success: false, jobs: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
  }
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${jobId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('[AI Jobs] Delete failed:', response.status);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('[AI Jobs] Delete error:', error);
    return false;
  }
}

/**
 * Get reproduction data for a job
 */
export async function getReproduceData(jobId: string): Promise<{
  jobType: string;
  prompt: string;
  originalPrompt?: string;
  inputImages: Array<{ url: string; source?: string }>;
  model: string;
  provider: string;
  settings: Record<string, unknown>;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/${jobId}/reproduce`);

    if (!response.ok) {
      console.error('[AI Jobs] Reproduce failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.reproduce : null;
  } catch (error) {
    console.error('[AI Jobs] Reproduce error:', error);
    return null;
  }
}

/**
 * Get analytics summary
 */
export async function getAnalytics(days = 30): Promise<{
  byTypeAndStatus: Array<{
    job_type: string;
    status: string;
    count: number;
    total_cost: number;
    avg_processing_time: number;
    avg_rating: number;
  }>;
  topModels: Array<{
    model: string;
    provider: string;
    usage_count: number;
    avg_rating: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    jobs_count: number;
    daily_cost: number;
  }>;
  period: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/analytics/summary?days=${days}`);

    if (!response.ok) {
      console.error('[AI Jobs] Analytics failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.success ? data.analytics : null;
  } catch (error) {
    console.error('[AI Jobs] Analytics error:', error);
    return null;
  }
}

/**
 * Rate a job
 */
export async function rateJob(jobId: string, rating: number): Promise<boolean> {
  if (rating < 1 || rating > 5) {
    console.error('[AI Jobs] Invalid rating, must be 1-5');
    return false;
  }

  const result = await updateJob(jobId, { user_rating: rating });
  return result !== null;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(jobId: string, isFavorite: boolean): Promise<boolean> {
  const result = await updateJob(jobId, { is_favorite: isFavorite });
  return result !== null;
}

// Cost estimation by model
export const MODEL_COSTS: Record<string, number> = {
  'runway': 0.50,
  'veo3_fast': 0.40,
  'veo3': 2.00,
  'veo3-fast': 0.40,
  'veo3-quality': 2.00,
  'dall-e-3': 0.08,
  'stable-diffusion': 0.01,
  'midjourney': 0.05,
};

/**
 * Estimate cost for a job
 */
export function estimateCost(model: string, _duration?: number): number {
  return MODEL_COSTS[model] || 0.50;
}
