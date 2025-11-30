-- ================================================
-- AI SECOND BRAIN - Core Tables
-- ================================================
-- This migration creates the core tables for the AI Second Brain system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- Domains Table
-- ================================================
-- Domains represent different knowledge categories/areas
CREATE TABLE public.brain_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Hex color for UI (e.g., '#3B82F6')
  icon TEXT,  -- Icon name/identifier (e.g., 'code', 'business', 'health')
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ensure unique domain names per user
  UNIQUE(user_id, name)
);

-- ================================================
-- Knowledge Table
-- ================================================
-- Stores knowledge chunks with vector embeddings
CREATE TABLE public.brain_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'document', -- 'document', 'note', 'conversation', 'external', 'code'
  source_url TEXT,
  source_file TEXT,

  -- Embedding (pgvector) - 1536 dimensions for text-embedding-3-large
  embedding vector(1536),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- Core Logic Table
-- ================================================
-- Stores distilled knowledge (principles, rules, patterns)
CREATE TABLE public.brain_core_logic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,

  -- Core Logic content
  first_principles JSONB DEFAULT '[]'::jsonb, -- [{statement, evidence, confidence}]
  mental_models JSONB DEFAULT '[]'::jsonb, -- [{name, description, when_to_use}]
  decision_rules JSONB DEFAULT '[]'::jsonb, -- [{IF condition, THEN action, exceptions}]
  anti_patterns JSONB DEFAULT '[]'::jsonb, -- [{pattern, why_bad, better_alternative}]
  cross_domain_links JSONB DEFAULT '[]'::jsonb, -- [{target_domain, relationship}]

  -- Metadata
  changelog JSONB DEFAULT '[]'::jsonb, -- [{version, date, changes}]
  last_distilled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- One version per domain at a time (latest)
  UNIQUE(domain_id, version)
);

-- ================================================
-- Memory Table
-- ================================================
-- Stores episodic, semantic, and procedural memories
CREATE TABLE public.brain_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Memory content
  content TEXT NOT NULL,
  memory_type TEXT DEFAULT 'episodic', -- 'episodic', 'semantic', 'procedural'
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),

  -- Associations
  related_knowledge_ids UUID[] DEFAULT '{}',
  related_domain_ids UUID[] DEFAULT '{}',

  -- Decay management
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  decay_rate FLOAT DEFAULT 0.1 CHECK (decay_rate >= 0 AND decay_rate <= 1),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- Query History Table
-- ================================================
-- Tracks queries for learning and analytics
CREATE TABLE public.brain_query_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  response TEXT,
  domain_ids UUID[] DEFAULT '{}',
  knowledge_ids UUID[] DEFAULT '{}', -- Which knowledge was used
  core_logic_ids UUID[] DEFAULT '{}', -- Which Core Logic was used

  -- Performance metrics
  latency_ms INTEGER,
  tokens_used INTEGER,
  cost_usd FLOAT,

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ================================================
-- INDEXES for Performance
-- ================================================

-- Domains indexes
CREATE INDEX idx_brain_domains_user_id ON public.brain_domains(user_id);
CREATE INDEX idx_brain_domains_updated_at ON public.brain_domains(updated_at DESC);

-- Knowledge indexes
CREATE INDEX idx_brain_knowledge_domain_id ON public.brain_knowledge(domain_id);
CREATE INDEX idx_brain_knowledge_user_id ON public.brain_knowledge(user_id);
CREATE INDEX idx_brain_knowledge_created_at ON public.brain_knowledge(created_at DESC);
CREATE INDEX idx_brain_knowledge_content_type ON public.brain_knowledge(content_type);
CREATE INDEX idx_brain_knowledge_tags ON public.brain_knowledge USING GIN(tags);

-- Vector similarity search index (IVFFlat for pgvector)
-- Note: This index requires data to exist first, so we'll create it after some data is loaded
-- For now, we'll create a basic index that can be optimized later
CREATE INDEX idx_brain_knowledge_embedding ON public.brain_knowledge
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Core Logic indexes
CREATE INDEX idx_brain_core_logic_domain_id ON public.brain_core_logic(domain_id);
CREATE INDEX idx_brain_core_logic_user_id ON public.brain_core_logic(user_id);
CREATE INDEX idx_brain_core_logic_version ON public.brain_core_logic(domain_id, version DESC);

-- Memory indexes
CREATE INDEX idx_brain_memory_user_id ON public.brain_memory(user_id);
CREATE INDEX idx_brain_memory_type ON public.brain_memory(memory_type);
CREATE INDEX idx_brain_memory_importance ON public.brain_memory(importance_score DESC);
CREATE INDEX idx_brain_memory_last_accessed ON public.brain_memory(last_accessed_at DESC);

-- Query History indexes
CREATE INDEX idx_brain_query_history_user_id ON public.brain_query_history(user_id);
CREATE INDEX idx_brain_query_history_created_at ON public.brain_query_history(created_at DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.brain_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_core_logic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_query_history ENABLE ROW LEVEL SECURITY;

-- Domains Policies
CREATE POLICY "Users can view own domains"
  ON public.brain_domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own domains"
  ON public.brain_domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own domains"
  ON public.brain_domains FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own domains"
  ON public.brain_domains FOR DELETE
  USING (auth.uid() = user_id);

-- Knowledge Policies
CREATE POLICY "Users can view own knowledge"
  ON public.brain_knowledge FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge"
  ON public.brain_knowledge FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge"
  ON public.brain_knowledge FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge"
  ON public.brain_knowledge FOR DELETE
  USING (auth.uid() = user_id);

-- Core Logic Policies
CREATE POLICY "Users can view own core logic"
  ON public.brain_core_logic FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own core logic"
  ON public.brain_core_logic FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own core logic"
  ON public.brain_core_logic FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own core logic"
  ON public.brain_core_logic FOR DELETE
  USING (auth.uid() = user_id);

-- Memory Policies
CREATE POLICY "Users can view own memories"
  ON public.brain_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON public.brain_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON public.brain_memory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON public.brain_memory FOR DELETE
  USING (auth.uid() = user_id);

-- Query History Policies
CREATE POLICY "Users can view own query history"
  ON public.brain_query_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own query history"
  ON public.brain_query_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ================================================
-- TRIGGERS for updated_at
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_brain_domains_updated_at
  BEFORE UPDATE ON public.brain_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brain_knowledge_updated_at
  BEFORE UPDATE ON public.brain_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brain_core_logic_updated_at
  BEFORE UPDATE ON public.brain_core_logic
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brain_memory_updated_at
  BEFORE UPDATE ON public.brain_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

