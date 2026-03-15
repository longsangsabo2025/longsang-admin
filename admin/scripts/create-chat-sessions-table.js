/**
 * Create chat_sessions table in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  // Use service role key for admin operations
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.JrEpE7YSXE4c_FN6X8HPzjM2scdEer76C0_HVzsMFKI'
);

async function createChatSessionsTable() {
  console.log('Creating chat_sessions table...');
  
  // First, try to insert a test record - this will fail if table doesn't exist
  // but helps us check the current state
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .limit(1);
  
  if (error && error.message.includes('does not exist')) {
    console.log('Table does not exist. Please run the following SQL in Supabase Dashboard:');
    console.log(`
-- Run this in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  name TEXT NOT NULL DEFAULT 'New Chat',
  messages JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for anon key)
CREATE POLICY "Allow all operations on chat_sessions" ON public.chat_sessions
  FOR ALL USING (true) WITH CHECK (true);
    `);
  } else if (error) {
    console.log('Other error:', error.message);
  } else {
    console.log('✅ Table already exists! Records found:', data.length);
  }
}

createChatSessionsTable();
