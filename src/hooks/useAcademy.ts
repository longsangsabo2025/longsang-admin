/**
 * Academy React Hooks
 * Custom hooks for courses, enrollments, and progress tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AcademyService } from '@/lib/academy/service';
import { getSampleCourses } from '@/lib/academy/sampleCourses';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/hooks/use-toast';
import type {
  CourseFilters,
  PaginationParams,
  EnrollCourseRequest,
  UpdateProgressRequest,
  CreateReviewRequest,
  CreateDiscussionRequest,
  CreateReplyRequest,
} from '@/types/academy';

/**
 * Get courses with filters
 */
export function useCourses(filters?: CourseFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['courses', filters, pagination],
    queryFn: async () => {
      try {
        return await AcademyService.getCourses(filters, pagination);
      } catch (error) {
        logger.error('Failed to fetch courses from Supabase, using sample data', error);
        // Return sample courses as fallback
        const sampleCourses = getSampleCourses({
          category: filters?.category,
          level: filters?.level,
          is_free: filters?.is_free,
          search: filters?.search,
        });
        return {
          data: sampleCourses,
          total: sampleCourses.length,
          page: pagination?.page || 1,
          limit: pagination?.limit || 12,
          total_pages: Math.ceil(sampleCourses.length / (pagination?.limit || 12)),
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
  });
}

/**
 * Get single course by ID
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => AcademyService.getCourseById(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get user's enrollments
 * Only fetches if user is authenticated
 */
export function useUserEnrollments() {
  return useQuery({
    queryKey: ['user-enrollments'],
    queryFn: async () => {
      try {
        return await AcademyService.getUserEnrollments();
      } catch (error) {
        // If user not authenticated, return empty array
        if (error instanceof Error && error.message === 'User not authenticated') {
          return [];
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: false, // Don't retry if auth fails
  });
}

/**
 * Enroll in course
 */
export function useEnrollCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: EnrollCourseRequest) => AcademyService.enrollCourse(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.course_id] });
      toast({
        title: 'Enrollment Successful!',
        description: 'You can now access all course materials.',
      });
      logger.info('Course enrolled successfully', { courseId: data.course_id });
    },
    onError: (error) => {
      toast({
        title: 'Enrollment Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to enroll in course', error);
    },
  });
}

/**
 * Update lesson progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateProgressRequest) => AcademyService.updateLessonProgress(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      logger.info('Progress updated', { lessonId: data.lesson_id });
    },
    onError: (error) => {
      logger.error('Failed to update progress', error);
    },
  });
}

/**
 * Create review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: CreateReviewRequest) => AcademyService.createReview(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course', data.course_id] });
      toast({
        title: 'Review Posted!',
        description: 'Thank you for your feedback.',
      });
      logger.info('Review created', { courseId: data.course_id });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Post Review',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      logger.error('Failed to create review', error);
    },
  });
}

/**
 * Mark review helpful
 */
export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => AcademyService.markReviewHelpful(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
    },
  });
}

/**
 * Get course discussions
 */
export function useCourseDiscussions(courseId: string) {
  return useQuery({
    queryKey: ['discussions', courseId],
    queryFn: () => AcademyService.getCourseDiscussions(courseId),
    enabled: !!courseId,
  });
}

/**
 * Create discussion
 */
export function useCreateDiscussion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: CreateDiscussionRequest) => AcademyService.createDiscussion(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discussions', data.course_id] });
      toast({
        title: 'Discussion Created!',
        description: 'Your question has been posted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Discussion',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Reply to discussion
 */
export function useReplyToDiscussion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: CreateReplyRequest) => AcademyService.replyToDiscussion(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      toast({
        title: 'Reply Posted!',
        description: 'Your response has been added.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Post Reply',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get learning paths
 */
export function useLearningPaths() {
  return useQuery({
    queryKey: ['learning-paths'],
    queryFn: () => AcademyService.getLearningPaths(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get user path progress
 */
export function useUserPathProgress() {
  return useQuery({
    queryKey: ['user-path-progress'],
    queryFn: () => AcademyService.getUserPathProgress(),
  });
}

/**
 * Get user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: () => AcademyService.getUserStats(),
    staleTime: 5 * 60 * 1000,
  });
}
