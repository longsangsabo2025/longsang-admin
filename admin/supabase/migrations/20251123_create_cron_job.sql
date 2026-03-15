-- ✅ CÁCH ĐÚNG: Dùng pg_cron + pg_net để invoke Edge Function

-- Step 1: Enable pg_net extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Step 2: Create cron job using cron.schedule()
SELECT cron.schedule(
    'fetch-support-emails',     -- Job name
    '*/5 * * * *',               -- Every 5 minutes  
    $$
    SELECT extensions.http_post(
        url:='https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/fetch-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I"}'::jsonb,
        body:='{}'::jsonb
    );
    $$
);

-- Verify job created
SELECT * FROM cron.job WHERE jobname = 'fetch-support-emails';

-- View job execution history
SELECT * FROM cron.job_run_details WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = 'fetch-support-emails'
) ORDER BY start_time DESC LIMIT 10;
