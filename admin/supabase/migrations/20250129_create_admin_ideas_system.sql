-- ============================================
-- ADMIN IDEAS & PLANNING SYSTEM
-- Fast, efficient, scalable - Elon Musk style
-- ============================================

-- Ideas Table - Quick capture ideas
CREATE TABLE IF NOT EXISTS admin_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'planning', 'in-progress', 'completed', 'archived')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Planning Board - Quick planning items
CREATE TABLE IF NOT EXISTS admin_planning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES admin_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done', 'cancelled')),
  position INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- External Integrations - Connect with Notion, Google Keep, etc.
CREATE TABLE IF NOT EXISTS admin_idea_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES admin_ideas(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('notion', 'google-keep', 'trello', 'asana', 'other')),
  external_id TEXT NOT NULL,
  external_url TEXT,
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_ideas_user_id ON admin_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_ideas_status ON admin_ideas(status);
CREATE INDEX IF NOT EXISTS idx_admin_ideas_category ON admin_ideas(category);
CREATE INDEX IF NOT EXISTS idx_admin_ideas_created_at ON admin_ideas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_planning_user_id ON admin_planning_items(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_planning_status ON admin_planning_items(status);
CREATE INDEX IF NOT EXISTS idx_admin_planning_due_date ON admin_planning_items(due_date);
CREATE INDEX IF NOT EXISTS idx_admin_planning_idea_id ON admin_planning_items(idea_id);

CREATE INDEX IF NOT EXISTS idx_admin_integrations_user_id ON admin_idea_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_integrations_idea_id ON admin_idea_integrations(idea_id);
CREATE INDEX IF NOT EXISTS idx_admin_integrations_type ON admin_idea_integrations(integration_type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_ideas_updated_at
  BEFORE UPDATE ON admin_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_planning_updated_at
  BEFORE UPDATE ON admin_planning_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE admin_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_planning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_idea_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ideas
CREATE POLICY "Users can view own ideas"
  ON admin_ideas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
  ON admin_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON admin_ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON admin_ideas FOR DELETE
  USING (auth.uid() = user_id);

-- Planning items policies
CREATE POLICY "Users can view own planning items"
  ON admin_planning_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planning items"
  ON admin_planning_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planning items"
  ON admin_planning_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planning items"
  ON admin_planning_items FOR DELETE
  USING (auth.uid() = user_id);

-- Integration policies
CREATE POLICY "Users can view own integrations"
  ON admin_idea_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON admin_idea_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON admin_idea_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON admin_idea_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_admin_ideas_search ON admin_ideas USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

