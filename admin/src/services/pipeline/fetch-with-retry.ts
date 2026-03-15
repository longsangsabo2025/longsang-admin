/**
 * Shared fetch-with-retry utility for pipeline agents.
 * Retries on transient Gemini/server errors (500, 503, INTERNAL) with backoff.
 */
import { pipelineHeaders } from './api-client';

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  /** Push log entries into the run log */
  onRetry?: (attempt: number, errMsg: string, delayMs: number) => void;
}

const RETRYABLE_PATTERNS = ['internal', 'INTERNAL', '500', '503', 'retry'];

function isRetryable(msg: string): boolean {
  return RETRYABLE_PATTERNS.some((p) => msg.includes(p));
}

/**
 * POST JSON to `url` with automatic retry on transient errors.
 * Returns the raw Response on success.
 * Throws on non-retryable errors or after all retries exhausted.
 */
export async function fetchWithRetry(
  url: string,
  body: unknown,
  opts: RetryOptions = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelayMs = 5000, onRetry } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: pipelineHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) return res;

    const errBody = await res.json().catch(() => ({}));
    const errMsg = (errBody as { error?: string }).error || `Pipeline API error ${res.status}`;

    if (isRetryable(errMsg) && attempt < maxRetries) {
      const delay = (attempt + 1) * baseDelayMs;
      onRetry?.(attempt + 1, errMsg, delay);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    throw new Error(errMsg);
  }

  // Should not reach here, but satisfy TypeScript
  throw new Error('fetchWithRetry: all retries exhausted');
}
