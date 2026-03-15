/**
 * 💰 Cost Tracker — tracks all AI API call costs across the pipeline
 *
 * Pricing source: https://ai.google.dev/pricing (Gemini), ElevenLabs, Google Cloud TTS
 * All costs in USD. Updated 2025-06.
 */

// ─── Cost Rates (USD) ──────────────────────────────────────

export interface CostRate {
  model: string;
  engine: string;
  type: 'text' | 'image' | 'tts' | 'video';
  /** Per-unit cost — unit depends on type */
  costPerUnit: number;
  /** What the unit is */
  unit: string;
  note?: string;
}

/**
 * Known cost rates. For text models, cost is per 1M tokens (input+output average).
 * For image, cost is per image generated.
 * For TTS, cost is per 1K characters.
 * For free services, cost is 0.
 */
export const COST_RATES: Record<string, CostRate> = {
  // ── Text Generation ──
  'gemini-2.0-flash': {
    model: 'gemini-2.0-flash',
    engine: 'gemini',
    type: 'text',
    costPerUnit: 0.0001,
    unit: 'request (avg ~1K tokens)',
    note: 'Input $0.10/1M + Output $0.40/1M tokens',
  },
  'gemini-2.5-pro': {
    model: 'gemini-2.5-pro',
    engine: 'gemini',
    type: 'text',
    costPerUnit: 0.003,
    unit: 'request (avg ~2K tokens)',
    note: 'Input $1.25/1M + Output $10/1M tokens (thinking)',
  },
  'gpt-4o': {
    model: 'gpt-4o',
    engine: 'openai',
    type: 'text',
    costPerUnit: 0.005,
    unit: 'request (avg ~2K tokens)',
    note: 'Input $2.50/1M + Output $10/1M tokens',
  },
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    engine: 'openai',
    type: 'text',
    costPerUnit: 0.0003,
    unit: 'request (avg ~1K tokens)',
    note: 'Input $0.15/1M + Output $0.60/1M tokens',
  },

  // ── Image Generation ──
  'gemini-2.5-flash-image': {
    model: 'gemini-2.5-flash-image',
    engine: 'gemini',
    type: 'image',
    costPerUnit: 0.039,
    unit: 'image',
    note: 'Gemini image generation ~$0.039/image',
  },
  'flux-kontext': {
    model: 'flux-kontext',
    engine: 'replicate',
    type: 'image',
    costPerUnit: 0.03,
    unit: 'image',
    note: 'Replicate Flux ~$0.03/image',
  },

  // ── TTS ──
  'gemini-tts': {
    model: 'gemini-2.5-flash-preview-tts',
    engine: 'gemini',
    type: 'tts',
    costPerUnit: 0.0,
    unit: '1K chars',
    note: 'Free tier: included in Gemini API quota',
  },
  'google-tts': {
    model: 'google-cloud-tts',
    engine: 'google',
    type: 'tts',
    costPerUnit: 0.016,
    unit: '1K chars',
    note: 'Neural2 voices: $16/1M chars',
  },
  elevenlabs: {
    model: 'eleven_multilingual_v2',
    engine: 'elevenlabs',
    type: 'tts',
    costPerUnit: 0.3,
    unit: '1K chars',
    note: 'ElevenLabs: ~$0.30/1K chars (depends on plan)',
  },
  'edge-tts': {
    model: 'edge-tts',
    engine: 'microsoft',
    type: 'tts',
    costPerUnit: 0,
    unit: '1K chars',
    note: 'FREE — Microsoft Edge TTS, runs locally',
  },
  'fish-speech': {
    model: 'fish-speech',
    engine: 'local',
    type: 'tts',
    costPerUnit: 0,
    unit: '1K chars',
    note: 'FREE — Local GPU (electricity cost only)',
  },

  // ── Video ──
  veo3: {
    model: 'veo-3.0',
    engine: 'google',
    type: 'video',
    costPerUnit: 0.5,
    unit: 'video clip',
    note: 'Google Veo 3 ~$0.50/clip',
  },
  veo3_fast: {
    model: 'veo-3.0-fast',
    engine: 'google',
    type: 'video',
    costPerUnit: 0.25,
    unit: 'video clip',
    note: 'Google Veo 3 Fast ~$0.25/clip',
  },
  'kie-runway': {
    model: 'runway-gen3',
    engine: 'kie.ai',
    type: 'video',
    costPerUnit: 0.4,
    unit: 'video clip',
    note: 'Kie.ai Runway wrapper ~$0.40/clip',
  },
};

// ─── Cost Entry ────────────────────────────────────────────

export interface CostEntry {
  id: string;
  timestamp: number;
  /** Pipeline step: scriptWriter, storyboard, imageGen, voiceover, assembly, aiSceneGen, missingImageGen */
  step: string;
  /** Model key matching COST_RATES */
  model: string;
  /** Engine name for grouping */
  engine: string;
  /** Type of operation */
  type: 'text' | 'image' | 'tts' | 'video';
  /** Calculated cost in USD */
  cost: number;
  /** Quantity (e.g., 1 image, 350 chars, 1 request) */
  quantity: number;
  /** Unit description */
  unit: string;
  /** Optional run ID for linking to pipeline runs */
  runId?: string;
  /** Optional channel ID */
  channelId?: string;
  /** Optional detail (prompt snippet, scene number, etc.) */
  detail?: string;
}

// ─── Storage ───────────────────────────────────────────────

const STORAGE_KEY = 'yt-pipeline-cost-tracker';
const MAX_ENTRIES = 5000;

function loadEntries(): CostEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: CostEntry[]): void {
  // Keep only last MAX_ENTRIES to prevent localStorage bloat
  const trimmed = entries.slice(-MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// ─── In-memory cache ───────────────────────────────────────

let _entries: CostEntry[] | null = null;

function getEntries(): CostEntry[] {
  if (!_entries) _entries = loadEntries();
  return _entries;
}

// ─── Public API ────────────────────────────────────────────

/** Track a single API call cost */
export function trackCost(params: {
  step: string;
  model: string;
  type: 'text' | 'image' | 'tts' | 'video';
  /** For text: 1 request. For image: number of images. For TTS: char count. For video: clip count. */
  quantity: number;
  runId?: string;
  channelId?: string;
  detail?: string;
}): CostEntry {
  const rate = COST_RATES[params.model];

  let cost = 0;
  let unit = 'unit';
  let engine = 'unknown';

  if (rate) {
    engine = rate.engine;
    unit = rate.unit;
    if (params.type === 'tts') {
      // TTS cost is per 1K chars, quantity is char count
      cost = (params.quantity / 1000) * rate.costPerUnit;
    } else {
      // For text/image/video — quantity is number of units
      cost = params.quantity * rate.costPerUnit;
    }
  }

  const entry: CostEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    step: params.step,
    model: params.model,
    engine,
    type: params.type,
    cost,
    quantity: params.quantity,
    unit,
    runId: params.runId,
    channelId: params.channelId,
    detail: params.detail,
  };

  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);

  return entry;
}

/** Get all cost entries, optionally filtered */
export function getCostEntries(filter?: {
  channelId?: string;
  runId?: string;
  step?: string;
  type?: string;
  fromDate?: number;
  toDate?: number;
}): CostEntry[] {
  let entries = getEntries();
  if (filter) {
    if (filter.channelId) entries = entries.filter((e) => e.channelId === filter.channelId);
    if (filter.runId) entries = entries.filter((e) => e.runId === filter.runId);
    if (filter.step) entries = entries.filter((e) => e.step === filter.step);
    if (filter.type) entries = entries.filter((e) => e.type === filter.type);
    if (filter.fromDate) entries = entries.filter((e) => e.timestamp >= filter.fromDate!);
    if (filter.toDate) entries = entries.filter((e) => e.timestamp <= filter.toDate!);
  }
  return entries;
}

/** Get summary stats */
export function getCostSummary(filter?: Parameters<typeof getCostEntries>[0]) {
  const entries = getCostEntries(filter);

  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
  const totalCalls = entries.length;

  // By step
  const byStep: Record<string, { count: number; cost: number }> = {};
  for (const e of entries) {
    if (!byStep[e.step]) byStep[e.step] = { count: 0, cost: 0 };
    byStep[e.step].count++;
    byStep[e.step].cost += e.cost;
  }

  // By model
  const byModel: Record<string, { count: number; cost: number }> = {};
  for (const e of entries) {
    if (!byModel[e.model]) byModel[e.model] = { count: 0, cost: 0 };
    byModel[e.model].count++;
    byModel[e.model].cost += e.cost;
  }

  // By type
  const byType: Record<string, { count: number; cost: number }> = {};
  for (const e of entries) {
    if (!byType[e.type]) byType[e.type] = { count: 0, cost: 0 };
    byType[e.type].count++;
    byType[e.type].cost += e.cost;
  }

  // By day (last 30 days)
  const byDay: Record<string, { count: number; cost: number }> = {};
  for (const e of entries) {
    const day = new Date(e.timestamp).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { count: 0, cost: 0 };
    byDay[day].count++;
    byDay[day].cost += e.cost;
  }

  return { totalCost, totalCalls, byStep, byModel, byType, byDay, entries };
}

/** Clear all cost data */
export function clearCostData(): void {
  _entries = [];
  localStorage.removeItem(STORAGE_KEY);
}

/** Export cost data as JSON */
export function exportCostData(): string {
  return JSON.stringify(getEntries(), null, 2);
}

/** Force reload from localStorage */
export function reloadCostData(): void {
  _entries = null;
}

/** Get the cost rate info for a model (for UI display) */
export function getCostRate(model: string): CostRate | undefined {
  return COST_RATES[model];
}

// ─── Backfill from existing runs ───────────────────────────

const BACKFILL_KEY = 'yt-pipeline-cost-backfilled';

interface BackfillableRun {
  id: string;
  channelId: string | null;
  startedAt: string;
  completedSteps?: string[];
  input: { model?: string; voiceoverEngine?: string; topic?: string };
  result?: { files: Record<string, unknown> };
}

/** Scan existing runs and backfill cost entries for those not yet tracked */
export function backfillFromRuns(runs: BackfillableRun[]): number {
  // Check which runs were already backfilled
  const backfilled = new Set<string>();
  try {
    const raw = localStorage.getItem(BACKFILL_KEY);
    if (raw) for (const id of JSON.parse(raw)) backfilled.add(id as string);
  } catch {
    /* ignore */
  }

  // Also check if any existing entries already reference these run IDs
  const existingRunIds = new Set(
    getEntries()
      .map((e) => e.runId)
      .filter(Boolean)
  );

  let added = 0;

  for (const run of runs) {
    if (backfilled.has(run.id) || existingRunIds.has(run.id)) continue;
    if (!run.result?.files) continue;

    const ts = new Date(run.startedAt).getTime() || Date.now();
    const channelId = run.channelId || undefined;
    const files = run.result.files;

    // Script Writer
    if (files['script.json'] || files['script.txt']) {
      const scriptJson = files['script.json'] as { model?: string; wordCount?: number } | undefined;
      const model = scriptJson?.model || run.input.model || 'gemini-2.0-flash';
      const entry: CostEntry = {
        id: `bf-${run.id}-script`,
        timestamp: ts,
        step: 'scriptWriter',
        model,
        engine: COST_RATES[model]?.engine || 'gemini',
        type: 'text',
        cost: COST_RATES[model]?.costPerUnit || 0.0001,
        quantity: 1,
        unit: 'request',
        runId: run.id,
        channelId,
        detail: `${scriptJson?.wordCount || '?'} words (backfill)`,
      };
      getEntries().push(entry);
      added++;
    }

    // Storyboard
    if (files['storyboard.json']) {
      const sb = files['storyboard.json'] as
        | { scenes?: unknown[]; totalScenes?: number }
        | undefined;
      const sceneCount = sb?.scenes?.length || sb?.totalScenes || 0;
      const model = 'gemini-2.0-flash';
      const entry: CostEntry = {
        id: `bf-${run.id}-storyboard`,
        timestamp: ts + 1,
        step: 'storyboard',
        model,
        engine: 'gemini',
        type: 'text',
        cost: COST_RATES[model]?.costPerUnit || 0.0001,
        quantity: 1,
        unit: 'request',
        runId: run.id,
        channelId,
        detail: `${sceneCount} scenes (backfill)`,
      };
      getEntries().push(entry);
      added++;
    }

    // Image Gen
    if (files['images.json']) {
      const img = files['images.json'] as { images?: unknown[]; successCount?: number } | undefined;
      const imageCount = img?.images?.length || img?.successCount || 0;
      if (imageCount > 0) {
        const rate = COST_RATES['gemini-2.5-flash-image'];
        const entry: CostEntry = {
          id: `bf-${run.id}-images`,
          timestamp: ts + 2,
          step: 'imageGen',
          model: 'gemini-2.5-flash-image',
          engine: 'gemini',
          type: 'image',
          cost: (rate?.costPerUnit || 0.039) * imageCount,
          quantity: imageCount,
          unit: 'images',
          runId: run.id,
          channelId,
          detail: `${imageCount} images (backfill)`,
        };
        getEntries().push(entry);
        added++;
      }
    }

    // Voiceover
    if (files['voiceover.json']) {
      const vo = files['voiceover.json'] as
        | { clips?: { charCount?: number }[]; engine?: string; totalDuration?: number }
        | undefined;
      const engine = vo?.engine || run.input.voiceoverEngine || 'edge-tts';
      const totalChars = vo?.clips?.reduce((s, c) => s + (c.charCount || 0), 0) || 0;
      const modelKey = engine === 'gemini-tts' ? 'gemini-tts' : engine;
      const rate = COST_RATES[modelKey];
      const cost = rate ? (totalChars / 1000) * rate.costPerUnit : 0;
      const entry: CostEntry = {
        id: `bf-${run.id}-voiceover`,
        timestamp: ts + 3,
        step: 'voiceover',
        model: modelKey,
        engine: rate?.engine || engine,
        type: 'tts',
        cost,
        quantity: totalChars,
        unit: 'chars',
        runId: run.id,
        channelId,
        detail: `${totalChars} chars, ~${vo?.totalDuration || '?'}s (backfill)`,
      };
      getEntries().push(entry);
      added++;
    }

    backfilled.add(run.id);
  }

  if (added > 0) {
    saveEntries(getEntries());
    localStorage.setItem(BACKFILL_KEY, JSON.stringify([...backfilled]));
  }

  return added;
}
