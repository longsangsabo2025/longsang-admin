/**
 * Seed Academy Courses
 * Automatically populate database with comprehensive courses
 */

import { createClient } from '@supabase/supabase-js';
import { coursesSeedData, courseSectionsTemplate, assignmentsTemplate, quizzesTemplate } from '../src/data/courses-seed';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCourses() {
  console.log('🌱 Starting to seed Academy courses...\n');

  try {
    // Get instructor ID (use first instructor or create one)
    const { data: instructors } = await supabase
      .from('instructors')
      .select('id')
      .limit(1);

    const instructorId = instructors?.[0]?.id || 'instructor-001';

    // Seed courses
    console.log('📚 Seeding courses...');
    for (const course of coursesSeedData) {
      const courseData = {
        ...course,
        instructor_id: instructorId,
      };

      const { data: createdCourse, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (courseError) {
        console.error(`❌ Error creating course "${course.title}":`, courseError);
        continue;
      }

      console.log(`✅ Created course: ${course.title}`);

      // Seed course syllabus
      const { error: syllabusError } = await supabase
        .from('course_syllabus')
        .insert({
          course_id: createdCourse.id,
          learning_objectives: course.what_you_learn,
          grading_policy: {
            assignments: 30,
            quizzes: 20,
            final_exam: 50,
          },
          prerequisites: course.requirements,
        });

      if (syllabusError) {
        console.error(`❌ Error creating syllabus for "${course.title}":`, syllabusError);
      } else {
        console.log(`  ✅ Created syllabus`);
      }

      // Seed sections and lessons
      const sections = courseSectionsTemplate(createdCourse.id);
      for (const section of sections) {
        const { data: createdSection, error: sectionError } = await supabase
          .from('course_sections')
          .insert({
            course_id: createdCourse.id,
            title: section.title,
            description: section.description,
            order_index: section.order_index,
          })
          .select()
          .single();

        if (sectionError) {
          console.error(`❌ Error creating section "${section.title}":`, sectionError);
          continue;
        }

        console.log(`  ✅ Created section: ${section.title}`);

        // Seed lessons
        for (const lesson of section.lessons) {
          const { error: lessonError } = await supabase
            .from('lessons')
            .insert({
              section_id: createdSection.id,
              title: lesson.title,
              description: lesson.description,
              content_type: lesson.content_type,
              video_url: lesson.video_url,
              duration_minutes: lesson.duration_minutes,
              is_free_preview: lesson.is_free_preview,
              order_index: lesson.order_index,
              resources: lesson.resources,
            });

          if (lessonError) {
            console.error(`❌ Error creating lesson "${lesson.title}":`, lessonError);
          } else {
            console.log(`    ✅ Created lesson: ${lesson.title}`);
          }
        }
      }

      // Seed assignments
      const assignments = assignmentsTemplate(createdCourse.id);
      for (const assignment of assignments) {
        const { error: assignmentError } = await supabase
          .from('course_assignments')
          .insert({
            course_id: createdCourse.id,
            title: assignment.title,
            description: assignment.description,
            instructions: assignment.instructions,
            due_date: assignment.due_date,
            max_score: assignment.max_score,
            assignment_type: assignment.assignment_type,
            allow_late_submission: assignment.allow_late_submission,
            late_penalty_percent: assignment.late_penalty_percent,
            rubric: assignment.rubric,
            created_by: instructorId,
          });

        if (assignmentError) {
          console.error(`❌ Error creating assignment "${assignment.title}":`, assignmentError);
        } else {
          console.log(`  ✅ Created assignment: ${assignment.title}`);
        }
      }

      // Seed quizzes
      const quizzes = quizzesTemplate(createdCourse.id);
      for (const quiz of quizzes) {
        const { data: createdQuiz, error: quizError } = await supabase
          .from('course_quizzes')
          .insert({
            course_id: createdCourse.id,
            title: quiz.title,
            description: quiz.description,
            quiz_type: quiz.quiz_type,
            time_limit_minutes: quiz.time_limit_minutes,
            passing_score: quiz.passing_score,
            randomize_questions: quiz.randomize_questions,
            randomize_answers: quiz.randomize_answers,
            show_correct_answers: quiz.show_correct_answers,
            allow_review: quiz.allow_review,
            max_attempts: quiz.max_attempts,
            created_by: instructorId,
          })
          .select()
          .single();

        if (quizError) {
          console.error(`❌ Error creating quiz "${quiz.title}":`, quizError);
          continue;
        }

        console.log(`  ✅ Created quiz: ${quiz.title}`);

        // Seed quiz questions
        for (const question of quiz.questions) {
          const { data: createdQuestion, error: questionError } = await supabase
            .from('quiz_questions')
            .insert({
              quiz_id: createdQuiz.id,
              question_text: question.question_text,
              question_type: question.question_type,
              points: question.points,
              order_index: question.order_index,
              explanation: question.explanation,
            })
            .select()
            .single();

          if (questionError) {
            console.error(`❌ Error creating question:`, questionError);
            continue;
          }

          // Seed question options
          if (question.options && question.options.length > 0) {
            for (const option of question.options) {
              const { error: optionError } = await supabase
                .from('quiz_question_options')
                .insert({
                  question_id: createdQuestion.id,
                  option_text: option.option_text,
                  is_correct: option.is_correct,
                  order_index: option.order_index,
                });

              if (optionError) {
                console.error(`❌ Error creating option:`, optionError);
              }
            }
          }
        }
      }

      console.log(`\n✅ Completed course: ${course.title}\n`);
    }

    console.log('🎉 Successfully seeded all courses!');
    console.log(`\n📊 Summary:`);
    console.log(`  - ${coursesSeedData.length} courses created`);
    console.log(`  - Multiple sections, lessons, assignments, and quizzes per course`);
    console.log(`  - All courses are published and ready to use`);
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  }
}

// Run the seeding
seedCourses().then(() => {
  console.log('\n✨ Seeding complete!');
  process.exit(0);
});
