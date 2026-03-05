/**
 * 📊 Run Tracker — client-side run storage + progress simulation
 * 
 * Manages the in-memory Map of GenerationRun objects and 
 * provides progress tracking with simulated % phases.
 */
import type { GenerationRun, GenerateRequest, ProgressPhase } from './types';

const clientRuns = new Map<string, GenerationRun>();

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

/** Mark a run as completed */
export function completeRun(run: GenerationRun, result: GenerationRun['result']) {
  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  run.durationMs = Date.now() - new Date(run.startedAt).getTime();
  run.result = result;
}

/** Mark a run as failed */
export function failRun(run: GenerationRun, error: string) {
  run.status = 'failed';
  run.error = error;
  run.completedAt = new Date().toISOString();
  run.durationMs = Date.now() - new Date(run.startedAt).getTime();
  run.logs.push({ t: Date.now(), level: 'error', msg: `❌ ${error}` });
}

/** Simulate progress phases while waiting for an API call */
export function startProgressTracker(run: GenerationRun, phases: ProgressPhase[], estimatedMs: number): ReturnType<typeof setInterval> {
  let phaseIdx = 0;
  const interval = estimatedMs / phases.length;

  const timer = setInterval(() => {
    if (run.status !== 'running' || phaseIdx >= phases.length) {
      clearInterval(timer);
      return;
    }
    const phase = phases[phaseIdx];
    run.logs.push({ t: Date.now(), level: 'info', msg: `[${phase.pct}%] ${phase.msg}` });
    phaseIdx++;
  }, interval);

  return timer;
}

/** Find the latest completed run that has a specific file */
export function findLatestRunWithFile(fileName: string, channelId?: string | null): GenerationRun | null {
  let latest: GenerationRun | null = null;
  for (const run of clientRuns.values()) {
    if (run.status !== 'completed') continue;
    if (channelId && run.channelId !== channelId) continue;
    if (!run.result?.files?.[fileName]) continue;
    if (!latest || run.startedAt > latest.startedAt) latest = run;
  }
  return latest;
}
