/**
 * 💾 Run Persistence — saves/loads pipeline runs to Supabase `pipeline_runs` table
 *
 * Column mapping:
 *   pipeline_id      → run.id
 *   status           → run.status
 *   input            → { ...GenerateRequest }  (channelId lives inside)
 *   stages           → { channelName, logs, result }  (JSONB blob)
 *   error_message    → run.error
 *   total_duration_ms → run.durationMs
 *   started_at       → run.startedAt
 *   completed_at     → run.completedAt
 */
import { supabase } from '@/integrations/supabase/client';
import type { GenerationRun } from './types';

const TABLE = 'pipeline_runs';

interface DbRow {
  pipeline_id: string;
  status: string;
  input: Record<string, unknown>;
  stages: {
    channelName?: string | null;
    logs?: unknown[];
    result?: unknown;
    pipelineSteps?: string[];
    completedSteps?: string[];
    episodeNumber?: number;
  };
  error_message: string | null;
  total_duration_ms: number;
  started_at: string;
  completed_at: string | null;
}

/** Convert a GenerationRun to a DB row */
function toRow(run: GenerationRun): Omit<DbRow, never> {
  return {
    pipeline_id: run.id,
    status: run.status,
    input: run.input as unknown as Record<string, unknown>,
    stages: {
      channelName: run.channelName,
      logs: run.logs,
      result: run.result,
      pipelineSteps: run.pipelineSteps,
      completedSteps: run.completedSteps,
      episodeNumber: run.episodeNumber,
    },
    error_message: run.error || null,
    total_duration_ms: run.durationMs || 0,
    started_at: run.startedAt,
    completed_at: run.completedAt || null,
  };
}

/** Convert a DB row back to a GenerationRun */
function fromRow(row: DbRow): GenerationRun {
  const stages = (row.stages || {}) as {
    channelName?: string | null;
    logs?: unknown[];
    result?: { outputDir: string; files: Record<string, unknown> };
    pipelineSteps?: string[];
    completedSteps?: string[];
    episodeNumber?: number;
  };
  return {
    id: row.pipeline_id,
    channelId: (row.input as { channelId?: string })?.channelId || null,
    channelName: stages.channelName || null,
    status: row.status as GenerationRun['status'],
    startedAt: row.started_at,
    completedAt: row.completed_at || undefined,
    durationMs: row.total_duration_ms || undefined,
    input: row.input as GenerationRun['input'],
    logs: (stages.logs || []) as GenerationRun['logs'],
    result: stages.result as GenerationRun['result'],
    hasResult: !!stages.result,
    error: row.error_message || undefined,
    episodeNumber: stages.episodeNumber,
    pipelineSteps: stages.pipelineSteps,
    completedSteps: stages.completedSteps,
  };
}

/** Insert a new run */
export async function persistCreate(run: GenerationRun): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(toRow(run), { onConflict: 'pipeline_id' });
  if (error) console.warn('[run-persistence] save failed:', error.message);
}

/** Update a run (on complete / fail) */
export async function persistUpdate(run: GenerationRun): Promise<void> {
  const row = toRow(run);
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: row.status,
      stages: row.stages,
      error_message: row.error_message,
      total_duration_ms: row.total_duration_ms,
      completed_at: row.completed_at,
    })
    .eq('pipeline_id', run.id);
  if (error) console.warn('[run-persistence] update failed:', error.message);
}

/** Delete a run by ID */
export async function persistDelete(runId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('pipeline_id', runId);
  if (error) console.warn('[run-persistence] delete failed:', error.message);
}

/** Load runs for a specific channel (most recent first, last 50) */
export async function loadRunsByChannel(channelId: string): Promise<GenerationRun[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .filter('input->>channelId', 'eq', channelId)
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('[run-persistence] load failed:', error.message);
    return [];
  }
  return (data || []).map((row: unknown) => fromRow(row as DbRow));
}

/** Load all recent runs (last 100) */
export async function loadAllRuns(): Promise<GenerationRun[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('[run-persistence] load all failed:', error.message);
    return [];
  }
  return (data || []).map((row: unknown) => fromRow(row as DbRow));
}
