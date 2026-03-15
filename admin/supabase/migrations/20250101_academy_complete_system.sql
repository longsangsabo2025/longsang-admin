-- ============================================================================
-- ACADEMY COMPLETE SYSTEM - All Educational Features
-- ============================================================================

-- 1. COURSE SYLLABUS
CREATE TABLE IF NOT EXISTS course_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  learning_objectives TEXT[] DEFAULT '{}',
  grading_policy JSONB DEFAULT '{"participation": 10, "assignments": 30, "quizzes": 20, "final_exam": 40}',
  course_schedule JSONB DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  course_materials TEXT[] DEFAULT '{}',
  instructor_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id)
);

-- 2. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP NOT NULL,
  rubric JSONB DEFAULT '{}',
  max_score INTEGER DEFAULT 100,
  assignment_type TEXT DEFAULT 'homework', -- homework, project, quiz, exam
  allow_late_submission BOOLEAN DEFAULT TRUE,
  late_penalty_percent INTEGER DEFAULT 10,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. ASSIGNMENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_content TEXT,
  submission_files JSONB DEFAULT '[]', -- Array of {name, url, type}
  submitted_at TIMESTAMP NOT NULL,
  grade INTEGER,
  feedback TEXT,
  rubric_scores JSONB DEFAULT '{}',
  status TEXT DEFAULT 'submitted', -- submitted, graded, returned
  graded_by UUID,
  graded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- 4. ENHANCED QUIZZES
CREATE TABLE IF NOT EXISTS course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'practice', -- practice, graded, exam
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  randomize_questions BOOLEAN DEFAULT FALSE,
  randomize_answers BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,
  allow_review BOOLEAN DEFAULT TRUE,
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer, essay
  points INTEGER DEFAULT 1,
  order_index INTEGER,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. QUIZ QUESTION OPTIONS (for multiple choice)
CREATE TABLE IF NOT EXISTS quiz_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}', -- {question_id: answer}
  score INTEGER,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  time_spent_seconds INTEGER,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. LEARNING ANALYTICS
CREATE TABLE IF NOT EXISTS learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
  total_time_spent_minutes INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  lessons_total INTEGER DEFAULT 0,
  assignments_completed INTEGER DEFAULT 0,
  assignments_total INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  quizzes_total INTEGER DEFAULT 0,
  average_quiz_score DECIMAL(5,2),
  average_assignment_score DECIMAL(5,2),
  engagement_score DECIMAL(5,2),
  last_activity_at TIMESTAMP,
  last_lesson_viewed_id UUID,
  learning_path_progress JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 9. CERTIFICATES
CREATE TABLE IF NOT EXISTS course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE,
  issued_at TIMESTAMP NOT NULL,
  certificate_url TEXT,
  verification_code TEXT UNIQUE,
  expires_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoke_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. COURSE RESOURCES/MATERIALS
CREATE TABLE IF NOT EXISTS course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT DEFAULT 'document', -- document, code, template, reference, link
  resource_url TEXT NOT NULL,
  file_size_kb INTEGER,
  download_count INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. DISCUSSION FORUM TOPICS
CREATE TABLE IF NOT EXISTS discussion_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id),
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 12. DISCUSSION REPLIES
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES discussion_topics(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  content TEXT NOT NULL,
  is_instructor_reply BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 13. Q&A QUESTIONS
CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  answer_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 14. Q&A ANSWERS
CREATE TABLE IF NOT EXISTS qa_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  content TEXT NOT NULL,
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. STUDY GROUPS
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  max_members INTEGER DEFAULT 10,
  member_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 16. STUDY GROUP MEMBERS
CREATE TABLE IF NOT EXISTS study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- member, moderator, leader
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 17. COURSE ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS course_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT DEFAULT 'general', -- general, deadline, update, important
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 18. STUDENT NOTIFICATIONS
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES courses(id),
  notification_type TEXT NOT NULL, -- assignment_due, grade_posted, announcement, reply, etc
  title TEXT NOT NULL,
  content TEXT,
  related_id UUID, -- ID of related object (assignment, announcement, etc)
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 19. LEARNING PATHS
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 20. LEARNING PATH ITEMS
CREATE TABLE IF NOT EXISTS learning_path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- lesson, assignment, quiz
  item_id UUID NOT NULL,
  order_index INTEGER,
  is_required BOOLEAN DEFAULT TRUE,
  prerequisites TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_course_syllabus_course_id ON course_syllabus(course_id);
CREATE INDEX idx_assignments_course_id ON course_assignments(course_id);
CREATE INDEX idx_assignments_section_id ON course_assignments(section_id);
CREATE INDEX idx_assignments_due_date ON course_assignments(due_date);
CREATE INDEX idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX idx_submissions_status ON assignment_submissions(status);
CREATE INDEX idx_quizzes_course_id ON course_quizzes(course_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_analytics_user_course ON learning_analytics(user_id, course_id);
CREATE INDEX idx_certificates_user_id ON course_certificates(user_id);
CREATE INDEX idx_certificates_course_id ON course_certificates(course_id);
CREATE INDEX idx_resources_course_id ON course_resources(course_id);
CREATE INDEX idx_discussion_topics_course_id ON discussion_topics(course_id);
CREATE INDEX idx_discussion_replies_topic_id ON discussion_replies(topic_id);
CREATE INDEX idx_qa_questions_course_id ON qa_questions(course_id);
CREATE INDEX idx_qa_answers_question_id ON qa_answers(question_id);
CREATE INDEX idx_study_groups_course_id ON study_groups(course_id);
CREATE INDEX idx_announcements_course_id ON course_announcements(course_id);
CREATE INDEX idx_notifications_user_id ON student_notifications(user_id);
CREATE INDEX idx_notifications_read ON student_notifications(is_read);

-- ============================================================================
-- ENABLE REALTIME FOR KEY TABLES
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE assignment_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE qa_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE student_notifications;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE course_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Course Syllabus - Instructors can view/edit, students can view
CREATE POLICY "Instructors can manage syllabus" ON course_syllabus
  FOR ALL USING (
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

CREATE POLICY "Enrolled students can view syllabus" ON course_syllabus
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    )
  );

-- Assignments - Instructors manage, students view
CREATE POLICY "Instructors can manage assignments" ON course_assignments
  FOR ALL USING (
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

CREATE POLICY "Enrolled students can view assignments" ON course_assignments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    )
  );

-- Submissions - Students manage own, instructors view all
CREATE POLICY "Students can manage own submissions" ON assignment_submissions
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT instructor_id FROM courses c
      JOIN course_assignments ca ON ca.course_id = c.id
      WHERE ca.id = assignment_id
    )
  );

-- Quizzes - Similar to assignments
CREATE POLICY "Instructors can manage quizzes" ON course_quizzes
  FOR ALL USING (
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

CREATE POLICY "Enrolled students can view quizzes" ON course_quizzes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    )
  );

-- Quiz Attempts - Students manage own, instructors view all
CREATE POLICY "Students can manage own quiz attempts" ON quiz_attempts
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT instructor_id FROM courses c
      JOIN course_quizzes cq ON cq.course_id = c.id
      WHERE cq.id = quiz_id
    )
  );

-- Analytics - Users view own, instructors view all in their courses
CREATE POLICY "Users can view own analytics" ON learning_analytics
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

-- Certificates - Users view own, instructors view all in their courses
CREATE POLICY "Users can view own certificates" ON course_certificates
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

-- Resources - Enrolled students can view
CREATE POLICY "Enrolled students can view resources" ON course_resources
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    ) OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

-- Discussion - Enrolled students can participate
CREATE POLICY "Enrolled students can view discussions" ON discussion_topics
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    ) OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

CREATE POLICY "Enrolled students can create topics" ON discussion_topics
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    ) OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

-- Q&A - Similar to discussions
CREATE POLICY "Enrolled students can view Q&A" ON qa_questions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    ) OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

CREATE POLICY "Enrolled students can ask questions" ON qa_questions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM course_enrollments WHERE course_id = course_id
    ) OR
    auth.uid() IN (
      SELECT instructor_id FROM courses WHERE id = course_id
    )
  );

-- Notifications - Users view own
CREATE POLICY "Users can view own notifications" ON student_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update course_assignments.updated_at
CREATE OR REPLACE FUNCTION update_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_update_timestamp
  BEFORE UPDATE ON course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_timestamp();

-- Update assignment_submissions.updated_at
CREATE TRIGGER submission_update_timestamp
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_timestamp();

-- Update course_quizzes.updated_at
CREATE TRIGGER quiz_update_timestamp
  BEFORE UPDATE ON course_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_timestamp();

-- Update learning_analytics when quiz is completed
CREATE OR REPLACE FUNCTION update_analytics_on_quiz_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE learning_analytics
    SET 
      quizzes_completed = quizzes_completed + 1,
      average_quiz_score = (
        SELECT AVG(percentage)
        FROM quiz_attempts
        WHERE user_id = NEW.user_id AND course_id = (
          SELECT course_id FROM course_quizzes WHERE id = NEW.quiz_id
        ) AND completed_at IS NOT NULL
      ),
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND course_id = (
      SELECT course_id FROM course_quizzes WHERE id = NEW.quiz_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_update_on_quiz
  AFTER UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_on_quiz_complete();

-- Update analytics on submission grade
CREATE OR REPLACE FUNCTION update_analytics_on_submission_grade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
    UPDATE learning_analytics
    SET 
      assignments_completed = assignments_completed + 1,
      average_assignment_score = (
        SELECT AVG(grade)
        FROM assignment_submissions
        WHERE user_id = NEW.user_id AND grade IS NOT NULL AND assignment_id IN (
          SELECT id FROM course_assignments WHERE course_id = (
            SELECT course_id FROM course_assignments WHERE id = NEW.assignment_id
          )
        )
      ),
      updated_at = NOW()
    WHERE user_id = NEW.user_id AND course_id = (
      SELECT course_id FROM course_assignments WHERE id = NEW.assignment_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_update_on_submission
  AFTER UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_on_submission_grade();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- You can add sample data here if needed

COMMIT;
