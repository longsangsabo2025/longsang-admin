/**
 * Shared Memory — Cross-agent state with Supabase checkpointing
 * 
 * In-memory for speed + async persist to Supabase for resume capability.
 * Each pipeline run has its own memory namespace.
 * 
 * Checkpointing: After each stage, memory is saved to Supabase.
 * If a pipeline crashes at Stage 5, it can resume from Stage 5 data.
 */
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

class SharedMemory {
  constructor() {
    this.store = new Map(); // namespace → { key → value }
    this.global = new Map(); // cross-pipeline shared state
    this.checkpointDir = process.env.CHECKPOINT_DIR || './output/.checkpoints';
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
  }

  /**
   * Set value in pipeline namespace
   */
  set(namespace, key, value) {
    if (!this.store.has(namespace)) {
      this.store.set(namespace, new Map());
    }
    this.store.get(namespace).set(key, {
      value,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get value from pipeline namespace
   */
  get(namespace, key) {
    const ns = this.store.get(namespace);
    if (!ns) return null;
    const entry = ns.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Get all data in a namespace
   */
  getAll(namespace) {
    const ns = this.store.get(namespace);
    if (!ns) return {};
    const result = {};
    for (const [key, entry] of ns) {
      result[key] = entry.value;
    }
    return result;
  }

  /**
   * Global memory (persists across pipelines)
   */
  setGlobal(key, value) {
    this.global.set(key, { value, updatedAt: Date.now() });
  }

  getGlobal(key) {
    const entry = this.global.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Clear a namespace
   */
  clearNamespace(namespace) {
    this.store.delete(namespace);
  }

  /**
   * Export all data (for persistence)
   */
  export(namespace) {
    return {
      namespace,
      data: this.getAll(namespace),
      exportedAt: new Date().toISOString(),
    };
  }

  // ─── CHECKPOINTING ────────────────────────────────────────

  /**
   * Save checkpoint after a pipeline stage completes.
   * Saves to local file + Supabase (if configured).
   */
  async checkpoint(namespace, stageIndex, stageName) {
    const data = this.export(namespace);
    data.stageIndex = stageIndex;
    data.stageName = stageName;
    data.checkpointedAt = new Date().toISOString();

    // 1. Local file checkpoint (always works)
    try {
      await mkdir(this.checkpointDir, { recursive: true });
      const filePath = join(this.checkpointDir, `${namespace}.json`);
      await writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn(`[Memory] Local checkpoint failed: ${err.message}`);
    }

    // 2. Supabase checkpoint (if configured)
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        await this._supabaseCheckpoint(namespace, data);
      } catch (err) {
        console.warn(`[Memory] Supabase checkpoint failed: ${err.message}`);
      }
    }

    return data;
  }

  /**
   * Restore pipeline state from checkpoint.
   * Tries Supabase first, then local file.
   * Returns { stageIndex, stageName } or null if no checkpoint found.
   */
  async restore(namespace) {
    let data = null;

    // 1. Try Supabase
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        data = await this._supabaseRestore(namespace);
      } catch (err) {
        console.warn(`[Memory] Supabase restore failed: ${err.message}`);
      }
    }

    // 2. Fallback to local file
    if (!data) {
      try {
        const filePath = join(this.checkpointDir, `${namespace}.json`);
        if (existsSync(filePath)) {
          const raw = await readFile(filePath, 'utf-8');
          data = JSON.parse(raw);
        }
      } catch (err) {
        console.warn(`[Memory] Local restore failed: ${err.message}`);
      }
    }

    if (!data) return null;

    // Rebuild in-memory store from checkpoint
    if (data.data) {
      for (const [key, value] of Object.entries(data.data)) {
        this.set(namespace, key, value);
      }
    }

    return {
      stageIndex: data.stageIndex,
      stageName: data.stageName,
      checkpointedAt: data.checkpointedAt,
    };
  }

  /**
   * List all available checkpoints
   */
  async listCheckpoints() {
    const checkpoints = [];

    // Supabase
    if (this.supabaseUrl && this.supabaseKey) {
      try {
        const res = await fetch(
          `${this.supabaseUrl}/rest/v1/pipeline_checkpoints?select=pipeline_id,stage_index,stage_name,checkpointed_at&order=checkpointed_at.desc&limit=20`,
          { headers: this._supabaseHeaders() }
        );
        if (res.ok) {
          const rows = await res.json();
          checkpoints.push(...rows.map(r => ({ ...r, source: 'supabase' })));
        }
      } catch {}
    }

    // Local files
    try {
      const { readdirSync } = await import('fs');
      if (existsSync(this.checkpointDir)) {
        const files = readdirSync(this.checkpointDir).filter(f => f.endsWith('.json'));
        for (const f of files) {
          checkpoints.push({
            pipeline_id: f.replace('.json', ''),
            source: 'local',
          });
        }
      }
    } catch {}

    return checkpoints;
  }

  // ─── SUPABASE HELPERS ─────────────────────────────────────

  _supabaseHeaders() {
    return {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    };
  }

  async _supabaseCheckpoint(namespace, data) {
    const payload = {
      pipeline_id: namespace,
      stage_index: data.stageIndex,
      stage_name: data.stageName,
      memory_data: data.data,
      checkpointed_at: data.checkpointedAt,
    };

    // Upsert (insert or update)
    const res = await fetch(
      `${this.supabaseUrl}/rest/v1/pipeline_checkpoints`,
      {
        method: 'POST',
        headers: {
          ...this._supabaseHeaders(),
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Table might not exist yet — that's ok, local file is the fallback
      if (text.includes('relation') && text.includes('does not exist')) {
        console.warn('[Memory] pipeline_checkpoints table not created yet — using local file only');
        return;
      }
      throw new Error(`Supabase ${res.status}: ${text}`);
    }
  }

  async _supabaseRestore(namespace) {
    const res = await fetch(
      `${this.supabaseUrl}/rest/v1/pipeline_checkpoints?pipeline_id=eq.${encodeURIComponent(namespace)}&limit=1`,
      { headers: this._supabaseHeaders() }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      namespace: row.pipeline_id,
      data: row.memory_data,
      stageIndex: row.stage_index,
      stageName: row.stage_name,
      checkpointedAt: row.checkpointed_at,
    };
  }
}

export const memory = new SharedMemory();
export default memory;
