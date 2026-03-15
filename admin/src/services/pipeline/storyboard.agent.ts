/**
 * 🎬 Storyboard Agent — generates visual storyboard from script
 *
 * Calls: POST /api/admin/generate-storyboard on the pipeline server
 * Requires: a completed script run (finds it via run-tracker)
 */

import { PIPELINE_BASE } from './api-client';
import { trackCost } from './cost-tracker';
import { fetchWithRetry } from './fetch-with-retry';
import {
  failRun,
  findLatestRunWithFile,
  getRun,
  saveStepResult,
  startProgressTracker,
} from './run-tracker';
import type { GenerateRequest, ProgressPhase } from './types';

const STORYBOARD_PHASES: ProgressPhase[] = [
  { pct: 3, msg: '🔌 Connecting to pipeline server...' },
  { pct: 8, msg: '📤 Sending script to Visual Director...' },
  { pct: 18, msg: '🎬 AI đang phân tích script structure...' },
  { pct: 28, msg: '🎨 AI đang tạo scene 1-4...' },
  { pct: 40, msg: '🎨 AI đang tạo scene 5-8...' },
  { pct: 52, msg: '🎨 AI đang tạo scene 9-12...' },
  { pct: 65, msg: '📝 AI đang viết Hailuo 2.3 prompts...' },
  { pct: 75, msg: '📋 Formatting storyboard markdown...' },
  { pct: 85, msg: '📋 Generating copy-paste prompts file...' },
  { pct: 92, msg: '💾 Saving output files...' },
  { pct: 95, msg: '⏳ Đang nhận response từ server...' },
];

export async function runStoryboard(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  // Find script: first check the current run (for chained pipeline), then look for other completed runs
  const runTopic = req.topic || req.transcript || null;
  let scriptText = run.result?.files?.['script.txt'] as string | undefined;
  if (!scriptText) {
    const scriptRun = findLatestRunWithFile('script.txt', req.channelId, runId, runTopic);
    scriptText = scriptRun?.result?.files?.['script.txt'] as string | undefined;
  }

  if (!scriptText) {
    failRun(run, 'Cần generate Script trước rồi mới tạo Storyboard. Chạy Script Writer trước!');
    return;
  }

  run.logs.push({
    t: Date.now(),
    level: 'info',
    msg: `📄 Found script (${scriptText.length} chars) — sending to Visual Director...`,
    step: 'storyboard',
  });

  const tracker = startProgressTracker(run, STORYBOARD_PHASES, 45000, 'storyboard');

  try {
    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: `[0%] 📡 POST ${PIPELINE_BASE}/api/admin/generate-storyboard`,
      step: 'storyboard',
    });

    // Retry on transient Gemini INTERNAL errors
    const res = await fetchWithRetry(
      `${PIPELINE_BASE}/api/admin/generate-storyboard`,
      {
        script: scriptText,
        topic: req.topic || req.transcript,
        scenes: req.scenes || 12,
        duration: req.duration || 6,
        style: req.style || 'dark-cinematic',
        aspectRatio: req.aspectRatio || '16:9',
        visualIdentity: req.visualIdentity || undefined,
        customPrompt: req.storyboardPrompt || undefined,
        model: req.storyboardModel || undefined,
      },
      {
        onRetry: (attempt, errMsg, delay) => {
          run.logs.push({
            t: Date.now(),
            level: 'warn',
            msg: `⚠️ Attempt ${attempt} failed (${errMsg}), retrying in ${delay / 1000}s...`,
            step: 'storyboard',
          });
        },
      }
    );

    clearInterval(tracker);

    const data = (await res.json()) as {
      storyboard?: {
        scenes?: {
          scene: number;
          dialogue: string;
          prompt: string;
          motion: string;
          transition: string;
          timestamp?: string;
          duration?: number;
        }[];
        thumbnail?: unknown;
        style?: unknown;
        config?: unknown;
        totalScenes?: number;
      };
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
    saveStepResult(run, {
      outputDir: data.outputDir || 'remote',
      files: {
        ...existingFiles,
        'storyboard.json': data.storyboard,
        'storyboard.md': data.storyboardMd,
        'prompts.txt': data.promptsTxt,
      },
    });
    trackCost({
      step: 'storyboard',
      model: data.model || 'gemini-2.5-flash',
      type: 'text',
      quantity: 1,
      runId,
      channelId: req.channelId,
      detail: `${data.scenes || '?'} scenes`,
    });
    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: `[100%] ✅ Storyboard generated: ${data.scenes || '?'} scenes, cost $${data.cost?.toFixed(4) || '?'} (${elapsed}s)`,
      step: 'storyboard',
    });

    // Also merge into the script run (for single-step storyboard viewing via script run)
    const scriptRun = findLatestRunWithFile('script.txt', req.channelId, undefined, runTopic);
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
