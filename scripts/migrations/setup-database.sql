-- ================================================
-- QUICK DATABASE SETUP SCRIPT
-- Copy & paste this into Supabase SQL Editor
-- ================================================

-- Step 1: Create all tables
\i supabase/migrations/20251015000001_create_automation_tables.sql

-- Step 2: Seed initial agents
\i supabase/migrations/20251015000002_seed_initial_agents.sql

-- Step 3: Setup auto triggers
\i supabase/migrations/20251015000003_setup_auto_triggers.sql

-- Step 4: Update RLS for production
\i supabase/migrations/20251016000001_update_rls_production.sql

-- ================================================
-- VERIFY INSTALLATION
-- ================================================

-- Check tables created
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'ai_agents',
  'automation_triggers',
  'workflows',
  'activity_logs',
  'content_queue'
)
ORDER BY tablename;

-- Check agents seeded
SELECT 
  id,
  name,
  type,
  status,
  created_at
FROM ai_agents
ORDER BY created_at;

-- Check RLS enabled
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ================================================
-- ENABLE REALTIME (Run separately in dashboard)
-- ================================================
-- Go to: Database > Replication
-- Enable for: ai_agents, activity_logs, content_queue

-- ================================================
-- DONE! System ready ✅
-- ================================================
