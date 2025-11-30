-- ================================================
-- AI SECOND BRAIN - Enable pgvector Extension
-- ================================================
-- This migration enables the pgvector extension for vector similarity search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is installed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension failed to install';
  END IF;
END $$;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'pgvector extension enabled successfully';
END $$;

