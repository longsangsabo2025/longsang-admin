-- ================================================
-- Add project_id to content_queue table
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Add project_id column (nullable to not break existing data)
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_queue_project_id 
ON content_queue(project_id);

-- 3. Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_content_queue_project_scheduled 
ON content_queue(project_id, scheduled_for);

-- 4. Add RLS policy for project-based access
CREATE POLICY "Users can view content for their projects"
ON content_queue FOR SELECT
USING (
  project_id IS NULL 
  OR project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
);

-- 5. Grant update for project members
CREATE POLICY "Users can update content for their projects"
ON content_queue FOR UPDATE
USING (
  project_id IS NULL 
  OR project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
);

-- 6. Also add project_id to workflow_executions for better tracking
ALTER TABLE workflow_executions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_executions_project_id 
ON workflow_executions(project_id);

-- ================================================
-- Verify changes
-- ================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'content_queue' 
  AND column_name = 'project_id';
