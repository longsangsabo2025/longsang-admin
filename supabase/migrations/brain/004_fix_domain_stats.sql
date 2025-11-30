-- Fix update_domain_stats function to avoid uuid[] to jsonb cast error

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

  -- Calculate average content length
  SELECT COALESCE(AVG(LENGTH(content))::INTEGER, 0) INTO v_avg_length
  FROM public.brain_knowledge
  WHERE domain_id = p_domain_id AND user_id = v_user_id;

  -- Calculate top tags
  WITH tag_counts AS (
    SELECT tag, COUNT(*) as cnt
    FROM public.brain_knowledge,
         unnest(tags) as tag
    WHERE domain_id = p_domain_id AND user_id = v_user_id
    GROUP BY tag
    ORDER BY cnt DESC
    LIMIT 10
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object('tag', tag, 'count', cnt)), '[]'::jsonb),
    COALESCE(COUNT(DISTINCT tag)::INTEGER, 0)
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
    0,
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
    avg_content_length = EXCLUDED.avg_content_length,
    top_tags = EXCLUDED.top_tags,
    total_unique_tags = EXCLUDED.total_unique_tags,
    computed_at = NOW(),
    updated_at = NOW();
END;
$$;
