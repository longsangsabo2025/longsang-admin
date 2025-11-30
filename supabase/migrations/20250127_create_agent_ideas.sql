-- ============================================================
-- AI Agent Ideas Table
-- 
-- Lưu trữ ý tưởng và kế hoạch cho AI Agents
-- 
-- @author LongSang Admin
-- @version 1.0.0
-- ============================================================

-- Create enum types if not exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_status') THEN
        CREATE TYPE idea_status AS ENUM (
            'brainstorm', 
            'planning', 
            'ready', 
            'in_development', 
            'completed', 
            'archived'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_priority') THEN
        CREATE TYPE idea_priority AS ENUM (
            'low', 
            'medium', 
            'high', 
            'critical'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_category') THEN
        CREATE TYPE idea_category AS ENUM (
            'automation', 
            'content', 
            'data', 
            'sales', 
            'support', 
            'research', 
            'other'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'idea_complexity') THEN
        CREATE TYPE idea_complexity AS ENUM (
            'simple', 
            'medium', 
            'complex'
        );
    END IF;
END
$$;

-- Create agent_ideas table
CREATE TABLE IF NOT EXISTS agent_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Classification
    category idea_category DEFAULT 'other',
    status idea_status DEFAULT 'brainstorm',
    priority idea_priority DEFAULT 'medium',
    estimated_complexity idea_complexity DEFAULT 'medium',
    
    -- Details
    use_cases JSONB DEFAULT '[]'::jsonb,
    target_audience TEXT,
    expected_benefits TEXT,
    technical_requirements TEXT,
    notes TEXT,
    
    -- Flags
    is_starred BOOLEAN DEFAULT false,
    
    -- n8n Integration
    n8n_workflow_id VARCHAR(100),
    n8n_workflow_name VARCHAR(255),
    
    -- Converted to Agent
    converted_agent_id UUID REFERENCES ai_agents(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_ideas_status ON agent_ideas(status);
CREATE INDEX IF NOT EXISTS idx_agent_ideas_priority ON agent_ideas(priority);
CREATE INDEX IF NOT EXISTS idx_agent_ideas_category ON agent_ideas(category);
CREATE INDEX IF NOT EXISTS idx_agent_ideas_starred ON agent_ideas(is_starred);
CREATE INDEX IF NOT EXISTS idx_agent_ideas_n8n ON agent_ideas(n8n_workflow_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_agent_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_ideas_updated_at ON agent_ideas;
CREATE TRIGGER agent_ideas_updated_at
    BEFORE UPDATE ON agent_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_ideas_updated_at();

-- Row Level Security
ALTER TABLE agent_ideas ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON agent_ideas
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE agent_ideas IS 'Bảng lưu trữ ý tưởng và kế hoạch cho AI Agents';
COMMENT ON COLUMN agent_ideas.use_cases IS 'JSON array of use case strings';
COMMENT ON COLUMN agent_ideas.n8n_workflow_id IS 'ID của workflow n8n nếu được import từ n8n';
COMMENT ON COLUMN agent_ideas.converted_agent_id IS 'ID của AI Agent nếu idea được convert thành agent';
