-- ============================================================
-- PROJECT MANAGEMENT TABLES MIGRATION
-- Created: 2025-11-25
-- Description: Tables for managing projects, credentials, agents, and workflows
-- ============================================================

-- 1. PROJECTS TABLE
-- Main table for storing project information
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '📁',
    color VARCHAR(100) DEFAULT 'from-blue-500 to-indigo-600',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'development', 'paused', 'archived')),
    local_url VARCHAR(500),
    production_url VARCHAR(500),
    github_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 2. PROJECT CREDENTIALS TABLE
-- Store API keys and credentials for each project
CREATE TABLE IF NOT EXISTS project_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('api', 'database', 'cloud', 'email', 'payment', 'deployment', 'analytics', 'cdn', 'social', 'other')),
    key_value TEXT NOT NULL, -- Encrypted in app layer
    key_preview VARCHAR(50), -- e.g., "sk-proj-xxx...xxx"
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    environment VARCHAR(50) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_rotated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_credentials_project_id ON project_credentials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_credentials_type ON project_credentials(type);
CREATE INDEX IF NOT EXISTS idx_project_credentials_status ON project_credentials(status);

-- 3. PROJECT AGENTS TABLE
-- AI agents configured for each project
CREATE TABLE IF NOT EXISTS project_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model VARCHAR(100) NOT NULL, -- e.g., gpt-4o-mini, claude-3-sonnet
    provider VARCHAR(50) DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic', 'google', 'openrouter', 'local', 'other')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'development', 'deprecated')),
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    total_runs INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    total_cost_usd DECIMAL(10,4) DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_agents_project_id ON project_agents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_agents_status ON project_agents(status);
CREATE INDEX IF NOT EXISTS idx_project_agents_provider ON project_agents(provider);

-- 4. PROJECT WORKFLOWS TABLE
-- n8n workflows associated with each project
CREATE TABLE IF NOT EXISTS project_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    n8n_workflow_id VARCHAR(100), -- ID from n8n
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'development', 'error')),
    trigger_type VARCHAR(50) DEFAULT 'webhook' CHECK (trigger_type IN ('webhook', 'schedule', 'manual', 'event')),
    webhook_url VARCHAR(500),
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    last_execution_at TIMESTAMPTZ,
    last_execution_status VARCHAR(50),
    average_execution_time_ms INTEGER,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_workflows_project_id ON project_workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflows_status ON project_workflows(status);
CREATE INDEX IF NOT EXISTS idx_project_workflows_n8n_id ON project_workflows(n8n_workflow_id);

-- 5. WORKFLOW EXECUTIONS LOG TABLE
-- Log each workflow execution
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES project_workflows(id) ON DELETE CASCADE,
    n8n_execution_id VARCHAR(100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    triggered_by VARCHAR(100) -- 'webhook', 'schedule', 'manual', 'user:xxx'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES
-- Projects: Admin can do everything
CREATE POLICY "Admin full access to projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow authenticated users to read projects
CREATE POLICY "Authenticated users can read projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Credentials: Only admin can access
CREATE POLICY "Admin full access to credentials" ON project_credentials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Agents: Admin full access, users can read
CREATE POLICY "Admin full access to agents" ON project_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Authenticated users can read agents" ON project_agents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Workflows: Admin full access, users can read
CREATE POLICY "Admin full access to workflows" ON project_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Authenticated users can read workflows" ON project_workflows
    FOR SELECT USING (auth.role() = 'authenticated');

-- Workflow executions: Admin full access
CREATE POLICY "Admin full access to workflow executions" ON workflow_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 8. FUNCTIONS FOR UPDATING TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_credentials_updated_at
    BEFORE UPDATE ON project_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_agents_updated_at
    BEFORE UPDATE ON project_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_workflows_updated_at
    BEFORE UPDATE ON project_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. SEED DATA - Initial projects
INSERT INTO projects (slug, name, description, icon, color, status, local_url, production_url, github_url)
VALUES 
    ('longsang-portfolio', 'Long Sang Portfolio', 'Website portfolio cá nhân với AI integration', '🏠', 'from-blue-500 to-indigo-600', 'active', 'http://localhost:8081', 'https://longsang.com', 'https://github.com/longsangsabo2025/longsang-portfolio'),
    ('ainewbie-web', 'AI Newbie Web', 'Platform học AI cho người mới bắt đầu', '🤖', 'from-purple-500 to-pink-600', 'active', 'http://localhost:5173', 'https://ainewbie.vn', 'https://github.com/longsangsabo2025/ainewbie-web'),
    ('sabo-hub', 'Sabo Hub', 'Hệ sinh thái quản lý doanh nghiệp', '🏢', 'from-green-500 to-emerald-600', 'development', 'http://localhost:3000', NULL, 'https://github.com/longsangsabo2025/sabo-hub'),
    ('vungtau-dream-homes', 'Vũng Tàu Dream Homes', 'Website bất động sản Vũng Tàu', '🏡', 'from-orange-500 to-red-600', 'active', 'http://localhost:5174', 'https://vungtaudreamhomes.com', 'https://github.com/longsangsabo2025/vungtau-dream-homes'),
    ('ai-secretary', 'AI Secretary', 'Trợ lý AI thông minh đa năng', '💼', 'from-cyan-500 to-blue-600', 'development', 'http://localhost:3001', NULL, 'https://github.com/longsangsabo2025/ai-secretary'),
    ('sabo-arena', 'Sabo Arena', 'Gaming và giải trí platform', '🎮', 'from-violet-500 to-purple-600', 'paused', NULL, NULL, 'https://github.com/longsangsabo2025/sabo-arena')
ON CONFLICT (slug) DO NOTHING;

-- 10. VIEWS FOR EASY QUERYING
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.slug,
    p.name,
    p.status,
    COUNT(DISTINCT pc.id) as credentials_count,
    COUNT(DISTINCT pa.id) as agents_count,
    COUNT(DISTINCT pw.id) as workflows_count,
    COALESCE(SUM(pa.total_runs), 0) as total_agent_runs,
    COALESCE(SUM(pw.total_executions), 0) as total_workflow_executions
FROM projects p
LEFT JOIN project_credentials pc ON p.id = pc.project_id
LEFT JOIN project_agents pa ON p.id = pa.project_id
LEFT JOIN project_workflows pw ON p.id = pw.project_id
GROUP BY p.id, p.slug, p.name, p.status;

-- Grant access to the view
GRANT SELECT ON project_stats TO authenticated;

COMMENT ON TABLE projects IS 'Main projects table for project management';
COMMENT ON TABLE project_credentials IS 'API keys and credentials for each project';
COMMENT ON TABLE project_agents IS 'AI agents configured for each project';
COMMENT ON TABLE project_workflows IS 'n8n workflows associated with each project';
COMMENT ON TABLE workflow_executions IS 'Log of workflow executions';
