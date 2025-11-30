-- Quick fix: Disable RLS on ai_agents table (for testing)
ALTER TABLE ai_agents DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ai_agents';
