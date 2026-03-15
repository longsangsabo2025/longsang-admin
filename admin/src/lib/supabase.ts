/**
 * Re-export from canonical path for backwards compatibility
 * New code should import from '@/integrations/supabase/client'
 */
export {
  checkConnectionHealth,
  getSupabaseClient,
  isConnectionHealthy,
  supabase,
  supabaseAdmin,
} from '@/integrations/supabase/client';

import { supabase } from '@/integrations/supabase/client';
export default supabase;
