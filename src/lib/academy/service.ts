/**
 * Academy API Service
 * Supabase integration for courses, enrollments, progress tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';
import type {
  Course,
  CourseWithDetails,
  CourseEnrollment,
  EnrollmentWithCourse,
  LessonProgress,
  CourseReview,
  CourseDiscussion,
  LearningPath,
  UserLearningPathProgress,
  CourseFilters,
  PaginationParams,
  PaginatedResponse,
  EnrollCourseRequest,
  UpdateProgressRequest,
  CreateReviewRequest,
  CreateDiscussionRequest,
  CreateReplyRequest,
} from '@/types/academy';

export class AcademyService {
  /**
   * Get all published courses with filters and pagination
   */
  static async getCourses(
    filters: CourseFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Course>> {
    try {
      const { page = 1, limit = 12, sort_by = 'students', sort_order = 'desc' } = pagination;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('courses')
        .select('*, instructor:instructors(*)', { count: 'exact' })
        .eq('is_published', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.is_free !== undefined) {
        query = query.eq('is_free', filters.is_free);
      }
      if (filters.min_rating) {
        query = query.gte('average_rating', filters.min_rating);
      }
      if (filters.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Sort
      const sortColumn =
        sort_by === 'students'
          ? 'total_students'
          : sort_by === 'rating'
            ? 'average_rating'
            : sort_by === 'updated'
              ? 'last_updated'
              : 'price';
      query = query.order(sortColumn, { ascending: sort_order === 'asc' });

      // Paginate
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error('Failed to get courses', error);
      throw error;
    }
  }

  /**
   * Get course by ID with full details
   */
  static async getCourseById(courseId: string): Promise<CourseWithDetails | null> {
    try {
      const { data: course, error } = await supabase
        .from('courses')
        .select(
          `
          *,
          instructor:instructors(*),
          sections:course_sections(
            *,
            lessons(*)
          ),
          reviews:course_reviews(
            *,
            user:user_id(id, email, raw_user_meta_data)
          )
        `
        )
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Get user enrollment if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && course) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('*, progress:lesson_progress(*)')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();

        if (enrollment) {
          (course as CourseWithDetails).enrollment = enrollment;
          (course as CourseWithDetails).user_progress = enrollment.progress;
        }
      }

      return course as CourseWithDetails;
    } catch (error) {
      logger.error('Failed to get course', error);
      return null;
    }
  }

  /**
   * Enroll in a course
   */
  static async enrollCourse(request: EnrollCourseRequest): Promise<CourseEnrollment> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: request.course_id,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('User enrolled in course', { userId: user.id, courseId: request.course_id });
      return data;
    } catch (error) {
      logger.error('Failed to enroll in course', error);
      throw error;
    }
  }

  /**
   * Get user's enrollments
   */
  static async getUserEnrollments(): Promise<EnrollmentWithCourse[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(
          `
          *,
          course:courses(*),
          progress:lesson_progress(*)
        `
        )
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      return data as EnrollmentWithCourse[];
    } catch (error) {
      logger.error('Failed to get user enrollments', error);
      throw error;
    }
  }

  /**
   * Update lesson progress
   */
  static async updateLessonProgress(request: UpdateProgressRequest): Promise<LessonProgress> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get enrollment ID
      const { data: lesson } = await supabase
        .from('lessons')
        .select('section_id')
        .eq('id', request.lesson_id)
        .single();

      if (!lesson) throw new Error('Lesson not found');

      const { data: section } = await supabase
        .from('course_sections')
        .select('course_id')
        .eq('id', lesson.section_id)
        .single();

      if (!section) throw new Error('Section not found');

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', section.course_id)
        .single();

      if (!enrollment) throw new Error('Not enrolled in this course');

      // Upsert progress
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: request.lesson_id,
            enrollment_id: enrollment.id,
            is_completed: request.is_completed,
            watch_time_seconds: request.watch_time_seconds,
            last_position_seconds: request.last_position_seconds,
            completed_at: request.is_completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;

      logger.info('Lesson progress updated', {
        userId: user.id,
        lessonId: request.lesson_id,
        completed: request.is_completed,
      });

      return data;
    } catch (error) {
      logger.error('Failed to update lesson progress', error);
      throw error;
    }
  }

  /**
   * Create course review
   */
  static async createReview(request: CreateReviewRequest): Promise<CourseReview> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', request.course_id)
        .single();

      if (!enrollment) throw new Error('Must be enrolled to review');

      const { data, error } = await supabase
        .from('course_reviews')
        .insert({
          user_id: user.id,
          course_id: request.course_id,
          enrollment_id: enrollment.id,
          rating: request.rating,
          comment: request.comment,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Review created', { userId: user.id, courseId: request.course_id });
      return data;
    } catch (error) {
      logger.error('Failed to create review', error);
      throw error;
    }
  }

  /**
   * Mark review as helpful
   */
  static async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('review_helpful_votes').insert({
        review_id: reviewId,
        user_id: user.id,
      });

      if (error) throw error;

      // Update count
      await supabase.rpc('increment_review_helpful_count', { review_id: reviewId });

      logger.info('Review marked helpful', { reviewId });
    } catch (error) {
      logger.error('Failed to mark review helpful', error);
      throw error;
    }
  }

  /**
   * Create discussion
   */
  static async createDiscussion(request: CreateDiscussionRequest): Promise<CourseDiscussion> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: request.course_id,
          lesson_id: request.lesson_id,
          user_id: user.id,
          title: request.title,
          content: request.content,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Discussion created', { userId: user.id, courseId: request.course_id });
      return data;
    } catch (error) {
      logger.error('Failed to create discussion', error);
      throw error;
    }
  }

  /**
   * Get course discussions
   */
  static async getCourseDiscussions(courseId: string): Promise<CourseDiscussion[]> {
    try {
      const { data, error } = await supabase
        .from('course_discussions')
        .select(
          `
          *,
          user:user_id(id, email, raw_user_meta_data),
          replies:discussion_replies(
            *,
            user:user_id(id, email, raw_user_meta_data)
          )
        `
        )
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as CourseDiscussion[];
    } catch (error) {
      logger.error('Failed to get discussions', error);
      throw error;
    }
  }

  /**
   * Reply to discussion
   */
  static async replyToDiscussion(request: CreateReplyRequest): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('discussion_replies').insert({
        discussion_id: request.discussion_id,
        user_id: user.id,
        content: request.content,
      });

      if (error) throw error;

      logger.info('Reply created', { userId: user.id, discussionId: request.discussion_id });
    } catch (error) {
      logger.error('Failed to create reply', error);
      throw error;
    }
  }

  /**
   * Get learning paths
   */
  static async getLearningPaths(): Promise<LearningPath[]> {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(
          `
          *,
          steps:learning_path_steps(
            *,
            courses:learning_path_courses(
              course:courses(*)
            )
          )
        `
        )
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data as LearningPath[];
    } catch (error) {
      logger.error('Failed to get learning paths', error);
      throw error;
    }
  }

  /**
   * Get user learning path progress
   */
  static async getUserPathProgress(): Promise<UserLearningPathProgress[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_learning_path_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Failed to get user path progress', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    total_enrollments: number;
    completed_courses: number;
    total_watch_time: number;
    certificates_earned: number;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id);

      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('watch_time_seconds')
        .eq('user_id', user.id);

      const totalEnrollments = enrollments?.length || 0;
      const completedCourses = enrollments?.filter((e) => e.completed_at).length || 0;
      const totalWatchTime = progress?.reduce((sum, p) => sum + p.watch_time_seconds, 0) || 0;
      const certificatesEarned = enrollments?.filter((e) => e.certificate_issued).length || 0;

      return {
        total_enrollments: totalEnrollments,
        completed_courses: completedCourses,
        total_watch_time: totalWatchTime,
        certificates_earned: certificatesEarned,
      };
    } catch (error) {
      logger.error('Failed to get user stats', error);
      throw error;
    }
  }
}
