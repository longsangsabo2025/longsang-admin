/**
 * Sample/Mock Courses Data
 * Used as fallback when Supabase is not available or for demo purposes
 */

import type { Course } from '@/types/academy';

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'sample-1',
    title: 'Xây dựng AI Agent với MCP',
    subtitle: 'Master Model Context Protocol để tạo AI agents mạnh mẽ',
    description: 'Học cách xây dựng AI agents professional sử dụng Model Context Protocol (MCP). Từ cơ bản đến nâng cao với real-world projects.',
    category: 'AI Agents',
    level: 'Advanced',
    duration_hours: 8,
    total_lessons: 24,
    language: 'Tiếng Việt',
    price: 1990000,
    original_price: 2990000,
    is_free: false,
    is_published: true,
    tags: ['MCP', 'AI Agents', 'Advanced'],
    what_you_learn: [
      'Xây dựng MCP servers với 10+ custom tools',
      'Tích hợp với Claude Desktop & VS Code',
      'Implement streaming responses & real-time updates',
      'Deploy production-ready MCP servers'
    ],
    requirements: ['TypeScript cơ bản', 'Node.js experience'],
    features: ['8 hours video', '24 lessons', 'Certificate', 'Lifetime access'],
    total_students: 1247,
    average_rating: 4.8,
    total_reviews: 156,
    thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    last_updated: '2025-01-15',
    created_at: '2024-11-01',
    updated_at: '2025-01-15',
  },
  {
    id: 'sample-2',
    title: 'Vector Database & RAG',
    subtitle: 'Build intelligent retrieval systems với vector search',
    description: 'Deep dive vào Vector Databases và Retrieval-Augmented Generation. Xây dựng chatbots có khả năng tìm kiếm intelligent.',
    category: 'AI Infrastructure',
    level: 'Intermediate',
    duration_hours: 6,
    total_lessons: 18,
    language: 'Tiếng Việt',
    price: 1490000,
    original_price: 2190000,
    is_free: false,
    is_published: true,
    tags: ['RAG', 'Vector DB', 'Embeddings'],
    what_you_learn: [
      'Setup Pinecone, Weaviate, Supabase Vector',
      'Generate và store embeddings hiệu quả',
      'Implement RAG patterns với LangChain',
      'Optimize retrieval quality và performance'
    ],
    requirements: ['Python basics', 'Basic AI knowledge'],
    features: ['6 hours video', '18 lessons', 'Projects', 'Support'],
    total_students: 2341,
    average_rating: 4.9,
    total_reviews: 287,
    thumbnail_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    last_updated: '2025-01-10',
    created_at: '2024-10-15',
    updated_at: '2025-01-10',
  },
  {
    id: 'sample-3',
    title: 'Giới thiệu về AI Agents',
    subtitle: 'Khóa học miễn phí cho beginners',
    description: 'Khóa học miễn phí giới thiệu về AI Agents, cách chúng hoạt động và các ứng dụng thực tế.',
    category: 'AI Agents',
    level: 'Beginner',
    duration_hours: 2,
    total_lessons: 8,
    language: 'Tiếng Việt',
    price: 0,
    is_free: true,
    is_published: true,
    tags: ['Beginner', 'Free', 'Introduction'],
    what_you_learn: [
      'AI Agents là gì và tại sao quan trọng',
      'Các loại agents phổ biến',
      'Tools và frameworks cho AI development',
      'Career path trong AI engineering'
    ],
    requirements: [],
    features: ['2 hours video', '8 lessons', 'Certificate', 'Community'],
    total_students: 5678,
    average_rating: 4.7,
    total_reviews: 892,
    thumbnail_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
    last_updated: '2025-01-05',
    created_at: '2024-09-01',
    updated_at: '2025-01-05',
  },
  {
    id: 'sample-4',
    title: 'LangGraph Multi-Agent Orchestration',
    subtitle: 'Xây dựng hệ thống multi-agent phức tạp',
    description: 'Master LangGraph để orchestrate nhiều AI agents làm việc cùng nhau. Build production-grade multi-agent systems.',
    category: 'AI Agents',
    level: 'Advanced',
    duration_hours: 10,
    total_lessons: 32,
    language: 'Tiếng Việt',
    price: 2490000,
    original_price: 3490000,
    is_free: false,
    is_published: true,
    tags: ['LangGraph', 'Multi-Agent', 'Advanced'],
    what_you_learn: [
      'LangGraph fundamentals & architecture',
      'Design multi-agent workflows',
      'Implement agent communication protocols',
      'Deploy scalable agent systems'
    ],
    requirements: ['Python advanced', 'LangChain experience'],
    features: ['10 hours video', '32 lessons', 'Real projects', 'Mentorship'],
    total_students: 892,
    average_rating: 4.9,
    total_reviews: 123,
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    last_updated: '2025-01-12',
    created_at: '2024-11-15',
    updated_at: '2025-01-12',
  },
  {
    id: 'sample-5',
    title: 'Real-time Streaming Chat Interfaces',
    subtitle: 'Build responsive AI chat với streaming',
    description: 'Tạo chat interfaces professional với streaming responses, typing indicators, và real-time updates.',
    category: 'Chat Interfaces',
    level: 'Intermediate',
    duration_hours: 5,
    total_lessons: 15,
    language: 'Tiếng Việt',
    price: 990000,
    original_price: 1490000,
    is_free: false,
    is_published: true,
    tags: ['Streaming', 'Chat', 'Real-time'],
    what_you_learn: [
      'Implement Server-Sent Events (SSE)',
      'Handle streaming responses from OpenAI',
      'Build responsive UIs với React',
      'Optimize performance và UX'
    ],
    requirements: ['React basics', 'TypeScript'],
    features: ['5 hours video', '15 lessons', 'Source code', 'Updates'],
    total_students: 1567,
    average_rating: 4.8,
    total_reviews: 234,
    thumbnail_url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800',
    last_updated: '2025-01-08',
    created_at: '2024-10-20',
    updated_at: '2025-01-08',
  },
  {
    id: 'sample-6',
    title: 'Multimodal AI Development',
    subtitle: 'Work với text, images, audio và video',
    description: 'Master multimodal AI models. Xây dựng applications xử lý text, hình ảnh, audio và video đồng thời.',
    category: 'Multimodal AI',
    level: 'Advanced',
    duration_hours: 12,
    total_lessons: 36,
    language: 'Tiếng Việt',
    price: 2990000,
    original_price: 3990000,
    is_free: false,
    is_published: true,
    tags: ['Multimodal', 'Vision', 'Audio'],
    what_you_learn: [
      'Work với GPT-4 Vision, DALL-E, Whisper',
      'Process và analyze images & videos',
      'Speech-to-text và text-to-speech',
      'Build multimodal RAG systems'
    ],
    requirements: ['Python advanced', 'ML basics'],
    features: ['12 hours video', '36 lessons', 'Projects', '1-on-1 support'],
    total_students: 456,
    average_rating: 5,
    total_reviews: 67,
    thumbnail_url: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800',
    last_updated: '2025-01-14',
    created_at: '2024-12-01',
    updated_at: '2025-01-14',
  },
];

export const getSampleCourses = (filters?: {
  category?: string;
  level?: string;
  is_free?: boolean;
  search?: string;
}): Course[] => {
  let courses = [...SAMPLE_COURSES];

  if (filters) {
    if (filters.category) {
      courses = courses.filter(c => c.category === filters.category);
    }
    if (filters.level) {
      courses = courses.filter(c => c.level === filters.level);
    }
    if (filters.is_free !== undefined) {
      courses = courses.filter(c => c.is_free === filters.is_free);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
  }

  return courses;
};
