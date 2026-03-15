/**
 * Quick Seed Script - ES Module version
 * Seeds 16 courses directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const courses = [
  {
    title: 'AI Agent Development với Model Context Protocol (MCP)',
    subtitle: 'Master modern AI agent development với cutting-edge MCP protocol',
    description: 'Khóa học toàn diện về xây dựng AI agents sử dụng Model Context Protocol.',
    category: 'AI & Machine Learning',
    level: 'Advanced',
    duration_hours: 12,
    price: 1990000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-001',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 24,
    total_students: 12450,
    average_rating: 4.9,
    total_reviews: 2847,
    is_published: true,
  },
  {
    title: 'Prompt Engineering & LLM Optimization',
    subtitle: 'Craft powerful prompts và tối ưu hóa LLM responses',
    description: 'Học cách viết prompts hiệu quả, tối ưu hóa LLM outputs.',
    category: 'AI & Machine Learning',
    level: 'Intermediate',
    duration_hours: 8,
    price: 990000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-001',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 16,
    total_students: 8932,
    average_rating: 4.8,
    total_reviews: 1203,
    is_published: true,
  },
  {
    title: 'Deep Learning Fundamentals',
    subtitle: 'Neural networks, CNNs, RNNs từ cơ bản đến advanced',
    description: 'Khóa học toàn diện về deep learning.',
    category: 'AI & Machine Learning',
    level: 'Advanced',
    duration_hours: 20,
    price: 2490000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-002',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 32,
    total_students: 5234,
    average_rating: 4.9,
    total_reviews: 892,
    is_published: true,
  },
  {
    title: 'N8N Automation Mastery',
    subtitle: 'Build powerful automation workflows without coding',
    description: 'Khóa học hoàn chỉnh về N8N - công cụ automation hàng đầu.',
    category: 'Automation & Workflows',
    level: 'Beginner',
    duration_hours: 10,
    price: 890000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-003',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 20,
    total_students: 15234,
    average_rating: 4.7,
    total_reviews: 2103,
    is_published: true,
  },
  {
    title: 'Zapier & Make.com Advanced Automation',
    subtitle: 'Master no-code automation platforms',
    description: 'Học cách sử dụng Zapier và Make.com để tự động hóa.',
    category: 'Automation & Workflows',
    level: 'Intermediate',
    duration_hours: 8,
    price: 790000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-003',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 16,
    total_students: 9823,
    average_rating: 4.6,
    total_reviews: 1456,
    is_published: true,
  },
  {
    title: 'React Advanced Patterns & Performance',
    subtitle: 'Master advanced React patterns, hooks, và optimization',
    description: 'Khóa học nâng cao về React.',
    category: 'Web Development',
    level: 'Advanced',
    duration_hours: 16,
    price: 1590000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-004',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 24,
    total_students: 18234,
    average_rating: 4.9,
    total_reviews: 3102,
    is_published: true,
  },
  {
    title: 'Full-Stack Web Development with Next.js',
    subtitle: 'Build production-ready full-stack applications',
    description: 'Khóa học hoàn chỉnh về xây dựng full-stack applications với Next.js.',
    category: 'Web Development',
    level: 'Intermediate',
    duration_hours: 24,
    price: 1990000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-004',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 32,
    total_students: 12456,
    average_rating: 4.8,
    total_reviews: 2234,
    is_published: true,
  },
  {
    title: 'TypeScript Mastery',
    subtitle: 'From basics to advanced TypeScript patterns',
    description: 'Học TypeScript từ cơ bản đến advanced.',
    category: 'Web Development',
    level: 'Intermediate',
    duration_hours: 12,
    price: 990000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-005',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 18,
    total_students: 8234,
    average_rating: 4.7,
    total_reviews: 1203,
    is_published: true,
  },
  {
    title: 'UI/UX Design Fundamentals',
    subtitle: 'Create beautiful and user-friendly interfaces',
    description: 'Khóa học toàn diện về UI/UX design.',
    category: 'Design & UI/UX',
    level: 'Beginner',
    duration_hours: 14,
    price: 1290000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-006',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 20,
    total_students: 9234,
    average_rating: 4.8,
    total_reviews: 1567,
    is_published: true,
  },
  {
    title: 'Figma for Designers & Developers',
    subtitle: 'Master Figma for design and collaboration',
    description: 'Khóa học chi tiết về Figma.',
    category: 'Design & UI/UX',
    level: 'Beginner',
    duration_hours: 10,
    price: 890000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-006',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 16,
    total_students: 12345,
    average_rating: 4.7,
    total_reviews: 1823,
    is_published: true,
  },
  {
    title: 'Data Analysis with Python & Pandas',
    subtitle: 'Master data analysis using Python',
    description: 'Khóa học toàn diện về data analysis.',
    category: 'Data & Analytics',
    level: 'Intermediate',
    duration_hours: 16,
    price: 1290000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-007',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 20,
    total_students: 7234,
    average_rating: 4.8,
    total_reviews: 1034,
    is_published: true,
  },
  {
    title: 'SQL for Data Analysis',
    subtitle: 'Master SQL for querying and analyzing data',
    description: 'Khóa học chi tiết về SQL.',
    category: 'Data & Analytics',
    level: 'Beginner',
    duration_hours: 12,
    price: 890000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-007',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 16,
    total_students: 14234,
    average_rating: 4.9,
    total_reviews: 2103,
    is_published: true,
  },
  {
    title: 'Git & GitHub for Developers',
    subtitle: 'Master version control and collaboration',
    description: 'Khóa học hoàn chỉnh về Git và GitHub.',
    category: 'Tools & Productivity',
    level: 'Beginner',
    duration_hours: 8,
    price: 690000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-008',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 12,
    total_students: 18234,
    average_rating: 4.8,
    total_reviews: 2567,
    is_published: true,
  },
  {
    title: 'Docker & Container Basics',
    subtitle: 'Learn containerization for modern development',
    description: 'Khóa học về Docker.',
    category: 'Tools & Productivity',
    level: 'Intermediate',
    duration_hours: 10,
    price: 890000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-008',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 14,
    total_students: 6234,
    average_rating: 4.7,
    total_reviews: 823,
    is_published: true,
  },
  {
    title: 'System Design & Architecture',
    subtitle: 'Design scalable systems like a senior engineer',
    description: 'Khóa học về system design.',
    category: 'Advanced Topics',
    level: 'Advanced',
    duration_hours: 18,
    price: 1890000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-009',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 24,
    total_students: 4234,
    average_rating: 4.9,
    total_reviews: 612,
    is_published: true,
  },
  {
    title: 'Cloud Deployment & DevOps',
    subtitle: 'Deploy applications to AWS, GCP, Azure',
    description: 'Khóa học hoàn chỉnh về cloud deployment.',
    category: 'Advanced Topics',
    level: 'Intermediate',
    duration_hours: 14,
    price: 1490000,
    is_free: false,
    language: 'Tiếng Việt',
    instructor_id: 'instructor-009',
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    total_lessons: 20,
    total_students: 5234,
    average_rating: 4.8,
    total_reviews: 734,
    is_published: true,
  },
];

async function seedCourses() {
  console.log('🌱 Starting to seed Academy courses...\n');

  try {
    let successCount = 0;

    for (const course of courses) {
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating "${course.title}":`, error.message);
        continue;
      }

      console.log(`✅ Created: ${course.title}`);
      successCount++;

      // Insert syllabus
      await supabase.from('course_syllabus').insert({
        course_id: data.id,
        learning_objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
        grading_policy: {
          assignments: 30,
          quizzes: 20,
          final_exam: 50,
        },
      });
    }

    console.log(`\n✅ Successfully seeded ${successCount} courses!`);
    console.log('\n🎉 Seeding complete!\n');
    console.log('📝 Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Visit: http://localhost:5173/academy/browse');
    console.log('  3. Browse and enroll in courses!\n');

    return successCount > 0;
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return false;
  }
}

const success = await seedCourses();
if (!success) {
  process.exit(1);
}
