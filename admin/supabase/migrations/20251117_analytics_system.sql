-- Analytics System for Multi-Product Dashboard
-- Created: November 17, 2025
-- Purpose: Unified analytics tracking for LongSang, VungTauLand, SABO Arena, LS Secretary

-- =====================================================
-- 1. ANALYTICS EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Product Identification
    product_name TEXT NOT NULL CHECK (product_name IN ('longsang', 'vungtau', 'sabo-arena', 'ls-secretary')),

    -- Event Details
    event_type TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', 'error', 'conversion'
    event_name TEXT NOT NULL,
    event_category TEXT,

    -- User Information
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    anonymous_id TEXT,

    -- Page Information
    page_url TEXT,
    page_title TEXT,
    referrer TEXT,

    -- Device & Location
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,

    -- Event Data
    properties JSONB DEFAULT '{}',

    -- Performance Metrics
    page_load_time INTEGER, -- milliseconds
    time_on_page INTEGER, -- seconds

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for fast queries
    CONSTRAINT analytics_events_product_check CHECK (product_name IN ('longsang', 'vungtau', 'sabo-arena', 'ls-secretary'))
);

-- Indexes for performance
CREATE INDEX idx_analytics_events_product ON analytics_events(product_name);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_composite ON analytics_events(product_name, event_type, created_at DESC);

-- =====================================================
-- 2. DAILY ANALYTICS SUMMARY
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_name TEXT NOT NULL,
    date DATE NOT NULL,

    -- Traffic Metrics
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    new_visitors INTEGER DEFAULT 0,
    returning_visitors INTEGER DEFAULT 0,

    -- Engagement Metrics
    avg_time_on_site INTEGER, -- seconds
    bounce_rate DECIMAL(5,2), -- percentage
    pages_per_session DECIMAL(5,2),

    -- Conversion Metrics
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),

    -- Performance Metrics
    avg_page_load_time INTEGER, -- milliseconds

    -- Error Tracking
    error_count INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(product_name, date)
);

CREATE INDEX idx_daily_summary_product_date ON analytics_daily_summary(product_name, date DESC);

-- =====================================================
-- 3. PRODUCT METRICS (Real-time)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_name TEXT NOT NULL UNIQUE,

    -- Current Stats
    active_users INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,

    -- Revenue (if applicable)
    monthly_revenue DECIMAL(10,2) DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,

    -- Health Status
    uptime_percentage DECIMAL(5,2) DEFAULT 100,
    avg_response_time INTEGER, -- milliseconds
    error_rate DECIMAL(5,2) DEFAULT 0,

    -- Feature Usage
    feature_usage JSONB DEFAULT '{}',

    -- Last Updated
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial product metrics
INSERT INTO product_metrics (product_name) VALUES
    ('longsang'),
    ('vungtau'),
    ('sabo-arena'),
    ('ls-secretary')
ON CONFLICT (product_name) DO NOTHING;

-- =====================================================
-- 4. USER ACTIVITY LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    activity_type TEXT NOT NULL, -- 'login', 'feature_used', 'purchase', 'upgrade'
    activity_data JSONB DEFAULT '{}',

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_product ON user_activity_log(product_name);
CREATE INDEX idx_user_activity_user ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_created ON user_activity_log(created_at DESC);

-- =====================================================
-- 5. FUNNEL ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_name TEXT NOT NULL,
    funnel_name TEXT NOT NULL,

    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,

    users_entered INTEGER DEFAULT 0,
    users_completed INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),

    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(product_name, funnel_name, step_number, date)
);

CREATE INDEX idx_funnel_product_name ON funnel_analytics(product_name, funnel_name, date DESC);

-- =====================================================
-- 6. FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function: Track Event
CREATE OR REPLACE FUNCTION track_analytics_event(
    p_product_name TEXT,
    p_event_type TEXT,
    p_event_name TEXT,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_properties JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO analytics_events (
        product_name,
        event_type,
        event_name,
        user_id,
        session_id,
        properties
    ) VALUES (
        p_product_name,
        p_event_type,
        p_event_name,
        p_user_id,
        p_session_id,
        p_properties
    ) RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Daily Stats for Product
CREATE OR REPLACE FUNCTION get_daily_stats(
    p_product_name TEXT,
    p_days INTEGER DEFAULT 7
) RETURNS TABLE (
    date DATE,
    page_views INTEGER,
    unique_visitors INTEGER,
    avg_time INTEGER,
    conversions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ads.date,
        ads.page_views,
        ads.unique_visitors,
        ads.avg_time_on_site,
        ads.conversions
    FROM analytics_daily_summary ads
    WHERE ads.product_name = p_product_name
        AND ads.date >= CURRENT_DATE - p_days
    ORDER BY ads.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Product Overview
CREATE OR REPLACE FUNCTION get_product_overview(
    p_product_name TEXT DEFAULT NULL
) RETURNS TABLE (
    product TEXT,
    active_users INTEGER,
    total_users INTEGER,
    uptime DECIMAL,
    error_rate DECIMAL,
    avg_response_time INTEGER
) AS $$
BEGIN
    IF p_product_name IS NULL THEN
        RETURN QUERY
        SELECT
            pm.product_name,
            pm.active_users,
            pm.total_users,
            pm.uptime_percentage,
            pm.error_rate,
            pm.avg_response_time
        FROM product_metrics pm
        ORDER BY pm.product_name;
    ELSE
        RETURN QUERY
        SELECT
            pm.product_name,
            pm.active_users,
            pm.total_users,
            pm.uptime_percentage,
            pm.error_rate,
            pm.avg_response_time
        FROM product_metrics pm
        WHERE pm.product_name = p_product_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update Product Metrics
CREATE OR REPLACE FUNCTION update_product_metrics(
    p_product_name TEXT,
    p_active_users INTEGER DEFAULT NULL,
    p_uptime DECIMAL DEFAULT NULL,
    p_response_time INTEGER DEFAULT NULL,
    p_error_rate DECIMAL DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE product_metrics
    SET
        active_users = COALESCE(p_active_users, active_users),
        uptime_percentage = COALESCE(p_uptime, uptime_percentage),
        avg_response_time = COALESCE(p_response_time, avg_response_time),
        error_rate = COALESCE(p_error_rate, error_rate),
        updated_at = NOW()
    WHERE product_name = p_product_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read analytics
CREATE POLICY "Allow authenticated read analytics_events"
    ON analytics_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read daily_summary"
    ON analytics_daily_summary FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read product_metrics"
    ON product_metrics FOR SELECT
    TO authenticated
    USING (true);

-- Policies: Allow service role to write
CREATE POLICY "Allow service insert analytics_events"
    ON analytics_events FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Allow service update product_metrics"
    ON product_metrics FOR UPDATE
    TO service_role
    USING (true);

-- Policies: Allow users to see their own activity
CREATE POLICY "Users see own activity"
    ON user_activity_log FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================
-- 8. MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- View: Last 24 Hours Overview
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_24h_overview AS
SELECT
    product_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(page_load_time)::INTEGER as avg_load_time,
    COUNT(*) FILTER (WHERE event_type = 'error') as error_count
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY product_name;

CREATE UNIQUE INDEX ON analytics_24h_overview (product_name);

-- Refresh schedule (set up in cron or edge function)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_24h_overview;

-- =====================================================
-- 9. TRIGGER FOR AUTO-SUMMARY
-- =====================================================

-- Function to update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO analytics_daily_summary (
        product_name,
        date,
        page_views
    ) VALUES (
        NEW.product_name,
        CURRENT_DATE,
        1
    )
    ON CONFLICT (product_name, date)
    DO UPDATE SET
        page_views = analytics_daily_summary.page_views + 1,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on page view events
CREATE TRIGGER auto_update_daily_summary
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'page_view')
    EXECUTE FUNCTION update_daily_summary();

-- =====================================================
-- 10. SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample events for last 7 days
DO $$
DECLARE
    v_date DATE;
    v_product TEXT;
BEGIN
    FOR v_date IN SELECT generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day'::interval)::DATE
    LOOP
        FOREACH v_product IN ARRAY ARRAY['longsang', 'vungtau', 'sabo-arena', 'ls-secretary']
        LOOP
            INSERT INTO analytics_daily_summary (
                product_name,
                date,
                page_views,
                unique_visitors,
                new_visitors,
                avg_time_on_site,
                bounce_rate,
                conversions,
                avg_page_load_time
            ) VALUES (
                v_product,
                v_date,
                FLOOR(RANDOM() * 1000 + 100)::INTEGER,
                FLOOR(RANDOM() * 500 + 50)::INTEGER,
                FLOOR(RANDOM() * 100 + 10)::INTEGER,
                FLOOR(RANDOM() * 300 + 60)::INTEGER,
                (RANDOM() * 30 + 20)::DECIMAL(5,2),
                FLOOR(RANDOM() * 50 + 5)::INTEGER,
                FLOOR(RANDOM() * 500 + 200)::INTEGER
            )
            ON CONFLICT (product_name, date) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Grant permissions
GRANT SELECT ON analytics_events TO authenticated;
GRANT SELECT ON analytics_daily_summary TO authenticated;
GRANT SELECT ON product_metrics TO authenticated;
GRANT SELECT ON funnel_analytics TO authenticated;
GRANT SELECT ON analytics_24h_overview TO authenticated;

GRANT EXECUTE ON FUNCTION track_analytics_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_overview TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Analytics system created successfully!';
    RAISE NOTICE '📊 Tables: analytics_events, analytics_daily_summary, product_metrics';
    RAISE NOTICE '🔧 Functions: track_analytics_event(), get_daily_stats(), get_product_overview()';
    RAISE NOTICE '🔒 RLS enabled for all tables';
END $$;
