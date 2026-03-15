import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
});

async function fixAndContinue() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing subscription_plans and continuing...\n');

    // Drop and recreate subscription_plans with all columns
    await client.query(`DROP TABLE IF EXISTS user_subscriptions CASCADE`);
    await client.query(`DROP TABLE IF EXISTS subscription_plans CASCADE`);
    
    await client.query(`
      CREATE TABLE subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price_monthly DECIMAL(10,2) NOT NULL,
        price_yearly DECIMAL(10,2),
        features JSONB DEFAULT '[]',
        max_courses INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ Recreated subscription_plans');

    await client.query(`
      CREATE TABLE user_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        status TEXT DEFAULT 'active',
        billing_cycle TEXT DEFAULT 'monthly',
        current_period_start TIMESTAMP NOT NULL,
        current_period_end TIMESTAMP NOT NULL,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        cancelled_at TIMESTAMP,
        payment_method JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ Recreated user_subscriptions');

    // Seed subscription plans
    await client.query(`
      INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_courses, sort_order) VALUES
        ('Free', 'Truy cập khóa học miễn phí', 0, 0, '["Khóa học miễn phí", "Community access", "Chứng chỉ cơ bản"]', 3, 1),
        ('Pro', 'Truy cập tất cả khóa học', 299000, 2990000, '["Tất cả khóa học", "Priority support", "Certificates", "Download videos", "1-on-1 mentoring monthly"]', NULL, 2),
        ('Team', 'Cho nhóm và doanh nghiệp', 799000, 7990000, '["Tất cả Pro features", "Team analytics", "Custom learning paths", "API access", "Dedicated support"]', NULL, 3)
    `);
    console.log('   ✅ Seeded subscription plans');

    // Seed coupons
    await client.query(`
      INSERT INTO coupon_codes (code, discount_type, discount_value, max_uses, valid_until, is_active) VALUES
        ('WELCOME50', 'percentage', 50, 100, '2025-12-31 23:59:59', true),
        ('NEWYEAR2026', 'percentage', 30, 500, '2026-01-31 23:59:59', true),
        ('LAUNCH100K', 'fixed', 100000, 50, '2025-12-31 23:59:59', true)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log('   ✅ Seeded coupon codes');

    // Create instructor
    const instructorResult = await client.query(`
      INSERT INTO instructors (id, user_id, name, title, bio, avatar_url, total_students, total_courses, average_rating)
      VALUES (
        gen_random_uuid(),
        gen_random_uuid(),
        'Long Sang',
        'AI Engineer & Automation Expert',
        'Founder AINewbieVN. 5+ năm kinh nghiệm xây dựng AI systems và automation workflows.',
        'https://avatars.githubusercontent.com/u/longsang',
        12500,
        6,
        4.9
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    let instructorId = instructorResult.rows[0]?.id;
    if (!instructorId) {
      const existing = await client.query(`SELECT id FROM instructors LIMIT 1`);
      instructorId = existing.rows[0]?.id;
    }
    console.log('   ✅ Instructor ready');

    // Create course if not exists
    const existingCourse = await client.query(`SELECT id FROM courses WHERE title LIKE '%MCP%' LIMIT 1`);
    let courseId = existingCourse.rows[0]?.id;
    
    if (!courseId && instructorId) {
      const courseResult = await client.query(`
        INSERT INTO courses (
          id, title, subtitle, description, instructor_id, category, level,
          duration_hours, total_lessons, language, price, original_price,
          is_free, is_published, tags, what_you_learn, requirements, features,
          total_students, average_rating, total_reviews, thumbnail_url
        ) VALUES (
          gen_random_uuid(),
          'AI Agent Fundamentals với MCP',
          'Xây dựng AI Agents thực tế từ zero đến production',
          'Khóa học toàn diện về xây dựng AI Agents sử dụng Model Context Protocol (MCP).',
          $1,
          'AI Agents',
          'Intermediate',
          8, 8, 'Tiếng Việt',
          1990000, 2990000, false, true,
          ARRAY['MCP', 'AI Agents', 'TypeScript'],
          ARRAY['Hiểu sâu về AI Agents', 'Xây dựng MCP server với 10+ tools', 'Deploy lên production'],
          ARRAY['TypeScript cơ bản', 'REST APIs'],
          ARRAY['8 video lessons', 'Source code', 'Certificate'],
          0, 0, 0,
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80'
        )
        RETURNING id
      `, [instructorId]);
      courseId = courseResult.rows[0].id;
      console.log('   ✅ Created course');

      // Create sections and lessons
      const sections = [
        { title: 'Phần 1: Giới thiệu AI Agents', lessons: [
          { title: 'AI Agents là gì?', duration: 25 },
          { title: 'MCP - Model Context Protocol', duration: 35 },
        ]},
        { title: 'Phần 2: Setup Environment', lessons: [
          { title: 'Cài đặt Node.js & MCP SDK', duration: 20 },
          { title: 'MCP Server đầu tiên', duration: 40 },
        ]},
        { title: 'Phần 3: Building Tools', lessons: [
          { title: 'File System Tools', duration: 45 },
          { title: 'Database Integration', duration: 50 },
        ]},
        { title: 'Phần 4: Production', lessons: [
          { title: 'Error Handling', duration: 35 },
          { title: 'Deploy to VPS', duration: 45 },
        ]},
      ];

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        const sectionResult = await client.query(`
          INSERT INTO course_sections (id, course_id, title, order_index)
          VALUES (gen_random_uuid(), $1, $2, $3)
          RETURNING id
        `, [courseId, section.title, sIdx + 1]);
        
        const sectionId = sectionResult.rows[0].id;
        for (let lIdx = 0; lIdx < section.lessons.length; lIdx++) {
          const lesson = section.lessons[lIdx];
          await client.query(`
            INSERT INTO lessons (id, section_id, title, content_type, duration_minutes, is_free_preview, order_index)
            VALUES (gen_random_uuid(), $1, $2, 'video', $3, $4, $5)
          `, [sectionId, lesson.title, lesson.duration, lIdx === 0 && sIdx === 0, lIdx + 1]);
        }
      }
      console.log('   ✅ Created 4 sections with 8 lessons');

      // Create quiz
      const quizResult = await client.query(`
        INSERT INTO course_quizzes (id, course_id, title, quiz_type, passing_score, max_attempts)
        VALUES (gen_random_uuid(), $1, 'MCP Fundamentals Quiz', 'graded', 70, 3)
        RETURNING id
      `, [courseId]);
      
      const quizId = quizResult.rows[0].id;
      const questions = [
        { text: 'MCP stands for?', options: ['Model Context Protocol', 'Machine Control Process', 'Multi-Channel Platform', 'Module Connection Point'], correct: 0 },
        { text: 'MCP servers communicate using?', options: ['HTTP REST', 'GraphQL', 'stdio (Standard I/O)', 'WebSockets'], correct: 2 },
        { text: 'Which company created MCP?', options: ['OpenAI', 'Google', 'Anthropic', 'Microsoft'], correct: 2 },
      ];

      for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const q = questions[qIdx];
        const questionResult = await client.query(`
          INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index)
          VALUES (gen_random_uuid(), $1, $2, 'multiple_choice', 33, $3)
          RETURNING id
        `, [quizId, q.text, qIdx + 1]);

        const questionId = questionResult.rows[0].id;
        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          await client.query(`
            INSERT INTO quiz_question_options (id, question_id, option_text, is_correct, order_index)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
          `, [questionId, q.options[oIdx], oIdx === q.correct, oIdx + 1]);
        }
      }
      console.log('   ✅ Created quiz with 3 questions');
    } else {
      console.log('   ✅ Course already exists');
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_xp_log_user ON user_xp_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_cache(period, period_start)',
      'CREATE INDEX IF NOT EXISTS idx_learning_streaks_user_date ON learning_streaks(user_id, streak_date)',
      'CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, scheduled_for)',
    ];
    for (const idx of indexes) {
      await client.query(idx);
    }
    console.log('   ✅ Created indexes');

    // Final counts
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
        (SELECT COUNT(*) FROM xp_actions) as xp_actions,
        (SELECT COUNT(*) FROM badges) as badges,
        (SELECT COUNT(*) FROM subscription_plans) as plans,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM lessons) as lessons
    `);

    console.log('\n🎉 DATABASE UPGRADE COMPLETE!\n');
    const c = counts.rows[0];
    console.log(`📊 Summary:`);
    console.log(`   - Total Tables: ${c.total_tables}`);
    console.log(`   - XP Actions: ${c.xp_actions}`);
    console.log(`   - Badges: ${c.badges}`);
    console.log(`   - Plans: ${c.plans}`);
    console.log(`   - Courses: ${c.courses}`);
    console.log(`   - Lessons: ${c.lessons}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAndContinue();
