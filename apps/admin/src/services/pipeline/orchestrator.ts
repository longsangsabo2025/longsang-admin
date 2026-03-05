/**
 * 🎯 Pipeline Orchestrator — dispatches to individual agent services
 * 
 * This is the single entry point for running pipeline steps.
 * Each agent is a separate module that can be tested/reused independently.
 */
import type { GenerateRequest } from './types';
import { createRun, getRun, failRun, completeRun } from './run-tracker';
import { persistUpdate } from './run-persistence';
import { runScriptWriter } from './script-writer.agent';
import { runStoryboard } from './storyboard.agent';
import { runImageGen } from './image-gen.agent';
import { runVoiceover } from './voiceover.agent';

const STEP_LABELS: Record<string, string> = {
  scriptWriter: '✍️ Running Script Writer...',
  storyboard: '🎬 Running Storyboard Generator...',
  imageGen: '🖼️ Running Image Generation...',
  voiceover: '🎤 Running Voice Producer...',
  assembly: '🎥 Running Video Assembly...',
};

/** Determine which steps to run based on request */
function resolveSteps(req: GenerateRequest): string[] {
  const steps: string[] = [];
  if (!req.storyboardOnly) steps.push('scriptWriter');
  if (!req.scriptOnly) steps.push('storyboard');
  if (req.imageGenEnabled) steps.push('imageGen');
  if (req.voiceoverEnabled) steps.push('voiceover');
  return steps;
}

/** Execute a single step — returns true if successful */
async function executeStep(step: string, runId: string, req: GenerateRequest): Promise<boolean> {
  const run = getRun(runId);
  if (!run) return false;

  run.logs.push({ t: Date.now(), level: 'info', msg: STEP_LABELS[step] || `🔧 Running ${step}...`, step });

  switch (step) {
    case 'scriptWriter':
      await runScriptWriter(runId, req);
      break;
    case 'storyboard':
      await runStoryboard(runId, req);
      break;
    case 'imageGen':
      await runImageGen(runId, req);
      break;
    case 'voiceover':
      await runVoiceover(runId, req);
      break;
    default:
      failRun(run, `Step "${step}" chưa có API endpoint riêng. Cần deploy full pipeline.`);
      return false;
  }

  if (run.status === 'failed') return false;

  return true;
}

/** Run the full pipeline — chains enabled steps sequentially */
export async function generate(req: GenerateRequest): Promise<{ success: boolean; runId: string; message: string }> {
  const runId = `gen_${Date.now()}`;
  const run = createRun(runId, req, '🚀 Starting full pipeline...');
  const steps = resolveSteps(req);

  // Run steps sequentially in background
  (async () => {
    try {
      for (const step of steps) {
        const ok = await executeStep(step, runId, req);
        if (!ok) return;
      }

      if (run.status === 'running') {
        completeRun(run, run.result || { outputDir: 'remote', files: {} });
      }
    } catch (err: unknown) {
      failRun(run, err instanceof Error ? err.message : String(err));
    }
  })();

  return { success: true, runId, message: `Pipeline started: ${steps.join(' → ')}` };
}

/** Run a single pipeline step */
export async function generateStep(step: string, req: GenerateRequest): Promise<{ success: boolean; runId: string; message: string }> {
  const runId = `step_${step}_${Date.now()}`;
  const label = STEP_LABELS[step] || `🔧 Running ${step}...`;
  const run = createRun(runId, req, label);
  run.pipelineSteps = [step];
  run.completedSteps = [];

  // Run in background, then finalize
  (async () => {
    try {
      const ok = await executeStep(step, runId, req);
      if (!ok) return;
      // Finalize: agents save result via saveStepResult, orchestrator marks complete
      if (run.status === 'running') {
        completeRun(run, run.result || { outputDir: 'remote', files: {} });
      }
    } catch (err: unknown) {
      failRun(run, err instanceof Error ? err.message : String(err));
    }
  })();

  return { success: true, runId, message: label };
}

/** Resume an interrupted pipeline run — skip already-completed steps */
export async function resumeRun(runId: string): Promise<{ success: boolean; runId: string; message: string }> {
  const run = getRun(runId);
  if (!run) {
    return { success: false, runId, message: 'Run not found in memory' };
  }
  if (run.status !== 'interrupted' && run.status !== 'failed') {
    return { success: false, runId, message: `Cannot resume run with status "${run.status}"` };
  }

  const allSteps = run.pipelineSteps || resolveSteps(run.input);
  const done = new Set(run.completedSteps || []);
  const remaining = allSteps.filter(s => !done.has(s));

  if (remaining.length === 0) {
    // All steps were done — just mark complete
    completeRun(run, run.result || { outputDir: 'remote', files: {} });
    return { success: true, runId, message: 'All steps already completed — marking done.' };
  }

  // Reset run state for resumption
  run.status = 'running';
  run.error = undefined;
  run.logs.push({ t: Date.now(), level: 'info', msg: `🔄 Resuming pipeline from ${STEP_LABELS[remaining[0]] || remaining[0]}... (${done.size}/${allSteps.length} steps done)`, step: remaining[0] });
  persistUpdate(run).catch(() => {});

  // Run remaining steps in background
  (async () => {
    try {
      for (const step of remaining) {
        const ok = await executeStep(step, runId, run.input);
        if (!ok) return;
      }
      if (run.status === 'running') {
        completeRun(run, run.result || { outputDir: 'remote', files: {} });
      }
    } catch (err: unknown) {
      failRun(run, err instanceof Error ? err.message : String(err));
    }
  })();

  return { success: true, runId, message: `Resuming: ${remaining.join(' → ')} (skipped ${done.size} completed step${done.size > 1 ? 's' : ''})` };
}
