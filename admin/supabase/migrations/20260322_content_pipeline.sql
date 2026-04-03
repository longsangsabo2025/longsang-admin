-- ============================================================
-- 🎯 Content Pipeline — Migration for Content Command OS
-- Run this in Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new
-- ============================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS content_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'idea'
    CHECK (stage IN ('idea', 'script', 'visual', 'production', 'review', 'published')),
  channel TEXT NOT NULL DEFAULT 'longsang'
    CHECK (channel IN ('lyblack', 'dungdaydi', 'ainewbie', 'vtdreamhomes', 'longsang')),
  content_type TEXT NOT NULL DEFAULT 'youtube-long'
    CHECK (content_type IN ('youtube-long', 'youtube-short', 'tiktok', 'blog', 'newsletter', 'social', 'podcast')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  tags JSONB DEFAULT '[]'::jsonb,
  assigned_agent TEXT DEFAULT '',
  due_date TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]'::jsonb,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  metrics JSONB,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cp_stage ON content_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_cp_channel ON content_pipeline(channel);
CREATE INDEX IF NOT EXISTS idx_cp_priority ON content_pipeline(priority);
CREATE INDEX IF NOT EXISTS idx_cp_due_date ON content_pipeline(due_date);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_content_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_pipeline_updated_at ON content_pipeline;
CREATE TRIGGER trg_content_pipeline_updated_at
  BEFORE UPDATE ON content_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_content_pipeline_updated_at();

-- 4. Disable RLS (single-user admin app)
ALTER TABLE content_pipeline DISABLE ROW LEVEL SECURITY;

-- 5. Enable realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE content_pipeline;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Seed demo data
INSERT INTO content_pipeline (title, description, stage, channel, content_type, priority, tags, assigned_agent, due_date, checklist, ai_suggestions, notes)
VALUES
  (
    '10 Công Cụ AI Miễn Phí Cho Freelancer 2026',
    'Video review 10 AI tools tốt nhất, miễn phí, dành cho freelancer việt nam',
    'idea', 'lyblack', 'youtube-long', 'high',
    '["ai-tools", "freelancer", "review"]'::jsonb,
    'travis-ai',
    now() + interval '3 days',
    '[{"id":"1","label":"Research tools","done":true},{"id":"2","label":"Viết outline","done":false},{"id":"3","label":"Draft script","done":false}]'::jsonb,
    '["Thêm so sánh giá", "Hook mạnh hơn", "Thêm demo thực tế"]'::jsonb,
    ''
  ),
  (
    'Thơ Chế: ChatGPT vs Gemini — Cuộc Chiến Thế Kỷ',
    'Lý Blạck phân tích 2 ông lớn AI bằng thơ lục bát remix',
    'script', 'lyblack', 'youtube-short', 'urgent',
    '["thơ-chế", "ai-comparison", "viral"]'::jsonb,
    'script-writer',
    now() + interval '1 day',
    '[{"id":"1","label":"Viết thơ","done":true},{"id":"2","label":"Review tone","done":true},{"id":"3","label":"Record voice","done":false}]'::jsonb,
    '["Thêm punch line cuối", "Dùng meme format"]'::jsonb,
    'Viral potential cao — cần publish ASAP'
  ),
  (
    'AI Automation cho Doanh Nghiệp Nhỏ',
    'Series hướng dẫn tự động hóa bằng n8n + AI cho SME',
    'visual', 'ainewbie', 'youtube-long', 'medium',
    '["automation", "n8n", "sme"]'::jsonb,
    'visual-designer',
    now() + interval '5 days',
    '[{"id":"1","label":"Script done","done":true},{"id":"2","label":"Thumbnail","done":false},{"id":"3","label":"B-roll footage","done":false}]'::jsonb,
    '["Thêm case study thực", "So sánh chi phí manual vs auto"]'::jsonb,
    ''
  ),
  (
    'Bất Động Sản Vũng Tàu Q2/2026 — Phân Tích Thị Trường',
    'Video phân tích giá đất, căn hộ, biệt thự Vũng Tàu tháng 4-6/2026',
    'production', 'vtdreamhomes', 'youtube-long', 'high',
    '["bất-động-sản", "vũng-tàu", "phân-tích"]'::jsonb,
    'production-agent',
    now() + interval '2 days',
    '[{"id":"1","label":"Script","done":true},{"id":"2","label":"Voice record","done":true},{"id":"3","label":"Edit video","done":false},{"id":"4","label":"Add subtitles","done":false}]'::jsonb,
    '["Thêm bản đồ giá", "Phỏng vấn chuyên gia"]'::jsonb,
    'Cần data mới nhất từ batdongsan.com.vn'
  ),
  (
    'Newsletter #42 — AI Tools Round-Up Tháng 3',
    'Tổng hợp tools AI mới nhất trong tháng, tips & tricks cho cộng đồng',
    'review', 'ainewbie', 'newsletter', 'medium',
    '["newsletter", "ai-tools", "monthly"]'::jsonb,
    'editor',
    now() + interval '1 day',
    '[{"id":"1","label":"Draft content","done":true},{"id":"2","label":"Proofread","done":true},{"id":"3","label":"Format email","done":true},{"id":"4","label":"CEO review","done":false}]'::jsonb,
    '[]'::jsonb,
    'Chờ LongSang review lần cuối'
  ),
  (
    'Đứng Dậy Đi Ep.15 — Vượt Qua Burnout',
    'Podcast episode về burnout khi làm side project, chia sẻ kinh nghiệm cá nhân',
    'published', 'dungdaydi', 'podcast', 'low',
    '["podcast", "burnout", "motivation"]'::jsonb,
    '',
    null,
    '[{"id":"1","label":"Record","done":true},{"id":"2","label":"Edit audio","done":true},{"id":"3","label":"Upload","done":true},{"id":"4","label":"Share social","done":true}]'::jsonb,
    '[]'::jsonb,
    'Feedback rất tốt, audience muốn thêm episodes tương tự'
  );

-- Update published_at for the published item
UPDATE content_pipeline SET published_at = now() - interval '2 days'
WHERE title LIKE 'Đứng Dậy Đi%' AND stage = 'published';

-- Update metrics for published item  
UPDATE content_pipeline SET metrics = '{"views": 1250, "likes": 89, "shares": 23, "comments": 15, "revenue": 12.50}'::jsonb
WHERE title LIKE 'Đứng Dậy Đi%' AND stage = 'published';

-- Update scheduled_for for production item
UPDATE content_pipeline SET scheduled_for = now() + interval '7 days'
WHERE title LIKE 'Bất Động Sản%' AND stage = 'production';

-- ✅ Done! Verify:
SELECT id, title, stage, channel, priority FROM content_pipeline ORDER BY created_at;
