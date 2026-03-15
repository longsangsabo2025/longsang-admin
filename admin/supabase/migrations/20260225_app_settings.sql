-- ============================================
-- APP SETTINGS - Centralized key-value store
-- for all API keys, credentials, and config
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  category TEXT,
  is_secret BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update timestamp on change
CREATE OR REPLACE FUNCTION update_app_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_settings_timestamp ON app_settings;
CREATE TRIGGER trg_app_settings_timestamp
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_timestamp();

-- Disable RLS (admin-only single-user app)
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Index for fast category lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
