-- Disable RLS for AI Tables
-- Run this in Supabase SQL Editor

ALTER TABLE ai_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligent_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_metrics DISABLE ROW LEVEL SECURITY;

