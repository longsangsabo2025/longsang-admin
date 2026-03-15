import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
});

async function upgradeAcademy() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 ELON MUSK ACADEMY UPGRADE - COMPLETE OVERHAUL\n');
    console.log('=' .repeat(60) + '\n');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: MISSING CORE TABLES
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 PHASE 1: Core Tables...\n');

    // 1. Video Transcripts (for search/accessibility)
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_transcripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        language TEXT DEFAULT 'vi',
        transcript_text TEXT NOT NULL,
        timestamps JSONB DEFAULT '[]',
        auto_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lesson_id, language)
      )
    `);
    console.log('   ✅ video_transcripts');

    // 2. User Bookmarks/Notes
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        timestamp_seconds INTEGER,
        note TEXT,
        bookmark_type TEXT DEFAULT 'bookmark',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ user_bookmarks');

    // 3. Coupon Codes
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT DEFAULT 'percentage',
        discount_value DECIMAL(10,2) NOT NULL,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        min_purchase_amount DECIMAL(10,2) DEFAULT 0,
        applicable_courses UUID[] DEFAULT '{}',
        valid_from TIMESTAMP DEFAULT NOW(),
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ coupon_codes');

    // 4. Coupon Usage Tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coupon_id UUID NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        order_id UUID,
        discount_applied DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ coupon_usage');

    // 5. Subscription Plans
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
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
    console.log('   ✅ subscription_plans');

    // 6. User Subscriptions
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
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
    console.log('   ✅ user_subscriptions');

    // 7. Payment Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        order_type TEXT DEFAULT 'course',
        course_id UUID REFERENCES courses(id),
        subscription_id UUID REFERENCES user_subscriptions(id),
        amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        final_amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'VND',
        payment_method TEXT,
        payment_provider TEXT,
        payment_status TEXT DEFAULT 'pending',
        payment_reference TEXT,
        coupon_code TEXT,
        metadata JSONB DEFAULT '{}',
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ payment_orders');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: GAMIFICATION SYSTEM
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🎮 PHASE 2: Gamification System...\n');

    // 8. XP Actions Definition
    await client.query(`
      CREATE TABLE IF NOT EXISTS xp_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action_key TEXT UNIQUE NOT NULL,
        action_name TEXT NOT NULL,
        xp_amount INTEGER NOT NULL,
        description TEXT,
        icon TEXT,
        max_daily INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ xp_actions');

    // 9. User XP Log
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_xp_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        action_id UUID NOT NULL REFERENCES xp_actions(id),
        xp_earned INTEGER NOT NULL,
        related_id UUID,
        related_type TEXT,
        earned_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ user_xp_log');

    // 10. User XP Summary
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_xp_summary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL,
        total_xp INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        xp_to_next_level INTEGER DEFAULT 100,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ user_xp_summary');

    // 11. Badges Definition
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        badge_key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT,
        rarity TEXT DEFAULT 'common',
        requirement_type TEXT NOT NULL,
        requirement_value JSONB NOT NULL,
        xp_reward INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ badges');

    // 12. User Badges
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        badge_id UUID NOT NULL REFERENCES badges(id),
        earned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, badge_id)
      )
    `);
    console.log('   ✅ user_badges');

    // 13. Leaderboard Cache
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        period TEXT NOT NULL,
        period_start DATE NOT NULL,
        total_xp INTEGER DEFAULT 0,
        rank INTEGER,
        courses_completed INTEGER DEFAULT 0,
        lessons_completed INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, period, period_start)
      )
    `);
    console.log('   ✅ leaderboard_cache');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: INSTRUCTOR & PAYOUT SYSTEM
    // ═══════════════════════════════════════════════════════════════
    console.log('\n💰 PHASE 3: Instructor Payouts...\n');

    // 14. Instructor Earnings
    await client.query(`
      CREATE TABLE IF NOT EXISTS instructor_earnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instructor_id UUID NOT NULL REFERENCES instructors(id),
        course_id UUID NOT NULL REFERENCES courses(id),
        order_id UUID NOT NULL REFERENCES payment_orders(id),
        gross_amount DECIMAL(10,2) NOT NULL,
        platform_fee DECIMAL(10,2) NOT NULL,
        net_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        earned_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ instructor_earnings');

    // 15. Instructor Payouts
    await client.query(`
      CREATE TABLE IF NOT EXISTS instructor_payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instructor_id UUID NOT NULL REFERENCES instructors(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_method TEXT NOT NULL,
        payment_details JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending',
        processed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ instructor_payouts');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: LEARNING ENGAGEMENT
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📚 PHASE 4: Learning Engagement...\n');

    // 16. Learning Streaks
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_streaks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        streak_date DATE NOT NULL,
        minutes_learned INTEGER DEFAULT 0,
        lessons_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, streak_date)
      )
    `);
    console.log('   ✅ learning_streaks');

    // 17. Course Waitlist
    await client.query(`
      CREATE TABLE IF NOT EXISTS course_waitlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        notified BOOLEAN DEFAULT FALSE,
        notified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);
    console.log('   ✅ course_waitlist');

    // 18. Email Notifications Queue
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        notification_type TEXT NOT NULL,
        channel TEXT DEFAULT 'email',
        subject TEXT,
        content TEXT,
        metadata JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending',
        scheduled_for TIMESTAMP DEFAULT NOW(),
        sent_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ notification_queue');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: SEED DEFAULT DATA
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🌱 PHASE 5: Seeding Default Data...\n');

    // XP Actions
    await client.query(`
      INSERT INTO xp_actions (action_key, action_name, xp_amount, description, icon, max_daily) VALUES
        ('lesson_complete', 'Complete Lesson', 10, 'Hoàn thành 1 bài học', '📚', NULL),
        ('quiz_pass', 'Pass Quiz', 25, 'Đậu quiz (>70%)', '✅', NULL),
        ('quiz_perfect', 'Perfect Quiz', 50, 'Quiz 100% đúng', '🏆', NULL),
        ('course_complete', 'Complete Course', 200, 'Hoàn thành khóa học', '🎓', NULL),
        ('streak_3', '3-Day Streak', 15, 'Học 3 ngày liên tiếp', '🔥', 1),
        ('streak_7', 'Weekly Warrior', 50, 'Học 7 ngày liên tiếp', '⚡', 1),
        ('streak_30', 'Monthly Master', 200, 'Học 30 ngày liên tiếp', '👑', 1),
        ('first_review', 'First Review', 20, 'Đánh giá khóa học đầu tiên', '⭐', 1),
        ('first_discussion', 'Start Discussion', 15, 'Tạo thảo luận đầu tiên', '💬', 3),
        ('helpful_reply', 'Helpful Reply', 10, 'Reply được upvote', '👍', 5),
        ('daily_login', 'Daily Login', 5, 'Đăng nhập hàng ngày', '📅', 1)
      ON CONFLICT (action_key) DO NOTHING
    `);
    console.log('   ✅ Seeded XP actions (11 actions)');

    // Badges
    await client.query(`
      INSERT INTO badges (badge_key, name, description, rarity, requirement_type, requirement_value, xp_reward) VALUES
        ('first_lesson', 'First Step', 'Hoàn thành bài học đầu tiên', 'common', 'lessons_completed', '{"min": 1}', 10),
        ('course_graduate', 'Graduate', 'Hoàn thành khóa học đầu tiên', 'uncommon', 'courses_completed', '{"min": 1}', 50),
        ('quick_learner', 'Quick Learner', 'Hoàn thành 10 bài học', 'common', 'lessons_completed', '{"min": 10}', 25),
        ('dedicated', 'Dedicated', 'Học 50 bài', 'uncommon', 'lessons_completed', '{"min": 50}', 100),
        ('master_student', 'Master Student', 'Học 100 bài', 'rare', 'lessons_completed', '{"min": 100}', 200),
        ('quiz_ace', 'Quiz Ace', 'Đạt 100% 5 quiz', 'uncommon', 'perfect_quizzes', '{"min": 5}', 75),
        ('streak_warrior', 'Streak Warrior', 'Duy trì streak 7 ngày', 'uncommon', 'streak_days', '{"min": 7}', 50),
        ('streak_legend', 'Streak Legend', 'Duy trì streak 30 ngày', 'epic', 'streak_days', '{"min": 30}', 200),
        ('reviewer', 'Course Critic', 'Đánh giá 5 khóa học', 'common', 'reviews_given', '{"min": 5}', 30),
        ('helper', 'Community Helper', 'Trả lời 10 câu hỏi', 'uncommon', 'helpful_replies', '{"min": 10}', 50),
        ('early_bird', 'Early Bird', 'Đăng ký từ những ngày đầu', 'legendary', 'registration_date', '{"before": "2026-01-01"}', 100),
        ('certified', 'Certified Pro', 'Nhận certificate đầu tiên', 'rare', 'certificates', '{"min": 1}', 100)
      ON CONFLICT (badge_key) DO NOTHING
    `);
    console.log('   ✅ Seeded badges (12 badges)');

    // Subscription Plans
    await client.query(`
      INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_courses, sort_order) VALUES
        ('Free', 'Truy cập khóa học miễn phí', 0, 0, '["Khóa học miễn phí", "Community access", "Chứng chỉ cơ bản"]', 3, 1),
        ('Pro', 'Truy cập tất cả khóa học', 299000, 2990000, '["Tất cả khóa học", "Priority support", "Certificates", "Download videos", "1-on-1 mentoring monthly"]', NULL, 2),
        ('Team', 'Cho nhóm và doanh nghiệp', 799000, 7990000, '["Tất cả Pro features", "Team analytics", "Custom learning paths", "API access", "Dedicated support"]', NULL, 3)
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✅ Seeded subscription plans (3 plans)');

    // Sample Coupon
    await client.query(`
      INSERT INTO coupon_codes (code, discount_type, discount_value, max_uses, valid_until, is_active) VALUES
        ('WELCOME50', 'percentage', 50, 100, '2025-12-31 23:59:59', true),
        ('NEWYEAR2026', 'percentage', 30, 500, '2026-01-31 23:59:59', true),
        ('LAUNCH100K', 'fixed', 100000, 50, '2025-12-31 23:59:59', true)
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✅ Seeded coupon codes (3 coupons)');

    // ═══════════════════════════════════════════════════════════════
    // PHASE 6: CREATE REAL COURSE WITH LESSONS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🎬 PHASE 6: Creating Real Course...\n');

    // Create instructor first
    const instructorResult = await client.query(`
      INSERT INTO instructors (id, user_id, name, title, bio, avatar_url, total_students, total_courses, average_rating)
      VALUES (
        gen_random_uuid(),
        gen_random_uuid(),
        'Long Sang',
        'AI Engineer & Automation Expert',
        'Founder AINewbieVN. 5+ năm kinh nghiệm xây dựng AI systems và automation workflows. Đã đào tạo 10,000+ học viên về AI và Machine Learning.',
        'https://avatars.githubusercontent.com/u/longsang',
        12500,
        6,
        4.9
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    const instructorId = instructorResult.rows[0]?.id || (await client.query(`SELECT id FROM instructors LIMIT 1`)).rows[0]?.id;
    console.log('   ✅ Created instructor');

    // Create the main course
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
        'Khóa học toàn diện về xây dựng AI Agents sử dụng Model Context Protocol (MCP). Bạn sẽ học cách tạo AI agents có khả năng tương tác với files, databases, APIs và hơn thế nữa. Khóa học bao gồm 8 video lessons chi tiết, quizzes, và 1 project thực tế.',
        $1,
        'AI Agents',
        'Intermediate',
        8,
        8,
        'Tiếng Việt',
        1990000,
        2990000,
        false,
        true,
        ARRAY['MCP', 'AI Agents', 'TypeScript', 'Claude', 'Automation'],
        ARRAY[
          'Hiểu sâu về AI Agents và cách chúng hoạt động',
          'Xây dựng MCP server với 10+ custom tools',
          'Tích hợp AI agents với VS Code và Claude Desktop',
          'Deploy AI agents lên production (VPS/Cloud)',
          'Handle errors, logging, và monitoring',
          'Best practices cho AI safety và security'
        ],
        ARRAY[
          'TypeScript/JavaScript cơ bản',
          'Hiểu biết về REST APIs',
          'Node.js đã cài đặt',
          'VS Code với Copilot (khuyến khích)'
        ],
        ARRAY[
          '8 video lessons (8+ giờ)',
          'Source code đầy đủ',
          'Quizzes sau mỗi section',
          '1 Real-world project',
          'Certificate khi hoàn thành',
          'Lifetime access',
          'Community Discord'
        ],
        0,
        0,
        0,
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [instructorId]);
    
    const courseId = courseResult.rows[0]?.id;
    if (!courseId) {
      console.log('   ⚠️ Course already exists, fetching...');
      const existing = await client.query(`SELECT id FROM courses WHERE title LIKE '%MCP%' LIMIT 1`);
      if (existing.rows[0]) {
        console.log('   ✅ Using existing course');
      }
    } else {
      console.log('   ✅ Created course: AI Agent Fundamentals với MCP');

      // Create sections and lessons
      const sections = [
        {
          title: 'Phần 1: Giới thiệu AI Agents',
          description: 'Hiểu về AI Agents, use cases, và tại sao MCP là game-changer',
          lessons: [
            { title: 'AI Agents là gì? Tại sao quan trọng?', duration: 25, description: 'Tổng quan về AI Agents, sự khác biệt với chatbots, và các use cases thực tế.' },
            { title: 'MCP - Model Context Protocol Explained', duration: 35, description: 'Deep dive vào MCP architecture, cách hoạt động, và tại sao Claude sử dụng nó.' },
          ]
        },
        {
          title: 'Phần 2: Setup Development Environment',
          description: 'Cài đặt môi trường phát triển MCP hoàn chỉnh',
          lessons: [
            { title: 'Cài đặt Node.js, TypeScript và MCP SDK', duration: 20, description: 'Step-by-step setup environment với tất cả dependencies cần thiết.' },
            { title: 'Tạo MCP Server đầu tiên', duration: 40, description: 'Viết và chạy MCP server đầu tiên với basic tools.' },
          ]
        },
        {
          title: 'Phần 3: Building Custom Tools',
          description: 'Xây dựng các tools mạnh mẽ cho AI agents',
          lessons: [
            { title: 'File System Tools', duration: 45, description: 'Tạo tools để đọc, ghi, search files trong workspace.' },
            { title: 'Database & API Integration', duration: 50, description: 'Kết nối AI agents với databases và external APIs.' },
          ]
        },
        {
          title: 'Phần 4: Production & Best Practices',
          description: 'Deploy và maintain AI agents trong production',
          lessons: [
            { title: 'Error Handling & Logging', duration: 35, description: 'Implement proper error handling, logging, và monitoring.' },
            { title: 'Deploy to Production', duration: 45, description: 'Deploy MCP server lên VPS, setup systemd, và monitoring.' },
          ]
        }
      ];

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        const sectionResult = await client.query(`
          INSERT INTO course_sections (id, course_id, title, description, order_index)
          VALUES (gen_random_uuid(), $1, $2, $3, $4)
          RETURNING id
        `, [courseId, section.title, section.description, sIdx + 1]);
        
        const sectionId = sectionResult.rows[0].id;

        for (let lIdx = 0; lIdx < section.lessons.length; lIdx++) {
          const lesson = section.lessons[lIdx];
          await client.query(`
            INSERT INTO lessons (id, section_id, title, description, content_type, duration_minutes, is_free_preview, order_index, video_url)
            VALUES (gen_random_uuid(), $1, $2, $3, 'video', $4, $5, $6, $7)
          `, [
            sectionId,
            lesson.title,
            lesson.description,
            lesson.duration,
            lIdx === 0 && sIdx === 0, // First lesson is free preview
            lIdx + 1,
            `https://www.youtube.com/watch?v=dQw4w9WgXcQ` // Placeholder video
          ]);
        }
      }
      console.log('   ✅ Created 4 sections with 8 lessons');

      // Create quiz for the course
      const quizResult = await client.query(`
        INSERT INTO course_quizzes (id, course_id, title, description, quiz_type, passing_score, max_attempts)
        VALUES (gen_random_uuid(), $1, 'MCP Fundamentals Quiz', 'Kiểm tra kiến thức về MCP và AI Agents', 'graded', 70, 3)
        RETURNING id
      `, [courseId]);
      
      const quizId = quizResult.rows[0].id;

      // Add quiz questions
      const questions = [
        { text: 'MCP stands for?', options: ['Model Context Protocol', 'Machine Control Process', 'Multi-Channel Platform', 'Module Connection Point'], correct: 0 },
        { text: 'MCP servers communicate using?', options: ['HTTP REST', 'GraphQL', 'stdio (Standard I/O)', 'WebSockets'], correct: 2 },
        { text: 'Which company created MCP?', options: ['OpenAI', 'Google', 'Anthropic', 'Microsoft'], correct: 2 },
        { text: 'AI Agents khác Chatbots ở điểm nào?', options: ['Có thể thực hiện actions', 'Trả lời nhanh hơn', 'Dùng nhiều GPU hơn', 'Không cần internet'], correct: 0 },
        { text: 'Tools trong MCP dùng để làm gì?', options: ['Tăng tốc độ', 'Cho AI thực hiện actions cụ thể', 'Lưu trữ data', 'Debug code'], correct: 1 },
      ];

      for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const q = questions[qIdx];
        const questionResult = await client.query(`
          INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index)
          VALUES (gen_random_uuid(), $1, $2, 'multiple_choice', 20, $3)
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
      console.log('   ✅ Created quiz with 5 questions');
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 7: CREATE INDEXES FOR PERFORMANCE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n⚡ PHASE 7: Creating Indexes...\n');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_xp_log_user ON user_xp_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_xp_log_earned ON user_xp_log(earned_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_cache(period, period_start)',
      'CREATE INDEX IF NOT EXISTS idx_learning_streaks_user_date ON learning_streaks(user_id, streak_date)',
      'CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(payment_status)',
      'CREATE INDEX IF NOT EXISTS idx_video_transcripts_lesson ON video_transcripts(lesson_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON user_bookmarks(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, scheduled_for)',
    ];

    for (const idx of indexes) {
      await client.query(idx);
    }
    console.log('   ✅ Created 10 performance indexes');

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 ACADEMY UPGRADE COMPLETE!\n');

    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
        (SELECT COUNT(*) FROM xp_actions) as xp_actions,
        (SELECT COUNT(*) FROM badges) as badges,
        (SELECT COUNT(*) FROM subscription_plans) as plans,
        (SELECT COUNT(*) FROM coupon_codes) as coupons,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM lessons) as lessons,
        (SELECT COUNT(*) FROM course_quizzes) as quizzes
    `);

    const c = counts.rows[0];
    console.log(`📊 Database Summary:`);
    console.log(`   - Total Tables: ${c.total_tables}`);
    console.log(`   - XP Actions: ${c.xp_actions}`);
    console.log(`   - Badges: ${c.badges}`);
    console.log(`   - Subscription Plans: ${c.plans}`);
    console.log(`   - Coupons: ${c.coupons}`);
    console.log(`   - Courses: ${c.courses}`);
    console.log(`   - Lessons: ${c.lessons}`);
    console.log(`   - Quizzes: ${c.quizzes}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

upgradeAcademy();
