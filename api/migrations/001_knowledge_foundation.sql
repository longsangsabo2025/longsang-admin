-- ================================================================
-- KNOWLEDGE FOUNDATION - AI Personal Operating System
-- A scalable foundation for AI that truly knows you
-- Created: 2025-11-26
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 1. ADMIN PROFILE - Who you are
-- ============================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE DEFAULT 'default-longsang-user',
  
  -- Identity
  full_name TEXT NOT NULL DEFAULT 'Long Sang',
  nickname TEXT,
  role TEXT DEFAULT 'Founder & CEO',
  bio TEXT,
  avatar_url TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  location TEXT DEFAULT 'Vietnam',
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  
  -- Work Style
  communication_style TEXT DEFAULT 'direct', -- casual, formal, direct, detailed
  response_preference TEXT DEFAULT 'structured', -- conversational, structured, bullet-points
  expertise_level TEXT DEFAULT 'expert', -- beginner, intermediate, expert
  preferred_language TEXT DEFAULT 'vi', -- vi, en, both
  
  -- AI Preferences  
  ai_verbosity TEXT DEFAULT 'medium', -- brief, medium, detailed
  include_explanations BOOLEAN DEFAULT true,
  include_examples BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. BUSINESS ENTITIES - Your companies/ventures
-- ============================================
CREATE TABLE IF NOT EXISTS business_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Identity
  name TEXT NOT NULL,
  legal_name TEXT,
  type TEXT NOT NULL, -- 'company', 'startup', 'freelance', 'side-project'
  status TEXT DEFAULT 'active', -- 'active', 'planning', 'paused', 'closed'
  
  -- Description
  description TEXT,
  mission TEXT,
  vision TEXT,
  
  -- Industry & Market
  industries TEXT[], -- ['AI/ML', 'EdTech', 'Real Estate']
  target_market TEXT,
  business_model TEXT, -- 'B2B', 'B2C', 'B2B2C', 'Marketplace'
  
  -- Financial
  revenue_model TEXT[], -- ['subscription', 'one-time', 'commission', 'advertising']
  monthly_revenue DECIMAL(15,2),
  monthly_costs DECIMAL(15,2),
  funding_stage TEXT, -- 'bootstrapped', 'seed', 'series-a', etc.
  
  -- Team
  team_size INTEGER DEFAULT 1,
  roles JSONB, -- {"founder": 1, "developer": 2, "marketing": 1}
  
  -- Links
  website TEXT,
  social_links JSONB, -- {"twitter": "...", "linkedin": "..."}
  
  -- Metadata
  founded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PROJECTS - Everything you're working on
-- ============================================
CREATE TABLE IF NOT EXISTS project_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  business_entity_id UUID REFERENCES business_entities(id),
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  
  -- Classification
  type TEXT NOT NULL, -- 'product', 'service', 'internal-tool', 'experiment', 'learning'
  category TEXT, -- 'web-app', 'mobile-app', 'api', 'platform', 'content'
  status TEXT DEFAULT 'active', -- 'planning', 'active', 'mvp', 'live', 'maintenance', 'archived'
  priority INTEGER DEFAULT 5, -- 1-10
  
  -- Tech Stack
  tech_stack JSONB, -- {"frontend": ["React", "TypeScript"], "backend": ["Node.js"], ...}
  infrastructure JSONB, -- {"hosting": "Vercel", "database": "Supabase", ...}
  
  -- Progress
  progress_percent INTEGER DEFAULT 0,
  current_phase TEXT, -- 'ideation', 'design', 'development', 'testing', 'launch', 'growth'
  milestones JSONB, -- [{"name": "MVP", "target_date": "2025-01", "status": "completed"}]
  
  -- Financial
  budget DECIMAL(15,2),
  spent DECIMAL(15,2),
  revenue DECIMAL(15,2),
  monetization_status TEXT, -- 'not-monetized', 'beta', 'monetized', 'profitable'
  
  -- Resources
  repository_url TEXT,
  live_url TEXT,
  docs_url TEXT,
  folder_path TEXT, -- Local workspace path
  
  -- Goals
  short_term_goals TEXT[],
  long_term_goals TEXT[],
  success_metrics JSONB, -- {"users": 1000, "mrr": 5000}
  
  -- Metadata
  start_date DATE,
  target_launch_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. KNOWLEDGE BASE - Everything AI should know
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Relationships
  project_id UUID REFERENCES project_registry(id),
  business_entity_id UUID REFERENCES business_entities(id),
  
  -- Content
  category TEXT NOT NULL, -- See categories below
  subcategory TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- AI-generated summary
  
  -- Metadata
  source TEXT DEFAULT 'manual', -- 'manual', 'import', 'conversation', 'document', 'auto-learned'
  source_url TEXT,
  source_file TEXT,
  tags TEXT[],
  
  -- Importance & Access
  importance INTEGER DEFAULT 5, -- 1-10 (10 = critical)
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  
  -- Vector for RAG
  embedding vector(1536),
  
  -- Versioning
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- For time-sensitive knowledge
);

-- Knowledge Categories:
-- 'personal' - About the admin (preferences, style, history)
-- 'business' - Business strategies, models, decisions
-- 'project' - Project-specific knowledge
-- 'technical' - Tech decisions, architecture, code patterns
-- 'financial' - Revenue, costs, investments, goals
-- 'market' - Market research, competitors, trends
-- 'process' - Workflows, SOPs, best practices
-- 'reference' - External resources, documentation
-- 'learning' - Things learned, insights, lessons
-- 'decision' - Important decisions made and why

-- ============================================
-- 5. FINANCIAL TRACKING - Your money flow
-- ============================================
CREATE TABLE IF NOT EXISTS financial_overview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Period
  period_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Income Streams
  revenue_streams JSONB, -- [{"source": "AI Newbie", "amount": 5000, "type": "subscription"}]
  total_revenue DECIMAL(15,2) DEFAULT 0,
  
  -- Expenses
  expense_categories JSONB, -- [{"category": "Infrastructure", "amount": 500}]
  total_expenses DECIMAL(15,2) DEFAULT 0,
  
  -- Net
  net_income DECIMAL(15,2) GENERATED ALWAYS AS (total_revenue - total_expenses) STORED,
  
  -- Assets & Liabilities
  assets JSONB, -- [{"type": "savings", "amount": 10000}]
  liabilities JSONB, -- [{"type": "loan", "amount": 5000}]
  
  -- Goals
  savings_goal DECIMAL(15,2),
  savings_actual DECIMAL(15,2),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. GOALS & ROADMAP - Where you're heading
-- ============================================
CREATE TABLE IF NOT EXISTS goals_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Relationships
  project_id UUID REFERENCES project_registry(id),
  business_entity_id UUID REFERENCES business_entities(id),
  parent_goal_id UUID REFERENCES goals_roadmap(id),
  
  -- Goal Definition
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'personal', 'business', 'financial', 'learning', 'health'
  timeframe TEXT, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', '5-year'
  
  -- Progress
  status TEXT DEFAULT 'active', -- 'planning', 'active', 'completed', 'paused', 'cancelled'
  progress_percent INTEGER DEFAULT 0,
  
  -- Metrics
  target_metric TEXT, -- "MRR", "Users", "Revenue"
  target_value DECIMAL(15,2),
  current_value DECIMAL(15,2),
  
  -- Dates
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. SKILLS & EXPERTISE - What you can do
-- ============================================
CREATE TABLE IF NOT EXISTS skills_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Skill Definition
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'technical', 'business', 'soft-skill', 'domain'
  
  -- Level
  proficiency_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  years_experience DECIMAL(4,1),
  
  -- Evidence
  projects_used TEXT[], -- Project IDs where this skill was used
  certifications TEXT[],
  
  -- Learning
  currently_learning BOOLEAN DEFAULT false,
  learning_goal TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. AI CONTEXT CACHE - Pre-computed context
-- ============================================
CREATE TABLE IF NOT EXISTS ai_context_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-longsang-user',
  
  -- Context Type
  context_type TEXT NOT NULL, -- 'full-profile', 'project-summary', 'financial-summary', 'skills-summary'
  related_entity_id UUID, -- If context is for specific project/business
  
  -- Content
  context_content TEXT NOT NULL, -- Pre-formatted context for AI
  token_count INTEGER,
  
  -- Validity
  valid_until TIMESTAMPTZ,
  is_stale BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Knowledge Base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_user ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_project ON knowledge_base(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_search ON knowledge_base USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- Vector index for semantic search (IVFFlat - good for ~100k vectors)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_project_user ON project_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_project_status ON project_registry(status);
CREATE INDEX IF NOT EXISTS idx_project_priority ON project_registry(priority DESC);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals_roadmap(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals_roadmap(status);
CREATE INDEX IF NOT EXISTS idx_goals_timeframe ON goals_roadmap(timeframe);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Semantic search in knowledge base
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  p_user_id TEXT DEFAULT 'default-longsang-user',
  p_category TEXT DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  tags TEXT[],
  project_id UUID,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    kb.tags,
    kb.project_id,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE kb.user_id = p_user_id
    AND kb.is_active = true
    AND (p_category IS NULL OR kb.category = p_category)
    AND (p_project_id IS NULL OR kb.project_id = p_project_id)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get full context for AI
CREATE OR REPLACE FUNCTION get_ai_context(
  p_user_id TEXT DEFAULT 'default-longsang-user'
)
RETURNS TABLE (
  profile JSONB,
  businesses JSONB,
  projects JSONB,
  active_goals JSONB,
  skills JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Profile
    (SELECT row_to_json(p) FROM admin_profiles p WHERE p.user_id = p_user_id)::JSONB,
    -- Businesses
    (SELECT COALESCE(jsonb_agg(b), '[]'::JSONB) FROM business_entities b WHERE b.user_id = p_user_id AND b.status = 'active'),
    -- Projects
    (SELECT COALESCE(jsonb_agg(pr), '[]'::JSONB) FROM project_registry pr WHERE pr.user_id = p_user_id AND pr.status IN ('active', 'mvp', 'live')),
    -- Goals
    (SELECT COALESCE(jsonb_agg(g), '[]'::JSONB) FROM goals_roadmap g WHERE g.user_id = p_user_id AND g.status = 'active'),
    -- Skills
    (SELECT COALESCE(jsonb_agg(s), '[]'::JSONB) FROM skills_expertise s WHERE s.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Update access stats
CREATE OR REPLACE FUNCTION update_knowledge_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE knowledge_base 
  SET 
    last_accessed = NOW(),
    access_count = access_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER tr_admin_profiles_updated
  BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_business_entities_updated
  BEFORE UPDATE ON business_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_project_registry_updated
  BEFORE UPDATE ON project_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_knowledge_base_updated
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_goals_roadmap_updated
  BEFORE UPDATE ON goals_roadmap
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_expertise ENABLE ROW LEVEL SECURITY;

-- Policies (allow authenticated users to access their own data)
CREATE POLICY "Users can access own profile" ON admin_profiles
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

CREATE POLICY "Users can access own businesses" ON business_entities
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

CREATE POLICY "Users can access own projects" ON project_registry
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

CREATE POLICY "Users can access own knowledge" ON knowledge_base
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

CREATE POLICY "Users can access own financials" ON financial_overview
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

CREATE POLICY "Users can access own goals" ON goals_roadmap
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

CREATE POLICY "Users can access own skills" ON skills_expertise
  FOR ALL USING (user_id = auth.uid()::text OR user_id = 'default-longsang-user');

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON admin_profiles TO authenticated;
GRANT ALL ON business_entities TO authenticated;
GRANT ALL ON project_registry TO authenticated;
GRANT ALL ON knowledge_base TO authenticated;
GRANT ALL ON financial_overview TO authenticated;
GRANT ALL ON goals_roadmap TO authenticated;
GRANT ALL ON skills_expertise TO authenticated;
GRANT ALL ON ai_context_cache TO authenticated;

GRANT EXECUTE ON FUNCTION search_knowledge TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_context TO authenticated;

-- ================================================================
-- MIGRATION COMPLETE
-- Next: Run seed script to populate initial data
-- ================================================================
