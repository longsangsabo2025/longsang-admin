/**
 * Reporter — Pipeline Run Reporting to Supabase
 *
 * Persists pipeline execution data (runs, stage results, script metrics)
 * to Supabase via the PostgREST API after each pipeline execution.
 *
 * Tables:
 *   pipeline_runs          — one row per pipeline execution
 *   pipeline_stage_results — one row per stage within a run
 *   pipeline_script_metrics — one row per script-writer output
 */
import chalk from 'chalk';
import { estimateCost } from './llm.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

function log(msg) {
  console.log(`${chalk.bold.blue('[Reporter]')} ${msg}`);
}

function warn(msg) {
  console.log(`${chalk.bold.blue('[Reporter]')} ${chalk.yellow(msg)}`);
}

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function insert(table, row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${table} insert failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  return Array.isArray(json) ? json[0] : json;
}

// ─── Aggregate helpers ──────────────────────────────────────

function aggregateTokens(conductor) {
  let tokensIn = 0;
  let tokensOut = 0;
  for (const agent of conductor.agents.values()) {
    tokensIn += agent.totalTokens.input;
    tokensOut += agent.totalTokens.output;
  }
  return { tokensIn, tokensOut };
}

function extractScriptMetrics(text) {
  if (!text || typeof text !== 'string') return null;

  const totalChars = text.length;
  const totalWords = text.split(/\s+/).filter(Boolean).length;

  const sectionHits = text.match(/^(?:#{1,3}\s|(?:\d+)\.\s)/gm);
  const sectionCount = sectionHits ? sectionHits.length : 0;

  const estimatedMinutes = +(totalWords / 150).toFixed(1);

  const bookHits = text.match(/\bbook\s+["'].+?["']/gi) || [];
  const bookReferences = bookHits.length;

  const metaphorPatterns = [
    /\blike\s+a\b/gi,
    /\bas\s+if\b/gi,
    /\bimagine\s/gi,
    /\bpicture\s+this\b/gi,
    /\bthink\s+of\s+it\s+as\b/gi,
  ];
  const metaphorCount = metaphorPatterns.reduce(
    (sum, re) => sum + (text.match(re) || []).length,
    0,
  );

  return {
    total_words: totalWords,
    total_chars: totalChars,
    section_count: sectionCount,
    estimated_minutes: estimatedMinutes,
    book_references: bookReferences,
    metaphor_count: metaphorCount,
  };
}

// ─── Public API ─────────────────────────────────────────────

async function saveStageResults(conductor, pipelineId, results, stageResults) {
  const entries = Object.entries(stageResults);

  for (let i = 0; i < entries.length; i++) {
    const [stageName, stageData] = entries[i];
    const meta = results[`${stageData.agentId}_meta`] || {};
    const agent = conductor.agents.get(stageData.agentId);
    const fullOutput = results[`${stageData.agentId}_output`] || '';
    const outputStr = typeof fullOutput === 'string' ? fullOutput : JSON.stringify(fullOutput);

    const stageCost =
      meta.tokens && meta.model
        ? estimateCost(meta.model, meta.tokens.input, meta.tokens.output)
        : 0;

    try {
      await insert('pipeline_stage_results', {
        pipeline_id: pipelineId,
        stage_index: i,
        agent_id: stageData.agentId,
        status: 'completed',
        output: outputStr,
        output_preview: outputStr.substring(0, 200),
        tokens_in: meta.tokens?.input ?? 0,
        tokens_out: meta.tokens?.output ?? 0,
        cost: stageCost,
        duration_ms: meta.durationMs ?? 0,
        model: meta.model || agent?.model || 'unknown',
      });
    } catch (err) {
      warn(`Stage "${stageName}" report failed: ${err.message}`);
    }
  }

  if (entries.length > 0) {
    log(chalk.green(`✓ ${entries.length} stage results saved`));
  }
}

async function saveScriptMetrics(pipelineId, results) {
  const scriptKey = Object.keys(results).find(
    (k) => k.includes('script') && k.endsWith('_output') && typeof results[k] === 'string',
  );
  if (!scriptKey) return;

  const metrics = extractScriptMetrics(results[scriptKey]);
  if (!metrics) return;

  try {
    await insert('pipeline_script_metrics', {
      pipeline_id: pipelineId,
      ...metrics,
      voice_dna_score: null,
    });
    log(
      chalk.green(
        `✓ Script metrics saved (${metrics.total_words} words, ~${metrics.estimated_minutes} min)`,
      ),
    );
  } catch (err) {
    warn(`Script metrics report failed: ${err.message}`);
  }
}

/**
 * Report a completed (or failed) pipeline run to Supabase.
 *
 * @param {import('./conductor.js').Conductor} conductor
 * @param {string} pipelineId
 * @param {object} results  — memory.getAll(pipelineId)
 * @param {object} stats    — the run object from conductor
 */
export async function reportPipelineRun(conductor, pipelineId, results, stats) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      warn('SUPABASE_URL / SUPABASE_KEY not set — skipping report');
      return;
    }

    const { tokensIn, tokensOut } = aggregateTokens(conductor);

    await insert('pipeline_runs', {
      id: pipelineId,
      pipeline_name: 'youtube-crew',
      status: stats.status,
      input_data: {
        ...(results.input ?? {}),
        tokens: { in: tokensIn, out: tokensOut },
      },
      stage_results: stats.stageResults ?? {},
      errors: stats.errors?.length
        ? stats.errors.map((e) => ({ stage: e.stage, error: e.error }))
        : [],
      total_cost: stats.totalCost ?? 0,
      duration_ms: Math.round(stats.durationMs ?? 0),
      started_at: new Date(stats.startTime).toISOString(),
      completed_at: new Date(stats.startTime + (stats.durationMs || 0)).toISOString(),
    });

    log(chalk.green(`✓ Pipeline run saved → ${pipelineId}`));

    await saveStageResults(conductor, pipelineId, results, stats.stageResults ?? {});
    await saveScriptMetrics(pipelineId, results);
  } catch (err) {
    warn(`Pipeline report failed: ${err.message}`);
  }
}

/**
 * Report a single stage result in real-time (call right after a stage completes).
 *
 * @param {string} pipelineId
 * @param {number} stageIndex
 * @param {string} agentId
 * @param {object} result — { content, tokens: { input, output }, durationMs, model, cost? }
 */
export async function reportStageResult(pipelineId, stageIndex, agentId, result) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;

    const content =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content);

    const cost =
      result.cost ?? estimateCost(result.model, result.tokens?.input ?? 0, result.tokens?.output ?? 0);

    await insert('pipeline_stage_results', {
      pipeline_id: pipelineId,
      stage_index: stageIndex,
      agent_id: agentId,
      status: 'completed',
      output: content,
      output_preview: content.substring(0, 200),
      tokens_in: result.tokens?.input ?? 0,
      tokens_out: result.tokens?.output ?? 0,
      cost,
      duration_ms: result.durationMs ?? 0,
      model: result.model || 'unknown',
    });

    log(chalk.green(`✓ Stage ${stageIndex} (${agentId}) reported`));
  } catch (err) {
    warn(`Stage report failed: ${err.message}`);
  }
}
