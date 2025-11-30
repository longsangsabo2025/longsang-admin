/**
 * Enhanced Supabase Client với kết nối ổn định
 *
 * Features:
 * - Retry logic khi kết nối thất bại
 * - Connection health check
 * - Auto-reconnect
 * - Error handling tốt hơn
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

// Connection health status
let connectionHealthy = true;
let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Kiểm tra kết nối health (đơn giản hóa)
 */
async function checkConnectionHealth(): Promise<boolean> {
  try {
    if (!supabaseInstance) return false;

    // Simple health check with timeout
    const healthCheckPromise = supabaseInstance.from('projects').select('id').limit(1);

    const timeoutPromise = new Promise<{ error: { message: string } }>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 5000)
    );

    const result = (await Promise.race([healthCheckPromise, timeoutPromise])) as {
      error?: unknown;
    };

    // If no error or error is just "table not found" (which means connection works)
    return !result.error || (result.error as { code?: string })?.code === 'PGRST116';
  } catch {
    return false;
  }
}

/**
 * Retry wrapper cho các query
 */
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Không retry nếu là lỗi logic (400, 401, 403, 404)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status?: number }).status;
        if (status && [400, 401, 403, 404].includes(status)) {
          throw error;
        }
      }

      // Nếu là lần thử cuối, throw error
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.warn(`Query failed, retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`);

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Kiểm tra lại connection health trước khi retry
      connectionHealthy = await checkConnectionHealth();
      if (!connectionHealthy) {
        // Thử recreate client nếu connection không healthy
        console.warn('Connection unhealthy, recreating client...');
        supabaseInstance = null;
        getSupabaseClient();
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Tạo Supabase client với cấu hình tối ưu cho kết nối ổn định
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
      },
      global: {
        headers: {
          'x-client-info': 'longsang-admin-stable',
        },
      },
      db: {
        schema: 'public',
      },
    });

    // Setup health check interval (chỉ chạy ở browser)
    if (typeof window !== 'undefined') {
      setInterval(async () => {
        const now = Date.now();
        if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
          connectionHealthy = await checkConnectionHealth();
          lastHealthCheck = now;

          if (!connectionHealthy) {
            console.warn('⚠️ Supabase connection unhealthy, will retry on next query');
          }
        }
      }, HEALTH_CHECK_INTERVAL);
    }
  }

  return supabaseInstance;
};

/**
 * Wrapper cho Supabase client với retry logic
 */
export const createStableSupabaseClient = () => {
  const client = getSupabaseClient();

  return {
    ...client,

    /**
     * Query với retry logic
     */
    query: async <T = unknown>(
      queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: unknown }>
    ) => {
      return withRetry(async () => {
        const result = await queryFn(client);
        if (result.error) {
          throw result.error;
        }
        return result;
      });
    },

    /**
     * Kiểm tra connection health
     */
    checkHealth: async (): Promise<boolean> => {
      connectionHealthy = await checkConnectionHealth();
      lastHealthCheck = Date.now();
      return connectionHealthy;
    },

    /**
     * Get connection status
     */
    isHealthy: (): boolean => connectionHealthy,

    /**
     * Reset connection (recreate client)
     */
    reset: () => {
      supabaseInstance = null;
      connectionHealthy = true;
      return getSupabaseClient();
    },
  };
};

// Export stable client instance
export const supabaseStable = createStableSupabaseClient();

// Export default instance (backward compatible)
export const supabase = getSupabaseClient();

export default supabase;
