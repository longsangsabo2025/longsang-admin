/**
 * Hook to load pipeline run data from Supabase or local output files
 * Bridges the youtube-agent-crew pipeline results to the Admin Dashboard
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface StageResult {
  name: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: string;
  tokens?: { input: number; output: number };
  cost?: number;
  durationMs?: number;
  model?: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: string;
  input: Record<string, unknown>;
  stages: StageResult[];
  totalCost: number;
  totalDurationMs: number;
  startedAt: string;
  completedAt?: string;
}

export interface AgentConfig {
  agentId: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

const PIPELINE_STAGES = [
  'harvester', 'brain-curator', 'script-writer',
  'voice-producer', 'visual-director', 'video-assembler', 'publisher',
];

const STAGE_OUTPUT_KEYS: Record<string, string> = {
  'harvester': 'harvested_content',
  'brain-curator': 'curated_knowledge',
  'script-writer': 'podcast_script',
  'voice-producer': 'audio_data',
  'visual-director': 'visual_storyboard',
  'video-assembler': 'video_data',
  'publisher': 'publish_metadata',
};

export function usePipelineRuns() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setRuns(data.map(transformRun));
      }
    } catch {
      /* Supabase not available */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, loading, refresh: fetchRuns };
}

export function usePipelineRunDetail(pipelineId?: string) {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!pipelineId) return;
    setLoading(true);
    try {
      const { data: checkpoint } = await supabase
        .from('pipeline_checkpoints')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .single();

      if (checkpoint?.memory_data) {
        const memData = checkpoint.memory_data;
        const stages: StageResult[] = PIPELINE_STAGES.map((agentId, index) => {
          const outputKey = STAGE_OUTPUT_KEYS[agentId];
          const output = memData[outputKey];
          const meta = memData[`${agentId}_meta`];

          return {
            name: agentId,
            agentId,
            status: output ? 'completed' : (index <= checkpoint.stage_index ? 'completed' : 'pending'),
            output: typeof output === 'string' ? output : output ? JSON.stringify(output, null, 2) : undefined,
            tokens: meta?.tokens,
            cost: meta?.cost,
            durationMs: meta?.durationMs,
            model: meta?.model,
          };
        });

        setRun({
          id: pipelineId.split('_').pop() || pipelineId,
          pipelineId,
          status: checkpoint.stage_index >= 6 ? 'completed' : 'in_progress',
          input: memData.input || {},
          stages,
          totalCost: stages.reduce((sum, s) => sum + (s.cost || 0), 0),
          totalDurationMs: stages.reduce((sum, s) => sum + (s.durationMs || 0), 0),
          startedAt: checkpoint.checkpointed_at || new Date().toISOString(),
        });
      }
    } catch {
      /* fallback */
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { run, loading, refresh: fetchDetail };
}

export function usePipelineAgentConfigs() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);

  const fetchConfigs = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('pipeline_agent_configs')
        .select('*');

      if (data) {
        setConfigs(data.map(d => ({
          agentId: d.agent_id,
          model: d.model,
          temperature: d.temperature,
          maxTokens: d.max_tokens,
        })));
      }
    } catch {
      setConfigs(getDefaultConfigs());
    }
  }, []);

  const saveConfig = async (config: AgentConfig) => {
    try {
      await supabase
        .from('pipeline_agent_configs')
        .upsert({
          agent_id: config.agentId,
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agent_id' });
      await fetchConfigs();
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { configs, saveConfig, refresh: fetchConfigs };
}

function getDefaultConfigs(): AgentConfig[] {
  return [
    { agentId: 'harvester', model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 4096 },
    { agentId: 'brain-curator', model: 'gemini-2.0-flash', temperature: 0.5, maxTokens: 4096 },
    { agentId: 'script-writer', model: 'gemini-2.0-flash', temperature: 0.85, maxTokens: 16384 },
    { agentId: 'voice-producer', model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 1024 },
    { agentId: 'visual-director', model: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 4096 },
    { agentId: 'video-assembler', model: 'gemini-2.0-flash', temperature: 0.3, maxTokens: 1024 },
    { agentId: 'publisher', model: 'gemini-2.0-flash', temperature: 0.5, maxTokens: 4096 },
  ];
}

function transformRun(row: Record<string, unknown>): PipelineRun {
  return {
    id: String(row.id || ''),
    pipelineId: String(row.pipeline_id || ''),
    status: String(row.status || 'unknown'),
    input: (row.input as Record<string, unknown>) || {},
    stages: (row.stages as StageResult[]) || [],
    totalCost: Number(row.total_cost || 0),
    totalDurationMs: Number(row.total_duration_ms || 0),
    startedAt: String(row.started_at || ''),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
  };
}
