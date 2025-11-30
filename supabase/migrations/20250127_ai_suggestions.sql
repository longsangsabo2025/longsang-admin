-- Migration: AI Suggestions Table
-- Description: Store proactive AI suggestions for users

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_priority ON ai_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_dismissed ON ai_suggestions(dismissed_at) WHERE dismissed_at IS NULL;

-- RLS Policies - DISABLED for admin-only setup
-- ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
-- RLS disabled - admin only, no restrictions needed

COMMENT ON TABLE ai_suggestions IS 'Proactive AI suggestions for users';
COMMENT ON COLUMN ai_suggestions.type IS 'Type of suggestion: action, workflow, optimization, alert';
COMMENT ON COLUMN ai_suggestions.priority IS 'Priority level: high, medium, low';
COMMENT ON COLUMN ai_suggestions.reason IS 'Reason why this suggestion was generated';
COMMENT ON COLUMN ai_suggestions.suggested_workflow_id IS 'Reference to workflow if suggestion is to execute a workflow';
COMMENT ON COLUMN ai_suggestions.suggested_action IS 'JSON object describing the suggested action';
COMMENT ON COLUMN ai_suggestions.estimated_impact IS 'Estimated impact of executing this suggestion';

