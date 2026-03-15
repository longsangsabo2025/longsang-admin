-- ═══════════════════════════════════════════════════════════════════════════
-- CONTENT REPURPOSE SYSTEM - Quản lý nội dung đa ngôn ngữ
-- Dùng để lấy content từ fanpage cũ, việt hóa và đăng lên page mới
-- ═══════════════════════════════════════════════════════════════════════════

-- Bảng chính: Lưu trữ nội dung gốc đã import
CREATE TABLE IF NOT EXISTS content_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Thông tin nguồn
    source_platform VARCHAR(50) DEFAULT 'facebook', -- facebook, twitter, instagram...
    source_page_id VARCHAR(255),
    source_page_name VARCHAR(255),
    source_post_id VARCHAR(255),
    source_url TEXT,
    
    -- Nội dung gốc
    original_content TEXT NOT NULL,
    original_language VARCHAR(10) DEFAULT 'en',
    
    -- Media (lưu URLs hoặc Cloudinary IDs)
    media_urls JSONB DEFAULT '[]'::jsonb,
    -- Format: [{ "type": "image", "url": "...", "cloudinary_id": "..." }]
    
    -- Metadata từ bài gốc
    original_likes INTEGER DEFAULT 0,
    original_comments INTEGER DEFAULT 0,
    original_shares INTEGER DEFAULT 0,
    original_date TIMESTAMPTZ,
    
    -- Trạng thái xử lý
    status VARCHAR(50) DEFAULT 'pending', 
    -- pending: chưa dịch, translating: đang dịch, translated: đã dịch, 
    -- scheduled: đã lên lịch, published: đã đăng, failed: lỗi
    
    -- Tags và phân loại
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Bảng translations: Lưu các bản dịch
CREATE TABLE IF NOT EXISTS content_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
    
    -- Ngôn ngữ đích
    target_language VARCHAR(10) NOT NULL DEFAULT 'vi',
    
    -- Nội dung đã dịch
    translated_content TEXT NOT NULL,
    
    -- Có thể chỉnh sửa thủ công sau khi AI dịch
    is_manually_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    edited_by UUID REFERENCES auth.users(id),
    
    -- AI translation metadata
    ai_model VARCHAR(50), -- gpt-4o, gemini-pro...
    ai_confidence DECIMAL(3,2), -- 0.00 - 1.00
    translation_notes TEXT,
    
    -- Trạng thái
    status VARCHAR(50) DEFAULT 'draft',
    -- draft: bản nháp, approved: đã duyệt, published: đã đăng
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Đảm bảo mỗi source chỉ có 1 bản dịch cho mỗi ngôn ngữ
    UNIQUE(source_id, target_language)
);

-- Bảng publish_queue: Hàng đợi đăng bài
CREATE TABLE IF NOT EXISTS content_publish_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    translation_id UUID NOT NULL REFERENCES content_translations(id) ON DELETE CASCADE,
    
    -- Nền tảng đích
    target_platform VARCHAR(50) NOT NULL DEFAULT 'facebook',
    target_page_id VARCHAR(255),
    target_page_name VARCHAR(255),
    
    -- Nội dung để đăng (có thể khác với translation nếu cần customize)
    post_content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    
    -- Lên lịch
    scheduled_at TIMESTAMPTZ,
    
    -- Kết quả đăng
    status VARCHAR(50) DEFAULT 'pending',
    -- pending: chờ đăng, publishing: đang đăng, published: đã đăng, failed: lỗi
    published_at TIMESTAMPTZ,
    published_post_id VARCHAR(255),
    published_post_url TEXT,
    
    -- Lỗi nếu có
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng settings: Cài đặt hệ thống
CREATE TABLE IF NOT EXISTS content_repurpose_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Default settings
    default_source_language VARCHAR(10) DEFAULT 'en',
    default_target_language VARCHAR(10) DEFAULT 'vi',
    default_ai_model VARCHAR(50) DEFAULT 'gpt-4o',
    
    -- Auto-translation settings
    auto_translate BOOLEAN DEFAULT FALSE,
    
    -- Facebook settings
    facebook_page_id VARCHAR(255),
    facebook_page_name VARCHAR(255),
    facebook_page_access_token TEXT,
    
    -- Translation style
    translation_style TEXT DEFAULT 'professional',
    -- professional, casual, formal, creative
    
    -- Custom prompt cho AI
    custom_translation_prompt TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_content_sources_status ON content_sources(status);
CREATE INDEX IF NOT EXISTS idx_content_sources_platform ON content_sources(source_platform);
CREATE INDEX IF NOT EXISTS idx_content_sources_created ON content_sources(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_translations_source ON content_translations(source_id);
CREATE INDEX IF NOT EXISTS idx_content_translations_status ON content_translations(status);

CREATE INDEX IF NOT EXISTS idx_publish_queue_status ON content_publish_queue(status);
CREATE INDEX IF NOT EXISTS idx_publish_queue_scheduled ON content_publish_queue(scheduled_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_repurpose_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_sources_updated ON content_sources;
CREATE TRIGGER content_sources_updated
    BEFORE UPDATE ON content_sources
    FOR EACH ROW EXECUTE FUNCTION update_content_repurpose_timestamp();

DROP TRIGGER IF EXISTS content_translations_updated ON content_translations;
CREATE TRIGGER content_translations_updated
    BEFORE UPDATE ON content_translations
    FOR EACH ROW EXECUTE FUNCTION update_content_repurpose_timestamp();

DROP TRIGGER IF EXISTS content_publish_queue_updated ON content_publish_queue;
CREATE TRIGGER content_publish_queue_updated
    BEFORE UPDATE ON content_publish_queue
    FOR EACH ROW EXECUTE FUNCTION update_content_repurpose_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES (tạm disable để development)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_repurpose_settings ENABLE ROW LEVEL SECURITY;

-- Policy cho admin (bypass RLS)
CREATE POLICY "Admin full access on content_sources" ON content_sources
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on content_translations" ON content_translations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on content_publish_queue" ON content_publish_queue
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on content_repurpose_settings" ON content_repurpose_settings
    FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS cho dashboard
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW content_repurpose_stats AS
SELECT 
    (SELECT COUNT(*) FROM content_sources) as total_sources,
    (SELECT COUNT(*) FROM content_sources WHERE status = 'pending') as pending_sources,
    (SELECT COUNT(*) FROM content_sources WHERE status = 'translated') as translated_sources,
    (SELECT COUNT(*) FROM content_sources WHERE status = 'published') as published_sources,
    (SELECT COUNT(*) FROM content_translations) as total_translations,
    (SELECT COUNT(*) FROM content_translations WHERE status = 'approved') as approved_translations,
    (SELECT COUNT(*) FROM content_publish_queue WHERE status = 'pending') as queue_pending,
    (SELECT COUNT(*) FROM content_publish_queue WHERE status = 'published') as queue_published;

COMMENT ON TABLE content_sources IS 'Lưu trữ nội dung gốc import từ các fanpage/source';
COMMENT ON TABLE content_translations IS 'Lưu các bản dịch của nội dung gốc';
COMMENT ON TABLE content_publish_queue IS 'Hàng đợi đăng bài đã dịch lên các nền tảng';
COMMENT ON TABLE content_repurpose_settings IS 'Cài đặt hệ thống cho từng user';
