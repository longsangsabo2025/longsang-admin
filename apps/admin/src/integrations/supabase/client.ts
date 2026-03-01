/**
 * Supabase - ONE client, service key
 */
import { supabase } from '@/lib/supabase';

export { supabase };
export const supabaseAdmin = supabase;
export type { Database } from './types';
