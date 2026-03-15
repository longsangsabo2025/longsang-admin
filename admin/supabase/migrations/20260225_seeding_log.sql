-- ═══════════════════════════════════════════════════════════════════════════
-- SEEDING LOG — Track auto-seeding actions for YouTube pipeline videos
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS seeding_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id TEXT,
    video_id TEXT,
    video_url TEXT NOT NULL,
    video_title TEXT,

    -- Which platforms were announced to
    platforms_announced TEXT[] DEFAULT '{}',
    announce_results JSONB DEFAULT '{}'::jsonb,

    -- Forlike seeding results
    seed_results JSONB DEFAULT '[]'::jsonb,

    -- Status
    status VARCHAR(50) DEFAULT 'completed',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeding_log_pipeline ON seeding_log(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_seeding_log_video ON seeding_log(video_id);
CREATE INDEX IF NOT EXISTS idx_seeding_log_created ON seeding_log(created_at DESC);

ALTER TABLE seeding_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON seeding_log
    FOR ALL USING (true) WITH CHECK (true);
