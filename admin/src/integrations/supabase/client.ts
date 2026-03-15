/**
 * 🔌 Supabase Client - ADMIN ONLY (Canonical Source)
 * Single user admin app - RLS disabled, service key required
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'longsang-admin-auth',
  },
  db: { schema: 'public' },
});

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
