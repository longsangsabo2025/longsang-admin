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

