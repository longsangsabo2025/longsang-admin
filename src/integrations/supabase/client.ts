// This file re-exports the singleton Supabase client to avoid multiple instances
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export { supabase } from "@/lib/supabase";
export type { Database } from "./types";
