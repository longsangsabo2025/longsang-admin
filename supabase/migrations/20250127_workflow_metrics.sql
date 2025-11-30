-- Migration: Workflow Metrics Table
-- Description: Store metrics for workflow optimization

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_id ON workflow_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_execution_id ON workflow_metrics(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_node_id ON workflow_metrics(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_created_at ON workflow_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_success ON workflow_metrics(success);

-- RLS Policies - DISABLED for admin-only setup
-- ALTER TABLE workflow_metrics ENABLE ROW LEVEL SECURITY;
-- RLS disabled - admin only, no restrictions needed

COMMENT ON TABLE workflow_metrics IS 'Metrics collected for workflow optimization';
COMMENT ON COLUMN workflow_metrics.node_id IS 'ID of the workflow node this metric is for';
COMMENT ON COLUMN workflow_metrics.execution_time_ms IS 'Execution time in milliseconds';
COMMENT ON COLUMN workflow_metrics.cost_usd IS 'Cost in USD for this execution';
COMMENT ON COLUMN workflow_metrics.metadata IS 'Additional metadata about the metric';

