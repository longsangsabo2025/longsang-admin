-- Pipeline Command Center enhancements
-- Add system_prompt column (alias for system_prompt_override for cleaner API)

ALTER TABLE pipeline_agent_configs 
  ADD COLUMN IF NOT EXISTS system_prompt TEXT;

-- Copy existing override data to new column
UPDATE pipeline_agent_configs 
  SET system_prompt = system_prompt_override 
  WHERE system_prompt IS NULL AND system_prompt_override IS NOT NULL;

-- Voice config table
CREATE TABLE IF NOT EXISTS pipeline_voice_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  tts_url TEXT DEFAULT 'http://localhost:8100',
  chunk_size INTEGER DEFAULT 250,
  min_similarity DECIMAL(3, 2) DEFAULT 0.50,
  max_consecutive_fails INTEGER DEFAULT 3,
  voice_ref TEXT,
  speed DECIMAL(3, 2) DEFAULT 1.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO pipeline_voice_config (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- Video config table
CREATE TABLE IF NOT EXISTS pipeline_video_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  width INTEGER DEFAULT 1920,
  height INTEGER DEFAULT 1080,
  fps INTEGER DEFAULT 30,
  channel_name TEXT DEFAULT 'ĐỨNG DẬY ĐI',
  bg_color TEXT DEFAULT '#0a0a0f',
  text_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#e8e8e8',
  subtitle_font_size INTEGER DEFAULT 44,
  subtitle_margin_bottom INTEGER DEFAULT 80,
  crf INTEGER DEFAULT 20,
  comfyui_timeout INTEGER DEFAULT 30,
  image_source TEXT DEFAULT 'comfyui',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO pipeline_video_config (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- Enable realtime for pipeline tables
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_runs;
