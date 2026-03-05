/**
 * 🎬 Pipeline — barrel re-export
 * 
 * Usage:
 *   import { generate, generateStep } from '@/services/pipeline';
 *   import type { GenerationRun, GenerateRequest } from '@/services/pipeline';
 *   import { getRun } from '@/services/pipeline';
 */
export type { GenerationRun, GenerateRequest, RunLog, ProgressPhase } from './types';
export { getRun, getAllRuns, getRunningIdsForChannel, findLatestRunWithFile, hydrateRunsForChannel, hydrateAllRuns } from './run-tracker';
export { generate, generateStep, resumeRun } from './orchestrator';
