// This file re-exports the singleton Supabase client to avoid multiple instances
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Export stable client as default (with retry logic and health check)
// The stable client includes all methods from regular Supabase client plus retry logic
import { supabaseStable, getSupabaseClient } from "@/lib/supabase-stable";

// Export stable client as supabase (backward compatible)
// Since supabaseStable spreads the original client, it has all the same methods
// All existing code importing { supabase } will automatically use stable client with retry logic
export const supabase = supabaseStable;

// Also export stable client directly for explicit usage
export { supabaseStable };

// Export legacy client if needed (not recommended - use stable client instead)
export const supabaseLegacy = getSupabaseClient();

export type { Database } from "./types";
