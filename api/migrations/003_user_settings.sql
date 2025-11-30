-- ═══════════════════════════════════════════════════════════
-- Migration: Create user_settings table for AI Workspace
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  settings_key TEXT NOT NULL,
  settings_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one setting per user per key
  UNIQUE(user_id, settings_key)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(settings_key);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_settings_timestamp ON user_settings;
CREATE TRIGGER trigger_update_user_settings_timestamp
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_timestamp();

-- Enable RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own settings
CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' 
         OR user_id = 'default-longsang-user');

-- Grant permissions
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON user_settings TO anon;
GRANT ALL ON user_settings TO service_role;

-- ═══════════════════════════════════════════════════════════
-- Sample data structure for ai_settings key:
-- {
--   "model": "auto",
--   "temperature": 0.7,
--   "maxTokens": 2000,
--   "streaming": true,
--   "provider": "auto",
--   "agentPrompts": {
--     "course": { "systemPrompt": "...", "enabled": true },
--     "financial": { "systemPrompt": "...", "enabled": true },
--     ...
--   }
-- }
-- ═══════════════════════════════════════════════════════════

SELECT 'Migration complete! user_settings table created.' as status;
