/**
 * 🔌 Pipeline API Client — base fetch helpers & URL config
 */

const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : '';
const API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

export const PIPELINE_BASE = import.meta.env.PROD
  ? 'https://youtube-pipeline-bgey.onrender.com'
  : '/pipeline-api';

/** Fetch from the admin backend (/api/youtube-channels/...) */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  const res = await fetch(`${API_BASE}/api/youtube-channels${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

/** Fetch from the pipeline server directly (via Vite proxy in dev) */
export async function pipelineFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PIPELINE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error((errBody as { error?: string }).error || `Pipeline API error ${res.status}`);
  }
  return res.json();
}
