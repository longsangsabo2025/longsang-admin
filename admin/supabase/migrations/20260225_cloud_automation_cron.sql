-- ============================================================================
-- CLOUD AUTOMATION: CRON JOBS + SUPPORTING TABLES
-- Migration: 20260225_cloud_automation_cron.sql
-- Purpose:   Set up pg_cron jobs to trigger Edge Functions on schedule,
--            plus the tables they depend on. This is the "glue" that makes
--            the ecosystem run 24/7 without any local server.
--
-- Requirements: Supabase Pro plan (pg_cron + pg_net extensions)
-- Idempotent:   YES — safe to run multiple times
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
--    pg_net  → lets SQL make HTTP requests (needed by pg_cron jobs)
--    pg_cron → time-based job scheduler inside Postgres
-- ────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net   WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. TABLE: ecosystem_health_logs
--    Stores the result of every health-check ping so we can graph uptime
--    and detect outages historically.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ecosystem_health_logs (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  product       TEXT          NOT NULL,
  status        TEXT          NOT NULL,            -- 'up' | 'down' | 'degraded'
  response_ms   INTEGER,
  http_status   INTEGER,
  error         TEXT,
  checked_at    TIMESTAMPTZ   DEFAULT now()
);

-- Fast look-ups: "latest checks for product X"
CREATE INDEX IF NOT EXISTS idx_health_logs_product
  ON public.ecosystem_health_logs(product, checked_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLE: pipeline_queue
--    A simple FIFO queue for content-pipeline jobs (YouTube videos, shorts,
--    etc.). Edge Functions pick the next 'queued' row, flip it to 'running',
--    and write back the result when done.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_queue (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  topic         TEXT          NOT NULL,
  url           TEXT,
  mode          TEXT          DEFAULT 'full',      -- 'full' | 'shorts'
  status        TEXT          DEFAULT 'queued',     -- 'queued' | 'running' | 'completed' | 'failed'
  priority      INTEGER       DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT now(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  result        JSONB
);

-- Index for picking the next job efficiently
CREATE INDEX IF NOT EXISTS idx_pipeline_queue_status
  ON public.pipeline_queue(status, priority DESC, created_at ASC);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TABLE: content_calendar
--    Editorial calendar — tracks what content is planned, in-progress, or
--    published across every product.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT          NOT NULL,
  topic           TEXT,
  type            TEXT          DEFAULT 'video',     -- 'video' | 'shorts' | 'blog' | 'social'
  scheduled_date  DATE,
  status          TEXT          DEFAULT 'planned',   -- 'planned' | 'in-progress' | 'published' | 'cancelled'
  product         TEXT,                              -- which product this content is for
  notes           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT now(),
  published_at    TIMESTAMPTZ
);

-- Fast calendar look-ups
CREATE INDEX IF NOT EXISTS idx_content_calendar_date
  ON public.content_calendar(scheduled_date, status);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. ROW-LEVEL SECURITY (RLS)
--    • service_role  → full access (used by Edge Functions / cron)
--    • authenticated → read-only on health_logs (dashboard viewing)
--    • pipeline_queue & content_calendar are service-only by default
-- ────────────────────────────────────────────────────────────────────────────

-- 5a. ecosystem_health_logs ---------------------------------------------------
ALTER TABLE public.ecosystem_health_logs ENABLE ROW LEVEL SECURITY;

-- Service role: full CRUD
DROP POLICY IF EXISTS "service_role_health_logs_all" ON public.ecosystem_health_logs;
CREATE POLICY "service_role_health_logs_all"
  ON public.ecosystem_health_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read-only (for dashboard)
DROP POLICY IF EXISTS "authenticated_health_logs_select" ON public.ecosystem_health_logs;
CREATE POLICY "authenticated_health_logs_select"
  ON public.ecosystem_health_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- 5b. pipeline_queue ----------------------------------------------------------
ALTER TABLE public.pipeline_queue ENABLE ROW LEVEL SECURITY;

-- Service role: full CRUD
DROP POLICY IF EXISTS "service_role_pipeline_queue_all" ON public.pipeline_queue;
CREATE POLICY "service_role_pipeline_queue_all"
  ON public.pipeline_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read-only (monitor queue from dashboard)
DROP POLICY IF EXISTS "authenticated_pipeline_queue_select" ON public.pipeline_queue;
CREATE POLICY "authenticated_pipeline_queue_select"
  ON public.pipeline_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- 5c. content_calendar --------------------------------------------------------
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

-- Service role: full CRUD
DROP POLICY IF EXISTS "service_role_content_calendar_all" ON public.content_calendar;
CREATE POLICY "service_role_content_calendar_all"
  ON public.content_calendar
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read + write (editors manage the calendar)
DROP POLICY IF EXISTS "authenticated_content_calendar_select" ON public.content_calendar;
CREATE POLICY "authenticated_content_calendar_select"
  ON public.content_calendar
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_content_calendar_insert" ON public.content_calendar;
CREATE POLICY "authenticated_content_calendar_insert"
  ON public.content_calendar
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_content_calendar_update" ON public.content_calendar;
CREATE POLICY "authenticated_content_calendar_update"
  ON public.content_calendar
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. pg_cron SCHEDULES
--    Each job calls an Edge Function via HTTP POST using pg_net.
--    We use current_setting() so the Supabase URL and service-role key
--    come from app.settings (set in Dashboard → Database → Settings)
--    rather than being hard-coded.
--
--    ⚠  Before running: make sure these app settings exist:
--       ALTER DATABASE postgres SET app.supabase_url = 'https://<ref>.supabase.co';
--       ALTER DATABASE postgres SET app.service_role_key = '<your-key>';
-- ────────────────────────────────────────────────────────────────────────────

-- Un-schedule first (idempotent) — ignore errors if job doesn't exist yet
DO $$
BEGIN
  PERFORM cron.unschedule('ecosystem-health-check');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-content-scheduler');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('process-email-queue');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6a. Health check — every 15 minutes ----------------------------------------
SELECT cron.schedule(
  'ecosystem-health-check',
  '*/15 * * * *',
  $$SELECT net.http_post(
    url   := current_setting('app.supabase_url') || '/functions/v1/ecosystem-health-check',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body  := '{}'::jsonb
  )$$
);

-- 6b. Daily content scheduler — 8 AM Vietnam (UTC+7) = 1 AM UTC --------------
SELECT cron.schedule(
  'daily-content-scheduler',
  '0 1 * * *',
  $$SELECT net.http_post(
    url   := current_setting('app.supabase_url') || '/functions/v1/daily-content-scheduler',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body  := '{}'::jsonb
  )$$
);

-- 6c. Process email queue — every minute --------------------------------------
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$SELECT net.http_post(
    url   := current_setting('app.supabase_url') || '/functions/v1/process-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body  := '{}'::jsonb
  )$$
);

-- ============================================================================
-- DONE. Three cron jobs are now active:
--   1. ecosystem-health-check    → every 15 min
--   2. daily-content-scheduler   → daily at 01:00 UTC (08:00 VN)
--   3. process-email-queue       → every minute
--
-- Verify with:  SELECT * FROM cron.job ORDER BY jobname;
-- ============================================================================
