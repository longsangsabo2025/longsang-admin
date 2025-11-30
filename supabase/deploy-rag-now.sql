-- =====================================================
-- 🚀 AI WORKSPACE RAG - DEPLOY NOW
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- =====================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents table for RAG
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  source_type TEXT NOT NULL,
  source_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_type TEXT NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Response cache table
CREATE TABLE IF NOT EXISTS response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  assistant_type TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS documents_user_source_idx ON documents(user_id, source_type);
CREATE INDEX IF NOT EXISTS conversations_user_idx ON conversations(user_id, assistant_type);
CREATE INDEX IF NOT EXISTS response_cache_hash_idx ON response_cache(query_hash);

-- 6. CRITICAL: match_documents function for vector search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  source_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.metadata,
    d.source_type
  FROM documents d
  WHERE
    d.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND (filter_source_types IS NULL OR d.source_type = ANY(filter_source_types))
    AND (1 - (d.embedding <=> query_embedding)) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. Disable RLS for service key access (API uses service key)
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE response_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions DISABLE ROW LEVEL SECURITY;

-- 8. Grant permissions
GRANT ALL ON documents TO authenticated, service_role;
GRANT ALL ON conversations TO authenticated, service_role;
GRANT ALL ON response_cache TO authenticated, service_role;
GRANT ALL ON agent_executions TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- =====================================================
-- ✅ DONE! Run this SQL in Supabase Dashboard
-- =====================================================
