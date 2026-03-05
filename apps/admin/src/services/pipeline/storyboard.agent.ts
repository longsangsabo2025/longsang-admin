/**
 * 🎬 Storyboard Agent — generates visual storyboard from script
 * 
 * Calls: POST /api/admin/generate-storyboard on the pipeline server
 * Requires: a completed script run (finds it via run-tracker)
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { PIPELINE_BASE } from './api-client';
import { getRun, startProgressTracker, completeRun, failRun, findLatestRunWithFile } from './run-tracker';

const STORYBOARD_PHASES: ProgressPhase[] = [
  { pct: 5,  msg: '🔌 Connecting to pipeline API...' },
  { pct: 10, msg: '📤 Sending script to Visual Director...' },
  { pct: 20, msg: '🎬 AI đang phân tích script structure...' },
  { pct: 35, msg: '🎨 AI đang tạo scene 1-4...' },
  { pct: 50, msg: '🎨 AI đang tạo scene 5-8...' },
  { pct: 65, msg: '🎨 AI đang tạo scene 9-12...' },
  { pct: 80, msg: '📝 AI đang viết Hailuo prompts...' },
  { pct: 90, msg: '🖼️ Formatting storyboard + prompts...' },
];

export async function runStoryboard(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  // Find script: first check the current run (for chained pipeline), then look for other completed runs
  let scriptText = run.result?.files?.['script.txt'] as string | undefined;
  if (!scriptText) {
    const scriptRun = findLatestRunWithFile('script.txt', req.channelId);
    scriptText = scriptRun?.result?.files?.['script.txt'] as string | undefined;
  }

  if (!scriptText) {
    failRun(run, 'Cần generate Script trước rồi mới tạo Storyboard. Chạy Script Writer trước!');
    return;
  }

  run.logs.push({ t: Date.now(), level: 'info', msg: `📄 Found script (${scriptText.length} chars) — sending to Visual Director...` });

  const tracker = startProgressTracker(run, STORYBOARD_PHASES, 20000);

  try {
    run.logs.push({ t: Date.now(), level: 'info', msg: `[0%] 📡 POST ${PIPELINE_BASE}/api/admin/generate-storyboard` });

    const res = await fetch(`${PIPELINE_BASE}/api/admin/generate-storyboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: scriptText,
        topic: req.topic || req.transcript,
        scenes: req.scenes || 12,
        duration: req.duration || 6,
        style: req.style || 'Dark Cinematic',
        aspectRatio: req.aspectRatio || '16:9',
      }),
    });

    clearInterval(tracker);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error((errBody as { error?: string }).error || `Pipeline API error ${res.status}`);
    }

    const data = await res.json() as {
      storyboard?: { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string; timestamp?: string; duration?: number }[]; thumbnail?: unknown; style?: unknown; config?: unknown; totalScenes?: number };
      storyboardMd?: string;
      promptsTxt?: string;
      scenes?: number;
      tokens?: unknown;
      cost?: number;
      model?: string;
      outputDir?: string;
    };

    // Merge: if this run already has script files (chained pipeline), keep them
    const existingFiles = run.result?.files || {};
    completeRun(run, {
      outputDir: data.outputDir || 'remote',
      files: {
        ...existingFiles,
        'storyboard.json': data.storyboard,
        'storyboard.md': data.storyboardMd,
        'prompts.txt': data.promptsTxt,
      },
    });
    run.logs.push({ t: Date.now(), level: 'info', msg: `[100%] ✅ Storyboard generated: ${data.scenes || '?'} scenes, cost $${data.cost?.toFixed(4) || '?'} (${(run.durationMs! / 1000).toFixed(1)}s)` });

    // Also merge into the script run (for single-step storyboard viewing via script run)
    const scriptRun = findLatestRunWithFile('script.txt', req.channelId);
    if (scriptRun?.result && scriptRun.id !== runId) {
      scriptRun.result.files['storyboard.json'] = data.storyboard;
      scriptRun.result.files['storyboard.md'] = data.storyboardMd;
      scriptRun.result.files['prompts.txt'] = data.promptsTxt;
    }
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
