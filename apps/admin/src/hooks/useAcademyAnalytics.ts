/**
 * Learning Analytics Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '@/lib/academy/analytics.service';

export function useUserAnalytics(userId: string, courseId: string) {
  return useQuery({
    queryKey: ['user-analytics', userId, courseId],
    queryFn: () => AnalyticsService.getUserAnalytics(userId, courseId),
    enabled: !!userId && !!courseId,
  });
}

export function useCourseAnalytics(courseId: string) {
  return useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: () => AnalyticsService.getCourseAnalytics(courseId),
    enabled: !!courseId,
  });
}

export function useCourseStats(courseId: string) {
  return useQuery({
    queryKey: ['course-stats', courseId],
    queryFn: () => AnalyticsService.getCourseStats(courseId),
    enabled: !!courseId,
  });
}

export function useStudentProgressReport(userId: string, courseId: string) {
  return useQuery({
    queryKey: ['progress-report', userId, courseId],
    queryFn: () => AnalyticsService.getStudentProgressReport(userId, courseId),
    enabled: !!userId && !!courseId,
  });
}

export function useClassPerformanceReport(courseId: string) {
  return useQuery({
    queryKey: ['class-performance', courseId],
    queryFn: () => AnalyticsService.getClassPerformanceReport(courseId),
    enabled: !!courseId,
  });
}
