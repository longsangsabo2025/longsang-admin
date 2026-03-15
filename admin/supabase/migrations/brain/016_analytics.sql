-- ================================================
-- Phase 6B - Analytics System
-- ================================================
-- Analytics events tracking and materialized views

-- Analytics Events Table
CREATE TABLE public.brain_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'query', 'knowledge_access', 'workflow_trigger', 'action_executed', 'domain_created', etc.
  event_data JSONB DEFAULT '{}'::jsonb, -- Event-specific data
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID REFERENCES public.brain_master_session(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb -- Additional metadata
);

-- Indexes for performance
CREATE INDEX idx_brain_analytics_events_user_id ON public.brain_analytics_events(user_id);
CREATE INDEX idx_brain_analytics_events_type ON public.brain_analytics_events(event_type);
CREATE INDEX idx_brain_analytics_events_timestamp ON public.brain_analytics_events(timestamp DESC);

-- Composite index for common queries
CREATE INDEX idx_brain_analytics_events_user_type_timestamp
  ON public.brain_analytics_events(user_id, event_type, timestamp DESC);

-- RLS Policies
ALTER TABLE public.brain_analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analytics events"
  ON public.brain_analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Materialized view for daily user activity
CREATE MATERIALIZED VIEW public.brain_analytics_daily_user_activity AS
SELECT
  user_id,
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as event_count
FROM public.brain_analytics_events
GROUP BY user_id, DATE(timestamp), event_type;

-- Index on materialized view
CREATE INDEX idx_brain_analytics_daily_user_activity_user_date
  ON public.brain_analytics_daily_user_activity(user_id, date DESC);

-- Materialized view for domain usage statistics
CREATE MATERIALIZED VIEW public.brain_analytics_domain_usage AS
SELECT
  (event_data->>'domain_id')::UUID as domain_id,
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.brain_analytics_events
WHERE event_data->>'domain_id' IS NOT NULL
GROUP BY (event_data->>'domain_id')::UUID, DATE(timestamp), event_type;

-- Index on materialized view
CREATE INDEX idx_brain_analytics_domain_usage_domain_date
  ON public.brain_analytics_domain_usage(domain_id, date DESC);

-- Materialized view for query patterns
CREATE MATERIALIZED VIEW public.brain_analytics_query_patterns AS
SELECT
  user_id,
  DATE(timestamp) as date,
  COUNT(*) as query_count,
  AVG((event_data->>'response_time_ms')::NUMERIC) as avg_response_time,
  COUNT(DISTINCT (event_data->>'domain_id')::UUID) as domains_queried
FROM public.brain_analytics_events
WHERE event_type = 'query'
GROUP BY user_id, DATE(timestamp);

-- Index on materialized view
CREATE INDEX idx_brain_analytics_query_patterns_user_date
  ON public.brain_analytics_query_patterns(user_id, date DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.brain_analytics_daily_user_activity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.brain_analytics_domain_usage;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.brain_analytics_query_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views TO authenticated;

-- Function to get user behavior analytics
CREATE OR REPLACE FUNCTION public.get_user_behavior_analytics(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  avg_per_day NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.event_type,
    COUNT(*)::BIGINT as event_count,
    COUNT(*)::NUMERIC / GREATEST(EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400, 1) as avg_per_day
  FROM public.brain_analytics_events e
  WHERE e.user_id = p_user_id
    AND e.timestamp >= p_start_date
    AND e.timestamp <= p_end_date
  GROUP BY e.event_type
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_behavior_analytics TO authenticated;

-- Function to get system performance metrics
CREATE OR REPLACE FUNCTION public.get_system_performance_metrics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'avg_query_response_time'::TEXT as metric_name,
    AVG((event_data->>'response_time_ms')::NUMERIC) as metric_value,
    'ms'::TEXT as unit
  FROM public.brain_analytics_events
  WHERE event_type = 'query'
    AND timestamp >= p_start_date
    AND timestamp <= p_end_date
    AND event_data->>'response_time_ms' IS NOT NULL

  UNION ALL

  SELECT
    'total_queries'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT
  FROM public.brain_analytics_events
  WHERE event_type = 'query'
    AND timestamp >= p_start_date
    AND timestamp <= p_end_date

  UNION ALL

  SELECT
    'unique_active_users'::TEXT,
    COUNT(DISTINCT user_id)::NUMERIC,
    'count'::TEXT
  FROM public.brain_analytics_events
  WHERE timestamp >= p_start_date
    AND timestamp <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_system_performance_metrics TO authenticated;

-- Comments
COMMENT ON TABLE public.brain_analytics_events IS 'Analytics events for tracking user behavior and system performance';
COMMENT ON MATERIALIZED VIEW public.brain_analytics_daily_user_activity IS 'Daily user activity summary';
COMMENT ON MATERIALIZED VIEW public.brain_analytics_domain_usage IS 'Domain usage statistics';
COMMENT ON MATERIALIZED VIEW public.brain_analytics_query_patterns IS 'Query patterns analysis';


