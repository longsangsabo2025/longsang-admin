-- =====================================================
-- LEARNING SYSTEM TABLES
-- =====================================================
-- Created: 2025-01-27
-- Purpose: Store feedback, patterns, and learning data for AI Copilot
-- =====================================================

-- =====================================================
-- TABLE: copilot_feedback
-- =====================================================
-- Stores user feedback on AI responses and suggestions
CREATE TABLE IF NOT EXISTS copilot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback context
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'neutral', 'correction')),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat', 'suggestion', 'command', 'plan', 'execution')),

  -- What was the feedback about
  reference_id UUID, -- ID of suggestion, message, command, etc.
  reference_type TEXT, -- 'suggestion', 'message', 'command', etc.

  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  comment TEXT,

  -- Context for learning
  original_message TEXT, -- Original user message/command
  ai_response TEXT, -- AI's response
  corrected_response TEXT, -- If correction, what should it have been

  -- Metadata
  context JSONB DEFAULT '{}', -- Additional context (project_id, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_feedback_user_id ON copilot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_feedback_type ON copilot_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_copilot_feedback_interaction ON copilot_feedback(interaction_type);
CREATE INDEX IF NOT EXISTS idx_copilot_feedback_created_at ON copilot_feedback(created_at DESC);

-- =====================================================
-- TABLE: copilot_patterns
-- =====================================================
-- Stores recognized patterns from user behavior
CREATE TABLE IF NOT EXISTS copilot_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern details
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('command_sequence', 'time_pattern', 'project_preference', 'action_combination')),
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,

  -- Pattern data
  pattern_data JSONB NOT NULL, -- Structured pattern information
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),

  -- Frequency
  occurrence_count INTEGER DEFAULT 1,
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  first_occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_patterns_user_id ON copilot_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_patterns_type ON copilot_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_copilot_patterns_active ON copilot_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_copilot_patterns_confidence ON copilot_patterns(confidence DESC);

-- =====================================================
-- TABLE: copilot_preferences
-- =====================================================
-- Stores user preferences learned from feedback
CREATE TABLE IF NOT EXISTS copilot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preference details
  preference_type TEXT NOT NULL, -- 'suggestion_style', 'response_format', 'default_project', etc.
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,

  -- Learning metadata
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT, -- 'feedback', 'pattern', 'explicit_setting'

  -- Context
  context JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique preference per user
  UNIQUE(user_id, preference_type, preference_key)
);

CREATE INDEX IF NOT EXISTS idx_copilot_preferences_user_id ON copilot_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_preferences_type ON copilot_preferences(preference_type);

-- =====================================================
-- TABLE: copilot_learning_log
-- =====================================================
-- Logs learning operations for monitoring
CREATE TABLE IF NOT EXISTS copilot_learning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation details
  operation_type TEXT NOT NULL CHECK (operation_type IN ('pattern_detected', 'preference_updated', 'embedding_updated', 'model_trained')),
  entity_type TEXT, -- 'pattern', 'preference', 'embedding', etc.
  entity_id UUID,

  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  result JSONB,
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learning_log_type ON copilot_learning_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_learning_log_status ON copilot_learning_log(status);
CREATE INDEX IF NOT EXISTS idx_learning_log_created_at ON copilot_learning_log(created_at DESC);

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_copilot_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_copilot_feedback_updated_at
BEFORE UPDATE ON copilot_feedback
FOR EACH ROW
EXECUTE FUNCTION update_copilot_learning_updated_at();

CREATE TRIGGER trigger_update_copilot_patterns_updated_at
BEFORE UPDATE ON copilot_patterns
FOR EACH ROW
EXECUTE FUNCTION update_copilot_learning_updated_at();

CREATE TRIGGER trigger_update_copilot_preferences_updated_at
BEFORE UPDATE ON copilot_preferences
FOR EACH ROW
EXECUTE FUNCTION update_copilot_learning_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE copilot_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_learning_log DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE copilot_feedback IS 'User feedback on AI responses for learning';
COMMENT ON TABLE copilot_patterns IS 'Recognized patterns from user behavior';
COMMENT ON TABLE copilot_preferences IS 'User preferences learned from interactions';
COMMENT ON TABLE copilot_learning_log IS 'Log of learning operations';

