/**
 * 🎬 Scene Production Pipeline
 *
 * This file has been refactored into a modular architecture.
 * See ./scene-production/ for the full implementation.
 *
 * Architecture:
 * - types.ts: Type definitions
 * - helpers.ts: Utility functions
 * - useProductionData.ts: Data persistence hook
 * - useSceneGeneration.ts: AI generation hook
 * - useBrainImages.ts: Brain library hook
 * - InputStep.tsx: Step 1 component
 * - ScenesStep.tsx: Step 2 component
 * - ProductionStep.tsx: Step 3 component
 * - dialogs.tsx: Modal components
 * - index.tsx: Main orchestrator
 *
 * @author LongSang (Elon Mode 🚀)
 */

// Re-export from modular structure
export { default, SceneProductionContent } from './scene-production';

// Re-export types for consumers
export type {
  Episode,
  EpisodeScript,
  ProductionData,
  ReferenceImage,
  Scene,
  Settings,
} from './scene-production/types';
