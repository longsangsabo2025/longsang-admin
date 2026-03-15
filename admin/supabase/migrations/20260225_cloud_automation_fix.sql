-- Fix migration for cloud automation tables
-- Addresses schema mismatches found in E2E audit

-- 1. Add missing url column to content_calendar (for video URL sources)
ALTER TABLE public.content_calendar ADD COLUMN IF NOT EXISTS url TEXT;

-- 2. Add missing metadata column to content_calendar (for AI suggestion metadata)
ALTER TABLE public.content_calendar ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 3. Make title nullable (AI suggestions may only have topic)
ALTER TABLE public.content_calendar ALTER COLUMN title DROP NOT NULL;

-- 4. Add only truly-missing columns to pipeline_runs
-- (pipeline_runs already has: id, pipeline_name, status, input_data, stage_results,
--  errors, total_cost, duration_ms, started_at, completed_at, created_at)
DO $$ 
BEGIN
  -- trigger_source: who started this run (manual, auto, scheduler)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipeline_runs' AND column_name = 'trigger_source') THEN
    ALTER TABLE public.pipeline_runs ADD COLUMN trigger_source TEXT DEFAULT 'manual';
  END IF;
  
  -- pipeline_job_id: external job ID from Render server
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pipeline_runs' AND column_name = 'pipeline_job_id') THEN
    ALTER TABLE public.pipeline_runs ADD COLUMN pipeline_job_id TEXT;
  END IF;
END $$;
