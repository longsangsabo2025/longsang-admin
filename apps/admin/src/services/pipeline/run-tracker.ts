/**
 * 📊 Run Tracker — client-side run storage + progress simulation
 * 
 * Manages the in-memory Map of GenerationRun objects and 
 * provides progress tracking with simulated % phases.
 * 
 * Persists completed/failed runs to Supabase `pipeline_runs` table
 * and loads them back on page refresh.
 */
import type { GenerationRun, GenerateRequest, ProgressPhase } from './types';
import { persistCreate, persistUpdate, loadRunsByChannel, loadAllRuns } from './run-persistence';

const clientRuns = new Map<string, GenerationRun>();
const hydratedChannels = new Set<string>();

/** Create a new run and store it in the client-side Map */
export function createRun(runId: string, req: GenerateRequest, stepLabel?: string): GenerationRun {
  const run: GenerationRun = {
    id: runId,
    channelId: req.channelId || null,
    channelName: null,
    status: 'running',
    startedAt: new Date().toISOString(),
    input: req,
    logs: [{ t: Date.now(), level: 'info', msg: stepLabel || '🚀 Starting generation...' }],
  };
  clientRuns.set(runId, run);
  // Fire-and-forget persist (don't block the UI)
  persistCreate(run).catch(() => {});
  return run;
}

/** Get a run by ID */
export function getRun(runId: string): GenerationRun | undefined {
  return clientRuns.get(runId);
}

/** Get all runs */
export function getAllRuns(): GenerationRun[] {
  return Array.from(clientRuns.values());
}

/** Save intermediate step result WITHOUT changing run status (avoids race with polling) */
export function saveStepResult(run: GenerationRun, result: GenerationRun['result']) {
  run.result = result;
  run.hasResult = true;
}

/** Mark a run as completed */
export function completeRun(run: GenerationRun, result: GenerationRun['result']) {
  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  run.durationMs = Date.now() - new Date(run.startedAt).getTime();
  run.result = result;
  run.hasResult = true;
  persistUpdate(run).catch(() => {});
}

/** Mark a run as failed */
export function failRun(run: GenerationRun, error: string) {
  run.status = 'failed';
  run.error = error;
  run.completedAt = new Date().toISOString();
  run.durationMs = Date.now() - new Date(run.startedAt).getTime();
  run.logs.push({ t: Date.now(), level: 'error', msg: `❌ ${error}` });
  persistUpdate(run).catch(() => {});
}

/** Simulate progress phases while waiting for an API call */
export function startProgressTracker(run: GenerationRun, phases: ProgressPhase[], estimatedMs: number): ReturnType<typeof setInterval> {
  let phaseIdx = 0;
  const interval = estimatedMs / phases.length;
  const startMs = Date.now();

  const timer = setInterval(() => {
    if (run.status !== 'running' || phaseIdx >= phases.length) {
      clearInterval(timer);
      return;
    }
    const phase = phases[phaseIdx];
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
    run.logs.push({ t: Date.now(), level: 'info', msg: `[${phase.pct}%] ${phase.msg} (${elapsed}s)` });
    phaseIdx++;
  }, interval);

  return timer;
}

/** Find the latest run that has a specific file (completed or in-progress with result) */
export function findLatestRunWithFile(fileName: string, channelId?: string | null): GenerationRun | null {
  let latest: GenerationRun | null = null;
  for (const run of clientRuns.values()) {
    if (run.status === 'failed') continue;
    if (channelId && run.channelId !== channelId) continue;
    if (!run.result?.files?.[fileName]) continue;
    if (!latest || run.startedAt > latest.startedAt) latest = run;
  }
  return latest;
}

/** Auto-fix orphaned runs that are stuck in 'running' (e.g. page closed mid-pipeline) */
function fixOrphanedRun(run: GenerationRun): void {
  if (run.status !== 'running') return;
  const ageMs = Date.now() - new Date(run.startedAt).getTime();
  if (ageMs > 5 * 60 * 1000) {
    const hasPartialResult = run.hasResult || !!run.result?.files;
    const hasCompletedSteps = (run.completedSteps?.length || 0) > 0;
    const hasPendingSteps = run.pipelineSteps && run.pipelineSteps.length > (run.completedSteps?.length || 0);

    if ((hasPartialResult || hasCompletedSteps) && hasPendingSteps) {
      // Has partial progress — mark as interrupted (resumable)
      run.status = 'interrupted';
      run.error = 'Pipeline bị gián đoạn. Bấm Resume để tiếp tục từ step tiếp theo.';
    } else {
      // No useful progress — mark as failed
      run.status = 'failed';
      run.error = 'Pipeline bị gián đoạn (orphaned run). Vui lòng chạy lại.';
    }
    run.completedAt = run.completedAt || new Date().toISOString();
    run.durationMs = run.durationMs || ageMs;
    persistUpdate(run).catch(() => {});
  }
}

/** Load saved runs from Supabase into the in-memory Map (call once per channel) */
export async function hydrateRunsForChannel(channelId: string): Promise<GenerationRun[]> {
  if (hydratedChannels.has(channelId)) return getAllRuns();
  hydratedChannels.add(channelId);
  const saved = await loadRunsByChannel(channelId);
  for (const run of saved) {
    if (!clientRuns.has(run.id)) {
      fixOrphanedRun(run);
      clientRuns.set(run.id, run);
    }
  }
  return getAllRuns();
}

/** Load all saved runs from Supabase */
export async function hydrateAllRuns(): Promise<GenerationRun[]> {
  const saved = await loadAllRuns();
  for (const run of saved) {
    if (!clientRuns.has(run.id)) {
      clientRuns.set(run.id, run);
    }
  }
  return getAllRuns();
}
