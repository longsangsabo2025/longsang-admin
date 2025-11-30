-- ================================================
-- AI SECOND BRAIN - Query Routing System
-- ================================================
-- This migration creates tables for tracking query routing decisions
-- and learning from routing performance

-- ================================================
-- Query Routing Table
-- ================================================
CREATE TABLE public.brain_query_routing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Query information
  query_text TEXT NOT NULL,
  query_embedding vector(1536),

  -- Routing decision
  selected_domain_ids UUID[] DEFAULT '{}', -- Domains selected for this query
  routing_strategy TEXT DEFAULT 'auto', -- 'auto', 'manual', 'hybrid'
  routing_confidence FLOAT DEFAULT 0.5 CHECK (routing_confidence >= 0 AND routing_confidence <= 1),

  -- Domain relevance scores
  domain_scores JSONB DEFAULT '{}'::jsonb, -- {domain_id: score, ...}

  -- Results
  results_count INTEGER DEFAULT 0,
  results_quality_score FLOAT DEFAULT 0.0 CHECK (results_quality_score >= 0 AND results_quality_score <= 1),

  -- Performance metrics
  latency_ms INTEGER,
  tokens_used INTEGER,
  cost_usd FLOAT,

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  was_helpful BOOLEAN,

  -- Learning data
  learning_data JSONB DEFAULT '{}'::jsonb, -- Data for improving routing

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- Domain Relevance History Table
-- ================================================
CREATE TABLE public.brain_domain_relevance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Domain and query
  domain_id UUID NOT NULL REFERENCES public.brain_domains(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_embedding vector(1536),

  -- Relevance metrics
  relevance_score FLOAT NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  similarity_score FLOAT, -- Vector similarity
  keyword_match_score FLOAT, -- Keyword matching score
  context_score FLOAT, -- Context-based score

  -- Routing decision
  was_selected BOOLEAN DEFAULT false,
  selection_rank INTEGER, -- Rank if selected (1 = highest)

  -- Results quality
  results_count INTEGER DEFAULT 0,
  avg_result_similarity FLOAT,

  -- Learning
  feedback_score FLOAT, -- Based on user feedback

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- Routing Performance Metrics Table
-- ================================================
CREATE TABLE public.brain_routing_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'

  -- Domain metrics
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,

  -- Performance metrics
  total_queries INTEGER DEFAULT 0,
  selected_count INTEGER DEFAULT 0, -- Times this domain was selected
  avg_relevance_score FLOAT DEFAULT 0.0,
  avg_results_quality FLOAT DEFAULT 0.0,
  avg_latency_ms FLOAT DEFAULT 0.0,
  avg_user_rating FLOAT DEFAULT 0.0,

  -- Learning metrics
  improvement_trend FLOAT DEFAULT 0.0, -- Positive = improving

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Constraints
  CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly'))
);

-- ================================================
-- INDEXES
-- ================================================
-- Query routing indexes
CREATE INDEX idx_brain_query_routing_user_id ON public.brain_query_routing(user_id);
CREATE INDEX idx_brain_query_routing_created_at ON public.brain_query_routing(created_at DESC);
CREATE INDEX idx_brain_query_routing_embedding ON public.brain_query_routing USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_brain_query_routing_rating ON public.brain_query_routing(user_rating) WHERE user_rating IS NOT NULL;

-- Domain relevance history indexes
CREATE INDEX idx_brain_domain_relevance_domain_id ON public.brain_domain_relevance_history(domain_id);
CREATE INDEX idx_brain_domain_relevance_user_id ON public.brain_domain_relevance_history(user_id);
CREATE INDEX idx_brain_domain_relevance_score ON public.brain_domain_relevance_history(relevance_score DESC);
CREATE INDEX idx_brain_domain_relevance_created_at ON public.brain_domain_relevance_history(created_at DESC);
CREATE INDEX idx_brain_domain_relevance_embedding ON public.brain_domain_relevance_history USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 100);

-- Routing performance indexes
CREATE INDEX idx_brain_routing_performance_domain_id ON public.brain_routing_performance(domain_id);
CREATE INDEX idx_brain_routing_performance_period ON public.brain_routing_performance(period_start, period_end);
CREATE INDEX idx_brain_routing_performance_user_id ON public.brain_routing_performance(user_id);

-- ================================================
-- FUNCTION: Score Domain Relevance
-- ================================================
CREATE OR REPLACE FUNCTION public.score_domain_relevance(
  p_query_text TEXT,
  p_query_embedding vector(1536),
  p_domain_id UUID,
  p_user_id UUID
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_similarity_score FLOAT := 0.0;
  v_keyword_score FLOAT := 0.0;
  v_context_score FLOAT := 0.0;
  v_final_score FLOAT := 0.0;
  v_domain_embedding vector(1536);
  v_domain_name TEXT;
  v_domain_description TEXT;
BEGIN
  -- Get domain info
  SELECT name, description INTO v_domain_name, v_domain_description
  FROM public.brain_domains
  WHERE id = p_domain_id AND user_id = p_user_id;

  IF v_domain_name IS NULL THEN
    RETURN 0.0;
  END IF;

  -- Calculate similarity score (vector similarity with domain knowledge)
  SELECT AVG(1 - (knowledge.embedding <=> p_query_embedding))
  INTO v_similarity_score
  FROM public.brain_knowledge knowledge
  WHERE knowledge.domain_id = p_domain_id
    AND knowledge.user_id = p_user_id
    AND knowledge.embedding IS NOT NULL
  LIMIT 10;

  IF v_similarity_score IS NULL THEN
    v_similarity_score := 0.0;
  END IF;

  -- Calculate keyword score (text matching)
  SELECT
    CASE
      WHEN to_tsvector('english', COALESCE(v_domain_name, '') || ' ' || COALESCE(v_domain_description, ''))
           @@ plainto_tsquery('english', p_query_text) THEN 0.8
      ELSE 0.2
    END
  INTO v_keyword_score;

  -- Calculate context score (based on recent queries)
  SELECT AVG(relevance_score)
  INTO v_context_score
  FROM public.brain_domain_relevance_history
  WHERE domain_id = p_domain_id
    AND user_id = p_user_id
    AND created_at > NOW() - INTERVAL '7 days'
    AND query_text ILIKE '%' || p_query_text || '%'
  LIMIT 5;

  IF v_context_score IS NULL THEN
    v_context_score := 0.5; -- Default neutral
  END IF;

  -- Weighted combination
  v_final_score := (
    v_similarity_score * 0.5 +
    v_keyword_score * 0.3 +
    v_context_score * 0.2
  );

  -- Log relevance for learning
  INSERT INTO public.brain_domain_relevance_history (
    domain_id,
    query_text,
    query_embedding,
    relevance_score,
    similarity_score,
    keyword_match_score,
    context_score,
    user_id
  )
  VALUES (
    p_domain_id,
    p_query_text,
    p_query_embedding,
    v_final_score,
    v_similarity_score,
    v_keyword_score,
    v_context_score,
    p_user_id
  );

  RETURN v_final_score;
END;
$$;

-- ================================================
-- FUNCTION: Select Relevant Domains
-- ================================================
CREATE OR REPLACE FUNCTION public.select_relevant_domains(
  p_query_text TEXT,
  p_query_embedding vector(1536),
  p_user_id UUID,
  p_max_domains INTEGER DEFAULT 3,
  p_min_score FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  domain_id UUID,
  domain_name TEXT,
  relevance_score FLOAT,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    public.score_domain_relevance(p_query_text, p_query_embedding, d.id, p_user_id) as relevance_score,
    ROW_NUMBER() OVER (ORDER BY public.score_domain_relevance(p_query_text, p_query_embedding, d.id, p_user_id) DESC)::INTEGER as rank
  FROM public.brain_domains d
  WHERE d.user_id = p_user_id
  HAVING public.score_domain_relevance(p_query_text, p_query_embedding, d.id, p_user_id) >= p_min_score
  ORDER BY relevance_score DESC
  LIMIT p_max_domains;
END;
$$;

-- ================================================
-- FUNCTION: Update Routing Performance
-- ================================================
CREATE OR REPLACE FUNCTION public.update_routing_performance(
  p_domain_id UUID,
  p_user_id UUID,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Calculate period boundaries
  CASE p_period_type
    WHEN 'hourly' THEN
      v_period_start := date_trunc('hour', NOW());
      v_period_end := v_period_start + INTERVAL '1 hour';
    WHEN 'daily' THEN
      v_period_start := date_trunc('day', NOW());
      v_period_end := v_period_start + INTERVAL '1 day';
    WHEN 'weekly' THEN
      v_period_start := date_trunc('week', NOW());
      v_period_end := v_period_start + INTERVAL '1 week';
    ELSE
      v_period_start := date_trunc('day', NOW());
      v_period_end := v_period_start + INTERVAL '1 day';
  END CASE;

  -- Insert or update performance metrics
  INSERT INTO public.brain_routing_performance (
    period_start,
    period_end,
    period_type,
    domain_id,
    total_queries,
    selected_count,
    avg_relevance_score,
    avg_results_quality,
    avg_latency_ms,
    avg_user_rating,
    user_id
  )
  SELECT
    v_period_start,
    v_period_end,
    p_period_type,
    p_domain_id,
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE was_selected = true)::INTEGER,
    AVG(relevance_score),
    AVG(avg_result_similarity),
    AVG(0)::FLOAT, -- Placeholder for latency
    AVG(0)::FLOAT, -- Placeholder for rating
    p_user_id
  FROM public.brain_domain_relevance_history
  WHERE domain_id = p_domain_id
    AND user_id = p_user_id
    AND created_at >= v_period_start
    AND created_at < v_period_end
  ON CONFLICT (domain_id, period_start, period_type, user_id) DO UPDATE SET
    total_queries = EXCLUDED.total_queries,
    selected_count = EXCLUDED.selected_count,
    avg_relevance_score = EXCLUDED.avg_relevance_score,
    avg_results_quality = EXCLUDED.avg_results_quality,
    updated_at = NOW();
END;
$$;

-- ================================================
-- TRIGGERS
-- ================================================
CREATE OR REPLACE FUNCTION public.update_routing_performance_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_routing_performance_updated_at
  BEFORE UPDATE ON public.brain_routing_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_routing_performance_updated_at();

-- ================================================
-- RLS POLICIES
-- ================================================
ALTER TABLE public.brain_query_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_domain_relevance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_routing_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own query routing"
  ON public.brain_query_routing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own query routing"
  ON public.brain_query_routing FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own query routing"
  ON public.brain_query_routing FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own domain relevance"
  ON public.brain_domain_relevance_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domain relevance"
  ON public.brain_domain_relevance_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own routing performance"
  ON public.brain_routing_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routing performance"
  ON public.brain_routing_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routing performance"
  ON public.brain_routing_performance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.score_domain_relevance TO authenticated;
GRANT EXECUTE ON FUNCTION public.score_domain_relevance TO anon;
GRANT EXECUTE ON FUNCTION public.select_relevant_domains TO authenticated;
GRANT EXECUTE ON FUNCTION public.select_relevant_domains TO anon;
GRANT EXECUTE ON FUNCTION public.update_routing_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_routing_performance TO anon;

-- ================================================
-- COMMENT
-- ================================================
COMMENT ON TABLE public.brain_query_routing IS
'Tracks query routing decisions and performance for learning';

COMMENT ON TABLE public.brain_domain_relevance_history IS
'Historical relevance scores for domains to improve routing';

COMMENT ON TABLE public.brain_routing_performance IS
'Aggregated performance metrics for routing decisions';

COMMENT ON FUNCTION public.score_domain_relevance IS
'Scores how relevant a domain is to a query';

COMMENT ON FUNCTION public.select_relevant_domains IS
'Selects the most relevant domains for a query';

COMMENT ON FUNCTION public.update_routing_performance IS
'Updates routing performance metrics for a domain';

