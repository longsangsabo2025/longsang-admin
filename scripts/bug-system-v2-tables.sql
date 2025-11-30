-- Bug System v2.0 Tables (Simplified)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql

-- ============================================
-- 1. Alert Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.alert_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_id UUID REFERENCES public.error_logs(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    project_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_logs_error_id ON public.alert_logs(error_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON public.alert_logs(created_at DESC);

-- ============================================
-- 2. AI Fix Suggestions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_fix_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_id UUID REFERENCES public.error_logs(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    suggested_fix TEXT,
    fix_code TEXT,
    confidence DECIMAL(3,2) DEFAULT 0.00,
    ai_model TEXT DEFAULT 'pattern-matching',
    was_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_fix_error_id ON public.ai_fix_suggestions(error_id);
CREATE INDEX IF NOT EXISTS idx_ai_fix_confidence ON public.ai_fix_suggestions(confidence DESC);

-- ============================================
-- 3. Predictions Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.predictions_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prediction_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    probability DECIMAL(3,2) DEFAULT 0.00,
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb,
    metrics_snapshot JSONB DEFAULT '{}'::jsonb,
    was_accurate BOOLEAN,
    actual_occurred_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_severity ON public.predictions_log(severity);
CREATE INDEX IF NOT EXISTS idx_predictions_probability ON public.predictions_log(probability DESC);

-- ============================================
-- 4. Error Metrics Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.error_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    granularity TEXT NOT NULL,
    total_errors INTEGER DEFAULT 0,
    critical_errors INTEGER DEFAULT 0,
    high_errors INTEGER DEFAULT 0,
    medium_errors INTEGER DEFAULT 0,
    low_errors INTEGER DEFAULT 0,
    mttr_seconds DECIMAL(10,2),
    mtbf_seconds DECIMAL(10,2),
    auto_resolved INTEGER DEFAULT 0,
    manual_resolved INTEGER DEFAULT 0,
    ai_fixes_applied INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_error_metrics_period ON public.error_metrics(period_start, period_end, granularity);

-- ============================================
-- 5. Error Resolutions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.error_resolutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_id UUID,
    error_fingerprint TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_method TEXT,
    resolution_details JSONB DEFAULT '{}'::jsonb,
    time_to_resolve_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resolutions_fingerprint ON public.error_resolutions(error_fingerprint);
CREATE INDEX IF NOT EXISTS idx_resolutions_occurred_at ON public.error_resolutions(occurred_at DESC);

-- ============================================
-- 6. Enable RLS and Policies
-- ============================================
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_fix_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_resolutions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.alert_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON public.ai_fix_suggestions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON public.predictions_log FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON public.error_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON public.error_resolutions FOR ALL TO service_role USING (true);

-- Allow anon read access (for dashboard)
CREATE POLICY "Anon read access" ON public.alert_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read access" ON public.ai_fix_suggestions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read access" ON public.predictions_log FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read access" ON public.error_metrics FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read access" ON public.error_resolutions FOR SELECT TO anon USING (true);

-- Allow anon insert for logging
CREATE POLICY "Anon insert" ON public.alert_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert" ON public.ai_fix_suggestions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert" ON public.predictions_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert" ON public.error_metrics FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert" ON public.error_resolutions FOR INSERT TO anon WITH CHECK (true);

-- Done!
SELECT 'Bug System v2.0 tables created successfully!' as status;
