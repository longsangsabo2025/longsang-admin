-- ================================================
-- BRAIN OPTIMIZATION - Phase 1
-- ================================================
-- 1. HNSW Index for faster vector search
-- 2. Analytics tracking table
-- 3. Content metadata enhancements
-- ================================================

-- ================================================
-- 1. HNSW INDEX FOR VECTOR SEARCH
-- ================================================
-- HNSW (Hierarchical Navigable Small World) provides:
-- - ~10x faster search than sequential scan
-- - Better recall than IVFFlat
-- - No training step required

-- Drop existing index if any
DROP INDEX IF EXISTS idx_brain_knowledge_embedding_hnsw;
DROP INDEX IF EXISTS idx_brain_knowledge_embedding;

-- Create HNSW index with cosine distance (for OpenAI embeddings)
-- m=16: connections per layer (default, good balance)
-- ef_construction=64: build quality (higher = better recall, slower build)
CREATE INDEX idx_brain_knowledge_embedding_hnsw 
ON public.brain_knowledge 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX idx_brain_knowledge_embedding_hnsw IS 
'HNSW index for fast cosine similarity search on brain knowledge embeddings';

-- ================================================
-- 2. BRAIN USAGE ANALYTICS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.brain_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Query info
  query TEXT NOT NULL,
  query_embedding_time_ms INT,
  search_time_ms INT,
  total_time_ms INT,
  
  -- Results
  results_count INT DEFAULT 0,
  top_relevance FLOAT,
  sources JSONB DEFAULT '[]'::jsonb,
  
  -- Context
  search_method TEXT DEFAULT 'rpc', -- 'rpc' or 'sql'
  rag_applied BOOLEAN DEFAULT false,
  rag_reason TEXT,
  
  -- Response quality (for feedback)
  helpful BOOLEAN,
  feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  client_info JSONB DEFAULT '{}'::jsonb
);

-- Indexes for analytics queries
CREATE INDEX idx_brain_analytics_created_at ON public.brain_analytics(created_at DESC);
CREATE INDEX idx_brain_analytics_user_id ON public.brain_analytics(user_id);
CREATE INDEX idx_brain_analytics_rag_applied ON public.brain_analytics(rag_applied);

-- RLS for analytics
ALTER TABLE public.brain_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to brain_analytics"
ON public.brain_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own analytics"
ON public.brain_analytics FOR SELECT
TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE public.brain_analytics IS 
'Tracks Brain RAG usage for optimization and insights';

-- ================================================
-- 3. ENHANCE brain_knowledge TABLE
-- ================================================

-- Add chunk metadata columns (if not exists)
DO $$ 
BEGIN
  -- chunk_index: for documents split into multiple chunks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brain_knowledge' AND column_name = 'chunk_index') THEN
    ALTER TABLE public.brain_knowledge ADD COLUMN chunk_index INT DEFAULT 0;
  END IF;
  
  -- parent_id: reference to original document if chunked
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brain_knowledge' AND column_name = 'parent_id') THEN
    ALTER TABLE public.brain_knowledge ADD COLUMN parent_id UUID REFERENCES public.brain_knowledge(id) ON DELETE SET NULL;
  END IF;
  
  -- token_count: for chunking decisions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brain_knowledge' AND column_name = 'token_count') THEN
    ALTER TABLE public.brain_knowledge ADD COLUMN token_count INT;
  END IF;
  
  -- importance_score: for ranking (0-100)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brain_knowledge' AND column_name = 'importance_score') THEN
    ALTER TABLE public.brain_knowledge ADD COLUMN importance_score INT DEFAULT 50;
  END IF;
  
  -- last_accessed: for relevance decay
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brain_knowledge' AND column_name = 'last_accessed') THEN
    ALTER TABLE public.brain_knowledge ADD COLUMN last_accessed TIMESTAMPTZ;
  END IF;
  
  -- access_count: popularity tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brain_knowledge' AND column_name = 'access_count') THEN
    ALTER TABLE public.brain_knowledge ADD COLUMN access_count INT DEFAULT 0;
  END IF;
END $$;

-- Index for chunked documents
CREATE INDEX IF NOT EXISTS idx_brain_knowledge_parent_id 
ON public.brain_knowledge(parent_id) 
WHERE parent_id IS NOT NULL;

-- ================================================
-- 4. ENHANCED MATCH FUNCTION WITH SCORING
-- ================================================
CREATE OR REPLACE FUNCTION public.match_knowledge_v2(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  domain_ids UUID[] DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL,
  include_time_decay BOOLEAN DEFAULT false,
  days_for_decay INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  domain_id UUID,
  title TEXT,
  content TEXT,
  content_type TEXT,
  source_url TEXT,
  tags TEXT[],
  similarity FLOAT,
  final_score FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  importance_score INT,
  access_count INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.domain_id,
    k.title,
    k.content,
    k.content_type,
    k.source_url,
    k.tags,
    1 - (k.embedding <=> query_embedding) AS similarity,
    -- Final score combines: similarity + importance + recency (if enabled)
    CASE WHEN include_time_decay THEN
      (1 - (k.embedding <=> query_embedding)) * 0.7 +  -- 70% similarity
      (COALESCE(k.importance_score, 50)::FLOAT / 100) * 0.2 +  -- 20% importance
      (1 - LEAST(EXTRACT(EPOCH FROM (NOW() - k.created_at)) / (days_for_decay * 86400), 1)) * 0.1  -- 10% recency
    ELSE
      1 - (k.embedding <=> query_embedding)
    END AS final_score,
    k.metadata,
    k.created_at,
    COALESCE(k.importance_score, 50) as importance_score,
    COALESCE(k.access_count, 0) as access_count
  FROM public.brain_knowledge k
  WHERE
    (1 - (k.embedding <=> query_embedding)) >= match_threshold
    AND (domain_ids IS NULL OR k.domain_id = ANY(domain_ids))
    AND (user_id_filter IS NULL OR k.user_id = user_id_filter)
    AND k.embedding IS NOT NULL
  ORDER BY
    CASE WHEN include_time_decay THEN
      (1 - (k.embedding <=> query_embedding)) * 0.7 +
      (COALESCE(k.importance_score, 50)::FLOAT / 100) * 0.2 +
      (1 - LEAST(EXTRACT(EPOCH FROM (NOW() - k.created_at)) / (days_for_decay * 86400), 1)) * 0.1
    ELSE
      k.embedding <=> query_embedding
    END
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_knowledge_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge_v2 TO anon;

COMMENT ON FUNCTION public.match_knowledge_v2 IS
'Enhanced vector search with importance scoring and optional time decay.
Parameters:
- query_embedding: 1536-dim vector
- match_threshold: min similarity (0-1), default 0.3
- match_count: max results, default 10
- domain_ids: optional domain filter
- user_id_filter: optional user filter
- include_time_decay: enable time-based scoring
- days_for_decay: decay period in days';

-- ================================================
-- 5. FUNCTION TO UPDATE ACCESS STATS
-- ================================================
CREATE OR REPLACE FUNCTION public.update_knowledge_access(knowledge_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.brain_knowledge
  SET 
    last_accessed = NOW(),
    access_count = COALESCE(access_count, 0) + 1
  WHERE id = ANY(knowledge_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_knowledge_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_knowledge_access TO service_role;

-- ================================================
-- 6. ANALYTICS HELPER FUNCTIONS
-- ================================================

-- Get Brain usage stats
CREATE OR REPLACE FUNCTION public.get_brain_stats(
  days_back INT DEFAULT 7
)
RETURNS TABLE (
  total_queries BIGINT,
  rag_applied_count BIGINT,
  avg_relevance FLOAT,
  avg_response_time_ms FLOAT,
  unique_users BIGINT,
  top_domains JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_queries,
    COUNT(*) FILTER (WHERE rag_applied)::BIGINT as rag_applied_count,
    AVG(top_relevance)::FLOAT as avg_relevance,
    AVG(total_time_ms)::FLOAT as avg_response_time_ms,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    (
      SELECT jsonb_agg(jsonb_build_object('domain', domain, 'count', cnt))
      FROM (
        SELECT 
          s->>'domain' as domain, 
          COUNT(*)::INT as cnt
        FROM brain_analytics ba,
        LATERAL jsonb_array_elements(ba.sources) s
        WHERE ba.created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY s->>'domain'
        ORDER BY cnt DESC
        LIMIT 5
      ) top
    ) as top_domains
  FROM public.brain_analytics
  WHERE created_at > NOW() - (days_back || ' days')::INTERVAL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_brain_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_brain_stats TO service_role;

-- ================================================
-- DONE!
-- ================================================
