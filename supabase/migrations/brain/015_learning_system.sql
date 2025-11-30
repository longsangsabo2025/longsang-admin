-- ================================================
-- Phase 6B - Learning System
-- ================================================
-- User feedback tracking and learning metrics

-- User Feedback Table
CREATE TABLE public.brain_user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query_id UUID REFERENCES public.brain_query_history(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL, -- 'thumbs_up', 'thumbs_down', 'rating'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  context JSONB DEFAULT '{}'::jsonb, -- Additional context about the feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_user_feedback_user_id ON public.brain_user_feedback(user_id);
CREATE INDEX idx_brain_user_feedback_query_id ON public.brain_user_feedback(query_id);
CREATE INDEX idx_brain_user_feedback_type ON public.brain_user_feedback(feedback_type);
CREATE INDEX idx_brain_user_feedback_created_at ON public.brain_user_feedback(created_at DESC);

-- RLS Policies
ALTER TABLE public.brain_user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own feedback"
  ON public.brain_user_feedback FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Learning Metrics Table
CREATE TABLE public.brain_learning_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL, -- 'routing_accuracy', 'query_success_rate', 'knowledge_quality_score'
  metric_value NUMERIC NOT NULL,
  context JSONB DEFAULT '{}'::jsonb, -- Additional context (domain_id, time_range, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_brain_learning_metrics_user_id ON public.brain_learning_metrics(user_id);
CREATE INDEX idx_brain_learning_metrics_type ON public.brain_learning_metrics(metric_type);
CREATE INDEX idx_brain_learning_metrics_created_at ON public.brain_learning_metrics(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_brain_learning_metrics_user_type_created
  ON public.brain_learning_metrics(user_id, metric_type, created_at DESC);

-- RLS Policies
ALTER TABLE public.brain_learning_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own metrics"
  ON public.brain_learning_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Routing Weights Table (for reinforcement learning)
CREATE TABLE public.brain_routing_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES public.brain_domains(id) ON DELETE CASCADE NOT NULL,
  weight NUMERIC DEFAULT 1.0, -- Routing weight (higher = more likely to be selected)
  success_count INTEGER DEFAULT 0, -- Number of successful queries
  failure_count INTEGER DEFAULT 0, -- Number of failed queries
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain_id)
);

-- Indexes
CREATE INDEX idx_brain_routing_weights_user_id ON public.brain_routing_weights(user_id);
CREATE INDEX idx_brain_routing_weights_domain_id ON public.brain_routing_weights(domain_id);
CREATE INDEX idx_brain_routing_weights_weight ON public.brain_routing_weights(weight DESC);

-- RLS Policies
ALTER TABLE public.brain_routing_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own routing weights"
  ON public.brain_routing_weights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Knowledge Quality Scores Table
CREATE TABLE public.brain_knowledge_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_id UUID REFERENCES public.brain_knowledge(id) ON DELETE CASCADE NOT NULL,
  quality_score NUMERIC NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  score_components JSONB DEFAULT '{}'::jsonb, -- Breakdown of score (usage, feedback, recency, etc.)
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(knowledge_id)
);

-- Indexes
CREATE INDEX idx_brain_knowledge_quality_scores_knowledge_id ON public.brain_knowledge_quality_scores(knowledge_id);
CREATE INDEX idx_brain_knowledge_quality_scores_score ON public.brain_knowledge_quality_scores(quality_score DESC);
CREATE INDEX idx_brain_knowledge_quality_scores_calculated ON public.brain_knowledge_quality_scores(last_calculated_at DESC);

-- RLS Policies (users can view quality scores for their own knowledge)
ALTER TABLE public.brain_knowledge_quality_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view quality scores for their knowledge"
  ON public.brain_knowledge_quality_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brain_knowledge k
      WHERE k.id = brain_knowledge_quality_scores.knowledge_id
      AND k.user_id = auth.uid()
    )
  );

-- Function to update routing weight based on feedback
CREATE OR REPLACE FUNCTION public.update_routing_weight(
  p_user_id UUID,
  p_domain_id UUID,
  p_success BOOLEAN
) RETURNS VOID AS $$
DECLARE
  v_current_weight NUMERIC;
  v_success_count INTEGER;
  v_failure_count INTEGER;
  v_new_weight NUMERIC;
BEGIN
  -- Get or create routing weight
  SELECT weight, success_count, failure_count
  INTO v_current_weight, v_success_count, v_failure_count
  FROM public.brain_routing_weights
  WHERE user_id = p_user_id AND domain_id = p_domain_id;

  IF v_current_weight IS NULL THEN
    -- Create new entry
    INSERT INTO public.brain_routing_weights (user_id, domain_id, weight, success_count, failure_count)
    VALUES (p_user_id, p_domain_id, 1.0, CASE WHEN p_success THEN 1 ELSE 0 END, CASE WHEN p_success THEN 0 ELSE 1 END);
  ELSE
    -- Update existing entry
    IF p_success THEN
      v_success_count := v_success_count + 1;
    ELSE
      v_failure_count := v_failure_count + 1;
    END IF;

    -- Calculate new weight (simple formula: success_rate * base_weight)
    -- More sophisticated algorithms can be implemented later
    v_new_weight := CASE
      WHEN (v_success_count + v_failure_count) > 0 THEN
        (v_success_count::NUMERIC / (v_success_count + v_failure_count)::NUMERIC) * 1.5
      ELSE 1.0
    END;

    UPDATE public.brain_routing_weights
    SET
      weight = v_new_weight,
      success_count = v_success_count,
      failure_count = v_failure_count,
      last_updated = NOW()
    WHERE user_id = p_user_id AND domain_id = p_domain_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_routing_weight TO authenticated;

-- Function to calculate routing accuracy
CREATE OR REPLACE FUNCTION public.calculate_routing_accuracy(
  p_user_id UUID,
  p_time_range_hours INTEGER DEFAULT 24
) RETURNS NUMERIC AS $$
DECLARE
  v_total_queries INTEGER;
  v_successful_queries INTEGER;
  v_accuracy NUMERIC;
BEGIN
  -- Count total queries with feedback in time range
  SELECT COUNT(*)
  INTO v_total_queries
  FROM public.brain_user_feedback f
  JOIN public.brain_query_history q ON q.id = f.query_id
  WHERE f.user_id = p_user_id
    AND f.feedback_type IN ('thumbs_up', 'thumbs_down', 'rating')
    AND f.created_at >= NOW() - (p_time_range_hours || ' hours')::INTERVAL;

  -- Count successful queries (thumbs_up or rating >= 4)
  SELECT COUNT(*)
  INTO v_successful_queries
  FROM public.brain_user_feedback f
  JOIN public.brain_query_history q ON q.id = f.query_id
  WHERE f.user_id = p_user_id
    AND (
      f.feedback_type = 'thumbs_up' OR
      (f.feedback_type = 'rating' AND f.rating >= 4)
    )
    AND f.created_at >= NOW() - (p_time_range_hours || ' hours')::INTERVAL;

  -- Calculate accuracy
  IF v_total_queries > 0 THEN
    v_accuracy := (v_successful_queries::NUMERIC / v_total_queries::NUMERIC) * 100;
  ELSE
    v_accuracy := 0;
  END IF;

  RETURN v_accuracy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.calculate_routing_accuracy TO authenticated;

-- Comments
COMMENT ON TABLE public.brain_user_feedback IS 'User feedback for queries to improve routing and responses';
COMMENT ON TABLE public.brain_learning_metrics IS 'Learning metrics tracked over time';
COMMENT ON TABLE public.brain_routing_weights IS 'Routing weights for reinforcement learning';
COMMENT ON TABLE public.brain_knowledge_quality_scores IS 'Quality scores for knowledge items';


