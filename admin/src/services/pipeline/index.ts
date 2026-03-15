/**
 * 🎬 Pipeline — barrel re-export
 *
 * Usage:
 *   import { generate, generateStep } from '@/services/pipeline';
 *   import type { GenerationRun, GenerateRequest } from '@/services/pipeline';
 *   import { getRun } from '@/services/pipeline';
 */

export { generate, generateStep, resumeRun } from './orchestrator';
export {
  deleteRun,
  findLatestRunWithFile,
  fixAllOrphanedRuns,
  fixOrphanedRun,
  getAllRuns,
  getRun,
  getRunningIdsForChannel,
  hydrateAllRuns,
  hydrateRunsForChannel,
} from './run-tracker';
export type { GenerateRequest, GenerationRun, ProgressPhase, RunLog } from './types';
