-- ================================================
-- AI SECOND BRAIN - Vector Search Function
-- ================================================
-- This migration creates a PostgreSQL function for vector similarity search

-- ================================================
-- Vector Similarity Search Function
-- ================================================
-- Function to find similar knowledge chunks using vector cosine similarity
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  domain_ids UUID[] DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL
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
  metadata JSONB,
  created_at TIMESTAMPTZ
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
    -- Calculate cosine similarity (1 - cosine distance)
    1 - (k.embedding <=> query_embedding) AS similarity,
    k.metadata,
    k.created_at
  FROM public.brain_knowledge k
  WHERE
    -- Vector similarity threshold
    (1 - (k.embedding <=> query_embedding)) >= match_threshold
    -- Filter by domain if specified
    AND (domain_ids IS NULL OR k.domain_id = ANY(domain_ids))
    -- Filter by user if specified (for RLS compatibility)
    AND (user_id_filter IS NULL OR k.user_id = user_id_filter)
    -- Only return knowledge with embeddings
    AND k.embedding IS NOT NULL
  ORDER BY
    k.embedding <=> query_embedding  -- Order by distance (ascending = most similar first)
  LIMIT match_count;
END;
$$;

-- ================================================
-- Helper Function: Search by Text Query
-- ================================================
-- This function is a placeholder - actual embedding generation happens in the API
-- This is here for documentation and potential future use with Edge Functions
COMMENT ON FUNCTION public.match_knowledge IS
'Performs vector similarity search on brain_knowledge table.
Parameters:
- query_embedding: The embedding vector to search for (1536 dimensions)
- match_threshold: Minimum similarity score (0-1), default 0.7
- match_count: Maximum number of results, default 10
- domain_ids: Optional array of domain IDs to filter by
- user_id_filter: Optional user ID for additional filtering

Returns: Table of matching knowledge chunks with similarity scores.';

-- ================================================
-- Grant Permissions
-- ================================================
-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION public.match_knowledge TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge TO anon; -- For API access

-- ================================================
-- Example Usage (for documentation)
-- ================================================
-- SELECT * FROM public.match_knowledge(
--   query_embedding := '[your 1536-dimension vector here]'::vector(1536),
--   match_threshold := 0.7,
--   match_count := 10,
--   domain_ids := ARRAY['domain-uuid-1', 'domain-uuid-2']::UUID[],
--   user_id_filter := 'user-uuid'::UUID
-- );

