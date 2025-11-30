-- Note: Supabase manages pg_cron automatically, no need to create extension

-- Create Cron Job using Supabase's simplified syntax
-- Job name: fetch-support-emails
-- Schedule: Every 5 minutes (*/5 * * * *)
-- Command: Call Edge Function via HTTP POST

SELECT net.http_post(
    url:='https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/fetch-emails',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I"}'::jsonb,
    body:='{}'::jsonb
) AS request_id;
