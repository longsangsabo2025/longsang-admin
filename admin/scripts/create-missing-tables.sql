-- Academy Additional Tables Migration
-- Missing tables for full E2E functionality

-- 1. Course Sections (for organizing lessons)
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Progress Tracking
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percent INTEGER DEFAULT 0,
  watch_time_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 3. Course Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, expired, cancelled
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 4. Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 30,
  pass_percentage INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User XP table (track user XP and levels)
CREATE TABLE IF NOT EXISTS public.user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User XP History (log XP gains)
CREATE TABLE IF NOT EXISTS public.user_xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_key VARCHAR(100) NOT NULL,
  xp_earned INTEGER NOT NULL,
  source_id UUID, -- lesson_id, quiz_id, etc
  source_type VARCHAR(50), -- lesson, quiz, badge, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. User Badges (earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 8. User Streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  max_score INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Certificates (issued certificates)
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  pdf_url TEXT,
  verification_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_history_user ON public.user_xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);

-- Enable RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (adjust as needed for production)
CREATE POLICY "sections_select" ON public.sections FOR SELECT USING (true);
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (true);

-- User-specific policies (users can only see their own data)
CREATE POLICY "user_progress_select" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_update" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "enrollments_select" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "enrollments_insert" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_xp_select" ON public.user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_xp_insert" ON public.user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_xp_update" ON public.user_xp FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_xp_history_select" ON public.user_xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_xp_history_insert" ON public.user_xp_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_streaks_select" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_streaks_insert" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_streaks_update" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "certificates_select" ON public.certificates FOR SELECT USING (auth.uid() = user_id);

-- Seed sections for existing course
DO $$
DECLARE
  course_uuid UUID;
BEGIN
  SELECT id INTO course_uuid FROM public.courses LIMIT 1;
  
  IF course_uuid IS NOT NULL THEN
    -- Clear existing sections
    DELETE FROM public.sections WHERE course_id = course_uuid;
    
    -- Insert sections
    INSERT INTO public.sections (course_id, title, description, order_index) VALUES
      (course_uuid, 'Introduction to MCP', 'Getting started with Model Context Protocol', 1),
      (course_uuid, 'MCP Fundamentals', 'Core concepts and architecture', 2),
      (course_uuid, 'Building Your First Agent', 'Hands-on practical implementation', 3),
      (course_uuid, 'Advanced Techniques', 'Advanced patterns and best practices', 4);
  END IF;
END $$;

-- Seed quizzes for existing course
DO $$
DECLARE
  course_uuid UUID;
  lesson_uuid UUID;
BEGIN
  SELECT id INTO course_uuid FROM public.courses LIMIT 1;
  SELECT id INTO lesson_uuid FROM public.lessons WHERE course_id = course_uuid LIMIT 1;
  
  IF course_uuid IS NOT NULL AND lesson_uuid IS NOT NULL THEN
    -- Clear existing quizzes
    DELETE FROM public.quizzes WHERE course_id = course_uuid;
    
    -- Insert quiz
    INSERT INTO public.quizzes (lesson_id, course_id, title, description, time_limit_minutes, pass_percentage) VALUES
      (lesson_uuid, course_uuid, 'MCP Basics Quiz', 'Test your understanding of MCP fundamentals', 15, 70);
  END IF;
END $$;

SELECT 'Migration completed successfully!' as status;
