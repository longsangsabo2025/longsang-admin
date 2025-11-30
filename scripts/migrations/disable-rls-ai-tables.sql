-- Disable RLS for AI Tables (Admin only, no RLS needed)
-- Run this in Supabase SQL Editor

ALTER TABLE ai_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligent_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_metrics DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own suggestions" ON ai_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON ai_suggestions;
DROP POLICY IF EXISTS "Service role can insert suggestions" ON ai_suggestions;
DROP POLICY IF EXISTS "Service role can read suggestions" ON ai_suggestions;

DROP POLICY IF EXISTS "Users can read own alerts" ON intelligent_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON intelligent_alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON intelligent_alerts;
DROP POLICY IF EXISTS "Service role can read alerts" ON intelligent_alerts;

DROP POLICY IF EXISTS "Service role can read metrics" ON workflow_metrics;
DROP POLICY IF EXISTS "Service role can insert metrics" ON workflow_metrics;

