-- Test the auto-trigger system
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new

-- ============================================
-- TEST 1: Insert test contact
-- ============================================

INSERT INTO contacts
  (name, email, message, phone)
VALUES
  (
    'Test Automation User',
    'automation-test@example.com',
    'I am interested in AI automation for my marketing. Can you help me automate content creation and social media posting? I want to learn more about your platform.',
    '0123456789'
);

-- Wait 5-10 seconds for Edge Function to process...

-- ============================================
-- TEST 2: Check if blog was added to queue
-- ============================================

SELECT
  id,
  title,
  content_type,
  status,
  priority,
  metadata->>'topic' as topic,
  metadata->>'source' as source,
  created_at
FROM content_queue
WHERE content_type = 'blog_post'
ORDER BY created_at DESC
LIMIT 5;

-- Expected: New entry with content_type='blog_post', status='pending'

-- ============================================
-- TEST 3: Check activity logs
-- ============================================

SELECT
  action
,
  status,
  details->>'topic' as topic,
  details->>'contact_id' as contact_id,
  error_message,
  created_at
FROM activity_logs
WHERE action = 'content_generated'
ORDER BY created_at DESC
LIMIT 5;

-- Expected: action='content_generated', status='success'

-- ============================================
-- TEST 4: View the generated content (if any)
-- ============================================

SELECT
  id,
  title,
  generated_content,
  status,
  created_at
FROM content_queue
WHERE content_type = 'blog_post'
  AND created_at > NOW() - INTERVAL
'1 hour'
ORDER BY created_at DESC
LIMIT 1;

-- If AI API key is configured, you'll see generated_content

-- ============================================
-- TEST 5: Check trigger exists
-- ============================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_contact_submitted';

-- Expected: Shows the trigger configuration

-- ============================================
-- TEST 6: Check Edge Function was called
-- ============================================

SELECT
  id,
  url,
  method,
  status_code,
  response_headers,
  created
FROM net._http_response
WHERE url LIKE '%trigger-content-writer%'
ORDER BY created DESC
LIMIT 5;

-- Expected: Shows HTTP requests to Edge Function

-- ============================================
-- TEST 7: Monitor cron jobs (after setup)
-- ============================================

SELECT
  jobid
,
  jobname,
  schedule,
  command,
  nodename,
  active
FROM cron.job
WHERE jobname IN
('send-scheduled-emails', 'publish-social-posts')
ORDER BY jobname;

-- Expected: Shows both cron jobs if configured

-- ============================================
-- TEST 8: Check cron job execution history
-- ============================================

SELECT
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobname IN ('send-scheduled-emails', 'publish-social-posts')
ORDER BY start_time DESC
LIMIT 10;

-- Expected: Shows cron job execution history

-- ============================================
-- CLEANUP: Delete test data (optional)
-- ============================================

-- Delete test contact
-- DELETE FROM contacts WHERE email = 'automation-test@example.com';

-- Delete test content queue items
-- DELETE FROM content_queue WHERE metadata->>'source' = 'contact_form' AND created_at > NOW() - INTERVAL '1 hour';

-- Delete test activity logs
-- DELETE FROM activity_logs WHERE created_at > NOW() - INTERVAL '1 hour';
