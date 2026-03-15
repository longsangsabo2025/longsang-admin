-- AI Influencer Channel - Full Database Schema
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. AI CHANNELS - Thông tin kênh AI Influencer
-- ============================================
CREATE TABLE IF NOT EXISTS ai_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT DEFAULT 'admin',
  
  -- Basic Info
  name TEXT NOT NULL,
  handle TEXT UNIQUE,
  description TEXT,
  niche TEXT,
  
  -- AI Influencer Character
  influencer_name TEXT,
  influencer_persona TEXT,
  influencer_style TEXT,
  influencer_voice TEXT,
  
  -- Visual Identity
  avatar_url TEXT,
  banner_url TEXT,
  brand_colors JSONB DEFAULT '[]'::jsonb,
  
  -- Platform Settings
  platforms JSONB DEFAULT '["youtube_shorts", "tiktok", "reels"]'::jsonb,
  default_aspect_ratio TEXT DEFAULT '9:16',
  
  -- AI Settings
  ai_models JSONB DEFAULT '{}'::jsonb,
  content_guidelines TEXT,
  
  -- Stats
  total_videos INTEGER DEFAULT 0,
  total_series INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AI SERIES - Series/Playlist cho mỗi kênh
-- ============================================
CREATE TABLE IF NOT EXISTS ai_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES ai_channels(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  hook TEXT,
  
  -- Content Planning
  target_episodes INTEGER DEFAULT 10,
  episode_duration INTEGER DEFAULT 60, -- seconds
  posting_schedule JSONB DEFAULT '{"frequency": "daily", "time": "18:00"}'::jsonb,
  
  -- Theme & Style
  theme TEXT,
  visual_style TEXT,
  music_style TEXT,
  
  -- Template
  intro_template TEXT,
  outro_template TEXT,
  cta_template TEXT,
  
  -- AI Prompts
  scene_prompt_template TEXT,
  image_style_prompt TEXT,
  
  -- Reference Images (từ Brain Library)
  reference_image_ids TEXT[] DEFAULT '{}',
  
  -- Stats
  total_episodes INTEGER DEFAULT 0,
  published_episodes INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. AI EPISODES - Từng tập trong series
-- ============================================
CREATE TABLE IF NOT EXISTS ai_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES ai_series(id) ON DELETE CASCADE,
  channel_id UUID,
  
  -- Episode Info
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  hook TEXT,
  
  -- Script
  script_content TEXT,
  script_version INTEGER DEFAULT 1,
  
  -- Hashtags & SEO
  hashtags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  published_date TIMESTAMPTZ,
  
  -- Stats after publish
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'idea',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. VIDEO PRODUCTIONS - Production work cho mỗi episode
-- ============================================
CREATE TABLE IF NOT EXISTS video_productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES ai_episodes(id) ON DELETE SET NULL,
  channel_id UUID,
  series_id UUID,
  user_id TEXT DEFAULT 'admin',
  
  -- Episode Info (denormalized for quick access)
  episode_title TEXT NOT NULL,
  episode_number INTEGER,
  
  -- Script
  script_content TEXT,
  
  -- Scenes Data (full scene breakdown)
  scenes JSONB DEFAULT '[]'::jsonb,
  /*
    scenes format:
    [{
      id: string,
      number: number,
      description: string,
      visualPrompt: string,
      voiceover: string,
      duration: number,
      mood: string,
      cameraMovement: string,
      referenceImageIds: string[],
      generatedImageUrl: string,
      generatedVideoUrl: string,
      status: 'pending' | 'image_generating' | 'image_ready' | 'video_generating' | 'video_ready' | 'error'
    }]
  */
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  /*
    settings format:
    {
      aspectRatio: '9:16' | '16:9' | '1:1',
      imageModel: 'flux-schnell' | 'flux-kontext-max',
      videoModel: 'kling-v1.6',
      musicTrack: string,
      voiceId: string
    }
  */
  
  -- Output Files
  final_video_url TEXT,
  thumbnail_url TEXT,
  
  -- Production Stats
  total_scenes INTEGER DEFAULT 0,
  completed_scenes INTEGER DEFAULT 0,
  
  -- Costs
  total_cost DECIMAL(10,4) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'rendering', 'completed', 'published', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PRODUCTION ASSETS - Generated images/videos
-- ============================================
CREATE TABLE IF NOT EXISTS production_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES video_productions(id) ON DELETE CASCADE,
  scene_id TEXT,
  
  -- Asset Type
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'thumbnail')),
  
  -- File Info
  url TEXT NOT NULL,
  file_size INTEGER,
  duration DECIMAL(10,2), -- for video/audio
  width INTEGER,
  height INTEGER,
  
  -- Generation Info
  model_used TEXT,
  prompt_used TEXT,
  generation_time DECIMAL(10,2),
  cost DECIMAL(10,4),
  
  -- Replicate/API Info
  prediction_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_series_channel ON ai_series(channel_id);
CREATE INDEX IF NOT EXISTS idx_ai_episodes_series ON ai_episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_ai_episodes_status ON ai_episodes(status);
CREATE INDEX IF NOT EXISTS idx_video_productions_episode ON video_productions(episode_id);
CREATE INDEX IF NOT EXISTS idx_video_productions_channel ON video_productions(channel_id);
CREATE INDEX IF NOT EXISTS idx_video_productions_status ON video_productions(status);
CREATE INDEX IF NOT EXISTS idx_production_assets_production ON production_assets(production_id);

-- ============================================
-- ROW LEVEL SECURITY (Allow all for now)
-- ============================================
ALTER TABLE ai_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all ai_channels" ON ai_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ai_series" ON ai_series FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all ai_episodes" ON ai_episodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all video_productions" ON video_productions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all production_assets" ON production_assets FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_channels_updated BEFORE UPDATE ON ai_channels FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_ai_series_updated BEFORE UPDATE ON ai_series FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_ai_episodes_updated BEFORE UPDATE ON ai_episodes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_video_productions_updated BEFORE UPDATE ON video_productions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
