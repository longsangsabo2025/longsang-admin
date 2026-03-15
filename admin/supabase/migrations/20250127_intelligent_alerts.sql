-- Migration: Intelligent Alerts Table
-- Description: Store intelligent alerts detected by AI monitoring

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_type ON intelligent_alerts(type);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_severity ON intelligent_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_detected_at ON intelligent_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_resolved ON intelligent_alerts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_user_id ON intelligent_alerts(user_id);

-- RLS Policies - DISABLED for admin-only setup
-- ALTER TABLE intelligent_alerts ENABLE ROW LEVEL SECURITY;
-- RLS disabled - admin only, no restrictions needed

COMMENT ON TABLE intelligent_alerts IS 'Intelligent alerts detected by AI monitoring system';
COMMENT ON COLUMN intelligent_alerts.type IS 'Type of alert: anomaly, threshold, pattern, opportunity';
COMMENT ON COLUMN intelligent_alerts.severity IS 'Severity level: critical, warning, info';
COMMENT ON COLUMN intelligent_alerts.message IS 'Human-readable alert message';
COMMENT ON COLUMN intelligent_alerts.suggested_workflow_id IS 'Reference to workflow if alert suggests executing a workflow';
COMMENT ON COLUMN intelligent_alerts.auto_resolve IS 'Whether this alert can be auto-resolved';
COMMENT ON COLUMN intelligent_alerts.metadata IS 'Additional metadata about the alert';

