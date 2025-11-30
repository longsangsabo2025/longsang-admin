-- ============================================
-- SOLO HUB FOUNDATION - DATABASE TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Scheduled Posts Table
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
  post_type TEXT DEFAULT 'default',
  facebook_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for scheduled post processing
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time ON public.scheduled_posts(status, scheduled_for);

-- 2. A/B Tests Table
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  page_id TEXT NOT NULL,
  strategy TEXT DEFAULT 'headline',
  variants JSONB NOT NULL DEFAULT '[]',
  target_metric TEXT DEFAULT 'engagement',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  winner_variant_id TEXT,
  metrics JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Carousels Table
CREATE TABLE IF NOT EXISTS public.carousels (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  page_id TEXT NOT NULL,
  type TEXT DEFAULT 'product_showcase',
  caption TEXT,
  slides JSONB NOT NULL DEFAULT '[]',
  theme TEXT,
  hashtags JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  facebook_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Copilot Feedback Table (for learning)
CREATE TABLE IF NOT EXISTS public.copilot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  user_message TEXT NOT NULL,
  response_type TEXT,
  execution_time INTEGER,
  layers_used JSONB DEFAULT '[]',
  success BOOLEAN DEFAULT true,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for learning analytics
CREATE INDEX IF NOT EXISTS idx_copilot_feedback_created ON public.copilot_feedback(created_at DESC);

-- 5. Cross Platform Posts Table
CREATE TABLE IF NOT EXISTS public.cross_platform_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_content TEXT NOT NULL,
  page_id TEXT NOT NULL,
  platforms JSONB NOT NULL DEFAULT '[]', -- Array of platform results
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Platform Analytics Table
CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  page_id TEXT NOT NULL,
  date DATE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, page_id, date)
);

-- 7. Content Performance Table
CREATE TABLE IF NOT EXISTS public.content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT,
  platform TEXT NOT NULL,
  page_id TEXT NOT NULL,
  content_type TEXT DEFAULT 'post',
  ab_test_id TEXT,
  variant_id TEXT,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- 'chat', 'image', 'ab_test', 'carousel'
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate DECIMAL(10, 6) DEFAULT 0,
  request_type TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_service_date ON public.ai_usage(service, created_at DESC);

-- 9. Execution History Table (for Visual Workspace)
CREATE TABLE IF NOT EXISTS public.execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  command TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  duration INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'cancelled')),
  error TEXT,
  layers_used JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for execution history
CREATE INDEX IF NOT EXISTS idx_execution_history_user ON public.execution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_history_created ON public.execution_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_history_status ON public.execution_history(status);

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Service role has full access to scheduled_posts" ON public.scheduled_posts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to ab_tests" ON public.ab_tests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to carousels" ON public.carousels
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to copilot_feedback" ON public.copilot_feedback
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to cross_platform_posts" ON public.cross_platform_posts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to platform_analytics" ON public.platform_analytics
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to content_performance" ON public.content_performance
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to ai_usage" ON public.ai_usage
  FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS on execution_history
ALTER TABLE public.execution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to execution_history" ON public.execution_history
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carousels_updated_at BEFORE UPDATE ON public.carousels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_platform_posts_updated_at BEFORE UPDATE ON public.cross_platform_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_performance_updated_at BEFORE UPDATE ON public.content_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample scheduled post
-- INSERT INTO public.scheduled_posts (id, page_id, content, scheduled_for)
-- VALUES ('test-1', 'sabo_arena', 'Test post content', NOW() + INTERVAL '1 hour');

COMMENT ON TABLE public.scheduled_posts IS 'Scheduled posts waiting to be published';
COMMENT ON TABLE public.ab_tests IS 'A/B test configurations and results';
COMMENT ON TABLE public.carousels IS 'Multi-image carousel posts';
COMMENT ON TABLE public.copilot_feedback IS 'AI Copilot learning feedback data';
COMMENT ON TABLE public.cross_platform_posts IS 'Cross-platform publishing records';
COMMENT ON TABLE public.platform_analytics IS 'Daily analytics per platform';
COMMENT ON TABLE public.content_performance IS 'Individual content performance metrics';
COMMENT ON TABLE public.ai_usage IS 'AI API usage tracking for cost analysis';
COMMENT ON TABLE public.execution_history IS 'Visual Workspace execution history for replay and analytics';
