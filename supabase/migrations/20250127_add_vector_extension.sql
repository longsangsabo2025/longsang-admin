-- =====================================================
-- VECTOR DATABASE EXTENSION FOR CONTEXT INDEXING
-- =====================================================
-- Created: 2025-01-27
-- Purpose: Enable pgvector for semantic search and embeddings
-- =====================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLE: context_embeddings
-- =====================================================
-- Stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS context_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'workflow', 'execution', 'agent', 'post', 'keyword')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  entity_description TEXT,
  
  -- Embedding vector (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- Context metadata
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique entity
  UNIQUE(entity_type, entity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_context_embeddings_entity_type ON context_embeddings(entity_type);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_entity_id ON context_embeddings(entity_id);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_project_id ON context_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_created_at ON context_embeddings(created_at DESC);

-- Vector similarity search index (HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_context_embeddings_vector 
ON context_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- =====================================================
-- TABLE: context_indexing_log
-- =====================================================
-- Track indexing operations
CREATE TABLE IF NOT EXISTS context_indexing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_indexing_log_status ON context_indexing_log(status);
CREATE INDEX IF NOT EXISTS idx_indexing_log_entity ON context_indexing_log(entity_type, entity_id);

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_context_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_context_embeddings_updated_at
BEFORE UPDATE ON context_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_context_embeddings_updated_at();

-- =====================================================
-- FUNCTION: Semantic search
-- =====================================================
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(1536),
  entity_type_filter TEXT DEFAULT NULL,
  project_id_filter UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  entity_description TEXT,
  project_id UUID,
  similarity FLOAT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.entity_type,
    ce.entity_id,
    ce.entity_name,
    ce.entity_description,
    ce.project_id,
    1 - (ce.embedding <=> query_embedding) as similarity,
    ce.metadata
  FROM context_embeddings ce
  WHERE
    (entity_type_filter IS NULL OR ce.entity_type = entity_type_filter)
    AND (project_id_filter IS NULL OR ce.project_id = project_id_filter)
    AND (1 - (ce.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies (Optional - for multi-user support later)
-- =====================================================
-- For now, disable RLS (admin-only system)
ALTER TABLE context_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE context_indexing_log DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE context_embeddings IS 'Vector embeddings for semantic search of projects, workflows, executions, etc.';
COMMENT ON TABLE context_indexing_log IS 'Log of indexing operations for monitoring and debugging';
COMMENT ON FUNCTION semantic_search IS 'Performs semantic similarity search on embeddings using cosine distance';


