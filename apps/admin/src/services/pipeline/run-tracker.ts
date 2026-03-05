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
import { persistCreate, persistUpdate, persistDelete, loadRunsByChannel, loadAllRuns } from './run-persistence';

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
export function startProgressTracker(run: GenerationRun, phases: ProgressPhase[], estimatedMs: number, step?: string): ReturnType<typeof setInterval> {
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
    run.logs.push({ t: Date.now(), level: 'info', msg: `[${phase.pct}%] ${phase.msg} (${elapsed}s)`, step });
    phaseIdx++;
  }, interval);

  return timer;
}

/** Find a recent completed run for the same channel+topic that can be reused (append more steps) */
export function findReusableRun(channelId?: string | null, topic?: string | null): GenerationRun | null {
  if (!channelId || !topic) return null;
  let latest: GenerationRun | null = null;
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  for (const run of clientRuns.values()) {
    if (run.channelId !== channelId) continue;
    // Only reuse completed runs — never grab a currently-running parallel run
    if (run.status !== 'completed') continue;
    const runTopic = run.input?.topic || run.input?.transcript;
    if (runTopic !== topic) continue;
    // Use completedAt if available (long runs may start hours before finishing)
    const refTime = run.completedAt || run.startedAt;
    const age = Date.now() - new Date(refTime).getTime();
    if (age > maxAge) continue;
    if (!latest || run.startedAt > latest.startedAt) latest = run;
  }
  return latest;
}

/** Find the latest run that has a specific file (completed or in-progress with result) */
export function findLatestRunWithFile(fileName: string, channelId?: string | null, scopeRunId?: string): GenerationRun | null {
  // If scoped to a specific run, check it first
  if (scopeRunId) {
    const scoped = clientRuns.get(scopeRunId);
    if (scoped?.result?.files?.[fileName]) return scoped;
  }
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

/**
 * Merge runs with the same topic within a time window.
 * Keeps the earliest run as primary, merges files/steps from later runs into it,
 * then deletes the duplicates from Supabase and clientRuns.
 */
function mergeRelatedRuns(runs: GenerationRun[]): void {
  const MERGE_WINDOW = 2 * 60 * 60 * 1000; // 2 hours
  // Group by channelId + topic
  const groups = new Map<string, GenerationRun[]>();
  for (const run of runs) {
    const topic = run.input?.topic || run.input?.transcript;
    if (!topic) continue;
    const key = `${run.channelId}::${topic}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(run);
  }

  for (const [, group] of groups) {
    if (group.length <= 1) continue;
    // Never merge groups where any run is still active
    if (group.some(r => r.status === 'running')) continue;
    // Sort oldest first
    group.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    const primary = group[0];

    for (let i = 1; i < group.length; i++) {
      const other = group[i];
      // Use completedAt of primary (if available) for gap — long-running pipelines may start hours before completion
      const primaryRefTime = new Date(primary.completedAt || primary.startedAt).getTime();
      const gap = new Date(other.startedAt).getTime() - primaryRefTime;
      if (gap > MERGE_WINDOW) continue;

      // Merge files
      if (other.result?.files) {
        if (!primary.result) primary.result = { outputDir: 'remote', files: {} };
        primary.result.files = { ...primary.result.files, ...other.result.files };
        primary.hasResult = true;
      }
      // Merge steps
      primary.pipelineSteps = [...new Set([...(primary.pipelineSteps || []), ...(other.pipelineSteps || [])])];
      primary.completedSteps = [...new Set([...(primary.completedSteps || []), ...(other.completedSteps || [])])];
      // Use latest completedAt
      if (other.completedAt && (!primary.completedAt || other.completedAt > primary.completedAt)) {
        primary.completedAt = other.completedAt;
      }
      // Accumulate duration
      primary.durationMs = (primary.durationMs || 0) + (other.durationMs || 0);
      // Merge logs (dedupe by timestamp)
      const existingTs = new Set(primary.logs.map(l => l.t));
      for (const log of other.logs) {
        if (!existingTs.has(log.t)) primary.logs.push(log);
      }
      primary.logs.sort((a, b) => a.t - b.t);
      // Best status
      if (other.status === 'completed') primary.status = 'completed';

      // Remove duplicate from memory + Supabase
      clientRuns.delete(other.id);
      persistDelete(other.id).catch(() => {});
    }
    // Update primary in memory + Supabase
    clientRuns.set(primary.id, primary);
    persistUpdate(primary).catch(() => {});
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
  // Merge old separate runs with the same topic into single entries
  mergeRelatedRuns(saved);
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
