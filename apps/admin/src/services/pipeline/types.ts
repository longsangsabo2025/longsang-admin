/**
 * 🎯 Pipeline Types — shared across all pipeline agents & services
 */

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
  model?: string;
  tone?: string;
  wordTarget?: number;
  aspectRatio?: string;
}

export interface RunLog {
  t: number;
  level: string;
  msg: string;
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
  logs: RunLog[];
  result?: {
    outputDir: string;
    files: Record<string, unknown>;
  };
  hasResult?: boolean;
  error?: string;
}

export interface ProgressPhase {
  pct: number;
  msg: string;
}
