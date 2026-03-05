/**
 * ✍️ Script Writer Agent — generates podcast scripts from topics
 * 
 * Calls: POST /api/admin/generate-script on the pipeline server
 */
import type { GenerateRequest, ProgressPhase } from './types';
import { PIPELINE_BASE } from './api-client';
import { getRun, startProgressTracker, completeRun, failRun } from './run-tracker';

const SCRIPT_PHASES: ProgressPhase[] = [
  { pct: 5,  msg: '🔌 Connecting to pipeline API...' },
  { pct: 10, msg: '📤 Sending request to AI model...' },
  { pct: 20, msg: '🤖 AI đang phân tích topic...' },
  { pct: 35, msg: '✍️ AI đang viết script (Section 1-2)...' },
  { pct: 50, msg: '✍️ AI đang viết script (Section 3-4)...' },
  { pct: 65, msg: '✍️ AI đang viết script (Section 5-6)...' },
  { pct: 80, msg: '📝 AI đang hoàn thiện + formatting...' },
  { pct: 90, msg: '📊 Tính toán word count & cost...' },
];

export async function runScriptWriter(runId: string, req: GenerateRequest): Promise<void> {
  const run = getRun(runId);
  if (!run) return;

  const tracker = startProgressTracker(run, SCRIPT_PHASES, 25000);

  try {
    run.logs.push({ t: Date.now(), level: 'info', msg: `[0%] 📡 POST ${PIPELINE_BASE}/api/admin/generate-script` });

    const res = await fetch(`${PIPELINE_BASE}/api/admin/generate-script`, {
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

    clearInterval(tracker);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error((errBody as { error?: string }).error || `Pipeline API error ${res.status}`);
    }

    const data = await res.json() as {
      script?: string; title?: string; model?: string;
      wordCount?: number; tokens?: unknown; cost?: number;
      outputDir?: string;
    };

    completeRun(run, {
      outputDir: data.outputDir || 'remote',
      files: {
        'script.txt': data.script,
        'script.json': {
          title: data.title,
          model: data.model,
          wordCount: data.wordCount,
          tokens: data.tokens,
          cost: data.cost,
        },
      },
    });
    run.logs.push({ t: Date.now(), level: 'info', msg: `[100%] ✅ Script generated: ${data.wordCount || '?'} words, cost $${data.cost?.toFixed(4) || '?'} (${(run.durationMs! / 1000).toFixed(1)}s)` });
  } catch (err: unknown) {
    clearInterval(tracker);
    failRun(run, err instanceof Error ? err.message : String(err));
  }
}
