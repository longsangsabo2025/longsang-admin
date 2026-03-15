/**
 * Check Database Connection & Tables
 * Using Supabase Transaction Pooler
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    console.log('========================');
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Connection Error:', testError.message);
      console.log('\n⚠️  Database tables do not exist yet!');
      console.log('You need to run migrations first.\n');
      return false;
    }

    console.log('✅ Connection successful!\n');

    // Test 2: Check if courses table exists
    console.log('Test 2: Checking Tables');
    console.log('========================');

    const tables = [
      'courses',
      'course_syllabus',
      'course_sections',
      'lessons',
      'course_enrollments',
      'lesson_progress',
      'course_assignments',
      'assignment_submissions',
      'course_quizzes',
      'quiz_questions',
      'quiz_question_options',
      'quiz_attempts',
      'learning_analytics',
      'course_certificates',
      'course_reviews',
      'discussion_topics',
      'discussion_replies',
      'qa_questions',
      'qa_answers',
      'course_announcements',
    ];

    let existingTables = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (!error) {
          console.log(`✅ ${table}`);
          existingTables++;
        } else {
          console.log(`❌ ${table}`);
        }
      } catch {
        console.log(`❌ ${table}`);
      }
    }

    console.log(`\n📊 Result: ${existingTables}/${tables.length} tables exist\n`);

    if (existingTables === 0) {
      console.log('⚠️  No Academy tables found!');
      console.log('You need to run migrations first.\n');
      console.log('📝 Steps to fix:');
      console.log('1. Open: https://app.supabase.com/project/diexsbzqwsbpilsymnfb');
      console.log('2. SQL Editor → New Query');
      console.log('3. Copy content from: supabase/migrations/20250101_academy_complete_system.sql');
      console.log('4. Paste and Run');
      console.log('5. Then run: node scripts/quick-seed.mjs\n');
      return false;
    }

    if (existingTables === tables.length) {
      console.log('✅ All Academy tables exist!');
      console.log('✅ Database is ready for seeding!\n');

      // Test 3: Check existing courses
      console.log('Test 3: Checking Existing Courses');
      console.log('==================================');

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('count');

      if (!coursesError && courses) {
        const courseCount = courses[0]?.count || 0;
        console.log(`📚 Existing courses: ${courseCount}\n`);

        if (courseCount === 0) {
          console.log('✅ Database is empty and ready for seeding!');
          console.log('Run: node scripts/quick-seed.mjs\n');
        } else {
          console.log(`⚠️  Database already has ${courseCount} courses`);
          console.log('You can still seed more courses.\n');
        }
      }

      return true;
    }

    console.log('⚠️  Some tables are missing!');
    console.log('You may need to run migrations again.\n');
    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Connection failed!');
    console.log('Check your Supabase credentials.\n');
    return false;
  }
}

// Run check
const isReady = await checkDatabase();

if (isReady) {
  console.log('🎉 Database is ready!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: node scripts/quick-seed.mjs');
  console.log('2. Then: npm run dev');
  console.log('3. Visit: http://localhost:5173/academy/browse\n');
  process.exit(0);
} else {
  console.log('❌ Database is not ready!');
  console.log('Please fix the issues above.\n');
  process.exit(1);
}
