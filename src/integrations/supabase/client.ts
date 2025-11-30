// This file re-exports the singleton Supabase client to avoid multiple instances
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Export stable client as default (with retry logic and health check)
export { supabaseStable as supabase, supabaseStable, supabase as supabaseLegacy } from "@/lib/supabase-stable";
export type { Database } from "./types";
