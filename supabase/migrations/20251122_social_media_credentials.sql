-- ================================================
-- SOCIAL MEDIA CREDENTIALS TABLE
-- ================================================
-- Secure storage for social media platform credentials

-- Create table for social media credentials
CREATE TABLE IF NOT EXISTS social_media_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'telegram', 'discord')),

  -- Encrypted credentials (store as JSONB for flexibility)
  credentials JSONB NOT NULL,

  -- Additional settings
  settings JSONB DEFAULT '{}'::jsonb,

  -- Connection status
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,

  -- Account info (cached from platform)
  account_info JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per user per platform
  UNIQUE(user_id, platform)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_credentials_user_platform
  ON social_media_credentials(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_social_credentials_active
  ON social_media_credentials(user_id, is_active);

-- Enable RLS
ALTER TABLE social_media_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own credentials"
  ON social_media_credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON social_media_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON social_media_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON social_media_credentials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all
CREATE POLICY "Service role can access all credentials"
  ON social_media_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_social_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_credentials_timestamp
  BEFORE UPDATE ON social_media_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_social_credentials_timestamp();

-- Comments
COMMENT ON TABLE social_media_credentials IS 'Stores encrypted credentials for social media platforms';
COMMENT ON COLUMN social_media_credentials.credentials IS 'Encrypted JSONB containing platform-specific credentials (tokens, keys, etc.)';
COMMENT ON COLUMN social_media_credentials.account_info IS 'Cached account information (name, avatar, followers, etc.)';
