-- =============================================================================
-- BULK VIDEO PRODUCTION SYSTEM
-- Migration: 20260115_bulk_video_system.sql
-- Description: Database schema for automated video production pipeline
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. VIDEO TEMPLATES - Mẫu video có thể tái sử dụng
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Template Type
    template_type TEXT NOT NULL DEFAULT 'faceless' 
        CHECK (template_type IN ('faceless', 'avatar', 'educational', 'compilation', 'shorts', 'custom')),
    
    -- Video Settings
    aspect_ratio TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:3')),
    resolution TEXT NOT NULL DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '1440p', '4k')),
    target_duration INTEGER DEFAULT 60, -- seconds
    
    -- Voice Settings
    voice_provider TEXT DEFAULT 'edge' CHECK (voice_provider IN ('edge', 'azure', 'openai', 'gemini', 'elevenlabs')),
    voice_name TEXT DEFAULT 'vi-VN-HoaiMyNeural',
    voice_speed FLOAT DEFAULT 1.0 CHECK (voice_speed BETWEEN 0.5 AND 2.0),
    
    -- Subtitle Settings
    subtitle_enabled BOOLEAN DEFAULT true,
    subtitle_font TEXT DEFAULT 'Arial',
    subtitle_font_size INTEGER DEFAULT 48,
    subtitle_color TEXT DEFAULT '#FFFFFF',
    subtitle_stroke_color TEXT DEFAULT '#000000',
    subtitle_stroke_width INTEGER DEFAULT 2,
    subtitle_position TEXT DEFAULT 'bottom' CHECK (subtitle_position IN ('top', 'center', 'bottom')),
    
    -- Background Music
    music_enabled BOOLEAN DEFAULT true,
    music_volume FLOAT DEFAULT 0.3 CHECK (music_volume BETWEEN 0 AND 1),
    
    -- AI Settings
    llm_provider TEXT DEFAULT 'deepseek' CHECK (llm_provider IN ('openai', 'deepseek', 'anthropic', 'gemini', 'ollama')),
    llm_model TEXT DEFAULT 'deepseek-chat',
    script_style TEXT DEFAULT 'informative', -- informative, storytelling, educational, entertaining
    
    -- Video Source
    video_source TEXT DEFAULT 'pexels' CHECK (video_source IN ('pexels', 'pixabay', 'local', 'ai_generated')),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. VIDEO PRODUCTIONS - Các video đã và đang sản xuất
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_productions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    
    -- Template Reference
    template_id UUID REFERENCES video_templates(id) ON DELETE SET NULL,
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'queued', 'script_generating', 'assets_collecting', 
                         'voice_generating', 'video_composing', 'subtitle_adding',
                         'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    current_step TEXT,
    error_message TEXT,
    
    -- Generated Content
    script TEXT,
    script_segments JSONB DEFAULT '[]', -- [{text, start, end, keywords}]
    keywords TEXT[] DEFAULT '{}',
    
    -- Output Files
    output_url TEXT,
    output_path TEXT,
    thumbnail_url TEXT,
    
    -- Video Details
    duration INTEGER, -- seconds
    file_size BIGINT, -- bytes
    aspect_ratio TEXT DEFAULT '16:9',
    resolution TEXT DEFAULT '1080p',
    
    -- Voice Details
    voice_provider TEXT,
    voice_name TEXT,
    voice_audio_url TEXT,
    
    -- Assets Used
    stock_videos JSONB DEFAULT '[]', -- [{url, source, start, end}]
    background_music JSONB, -- {url, name, artist}
    
    -- YouTube Integration
    youtube_channel_id UUID,
    youtube_video_id TEXT,
    youtube_upload_status TEXT CHECK (youtube_upload_status IN ('pending', 'uploading', 'published', 'failed')),
    youtube_scheduled_at TIMESTAMPTZ,
    
    -- SEO
    seo_title TEXT,
    seo_description TEXT,
    seo_tags TEXT[] DEFAULT '{}',
    
    -- Cost Tracking
    llm_tokens_used INTEGER DEFAULT 0,
    tts_characters INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_seconds INTEGER,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. VIDEO QUEUE - Hàng đợi batch processing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Batch Info
    batch_id UUID, -- Group related videos
    batch_name TEXT,
    
    -- Production Reference
    production_id UUID REFERENCES video_productions(id) ON DELETE CASCADE,
    
    -- Queue Status
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'paused')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
    
    -- Retry Logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ,
    
    -- Worker Info
    worker_id TEXT,
    locked_at TIMESTAMPTZ,
    lock_expires_at TIMESTAMPTZ,
    
    -- Timing
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. VIDEO ASSETS - Library for reusable assets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Asset Info
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL 
        CHECK (asset_type IN ('music', 'font', 'stock_video', 'stock_image', 'overlay', 'transition', 'sound_effect')),
    
    -- File Info
    file_url TEXT NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    
    -- Metadata
    duration INTEGER, -- For audio/video
    width INTEGER, -- For images/videos
    height INTEGER,
    
    -- Attribution
    source TEXT, -- pexels, pixabay, custom
    source_url TEXT,
    license TEXT DEFAULT 'free',
    attribution TEXT,
    
    -- Organization
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. YOUTUBE CHANNELS - Managed channels
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Channel Info
    channel_id TEXT NOT NULL UNIQUE,
    channel_name TEXT NOT NULL,
    channel_url TEXT,
    thumbnail_url TEXT,
    
    -- Stats
    subscriber_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    
    -- Auth
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Settings
    default_template_id UUID REFERENCES video_templates(id),
    auto_upload BOOLEAN DEFAULT false,
    default_privacy TEXT DEFAULT 'private' CHECK (default_privacy IN ('public', 'unlisted', 'private')),
    default_category TEXT DEFAULT 'Education',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    
    -- Ownership
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. PRODUCTION LOGS - Detailed logging
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID REFERENCES video_productions(id) ON DELETE CASCADE,
    
    -- Log Info
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    step TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    
    -- Timing
    duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- video_productions indexes
CREATE INDEX IF NOT EXISTS idx_video_productions_status ON video_productions(status);
CREATE INDEX IF NOT EXISTS idx_video_productions_user ON video_productions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_productions_created ON video_productions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_productions_template ON video_productions(template_id);

-- video_queue indexes
CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_priority ON video_queue(priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_queue_batch ON video_queue(batch_id);
CREATE INDEX IF NOT EXISTS idx_video_queue_user ON video_queue(user_id);

-- video_assets indexes
CREATE INDEX IF NOT EXISTS idx_video_assets_type ON video_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_video_assets_user ON video_assets(user_id);

-- production_logs indexes
CREATE INDEX IF NOT EXISTS idx_production_logs_production ON video_production_logs(production_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_level ON video_production_logs(level);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_production_logs ENABLE ROW LEVEL SECURITY;

-- Policies for video_templates
CREATE POLICY "Users can view own templates" ON video_templates
    FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users can create own templates" ON video_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON video_templates
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON video_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for video_productions
CREATE POLICY "Users can view own productions" ON video_productions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own productions" ON video_productions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own productions" ON video_productions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own productions" ON video_productions
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for video_queue
CREATE POLICY "Users can view own queue" ON video_queue
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own queue" ON video_queue
    FOR ALL USING (auth.uid() = user_id);

-- Policies for video_assets
CREATE POLICY "Users can view own assets" ON video_assets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own assets" ON video_assets
    FOR ALL USING (auth.uid() = user_id);

-- Policies for youtube_channels
CREATE POLICY "Users can view own channels" ON youtube_channels
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own channels" ON youtube_channels
    FOR ALL USING (auth.uid() = user_id);

-- Policies for production_logs
CREATE POLICY "Users can view own logs" ON video_production_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_productions 
            WHERE video_productions.id = video_production_logs.production_id 
            AND video_productions.user_id = auth.uid()
        )
    );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_video_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_video_templates_updated
    BEFORE UPDATE ON video_templates
    FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();

CREATE TRIGGER trigger_video_productions_updated
    BEFORE UPDATE ON video_productions
    FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();

CREATE TRIGGER trigger_video_queue_updated
    BEFORE UPDATE ON video_queue
    FOR EACH ROW EXECUTE FUNCTION update_video_updated_at();

-- Update template use count
CREATE OR REPLACE FUNCTION increment_template_use_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE video_templates 
        SET use_count = use_count + 1 
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_use
    AFTER INSERT ON video_productions
    FOR EACH ROW EXECUTE FUNCTION increment_template_use_count();

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default templates
INSERT INTO video_templates (
    name, description, template_type, aspect_ratio, target_duration,
    voice_name, subtitle_enabled, script_style, is_default
) VALUES 
(
    'Faceless YouTube Video',
    'Video dạng faceless với stock footage + voiceover + subtitles',
    'faceless',
    '16:9',
    300,
    'vi-VN-HoaiMyNeural',
    true,
    'informative',
    true
),
(
    'YouTube Shorts',
    'Video ngắn dọc cho YouTube Shorts',
    'shorts',
    '9:16',
    60,
    'vi-VN-NamMinhNeural',
    true,
    'entertaining',
    true
),
(
    'Educational Video',
    'Video giáo dục với slides và narration',
    'educational',
    '16:9',
    600,
    'vi-VN-HoaiMyNeural',
    true,
    'educational',
    true
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE video_templates IS 'Các mẫu video có thể tái sử dụng cho sản xuất hàng loạt';
COMMENT ON TABLE video_productions IS 'Lưu trữ tất cả video đã và đang được sản xuất';
COMMENT ON TABLE video_queue IS 'Hàng đợi xử lý batch video production';
COMMENT ON TABLE video_assets IS 'Thư viện assets: nhạc, font, stock footage';
COMMENT ON TABLE youtube_channels IS 'Các kênh YouTube được kết nối để tự động upload';
COMMENT ON TABLE video_production_logs IS 'Log chi tiết quá trình sản xuất video';
