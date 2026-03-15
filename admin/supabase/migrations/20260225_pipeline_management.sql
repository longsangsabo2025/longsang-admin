-- Pipeline Management System for Admin Dashboard
-- Stores pipeline runs, stage results, agent configs, and quality metrics

-- Pipeline Runs (main tracking table)
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input JSONB DEFAULT '{}',
  stages JSONB DEFAULT '[]',
  total_cost DECIMAL(10, 6) DEFAULT 0,
  total_duration_ms INTEGER DEFAULT 0,
  total_tokens_in INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline Checkpoints (resume support - replaces the missing table)
CREATE TABLE IF NOT EXISTS pipeline_checkpoints (
  pipeline_id TEXT PRIMARY KEY,
  stage_index INTEGER NOT NULL DEFAULT 0,
  stage_name TEXT NOT NULL DEFAULT '',
  memory_data JSONB DEFAULT '{}',
  checkpointed_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline Stage Results (detailed per-stage tracking)
CREATE TABLE IF NOT EXISTS pipeline_stage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL REFERENCES pipeline_runs(pipeline_id) ON DELETE CASCADE,
  stage_index INTEGER NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  output TEXT,
  output_preview TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  model TEXT,
  quality_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pipeline_id, stage_index)
);

-- Agent Configurations (tunable per-agent settings)
CREATE TABLE IF NOT EXISTS pipeline_agent_configs (
  agent_id TEXT PRIMARY KEY,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  temperature DECIMAL(3, 2) NOT NULL DEFAULT 0.70,
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  system_prompt_override TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Script Quality Metrics
CREATE TABLE IF NOT EXISTS pipeline_script_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id TEXT NOT NULL REFERENCES pipeline_runs(pipeline_id) ON DELETE CASCADE,
  total_words INTEGER DEFAULT 0,
  total_chars INTEGER DEFAULT 0,
  section_count INTEGER DEFAULT 0,
  estimated_minutes DECIMAL(5, 1) DEFAULT 0,
  voice_dna_score INTEGER DEFAULT 0,
  book_references INTEGER DEFAULT 0,
  metaphor_count INTEGER DEFAULT 0,
  hook_quality TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default agent configs
INSERT INTO pipeline_agent_configs (agent_id, model, temperature, max_tokens) VALUES
  ('harvester', 'gemini-2.0-flash', 0.30, 4096),
  ('brain-curator', 'gemini-2.0-flash', 0.50, 4096),
  ('script-writer', 'gemini-2.0-flash', 0.85, 16384),
  ('voice-producer', 'gemini-2.0-flash', 0.30, 1024),
  ('visual-director', 'gemini-2.0-flash', 0.70, 4096),
  ('video-assembler', 'gemini-2.0-flash', 0.30, 1024),
  ('publisher', 'gemini-2.0-flash', 0.50, 4096)
ON CONFLICT (agent_id) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_results_pipeline ON pipeline_stage_results(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_pipeline ON pipeline_checkpoints(pipeline_id);
