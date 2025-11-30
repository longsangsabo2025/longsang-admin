-- Create AI Tables Directly (No RLS)
-- Run this in Supabase SQL Editor

-- Create ai_suggestions (if not exists)
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('action', 'workflow', 'optimization', 'alert')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  reason TEXT NOT NULL,
  suggested_workflow_id UUID REFERENCES project_workflows(id) ON DELETE SET NULL,
  suggested_action JSONB,
  estimated_impact TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  dismissed_at TIMESTAMP,
  executed_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create intelligent_alerts (if not exists)
CREATE TABLE IF NOT EXISTS intelligent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('anomaly', 'threshold', 'pattern', 'opportunity')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,
  detected_at TIMESTAMP DEFAULT NOW(),
  suggested_workflow_id UUID REFERENCES project_workflows(id) ON DELETE SET NULL,
  auto_resolve BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create workflow_metrics (if not exists)
CREATE TABLE IF NOT EXISTS workflow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES project_workflows(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
  node_id TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_priority ON ai_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_type ON intelligent_alerts(type);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_severity ON intelligent_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_detected_at ON intelligent_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_id ON workflow_metrics(workflow_id);

-- NO RLS - Admin only setup
-- Tables are accessible to service role without restrictions

