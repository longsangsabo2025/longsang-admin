-- Academy Learning Management System
-- Tables for courses, enrollments, progress tracking, reviews

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  total_students INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration_hours DECIMAL(5,2),
  total_lessons INTEGER DEFAULT 0,
  language TEXT DEFAULT 'Tiếng Việt',
  price DECIMAL(10,2) DEFAULT 0,
  original_price DECIMAL(10,2),
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  what_you_learn TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  total_students INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course sections (curriculum structure)
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'quiz', 'code', 'assignment')),
  video_url TEXT,
  article_content TEXT,
  duration_minutes INTEGER,
  is_free_preview BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  last_accessed_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  watch_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES course_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Discussion threads
CREATE TABLE IF NOT EXISTS course_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion replies
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES course_discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_instructor_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  total_duration_weeks INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning path steps
CREATE TABLE IF NOT EXISTS learning_path_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  skills TEXT[] DEFAULT '{}',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning path courses junction
CREATE TABLE IF NOT EXISTS learning_path_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES learning_path_steps(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(step_id, course_id)
);

-- User learning path progress
CREATE TABLE IF NOT EXISTS user_learning_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES learning_path_steps(id) ON DELETE SET NULL,
  completed_steps UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, path_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_course ON course_sections(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_course ON course_discussions(course_id);

-- RLS Policies

-- Instructors
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view instructors" ON instructors FOR SELECT USING (true);
CREATE POLICY "Instructors can update their own profile" ON instructors FOR UPDATE USING (auth.uid() = user_id);

-- Courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can manage their courses" ON courses FOR ALL USING (
  instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid())
);

-- Course sections
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sections of published courses" ON course_sections FOR SELECT USING (
  course_id IN (SELECT id FROM courses WHERE is_published = true)
);

-- Lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lessons of published courses" ON lessons FOR SELECT USING (
  section_id IN (
    SELECT cs.id FROM course_sections cs
    JOIN courses c ON c.id = cs.course_id
    WHERE c.is_published = true
  )
);

-- Enrollments
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own enrollments" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll in courses" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their enrollments" ON course_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- Lesson progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);

-- Reviews
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON course_reviews FOR SELECT USING (true);
CREATE POLICY "Enrolled users can create reviews" ON course_reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  enrollment_id IN (SELECT id FROM course_enrollments WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own reviews" ON course_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON course_reviews FOR DELETE USING (auth.uid() = user_id);

-- Review votes
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view votes" ON review_helpful_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON review_helpful_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their votes" ON review_helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- Discussions
ALTER TABLE course_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view discussions" ON course_discussions FOR SELECT USING (true);
CREATE POLICY "Enrolled users can create discussions" ON course_discussions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  course_id IN (SELECT course_id FROM course_enrollments WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their discussions" ON course_discussions FOR UPDATE USING (auth.uid() = user_id);

-- Discussion replies
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view replies" ON discussion_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can reply" ON discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their replies" ON discussion_replies FOR UPDATE USING (auth.uid() = user_id);

-- Learning paths
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view learning paths" ON learning_paths FOR SELECT USING (true);

ALTER TABLE learning_path_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view learning path steps" ON learning_path_steps FOR SELECT USING (true);

ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view learning path courses" ON learning_path_courses FOR SELECT USING (true);

ALTER TABLE user_learning_path_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their path progress" ON user_learning_path_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their path progress" ON user_learning_path_progress FOR ALL USING (auth.uid() = user_id);

-- Functions

-- Update course stats when new enrollment
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET total_students = (
    SELECT COUNT(*) FROM course_enrollments WHERE course_id = NEW.course_id
  )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enrollment_count
AFTER INSERT ON course_enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_enrollment_count();

-- Update course rating when review added/updated
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2) FROM course_reviews WHERE course_id = NEW.course_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM course_reviews WHERE course_id = NEW.course_id
    )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_rating
AFTER INSERT OR UPDATE ON course_reviews
FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- Update enrollment progress when lesson completed
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Get total lessons in course
  SELECT COUNT(l.id) INTO total_lessons
  FROM lessons l
  JOIN course_sections cs ON cs.id = l.section_id
  JOIN course_enrollments ce ON ce.course_id = cs.course_id
  WHERE ce.id = NEW.enrollment_id;

  -- Get completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress
  WHERE enrollment_id = NEW.enrollment_id AND is_completed = true;

  -- Calculate progress
  progress_pct := ROUND((completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100);

  -- Update enrollment
  UPDATE course_enrollments
  SET 
    progress_percentage = progress_pct,
    last_accessed_at = NOW(),
    completed_at = CASE WHEN progress_pct >= 95 THEN NOW() ELSE NULL END
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enrollment_progress
AFTER INSERT OR UPDATE ON lesson_progress
FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress();

-- Grant permissions
GRANT SELECT ON instructors TO authenticated, anon;
GRANT SELECT ON courses TO authenticated, anon;
GRANT SELECT ON course_sections TO authenticated, anon;
GRANT SELECT ON lessons TO authenticated, anon;
GRANT ALL ON course_enrollments TO authenticated;
GRANT ALL ON lesson_progress TO authenticated;
GRANT ALL ON course_reviews TO authenticated;
GRANT ALL ON review_helpful_votes TO authenticated;
GRANT ALL ON course_discussions TO authenticated;
GRANT ALL ON discussion_replies TO authenticated;
GRANT SELECT ON learning_paths TO authenticated, anon;
GRANT SELECT ON learning_path_steps TO authenticated, anon;
GRANT SELECT ON learning_path_courses TO authenticated, anon;
GRANT ALL ON user_learning_path_progress TO authenticated;

-- Comments
COMMENT ON TABLE courses IS 'Academy courses with full metadata';
COMMENT ON TABLE course_enrollments IS 'User course enrollments with progress tracking';
COMMENT ON TABLE lesson_progress IS 'Individual lesson completion tracking';
COMMENT ON TABLE course_reviews IS 'Course reviews and ratings';
COMMENT ON TABLE learning_paths IS 'Structured learning journeys';
