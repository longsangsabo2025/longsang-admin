/**
 * ✍️ Script Writer Agent — Dual Mode
 *
 * Full Pipeline Mode (default): Single AI call → Script + Storyboard (scenes, prompts, dialogue)
 *   Calls: POST /api/admin/generate-full-pipeline
 * Script Only Mode (scriptOnly=true): Script only, storyboard runs separately
 *   Calls: POST /api/admin/generate-script
 */

import { PIPELINE_BASE } from './api-client';
import { trackCost } from './cost-tracker';
import { fetchWithRetry } from './fetch-with-retry';
import { failRun, getRun, saveStepResult, startProgressTracker } from './run-tracker';
import type { GenerateRequest, ProgressPhase } from './types';

/** Strip section markers, timestamps, emojis → clean text for TTS */
function cleanScriptForTTS(script: string): string {
  return script
    .replace(/===SCRIPT_START===|===SCRIPT_END===/g, '')
    .replace(/^---\s*\[.*?\]\s*.*?---$/gm, '')
    .replace(/^---\s+\S+.*$/gm, '')
    .replace(/^\[\d+:\d+(?::\d+)?\]\s*/gm, '')
    .replace(/^#+\s+.*$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu,
      ''
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const SCRIPT_PHASES: ProgressPhase[] = [
  { pct: 3, msg: '🔌 Connecting to pipeline server...' },
  { pct: 8, msg: '📤 Sending request to AI Director...' },
  { pct: 12, msg: '🤖 AI đang phân tích topic + load knowledge...' },
  { pct: 18, msg: '✍️ AI đang viết script — HOOK + INTRO...' },
  { pct: 26, msg: '✍️ AI đang viết — BỐI CẢNH + GIẢI PHẪU...' },
  { pct: 34, msg: '✍️ AI đang viết — TWIST + ĐỨNG DẬY + KẾT...' },
  { pct: 42, msg: '🎬 AI đang thiết kế storyboard scenes...' },
  { pct: 50, msg: '🎬 AI đang tạo visual prompts (phần 1)...' },
  { pct: 58, msg: '🎬 AI đang tạo visual prompts (phần 2)...' },
  { pct: 66, msg: '🎬 AI đang tạo visual prompts (phần 3)...' },
  { pct: 74, msg: '📝 AI đang hoàn thiện dialogue + transitions...' },
  { pct: 82, msg: '📝 Formatting & quality check...' },
  { pct: 88, msg: '📊 Parsing script + storyboard output...' },
  { pct: 92, msg: '💾 Saving all output files...' },
  { pct: 95, msg: '⏳ Đang nhận response từ server...' },
];

export async function runScriptWriter(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const tracker = startProgressTracker(run, SCRIPT_PHASES, 90000, 'scriptWriter');

  try {
    const isFullPipeline = !req.scriptOnly;
    const endpoint = isFullPipeline
      ? `${PIPELINE_BASE}/api/admin/generate-full-pipeline`
      : `${PIPELINE_BASE}/api/admin/generate-script`;

    run.logs.push({
      t: Date.now(),
      level: 'info',
      msg: `[0%] 📡 POST ${endpoint} (${isFullPipeline ? 'Script + Storyboard' : 'Script Only'})`,
      step: 'scriptWriter',
    });

    // Build request body — full pipeline has extra scene/style params
    const bodyBase = {
      topic: req.topic || req.transcript,
      model: req.model || 'gemini-2.5-flash',
      tone: req.tone,
      customPrompt: req.customPrompt,
      wordTarget: req.wordTarget,
    };
    const body = isFullPipeline
      ? {
          ...bodyBase,
          scenes: req.scenes || 12,
          duration: req.duration || 6,
          style: req.style || 'dark-cinematic',
          aspectRatio: req.aspectRatio || '16:9',
          visualIdentity: req.visualIdentity || undefined,
          storyboardPrompt: req.storyboardPrompt || undefined,
        }
      : bodyBase;

    // Retry on transient Gemini INTERNAL errors
    const res = await fetchWithRetry(endpoint, body, {
      onRetry: (attempt, errMsg, delay) => {
        run.logs.push({
          t: Date.now(),
          level: 'warn',
          msg: `⚠️ Attempt ${attempt} failed (${errMsg}), retrying in ${delay / 1000}s...`,
          step: 'scriptWriter',
        });
      },
    });

    clearInterval(tracker);

    const data = (await res.json()) as {
      script?: string;
      scriptTTS?: string;
      title?: string;
      model?: string;
      wordCount?: number;
      tokens?: unknown;
      cost?: number;
      outputDir?: string;
      // Full pipeline additions
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
      storyboardScenes?: number;
    };

    // Build files map — script + storyboard if available
    const existingFiles = run.result?.files || {};
    const files: Record<string, unknown> = {
      ...existingFiles,
      'script.txt': data.script,
      'script-tts.txt': data.scriptTTS || cleanScriptForTTS(data.script || ''),
      'script.json': {
        title: data.title,
        model: data.model,
        wordCount: data.wordCount,
        tokens: data.tokens,
        cost: data.cost,
      },
    };

    // Include storyboard outputs ONLY in full pipeline mode
    const hasStoryboard =
      isFullPipeline && data.storyboard?.scenes && data.storyboard.scenes.length > 0;
    if (hasStoryboard) {
      files['storyboard.json'] = data.storyboard;
      files['storyboard.md'] = data.storyboardMd;
      files['prompts.txt'] = data.promptsTxt;
    }

    const stepResult = {
      outputDir: data.outputDir || 'remote',
      files,
    };

    // Save result but don't mark completed — orchestrator decides when the full pipeline is done
    saveStepResult(run, stepResult);
    trackCost({
      step: 'scriptWriter',
      model: data.model || req.model || 'gemini-2.5-flash',
      type: 'text',
      quantity: 1,
      runId,
      channelId: req.channelId,
      detail:
        `${data.wordCount || '?'} words` +
        (hasStoryboard ? ` + ${data.storyboardScenes || '?'} scenes` : ''),
    });

    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    if (hasStoryboard) {
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `[100%] ✅ Full Pipeline AI done: ${data.wordCount || '?'} words + ${data.storyboardScenes || '?'} scenes storyboard, cost $${data.cost?.toFixed(4) || '?'} (${elapsed}s)`,
        step: 'scriptWriter',
      });
    } else {
      run.logs.push({
        t: Date.now(),
        level: 'info',
        msg: `[100%] ✅ Script generated: ${data.wordCount || '?'} words, cost $${data.cost?.toFixed(4) || '?'} (${elapsed}s)`,
        step: 'scriptWriter',
      });
      run.logs.push({
        t: Date.now(),
        level: 'warn',
        msg: '⚠️ Storyboard not produced by AI — sẽ chạy riêng ở bước Storyboard',
        step: 'scriptWriter',
      });
    }
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
