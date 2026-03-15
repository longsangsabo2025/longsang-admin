-- ================================================
-- Add platform column to content_queue table
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Add platform column (nullable to not break existing data)
ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS platform VARCHAR(50);

-- 2. Create index for faster queries by platform
CREATE INDEX IF NOT EXISTS idx_content_queue_platform 
ON content_queue(platform);

-- 3. Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_content_queue_project_platform 
ON content_queue(project_id, platform);

-- ================================================
-- Verify changes
-- ================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'content_queue' 
  AND column_name = 'platform';
