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
  consecutiveErrors: number;
}

const STORAGE_KEY = 'pipeline-api-key-pool';
const AUTO_DISABLE_THRESHOLD = 3;

const ENV_FALLBACKS: Record<EngineType, string> = {
  gemini: import.meta.env.VITE_GEMINI_API_KEY as string,
  elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY as string,
  'google-tts': import.meta.env.VITE_GOOGLE_TTS_API_KEY as string,
};

const _lastIndex = new Map<string, number>();
const _listeners = new Set<() => void>();

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
}

export function getPool(): PoolEntry[] {
  return load();
}

export function getPoolForEngine(engine: string): PoolEntry[] {
  return load().filter((e) => e.engine === engine && !e.disabled);
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
    if (reason) entry.lastError = reason;
    save(pool);
  }
}

export function enableKey(engine: string, key: string) {
  const pool = load();
  const entry = pool.find((e) => e.engine === engine && e.key === key);
  if (entry) {
    entry.disabled = false;
    entry.consecutiveErrors = 0;
    save(pool);
  }
}

export function getNextKey(engine: string): string | null {
  const available = getPoolForEngine(engine);
  if (available.length === 0) {
    return ENV_FALLBACKS[engine as EngineType] || null;
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
