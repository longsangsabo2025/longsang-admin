-- ================================================
-- Phase 6B - Collaboration Features
-- ================================================
-- Knowledge sharing, comments, and team workspaces

-- Knowledge Sharing Table
CREATE TABLE public.brain_collaboration_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_id UUID REFERENCES public.brain_knowledge(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read', -- 'read', 'write', 'comment'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(knowledge_id, shared_with)
);

-- Indexes
CREATE INDEX idx_brain_collaboration_shares_knowledge_id ON public.brain_collaboration_shares(knowledge_id);
CREATE INDEX idx_brain_collaboration_shares_shared_by ON public.brain_collaboration_shares(shared_by);
CREATE INDEX idx_brain_collaboration_shares_shared_with ON public.brain_collaboration_shares(shared_with);

-- RLS Policies
ALTER TABLE public.brain_collaboration_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view shares they created or received"
  ON public.brain_collaboration_shares FOR SELECT
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their knowledge"
  ON public.brain_collaboration_shares FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM public.brain_knowledge k
      WHERE k.id = knowledge_id AND k.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shares they created"
  ON public.brain_collaboration_shares FOR UPDATE
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created"
  ON public.brain_collaboration_shares FOR DELETE
  USING (auth.uid() = shared_by);

-- Comments Table
CREATE TABLE public.brain_collaboration_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_id UUID REFERENCES public.brain_knowledge(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.brain_collaboration_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brain_collaboration_comments_knowledge_id ON public.brain_collaboration_comments(knowledge_id);
CREATE INDEX idx_brain_collaboration_comments_user_id ON public.brain_collaboration_comments(user_id);
CREATE INDEX idx_brain_collaboration_comments_parent_id ON public.brain_collaboration_comments(parent_comment_id);

-- RLS Policies
ALTER TABLE public.brain_collaboration_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view comments on shared knowledge"
  ON public.brain_collaboration_comments FOR SELECT
  USING (
    -- User owns the knowledge
    EXISTS (
      SELECT 1 FROM public.brain_knowledge k
      WHERE k.id = knowledge_id AND k.user_id = auth.uid()
    ) OR
    -- User has access via sharing
    EXISTS (
      SELECT 1 FROM public.brain_collaboration_shares s
      WHERE s.knowledge_id = brain_collaboration_comments.knowledge_id
      AND s.shared_with = auth.uid()
      AND s.permission IN ('read', 'write', 'comment')
    )
  );

CREATE POLICY "Users can create comments on accessible knowledge"
  ON public.brain_collaboration_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      -- User owns the knowledge
      EXISTS (
        SELECT 1 FROM public.brain_knowledge k
        WHERE k.id = knowledge_id AND k.user_id = auth.uid()
      ) OR
      -- User has comment permission
      EXISTS (
        SELECT 1 FROM public.brain_collaboration_shares s
        WHERE s.knowledge_id = knowledge_id
        AND s.shared_with = auth.uid()
        AND s.permission IN ('write', 'comment')
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.brain_collaboration_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.brain_collaboration_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Team Workspaces Table
CREATE TABLE public.brain_team_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brain_team_workspaces_created_by ON public.brain_team_workspaces(created_by);

-- RLS Policies
ALTER TABLE public.brain_team_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workspaces they are members of"
  ON public.brain_team_workspaces FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brain_team_members tm
      WHERE tm.team_id = brain_team_workspaces.id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces"
  ON public.brain_team_workspaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update workspaces they created"
  ON public.brain_team_workspaces FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete workspaces they created"
  ON public.brain_team_workspaces FOR DELETE
  USING (auth.uid() = created_by);

-- Team Members Table
CREATE TABLE public.brain_team_members (
  team_id UUID REFERENCES public.brain_team_workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member', 'viewer'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Indexes
CREATE INDEX idx_brain_team_members_team_id ON public.brain_team_members(team_id);
CREATE INDEX idx_brain_team_members_user_id ON public.brain_team_members(user_id);

-- RLS Policies
ALTER TABLE public.brain_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members of their workspaces"
  ON public.brain_team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id
      AND (tw.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.brain_team_members tm
        WHERE tm.team_id = tw.id AND tm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Workspace admins can add members"
  ON public.brain_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id
      AND (
        tw.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.brain_team_members tm
          WHERE tm.team_id = tw.id
          AND tm.user_id = auth.uid()
          AND tm.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Workspace admins can update members"
  ON public.brain_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id
      AND (
        tw.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.brain_team_members tm
          WHERE tm.team_id = tw.id
          AND tm.user_id = auth.uid()
          AND tm.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Workspace admins can remove members"
  ON public.brain_team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brain_team_workspaces tw
      WHERE tw.id = team_id
      AND (
        tw.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.brain_team_members tm
          WHERE tm.team_id = tw.id
          AND tm.user_id = auth.uid()
          AND tm.role = 'admin'
        )
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_brain_collaboration_shares BEFORE UPDATE ON public.brain_collaboration_shares
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at_brain_collaboration_comments BEFORE UPDATE ON public.brain_collaboration_comments
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at_brain_team_workspaces BEFORE UPDATE ON public.brain_team_workspaces
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

-- Comments
COMMENT ON TABLE public.brain_collaboration_shares IS 'Knowledge sharing between users';
COMMENT ON TABLE public.brain_collaboration_comments IS 'Comments on knowledge items';
COMMENT ON TABLE public.brain_team_workspaces IS 'Team workspaces for collaboration';
COMMENT ON TABLE public.brain_team_members IS 'Team members and their roles';
