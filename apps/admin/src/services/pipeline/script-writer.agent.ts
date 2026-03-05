/**
 * ✍️ Script Writer Agent — generates podcast scripts from topics
 * 
 * Calls: POST /api/admin/generate-script on the pipeline server
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { PIPELINE_BASE } from './api-client';
import { getRun, startProgressTracker, saveStepResult, completeRun, failRun } from './run-tracker';

const SCRIPT_PHASES: ProgressPhase[] = [
  { pct: 3,  msg: '🔌 Connecting to pipeline server...' },
  { pct: 8,  msg: '📤 Sending request to AI model...' },
  { pct: 15, msg: '🤖 AI đang phân tích topic + load knowledge...' },
  { pct: 22, msg: '✍️ AI đang viết script — HOOK + INTRO...' },
  { pct: 32, msg: '✍️ AI đang viết — BỐI CẢNH...' },
  { pct: 42, msg: '✍️ AI đang viết — GIẢI PHẪU (Section 3-4)...' },
  { pct: 52, msg: '✍️ AI đang viết — TWIST + ĐỨNG DẬY...' },
  { pct: 60, msg: '✍️ AI đang viết — KẾT + OUTRO...' },
  { pct: 68, msg: '📝 AI đang hoàn thiện nội dung...' },
  { pct: 75, msg: '📝 Formatting & quality check...' },
  { pct: 82, msg: '📝 Finalizing script (~1800+ từ)...' },
  { pct: 88, msg: '📊 Tính toán word count & cost...' },
  { pct: 92, msg: '💾 Saving output files...' },
  { pct: 95, msg: '⏳ Đang nhận response từ server...' },
];

export async function runScriptWriter(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const tracker = startProgressTracker(run, SCRIPT_PHASES, 60000, 'scriptWriter');

  try {
    run.logs.push({ t: Date.now(), level: 'info', msg: `[0%] 📡 POST ${PIPELINE_BASE}/api/admin/generate-script`, step: 'scriptWriter' });

    // Retry on transient Gemini INTERNAL errors
    let res: Response | null = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      res = await fetch(`${PIPELINE_BASE}/api/admin/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: req.topic || req.transcript,
          model: req.model || 'gemini-2.0-flash',
          tone: req.tone,
          customPrompt: req.customPrompt,
          wordTarget: req.wordTarget,
        }),
      });
      if (res.ok) break;
      const errBody = await res.json().catch(() => ({}));
      const errMsg = (errBody as { error?: string }).error || `Pipeline API error ${res.status}`;
      const isRetryable = errMsg.includes('internal') || errMsg.includes('INTERNAL') || errMsg.includes('500') || errMsg.includes('503') || errMsg.includes('retry');
      if (isRetryable && attempt < maxRetries) {
        const delay = (attempt + 1) * 5000; // 5s, 10s, 15s
        run.logs.push({ t: Date.now(), level: 'warn', msg: `\u26a0\ufe0f Attempt ${attempt + 1} failed (${errMsg}), retrying in ${delay / 1000}s...`, step: 'scriptWriter' });
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error(errMsg);
    }

    clearInterval(tracker);

    if (!res || !res.ok) {
      const errBody = !res ? {} : await res.json().catch(() => ({}));
      throw new Error((errBody as { error?: string }).error || `Pipeline API error ${res?.status || 'no response'}`);
    }

    const data = await res.json() as {
      script?: string; title?: string; model?: string;
      wordCount?: number; tokens?: unknown; cost?: number;
      outputDir?: string;
    };

    // Merge with existing files (e.g. storyboard from a reused run)
    const existingFiles = run.result?.files || {};
    const stepResult = {
      outputDir: data.outputDir || 'remote',
      files: {
        ...existingFiles,
        'script.txt': data.script,
        'script.json': {
          title: data.title,
          model: data.model,
          wordCount: data.wordCount,
          tokens: data.tokens,
          cost: data.cost,
        },
      },
    };
    // Save result but don't mark completed — orchestrator decides when the full pipeline is done
    saveStepResult(run, stepResult);
    const elapsed = ((Date.now() - new Date(run.startedAt).getTime()) / 1000).toFixed(1);
    run.logs.push({ t: Date.now(), level: 'info', msg: `[100%] ✅ Script generated: ${data.wordCount || '?'} words, cost $${data.cost?.toFixed(4) || '?'} (${elapsed}s)`, step: 'scriptWriter' });
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
