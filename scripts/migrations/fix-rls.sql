-- Enable RLS on ai_agents table
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to ai_agents"
ON ai_agents
FOR SELECT
TO public
USING (true);

-- Create policy to allow public insert (for testing)
CREATE POLICY "Allow public insert to ai_agents"
ON ai_agents
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Allow public update to ai_agents"
ON ai_agents
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ai_agents';
