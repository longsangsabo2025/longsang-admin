/**
 * Gamification React Hook
 * Manage XP, badges, streaks, and leaderboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GamificationService,
  calculateLevel,
  type UserXPSummary,
  type Badge,
  type LeaderboardEntry,
} from '@/lib/academy/gamification.service';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [showBadgeUnlock, setShowBadgeUnlock] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);

  // Fetch user XP summary
  const {
    data: xpSummary,
    isLoading: xpLoading,
    error: xpError,
    refetch: refetchXP,
  } = useQuery({
    queryKey: ['gamification', 'xp', user?.id],
    queryFn: () => GamificationService.getUserXPSummary(),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  // Fetch user badges
  const {
    data: badges,
    isLoading: badgesLoading,
    refetch: refetchBadges,
  } = useQuery({
    queryKey: ['gamification', 'badges', user?.id],
    queryFn: () => GamificationService.getUserBadges(),
    enabled: !!user?.id,
  });

  // Fetch leaderboard
  const {
    data: leaderboard,
    isLoading: leaderboardLoading,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: () => GamificationService.getLeaderboard('weekly', 20),
    staleTime: 60000, // 1 minute
  });

  // Award XP mutation
  const awardXPMutation = useMutation({
    mutationFn: async ({
      actionCode,
      relatedId,
      relatedType,
    }: {
      actionCode: string;
      relatedId?: string;
      relatedType?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const oldLevel = xpSummary?.current_level || 1;
      const result = await GamificationService.awardXP(actionCode, relatedId, relatedType);
      return { result, oldLevel };
    },
    onSuccess: async ({ result, oldLevel }) => {
      if (result.levelUp && result.newLevel) {
        setNewLevel(result.newLevel);
        setShowLevelUp(true);
        toast.success(`🎉 Level Up! You're now Level ${result.newLevel}!`);
      } else if (result.xpEarned > 0) {
        toast.success(`+${result.xpEarned} XP earned!`);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
    onError: (error: any) => {
      console.error('Award XP error:', error);
      // Don't show error for daily limit - it's expected
      if (!error.message?.includes('Daily limit')) {
        toast.error('Failed to award XP');
      }
    },
  });

  // Update streak mutation
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return GamificationService.updateStreak(0, 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'xp'] });
    },
  });

  // Calculate XP progress percentage
  const xpProgress = useCallback(() => {
    if (!xpSummary) return 0;
    const { xpInLevel, xpToNext } = calculateLevel(xpSummary.total_xp || 0);
    if (xpToNext === 0) return 100;
    return Math.min(100, (xpInLevel / xpToNext) * 100);
  }, [xpSummary]);

  // Calculate XP to next level
  const xpToNextLevel = useCallback(() => {
    if (!xpSummary) return 100;
    const { xpToNext, xpInLevel } = calculateLevel(xpSummary.total_xp || 0);
    return xpToNext - xpInLevel;
  }, [xpSummary]);

  // Auto-update streak on mount
  useEffect(() => {
    if (user?.id) {
      updateStreakMutation.mutate();
    }
  }, [user?.id]);

  // Helper function for common XP actions
  const awardXPForAction = useCallback(
    (actionCode: string, relatedId?: string, relatedType?: string) => {
      awardXPMutation.mutate({ actionCode, relatedId, relatedType });
    },
    [awardXPMutation]
  );

  // Predefined action helpers
  const actions = {
    lessonComplete: (lessonId: string) => awardXPForAction('lesson_complete', lessonId, 'lesson'),

    quizPass: (quizId: string) => awardXPForAction('quiz_pass', quizId, 'quiz'),

    quizPerfect: (quizId: string) => awardXPForAction('quiz_perfect', quizId, 'quiz'),

    courseComplete: (courseId: string) => awardXPForAction('course_complete', courseId, 'course'),

    dailyLogin: () => awardXPForAction('daily_login'),

    firstReview: (reviewId: string) => awardXPForAction('first_review', reviewId, 'review'),

    firstDiscussion: (discussionId: string) =>
      awardXPForAction('first_discussion', discussionId, 'discussion'),

    helpfulReply: (replyId: string) => awardXPForAction('helpful_reply', replyId, 'reply'),
  };

  return {
    // Data
    xpSummary,
    badges,
    leaderboard,

    // Loading states
    isLoading: xpLoading || badgesLoading,
    xpLoading,
    badgesLoading,
    leaderboardLoading,

    // Errors
    xpError,

    // Computed values
    xpToNextLevel: xpToNextLevel(),
    xpProgress: xpProgress(),
    totalBadges: badges?.length || 0,
    currentStreak: xpSummary?.current_streak || 0,
    longestStreak: xpSummary?.longest_streak || 0,
    level: xpSummary?.current_level || 1,
    totalXP: xpSummary?.total_xp || 0,

    // Mutations
    awardXP: awardXPForAction,
    updateStreak: () => updateStreakMutation.mutate(),

    // Action helpers
    actions,

    // Refetch functions
    refetchXP,
    refetchBadges,
    refetchLeaderboard,
    refetchAll: () => {
      refetchXP();
      refetchBadges();
    },

    // UI state for celebrations
    showLevelUp,
    newLevel,
    dismissLevelUp: () => setShowLevelUp(false),
    showBadgeUnlock,
    unlockedBadge,
    dismissBadgeUnlock: () => {
      setShowBadgeUnlock(false);
      setUnlockedBadge(null);
    },
  };
}

// Simplified hook for just XP display
export function useUserXP() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['gamification', 'xp', user?.id],
    queryFn: () => GamificationService.getUserXPSummary(),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  return {
    xp: data?.total_xp || 0,
    level: data?.current_level || 1,
    isLoading,
  };
}

// Hook for leaderboard only
export function useLeaderboard(limit = 20, period: 'weekly' | 'monthly' | 'all-time' = 'weekly') {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gamification', 'leaderboard', limit, period],
    queryFn: () => GamificationService.getLeaderboard(period, limit),
    staleTime: 60000,
  });

  return {
    leaderboard: data || [],
    isLoading,
    error,
    refetch,
  };
}

// Hook for streak only
export function useStreak() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['gamification', 'xp', user?.id],
    queryFn: () => GamificationService.getUserXPSummary(),
    enabled: !!user?.id,
  });

  return {
    currentStreak: data?.current_streak || 0,
    longestStreak: data?.longest_streak || 0,
    lastActivityDate: data?.last_activity_date,
    isLoading,
  };
}

export default useGamification;
