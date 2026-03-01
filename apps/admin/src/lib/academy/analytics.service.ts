/**
 * Learning Analytics Service
 * Track and analyze student learning progress
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface LearningAnalytics {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string;
  total_time_spent_minutes: number;
  lessons_completed: number;
  lessons_total: number;
  assignments_completed: number;
  assignments_total: number;
  quizzes_completed: number;
  quizzes_total: number;
  average_quiz_score?: number;
  average_assignment_score?: number;
  engagement_score?: number;
  last_activity_at?: string;
  last_lesson_viewed_id?: string;
  learning_path_progress?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * Initialize analytics for a student in a course
   */
  static async initializeAnalytics(userId: string, courseId: string, enrollmentId?: string) {
    try {
      // Get course info
      const { data: course } = await supabase
        .from('courses')
        .select('total_lessons')
        .eq('id', courseId)
        .single();

      // Get total assignments and quizzes
      const { data: assignments } = await supabase
        .from('course_assignments')
        .select('id')
        .eq('course_id', courseId);

      const { data: quizzes } = await supabase
        .from('course_quizzes')
        .select('id')
        .eq('course_id', courseId);

      const { data, error } = await supabase
        .from('learning_analytics')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            enrollment_id: enrollmentId,
            lessons_total: course?.total_lessons || 0,
            assignments_total: assignments?.length || 0,
            quizzes_total: quizzes?.length || 0,
          },
          { onConflict: 'user_id,course_id' }
        )
        .select()
        .single();

      if (error) throw error;

      logger.info('Analytics initialized', { userId, courseId });
      return data as LearningAnalytics;
    } catch (error) {
      logger.error('Failed to initialize analytics', error);
      throw error;
    }
  }

  /**
   * Update time spent on course
   */
  static async updateTimeSpent(userId: string, courseId: string, minutes: number) {
    try {
      const { data, error } = await supabase
        .from('learning_analytics')
        .update({
          total_time_spent_minutes: supabase.rpc('increment_time', {
            user_id: userId,
            course_id: courseId,
            minutes,
          }),
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Time spent updated', { userId, courseId, minutes });
      return data as LearningAnalytics;
    } catch (error) {
      logger.error('Failed to update time spent', error);
      throw error;
    }
  }

  /**
   * Record lesson completion
   */
  static async recordLessonCompletion(userId: string, courseId: string, lessonId: string) {
    try {
      const { data, error } = await supabase
        .from('learning_analytics')
        .update({
          lessons_completed: supabase.rpc('increment_lessons_completed', {
            user_id: userId,
            course_id: courseId,
          }),
          last_lesson_viewed_id: lessonId,
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Lesson completion recorded', { userId, courseId, lessonId });
      return data as LearningAnalytics;
    } catch (error) {
      logger.error('Failed to record lesson completion', error);
      throw error;
    }
  }

  /**
   * Get user analytics for a course
   */
  static async getUserAnalytics(userId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        return await this.initializeAnalytics(userId, courseId);
      }

      return data as LearningAnalytics;
    } catch (error) {
      logger.error('Failed to fetch user analytics', error);
      throw error;
    }
  }

  /**
   * Get course analytics (all students)
   */
  static async getCourseAnalytics(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('course_id', courseId)
        .order('engagement_score', { ascending: false });

      if (error) throw error;

      return data as LearningAnalytics[];
    } catch (error) {
      logger.error('Failed to fetch course analytics', error);
      throw error;
    }
  }

  /**
   * Calculate engagement score
   */
  static calculateEngagementScore(analytics: LearningAnalytics): number {
    const lessonsPercent =
      analytics.lessons_total > 0
        ? (analytics.lessons_completed / analytics.lessons_total) * 100
        : 0;
    const assignmentsPercent =
      analytics.assignments_total > 0
        ? (analytics.assignments_completed / analytics.assignments_total) * 100
        : 0;
    const quizzesPercent =
      analytics.quizzes_total > 0
        ? (analytics.quizzes_completed / analytics.quizzes_total) * 100
        : 0;
    const timeScore = Math.min((analytics.total_time_spent_minutes / 600) * 100, 100); // Max 10 hours

    const avgScore =
      (lessonsPercent * 0.3 + assignmentsPercent * 0.3 + quizzesPercent * 0.2 + timeScore * 0.2) /
      100;

    return Math.round(avgScore * 100) / 100;
  }

  /**
   * Get course statistics
   */
  static async getCourseStats(courseId: string) {
    try {
      const { data: analytics, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;

      const students = analytics || [];
      const avgTimeSpent =
        students.length > 0
          ? students.reduce((sum, a) => sum + a.total_time_spent_minutes, 0) / students.length
          : 0;
      const avgLessonsCompleted =
        students.length > 0
          ? students.reduce((sum, a) => sum + a.lessons_completed, 0) / students.length
          : 0;
      const avgAssignmentsCompleted =
        students.length > 0
          ? students.reduce((sum, a) => sum + a.assignments_completed, 0) / students.length
          : 0;
      const avgQuizzesCompleted =
        students.length > 0
          ? students.reduce((sum, a) => sum + a.quizzes_completed, 0) / students.length
          : 0;

      return {
        total_students: students.length,
        average_time_spent_minutes: Math.round(avgTimeSpent * 100) / 100,
        average_lessons_completed: Math.round(avgLessonsCompleted * 100) / 100,
        average_assignments_completed: Math.round(avgAssignmentsCompleted * 100) / 100,
        average_quizzes_completed: Math.round(avgQuizzesCompleted * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get course stats', error);
      throw error;
    }
  }

  /**
   * Get student progress report
   */
  static async getStudentProgressReport(userId: string, courseId: string) {
    try {
      const analytics = await this.getUserAnalytics(userId, courseId);

      const engagementScore = this.calculateEngagementScore(analytics);

      // Get recent submissions
      const { data: recentSubmissions } = await supabase
        .from('assignment_submissions')
        .select('*, assignment:course_assignments(title, due_date)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(5);

      // Get recent quiz attempts
      const { data: recentQuizzes } = await supabase
        .from('quiz_attempts')
        .select('*, quiz:course_quizzes(title)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);

      return {
        analytics: {
          ...analytics,
          engagement_score: engagementScore,
        },
        recent_submissions: recentSubmissions || [],
        recent_quizzes: recentQuizzes || [],
        completion_percentage: Math.round(
          ((analytics.lessons_completed +
            analytics.assignments_completed +
            analytics.quizzes_completed) /
            (analytics.lessons_total + analytics.assignments_total + analytics.quizzes_total)) *
            100
        ),
      };
    } catch (error) {
      logger.error('Failed to get progress report', error);
      throw error;
    }
  }

  /**
   * Get class performance report
   */
  static async getClassPerformanceReport(courseId: string) {
    try {
      const allAnalytics = await this.getCourseAnalytics(courseId);

      const students = allAnalytics.map((a) => ({
        ...a,
        engagement_score: this.calculateEngagementScore(a),
      }));

      const topPerformers = [...students]
        .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
        .slice(0, 5);

      const needsSupport = [...students]
        .filter((s) => (s.engagement_score || 0) < 50)
        .sort((a, b) => (a.engagement_score || 0) - (b.engagement_score || 0))
        .slice(0, 5);

      return {
        total_students: students.length,
        average_engagement:
          Math.round(
            (students.reduce((sum, s) => sum + (s.engagement_score || 0), 0) / students.length) *
              100
          ) / 100,
        top_performers: topPerformers,
        needs_support: needsSupport,
        completion_rate:
          Math.round(
            (students.filter((s) => s.lessons_completed === s.lessons_total).length /
              students.length) *
              100
          ) || 0,
      };
    } catch (error) {
      logger.error('Failed to get class performance report', error);
      throw error;
    }
  }
}
