/**
 * Supabase Stable - just re-exports main client
 */

import { supabase, checkConnectionHealth, isConnectionHealthy } from './supabase';

export { supabase, checkConnectionHealth, isConnectionHealthy };
export const supabaseStable = supabase;
export const getSupabaseClient = () => supabase;
export const createStableSupabaseClient = () => supabase;

export default supabase;
