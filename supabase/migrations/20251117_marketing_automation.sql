-- Marketing Automation Database Schema
-- Stores campaigns, workflows, and analytics for n8n integration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CAMPAIGNS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Campaign Info
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('social_media', 'email', 'whatsapp', 'multi_channel')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),

  -- Content
  content TEXT,
  platforms TEXT[], -- ['linkedin', 'facebook', 'twitter']

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Targeting
  target_audience JSONB,

  -- n8n Integration
  n8n_workflow_id VARCHAR(255),
  n8n_execution_id VARCHAR(255),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CAMPAIGN POSTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS campaign_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,

  -- Post Details
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255), -- ID from the platform
  content TEXT,
  image_url TEXT,
  post_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'deleted')),
  posted_at TIMESTAMPTZ,

  -- Metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- EMAIL CAMPAIGNS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,

  -- Email Details
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  template_id VARCHAR(255),

  -- Recipients
  recipient_type VARCHAR(50) CHECK (recipient_type IN ('list', 'segment', 'individual')),
  recipient_list_id VARCHAR(255),
  recipients_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Metrics
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,

  -- Mautic Integration
  mautic_campaign_id VARCHAR(255),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- LEADS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lead Info
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  name VARCHAR(255),
  company VARCHAR(255),

  -- Lead Scoring
  lead_score INTEGER DEFAULT 0,
  lead_status VARCHAR(50) DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),

  -- Source
  source VARCHAR(100), -- 'website', 'linkedin', 'facebook', etc.
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,

  -- Engagement
  first_contact_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,

  -- Tags & Segments
  tags TEXT[],
  interests TEXT[],

  -- Custom Fields
  custom_fields JSONB,

  -- n8n Workflow
  nurturing_workflow_id VARCHAR(255),
  nurturing_status VARCHAR(50),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE (user_id, email)
);

-- ================================================
-- MARKETING WORKFLOW EXECUTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS marketing_workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Workflow Info
  workflow_name VARCHAR(255) NOT NULL,
  workflow_id VARCHAR(255) NOT NULL,
  execution_id VARCHAR(255) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'success', 'error', 'waiting')),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Data
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,

  -- Related Entities
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SOCIAL MEDIA ACCOUNTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Account Info
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  account_url TEXT,

  -- Authentication
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE (user_id, platform, account_id)
);

-- ================================================
-- CONTENT LIBRARY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content Info
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(50) CHECK (content_type IN ('post', 'article', 'video', 'image', 'carousel')),

  -- Media
  image_url TEXT,
  video_url TEXT,
  media_urls TEXT[],

  -- Categorization
  tags TEXT[],
  category VARCHAR(100),

  -- Usage
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Performance
  avg_engagement NUMERIC(10, 2) DEFAULT 0,
  best_platform VARCHAR(50),

  -- AI Generated
  is_ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- AUTOMATED WORKFLOWS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS automated_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Workflow Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(100) NOT NULL, -- 'lead_nurturing', 'content_repurposing', etc.

  -- n8n Integration
  n8n_workflow_id VARCHAR(255) NOT NULL,

  -- Configuration
  trigger_type VARCHAR(100), -- 'schedule', 'webhook', 'event'
  trigger_config JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,

  -- Metrics
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_workflows ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own campaigns" ON marketing_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON marketing_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON marketing_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON marketing_campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own posts" ON campaign_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM marketing_campaigns WHERE id = campaign_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own emails" ON email_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emails" ON email_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emails" ON email_campaigns FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own leads" ON marketing_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON marketing_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON marketing_leads FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own executions" ON marketing_workflow_executions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON social_media_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON social_media_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON social_media_accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content" ON content_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON content_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON content_library FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workflows" ON automated_workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workflows" ON automated_workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflows" ON automated_workflows FOR UPDATE USING (auth.uid() = user_id);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Update campaign metrics
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'campaign_posts' THEN
    UPDATE marketing_campaigns
    SET updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_metrics
AFTER INSERT OR UPDATE ON campaign_posts
FOR EACH ROW
EXECUTE FUNCTION update_campaign_metrics();

-- Update lead score on engagement
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score = NEW.lead_score + 10; -- Simple scoring, can be made more complex
  NEW.last_contact_at = NOW();
  NEW.contact_count = NEW.contact_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON campaign_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON email_campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON marketing_leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- SAMPLE DATA FOR TESTING
-- ================================================

-- Insert sample workflow templates (commented out - run manually after creating a user)
-- INSERT INTO automated_workflows (user_id, name, description, workflow_type, n8n_workflow_id, trigger_type, is_active) VALUES
--   ((SELECT id FROM auth.users LIMIT 1), 'Multi-Platform Social Campaign', 'Post to LinkedIn, Facebook, and Twitter simultaneously', 'social_media', 'social-media-campaign', 'webhook', true),
--   ((SELECT id FROM auth.users LIMIT 1), 'Email Welcome Series', 'Automated 5-email welcome series for new leads', 'lead_nurturing', 'lead-nurturing', 'event', true),
--   ((SELECT id FROM auth.users LIMIT 1), 'Content Repurposing Bot', 'Turn blog posts into social media content', 'content_repurposing', 'content-repurposing', 'schedule', true)
-- ON CONFLICT DO NOTHING;

COMMENT ON TABLE marketing_campaigns IS 'Stores all marketing campaigns with multi-platform support';
COMMENT ON TABLE campaign_posts IS 'Individual posts created as part of campaigns';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns integrated with Mautic';
COMMENT ON TABLE marketing_leads IS 'Lead database with scoring and nurturing';
COMMENT ON TABLE marketing_workflow_executions IS 'Tracks n8n workflow executions for marketing automation';
COMMENT ON TABLE social_media_accounts IS 'Connected social media accounts';
COMMENT ON TABLE content_library IS 'Reusable content library';
COMMENT ON TABLE automated_workflows IS 'Automated workflow configurations';

-- ================================================
-- INDEXES (Created after all tables)
-- ================================================

-- Marketing Campaigns Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON marketing_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON marketing_campaigns(scheduled_at);

-- Campaign Posts Indexes
CREATE INDEX IF NOT EXISTS idx_posts_campaign ON campaign_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON campaign_posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON campaign_posts(status);

-- Email Campaigns Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- Marketing Leads Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON marketing_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_user ON marketing_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON marketing_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON marketing_leads(lead_score);

-- Marketing Workflow Executions Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_executions_workflow ON marketing_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_status ON marketing_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_marketing_executions_user ON marketing_workflow_executions(user_id);

-- Social Media Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user ON social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON social_media_accounts(platform);

-- Content Library Indexes
CREATE INDEX IF NOT EXISTS idx_content_user ON content_library(user_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_tags ON content_library(tags);

-- Automated Workflows Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user ON automated_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON automated_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON automated_workflows(is_active);
