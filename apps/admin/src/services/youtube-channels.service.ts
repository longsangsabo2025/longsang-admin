/**
 * 🎬 YouTube Channels Service
 * API client for 5-channel strategy + video factory
 */

const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

export interface ChannelPlan {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  score: number;
  maxScore: number;
  status: 'ready' | 'planned' | 'experimental';
  style: string;
  voice: string;
  avatar: string;
  color: string;
  bgGradient: string;
  categories: string[];
  schedule: string;
  targetLength: string;
  monetization: string[];
  knowledge: {
    books: number;
    transcripts: number;
    brainSections: number;
    voiceDNA: boolean;
  };
  resources: {
    agents: number;
    ttsEngines: string[];
    workflows: number;
  };
  playlists: { name: string; icon: string; episodes: number }[];
  sampleTopics: string[];
}

export interface GenerateRequest {
  channelId?: string;
  topic?: string;
  transcript?: string;
  scenes?: number;
  style?: string;
  duration?: number;
  scriptOnly?: boolean;
  storyboardOnly?: boolean;
}

export interface GenerationRun {
  id: string;
  channelId: string | null;
  channelName: string | null;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  input: GenerateRequest;
  logs: { t: number; level: string; msg: string }[];
  result?: {
    outputDir: string;
    files: Record<string, unknown>;
  };
  hasResult?: boolean;
  error?: string;
}

export interface TranscriptItem {
  id: string;
  title: string;
  viewCount?: number;
  category?: string;
  source: string;
}

export interface KnowledgeStats {
  books: number;
  transcripts: { total: number; thuattaivan: number; thehiddenself: number };
  voice: boolean;
  brain: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/youtube-channels${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export const youtubeChannelsService = {
  /** Get all 5 channel plans */
  async getPlans(): Promise<{ channels: ChannelPlan[]; total: number }> {
    return apiFetch('/plans');
  },

  /** Get single channel plan */
  async getPlan(id: string): Promise<ChannelPlan> {
    return apiFetch(`/plans/${id}`);
  },

  /** Start script + storyboard generation */
  async generate(req: GenerateRequest): Promise<{ success: boolean; runId: string; message: string }> {
    return apiFetch('/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /** Get generation run status */
  async getRunStatus(runId: string): Promise<GenerationRun> {
    return apiFetch(`/generate/${runId}`);
  },

  /** List recent runs */
  async getRuns(): Promise<{ runs: GenerationRun[]; total: number }> {
    return apiFetch('/runs');
  },

  /** Search transcripts */
  async searchTranscripts(query?: string, limit?: number): Promise<{ transcripts: TranscriptItem[]; total: number }> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (limit) params.set('limit', String(limit));
    return apiFetch(`/transcripts?${params}`);
  },

  /** Knowledge base stats */
  async getKnowledgeStats(): Promise<KnowledgeStats> {
    return apiFetch('/knowledge/stats');
  },

  /** List recent outputs */
  async getOutputs(): Promise<{ outputs: { id: string; createdAt: string; files: string[]; title: string; stats: Record<string, unknown> | null }[]; total: number }> {
    return apiFetch('/outputs');
  },
};
