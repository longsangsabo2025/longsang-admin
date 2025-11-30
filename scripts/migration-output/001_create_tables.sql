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

