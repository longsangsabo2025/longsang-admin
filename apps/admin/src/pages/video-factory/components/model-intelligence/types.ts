/**
 * Types for Model Intelligence Tab
 */

import type { Channel, Capacity, ModelAlert } from '@/services/video-factory.service';
import type { ModelMeta, ModelTier } from '../../shared-data';

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface ModelPerfStats {
  model: string;
  totalJobs: number;
  completed: number;
  failed: number;
  avgGenTime: number;
  successRate: number;
  lastUsed: string | null;
}

// ─── View Mode ────────────────────────────────────────────────────────────────

export type ViewMode = 'rankings' | 'cards' | 'matrix' | 'compare' | 'ab-test';

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseModelIntelligenceReturn {
  // Loading
  loadingPerf: boolean;

  // Computed data
  modelPerf: ModelPerfStats[];
  channels: Channel[];
  alerts: ModelAlert[];
  capacityData: Capacity | undefined;
  allModelIds: string[];

  // Overview stats
  totalProduction: number;
  topModel: ModelPerfStats | undefined;
  avgTime: number;
  activeModels: number;

  // Compare state
  compareModels: string[];
  setCompareModels: React.Dispatch<React.SetStateAction<string[]>>;

  // A/B test state
  abTestPrompt: string;
  setAbTestPrompt: React.Dispatch<React.SetStateAction<string>>;
  abTestModels: string[];
  setAbTestModels: React.Dispatch<React.SetStateAction<string[]>>;
  abTestId: string | null;
  abTestData: any;
  abTestMutation: {
    mutate: (req: { prompt: string; models: string[] }) => void;
    isPending: boolean;
  };

  // Channel model switch
  switchModelMutation: {
    mutate: (args: { channelId: string; model: string }) => void;
  };
}

// ─── View Props ───────────────────────────────────────────────────────────────

export interface ModelOverviewStatsProps {
  totalProduction: number;
  activeModels: number;
  totalModelsCount: number;
  avgTime: number;
  topModel: ModelPerfStats | undefined;
  capacityData: Capacity | undefined;
  alerts: ModelAlert[];
}

export interface ModelRankingsViewProps {
  modelPerf: ModelPerfStats[];
}

export interface ModelCardsViewProps {
  modelPerf: ModelPerfStats[];
}

export interface ChannelMatrixViewProps {
  channels: Channel[];
  modelPerf: ModelPerfStats[];
  totalProduction: number;
  allModelIds: string[];
  switchModelMutation: {
    mutate: (args: { channelId: string; model: string }) => void;
  };
}

export interface ModelCompareViewProps {
  compareModels: string[];
  setCompareModels: React.Dispatch<React.SetStateAction<string[]>>;
  allModelIds: string[];
  modelPerf: ModelPerfStats[];
}

export interface ABTestViewProps {
  allModelIds: string[];
  abTestPrompt: string;
  setAbTestPrompt: React.Dispatch<React.SetStateAction<string>>;
  abTestModels: string[];
  setAbTestModels: React.Dispatch<React.SetStateAction<string[]>>;
  abTestId: string | null;
  abTestData: any;
  abTestMutation: {
    mutate: (req: { prompt: string; models: string[] }) => void;
    isPending: boolean;
  };
}
