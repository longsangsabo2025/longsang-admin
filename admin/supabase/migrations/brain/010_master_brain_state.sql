-- ================================================
-- AI SECOND BRAIN - Master Brain State Management
-- ================================================
-- This migration creates tables for managing Master Brain orchestrator state
-- and multi-domain conversation context

-- ================================================
-- Master Brain Session Table
-- ================================================
CREATE TABLE public.brain_master_session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session identification
  session_name TEXT,
  session_type TEXT DEFAULT 'conversation', -- 'conversation', 'analysis', 'exploration'

  -- Active domains
  active_domain_ids UUID[] DEFAULT '{}', -- Domains involved in this session

  -- Session state
  current_context JSONB DEFAULT '{}'::jsonb, -- Current conversation context
  accumulated_knowledge JSONB DEFAULT '{}'::jsonb, -- Knowledge gathered so far
  session_goals TEXT[], -- Goals for this session

  -- Conversation history
  conversation_history JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}

  -- Session metadata
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Performance metrics
  total_queries INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  avg_response_time_ms FLOAT DEFAULT 0.0,

  -- User feedback
  session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
  session_feedback TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- Multi-Domain Context Table
-- ================================================
CREATE TABLE public.brain_multi_domain_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Context identification
  session_id UUID REFERENCES public.brain_master_session(id) ON DELETE CASCADE,
  context_type TEXT DEFAULT 'query', -- 'query', 'response', 'insight', 'summary'

  -- Domain context
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,

  -- Context content
  context_text TEXT NOT NULL,
  context_embedding vector(1536),

  -- Relevant knowledge
  knowledge_ids UUID[] DEFAULT '{}', -- Knowledge items used
  core_logic_ids UUID[] DEFAULT '{}', -- Core logic used

  -- Context metadata
  relevance_score FLOAT DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),

  -- Relationships
  related_context_ids UUID[] DEFAULT '{}', -- Related contexts in other domains

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CHECK (context_type IN ('query', 'response', 'insight', 'summary', 'note'))
);

-- ================================================
-- Orchestration State Table
-- ================================================
CREATE TABLE public.brain_orchestration_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session reference
  session_id UUID REFERENCES public.brain_master_session(id) ON DELETE CASCADE,

  -- Current state
  current_step TEXT, -- 'gathering', 'analyzing', 'synthesizing', 'responding'
  step_progress FLOAT DEFAULT 0.0 CHECK (step_progress >= 0 AND step_progress <= 1),

  -- Orchestration data
  gathered_context JSONB DEFAULT '{}'::jsonb, -- Context from all domains
  analysis_results JSONB DEFAULT '{}'::jsonb, -- Analysis results
  synthesis_data JSONB DEFAULT '{}'::jsonb, -- Data for synthesis

  -- Domain status
  domain_status JSONB DEFAULT '{}'::jsonb, -- {domain_id: {status, results, ...}}

  -- Error handling
  errors JSONB DEFAULT '[]'::jsonb, -- Array of errors encountered
  warnings JSONB DEFAULT '[]'::jsonb, -- Array of warnings

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- INDEXES
-- ================================================
-- Master session indexes
CREATE INDEX idx_brain_master_session_user_id ON public.brain_master_session(user_id);
CREATE INDEX idx_brain_master_session_active ON public.brain_master_session(is_active) WHERE is_active = true;
CREATE INDEX idx_brain_master_session_last_activity ON public.brain_master_session(last_activity_at DESC);
CREATE INDEX idx_brain_master_session_domain_ids ON public.brain_master_session USING GIN(active_domain_ids);

-- Multi-domain context indexes
CREATE INDEX idx_brain_multi_domain_context_session_id ON public.brain_multi_domain_context(session_id);
CREATE INDEX idx_brain_multi_domain_context_domain_id ON public.brain_multi_domain_context(domain_id);
CREATE INDEX idx_brain_multi_domain_context_user_id ON public.brain_multi_domain_context(user_id);
CREATE INDEX idx_brain_multi_domain_context_type ON public.brain_multi_domain_context(context_type);
CREATE INDEX idx_brain_multi_domain_context_embedding ON public.brain_multi_domain_context USING ivfflat (context_embedding vector_cosine_ops) WITH (lists = 100);

-- Orchestration state indexes
CREATE INDEX idx_brain_orchestration_state_session_id ON public.brain_orchestration_state(session_id);
CREATE INDEX idx_brain_orchestration_state_user_id ON public.brain_orchestration_state(user_id);
CREATE INDEX idx_brain_orchestration_state_step ON public.brain_orchestration_state(current_step);

-- ================================================
-- FUNCTION: Create Master Session
-- ================================================
CREATE OR REPLACE FUNCTION public.create_master_session(
  p_session_name TEXT,
  p_domain_ids UUID[],
  p_user_id UUID,
  p_session_type TEXT DEFAULT 'conversation'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.brain_master_session (
    session_name,
    session_type,
    active_domain_ids,
    user_id
  )
  VALUES (
    p_session_name,
    p_session_type,
    p_domain_ids,
    p_user_id
  )
  RETURNING id INTO v_session_id;

  -- Create initial orchestration state
  INSERT INTO public.brain_orchestration_state (
    session_id,
    current_step,
    user_id
  )
  VALUES (
    v_session_id,
    'initialized',
    p_user_id
  );

  RETURN v_session_id;
END;
$$;

-- ================================================
-- FUNCTION: Add Context to Session
-- ================================================
CREATE OR REPLACE FUNCTION public.add_session_context(
  p_session_id UUID,
  p_domain_id UUID,
  p_context_text TEXT,
  p_user_id UUID,
  p_context_type TEXT DEFAULT 'query',
  p_context_embedding vector(1536) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_context_id UUID;
BEGIN
  INSERT INTO public.brain_multi_domain_context (
    session_id,
    domain_id,
    context_text,
    context_type,
    context_embedding,
    user_id
  )
  VALUES (
    p_session_id,
    p_domain_id,
    p_context_text,
    p_context_type,
    p_context_embedding,
    p_user_id
  )
  RETURNING id INTO v_context_id;

  -- Update session last activity
  UPDATE public.brain_master_session
  SET
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;

  RETURN v_context_id;
END;
$$;

-- ================================================
-- FUNCTION: Update Orchestration State
-- ================================================
CREATE OR REPLACE FUNCTION public.update_orchestration_state(
  p_session_id UUID,
  p_current_step TEXT,
  p_user_id UUID,
  p_step_progress FLOAT DEFAULT 0.0,
  p_gathered_context JSONB DEFAULT NULL,
  p_analysis_results JSONB DEFAULT NULL,
  p_synthesis_data JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brain_orchestration_state
  SET
    current_step = COALESCE(p_current_step, current_step),
    step_progress = COALESCE(p_step_progress, step_progress),
    gathered_context = COALESCE(p_gathered_context, gathered_context),
    analysis_results = COALESCE(p_analysis_results, analysis_results),
    synthesis_data = COALESCE(p_synthesis_data, synthesis_data),
    updated_at = NOW()
  WHERE session_id = p_session_id AND user_id = p_user_id;
END;
$$;

-- ================================================
-- FUNCTION: Get Session Context
-- ================================================
CREATE OR REPLACE FUNCTION public.get_session_context(
  p_session_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  context_id UUID,
  domain_id UUID,
  domain_name TEXT,
  context_text TEXT,
  context_type TEXT,
  relevance_score FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.domain_id,
    d.name,
    c.context_text,
    c.context_type,
    c.relevance_score,
    c.created_at
  FROM public.brain_multi_domain_context c
  JOIN public.brain_domains d ON d.id = c.domain_id
  WHERE c.session_id = p_session_id
    AND c.user_id = p_user_id
  ORDER BY c.relevance_score DESC, c.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ================================================
-- FUNCTION: End Session
-- ================================================
CREATE OR REPLACE FUNCTION public.end_master_session(
  p_session_id UUID,
  p_user_id UUID,
  p_rating INTEGER DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brain_master_session
  SET
    is_active = false,
    ended_at = NOW(),
    session_rating = COALESCE(p_rating, session_rating),
    session_feedback = COALESCE(p_feedback, session_feedback),
    updated_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
END;
$$;

-- ================================================
-- TRIGGERS
-- ================================================
CREATE OR REPLACE FUNCTION public.update_master_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_master_session_updated_at
  BEFORE UPDATE ON public.brain_master_session
  FOR EACH ROW
  EXECUTE FUNCTION public.update_master_session_updated_at();

CREATE TRIGGER update_orchestration_state_updated_at
  BEFORE UPDATE ON public.brain_orchestration_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_master_session_updated_at();

-- ================================================
-- RLS POLICIES
-- ================================================
ALTER TABLE public.brain_master_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_multi_domain_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_orchestration_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own master sessions"
  ON public.brain_master_session FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own master sessions"
  ON public.brain_master_session FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own master sessions"
  ON public.brain_master_session FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own master sessions"
  ON public.brain_master_session FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own multi-domain context"
  ON public.brain_multi_domain_context FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own multi-domain context"
  ON public.brain_multi_domain_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own multi-domain context"
  ON public.brain_multi_domain_context FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own multi-domain context"
  ON public.brain_multi_domain_context FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orchestration state"
  ON public.brain_orchestration_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orchestration state"
  ON public.brain_orchestration_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orchestration state"
  ON public.brain_orchestration_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.create_master_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_master_session TO anon;
GRANT EXECUTE ON FUNCTION public.add_session_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_session_context TO anon;
GRANT EXECUTE ON FUNCTION public.update_orchestration_state TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_orchestration_state TO anon;
GRANT EXECUTE ON FUNCTION public.get_session_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_context TO anon;
GRANT EXECUTE ON FUNCTION public.end_master_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_master_session TO anon;

-- ================================================
-- COMMENT
-- ================================================
COMMENT ON TABLE public.brain_master_session IS
'Master Brain session for managing multi-domain conversations';

COMMENT ON TABLE public.brain_multi_domain_context IS
'Context from multiple domains within a session';

COMMENT ON TABLE public.brain_orchestration_state IS
'Current state of the orchestration process';

COMMENT ON FUNCTION public.create_master_session IS
'Creates a new Master Brain session';

COMMENT ON FUNCTION public.add_session_context IS
'Adds context from a domain to a session';

COMMENT ON FUNCTION public.update_orchestration_state IS
'Updates the orchestration state';

COMMENT ON FUNCTION public.get_session_context IS
'Gets all context for a session';

COMMENT ON FUNCTION public.end_master_session IS
'Ends a Master Brain session';

