-- ============================================
-- AUTO-TRIGGER SETUP FOR LONGSANG FORGE
-- ============================================
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new

-- ============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================

-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. DATABASE TRIGGER FOR CONTACT FORMS
-- ============================================

-- Function to trigger Edge Function when contact submitted
CREATE OR REPLACE FUNCTION trigger_content_generation()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call Edge Function asynchronously using pg_net
  SELECT net.http_post(
    url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/trigger-content-writer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  ) INTO request_id;
  
  -- Log the request (optional)
  RAISE NOTICE 'Triggered content generation for contact %, request_id: %', NEW.id, request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_contact_submitted ON contacts;

-- Create trigger on contacts table
CREATE TRIGGER on_contact_submitted
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_content_generation();

COMMENT ON TRIGGER on_contact_submitted ON contacts IS 
  'Automatically triggers Edge Function to generate blog post from contact form submission';

-- ============================================
-- 3. CRON JOB: SEND SCHEDULED EMAILS
-- ============================================

-- Remove existing job if exists
SELECT cron.unschedule('send-scheduled-emails');

-- Schedule email sending every 10 minutes
SELECT cron.schedule(
  'send-scheduled-emails',           -- job name
  '*/10 * * * *',                    -- every 10 minutes
  $$
  SELECT net.http_post(
    url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/send-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

COMMENT ON FUNCTION cron.schedule IS 
  'Sends scheduled emails from content queue every 10 minutes';

-- ============================================
-- 4. CRON JOB: PUBLISH SOCIAL POSTS
-- ============================================

-- Remove existing job if exists
SELECT cron.unschedule('publish-social-posts');

-- Schedule social post publishing every 15 minutes
SELECT cron.schedule(
  'publish-social-posts',            -- job name
  '*/15 * * * *',                    -- every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://diexsbzqwsbpilsymnfb.supabase.co/functions/v1/publish-social-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

COMMENT ON FUNCTION cron.schedule IS 
  'Publishes scheduled social media posts every 15 minutes';

-- ============================================
-- 5. VERIFY SETUP
-- ============================================

-- Check if extensions are enabled
SELECT 
  extname AS extension_name,
  extversion AS version
FROM pg_extension
WHERE extname IN ('pg_net', 'pg_cron')
ORDER BY extname;

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_contact_submitted';

-- Check cron jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname IN ('send-scheduled-emails', 'publish-social-posts')
ORDER BY jobname;

-- ============================================
-- 6. GRANT PERMISSIONS (if needed)
-- ============================================

-- Grant execute permission on trigger function
GRANT EXECUTE ON FUNCTION trigger_content_generation() TO postgres, anon, authenticated, service_role;

-- ============================================
-- SETUP COMPLETE! 🎉
-- ============================================

-- Test the trigger with a sample contact:
-- INSERT INTO contacts (name, email, message) 
-- VALUES ('Test User', 'test@example.com', 'I need help with AI automation');

-- Check if it worked:
-- SELECT * FROM content_queue ORDER BY created_at DESC LIMIT 1;
-- SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1;

-- Monitor cron job runs:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('send-scheduled-emails', 'publish-social-posts'))
-- ORDER BY start_time DESC LIMIT 10;
