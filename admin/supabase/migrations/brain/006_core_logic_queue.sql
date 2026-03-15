-- ================================================
-- AI SECOND BRAIN - Core Logic Processing Queue
-- ================================================
-- This migration creates a queue system for core logic distillation jobs

-- ================================================
-- Core Logic Queue Table
-- ================================================
CREATE TABLE public.brain_core_logic_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,

  -- Job status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority

  -- Job metadata
  triggered_by TEXT, -- 'user', 'scheduled', 'auto'
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,

  -- Job configuration
  config JSONB DEFAULT '{}'::jsonb, -- Custom configuration for distillation

  -- Results
  result_core_logic_id UUID REFERENCES public.brain_core_logic(id) ON DELETE SET NULL,
  result_summary JSONB, -- Summary of what was distilled

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CHECK (priority >= 1 AND priority <= 10),
  CHECK (retry_count >= 0)
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_brain_core_logic_queue_domain_id ON public.brain_core_logic_queue(domain_id);
CREATE INDEX idx_brain_core_logic_queue_status ON public.brain_core_logic_queue(status);
CREATE INDEX idx_brain_core_logic_queue_priority ON public.brain_core_logic_queue(priority DESC, created_at ASC);
CREATE INDEX idx_brain_core_logic_queue_user_id ON public.brain_core_logic_queue(user_id);
CREATE INDEX idx_brain_core_logic_queue_created_at ON public.brain_core_logic_queue(created_at DESC);

-- Index for finding pending jobs
CREATE INDEX idx_brain_core_logic_queue_pending
  ON public.brain_core_logic_queue(status, priority, created_at)
  WHERE status = 'pending';

-- ================================================
-- FUNCTION: Get Next Pending Job
-- ================================================
CREATE OR REPLACE FUNCTION public.get_next_distillation_job()
RETURNS TABLE (
  id UUID,
  domain_id UUID,
  config JSONB,
  user_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Get the highest priority pending job
  SELECT brain_core_logic_queue.id
  INTO v_job_id
  FROM public.brain_core_logic_queue
  WHERE status = 'pending'
  ORDER BY priority ASC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_job_id IS NULL THEN
    RETURN;
  END IF;

  -- Mark as processing
  UPDATE public.brain_core_logic_queue
  SET
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE brain_core_logic_queue.id = v_job_id;

  -- Return job details
  RETURN QUERY
  SELECT
    q.id,
    q.domain_id,
    q.config,
    q.user_id
  FROM public.brain_core_logic_queue q
  WHERE q.id = v_job_id;
END;
$$;

-- ================================================
-- FUNCTION: Mark Job Complete
-- ================================================
CREATE OR REPLACE FUNCTION public.mark_distillation_job_complete(
  p_job_id UUID,
  p_core_logic_id UUID,
  p_summary JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.brain_core_logic_queue
  SET
    status = 'completed',
    completed_at = NOW(),
    result_core_logic_id = p_core_logic_id,
    result_summary = p_summary,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- ================================================
-- FUNCTION: Mark Job Failed
-- ================================================
CREATE OR REPLACE FUNCTION public.mark_distillation_job_failed(
  p_job_id UUID,
  p_error TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_retry_count INTEGER;
  v_max_retries INTEGER;
BEGIN
  SELECT retry_count, max_retries
  INTO v_retry_count, v_max_retries
  FROM public.brain_core_logic_queue
  WHERE id = p_job_id;

  IF v_retry_count < v_max_retries THEN
    -- Retry
    UPDATE public.brain_core_logic_queue
    SET
      status = 'pending',
      retry_count = v_retry_count + 1,
      last_error = p_error,
      started_at = NULL,
      updated_at = NOW()
    WHERE id = p_job_id;
  ELSE
    -- Mark as failed
    UPDATE public.brain_core_logic_queue
    SET
      status = 'failed',
      completed_at = NOW(),
      last_error = p_error,
      updated_at = NOW()
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- ================================================
-- TRIGGER: Update updated_at
-- ================================================
CREATE OR REPLACE FUNCTION public.update_core_logic_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_core_logic_queue_updated_at
  BEFORE UPDATE ON public.brain_core_logic_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_core_logic_queue_updated_at();

-- ================================================
-- RLS POLICIES
-- ================================================
ALTER TABLE public.brain_core_logic_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own distillation jobs"
  ON public.brain_core_logic_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own distillation jobs"
  ON public.brain_core_logic_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own distillation jobs"
  ON public.brain_core_logic_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.get_next_distillation_job TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_distillation_job TO anon;
GRANT EXECUTE ON FUNCTION public.mark_distillation_job_complete TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_distillation_job_complete TO anon;
GRANT EXECUTE ON FUNCTION public.mark_distillation_job_failed TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_distillation_job_failed TO anon;

-- ================================================
-- COMMENT
-- ================================================
COMMENT ON TABLE public.brain_core_logic_queue IS
'Queue for managing core logic distillation jobs with retry logic and priority support';

COMMENT ON FUNCTION public.get_next_distillation_job IS
'Gets the next pending distillation job and marks it as processing';

COMMENT ON FUNCTION public.mark_distillation_job_complete IS
'Marks a distillation job as completed with results';

COMMENT ON FUNCTION public.mark_distillation_job_failed IS
'Marks a distillation job as failed or schedules retry if retries available';

