-- Bug System v2.0 - Enhanced Tables
-- Migration for: Alert Logs, AI Fix Suggestions, Predictive Analytics, Metrics

-- ============================================
-- 1. Alert Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS alert_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_id UUID REFERENCES error_logs(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('slack', 'discord', 'telegram', 'email')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')),
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    response_data JSONB DEFAULT '{}'::jsonb,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_alert_logs_error_id ON alert_logs(error_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_channel ON alert_logs(channel);
CREATE INDEX IF NOT EXISTS idx_alert_logs_status ON alert_logs(status);
CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON alert_logs(created_at DESC);

-- ============================================
-- 2. AI Fix Suggestions Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_fix_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_id UUID REFERENCES error_logs(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Analysis contains: rootCause, suggestedFixes[], pattern, confidence
    suggested_fix TEXT,
    fix_code TEXT,
    confidence DECIMAL(3,2) DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    ai_model TEXT DEFAULT 'pattern-matching',
    tokens_used INTEGER DEFAULT 0,
    was_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    applied_by UUID REFERENCES auth.users(id),
    success BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_ai_fix_error_id ON ai_fix_suggestions(error_id);
CREATE INDEX IF NOT EXISTS idx_ai_fix_error_type ON ai_fix_suggestions(error_type);
CREATE INDEX IF NOT EXISTS idx_ai_fix_was_applied ON ai_fix_suggestions(was_applied);
CREATE INDEX IF NOT EXISTS idx_ai_fix_confidence ON ai_fix_suggestions(confidence DESC);

-- ============================================
-- 3. Predictions Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS predictions_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('error_spike', 'memory_leak', 'api_degradation', 'user_impact', 'cascade_failure')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    probability DECIMAL(3,2) DEFAULT 0.00 CHECK (probability >= 0 AND probability <= 1),
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_at TIMESTAMPTZ,
    description TEXT NOT NULL,
    recommendations JSONB DEFAULT '[]'::jsonb,
    metrics_snapshot JSONB DEFAULT '{}'::jsonb,
    -- Metrics: errorRate, memoryUsage, apiLatency, etc.
    was_accurate BOOLEAN,
    actual_occurred_at TIMESTAMPTZ,
    false_positive BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions_log(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_severity ON predictions_log(severity);
CREATE INDEX IF NOT EXISTS idx_predictions_probability ON predictions_log(probability DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_at ON predictions_log(predicted_at DESC);

-- ============================================
-- 4. Error Metrics Table
-- ============================================
CREATE TABLE IF NOT EXISTS error_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    granularity TEXT NOT NULL CHECK (granularity IN ('minute', 'hour', 'day', 'week', 'month')),
    
    -- Counts
    total_errors INTEGER DEFAULT 0,
    critical_errors INTEGER DEFAULT 0,
    high_errors INTEGER DEFAULT 0,
    medium_errors INTEGER DEFAULT 0,
    low_errors INTEGER DEFAULT 0,
    
    -- MTTR (Mean Time To Resolve) - in seconds
    mttr_seconds DECIMAL(10,2),
    mttr_critical_seconds DECIMAL(10,2),
    mttr_high_seconds DECIMAL(10,2),
    
    -- MTBF (Mean Time Between Failures) - in seconds
    mtbf_seconds DECIMAL(10,2),
    
    -- Resolution stats
    auto_resolved INTEGER DEFAULT 0,
    manual_resolved INTEGER DEFAULT 0,
    unresolved INTEGER DEFAULT 0,
    
    -- AI stats
    ai_suggestions_count INTEGER DEFAULT 0,
    ai_fixes_applied INTEGER DEFAULT 0,
    ai_fixes_success INTEGER DEFAULT 0,
    
    -- Performance
    avg_response_time_ms DECIMAL(10,2),
    p95_response_time_ms DECIMAL(10,2),
    p99_response_time_ms DECIMAL(10,2),
    
    -- SLA
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    sla_breaches INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for period and granularity
CREATE UNIQUE INDEX IF NOT EXISTS idx_error_metrics_period ON error_metrics(period_start, period_end, granularity);
CREATE INDEX IF NOT EXISTS idx_error_metrics_granularity ON error_metrics(granularity, period_start DESC);

-- ============================================
-- 5. Error Resolution Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS error_resolutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_id UUID NOT NULL,
    error_fingerprint TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_method TEXT CHECK (resolution_method IN ('auto_retry', 'auto_heal', 'ai_fix', 'manual', 'timeout', 'ignored')),
    resolution_details JSONB DEFAULT '{}'::jsonb,
    time_to_resolve_seconds INTEGER,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for MTTR calculations
CREATE INDEX IF NOT EXISTS idx_resolutions_fingerprint ON error_resolutions(error_fingerprint);
CREATE INDEX IF NOT EXISTS idx_resolutions_occurred_at ON error_resolutions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolutions_resolved_at ON error_resolutions(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolutions_method ON error_resolutions(resolution_method);

-- ============================================
-- 6. Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_alert_logs_updated_at') THEN
        CREATE TRIGGER update_alert_logs_updated_at
            BEFORE UPDATE ON alert_logs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_fix_suggestions_updated_at') THEN
        CREATE TRIGGER update_ai_fix_suggestions_updated_at
            BEFORE UPDATE ON ai_fix_suggestions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_predictions_log_updated_at') THEN
        CREATE TRIGGER update_predictions_log_updated_at
            BEFORE UPDATE ON predictions_log
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 7. Views for Dashboard
-- ============================================

-- Real-time metrics view
CREATE OR REPLACE VIEW v_bug_system_realtime AS
SELECT
    (SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '1 hour') as errors_last_hour,
    (SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '24 hours') as errors_last_24h,
    (SELECT COUNT(*) FROM error_logs WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '24 hours') as critical_last_24h,
    (SELECT COUNT(*) FROM alert_logs WHERE status = 'sent' AND created_at > NOW() - INTERVAL '24 hours') as alerts_sent_24h,
    (SELECT COUNT(*) FROM ai_fix_suggestions WHERE was_applied = true AND created_at > NOW() - INTERVAL '24 hours') as ai_fixes_applied_24h,
    (SELECT AVG(confidence) FROM ai_fix_suggestions WHERE created_at > NOW() - INTERVAL '7 days') as avg_ai_confidence,
    (SELECT COUNT(*) FROM predictions_log WHERE probability > 0.7 AND created_at > NOW() - INTERVAL '24 hours') as high_risk_predictions_24h,
    NOW() as generated_at;

-- MTTR summary view
CREATE OR REPLACE VIEW v_mttr_summary AS
SELECT
    granularity,
    AVG(mttr_seconds) as avg_mttr,
    AVG(mttr_critical_seconds) as avg_mttr_critical,
    AVG(mtbf_seconds) as avg_mtbf,
    SUM(total_errors) as total_errors,
    SUM(auto_resolved) as auto_resolved,
    AVG(uptime_percentage) as avg_uptime
FROM error_metrics
WHERE period_start > NOW() - INTERVAL '30 days'
GROUP BY granularity
ORDER BY 
    CASE granularity 
        WHEN 'minute' THEN 1 
        WHEN 'hour' THEN 2 
        WHEN 'day' THEN 3 
        WHEN 'week' THEN 4 
        WHEN 'month' THEN 5 
    END;

-- ============================================
-- 8. RLS Policies
-- ============================================
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fix_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_resolutions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read alert_logs"
    ON alert_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read ai_fix_suggestions"
    ON ai_fix_suggestions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read predictions_log"
    ON predictions_log FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read error_metrics"
    ON error_metrics FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read error_resolutions"
    ON error_resolutions FOR SELECT
    TO authenticated
    USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access to alert_logs"
    ON alert_logs FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role full access to ai_fix_suggestions"
    ON ai_fix_suggestions FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role full access to predictions_log"
    ON predictions_log FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role full access to error_metrics"
    ON error_metrics FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role full access to error_resolutions"
    ON error_resolutions FOR ALL
    TO service_role
    USING (true);

-- ============================================
-- Done!
-- ============================================
COMMENT ON TABLE alert_logs IS 'Bug System v2.0 - Alert notification logs for Slack/Discord/Telegram';
COMMENT ON TABLE ai_fix_suggestions IS 'Bug System v2.0 - AI-powered fix suggestions and their outcomes';
COMMENT ON TABLE predictions_log IS 'Bug System v2.0 - Predictive error detection logs';
COMMENT ON TABLE error_metrics IS 'Bug System v2.0 - Aggregated error metrics for MTTR/MTBF tracking';
COMMENT ON TABLE error_resolutions IS 'Bug System v2.0 - Individual error resolution tracking';
