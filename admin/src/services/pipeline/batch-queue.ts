/**
 * 🚀 Batch Queue — Sequential batch execution with concurrency control
 *
 * Instead of firing 30 runs simultaneously (which overwhelms API quotas),
 * this queues topics and processes them N at a time with progress tracking.
 */

import { generate } from './orchestrator';
import { getRun } from './run-tracker';
import type { GenerateRequest } from './types';

export type BatchItemStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';

export interface BatchItem {
  id: string;
  topic: string;
  status: BatchItemStatus;
  runId?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface BatchJob {
  id: string;
  channelId: string;
  items: BatchItem[];
  concurrency: number;
  status: 'running' | 'completed' | 'paused' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  baseRequest: Omit<GenerateRequest, 'topic'>;
}

type BatchListener = (job: BatchJob) => void;

const _jobs = new Map<string, BatchJob>();
const _listeners = new Set<BatchListener>();
const _pausedJobs = new Set<string>();
const _cancelledJobs = new Set<string>();

/** Subscribe to batch job updates */
export function onBatchUpdate(fn: BatchListener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function notify(job: BatchJob) {
  _listeners.forEach((fn) => fn(job));
}

/** Get all batch jobs */
export function getBatchJobs(): BatchJob[] {
  return Array.from(_jobs.values());
}

/** Get a specific batch job */
export function getBatchJob(jobId: string): BatchJob | undefined {
  return _jobs.get(jobId);
}

/** Pause a running batch (current items finish, no new ones start) */
export function pauseBatch(jobId: string) {
  _pausedJobs.add(jobId);
  const job = _jobs.get(jobId);
  if (job) {
    job.status = 'paused';
    notify(job);
  }
}

/** Resume a paused batch */
export function resumeBatch(jobId: string) {
  _pausedJobs.delete(jobId);
  const job = _jobs.get(jobId);
  if (job && job.status === 'paused') {
    job.status = 'running';
    notify(job);
    // Re-trigger processing
    processQueue(job);
  }
}

/** Cancel a batch (current items finish, remaining marked skipped) */
export function cancelBatch(jobId: string) {
  _cancelledJobs.add(jobId);
  const job = _jobs.get(jobId);
  if (job) {
    job.items.forEach((item) => {
      if (item.status === 'queued') item.status = 'skipped';
    });
    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    notify(job);
  }
}

/** Save batch state to localStorage for persistence */
function persistBatch(job: BatchJob) {
  try {
    const key = `batch-job-${job.id}`;
    localStorage.setItem(key, JSON.stringify(job));
    // Update index
    const index: string[] = JSON.parse(localStorage.getItem('batch-job-index') || '[]');
    if (!index.includes(job.id)) {
      index.push(job.id);
      localStorage.setItem('batch-job-index', JSON.stringify(index));
    }
  } catch {
    /* localStorage full — non-critical */
  }
}

/** Load batch jobs from localStorage */
export function hydrateBatchJobs(): BatchJob[] {
  try {
    const index: string[] = JSON.parse(localStorage.getItem('batch-job-index') || '[]');
    const jobs: BatchJob[] = [];
    for (const id of index) {
      const raw = localStorage.getItem(`batch-job-${id}`);
      if (raw) {
        const job = JSON.parse(raw) as BatchJob;
        _jobs.set(id, job);
        jobs.push(job);
      }
    }
    return jobs;
  } catch {
    return [];
  }
}

/** Delete a batch job from memory and localStorage */
export function deleteBatchJob(jobId: string) {
  _jobs.delete(jobId);
  try {
    localStorage.removeItem(`batch-job-${jobId}`);
    const index: string[] = JSON.parse(localStorage.getItem('batch-job-index') || '[]');
    localStorage.setItem('batch-job-index', JSON.stringify(index.filter((id) => id !== jobId)));
  } catch {
    /* non-critical */
  }
}

/**
 * Launch a batch job — queues topics and processes them with concurrency limit.
 *
 * @param topics - Array of topic strings
 * @param baseRequest - Pipeline config (without topic)
 * @param concurrency - Max simultaneous runs (default 2, max 5)
 * @returns The batch job object
 */
export function launchBatch(
  topics: string[],
  baseRequest: Omit<GenerateRequest, 'topic'>,
  concurrency = 2
): BatchJob {
  const jobId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const clampedConcurrency = Math.min(Math.max(concurrency, 1), 5);

  const items: BatchItem[] = topics.map((topic, i) => ({
    id: `${jobId}_item_${i}`,
    topic,
    status: 'queued' as const,
  }));

  const job: BatchJob = {
    id: jobId,
    channelId: baseRequest.channelId || '',
    items,
    concurrency: clampedConcurrency,
    status: 'running',
    createdAt: new Date().toISOString(),
    baseRequest,
  };

  _jobs.set(jobId, job);
  persistBatch(job);
  notify(job);

  // Start processing
  processQueue(job);

  return job;
}

/** Patch deprecated models in baseRequest before retry */
function patchDeprecatedModels(job: BatchJob) {
  const DEPRECATED: Record<string, string> = {
    'gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-2.5-pro',
  };
  const req = job.baseRequest as Record<string, unknown>;
  for (const [old, replacement] of Object.entries(DEPRECATED)) {
    if (req.model === old) req.model = replacement;
    if (req.storyboardModel === old) req.storyboardModel = replacement;
  }
}

/** Retry all failed items in a completed/cancelled batch */
export function retryFailed(jobId: string) {
  const job = _jobs.get(jobId);
  if (!job) return;

  let hasRetries = false;
  for (const item of job.items) {
    if (item.status === 'failed' || item.status === 'skipped') {
      item.status = 'queued';
      item.error = undefined;
      item.runId = undefined;
      item.startedAt = undefined;
      item.completedAt = undefined;
      hasRetries = true;
    }
  }

  if (!hasRetries) return;

  patchDeprecatedModels(job);
  _pausedJobs.delete(jobId);
  _cancelledJobs.delete(jobId);
  job.status = 'running';
  job.completedAt = undefined;
  persistBatch(job);
  notify(job);
  processQueue(job);
}

/** Retry a single failed item */
export function retryItem(jobId: string, itemId: string) {
  const job = _jobs.get(jobId);
  if (!job) return;

  const item = job.items.find((i) => i.id === itemId);
  if (!item || (item.status !== 'failed' && item.status !== 'skipped')) return;

  item.status = 'queued';
  item.error = undefined;
  item.runId = undefined;
  item.startedAt = undefined;
  item.completedAt = undefined;

  patchDeprecatedModels(job);
  _pausedJobs.delete(jobId);
  _cancelledJobs.delete(jobId);
  job.status = 'running';
  job.completedAt = undefined;
  persistBatch(job);
  notify(job);
  processQueue(job);
}

/** Process the next items in queue respecting concurrency limit */
async function processQueue(job: BatchJob) {
  while (true) {
    // Check pause/cancel
    if (_pausedJobs.has(job.id) || _cancelledJobs.has(job.id)) return;

    const running = job.items.filter((i) => i.status === 'running').length;
    const queued = job.items.filter((i) => i.status === 'queued');

    if (queued.length === 0 && running === 0) {
      // All done
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      persistBatch(job);
      notify(job);
      return;
    }

    if (running >= job.concurrency || queued.length === 0) {
      // Wait for a slot to free up — poll every 3s
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }

    // Launch next items to fill available slots
    const slotsAvailable = job.concurrency - running;
    const toStart = queued.slice(0, slotsAvailable);

    for (const item of toStart) {
      item.status = 'running';
      item.startedAt = new Date().toISOString();
      notify(job);

      // Fire and forget — track completion
      runSingleItem(job, item).catch(() => {
        // Error already handled inside runSingleItem
      });
    }

    // Wait a bit before checking again
    await new Promise((r) => setTimeout(r, 3000));
  }
}

/** Run a single batch item through the pipeline */
async function runSingleItem(job: BatchJob, item: BatchItem) {
  try {
    const req: GenerateRequest = {
      ...job.baseRequest,
      topic: item.topic,
    };

    const result = await generate(req);
    item.runId = result.runId;

    // Wait for the run to complete (poll every 5s, max 30min)
    const maxWait = 30 * 60 * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      if (_cancelledJobs.has(job.id)) {
        item.status = 'skipped';
        break;
      }

      const run = getRun(item.runId!);
      if (!run) break;

      if (run.status === 'completed') {
        item.status = 'completed';
        item.completedAt = new Date().toISOString();
        break;
      }

      if (run.status === 'failed' || run.status === 'interrupted') {
        item.status = 'failed';
        item.error = run.error || 'Run failed';
        item.completedAt = new Date().toISOString();
        break;
      }

      await new Promise((r) => setTimeout(r, 5000));
    }

    // Timeout
    if (item.status === 'running') {
      item.status = 'failed';
      item.error = 'Timeout: exceeded 30 minutes';
      item.completedAt = new Date().toISOString();
    }
  } catch (err) {
    item.status = 'failed';
    item.error = err instanceof Error ? err.message : String(err);
    item.completedAt = new Date().toISOString();
  }

  persistBatch(job);
  notify(job);
}
