-- Fix RLS Policies for AI Tables
-- Allow service role to read all records

-- Fix ai_suggestions RLS
DROP POLICY IF EXISTS "Service role can read suggestions" ON ai_suggestions;
CREATE POLICY "Service role can read suggestions" ON ai_suggestions
  FOR SELECT
  USING (true); -- Service role can read all

-- Fix intelligent_alerts RLS
DROP POLICY IF EXISTS "Service role can read alerts" ON intelligent_alerts;
CREATE POLICY "Service role can read alerts" ON intelligent_alerts
  FOR SELECT
  USING (true); -- Service role can read all

