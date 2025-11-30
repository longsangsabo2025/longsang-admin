-- ================================================
-- Phase 6 Fix: Fix failing migrations
-- ================================================

-- Fix 1: Remove index on non-existent column "status" in brain_knowledge
-- The status column doesn't exist, so we skip that index

-- Fix 2: Create collaboration tables and team tables in correct order

-- Create Knowledge Sharing Table
CREATE TABLE IF NOT EXISTS public.brain_collaboration_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_id UUID REFERENCES public.brain_knowledge(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(knowledge_id, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_brain_collaboration_shares_knowledge_id ON public.brain_collaboration_shares(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_brain_collaboration_shares_shared_by ON public.brain_collaboration_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_brain_collaboration_shares_shared_with ON public.brain_collaboration_shares(shared_with);

ALTER TABLE public.brain_collaboration_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shares they created or received" ON public.brain_collaboration_shares;
CREATE POLICY "Users can view shares they created or received"
  ON public.brain_collaboration_shares FOR SELECT
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

DROP POLICY IF EXISTS "Users can create shares for their knowledge" ON public.brain_collaboration_shares;
CREATE POLICY "Users can create shares for their knowledge"
  ON public.brain_collaboration_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM public.brain_knowledge k
      WHERE k.id = knowledge_id AND k.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update shares they created" ON public.brain_collaboration_shares;
CREATE POLICY "Users can update shares they created"
  ON public.brain_collaboration_shares FOR UPDATE
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

DROP POLICY IF EXISTS "Users can delete shares they created" ON public.brain_collaboration_shares;
CREATE POLICY "Users can delete shares they created"
  ON public.brain_collaboration_shares FOR DELETE
  USING (auth.uid() = shared_by);

-- Create Comments Table
CREATE TABLE IF NOT EXISTS public.brain_collaboration_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_id UUID REFERENCES public.brain_knowledge(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.brain_collaboration_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_collaboration_comments_knowledge_id ON public.brain_collaboration_comments(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_brain_collaboration_comments_user_id ON public.brain_collaboration_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_collaboration_comments_parent_id ON public.brain_collaboration_comments(parent_comment_id);

ALTER TABLE public.brain_collaboration_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments on shared knowledge" ON public.brain_collaboration_comments;
CREATE POLICY "Users can view comments on shared knowledge"
  ON public.brain_collaboration_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brain_knowledge k
      WHERE k.id = knowledge_id AND k.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.brain_collaboration_shares s
      WHERE s.knowledge_id = brain_collaboration_comments.knowledge_id
      AND s.shared_with = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create comments on accessible knowledge" ON public.brain_collaboration_comments;
CREATE POLICY "Users can create comments on accessible knowledge"
  ON public.brain_collaboration_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      EXISTS (
        SELECT 1 FROM public.brain_knowledge k
        WHERE k.id = knowledge_id AND k.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.brain_collaboration_shares s
        WHERE s.knowledge_id = knowledge_id
        AND s.shared_with = auth.uid()
        AND s.permission IN ('write', 'comment')
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON public.brain_collaboration_comments;
CREATE POLICY "Users can update their own comments"
  ON public.brain_collaboration_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.brain_collaboration_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.brain_collaboration_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create Team Workspaces Table
CREATE TABLE IF NOT EXISTS public.brain_team_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_team_workspaces_created_by ON public.brain_team_workspaces(created_by);

ALTER TABLE public.brain_team_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create workspaces" ON public.brain_team_workspaces;
CREATE POLICY "Users can create workspaces"
  ON public.brain_team_workspaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update workspaces they created" ON public.brain_team_workspaces;
CREATE POLICY "Users can update workspaces they created"
  ON public.brain_team_workspaces FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete workspaces they created" ON public.brain_team_workspaces;
CREATE POLICY "Users can delete workspaces they created"
  ON public.brain_team_workspaces FOR DELETE
  USING (auth.uid() = created_by);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.brain_team_members (
  team_id UUID REFERENCES public.brain_team_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_brain_team_members_team_id ON public.brain_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_brain_team_members_user_id ON public.brain_team_members(user_id);

ALTER TABLE public.brain_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.brain_team_members;
CREATE POLICY "Users can view members of their workspaces"
  ON public.brain_team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id AND tw.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace admins can add members" ON public.brain_team_members;
CREATE POLICY "Workspace admins can add members"
  ON public.brain_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id AND tw.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace admins can update members" ON public.brain_team_members;
CREATE POLICY "Workspace admins can update members"
  ON public.brain_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id AND tw.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace admins can remove members" ON public.brain_team_members;
CREATE POLICY "Workspace admins can remove members"
  ON public.brain_team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id AND tw.created_by = auth.uid()
    )
  );

-- Workspace view policy with team_members reference
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.brain_team_workspaces;
CREATE POLICY "Users can view workspaces they are members of"
  ON public.brain_team_workspaces FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brain_team_members tm
      WHERE tm.team_id = brain_team_workspaces.id AND tm.user_id = auth.uid()
    )
  );

-- Fix 3: Create performance indexes (skip non-existent columns)
CREATE INDEX IF NOT EXISTS idx_brain_knowledge_domain_created
  ON public.brain_knowledge(domain_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brain_query_history_user_created
  ON public.brain_query_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brain_actions_user_status_created
  ON public.brain_actions(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brain_tasks_user_status_due
  ON public.brain_tasks(user_id, status, due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_brain_notifications_user_read_created
  ON public.brain_notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brain_workflows_user_active
  ON public.brain_workflows(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_brain_core_logic_domain_version
  ON public.brain_core_logic(domain_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_brain_memory_user_importance
  ON public.brain_memory(user_id, importance_score DESC);

CREATE INDEX IF NOT EXISTS idx_brain_master_session_user_active
  ON public.brain_master_session(user_id, is_active, created_at DESC)
  WHERE is_active = true;

-- Update table statistics
ANALYZE public.brain_knowledge;
ANALYZE public.brain_query_history;
ANALYZE public.brain_actions;
ANALYZE public.brain_tasks;
ANALYZE public.brain_notifications;
ANALYZE public.brain_workflows;
ANALYZE public.brain_core_logic;
ANALYZE public.brain_memory;
ANALYZE public.brain_master_session;

-- Comments
COMMENT ON TABLE public.brain_collaboration_shares IS 'Knowledge sharing between users';
COMMENT ON TABLE public.brain_collaboration_comments IS 'Comments on knowledge items';
COMMENT ON TABLE public.brain_team_workspaces IS 'Team workspaces for collaboration';
COMMENT ON TABLE public.brain_team_members IS 'Team members and their roles';
