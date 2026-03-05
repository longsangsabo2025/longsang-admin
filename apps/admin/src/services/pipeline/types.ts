/**
 * 🎯 Pipeline Types — shared across all pipeline agents & services
 */
import type { VisualIdentity } from '@/components/youtube/pipeline-types';

export interface GenerateRequest {
  channelId?: string;
  topic?: string;
  transcript?: string;
  scenes?: number;
  style?: string;
  duration?: number;
  scriptOnly?: boolean;
  storyboardOnly?: boolean;
  customPrompt?: string;
  storyboardPrompt?: string;
  model?: string;
  storyboardModel?: string;
  tone?: string;
  wordTarget?: number;
  aspectRatio?: string;
  visualIdentity?: VisualIdentity;
  imageGenEnabled?: boolean;
  imageGenProvider?: string;
  imageGenQuality?: string;
  voiceoverEnabled?: boolean;
  voiceoverEngine?: string;
  voiceoverVoice?: string;
  voiceoverSpeed?: number;
  voiceoverCleanedScript?: string;
}

export interface RunLog {
  t: number;
  level: string;
  msg: string;
  /** Which pipeline step produced this log (for accurate UI classification) */
  step?: string;
}

export interface GenerationRun {
  id: string;
  channelId: string | null;
  channelName: string | null;
  status: 'running' | 'completed' | 'failed' | 'interrupted';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  input: GenerateRequest;
  logs: RunLog[];
  result?: {
    outputDir: string;
    files: Record<string, unknown>;
  };
  hasResult?: boolean;
  error?: string;
  /** Steps this pipeline run should execute (for full pipeline runs) */
  pipelineSteps?: string[];
  /** Steps that completed successfully before interruption */
  completedSteps?: string[];
}

export interface ProgressPhase {
  pct: number;
  msg: string;
}
