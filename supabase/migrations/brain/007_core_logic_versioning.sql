-- ================================================
-- AI SECOND BRAIN - Core Logic Versioning Enhancement
-- ================================================
-- This migration enhances core logic table with better versioning support

-- ================================================
-- Add Versioning Columns to brain_core_logic
-- ================================================
ALTER TABLE public.brain_core_logic
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES public.brain_core_logic(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ================================================
-- Create Version History View
-- ================================================
CREATE OR REPLACE VIEW public.brain_core_logic_version_history AS
SELECT
  cl.id,
  cl.domain_id,
  cl.version,
  cl.parent_version_id,
  cl.is_active,
  cl.change_summary,
  cl.change_reason,
  cl.approved_by,
  cl.approved_at,
  cl.last_distilled_at,
  cl.created_at,
  cl.updated_at,
  cl.user_id,
  -- Count of changes from parent
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(cl.changelog) AS change
    WHERE change->>'version' = cl.version::text
  ) as change_count
FROM public.brain_core_logic cl
ORDER BY cl.domain_id, cl.version DESC;

-- ================================================
-- FUNCTION: Get Latest Active Version
-- ================================================
CREATE OR REPLACE FUNCTION public.get_latest_core_logic(
  p_domain_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  domain_id UUID,
  version INTEGER,
  first_principles JSONB,
  mental_models JSONB,
  decision_rules JSONB,
  anti_patterns JSONB,
  cross_domain_links JSONB,
  changelog JSONB,
  last_distilled_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.domain_id,
    cl.version,
    cl.first_principles,
    cl.mental_models,
    cl.decision_rules,
    cl.anti_patterns,
    cl.cross_domain_links,
    cl.changelog,
    cl.last_distilled_at,
    cl.is_active
  FROM public.brain_core_logic cl
  WHERE cl.domain_id = p_domain_id
    AND cl.user_id = p_user_id
    AND (cl.is_active = true OR cl.is_active IS NULL)
  ORDER BY cl.version DESC
  LIMIT 1;
END;
$$;

-- ================================================
-- FUNCTION: Compare Core Logic Versions
-- ================================================
CREATE OR REPLACE FUNCTION public.compare_core_logic_versions(
  p_version1_id UUID,
  p_version2_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_v1 RECORD;
  v_v2 RECORD;
  v_diff JSONB;
BEGIN
  -- Get version 1
  SELECT * INTO v_v1
  FROM public.brain_core_logic
  WHERE id = p_version1_id AND user_id = p_user_id;

  -- Get version 2
  SELECT * INTO v_v2
  FROM public.brain_core_logic
  WHERE id = p_version2_id AND user_id = p_user_id;

  IF v_v1 IS NULL OR v_v2 IS NULL THEN
    RETURN jsonb_build_object('error', 'One or both versions not found');
  END IF;

  -- Build diff
  v_diff := jsonb_build_object(
    'version1', jsonb_build_object(
      'id', v_v1.id,
      'version', v_v1.version,
      'created_at', v_v1.created_at,
      'change_summary', v_v1.change_summary
    ),
    'version2', jsonb_build_object(
      'id', v_v2.id,
      'version', v_v2.version,
      'created_at', v_v2.created_at,
      'change_summary', v_v2.change_summary
    ),
    'differences', jsonb_build_object(
      'first_principles', jsonb_build_object(
        'added', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v2.first_principles) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v1.first_principles))
        ),
        'removed', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v1.first_principles) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v2.first_principles))
        )
      ),
      'mental_models', jsonb_build_object(
        'added', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v2.mental_models) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v1.mental_models))
        ),
        'removed', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v1.mental_models) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v2.mental_models))
        )
      ),
      'decision_rules', jsonb_build_object(
        'added', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v2.decision_rules) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v1.decision_rules))
        ),
        'removed', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v1.decision_rules) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v2.decision_rules))
        )
      ),
      'anti_patterns', jsonb_build_object(
        'added', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v2.anti_patterns) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v1.anti_patterns))
        ),
        'removed', (
          SELECT jsonb_agg(item)
          FROM jsonb_array_elements(v_v1.anti_patterns) item
          WHERE item NOT IN (SELECT jsonb_array_elements(v_v2.anti_patterns))
        )
      )
    )
  );

  RETURN v_diff;
END;
$$;

-- ================================================
-- FUNCTION: Rollback to Previous Version
-- ================================================
CREATE OR REPLACE FUNCTION public.rollback_core_logic_version(
  p_domain_id UUID,
  p_target_version INTEGER,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version INTEGER;
  v_target_record RECORD;
  v_new_version_id UUID;
BEGIN
  -- Get current version
  SELECT MAX(version) INTO v_current_version
  FROM public.brain_core_logic
  WHERE domain_id = p_domain_id AND user_id = p_user_id;

  -- Get target version
  SELECT * INTO v_target_record
  FROM public.brain_core_logic
  WHERE domain_id = p_domain_id
    AND version = p_target_version
    AND user_id = p_user_id;

  IF v_target_record IS NULL THEN
    RAISE EXCEPTION 'Target version % not found', p_target_version;
  END IF;

  -- Deactivate current version
  UPDATE public.brain_core_logic
  SET is_active = false
  WHERE domain_id = p_domain_id
    AND user_id = p_user_id
    AND is_active = true;

  -- Create new version based on target
  INSERT INTO public.brain_core_logic (
    domain_id,
    version,
    parent_version_id,
    first_principles,
    mental_models,
    decision_rules,
    anti_patterns,
    cross_domain_links,
    changelog,
    is_active,
    change_summary,
    change_reason,
    last_distilled_at,
    user_id
  )
  VALUES (
    p_domain_id,
    v_current_version + 1,
    v_target_record.id,
    v_target_record.first_principles,
    v_target_record.mental_models,
    v_target_record.decision_rules,
    v_target_record.anti_patterns,
    v_target_record.cross_domain_links,
    jsonb_build_array(
      jsonb_build_object(
        'version', v_current_version + 1,
        'type', 'rollback',
        'from_version', v_current_version,
        'to_version', p_target_version,
        'reason', p_reason,
        'timestamp', NOW()
      )
    ),
    true,
    format('Rollback to version %s', p_target_version),
    p_reason,
    NOW(),
    p_user_id
  )
  RETURNING id INTO v_new_version_id;

  RETURN v_new_version_id;
END;
$$;

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_brain_core_logic_parent_version
  ON public.brain_core_logic(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_brain_core_logic_is_active
  ON public.brain_core_logic(domain_id, is_active)
  WHERE is_active = true;

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT EXECUTE ON FUNCTION public.get_latest_core_logic TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_core_logic TO anon;
GRANT EXECUTE ON FUNCTION public.compare_core_logic_versions TO authenticated;
GRANT EXECUTE ON FUNCTION public.compare_core_logic_versions TO anon;
GRANT EXECUTE ON FUNCTION public.rollback_core_logic_version TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_core_logic_version TO anon;

-- ================================================
-- COMMENT
-- ================================================
COMMENT ON COLUMN public.brain_core_logic.parent_version_id IS
'Reference to parent version for version history tracking';

COMMENT ON COLUMN public.brain_core_logic.is_active IS
'Whether this version is currently active';

COMMENT ON FUNCTION public.get_latest_core_logic IS
'Gets the latest active core logic version for a domain';

COMMENT ON FUNCTION public.compare_core_logic_versions IS
'Compares two core logic versions and returns differences';

COMMENT ON FUNCTION public.rollback_core_logic_version IS
'Rolls back to a previous version by creating a new version based on target';

