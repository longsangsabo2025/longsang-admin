-- ============================================================================
-- CLOUD AUTOMATION: CONVENIENCE VIEWS
-- Migration: 20260225_cloud_automation_views.sql
-- Purpose:   Read-optimised views on top of the tables created in
--            20260225_cloud_automation_cron.sql.  The admin dashboard can
--            query these directly instead of writing complex SQL each time.
--
-- Idempotent: YES — uses CREATE OR REPLACE VIEW
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- VIEW 1: v_latest_health
-- Shows the most recent health-check result for every monitored product.
-- Usage:  SELECT * FROM v_latest_health;
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_latest_health AS
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY product ORDER BY checked_at DESC) AS rn
  FROM public.ecosystem_health_logs
)
SELECT
  id,
  product,
  status,
  response_ms,
  http_status,
  error,
  checked_at
FROM ranked
WHERE rn = 1
ORDER BY product;

COMMENT ON VIEW public.v_latest_health IS
  'Latest health-check result per product. One row per monitored service.';

-- ────────────────────────────────────────────────────────────────────────────
-- VIEW 2: v_pipeline_stats
-- Aggregated pipeline-queue statistics bucketed by today / this week / this
-- month.  Useful for the "Command Center" dashboard widgets.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_pipeline_stats AS
SELECT
  -- ── Today ──
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) AS today_total,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'completed'
  ) AS today_completed,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'failed'
  ) AS today_failed,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'running'
  ) AS today_running,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'queued'
  ) AS today_queued,

  -- ── This Week (Monday-based) ──
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) AS week_total,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'completed'
  ) AS week_completed,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('week', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'failed'
  ) AS week_failed,

  -- ── This Month ──
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
  ) AS month_total,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'completed'
  ) AS month_completed,
  COUNT(*) FILTER (
    WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND status = 'failed'
  ) AS month_failed

FROM public.pipeline_queue;

COMMENT ON VIEW public.v_pipeline_stats IS
  'Aggregated pipeline queue stats: today/week/month counts by status.';

-- ────────────────────────────────────────────────────────────────────────────
-- VIEW 3: v_content_calendar_upcoming
-- Next 7 days of scheduled content, ordered by date.  Excludes cancelled
-- items so the dashboard only shows actionable work.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_content_calendar_upcoming AS
SELECT
  id,
  title,
  topic,
  type,
  scheduled_date,
  status,
  product,
  notes,
  created_at
FROM public.content_calendar
WHERE
  scheduled_date >= CURRENT_DATE
  AND scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status <> 'cancelled'
ORDER BY scheduled_date ASC, created_at ASC;

COMMENT ON VIEW public.v_content_calendar_upcoming IS
  'Content scheduled in the next 7 days (excludes cancelled items).';

-- ============================================================================
-- DONE. Three views are now available:
--   1. v_latest_health            → latest status per product
--   2. v_pipeline_stats           → today/week/month aggregates
--   3. v_content_calendar_upcoming → next 7 days of content
-- ============================================================================
