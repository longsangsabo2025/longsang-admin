/**
 * Seed Data and Launch Script
 * Automatically seed all courses and launch the app
 */

import { createClient } from '@supabase/supabase-js';
import { coursesSeedData } from '../src/data/courses-seed';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCourses() {
  console.log('🌱 Starting to seed Academy courses...\n');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const course of coursesSeedData) {
      try {
        // Insert course
        const { data: createdCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            title: course.title,
            subtitle: course.subtitle,
            description: course.description,
            category: course.category,
            level: course.level,
            duration_hours: course.duration_hours,
            price: course.price,
            is_free: course.is_free,
            language: course.language,
            instructor_id: course.instructor_id,
            thumbnail_url: course.thumbnail_url,
            what_you_learn: course.what_you_learn,
            requirements: course.requirements,
            features: course.features,
            tags: course.tags,
            total_lessons: course.total_lessons,
            total_students: course.total_students,
            average_rating: course.average_rating,
            total_reviews: course.total_reviews,
            is_published: course.is_published,
          })
          .select()
          .single();

        if (courseError) {
          console.error(`❌ Error creating course "${course.title}":`, courseError.message);
          errorCount++;
          continue;
        }

        console.log(`✅ Created course: ${course.title}`);
        successCount++;

        // Insert syllabus
        await supabase.from('course_syllabus').insert({
          course_id: createdCourse.id,
          learning_objectives: course.what_you_learn,
          grading_policy: {
            assignments: 30,
            quizzes: 20,
            final_exam: 50,
          },
          prerequisites: course.requirements,
        });

        console.log(`  ✅ Created syllabus`);
      } catch (error) {
        console.error(`❌ Error processing course:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`  ✅ Successfully created: ${successCount} courses`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`\n🎉 Seeding complete!`);

    return successCount > 0;
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Academy System - Seed & Launch\n');
  console.log('=' .repeat(50));

  const success = await seedCourses();

  if (success) {
    console.log('\n' + '='.repeat(50));
    console.log('✅ Seeding successful!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Visit: http://localhost:5173/academy/browse');
    console.log('  3. Browse and enroll in courses!');
    console.log('\n' + '='.repeat(50));
  } else {
    console.log('\n❌ Seeding failed. Please check your Supabase connection.');
    process.exit(1);
  }
}

main();
