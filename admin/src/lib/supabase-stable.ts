/**
 * Supabase Stable - just re-exports main client
 */

import { checkConnectionHealth, isConnectionHealthy, supabase } from './supabase';

export { checkConnectionHealth, isConnectionHealthy, supabase };
export const supabaseStable = supabase;
export const getSupabaseClient = () => supabase;
export const createStableSupabaseClient = () => supabase;

export default supabase;
