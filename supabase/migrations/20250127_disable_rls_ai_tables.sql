-- Disable RLS for AI Tables (Admin only, no RLS needed)
-- Description: Disable Row Level Security for AI Command Center tables

-- Disable RLS for ai_suggestions
ALTER TABLE ai_suggestions DISABLE ROW LEVEL SECURITY;

-- Disable RLS for intelligent_alerts
ALTER TABLE intelligent_alerts DISABLE ROW LEVEL SECURITY;

-- Disable RLS for workflow_metrics
ALTER TABLE workflow_metrics DISABLE ROW LEVEL SECURITY;

