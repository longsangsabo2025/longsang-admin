-- ============================================================================
-- BUG SYSTEM MIGRATION - COMPLETE SQL
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- BUG DETECTION & SELF-HEALING SYSTEM - DATABASE TABLES
-- Vungtau Dream Homes
-- ============================================================================

-- 1. ERROR_LOGS TABLE
-- Stores all application errors for analysis and monitoring
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  page_url TEXT,
  user_agent TEXT,
  context JSONB DEFAULT '{}'::jsonb, -- Additional context data
  sentry_event_id VARCHAR(255), -- Link to Sentry event
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_sentry_event_id ON public.error_logs(sentry_event_id) WHERE sentry_event_id IS NOT NULL;

-- 2. BUG_REPORTS TABLE
-- Aggregated bug reports from error logs
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_log_id UUID REFERENCES public.error_logs(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('network', 'auth', 'validation', 'database', 'ui', 'api', 'unknown')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'fixed', 'closed', 'duplicate')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  fixed_at TIMESTAMPTZ,
  fixed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fix_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bug_reports
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_category ON public.bug_reports(category);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON public.bug_reports(priority);
CREATE INDEX IF NOT EXISTS idx_bug_reports_last_seen_at ON public.bug_reports(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_error_log_id ON public.bug_reports(error_log_id) WHERE error_log_id IS NOT NULL;

-- 3. HEALING_ACTIONS TABLE
-- Tracks self-healing actions taken by the system
CREATE TABLE IF NOT EXISTS public.healing_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_log_id UUID REFERENCES public.error_logs(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('retry', 'circuit_breaker', 'fallback', 'cache', 'skip')),
  action_result VARCHAR(20) CHECK (action_result IN ('success', 'failed', 'skipped', 'timeout')),
  retry_count INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for healing_actions
CREATE INDEX IF NOT EXISTS idx_healing_actions_error_log_id ON public.healing_actions(error_log_id);
CREATE INDEX IF NOT EXISTS idx_healing_actions_action_type ON public.healing_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_healing_actions_action_result ON public.healing_actions(action_result);
CREATE INDEX IF NOT EXISTS idx_healing_actions_created_at ON public.healing_actions(created_at DESC);

-- 4. ERROR_PATTERNS TABLE
-- Detected error patterns for learning and prevention
CREATE TABLE IF NOT EXISTS public.error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL,
  pattern_signature TEXT NOT NULL, -- Hash or signature of error pattern
  error_type VARCHAR(100),
  category VARCHAR(50),
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  suggested_fix TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pattern_signature)
);

-- Indexes for error_patterns
CREATE INDEX IF NOT EXISTS idx_error_patterns_pattern_signature ON public.error_patterns(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_error_patterns_is_resolved ON public.error_patterns(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_patterns_category ON public.error_patterns(category);
CREATE INDEX IF NOT EXISTS idx_error_patterns_last_seen_at ON public.error_patterns(last_seen_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healing_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_patterns ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@vungtauland.store'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- error_logs policies
CREATE POLICY "Users can view own errors"
  ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all errors"
  ON public.error_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service role can insert errors"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- bug_reports policies (admins only)
CREATE POLICY "Admins can view bug reports"
  ON public.bug_reports FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage bug reports"
  ON public.bug_reports FOR ALL
  USING (public.is_admin());

-- healing_actions policies (admins only)
CREATE POLICY "Admins can view healing actions"
  ON public.healing_actions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service role can insert healing actions"
  ON public.healing_actions FOR INSERT
  WITH CHECK (true);

-- error_patterns policies (admins only)
CREATE POLICY "Admins can view error patterns"
  ON public.error_patterns FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage error patterns"
  ON public.error_patterns FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

-- Function to update updated_at timestamp (reuse existing if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables with updated_at
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_error_patterns_updated_at
  BEFORE UPDATE ON public.error_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.error_logs IS 'Stores all application errors for monitoring and analysis';
COMMENT ON TABLE public.bug_reports IS 'Aggregated bug reports from error logs';
COMMENT ON TABLE public.healing_actions IS 'Tracks self-healing actions taken by the system';
COMMENT ON TABLE public.error_patterns IS 'Detected error patterns for learning and prevention';



-- ============================================================================
-- BUG DETECTION & SELF-HEALING SYSTEM - DATABASE FUNCTIONS
-- Vungtau Dream Homes
-- ============================================================================

-- ============================================================================
-- FUNCTION: classify_error
-- Classifies an error into a category based on error message and stack
-- ============================================================================
CREATE OR REPLACE FUNCTION public.classify_error(
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_category VARCHAR(50);
  v_message_lower TEXT;
BEGIN
  v_message_lower := LOWER(COALESCE(p_error_message, ''));
  v_category := 'unknown';

  -- Network errors
  IF v_message_lower LIKE '%network%'
     OR v_message_lower LIKE '%timeout%'
     OR v_message_lower LIKE '%connection%'
     OR v_message_lower LIKE '%fetch%'
     OR v_message_lower LIKE '%axios%'
     OR v_message_lower LIKE '%request failed%' THEN
    v_category := 'network';

  -- Authentication errors
  ELSIF v_message_lower LIKE '%auth%'
        OR v_message_lower LIKE '%unauthorized%'
        OR v_message_lower LIKE '%forbidden%'
        OR v_message_lower LIKE '%401%'
        OR v_message_lower LIKE '%403%'
        OR v_message_lower LIKE '%token%'
        OR v_message_lower LIKE '%login%'
        OR v_message_lower LIKE '%session%' THEN
    v_category := 'auth';

  -- Validation errors
  ELSIF v_message_lower LIKE '%validation%'
        OR v_message_lower LIKE '%invalid%'
        OR v_message_lower LIKE '%required%'
        OR v_message_lower LIKE '%format%'
        OR v_message_lower LIKE '%400%'
        OR v_message_lower LIKE '%zod%'
        OR v_message_lower LIKE '%schema%' THEN
    v_category := 'validation';

  -- Database errors
  ELSIF v_message_lower LIKE '%database%'
        OR v_message_lower LIKE '%sql%'
        OR v_message_lower LIKE '%postgres%'
        OR v_message_lower LIKE '%supabase%'
        OR v_message_lower LIKE '%foreign key%'
        OR v_message_lower LIKE '%constraint%'
        OR v_message_lower LIKE '%duplicate%'
        OR v_message_lower LIKE '%null%' THEN
    v_category := 'database';

  -- API errors
  ELSIF v_message_lower LIKE '%api%'
        OR v_message_lower LIKE '%endpoint%'
        OR v_message_lower LIKE '%500%'
        OR v_message_lower LIKE '%502%'
        OR v_message_lower LIKE '%503%'
        OR v_message_lower LIKE '%504%' THEN
    v_category := 'api';

  -- UI errors
  ELSIF v_message_lower LIKE '%render%'
        OR v_message_lower LIKE '%component%'
        OR v_message_lower LIKE '%react%'
        OR v_message_lower LIKE '%dom%'
        OR v_message_lower LIKE '%cannot read%'
        OR v_message_lower LIKE '%undefined%' THEN
    v_category := 'ui';
  END IF;

  RETURN v_category;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: get_error_statistics
-- Returns error statistics for a given time period
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_error_statistics(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  high_errors BIGINT,
  medium_errors BIGINT,
  low_errors BIGINT,
  errors_by_category JSONB,
  errors_by_type JSONB,
  avg_errors_per_day NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_errors,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_errors,
    COUNT(*) FILTER (WHERE severity = 'high')::BIGINT as high_errors,
    COUNT(*) FILTER (WHERE severity = 'medium')::BIGINT as medium_errors,
    COUNT(*) FILTER (WHERE severity = 'low')::BIGINT as low_errors,
    (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT
          public.classify_error(error_message, error_stack) as category,
          COUNT(*)::BIGINT as count
        FROM public.error_logs
        WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY category
      ) sub
    ) as errors_by_category,
    (
      SELECT jsonb_object_agg(error_type, count)
      FROM (
        SELECT error_type, COUNT(*)::BIGINT as count
        FROM public.error_logs
        WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY error_type
      ) sub
    ) as errors_by_type,
    ROUND(COUNT(*)::NUMERIC / NULLIF(p_days, 0), 2) as avg_errors_per_day
  FROM public.error_logs
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: detect_error_patterns
-- Analyzes error logs to find recurring patterns
-- ============================================================================
CREATE OR REPLACE FUNCTION public.detect_error_patterns(
  p_min_occurrences INTEGER DEFAULT 3,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  pattern_signature TEXT,
  error_type VARCHAR(100),
  error_message_sample TEXT,
  category VARCHAR(50),
  occurrence_count BIGINT,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Create a signature from error type and first 100 chars of message
    MD5(error_type || '|' || LEFT(error_message, 100)) as pattern_signature,
    error_type,
    LEFT(error_message, 200) as error_message_sample,
    public.classify_error(error_message, error_stack) as category,
    COUNT(*)::BIGINT as occurrence_count,
    MIN(created_at) as first_seen_at,
    MAX(created_at) as last_seen_at
  FROM public.error_logs
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY
    error_type,
    LEFT(error_message, 100),
    LEFT(error_message, 200),
    error_stack
  HAVING COUNT(*) >= p_min_occurrences
  ORDER BY occurrence_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_healing_statistics
-- Returns statistics about self-healing actions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_healing_statistics(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_actions BIGINT,
  successful_actions BIGINT,
  failed_actions BIGINT,
  actions_by_type JSONB,
  success_rate NUMERIC,
  avg_execution_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_actions,
    COUNT(*) FILTER (WHERE action_result = 'success')::BIGINT as successful_actions,
    COUNT(*) FILTER (WHERE action_result = 'failed')::BIGINT as failed_actions,
    (
      SELECT jsonb_object_agg(action_type, count)
      FROM (
        SELECT action_type, COUNT(*)::BIGINT as count
        FROM public.healing_actions
        WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY action_type
      ) sub
    ) as actions_by_type,
    ROUND(
      (COUNT(*) FILTER (WHERE action_result = 'success')::NUMERIC /
       NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    ROUND(AVG(execution_time_ms), 2) as avg_execution_time_ms
  FROM public.healing_actions
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: create_or_update_bug_report
-- Creates or updates a bug report based on error log
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_or_update_bug_report(
  p_error_log_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_error_log RECORD;
  v_bug_report_id UUID;
  v_category VARCHAR(50);
  v_severity VARCHAR(20);
  v_priority VARCHAR(20);
BEGIN
  -- Get error log details
  SELECT * INTO v_error_log
  FROM public.error_logs
  WHERE id = p_error_log_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Error log not found: %', p_error_log_id;
  END IF;

  -- Classify error
  v_category := public.classify_error(v_error_log.error_message, v_error_log.error_stack);
  v_severity := v_error_log.severity;

  -- Determine priority based on severity
  v_priority := CASE v_severity
    WHEN 'critical' THEN 'critical'
    WHEN 'high' THEN 'high'
    WHEN 'medium' THEN 'medium'
    ELSE 'low'
  END;

  -- Check if bug report already exists for this error pattern
  SELECT id INTO v_bug_report_id
  FROM public.bug_reports
  WHERE title = v_error_log.error_type
    AND category = v_category
    AND status IN ('open', 'investigating')
  LIMIT 1;

  IF v_bug_report_id IS NOT NULL THEN
    -- Update existing bug report
    UPDATE public.bug_reports
    SET
      occurrence_count = occurrence_count + 1,
      last_seen_at = NOW(),
      error_log_id = p_error_log_id
    WHERE id = v_bug_report_id;
  ELSE
    -- Create new bug report
    INSERT INTO public.bug_reports (
      error_log_id,
      title,
      description,
      category,
      priority,
      status
    ) VALUES (
      p_error_log_id,
      v_error_log.error_type,
      LEFT(v_error_log.error_message, 500),
      v_category,
      v_priority,
      'open'
    )
    RETURNING id INTO v_bug_report_id;
  END IF;

  RETURN v_bug_report_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.classify_error IS 'Classifies an error into a category based on error message and stack';
COMMENT ON FUNCTION public.get_error_statistics IS 'Returns error statistics for a given time period';
COMMENT ON FUNCTION public.detect_error_patterns IS 'Analyzes error logs to find recurring patterns';
COMMENT ON FUNCTION public.get_healing_statistics IS 'Returns statistics about self-healing actions';
COMMENT ON FUNCTION public.create_or_update_bug_report IS 'Creates or updates a bug report based on error log';


