-- 🧪 FULL SYSTEM TEST
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql/new

-- ============================================
-- TEST 1: Contact Form → AI Blog Generation
-- ============================================

INSERT INTO contacts
  (name, email, message, phone)
VALUES
  (
    'John Smith',
    'john@example.com',
    'I run a digital marketing agency and I am looking for automation solutions to help with content creation, social media scheduling, and email campaigns. Can your AI platform help me automate these tasks?',
    '0987654321'
);

-- Wait 10-15 seconds for Edge Function to process...
-- Then run queries below to verify:

-- Check if blog post was generated
SELECT
  id,
  title,
  content_type,
  status,
  priority,
  LEFT(generated_content, 200) as content_preview,
  metadata->>'topic' as topic,
  metadata->>'source' as source,
  created_at
FROM content_queue
WHERE content_type = 'blog_post'
ORDER BY created_at DESC
LIMIT 1;

-- ✅ Expected: New blog post with AI-generated content about automation

-- ============================================
-- TEST 2: Check Activity Logs
-- ============================================

SELECT
  action
,
  status,
  details->>'topic' as topic,
  details->>'model' as ai_model,
  details->>'tokens' as tokens_used,
  error_message,
  created_at
FROM activity_logs
WHERE action IN
('content_generated', 'ai_generation_failed')
ORDER BY created_at DESC
LIMIT 5;

-- ✅ Expected: action='content_generated', status='success', model='gpt-4o-mini'

-- ============================================
-- TEST 3: Schedule a Test Email
-- ============================================

INSERT INTO content_queue
  (
  title,
  content_type,
  status,
  scheduled_for,
  metadata,
  generated_content
  )
VALUES
  (
    'Welcome to LongSang Automation',
    'email',
    'scheduled',
    NOW() + INTERVAL
'2 minutes',  -- Send in 2 minutes
  jsonb_build_object
(
    'recipient', 'your-real-email@gmail.com',  -- ⚠️ CHANGE THIS to your email
    'subject', 'Test Email from LongSang Forge'
  ),
  '<h1>Welcome!</h1><p>This is a test email from your automated system.</p><p>If you receive this, email automation is working! 🎉</p>'
);

-- Wait 10-12 minutes for next cron job run...
-- Then check if email was sent:

SELECT
  id,
  title,
  content_type,
  status,
  scheduled_for,
  updated_at,
  metadata->>'recipient' as sent_to
FROM content_queue
WHERE content_type = 'email'
  AND status IN ('completed', 'failed')
ORDER BY updated_at DESC
LIMIT 1;

-- ✅ Expected: status='completed' after 10 minutes
-- Check your email inbox!

-- ============================================
-- TEST 4: Monitor Edge Function Calls
-- ============================================

SELECT
  id
,
  url,
  method,
  status_code,
  LEFT
(response::text, 100) as response_preview,
  created
FROM net._http_response
WHERE url LIKE '%supabase.co/functions%'
ORDER BY created DESC
LIMIT 10;

-- ✅ Expected: Multiple calls with status_code=200

-- ============================================
-- TEST 5: Verify Cron Jobs
-- ============================================

SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job
WHERE jobname IN ('send-scheduled-emails', 'publish-social-posts')
ORDER BY jobname;

-- ✅ Expected: 2 jobs active

-- ============================================
-- TEST 6: Check Cron Job Execution History
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

-- ✅ Expected: Recent executions every 10/15 minutes

-- ============================================
-- SUCCESS CHECKLIST
-- ============================================

-- ✅ Contact inserted → Blog post auto-generated
-- ✅ AI content visible in generated_content field
-- ✅ Activity log shows 'content_generated' success
-- ✅ Email scheduled → Status changes to 'completed' after 10 min
-- ✅ Email received in inbox
-- ✅ Edge functions returning 200 status
-- ✅ Cron jobs active and running

-- 🎉 If all checks pass: SYSTEM IS FULLY OPERATIONAL!
