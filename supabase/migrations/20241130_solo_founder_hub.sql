-- =====================================================
-- Solo Founder Hub - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MORNING BRIEFINGS TABLE
-- Stores daily AI-generated briefings
-- =====================================================
CREATE TABLE IF NOT EXISTS morning_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Briefing Content
    summary TEXT,
    priorities JSONB DEFAULT '[]'::jsonb,
    key_metrics JSONB DEFAULT '{}'::jsonb,
    pending_emails JSONB DEFAULT '[]'::jsonb,
    pending_tasks JSONB DEFAULT '[]'::jsonb,
    content_queue JSONB DEFAULT '[]'::jsonb,
    decisions_needed JSONB DEFAULT '[]'::jsonb,
    
    -- AI Generated Insights
    ai_insights TEXT,
    motivation_quote TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    generated_by TEXT DEFAULT 'n8n', -- 'n8n', 'manual', 'api'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per user per day
    UNIQUE(user_id, date)
);

-- =====================================================
-- 2. AI AGENTS TABLE
-- Stores agent configurations and status
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Agent Info
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'dev', 'content', 'marketing', 'sales', 'admin', 'advisor'
    description TEXT,
    avatar_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'offline', -- 'online', 'offline', 'busy', 'error'
    last_active_at TIMESTAMPTZ,
    
    -- Configuration
    model TEXT DEFAULT 'gpt-4o-mini',
    temperature DECIMAL(2,1) DEFAULT 0.7,
    system_prompt TEXT,
    capabilities JSONB DEFAULT '[]'::jsonb,
    
    -- Performance Metrics
    tasks_completed INTEGER DEFAULT 0,
    tasks_pending INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- in seconds
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. AGENT TASKS TABLE
-- Stores tasks assigned to agents
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    
    -- Task Info
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL, -- 'content', 'dev', 'marketing', 'sales', 'admin', 'research'
    priority TEXT DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Input/Output
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. AGENT RESPONSES TABLE
-- Stores AI agent responses (from n8n)
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    
    -- Response
    agent_type TEXT NOT NULL,
    response JSONB NOT NULL,
    raw_response TEXT,
    
    -- Status
    status TEXT DEFAULT 'completed', -- 'completed', 'partial', 'error'
    
    -- Metrics
    tokens_used INTEGER,
    response_time_ms INTEGER,
    model_used TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. DECISION QUEUE TABLE
-- Stores decisions that need user approval
-- =====================================================
CREATE TABLE IF NOT EXISTS decision_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    
    -- Decision Info
    title TEXT NOT NULL,
    description TEXT,
    decision_type TEXT NOT NULL, -- 'budget', 'content', 'code', 'outreach', 'security', 'strategy'
    
    -- Impact Assessment
    impact TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    urgency TEXT DEFAULT 'this_week', -- 'immediate', 'today', 'this_week'
    
    -- AI Recommendation
    recommendation TEXT DEFAULT 'review', -- 'approve', 'reject', 'review'
    recommendation_reason TEXT,
    
    -- Details
    details JSONB DEFAULT '{}'::jsonb,
    -- Expected structure:
    -- {
    --   "current": "Current state",
    --   "proposed": "Proposed change",
    --   "reason": "Why this change",
    --   "benefit": "Expected benefit",
    --   "risk": "Potential risks",
    --   "cost": 0,
    --   "timeline": "When to apply"
    -- }
    
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- User Action
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'deferred'
    user_feedback TEXT,
    decided_at TIMESTAMPTZ,
    
    -- Deadline
    deadline TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. AGENT MEMORY TABLE
-- Shared context/memory for all agents
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Memory Info
    memory_type TEXT NOT NULL, -- 'fact', 'preference', 'goal', 'constraint', 'context', 'learning'
    category TEXT NOT NULL, -- 'Business', 'Marketing', 'Technical', etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    importance TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Source
    source TEXT DEFAULT 'manual', -- 'manual', 'auto', 'agent', 'imported'
    source_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    
    -- Usage Tracking
    used_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Related Items
    linked_items UUID[] DEFAULT '{}',
    
    -- Embedding for semantic search (if using pgvector)
    embedding vector(1536),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. AGENT COMMUNICATION LOG TABLE
-- Stores inter-agent and agent-user communications
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Communication
    from_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    to_agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    to_user BOOLEAN DEFAULT FALSE,
    
    -- Message
    message_type TEXT DEFAULT 'info', -- 'info', 'request', 'response', 'alert', 'handoff'
    subject TEXT,
    content TEXT NOT NULL,
    
    -- Related
    related_task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Morning Briefings
CREATE INDEX idx_briefings_user_date ON morning_briefings(user_id, date DESC);
CREATE INDEX idx_briefings_is_read ON morning_briefings(user_id, is_read);

-- AI Agents
CREATE INDEX idx_agents_user ON ai_agents(user_id);
CREATE INDEX idx_agents_role ON ai_agents(role);
CREATE INDEX idx_agents_status ON ai_agents(status);

-- Agent Tasks
CREATE INDEX idx_tasks_user ON agent_tasks(user_id);
CREATE INDEX idx_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX idx_tasks_status ON agent_tasks(status);
CREATE INDEX idx_tasks_type ON agent_tasks(task_type);
CREATE INDEX idx_tasks_priority ON agent_tasks(priority);

-- Agent Responses
CREATE INDEX idx_responses_task ON agent_responses(task_id);
CREATE INDEX idx_responses_agent ON agent_responses(agent_id);

-- Decision Queue
CREATE INDEX idx_decisions_user ON decision_queue(user_id);
CREATE INDEX idx_decisions_status ON decision_queue(status);
CREATE INDEX idx_decisions_urgency ON decision_queue(urgency);
CREATE INDEX idx_decisions_deadline ON decision_queue(deadline);

-- Agent Memory
CREATE INDEX idx_memory_user ON agent_memory(user_id);
CREATE INDEX idx_memory_type ON agent_memory(memory_type);
CREATE INDEX idx_memory_category ON agent_memory(category);
CREATE INDEX idx_memory_tags ON agent_memory USING GIN(tags);
CREATE INDEX idx_memory_importance ON agent_memory(importance);

-- Agent Communications
CREATE INDEX idx_comms_user ON agent_communications(user_id);
CREATE INDEX idx_comms_from ON agent_communications(from_agent_id);
CREATE INDEX idx_comms_to ON agent_communications(to_agent_id);
CREATE INDEX idx_comms_unread ON agent_communications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE morning_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_communications ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view own briefings" ON morning_briefings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own briefings" ON morning_briefings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own briefings" ON morning_briefings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agents" ON ai_agents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own agents" ON ai_agents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON agent_tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON agent_tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own responses" ON agent_responses
    FOR SELECT USING (
        task_id IN (SELECT id FROM agent_tasks WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view own decisions" ON decision_queue
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own decisions" ON decision_queue
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memory" ON agent_memory
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own memory" ON agent_memory
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own communications" ON agent_communications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own communications" ON agent_communications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_morning_briefings_updated_at
    BEFORE UPDATE ON morning_briefings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agent_tasks_updated_at
    BEFORE UPDATE ON agent_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decision_queue_updated_at
    BEFORE UPDATE ON decision_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agent_memory_updated_at
    BEFORE UPDATE ON agent_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment memory usage count
CREATE OR REPLACE FUNCTION increment_memory_usage(memory_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE agent_memory
    SET used_count = used_count + 1,
        last_used_at = NOW()
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's briefing or create placeholder
CREATE OR REPLACE FUNCTION get_or_create_today_briefing(p_user_id UUID)
RETURNS morning_briefings AS $$
DECLARE
    briefing morning_briefings;
BEGIN
    SELECT * INTO briefing
    FROM morning_briefings
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    
    IF NOT FOUND THEN
        INSERT INTO morning_briefings (user_id, date, summary)
        VALUES (p_user_id, CURRENT_DATE, 'Briefing is being generated...')
        RETURNING * INTO briefing;
    END IF;
    
    RETURN briefing;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA: Default AI Agents
-- =====================================================

-- This will be run per user when they first access Solo Hub
-- CREATE OR REPLACE FUNCTION create_default_agents(p_user_id UUID)
-- ... (implement as needed)

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active Decisions Summary
CREATE OR REPLACE VIEW v_pending_decisions AS
SELECT 
    user_id,
    COUNT(*) as total_pending,
    COUNT(*) FILTER (WHERE urgency = 'immediate') as immediate_count,
    COUNT(*) FILTER (WHERE urgency = 'today') as today_count,
    COUNT(*) FILTER (WHERE impact = 'high') as high_impact_count
FROM decision_queue
WHERE status = 'pending'
GROUP BY user_id;

-- View: Agent Performance Summary
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT 
    a.id as agent_id,
    a.user_id,
    a.name,
    a.role,
    a.status,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'pending') as pending_tasks,
    ROUND(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at)))::numeric, 2) as avg_completion_seconds
FROM ai_agents a
LEFT JOIN agent_tasks t ON a.id = t.agent_id
GROUP BY a.id, a.user_id, a.name, a.role, a.status;

COMMENT ON TABLE morning_briefings IS 'Stores daily AI-generated briefings for solo founders';
COMMENT ON TABLE ai_agents IS 'AI agent configurations and status tracking';
COMMENT ON TABLE agent_tasks IS 'Tasks assigned to AI agents';
COMMENT ON TABLE agent_responses IS 'AI agent responses from n8n workflows';
COMMENT ON TABLE decision_queue IS 'Decisions pending user approval';
COMMENT ON TABLE agent_memory IS 'Shared context and memory for AI agents';
COMMENT ON TABLE agent_communications IS 'Inter-agent and agent-user communication logs';
