-- Pipeline Checkpoints Table
-- Stores pipeline state after each stage for resume capability
-- Used by youtube-agent-crew SharedMemory.checkpoint() / restore()

CREATE TABLE IF NOT EXISTS pipeline_checkpoints (
  pipeline_id TEXT PRIMARY KEY,
  stage_index INTEGER NOT NULL DEFAULT 0,
  stage_name TEXT NOT NULL DEFAULT '',
  memory_data JSONB NOT NULL DEFAULT '{}',
  checkpointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing recent checkpoints
CREATE INDEX IF NOT EXISTS idx_checkpoints_date ON pipeline_checkpoints (checkpointed_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_checkpoint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_checkpoint_updated ON pipeline_checkpoints;
CREATE TRIGGER trg_checkpoint_updated
  BEFORE UPDATE ON pipeline_checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_checkpoint_timestamp();

-- Pipeline Runs History (for dashboard)
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY,
  pipeline_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, paused_cost
  input_data JSONB DEFAULT '{}',
  stage_results JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  total_cost NUMERIC(10, 6) DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runs_date ON pipeline_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON pipeline_runs (status);

-- LLM Call Logs (lightweight cost tracking, complements Langfuse)
CREATE TABLE IF NOT EXISTS llm_call_logs (
  id BIGSERIAL PRIMARY KEY,
  pipeline_id TEXT,
  agent_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_logs_pipeline ON llm_call_logs (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_llm_logs_date ON llm_call_logs (created_at DESC);

-- Enable RLS (Row Level Security) - disabled for now since this is a single-user admin app
-- ALTER TABLE pipeline_checkpoints ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE llm_call_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE pipeline_checkpoints IS 'Pipeline state checkpoints for resume capability';
COMMENT ON TABLE pipeline_runs IS 'Pipeline execution history for dashboard';
COMMENT ON TABLE llm_call_logs IS 'LLM API call logs for cost tracking';
