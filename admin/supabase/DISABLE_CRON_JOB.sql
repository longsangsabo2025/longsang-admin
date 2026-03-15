-- Disable the broken cron job that calls Edge Function
-- This job was created earlier but the Edge Function fails due to Buffer incompatibility

-- Option 1: Unschedule by job ID
SELECT cron.unschedule(1);

-- Option 2: Unschedule by name
SELECT cron.unschedule('fetch-support-emails');

-- Verify it's deleted
SELECT * FROM cron.job;
