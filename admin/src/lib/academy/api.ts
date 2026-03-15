/**
 * Academy API Client
 * Handle all API calls for courses, assignments, quizzes, analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// COURSES API
// ============================================================================

export const coursesAPI = {
  /**
   * Get all courses with filters
   */
  async getAll(filters?: {
    category?: string;
    level?: string;
    search?: string;
    is_free?: boolean;
  }) {
    try {
      let query = supabase.from('courses').select('*').eq('is_published', true);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.is_free !== undefined) {
        query = query.eq('is_free', filters.is_free);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch courses', error);
      throw error;
    }
  },

  /**
   * Get course by ID with full details
   */
  async getById(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(
          `
          *,
          instructor:instructor_id(*),
          sections:course_sections(
            *,
            lessons:lessons(*)
          ),
          syllabus:course_syllabus(*)
        `
        )
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch course', error);
      throw error;
    }
  },

  /**
   * Get courses by category
   */
  async getByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('category', category)
        .eq('is_published', true)
        .order('total_students', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch courses by category', error);
      throw error;
    }
  },

  /**
   * Get featured courses
   */
  async getFeatured(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('total_students', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch featured courses', error);
      throw error;
    }
  },

  /**
   * Get trending courses
   */
  async getTrending(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .gt('average_rating', 4.5)
        .order('total_reviews', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch trending courses', error);
      throw error;
    }
  },

  /**
   * Get course categories
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .eq('is_published', true);

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set(data?.map((d) => d.category) || [])];
      return categories;
    } catch (error) {
      logger.error('Failed to fetch categories', error);
      throw error;
    }
  },
};

// ============================================================================
// ENROLLMENTS API
// ============================================================================

export const enrollmentsAPI = {
  /**
   * Enroll in a course
   */
  async enroll(courseId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.user.id,
          course_id: courseId,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('User enrolled in course', { userId: user.user.id, courseId });
      return data;
    } catch (error) {
      logger.error('Failed to enroll in course', error);
      throw error;
    }
  },

  /**
   * Get user's enrollments
   */
  async getUserEnrollments() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          *,
          course:courses(*)
        `
        )
        .eq('user_id', user.user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch enrollments', error);
      throw error;
    }
  },

  /**
   * Check if user is enrolled
   */
  async isEnrolled(courseId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return false;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      logger.error('Failed to check enrollment', error);
      return false;
    }
  },
};

// ============================================================================
// LESSONS API
// ============================================================================

export const lessonsAPI = {
  /**
   * Get section lessons
   */
  async getBySection(sectionId: string) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('section_id', sectionId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch lessons', error);
      throw error;
    }
  },

  /**
   * Get lesson by ID
   */
  async getById(lessonId: string) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch lesson', error);
      throw error;
    }
  },

  /**
   * Mark lesson as completed
   */
  async markCompleted(lessonId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.user.id,
            lesson_id: lessonId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;

      logger.info('Lesson marked as completed', { lessonId, userId: user.user.id });
      return data;
    } catch (error) {
      logger.error('Failed to mark lesson completed', error);
      throw error;
    }
  },
};

// ============================================================================
// REVIEWS API
// ============================================================================

export const reviewsAPI = {
  /**
   * Get course reviews
   */
  async getByCourse(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_reviews')
        .select(
          `
          *,
          user:user_id(id, email, raw_user_meta_data)
        `
        )
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch reviews', error);
      throw error;
    }
  },

  /**
   * Create review
   */
  async create(courseId: string, rating: number, comment?: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      // Get enrollment
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) throw new Error('Not enrolled in this course');

      const { data, error } = await supabase
        .from('course_reviews')
        .insert({
          user_id: user.user.id,
          course_id: courseId,
          enrollment_id: enrollment.id,
          rating,
          comment,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Review created', { courseId, rating });
      return data;
    } catch (error) {
      logger.error('Failed to create review', error);
      throw error;
    }
  },
};

// ============================================================================
// DISCUSSIONS API
// ============================================================================

export const discussionsAPI = {
  /**
   * Get course discussions
   */
  async getByCourse(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('discussion_topics')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch discussions', error);
      throw error;
    }
  },

  /**
   * Create discussion topic
   */
  async createTopic(courseId: string, title: string, content: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('discussion_topics')
        .insert({
          course_id: courseId,
          created_by: user.user.id,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Discussion topic created', { courseId, title });
      return data;
    } catch (error) {
      logger.error('Failed to create discussion topic', error);
      throw error;
    }
  },

  /**
   * Get topic replies
   */
  async getReplies(topicId: string) {
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch replies', error);
      throw error;
    }
  },

  /**
   * Create reply
   */
  async createReply(topicId: string, content: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          topic_id: topicId,
          created_by: user.user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Reply created', { topicId });
      return data;
    } catch (error) {
      logger.error('Failed to create reply', error);
      throw error;
    }
  },
};
