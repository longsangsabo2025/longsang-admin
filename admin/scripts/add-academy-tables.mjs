import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
});

async function addMissingTables() {
  const client = await pool.connect();
  try {
    console.log('🚀 Adding missing Academy tables...');
    
    // 1. Course Syllabus
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_syllabus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        learning_objectives TEXT[] DEFAULT '{}',
        grading_policy JSONB DEFAULT '{}',
        course_schedule JSONB DEFAULT '{}',
        prerequisites TEXT[] DEFAULT '{}',
        course_materials TEXT[] DEFAULT '{}',
        instructor_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(course_id)
      )
    `);
    console.log('   ✅ course_syllabus');
    
    // 2. Assignments
    await client.query(`
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
        assignment_type TEXT DEFAULT 'homework',
        allow_late_submission BOOLEAN DEFAULT TRUE,
        late_penalty_percent INTEGER DEFAULT 10,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ course_assignments');
    
    // 3. Assignment Submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        submission_content TEXT,
        submission_files JSONB DEFAULT '[]',
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        grade INTEGER,
        feedback TEXT,
        rubric_scores JSONB DEFAULT '{}',
        status TEXT DEFAULT 'submitted',
        graded_by UUID,
        graded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(assignment_id, user_id)
      )
    `);
    console.log('   ✅ assignment_submissions');
    
    // 4. Quizzes
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quiz_type TEXT DEFAULT 'practice',
        time_limit_minutes INTEGER,
        passing_score INTEGER DEFAULT 70,
        randomize_questions BOOLEAN DEFAULT FALSE,
        randomize_answers BOOLEAN DEFAULT FALSE,
        show_correct_answers BOOLEAN DEFAULT TRUE,
        allow_review BOOLEAN DEFAULT TRUE,
        max_attempts INTEGER DEFAULT 3,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ course_quizzes');
    
    // 5. Quiz Questions
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type TEXT DEFAULT 'multiple_choice',
        points INTEGER DEFAULT 1,
        order_index INTEGER,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ quiz_questions');
    
    // 6. Quiz Question Options
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_question_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        order_index INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ quiz_question_options');
    
    // 7. Quiz Attempts
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
        answers JSONB DEFAULT '{}',
        score INTEGER,
        percentage DECIMAL(5,2),
        passed BOOLEAN,
        time_spent_seconds INTEGER,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ quiz_attempts');
    
    // 8. Learning Analytics
    await client.query(`
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
        learning_path_progress JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);
    console.log('   ✅ learning_analytics');
    
    // 9. Certificates
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
        certificate_number TEXT UNIQUE,
        issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
        certificate_url TEXT,
        verification_code TEXT UNIQUE,
        expires_at TIMESTAMP,
        is_revoked BOOLEAN DEFAULT FALSE,
        revoked_at TIMESTAMP,
        revoke_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ course_certificates');
    
    // 10. Course Resources
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        section_id UUID REFERENCES course_sections(id),
        title TEXT NOT NULL,
        description TEXT,
        resource_type TEXT DEFAULT 'document',
        resource_url TEXT NOT NULL,
        file_size_kb INTEGER,
        download_count INTEGER DEFAULT 0,
        is_required BOOLEAN DEFAULT FALSE,
        order_index INTEGER,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ course_resources');
    
    // 11. Course Announcements
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        created_by UUID,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        announcement_type TEXT DEFAULT 'general',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ course_announcements');
    
    // 12. Student Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        course_id UUID REFERENCES courses(id),
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        related_id UUID,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ student_notifications');
    
    // 13. Study Groups
    await client.query(`
      CREATE TABLE IF NOT EXISTS study_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID,
        max_members INTEGER DEFAULT 10,
        member_count INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ study_groups');
    
    // 14. Study Group Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS study_group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);
    console.log('   ✅ study_group_members');
    
    console.log('\n✅ All Academy tables created successfully!');
    
    // Verify total
    const result = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'course%' OR table_name LIKE 'instructor%' OR table_name LIKE 'lesson%' 
        OR table_name LIKE 'quiz%' OR table_name LIKE 'learning%' OR table_name LIKE 'assignment%'
        OR table_name LIKE 'student%' OR table_name LIKE 'study%')
    `);
    console.log('📊 Total Academy tables:', result.rows[0].count);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingTables();
