/**
 * 🔌 Supabase Client - ADMIN ONLY (Canonical Source)
 * Single user admin app - RLS disabled, service key required
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

if (!import.meta.env.VITE_SUPABASE_SERVICE_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[supabase] Missing VITE_SUPABASE_* key in build env. Using fallback anon key.');
}

const globalKey = '__longsang_supabase_client__';
const globalScope = globalThis as unknown as Record<string, unknown>;

const existing = globalScope[globalKey];
export const supabase =
  existing && typeof existing === 'object'
    ? (existing as ReturnType<typeof createClient>)
    : createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'longsang-admin-auth',
        },
        db: { schema: 'public' },
      });

if (!existing) {
  globalScope[globalKey] = supabase;
}

export const supabaseAdmin = supabase;

export const getSupabaseClient = () => supabase;

export const checkConnectionHealth = async () => {
  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

export const isConnectionHealthy = () => true;

export type { Database } from './types';
