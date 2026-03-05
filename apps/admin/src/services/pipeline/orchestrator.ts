/**
 * 🎯 Pipeline Orchestrator — dispatches to individual agent services
 * 
 * This is the single entry point for running pipeline steps.
 * Each agent is a separate module that can be tested/reused independently.
 */
import type { GenerateRequest } from './types';
import { createRun, getRun, failRun, completeRun } from './run-tracker';
import { runScriptWriter } from './script-writer.agent';
import { runStoryboard } from './storyboard.agent';

const STEP_LABELS: Record<string, string> = {
  scriptWriter: '✍️ Running Script Writer...',
  storyboard: '🎬 Running Storyboard Generator...',
  imageGen: '🖼️ Running Image Generation...',
  voiceover: '🎤 Running Voice Producer...',
  assembly: '🎥 Running Video Assembly...',
};

/** Run the full pipeline — chains enabled steps sequentially */
export async function generate(req: GenerateRequest): Promise<{ success: boolean; runId: string; message: string }> {
  const runId = `gen_${Date.now()}`;
  const run = createRun(runId, req, '🚀 Starting full pipeline...');

  // Determine which steps to run
  const steps: string[] = [];
  if (!req.storyboardOnly) steps.push('scriptWriter');
  if (!req.scriptOnly) steps.push('storyboard');

  // Run steps sequentially in background
  (async () => {
    try {
      for (const step of steps) {
        run.logs.push({ t: Date.now(), level: 'info', msg: STEP_LABELS[step] || `🔧 Running ${step}...` });

        if (step === 'scriptWriter') {
          await runScriptWriter(runId, req);
          // Check if script step failed
          if (run.status === 'failed') return;
        } else if (step === 'storyboard') {
          await runStoryboard(runId, req);
          if (run.status === 'failed') return;
        }
      }

      // If still running after all steps (shouldn't happen normally), mark complete
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

  // Run in background, then finalize
  (async () => {
    try {
      switch (step) {
        case 'scriptWriter':
          await runScriptWriter(runId, req);
          break;
        case 'storyboard':
          await runStoryboard(runId, req);
          break;
        default:
          run.logs.push({ t: Date.now(), level: 'info', msg: `[10%] 📡 Checking ${step} API availability...` });
          failRun(run, `Step "${step}" chưa có API endpoint riêng. Cần deploy full pipeline.`);
          return;
      }
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
