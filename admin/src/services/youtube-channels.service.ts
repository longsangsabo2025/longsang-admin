/**
 * 🎬 YouTube Channels Service
 * Channel CRUD + data queries. Pipeline logic is in @/services/pipeline/
 */
import { apiFetch } from './pipeline/api-client';
import { generate, generateStep, resumeRun } from './pipeline/orchestrator';
import {
  deleteRun,
  getAllRuns,
  getRun,
  hydrateAllRuns,
  hydrateRunsForChannel,
} from './pipeline/run-tracker';
import type { GenerationRun } from './pipeline/types';

let runsHydratedOnce = false;

// Re-export pipeline types so existing imports still work
export type { GenerateRequest, GenerationRun } from './pipeline/types';

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

export const youtubeChannelsService = {
  // ─── Channel CRUD ──────────────────────────────────────
  async getPlans(): Promise<{ channels: ChannelPlan[]; total: number }> {
    return apiFetch('/plans');
  },

  async getPlan(id: string): Promise<ChannelPlan> {
    return apiFetch(`/plans/${id}`);
  },

  // ─── Pipeline (delegates to pipeline/) ─────────────────
  generate,
  generateStep,
  resumeRun,
  deleteRun,

  async getRunStatus(runId: string): Promise<GenerationRun> {
    const local = getRun(runId);
    // For active/running runs, prefer remote status to avoid stale local cache.
    if (local?.status !== 'running') {
      if (local) return local;
      return apiFetch<GenerationRun>(`/generate/${runId}`);
    }

    try {
      return await apiFetch<GenerationRun>(`/generate/${runId}`);
    } catch {
      // Keep UI usable if backend is temporarily unreachable.
      return local;
    }
  },

  // ─── Data queries ──────────────────────────────────────
  async getRuns(): Promise<{ runs: GenerationRun[]; total: number }> {
    if (!runsHydratedOnce) {
      await hydrateAllRuns();
      runsHydratedOnce = true;
    }
    const runs = getAllRuns();
    return { runs, total: runs.length };
  },

  /** Load saved runs from Supabase for a channel; pass force=true to bypass hydration cache. */
  async hydrateChannel(
    channelId: string,
    force = false
  ): Promise<{ runs: GenerationRun[]; total: number }> {
    const runs = await hydrateRunsForChannel(channelId, force);
    return { runs, total: runs.length };
  },

  async searchTranscripts(
    query?: string,
    limit?: number
  ): Promise<{ transcripts: TranscriptItem[]; total: number }> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (limit) params.set('limit', String(limit));
    return apiFetch(`/transcripts?${params}`);
  },

  async getKnowledgeStats(): Promise<KnowledgeStats> {
    return apiFetch('/knowledge/stats');
  },

  async getOutputs(): Promise<{
    outputs: {
      id: string;
      createdAt: string;
      files: string[];
      title: string;
      stats: Record<string, unknown> | null;
    }[];
    total: number;
  }> {
    return apiFetch('/outputs');
  },

  async getApiKeyStatus(): Promise<{ hasKey: boolean; maskedKey: string }> {
    try {
      return await apiFetch('/api-key/status');
    } catch {
      return { hasKey: false, maskedKey: '' };
    }
  },

  async updateApiKey(
    key: string
  ): Promise<{ success: boolean; maskedKey: string; message: string }> {
    return apiFetch('/api-key', {
      method: 'PUT',
      body: JSON.stringify({ key }),
    });
  },
};
