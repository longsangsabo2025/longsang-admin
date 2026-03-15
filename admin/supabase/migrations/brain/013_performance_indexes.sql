-- ================================================
-- Phase 6A - Performance Indexes
-- ================================================
-- Optimize database queries with composite indexes
-- for frequently used query patterns

-- Composite indexes for brain_knowledge
-- Common query: Get knowledge by domain and date
CREATE INDEX IF NOT EXISTS idx_brain_knowledge_domain_created
  ON public.brain_knowledge(domain_id, created_at DESC);

-- Common query: Get knowledge by status and update time
CREATE INDEX IF NOT EXISTS idx_brain_knowledge_status_updated
  ON public.brain_knowledge(status, updated_at DESC)
  WHERE status IS NOT NULL;

-- Composite index for brain_query_history
-- Common query: Get user's query history by date
CREATE INDEX IF NOT EXISTS idx_brain_query_history_user_created
  ON public.brain_query_history(user_id, created_at DESC);

-- Composite index for brain_actions
-- Common query: Get user actions by status and date
CREATE INDEX IF NOT EXISTS idx_brain_actions_user_status_created
  ON public.brain_actions(user_id, status, created_at DESC);

-- Composite index for brain_tasks
-- Common query: Get user tasks by status and due date
CREATE INDEX IF NOT EXISTS idx_brain_tasks_user_status_due
  ON public.brain_tasks(user_id, status, due_date)
  WHERE due_date IS NOT NULL;

-- Composite index for brain_notifications
-- Common query: Get unread notifications by user and date
CREATE INDEX IF NOT EXISTS idx_brain_notifications_user_read_created
  ON public.brain_notifications(user_id, is_read, created_at DESC);

-- Composite index for brain_workflows
-- Common query: Get active workflows by user
CREATE INDEX IF NOT EXISTS idx_brain_workflows_user_active
  ON public.brain_workflows(user_id, is_active)
  WHERE is_active = true;

-- Composite index for brain_core_logic
-- Common query: Get core logic by domain and version
CREATE INDEX IF NOT EXISTS idx_brain_core_logic_domain_version
  ON public.brain_core_logic(domain_id, version DESC);

-- Composite index for brain_memory
-- Common query: Get memory by user and relevance
CREATE INDEX IF NOT EXISTS idx_brain_memory_user_relevance
  ON public.brain_memory(user_id, relevance_score DESC);

-- Composite index for brain_master_session
-- Common query: Get active sessions by user
CREATE INDEX IF NOT EXISTS idx_brain_master_session_user_active
  ON public.brain_master_session(user_id, is_active, created_at DESC)
  WHERE is_active = true;

-- Update table statistics for query planner
ANALYZE public.brain_knowledge;
ANALYZE public.brain_query_history;
ANALYZE public.brain_actions;
ANALYZE public.brain_tasks;
ANALYZE public.brain_notifications;
ANALYZE public.brain_workflows;
ANALYZE public.brain_core_logic;
ANALYZE public.brain_memory;
ANALYZE public.brain_master_session;


