-- Avatar Profiles Schema for AI Avatar Studio
-- Run this after the ai_channel_schema migration

-- Avatar profiles table
CREATE TABLE IF NOT EXISTS avatar_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  brand TEXT,
  personality TEXT,
  speaking_style TEXT,
  languages JSONB DEFAULT '["Vietnamese"]'::jsonb,
  portraits JSONB DEFAULT '[]'::jsonb,
  brain_character_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatar settings (active profile, etc)
CREATE TABLE IF NOT EXISTS avatar_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  active_profile_id TEXT REFERENCES avatar_profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_avatar_profiles_name ON avatar_profiles(name);
CREATE INDEX IF NOT EXISTS idx_avatar_profiles_created ON avatar_profiles(created_at DESC);

-- Disable RLS (as user requested)
ALTER TABLE avatar_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON avatar_profiles TO authenticated, anon, service_role;
GRANT ALL ON avatar_settings TO authenticated, anon, service_role;
