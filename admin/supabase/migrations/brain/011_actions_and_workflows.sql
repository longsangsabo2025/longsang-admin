-- ================================================
-- Phase 5 - Actions & Workflows
-- ================================================

-- Actions Queue Table
CREATE TABLE public.brain_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.brain_master_session(id) ON DELETE SET NULL, -- Optional: link to a session
  action_type TEXT NOT NULL, -- e.g., 'create_task', 'add_note', 'send_notification', 'update_knowledge'
  payload JSONB DEFAULT '{}'::jsonb, -- Data needed to execute the action
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed', 'cancelled'
  result JSONB DEFAULT '{}'::jsonb, -- Result of the action execution
  error_log TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_actions_user_id ON public.brain_actions(user_id);
CREATE INDEX idx_brain_actions_status ON public.brain_actions(status);
CREATE INDEX idx_brain_actions_created_at ON public.brain_actions(created_at DESC);

-- RLS Policies
ALTER TABLE public.brain_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own actions"
  ON public.brain_actions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Workflows Table
CREATE TABLE public.brain_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- e.g., 'on_query', 'on_session_end', 'schedule_daily', 'manual'
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Configuration for the trigger (e.g., query keywords, schedule cron)
  actions JSONB DEFAULT '[]'::jsonb, -- Array of action templates to be queued
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_workflows_user_id ON public.brain_workflows(user_id);
CREATE INDEX idx_brain_workflows_is_active ON public.brain_workflows(is_active);
CREATE INDEX idx_brain_workflows_trigger_type ON public.brain_workflows(trigger_type);

-- RLS Policies
ALTER TABLE public.brain_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own workflows"
  ON public.brain_workflows FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_brain_actions BEFORE UPDATE ON public.brain_actions
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at_brain_workflows BEFORE UPDATE ON public.brain_workflows
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

