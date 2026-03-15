-- =====================================================
-- MULTI-PROJECT SOCIAL MEDIA MANAGEMENT
-- =====================================================
-- Created: Nov 26, 2025
-- Purpose: Support multiple projects with their own social accounts
-- =====================================================

-- =====================================================
-- TABLE: projects
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  color TEXT DEFAULT '#3B82F6', -- Brand color
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- =====================================================
-- TABLE: project_social_accounts
-- Mapping between projects and social media accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS project_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'linkedin', 'threads', 'twitter', 'tiktok', 'telegram', 'discord')),
  account_id TEXT NOT NULL, -- Platform-specific ID (Page ID, IG Account ID, etc.)
  account_name TEXT NOT NULL,
  account_username TEXT, -- @username if applicable
  account_avatar TEXT,
  account_type TEXT DEFAULT 'page', -- page, profile, channel, group
  is_primary BOOLEAN DEFAULT false, -- Primary account for this platform
  is_active BOOLEAN DEFAULT true,
  credentials_ref UUID REFERENCES social_media_credentials(id), -- Link to master credentials
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique platform per project
  UNIQUE(project_id, platform, account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_social_accounts_project ON project_social_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_social_accounts_platform ON project_social_accounts(platform);

-- =====================================================
-- TABLE: project_posts
-- Track posts made for each project
-- =====================================================
CREATE TABLE IF NOT EXISTS project_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of media URLs
  hashtags TEXT[],
  link_url TEXT,
  platforms TEXT[] NOT NULL, -- Platforms posted to
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}', -- Results from each platform
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_posts_project ON project_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_posts_status ON project_posts(status);
CREATE INDEX IF NOT EXISTS idx_project_posts_scheduled ON project_posts(scheduled_at) WHERE status = 'scheduled';

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_posts ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Project social accounts policies
CREATE POLICY "Users can view their project social accounts" ON project_social_accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_social_accounts.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage their project social accounts" ON project_social_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_social_accounts.project_id AND projects.user_id = auth.uid())
  );

-- Project posts policies
CREATE POLICY "Users can view their project posts" ON project_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their project posts" ON project_posts
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- Updated at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_social_accounts_updated_at
  BEFORE UPDATE ON project_social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_posts_updated_at
  BEFORE UPDATE ON project_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
