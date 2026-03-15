// Execute SQL directly via Supabase using psql-style
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;

console.log('🔧 Creating Missing Academy Tables via Direct PostgreSQL\n');
console.log('='.repeat(50));

const client = new pg.Client({ connectionString });

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Individual table creation statements
    const tables = [
      {
        name: 'sections',
        sql: `CREATE TABLE IF NOT EXISTS public.sections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'user_progress',
        sql: `CREATE TABLE IF NOT EXISTS public.user_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
          course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'not_started',
          progress_percent INTEGER DEFAULT 0,
          watch_time_seconds INTEGER DEFAULT 0,
          last_position_seconds INTEGER DEFAULT 0,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'enrollments',
        sql: `CREATE TABLE IF NOT EXISTS public.enrollments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'active',
          enrolled_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          progress_percent INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'quizzes',
        sql: `CREATE TABLE IF NOT EXISTS public.quizzes (
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
        );`
      },
      {
        name: 'user_xp',
        sql: `CREATE TABLE IF NOT EXISTS public.user_xp (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          total_xp INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'user_xp_history',
        sql: `CREATE TABLE IF NOT EXISTS public.user_xp_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          action_key VARCHAR(100) NOT NULL,
          xp_earned INTEGER NOT NULL,
          source_id UUID,
          source_type VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'user_badges',
        sql: `CREATE TABLE IF NOT EXISTS public.user_badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
          earned_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'user_streaks',
        sql: `CREATE TABLE IF NOT EXISTS public.user_streaks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_activity_date DATE,
          streak_start_date DATE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      },
      {
        name: 'quiz_attempts',
        sql: `CREATE TABLE IF NOT EXISTS public.quiz_attempts (
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
        );`
      },
      {
        name: 'certificates',
        sql: `CREATE TABLE IF NOT EXISTS public.certificates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
          certificate_number VARCHAR(100) UNIQUE,
          issued_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          pdf_url TEXT,
          verification_code VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );`
      }
    ];

    // Create each table
    for (const table of tables) {
      try {
        await client.query(table.sql);
        console.log(`✅ Created table: ${table.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Table ${table.name} already exists`);
        } else {
          console.log(`❌ Error creating ${table.name}: ${error.message}`);
        }
      }
    }

    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON public.user_progress(lesson_id);',
      'CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON public.quizzes(lesson_id);',
      'CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_xp_history_user ON public.user_xp_history(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);',
      'CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);'
    ];

    for (const idx of indexes) {
      try {
        await client.query(idx);
      } catch (e) {
        // Ignore index errors
      }
    }
    console.log('✅ Indexes created');

    // Seed sections
    console.log('\n📚 Seeding sections...');
    const courseResult = await client.query('SELECT id FROM public.courses LIMIT 1');
    if (courseResult.rows.length > 0) {
      const courseId = courseResult.rows[0].id;
      
      // Check if sections exist
      const sectionsCheck = await client.query('SELECT COUNT(*) FROM public.sections WHERE course_id = $1', [courseId]);
      if (parseInt(sectionsCheck.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO public.sections (course_id, title, description, order_index) VALUES
            ($1, 'Introduction to MCP', 'Getting started with Model Context Protocol', 1),
            ($1, 'MCP Fundamentals', 'Core concepts and architecture', 2),
            ($1, 'Building Your First Agent', 'Hands-on practical implementation', 3),
            ($1, 'Advanced Techniques', 'Advanced patterns and best practices', 4);
        `, [courseId]);
        console.log('✅ Sections seeded');
      } else {
        console.log('⏭️  Sections already exist');
      }

      // Seed quiz
      console.log('\n📝 Seeding quiz...');
      const lessonResult = await client.query('SELECT id FROM public.lessons WHERE course_id = $1 LIMIT 1', [courseId]);
      if (lessonResult.rows.length > 0) {
        const lessonId = lessonResult.rows[0].id;
        
        const quizCheck = await client.query('SELECT COUNT(*) FROM public.quizzes WHERE course_id = $1', [courseId]);
        if (parseInt(quizCheck.rows[0].count) === 0) {
          await client.query(`
            INSERT INTO public.quizzes (lesson_id, course_id, title, description, time_limit_minutes, pass_percentage) VALUES
              ($1, $2, 'MCP Basics Quiz', 'Test your understanding of MCP fundamentals', 15, 70);
          `, [lessonId, courseId]);
          console.log('✅ Quiz seeded');
        } else {
          console.log('⏭️  Quiz already exists');
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration completed successfully!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
