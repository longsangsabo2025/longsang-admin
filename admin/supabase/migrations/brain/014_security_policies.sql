-- ================================================
-- Phase 6A - Security Policies Enhancement
-- ================================================
-- Review and enhance existing RLS policies
-- Add audit logging and cross-domain access policies

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.brain_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'read', 'share'
  resource_type TEXT NOT NULL, -- 'knowledge', 'domain', 'workflow', etc.
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_brain_audit_logs_user_id ON public.brain_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_audit_logs_resource ON public.brain_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_brain_audit_logs_created_at ON public.brain_audit_logs(created_at DESC);

-- RLS for audit logs - users can only see their own logs
ALTER TABLE public.brain_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own audit logs"
  ON public.brain_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Enhanced policy for brain_knowledge - add explicit read policy
-- (assuming existing policy exists, this adds read-only access for shared knowledge)
DO $$
BEGIN
  -- Check if policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'brain_knowledge'
    AND policyname = 'Users can read their own knowledge'
  ) THEN
    CREATE POLICY "Users can read their own knowledge"
      ON public.brain_knowledge FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Enhanced policy for cross-domain knowledge access (if collaboration is enabled)
-- This allows users to access knowledge from domains they have access to
-- Note: This is a placeholder - actual implementation depends on collaboration features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'brain_knowledge'
    AND policyname = 'Users can read shared domain knowledge'
  ) THEN
    -- This policy will be enhanced when collaboration features are added
    -- For now, it's a placeholder that matches existing behavior
    CREATE POLICY "Users can read shared domain knowledge"
      ON public.brain_knowledge FOR SELECT
      USING (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM public.brain_domains d
          WHERE d.id = brain_knowledge.domain_id
          AND d.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Enhanced policy for brain_query_history - ensure users can only see their own queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'brain_query_history'
    AND policyname = 'Users can view their own query history'
  ) THEN
    CREATE POLICY "Users can view their own query history"
      ON public.brain_query_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Enhanced policy for brain_master_session - ensure users can only access their own sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'brain_master_session'
    AND policyname = 'Users can manage their own sessions'
  ) THEN
    CREATE POLICY "Users can manage their own sessions"
      ON public.brain_master_session FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.brain_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- Create view for audit log summary (users can only see their own)
CREATE OR REPLACE VIEW public.brain_audit_logs_summary AS
SELECT
  user_id,
  action,
  resource_type,
  COUNT(*) as action_count,
  MAX(created_at) as last_action_at
FROM public.brain_audit_logs
WHERE user_id = auth.uid()
GROUP BY user_id, action, resource_type;

-- Grant select on view
GRANT SELECT ON public.brain_audit_logs_summary TO authenticated;

-- Add comment
COMMENT ON TABLE public.brain_audit_logs IS 'Audit log for security and compliance tracking';
COMMENT ON FUNCTION public.log_audit_event IS 'Function to log audit events securely';


