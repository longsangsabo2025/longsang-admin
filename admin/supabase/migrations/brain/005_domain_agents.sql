-- ================================================
-- AI SECOND BRAIN - Domain Agent Configuration
-- ================================================
-- This migration adds agent configuration to domains

-- ================================================
-- Add Agent Config Column
-- ================================================
ALTER TABLE public.brain_domains
ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{
  "enabled": true,
  "system_prompt": null,
  "temperature": 0.7,
  "max_tokens": 2000,
  "auto_tagging": {
    "enabled": false,
    "rules": []
  },
  "suggestions": {
    "enabled": true,
    "max_suggestions": 5
  }
}'::jsonb;

-- ================================================
-- Add Agent Metadata
-- ================================================
ALTER TABLE public.brain_domains
ADD COLUMN IF NOT EXISTS agent_last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS agent_total_queries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS agent_success_rate FLOAT DEFAULT 1.0;

-- ================================================
-- INDEX for agent queries
-- ================================================
CREATE INDEX IF NOT EXISTS idx_brain_domains_agent_enabled
  ON public.brain_domains((agent_config->>'enabled'))
  WHERE (agent_config->>'enabled')::boolean = true;

-- ================================================
-- FUNCTION: Get Domain Agent Context
-- ================================================
CREATE OR REPLACE FUNCTION public.get_domain_agent_context(p_domain_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_domain JSONB;
  v_recent_knowledge JSONB;
  v_core_logic JSONB;
  v_context JSONB;
BEGIN
  -- Get domain info
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'description', description,
    'agent_config', agent_config
  ) INTO v_domain
  FROM public.brain_domains
  WHERE id = p_domain_id AND user_id = p_user_id;

  IF v_domain IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get recent knowledge (last 10 items)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'content', LEFT(content, 500), -- First 500 chars
      'tags', tags,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) INTO v_recent_knowledge
  FROM public.brain_knowledge
  WHERE domain_id = p_domain_id AND user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 10;

  -- Get latest core logic (if exists)
  SELECT jsonb_build_object(
    'first_principles', first_principles,
    'mental_models', mental_models,
    'decision_rules', decision_rules,
    'version', version
  ) INTO v_core_logic
  FROM public.brain_core_logic
  WHERE domain_id = p_domain_id AND user_id = p_user_id
  ORDER BY version DESC
  LIMIT 1;

  -- Build context
  v_context := jsonb_build_object(
    'domain', v_domain,
    'recent_knowledge', COALESCE(v_recent_knowledge, '[]'::jsonb),
    'core_logic', COALESCE(v_core_logic, '{}'::jsonb),
    'timestamp', NOW()
  );

  RETURN v_context;
END;
$$;

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.get_domain_agent_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_agent_context TO anon;

-- ================================================
-- COMMENT
-- ================================================
COMMENT ON COLUMN public.brain_domains.agent_config IS
'Domain-specific AI agent configuration including prompts, settings, and behavior rules';

COMMENT ON FUNCTION public.get_domain_agent_context IS
'Returns comprehensive context for domain agent including domain info, recent knowledge, and core logic';

