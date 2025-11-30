-- ============================================
-- FIX 401 ERROR - GRANT FULL ACCESS TO ANON
-- ============================================
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/sql

-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN ('agents', 'agent_executions', 'usage_tracking')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: %.% - %', pol.schemaname, pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- Step 2: Enable RLS (required for policies to work)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SUPER PERMISSIVE policies (allow EVERYTHING for anon + authenticated)
CREATE POLICY "dev_full_access_agents" ON agents
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "dev_full_access_executions" ON agent_executions
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "dev_full_access_tracking" ON usage_tracking
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Step 4: Verify policies applied
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('agents', 'agent_executions', 'usage_tracking')
ORDER BY tablename, policyname;

-- Expected result: 3 policies (one per table)
-- All should show:
-- - permissive: PERMISSIVE
-- - roles: {anon, authenticated}
-- - cmd: *
-- - qual: true
-- - with_check: true
