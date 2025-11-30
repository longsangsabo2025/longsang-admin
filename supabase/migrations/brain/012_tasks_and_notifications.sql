-- ================================================
-- Phase 5 - Tasks & Notifications
-- ================================================

-- Tasks Table
CREATE TABLE public.brain_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'done', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  due_date TIMESTAMPTZ,
  related_domain_id UUID REFERENCES public.brain_domains(id) ON DELETE SET NULL,
  related_session_id UUID REFERENCES public.brain_master_session(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual', -- 'manual', 'workflow', 'master_brain_suggestion'
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional task-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_tasks_user_id ON public.brain_tasks(user_id);
CREATE INDEX idx_brain_tasks_status ON public.brain_tasks(status);
CREATE INDEX idx_brain_tasks_priority ON public.brain_tasks(priority);
CREATE INDEX idx_brain_tasks_due_date ON public.brain_tasks(due_date);

-- RLS Policies
ALTER TABLE public.brain_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks"
  ON public.brain_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications Table
CREATE TABLE public.brain_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success', 'insight', 'reminder'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional notification data
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_notifications_user_id ON public.brain_notifications(user_id);
CREATE INDEX idx_brain_notifications_is_read ON public.brain_notifications(is_read);
CREATE INDEX idx_brain_notifications_created_at ON public.brain_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE public.brain_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications"
  ON public.brain_notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_brain_tasks BEFORE UPDATE ON public.brain_tasks
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at_brain_notifications BEFORE UPDATE ON public.brain_notifications
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

