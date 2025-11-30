import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  AnalyticsEventType,
  UserBehaviorAnalytics,
  SystemPerformanceMetrics,
  DomainUsageStatistics,
  QueryPattern,
  DailyUserActivity,
} from '@/brain/types/analytics.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_ANALYTICS = ['brain', 'analytics'];

/**
 * Hook to track analytics event
 */
export function useTrackEvent() {
  return useMutation<void, Error, { eventType: AnalyticsEventType; eventData?: Record<string, any>; metadata?: Record<string, any> }>({
    mutationFn: ({ eventType, eventData, metadata }) => brainAPI.trackEvent(eventType, eventData, metadata),
    onError: (error) => {
      // Silently fail - analytics should not break the main flow
      console.error('Failed to track event:', error);
    },
  });
}

/**
 * Hook to get user behavior analytics
 */
export function useUserBehavior(hours: number = 24, enabled: boolean = true) {
  return useQuery<UserBehaviorAnalytics[]>({
    queryKey: [...QUERY_KEY_ANALYTICS, 'user-behavior', hours],
    queryFn: () => brainAPI.getUserBehaviorAnalytics(hours),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get system performance metrics
 */
export function useSystemMetrics(hours: number = 24, enabled: boolean = true) {
  return useQuery<SystemPerformanceMetrics>({
    queryKey: [...QUERY_KEY_ANALYTICS, 'system-performance', hours],
    queryFn: () => brainAPI.getSystemPerformanceMetrics(hours),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get domain usage statistics
 */
export function useDomainUsageStatistics(domainId: string | null, days: number = 7, enabled: boolean = true) {
  return useQuery<DomainUsageStatistics[]>({
    queryKey: [...QUERY_KEY_ANALYTICS, 'domain-usage', domainId, days],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getDomainUsageStatistics(domainId, days);
    },
    enabled: enabled && !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get query patterns
 */
export function useQueryPatterns(days: number = 7, enabled: boolean = true) {
  return useQuery<QueryPattern[]>({
    queryKey: [...QUERY_KEY_ANALYTICS, 'query-patterns', days],
    queryFn: () => brainAPI.getQueryPatterns(days),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get daily user activity
 */
export function useDailyUserActivity(days: number = 7, enabled: boolean = true) {
  return useQuery<DailyUserActivity[]>({
    queryKey: [...QUERY_KEY_ANALYTICS, 'daily-activity', days],
    queryFn: () => brainAPI.getDailyUserActivity(days),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


