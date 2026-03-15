-- ================================================
-- AI SECOND BRAIN - Domain Statistics
-- ================================================
-- This migration creates domain statistics tracking

-- ================================================
-- Domain Statistics Table
-- ================================================
CREATE TABLE public.brain_domain_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,

  -- Knowledge metrics
  total_knowledge_count INTEGER DEFAULT 0,
  knowledge_count_this_week INTEGER DEFAULT 0,
  knowledge_count_this_month INTEGER DEFAULT 0,

  -- Activity metrics
  last_activity_at TIMESTAMPTZ,
  last_knowledge_added_at TIMESTAMPTZ,
  last_query_at TIMESTAMPTZ,
  total_queries INTEGER DEFAULT 0,

  -- Quality metrics
  avg_similarity_score FLOAT DEFAULT 0,
  avg_content_length INTEGER DEFAULT 0,

  -- Tag distribution (stored as JSONB for flexibility)
  top_tags JSONB DEFAULT '[]'::jsonb, -- [{tag, count}]
  total_unique_tags INTEGER DEFAULT 0,

  -- Growth trends (last 30 days)
  daily_growth JSONB DEFAULT '[]'::jsonb, -- [{date, count}]

  -- Computed at
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  UNIQUE(domain_id)
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_brain_domain_stats_domain_id ON public.brain_domain_stats(domain_id);
CREATE INDEX idx_brain_domain_stats_user_id ON public.brain_domain_stats(user_id);
CREATE INDEX idx_brain_domain_stats_computed_at ON public.brain_domain_stats(computed_at DESC);

-- ================================================
-- FUNCTION: Update Domain Statistics
-- ================================================
CREATE OR REPLACE FUNCTION public.update_domain_stats(p_domain_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_total_count INTEGER;
  v_week_count INTEGER;
  v_month_count INTEGER;
  v_last_activity TIMESTAMPTZ;
  v_last_added TIMESTAMPTZ;
  v_last_query TIMESTAMPTZ;
  v_total_queries INTEGER;
  v_avg_similarity FLOAT;
  v_avg_length INTEGER;
  v_top_tags JSONB;
  v_unique_tags INTEGER;
BEGIN
  -- Get user_id from domain
  SELECT user_id INTO v_user_id
  FROM public.brain_domains
  WHERE id = p_domain_id;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate knowledge counts
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::INTEGER,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::INTEGER,
    MAX(GREATEST(created_at, updated_at)),
    MAX(created_at)
  INTO v_total_count, v_week_count, v_month_count, v_last_activity, v_last_added
  FROM public.brain_knowledge
  WHERE domain_id = p_domain_id AND user_id = v_user_id;

  -- Calculate query metrics
  SELECT
    MAX(created_at),
    COUNT(*)::INTEGER
  INTO v_last_query, v_total_queries
  FROM public.brain_query_history
  WHERE p_domain_id = ANY(domain_ids) AND user_id = v_user_id;

  -- Calculate average similarity (from query history)
  SELECT COALESCE(AVG(
    (SELECT AVG(similarity) FROM jsonb_array_elements(knowledge_ids::jsonb)
     WHERE similarity IS NOT NULL)
  ), 0) INTO v_avg_similarity
  FROM public.brain_query_history
  WHERE p_domain_id = ANY(domain_ids) AND user_id = v_user_id
  LIMIT 100;

  -- Calculate average content length
  SELECT COALESCE(AVG(LENGTH(content))::INTEGER, 0) INTO v_avg_length
  FROM public.brain_knowledge
  WHERE domain_id = p_domain_id AND user_id = v_user_id;

  -- Calculate top tags
  WITH tag_counts AS (
    SELECT tag, COUNT(*) as count
    FROM public.brain_knowledge,
         unnest(tags) as tag
    WHERE domain_id = p_domain_id AND user_id = v_user_id
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT
    jsonb_agg(jsonb_build_object('tag', tag, 'count', count)),
    COUNT(DISTINCT tag)
  INTO v_top_tags, v_unique_tags
  FROM tag_counts;

  -- Insert or update statistics
  INSERT INTO public.brain_domain_stats (
    domain_id,
    total_knowledge_count,
    knowledge_count_this_week,
    knowledge_count_this_month,
    last_activity_at,
    last_knowledge_added_at,
    last_query_at,
    total_queries,
    avg_similarity_score,
    avg_content_length,
    top_tags,
    total_unique_tags,
    computed_at,
    updated_at,
    user_id
  ) VALUES (
    p_domain_id,
    COALESCE(v_total_count, 0),
    COALESCE(v_week_count, 0),
    COALESCE(v_month_count, 0),
    v_last_activity,
    v_last_added,
    v_last_query,
    COALESCE(v_total_queries, 0),
    COALESCE(v_avg_similarity, 0),
    COALESCE(v_avg_length, 0),
    COALESCE(v_top_tags, '[]'::jsonb),
    COALESCE(v_unique_tags, 0),
    NOW(),
    NOW(),
    v_user_id
  )
  ON CONFLICT (domain_id)
  DO UPDATE SET
    total_knowledge_count = EXCLUDED.total_knowledge_count,
    knowledge_count_this_week = EXCLUDED.knowledge_count_this_week,
    knowledge_count_this_month = EXCLUDED.knowledge_count_this_month,
    last_activity_at = EXCLUDED.last_activity_at,
    last_knowledge_added_at = EXCLUDED.last_knowledge_added_at,
    last_query_at = EXCLUDED.last_query_at,
    total_queries = EXCLUDED.total_queries,
    avg_similarity_score = EXCLUDED.avg_similarity_score,
    avg_content_length = EXCLUDED.avg_content_length,
    top_tags = EXCLUDED.top_tags,
    total_unique_tags = EXCLUDED.total_unique_tags,
    computed_at = NOW(),
    updated_at = NOW();
END;
$$;

-- ================================================
-- TRIGGER: Auto-update stats on knowledge changes
-- ================================================
CREATE OR REPLACE FUNCTION public.trigger_update_domain_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_domain_stats(NEW.domain_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_domain_stats(OLD.domain_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_domain_stats_on_knowledge_change
  AFTER INSERT OR UPDATE OR DELETE ON public.brain_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_domain_stats();

-- ================================================
-- TRIGGER: Auto-update stats on query
-- ================================================
CREATE OR REPLACE FUNCTION public.trigger_update_domain_stats_on_query()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update stats for all domains in the query
  IF NEW.domain_ids IS NOT NULL THEN
    PERFORM public.update_domain_stats(domain_id)
    FROM unnest(NEW.domain_ids) as domain_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_domain_stats_on_query
  AFTER INSERT ON public.brain_query_history
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_domain_stats_on_query();

-- ================================================
-- RLS POLICIES
-- ================================================
ALTER TABLE public.brain_domain_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own domain stats"
  ON public.brain_domain_stats FOR SELECT
  USING (auth.uid() = user_id);

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.update_domain_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_domain_stats TO anon;

