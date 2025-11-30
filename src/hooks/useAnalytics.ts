/**
 * useAnalytics Hook
 * Fetch AI Workspace analytics data
 */

import { useState, useCallback } from 'react';

export interface AnalyticsData {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  assistantUsage: Record<string, number>;
  messagesPerDay: Array<{ date: string; count: number }>;
  costOverTime: Array<{ date: string; cost: number }>;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

interface UseAnalyticsOptions {
  userId?: string;
}

export function useAnalytics({ userId }: UseAnalyticsOptions) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(
    async (timeRange: TimeRange = 'month') => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/ai-workspace/analytics?timeRange=${timeRange}`, {
          headers: {
            'x-user-id': userId,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.error || 'Failed to fetch analytics');
        }
      } catch (err: any) {
        setError(err);
        console.error('[useAnalytics] Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
  };
}

