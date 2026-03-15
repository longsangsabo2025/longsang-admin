import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
});

async function createCourse() {
  const client = await pool.connect();
  
  try {
    console.log('📚 Creating course content...\n');

    // Check existing instructor
    let instructorId;
    const existing = await client.query('SELECT id FROM instructors LIMIT 1');
    
    if (existing.rows[0]) {
      instructorId = existing.rows[0].id;
      console.log('✅ Using existing instructor');
    } else {
      // Make user_id nullable
      await client.query('ALTER TABLE instructors ALTER COLUMN user_id DROP NOT NULL').catch(() => {});
      
      const result = await client.query(`
        INSERT INTO instructors (name, title, bio, total_students, total_courses, average_rating)
        VALUES ('Long Sang', 'AI Engineer & Automation Expert', 'Founder AINewbieVN. 5+ năm kinh nghiệm.', 12500, 6, 4.9)
        RETURNING id
      `);
      instructorId = result.rows[0].id;
      console.log('✅ Created instructor');
    }

    // Check if course exists
    const existingCourse = await client.query(`SELECT id FROM courses WHERE title LIKE '%MCP%' LIMIT 1`);
    
    if (existingCourse.rows[0]) {
      console.log('✅ Course already exists');
    } else {
      // Create course
      const courseResult = await client.query(`
        INSERT INTO courses (
          title, subtitle, description, instructor_id, category, level,
          duration_hours, total_lessons, language, price, original_price,
          is_free, is_published, tags, what_you_learn, requirements, features,
          total_students, average_rating, total_reviews, thumbnail_url
        ) VALUES (
          'AI Agent Fundamentals với MCP',
          'Xây dựng AI Agents thực tế từ zero đến production',
          'Khóa học toàn diện về xây dựng AI Agents sử dụng Model Context Protocol (MCP). Bạn sẽ học cách tạo AI agents có khả năng tương tác với files, databases, APIs.',
          $1,
          'AI Agents',
          'Intermediate',
          8, 8, 'Tiếng Việt',
          1990000, 2990000, false, true,
          ARRAY['MCP', 'AI Agents', 'TypeScript', 'Claude'],
          ARRAY['Hiểu sâu về AI Agents', 'Xây dựng MCP server', 'Deploy lên production'],
          ARRAY['TypeScript cơ bản', 'Node.js'],
          ARRAY['8 video lessons', 'Source code', 'Certificate'],
          0, 0, 0,
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80'
        )
        RETURNING id
      `, [instructorId]);
      
      const courseId = courseResult.rows[0].id;
      console.log('✅ Created course:', courseId);

      // Create sections and lessons
      const sections = [
        { title: 'Phần 1: Giới thiệu AI Agents', description: 'Tổng quan về AI Agents và MCP', lessons: [
          { title: 'AI Agents là gì? Tại sao quan trọng?', duration: 25, desc: 'Tổng quan về AI Agents' },
          { title: 'MCP - Model Context Protocol Explained', duration: 35, desc: 'Deep dive vào MCP' },
        ]},
        { title: 'Phần 2: Setup Development Environment', description: 'Cài đặt môi trường', lessons: [
          { title: 'Cài đặt Node.js, TypeScript và MCP SDK', duration: 20, desc: 'Setup environment' },
          { title: 'Tạo MCP Server đầu tiên', duration: 40, desc: 'Hello World MCP' },
        ]},
        { title: 'Phần 3: Building Custom Tools', description: 'Xây dựng tools', lessons: [
          { title: 'File System Tools', duration: 45, desc: 'Tools để làm việc với files' },
          { title: 'Database & API Integration', duration: 50, desc: 'Kết nối DB và APIs' },
        ]},
        { title: 'Phần 4: Production & Best Practices', description: 'Deploy production', lessons: [
          { title: 'Error Handling & Logging', duration: 35, desc: 'Error handling best practices' },
          { title: 'Deploy to Production', duration: 45, desc: 'Deploy MCP server' },
        ]},
      ];

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        const sectionResult = await client.query(`
          INSERT INTO course_sections (course_id, title, description, order_index)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [courseId, section.title, section.description, sIdx + 1]);
        
        const sectionId = sectionResult.rows[0].id;

        for (let lIdx = 0; lIdx < section.lessons.length; lIdx++) {
          const lesson = section.lessons[lIdx];
          await client.query(`
            INSERT INTO lessons (section_id, title, description, content_type, duration_minutes, is_free_preview, order_index, video_url)
            VALUES ($1, $2, $3, 'video', $4, $5, $6, 'https://www.youtube.com/watch?v=placeholder')
          `, [sectionId, lesson.title, lesson.desc, lesson.duration, lIdx === 0 && sIdx === 0, lIdx + 1]);
        }
      }
      console.log('✅ Created 4 sections with 8 lessons');

      // Create quiz
      const quizResult = await client.query(`
        INSERT INTO course_quizzes (course_id, title, description, quiz_type, passing_score, max_attempts)
        VALUES ($1, 'MCP Fundamentals Quiz', 'Kiểm tra kiến thức về MCP', 'graded', 70, 3)
        RETURNING id
      `, [courseId]);
      
      const quizId = quizResult.rows[0].id;

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
          INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index)
          VALUES ($1, $2, 'multiple_choice', 20, $3)
          RETURNING id
        `, [quizId, q.text, qIdx + 1]);

        const questionId = questionResult.rows[0].id;

        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          await client.query(`
            INSERT INTO quiz_question_options (question_id, option_text, is_correct, order_index)
            VALUES ($1, $2, $3, $4)
          `, [questionId, q.options[oIdx], oIdx === q.correct, oIdx + 1]);
        }
      }
      console.log('✅ Created quiz with 5 questions');
    }

    // Summary
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM lessons) as lessons,
        (SELECT COUNT(*) FROM course_quizzes) as quizzes,
        (SELECT COUNT(*) FROM quiz_questions) as questions,
        (SELECT COUNT(*) FROM xp_actions) as xp_actions,
        (SELECT COUNT(*) FROM badges) as badges,
        (SELECT COUNT(*) FROM subscription_plans) as plans
    `);

    console.log('\n📊 Database Summary:');
    const c = counts.rows[0];
    console.log('   Courses:', c.courses);
    console.log('   Lessons:', c.lessons);
    console.log('   Quizzes:', c.quizzes);
    console.log('   Questions:', c.questions);
    console.log('   XP Actions:', c.xp_actions);
    console.log('   Badges:', c.badges);
    console.log('   Subscription Plans:', c.plans);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createCourse();
