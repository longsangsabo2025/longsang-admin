import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function createRAGCourse() {
  console.log('🚀 Tạo khóa học RAG & LangChain...\n');

  // 1. Lấy instructor
  const { data: instructors } = await supabase.from('instructors').select('id, name').limit(1);
  const instructorId = instructors?.[0]?.id;
  console.log('📌 Instructor:', instructors?.[0]?.name);

  // 2. Tạo khóa học - chỉ dùng các columns có trong schema
  const courseData = {
    title: 'Xây Dựng AI Chatbot với RAG & LangChain',
    subtitle: 'Từ zero đến deploy production với RAG, LangChain và Vector Database',
    description: `Khóa học toàn diện về xây dựng AI Chatbot thông minh sử dụng kỹ thuật RAG (Retrieval-Augmented Generation) và LangChain.

Bạn sẽ học cách:
- Xây dựng chatbot có khả năng trả lời câu hỏi dựa trên tài liệu riêng
- Tích hợp với nhiều nguồn dữ liệu (PDF, Web, Database)
- Deploy lên production với hiệu suất cao

Dành cho Developer, Product Manager và Startup founders muốn tích hợp AI.`,
    category: 'AI & Machine Learning',
    level: 'Intermediate',
    price: 1990000,
    original_price: 2990000,
    is_free: false,
    is_published: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    duration_hours: 12,
    total_lessons: 24,
    language: 'Vietnamese',
    total_students: 0,
    average_rating: 5.0,
    total_reviews: 0,
    instructor_id: instructorId,
    requirements: [
      'Biết cơ bản Python (functions, classes, modules)',
      'Hiểu về REST API và JSON',
      'Máy tính có RAM >= 8GB',
      'Tài khoản OpenAI hoặc Anthropic (có free tier)'
    ],
    what_you_learn: [
      'Hiểu sâu về RAG architecture và khi nào cần dùng',
      'Xây dựng Vector Database với Pinecone/Chroma',
      'Implement chunking strategies cho documents',
      'Tích hợp LangChain với multiple LLM providers',
      'Build production-ready chatbot với streaming',
      'Deploy và monitor AI applications'
    ],
    features: [
      '12 giờ video HD',
      '24 bài học chi tiết',
      'Quiz sau mỗi module',
      'Source code đầy đủ',
      'Certificate hoàn thành',
      'Hỗ trợ qua Discord'
    ],
    tags: ['AI', 'RAG', 'LangChain', 'Python', 'Chatbot', 'NLP', 'Vector Database', 'OpenAI']
  };

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (courseError) {
    console.error('❌ Lỗi tạo course:', courseError);
    return;
  }
  console.log('✅ Khóa học:', course.title);
  console.log('   ID:', course.id);

  // 3. Tạo sections và lessons
  const sectionsData = [
    {
      title: '🚀 Giới Thiệu & Setup Environment',
      description: 'Tổng quan về RAG, LangChain và chuẩn bị môi trường phát triển',
      lessons: [
        { title: 'Tổng quan về AI Chatbot và RAG', type: 'video', duration: 15, preview: true },
        { title: 'So sánh RAG vs Fine-tuning vs Prompt Engineering', type: 'video', duration: 20, preview: true },
        { title: 'Cài đặt Python Environment với Poetry', type: 'video', duration: 12, preview: false },
        { title: 'Setup API Keys (OpenAI, Anthropic)', type: 'article', duration: 8, preview: false },
        { title: 'Quiz: Kiểm tra kiến thức cơ bản', type: 'quiz', duration: 10, preview: false }
      ]
    },
    {
      title: '📄 Document Processing & Chunking',
      description: 'Học cách xử lý và chia nhỏ tài liệu để AI có thể hiểu',
      lessons: [
        { title: 'Document Loaders trong LangChain', type: 'video', duration: 18, preview: false },
        { title: 'Chunking Strategies: Fixed vs Semantic', type: 'video', duration: 25, preview: false },
        { title: 'Thực hành: Load PDF, DOCX, Web pages', type: 'code', duration: 30, preview: false },
        { title: 'Metadata Extraction và Filtering', type: 'video', duration: 15, preview: false }
      ]
    },
    {
      title: '🗄️ Vector Database Deep Dive',
      description: 'Tìm hiểu về Embeddings và Vector Database',
      lessons: [
        { title: 'Embeddings là gì? Cách hoạt động', type: 'video', duration: 20, preview: false },
        { title: 'So sánh Vector DBs: Pinecone vs Chroma vs Weaviate', type: 'video', duration: 18, preview: false },
        { title: 'Hands-on: Setup Chroma DB locally', type: 'code', duration: 25, preview: false },
        { title: 'Hands-on: Pinecone cloud deployment', type: 'code', duration: 20, preview: false },
        { title: 'Similarity Search và Relevance Tuning', type: 'video', duration: 22, preview: false }
      ]
    },
    {
      title: '🔗 LangChain Chains & Agents',
      description: 'Master LangChain framework để xây dựng AI workflows',
      lessons: [
        { title: 'LangChain Architecture Overview', type: 'video', duration: 15, preview: false },
        { title: 'Prompt Templates và Output Parsers', type: 'video', duration: 20, preview: false },
        { title: 'Building RAG Chain step-by-step', type: 'code', duration: 35, preview: false },
        { title: 'Conversational Memory và Chat History', type: 'video', duration: 25, preview: false },
        { title: 'Quiz: LangChain Fundamentals', type: 'quiz', duration: 15, preview: false }
      ]
    },
    {
      title: '💬 Building Production Chatbot',
      description: 'Xây dựng chatbot hoàn chỉnh với UI và backend',
      lessons: [
        { title: 'FastAPI Backend với Streaming Response', type: 'video', duration: 30, preview: false },
        { title: 'React Frontend với Chat UI', type: 'code', duration: 40, preview: false },
        { title: 'Error Handling và Fallback Strategies', type: 'video', duration: 18, preview: false },
        { title: 'Rate Limiting và Cost Optimization', type: 'video', duration: 20, preview: false }
      ]
    },
    {
      title: '🚀 Deployment & Monitoring',
      description: 'Deploy lên production và theo dõi hiệu suất',
      lessons: [
        { title: 'Docker containerization', type: 'video', duration: 20, preview: false },
        { title: 'Deploy lên Railway/Render/AWS', type: 'code', duration: 25, preview: false },
        { title: 'Monitoring với LangSmith', type: 'video', duration: 18, preview: false },
        { title: 'Performance Optimization Tips', type: 'article', duration: 12, preview: false },
        { title: 'Final Project: Build Your Own RAG App', type: 'assignment', duration: 60, preview: false }
      ]
    }
  ];

  let totalLessonsCreated = 0;
  for (let i = 0; i < sectionsData.length; i++) {
    const s = sectionsData[i];
    
    const { data: section, error: sectionError } = await supabase
      .from('course_sections')
      .insert({
        course_id: course.id,
        title: s.title,
        description: s.description,
        order_index: i
      })
      .select()
      .single();

    if (sectionError) {
      console.error('❌ Lỗi tạo section:', sectionError);
      continue;
    }
    console.log(`  📁 Section ${i + 1}: ${s.title}`);

    for (let j = 0; j < s.lessons.length; j++) {
      const l = s.lessons[j];
      const { error: lessonError } = await supabase.from('lessons').insert({
        section_id: section.id,
        course_id: course.id,
        title: l.title,
        content_type: l.type,
        duration_minutes: l.duration,
        is_free_preview: l.preview,
        order_index: j,
        article_content: l.type === 'article' ? `# ${l.title}\n\nNội dung bài học sẽ được cập nhật...` : null,
        video_url: l.type === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null
      });
      
      if (lessonError) {
        console.error(`     ❌ Lỗi tạo lesson: ${lessonError.message}`);
      } else {
        totalLessonsCreated++;
        console.log(`     📖 ${l.title} (${l.type}, ${l.duration}p)`);
      }
    }
  }

  // 4. Tạo quiz questions cho các quiz lessons
  const { data: quizLessons } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('content_type', 'quiz');

  if (quizLessons && quizLessons.length > 0) {
    const quizQuestions = [
      {
        question: 'RAG là viết tắt của gì?',
        options: ['Retrieval-Augmented Generation', 'Random Access Generation', 'Real-time AI Generation', 'Recursive Algorithm Generation'],
        correct: 0,
        explanation: 'RAG = Retrieval-Augmented Generation - kỹ thuật kết hợp retrieval với generation để cải thiện độ chính xác của LLM'
      },
      {
        question: 'Vector Database dùng để làm gì trong RAG?',
        options: ['Lưu trữ SQL data', 'Lưu trữ embeddings để similarity search', 'Training model', 'Caching responses'],
        correct: 1,
        explanation: 'Vector DB lưu embeddings và cho phép tìm kiếm semantic similarity, là core component của RAG'
      },
      {
        question: 'Chunking strategy nào phù hợp nhất cho code documentation?',
        options: ['Fixed size 500 tokens', 'Semantic chunking theo functions', 'Entire file as one chunk', 'Random splitting'],
        correct: 1,
        explanation: 'Semantic chunking giữ nguyên context của functions/classes, giúp retrieval chính xác hơn'
      },
      {
        question: 'LangChain Chain là gì?',
        options: ['Blockchain technology', 'Sequence of LLM calls và components', 'Database connection', 'Security layer'],
        correct: 1,
        explanation: 'Chain là sequence kết hợp nhiều components: prompt, LLM, parser, memory để tạo workflow hoàn chỉnh'
      },
      {
        question: 'Embedding dimension phổ biến của OpenAI text-embedding-3-small là bao nhiêu?',
        options: ['256', '512', '1536', '3072'],
        correct: 2,
        explanation: 'OpenAI text-embedding-3-small có dimension 1536, cân bằng giữa performance và cost'
      }
    ];

    for (const quiz of quizLessons) {
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        await supabase.from('quiz_questions').insert({
          lesson_id: quiz.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct,
          explanation: q.explanation,
          order_index: i,
          points: 10
        });
      }
      console.log(`  ❓ Thêm ${quizQuestions.length} quiz questions cho: ${quiz.title}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ HOÀN THÀNH! Khóa học đã được tạo:');
  console.log('='.repeat(60));
  console.log(`📚 Tên: ${course.title}`);
  console.log(`🆔 ID: ${course.id}`);
  console.log(`📁 Sections: ${sectionsData.length}`);
  console.log(`📖 Lessons: ${totalLessonsCreated}`);
  console.log(`❓ Quiz questions: ${quizLessons?.length * 5 || 0}`);
  console.log(`💰 Giá: ${course.price.toLocaleString()}đ`);
  console.log(`📊 Level: ${course.level}`);
  console.log('\n🔗 Xem tại:');
  console.log(`   Admin: http://localhost:8080/admin/courses`);
  console.log(`   Edit: http://localhost:8080/admin/courses/edit/${course.id}`);
  console.log(`   Academy: http://localhost:8080/academy/course/${course.id}`);
}

createRAGCourse().catch(console.error);
