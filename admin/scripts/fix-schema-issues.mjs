// Fix remaining schema issues
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function fixSchema() {
  console.log('🔧 Fixing remaining schema issues...\n');
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // 1. Add course_id to lessons if missing
    console.log('📝 Checking lessons.course_id...');
    try {
      await client.query(`
        ALTER TABLE public.lessons 
        ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
      `);
      console.log('✅ lessons.course_id column ready');
      
      // Update existing lessons to link to course
      const { rows: courses } = await client.query('SELECT id FROM public.courses LIMIT 1');
      if (courses.length > 0) {
        await client.query('UPDATE public.lessons SET course_id = $1 WHERE course_id IS NULL', [courses[0].id]);
        console.log('   → Updated existing lessons with course_id');
      }
    } catch (e) {
      console.log('   ⚠️ ' + e.message);
    }

    // 2. Add unlock_condition to badges if missing
    console.log('\n📝 Checking badges.unlock_condition...');
    try {
      await client.query(`
        ALTER TABLE public.badges 
        ADD COLUMN IF NOT EXISTS unlock_condition JSONB;
      `);
      console.log('✅ badges.unlock_condition column ready');
      
      // Add unlock conditions to existing badges
      const conditions = [
        { name: 'First Step', condition: { type: 'lessons_completed', count: 1 } },
        { name: 'Graduate', condition: { type: 'courses_completed', count: 1 } },
        { name: 'Quick Learner', condition: { type: 'lessons_in_day', count: 5 } },
        { name: 'Dedicated', condition: { type: 'streak', count: 7 } },
        { name: 'Master Student', condition: { type: 'courses_completed', count: 5 } },
        { name: 'Quiz Ace', condition: { type: 'quiz_perfect_score', count: 1 } },
        { name: 'Perfect Score', condition: { type: 'quiz_perfect_score', count: 5 } },
        { name: 'Social Learner', condition: { type: 'discussions', count: 10 } },
        { name: 'Helpful', condition: { type: 'helpful_replies', count: 5 } },
        { name: 'Early Adopter', condition: { type: 'signup_date', before: '2025-03-01' } },
        { name: 'Streak Master', condition: { type: 'streak', count: 30 } },
        { name: 'XP Champion', condition: { type: 'total_xp', count: 10000 } }
      ];
      
      for (const { name, condition } of conditions) {
        await client.query(
          'UPDATE public.badges SET unlock_condition = $1 WHERE name = $2',
          [JSON.stringify(condition), name]
        );
      }
      console.log('   → Updated badge unlock conditions');
    } catch (e) {
      console.log('   ⚠️ ' + e.message);
    }

    // 3. Add unique constraint to enrollments
    console.log('\n📝 Adding unique constraint to enrollments...');
    try {
      // First check if constraint exists
      const { rows } = await client.query(`
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'enrollments' AND constraint_type = 'UNIQUE'
      `);
      
      if (rows.length === 0) {
        await client.query(`
          ALTER TABLE public.enrollments 
          ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);
        `);
        console.log('✅ Unique constraint added to enrollments');
      } else {
        console.log('✅ Unique constraint already exists');
      }
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✅ Unique constraint already exists');
      } else {
        console.log('   ⚠️ ' + e.message);
      }
    }

    // 4. Add unique constraint to user_badges if missing
    console.log('\n📝 Checking user_badges unique constraint...');
    try {
      const { rows } = await client.query(`
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'user_badges' AND constraint_type = 'UNIQUE'
      `);
      
      if (rows.length === 0) {
        await client.query(`
          ALTER TABLE public.user_badges 
          ADD CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id);
        `);
        console.log('✅ Unique constraint added to user_badges');
      } else {
        console.log('✅ Unique constraint already exists');
      }
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('✅ Unique constraint already exists');
      } else {
        console.log('   ⚠️ ' + e.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Schema fixes completed!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixSchema();
