-- ═══════════════════════════════════════════════════════════════════════════
-- VIRAL VIDEO CLONER SYSTEM
-- Phân tích video viral và tạo video tương tự với AI
-- ═══════════════════════════════════════════════════════════════════════════

-- Bảng chính: Lưu video viral đã phân tích
CREATE TABLE IF NOT EXISTS viral_video_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thông tin source video
    source_url TEXT,                            -- URL gốc (nếu có)
    source_platform VARCHAR(50),                -- tiktok, instagram, youtube, upload
    local_file_path TEXT,                       -- Path file đã upload
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    
    -- Video metadata
    duration_seconds DECIMAL(10,2),
    resolution_width INTEGER,
    resolution_height INTEGER,
    fps DECIMAL(5,2),
    aspect_ratio VARCHAR(20),                   -- 9:16, 16:9, 1:1
    
    -- Analysis results
    analysis_status VARCHAR(50) DEFAULT 'pending',
    -- pending, analyzing, completed, failed
    
    -- Scene analysis
    scenes_count INTEGER DEFAULT 0,
    scenes_data JSONB DEFAULT '[]'::jsonb,
    -- Format: [{ "index": 1, "start": 0, "end": 3.5, "type": "hook", "description": "..." }]
    
    -- Structure blueprint
    structure_blueprint JSONB DEFAULT '{}'::jsonb,
    -- Format: { "hook": {...}, "content": {...}, "cta": {...}, "timing": [...] }
    
    -- Style profile
    style_profile JSONB DEFAULT '{}'::jsonb,
    -- Format: { 
    --   "colors": ["#...", "#..."], 
    --   "transitions": ["cut", "fade"], 
    --   "text_style": {...},
    --   "pacing": "fast|medium|slow",
    --   "mood": "..."
    -- }
    
    -- Audio analysis
    audio_profile JSONB DEFAULT '{}'::jsonb,
    -- Format: {
    --   "has_music": true,
    --   "has_voiceover": true,
    --   "music_mood": "...",
    --   "transcript": "...",
    --   "sound_effects": [...]
    -- }
    
    -- Generated prompts for different AI platforms
    generated_prompts JSONB DEFAULT '{}'::jsonb,
    -- Format: {
    --   "veo3": { "scenes": [...], "master_prompt": "..." },
    --   "sora": { "scenes": [...], "master_prompt": "..." },
    --   "kling": { "scenes": [...], "master_prompt": "..." }
    -- }
    
    -- Metrics từ video gốc (nếu có)
    original_views INTEGER,
    original_likes INTEGER,
    original_comments INTEGER,
    original_shares INTEGER,
    engagement_rate DECIMAL(5,2),
    
    -- Tags và phân loại
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    niche VARCHAR(100),
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Full analysis JSON (backup)
    raw_analysis JSONB DEFAULT '{}'::jsonb
);

-- Bảng lưu các video đã generate từ analysis
CREATE TABLE IF NOT EXISTS viral_generated_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES viral_video_analysis(id) ON DELETE CASCADE,
    
    -- Variation info
    variation_name VARCHAR(100),               -- "Original Style", "Faster Pacing", etc.
    variation_type VARCHAR(50),                -- exact, similar, inspired
    
    -- Generation platform
    platform VARCHAR(50) NOT NULL,             -- veo3, sora, kling, bulk_video
    
    -- Prompt used
    prompt_used TEXT,
    prompt_config JSONB DEFAULT '{}'::jsonb,
    
    -- Generation status
    generation_status VARCHAR(50) DEFAULT 'pending',
    -- pending, generating, completed, failed
    
    -- Result
    video_url TEXT,
    video_path TEXT,
    thumbnail_url TEXT,
    duration_seconds DECIMAL(10,2),
    
    -- External IDs (nếu generate qua API bên ngoài)
    external_job_id VARCHAR(255),
    external_video_id VARCHAR(255),
    
    -- Quality score (tự đánh giá hoặc AI đánh giá)
    quality_score DECIMAL(3,2),               -- 0-1
    similarity_score DECIMAL(3,2),            -- 0-1 so với video gốc
    
    -- Error info
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Publishing
    published_to JSONB DEFAULT '[]'::jsonb,   -- [{"platform": "tiktok", "post_id": "...", "url": "..."}]
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng lưu frames đã extract để phân tích
CREATE TABLE IF NOT EXISTS viral_video_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES viral_video_analysis(id) ON DELETE CASCADE,
    
    -- Frame info
    frame_number INTEGER NOT NULL,
    timestamp_seconds DECIMAL(10,3),
    
    -- Image
    frame_url TEXT,                           -- Cloudinary URL
    frame_path TEXT,                          -- Local path
    
    -- Scene association
    scene_index INTEGER,
    
    -- Frame analysis (GPT-4 Vision)
    frame_analysis JSONB DEFAULT '{}'::jsonb,
    -- Format: {
    --   "description": "...",
    --   "objects": [...],
    --   "text_detected": "...",
    --   "colors": [...],
    --   "mood": "...",
    --   "composition": "..."
    -- }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(analysis_id, frame_number)
);

-- Bảng templates/presets cho từng niche
CREATE TABLE IF NOT EXISTS viral_clone_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    niche VARCHAR(100),                       -- finance, lifestyle, tech, etc.
    
    -- Template structure
    structure_template JSONB NOT NULL,
    -- Format: {
    --   "hook_duration": 3,
    --   "content_sections": [...],
    --   "cta_duration": 2,
    --   "total_duration": 20
    -- }
    
    -- Style defaults
    style_defaults JSONB DEFAULT '{}'::jsonb,
    
    -- Prompt templates
    prompt_templates JSONB DEFAULT '{}'::jsonb,
    -- Format: {
    --   "veo3": "Template with {placeholders}...",
    --   "sora": "Template with {placeholders}...",
    --   "kling": "Template with {placeholders}..."
    -- }
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2),
    
    -- Meta
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_viral_analysis_status ON viral_video_analysis(analysis_status);
CREATE INDEX IF NOT EXISTS idx_viral_analysis_platform ON viral_video_analysis(source_platform);
CREATE INDEX IF NOT EXISTS idx_viral_analysis_created ON viral_video_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_analysis_niche ON viral_video_analysis(niche);

CREATE INDEX IF NOT EXISTS idx_viral_generated_analysis ON viral_generated_videos(analysis_id);
CREATE INDEX IF NOT EXISTS idx_viral_generated_status ON viral_generated_videos(generation_status);
CREATE INDEX IF NOT EXISTS idx_viral_generated_platform ON viral_generated_videos(platform);

CREATE INDEX IF NOT EXISTS idx_viral_frames_analysis ON viral_video_frames(analysis_id);
CREATE INDEX IF NOT EXISTS idx_viral_frames_scene ON viral_video_frames(analysis_id, scene_index);

CREATE INDEX IF NOT EXISTS idx_viral_templates_niche ON viral_clone_templates(niche);
CREATE INDEX IF NOT EXISTS idx_viral_templates_active ON viral_clone_templates(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_viral_cloner_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS viral_analysis_updated ON viral_video_analysis;
CREATE TRIGGER viral_analysis_updated
    BEFORE UPDATE ON viral_video_analysis
    FOR EACH ROW EXECUTE FUNCTION update_viral_cloner_timestamp();

DROP TRIGGER IF EXISTS viral_generated_updated ON viral_generated_videos;
CREATE TRIGGER viral_generated_updated
    BEFORE UPDATE ON viral_generated_videos
    FOR EACH ROW EXECUTE FUNCTION update_viral_cloner_timestamp();

DROP TRIGGER IF EXISTS viral_templates_updated ON viral_clone_templates;
CREATE TRIGGER viral_templates_updated
    BEFORE UPDATE ON viral_clone_templates
    FOR EACH ROW EXECUTE FUNCTION update_viral_cloner_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE viral_video_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_video_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_clone_templates ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on viral_video_analysis" ON viral_video_analysis
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on viral_generated_videos" ON viral_generated_videos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on viral_video_frames" ON viral_video_frames
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on viral_clone_templates" ON viral_clone_templates
    FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW viral_cloner_stats AS
SELECT 
    (SELECT COUNT(*) FROM viral_video_analysis) as total_analyzed,
    (SELECT COUNT(*) FROM viral_video_analysis WHERE analysis_status = 'completed') as completed_analysis,
    (SELECT COUNT(*) FROM viral_video_analysis WHERE analysis_status = 'pending') as pending_analysis,
    (SELECT COUNT(*) FROM viral_video_analysis WHERE analysis_status = 'failed') as failed_analysis,
    (SELECT COUNT(*) FROM viral_generated_videos) as total_generated,
    (SELECT COUNT(*) FROM viral_generated_videos WHERE generation_status = 'completed') as completed_videos,
    (SELECT COUNT(*) FROM viral_clone_templates WHERE is_active = true) as active_templates,
    (SELECT AVG(scenes_count) FROM viral_video_analysis WHERE analysis_status = 'completed') as avg_scenes_per_video,
    (SELECT AVG(duration_seconds) FROM viral_video_analysis WHERE analysis_status = 'completed') as avg_video_duration;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: Default templates
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO viral_clone_templates (name, description, niche, structure_template, style_defaults, prompt_templates) VALUES
(
    'TikTok Hook-Content-CTA',
    'Classic TikTok viral structure: 3s hook, 12-15s content, 2s CTA',
    'general',
    '{
        "hook_duration": 3,
        "content_duration": 12,
        "cta_duration": 2,
        "total_duration": 17,
        "sections": [
            {"name": "hook", "start": 0, "end": 3, "purpose": "Grab attention with bold statement or question"},
            {"name": "content", "start": 3, "end": 15, "purpose": "Deliver value with quick cuts"},
            {"name": "cta", "start": 15, "end": 17, "purpose": "Call to action - follow, like, comment"}
        ]
    }'::jsonb,
    '{
        "pacing": "fast",
        "transitions": ["cut", "zoom", "whip"],
        "text_position": "center",
        "text_style": "bold_impact"
    }'::jsonb,
    '{
        "veo3": "A {duration}s vertical video. Opening hook (0-3s): {hook_description}. Main content (3-{content_end}s): {content_description}. Closing CTA ({cta_start}-{duration}s): {cta_description}. Style: {style}. Fast-paced editing, modern transitions.",
        "sora": "Create a {duration} second vertical format video. HOOK (first 3 seconds): {hook_description} with dramatic zoom in. MAIN CONTENT: {content_description} with quick cuts every 2-3 seconds. ENDING: {cta_description}. Cinematic quality, engaging pacing.",
        "kling": "{hook_description}. {content_description}. {cta_description}. Duration: {duration}s. Vertical format. Fast cuts. Modern style."
    }'::jsonb
),
(
    'Finance Explainer',
    'Finance education style like Sketchinance - longer form, educational',
    'finance',
    '{
        "hook_duration": 5,
        "problem_duration": 15,
        "solution_duration": 25,
        "cta_duration": 5,
        "total_duration": 50,
        "sections": [
            {"name": "hook", "start": 0, "end": 5, "purpose": "Controversial statement about money/wealth"},
            {"name": "problem", "start": 5, "end": 20, "purpose": "Explain the hidden truth or system"},
            {"name": "solution", "start": 20, "end": 45, "purpose": "Reveal insights and actionable steps"},
            {"name": "cta", "start": 45, "end": 50, "purpose": "Subscribe for more wealth knowledge"}
        ]
    }'::jsonb,
    '{
        "pacing": "medium",
        "transitions": ["crossfade", "cut"],
        "text_position": "bottom",
        "text_style": "clean_professional",
        "b_roll": ["money", "business", "graphs", "lifestyle"]
    }'::jsonb,
    '{
        "veo3": "A {duration}s horizontal educational finance video. Hook: {hook_description} - controversial opening. Problem section: {problem_description} with business b-roll. Solution: {solution_description} with graphs and data visuals. CTA: {cta_description}. Professional lighting, clean modern aesthetic.",
        "sora": "Create a {duration} second landscape format finance education video. Opening (0-5s): {hook_description} with dramatic reveal. Problem explanation (5-20s): {problem_description} intercut with stock footage. Deep dive (20-45s): {solution_description}. Closing: {cta_description}. Cinematic, educational tone.",
        "kling": "Finance explainer video. {hook_description}. {problem_description}. {solution_description}. {cta_description}. Duration: {duration}s. Professional style. Business visuals."
    }'::jsonb
),
(
    'Product Showcase',
    'Product demo/showcase for e-commerce',
    'product',
    '{
        "intro_duration": 2,
        "showcase_duration": 10,
        "features_duration": 6,
        "cta_duration": 2,
        "total_duration": 20,
        "sections": [
            {"name": "intro", "start": 0, "end": 2, "purpose": "Product reveal/unboxing moment"},
            {"name": "showcase", "start": 2, "end": 12, "purpose": "Show product from multiple angles"},
            {"name": "features", "start": 12, "end": 18, "purpose": "Highlight key features"},
            {"name": "cta", "start": 18, "end": 20, "purpose": "Link in bio, limited offer"}
        ]
    }'::jsonb,
    '{
        "pacing": "medium",
        "transitions": ["smooth_zoom", "rotate"],
        "lighting": "studio",
        "background": "clean_minimal"
    }'::jsonb,
    '{
        "veo3": "A {duration}s product showcase video. Intro (0-2s): Dramatic product reveal on {background}. Showcase (2-12s): Smooth 360° rotation showing {product_name} details. Features (12-18s): Close-ups of {features}. CTA (18-20s): {cta_description}. Studio lighting, premium commercial feel.",
        "sora": "Premium product video, {duration} seconds. Opening: Cinematic reveal of {product_name}. Middle: Smooth camera movement around product, highlighting texture and design. Close-ups of {features}. Ending: {cta_description}. High-end commercial production value.",
        "kling": "Product showcase: {product_name}. Reveal → 360 rotation → Feature closeups → CTA. Duration: {duration}s. Studio lighting. Clean background. Premium feel."
    }'::jsonb
)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE viral_video_analysis IS 'Lưu trữ kết quả phân tích video viral để clone';
COMMENT ON TABLE viral_generated_videos IS 'Lưu các video đã generate từ analysis';
COMMENT ON TABLE viral_video_frames IS 'Lưu frames đã extract để phân tích chi tiết';
COMMENT ON TABLE viral_clone_templates IS 'Templates/presets cho từng niche và style';
