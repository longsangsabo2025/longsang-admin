export type EngineType = 'gemini' | 'elevenlabs' | 'google-tts';

export interface PoolEntry {
  key: string;
  engine: string;
  label?: string;
  addedAt: string;
  usageCount: number;
  lastUsedAt?: string;
  lastError?: string;
  disabled: boolean;
  disabledAt?: string;   // timestamp when disabled → for auto-recovery
  consecutiveErrors: number;
}

const STORAGE_KEY = 'pipeline-api-key-pool';
const DB_KEY = 'pipeline-api-key-pool';      // key in app_settings table
const DB_CATEGORY = 'pipeline';
const AUTO_DISABLE_THRESHOLD = 3;
const AUTO_RECOVER_MS = 60_000; // auto-re-enable disabled keys after 60s

const ENV_FALLBACKS: Record<EngineType, string> = {
  gemini: import.meta.env.VITE_GEMINI_API_KEY as string,
  elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY as string,
  'google-tts': import.meta.env.VITE_GOOGLE_TTS_API_KEY as string,
};

const PINNED_KEY = 'pipeline-api-key-pinned'; // { engine: key }

const _lastIndex = new Map<string, number>();
const _listeners = new Set<() => void>();
let _dbHydrated = false;
let _savingToDb = false;

function loadPins(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '{}'); } catch { return {}; }
}
function savePins(pins: Record<string, string>) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(pins));
  notify();
}

function notify() {
  _listeners.forEach((cb) => cb());
}

function load(): PoolEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(pool: PoolEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
  notify();
  // Fire-and-forget save to Supabase
  saveToDb(pool);
}

// ── Supabase Persistence ──

async function getSupabase() {
  const { supabase } = await import('@/lib/supabase');
  return supabase;
}

async function saveToDb(pool: PoolEntry[]) {
  if (_savingToDb) return; // debounce
  _savingToDb = true;
  try {
    const sb = await getSupabase();
    const { error } = await sb.from('app_settings').upsert({
      key: DB_KEY,
      value: JSON.stringify(pool),
      category: DB_CATEGORY,
      is_secret: true,
    }, { onConflict: 'key' });
    if (error) console.warn('[api-key-pool] DB save failed:', error.message);
  } catch (err) {
    console.warn('[api-key-pool] DB save error:', err);
  } finally {
    _savingToDb = false;
  }
}

async function loadFromDb(): Promise<PoolEntry[] | null> {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('app_settings')
      .select('value')
      .eq('key', DB_KEY)
      .single();
    if (error || !data?.value) return null;
    return JSON.parse(data.value);
  } catch {
    return null;
  }
}

/**
 * Hydrate pool from Supabase on first access.
 * Merges DB keys into localStorage (DB is source of truth for keys).
 */
export async function hydrateFromDb(): Promise<void> {
  if (_dbHydrated) return;
  _dbHydrated = true;
  const dbPool = await loadFromDb();
  if (!dbPool || dbPool.length === 0) return;

  const local = load();
  // Merge: DB entries win, add any local-only entries
  const dbKeySet = new Set(dbPool.map(e => `${e.engine}::${e.key}`));
  const merged = [...dbPool];
  for (const entry of local) {
    if (!dbKeySet.has(`${entry.engine}::${entry.key}`)) {
      merged.push(entry);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  notify();
}

export function getPool(): PoolEntry[] {
  return load();
}

export function getPoolForEngine(engine: string): PoolEntry[] {
  const pool = load();
  let changed = false;
  // Auto-recover disabled keys after cooldown
  for (const entry of pool) {
    if (entry.disabled && entry.disabledAt) {
      const elapsed = Date.now() - new Date(entry.disabledAt).getTime();
      if (elapsed >= AUTO_RECOVER_MS) {
        entry.disabled = false;
        entry.consecutiveErrors = 0;
        entry.lastError = undefined;
        entry.disabledAt = undefined;
        changed = true;
      }
    }
  }
  if (changed) save(pool);
  return pool.filter((e) => e.engine === engine && !e.disabled);
}

export function addKey(engine: string, key: string, label?: string) {
  const pool = load();
  if (pool.some((e) => e.engine === engine && e.key === key)) return;
  pool.push({
    key,
    engine,
    label,
    addedAt: new Date().toISOString(),
    usageCount: 0,
    disabled: false,
    consecutiveErrors: 0,
  });
  save(pool);
}

export function removeKey(engine: string, key: string) {
  save(load().filter((e) => !(e.engine === engine && e.key === key)));
}

export function disableKey(engine: string, key: string, reason?: string) {
  const pool = load();
  const entry = pool.find((e) => e.engine === engine && e.key === key);
  if (entry) {
    entry.disabled = true;
    entry.disabledAt = new Date().toISOString();
    if (reason) entry.lastError = reason;
    save(pool);
  }
}

export function enableKey(engine: string, key: string) {
  const pool = load();
  const entry = pool.find((e) => e.engine === engine && e.key === key);
  if (entry) {
    entry.disabled = false;
    entry.disabledAt = undefined;
    entry.consecutiveErrors = 0;
    save(pool);
  }
}

export function pinKey(engine: string, key: string) {
  const pins = loadPins();
  pins[engine] = key;
  savePins(pins);
}

export function unpinKey(engine: string) {
  const pins = loadPins();
  delete pins[engine];
  savePins(pins);
}

export function getPinnedKey(engine: string): string | null {
  return loadPins()[engine] || null;
}

export function getNextKey(engine: string): string | null {
  const available = getPoolForEngine(engine);
  if (available.length === 0) {
    return ENV_FALLBACKS[engine as EngineType] || null;
  }

  // If a key is pinned for this engine, use it
  const pinned = loadPins()[engine];
  const pinnedEntry = pinned ? available.find(e => e.key === pinned) : null;
  if (pinnedEntry) {
    const pool = load();
    const entry = pool.find(e => e.engine === pinnedEntry.engine && e.key === pinnedEntry.key);
    if (entry) { entry.usageCount++; entry.lastUsedAt = new Date().toISOString(); save(pool); }
    return pinnedEntry.key;
  }

  const last = _lastIndex.get(engine) ?? -1;
  const next = (last + 1) % available.length;
  _lastIndex.set(engine, next);

  const picked = available[next];
  const pool = load();
  const entry = pool.find((e) => e.engine === picked.engine && e.key === picked.key);
  if (entry) {
    entry.usageCount++;
    entry.lastUsedAt = new Date().toISOString();
    save(pool);
  }

  return picked.key;
}

export function reportError(engine: string, key: string, error: string) {
  const pool = load();
  const entry = pool.find((e) => e.engine === engine && e.key === key);
  if (entry) {
    entry.consecutiveErrors++;
    entry.lastError = error;
    if (entry.consecutiveErrors >= AUTO_DISABLE_THRESHOLD) {
      entry.disabled = true;
      entry.disabledAt = new Date().toISOString();
    }
    save(pool);
  }
}

export function resetStats() {
  const pool = load();
  for (const entry of pool) {
    entry.usageCount = 0;
    entry.consecutiveErrors = 0;
    entry.lastUsedAt = undefined;
    entry.lastError = undefined;
  }
  save(pool);
}

export function onPoolChange(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

/** Test if a key is valid by making a minimal API call. Returns { ok, error? } */
export async function testKey(engine: string, key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (engine === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        { method: 'GET', signal: AbortSignal.timeout(10000) },
      );
      if (res.ok) return { ok: true };
      const data = await res.json().catch(() => ({}));
      const msg = (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    if (engine === 'elevenlabs') {
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': key },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return { ok: true };
      return { ok: false, error: `HTTP ${res.status}` };
    }
    if (engine === 'google-tts') {
      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?key=${encodeURIComponent(key)}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (res.ok) return { ok: true };
      const data = await res.json().catch(() => ({}));
      const msg = (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    return { ok: false, error: 'Unknown engine' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
