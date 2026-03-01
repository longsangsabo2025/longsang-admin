/**
 * Gamification Service - XP, Badges, Streaks, Leaderboard
 * Elon Musk Academy - Making Learning Addictive
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface XPAction {
  id: string;
  action_key: string;
  action_name: string;
  xp_amount: number;
  description: string;
  icon: string;
  max_daily: number | null;
}

export interface UserXPSummary {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement_type: string;
  requirement_value: Record<string, any>;
  xp_reward: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  rank: number;
  courses_completed: number;
  lessons_completed: number;
  user?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface LearningStreak {
  streak_date: string;
  minutes_learned: number;
  lessons_completed: number;
}

// ═══════════════════════════════════════════════════════════════
// XP LEVEL CALCULATION
// ═══════════════════════════════════════════════════════════════

export function calculateLevel(totalXP: number): {
  level: number;
  xpInLevel: number;
  xpToNext: number;
} {
  // Level formula: Each level requires 100 * level XP
  // Level 1: 0-100, Level 2: 100-300, Level 3: 300-600, etc.
  let level = 1;
  let xpRequired = 100;
  let xpAccumulated = 0;

  while (totalXP >= xpAccumulated + xpRequired) {
    xpAccumulated += xpRequired;
    level++;
    xpRequired = 100 * level;
  }

  return {
    level,
    xpInLevel: totalXP - xpAccumulated,
    xpToNext: xpRequired,
  };
}

// ═══════════════════════════════════════════════════════════════
// GAMIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class GamificationService {
  /**
   * Award XP to user for an action
   */
  static async awardXP(
    actionKey: string,
    relatedId?: string,
    relatedType?: string
  ): Promise<{ xpEarned: number; newLevel?: number; levelUp: boolean }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get XP action
      const { data: action, error: actionError } = await supabase
        .from('xp_actions')
        .select('*')
        .eq('action_key', actionKey)
        .eq('is_active', true)
        .single();

      if (actionError || !action) {
        logger.warn('XP action not found', { actionKey });
        return { xpEarned: 0, levelUp: false };
      }

      // Check daily limit
      if (action.max_daily) {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('user_xp_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('action_id', action.id)
          .gte('earned_at', `${today}T00:00:00`);

        if (count && count >= action.max_daily) {
          logger.info('Daily XP limit reached', { actionKey, limit: action.max_daily });
          return { xpEarned: 0, levelUp: false };
        }
      }

      // Log XP
      await supabase.from('user_xp_log').insert({
        user_id: user.id,
        action_id: action.id,
        xp_earned: action.xp_amount,
        related_id: relatedId,
        related_type: relatedType,
      });

      // Update or create user summary
      const { data: summary } = await supabase
        .from('user_xp_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const oldLevel = summary?.current_level || 1;
      const newTotalXP = (summary?.total_xp || 0) + action.xp_amount;
      const { level: newLevel, xpToNext } = calculateLevel(newTotalXP);

      if (summary) {
        await supabase
          .from('user_xp_summary')
          .update({
            total_xp: newTotalXP,
            current_level: newLevel,
            xp_to_next_level: xpToNext,
            last_activity_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase.from('user_xp_summary').insert({
          user_id: user.id,
          total_xp: newTotalXP,
          current_level: newLevel,
          xp_to_next_level: xpToNext,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: new Date().toISOString().split('T')[0],
        });
      }

      const levelUp = newLevel > oldLevel;

      logger.info('XP awarded', {
        userId: user.id,
        action: actionKey,
        xpEarned: action.xp_amount,
        newTotal: newTotalXP,
        levelUp,
      });

      // Check for badge unlocks
      await this.checkBadgeUnlocks(user.id);

      return {
        xpEarned: action.xp_amount,
        newLevel: levelUp ? newLevel : undefined,
        levelUp,
      };
    } catch (error) {
      logger.error('Failed to award XP', error);
      return { xpEarned: 0, levelUp: false };
    }
  }

  /**
   * Get user's XP summary
   */
  static async getUserXPSummary(): Promise<UserXPSummary | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_xp_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create default summary
        const { data: newSummary } = await supabase
          .from('user_xp_summary')
          .insert({
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            xp_to_next_level: 100,
            current_streak: 0,
            longest_streak: 0,
          })
          .select()
          .single();

        return newSummary;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get XP summary', error);
      return null;
    }
  }

  /**
   * Update learning streak
   */
  static async updateStreak(minutesLearned: number, lessonsCompleted: number): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Upsert today's streak
      await supabase.from('learning_streaks').upsert(
        {
          user_id: user.id,
          streak_date: today,
          minutes_learned: minutesLearned,
          lessons_completed: lessonsCompleted,
        },
        { onConflict: 'user_id,streak_date' }
      );

      // Calculate streak count
      const { data: streaks } = await supabase
        .from('learning_streaks')
        .select('streak_date')
        .eq('user_id', user.id)
        .order('streak_date', { ascending: false })
        .limit(60);

      if (!streaks || streaks.length === 0) return;

      // Count consecutive days
      let streakCount = 0;
      let currentDate = new Date();

      for (const streak of streaks) {
        const streakDate = new Date(streak.streak_date);
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - streakCount);
        expectedDate.setHours(0, 0, 0, 0);
        streakDate.setHours(0, 0, 0, 0);

        if (streakDate.getTime() === expectedDate.getTime()) {
          streakCount++;
        } else {
          break;
        }
      }

      // Update user summary
      const { data: summary } = await supabase
        .from('user_xp_summary')
        .select('longest_streak')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('user_xp_summary')
        .update({
          current_streak: streakCount,
          longest_streak: Math.max(summary?.longest_streak || 0, streakCount),
          last_activity_date: today,
        })
        .eq('user_id', user.id);

      // Award streak bonuses
      if (streakCount === 3) {
        await this.awardXP('streak_3');
      } else if (streakCount === 7) {
        await this.awardXP('streak_7');
      } else if (streakCount === 30) {
        await this.awardXP('streak_30');
      }

      logger.info('Streak updated', { userId: user.id, streakCount });
    } catch (error) {
      logger.error('Failed to update streak', error);
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(): Promise<UserBadge[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(
          `
          *,
          badge:badges(*)
        `
        )
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get user badges', error);
      return [];
    }
  }

  /**
   * Get all available badges
   */
  static async getAllBadges(): Promise<Badge[]> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('rarity', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get badges', error);
      return [];
    }
  }

  /**
   * Check and award badges
   */
  static async checkBadgeUnlocks(userId: string): Promise<Badge[]> {
    try {
      const earnedBadges: Badge[] = [];

      // Get all badges and user's current badges
      const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
        supabase.from('badges').select('*').eq('is_active', true),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId),
      ]);

      const earnedBadgeIds = new Set(userBadges?.map((b) => b.badge_id) || []);

      // Get user stats for checking requirements
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId);

      const { data: xpSummary } = await supabase
        .from('user_xp_summary')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('percentage')
        .eq('user_id', userId)
        .eq('passed', true);

      const stats = {
        lessons_completed: analytics?.reduce((sum, a) => sum + a.lessons_completed, 0) || 0,
        courses_completed:
          analytics?.filter((a) => a.lessons_completed >= a.lessons_total).length || 0,
        perfect_quizzes: quizAttempts?.filter((q) => q.percentage === 100).length || 0,
        streak_days: xpSummary?.longest_streak || 0,
        reviews_given: 0, // TODO: count from course_reviews
        helpful_replies: 0, // TODO: count from discussion_replies
        certificates: 0, // TODO: count from course_certificates
      };

      for (const badge of allBadges || []) {
        if (earnedBadgeIds.has(badge.id)) continue;

        const req = badge.requirement_value as Record<string, any>;
        let earned = false;

        switch (badge.requirement_type) {
          case 'lessons_completed':
            earned = stats.lessons_completed >= (req.min || 0);
            break;
          case 'courses_completed':
            earned = stats.courses_completed >= (req.min || 0);
            break;
          case 'perfect_quizzes':
            earned = stats.perfect_quizzes >= (req.min || 0);
            break;
          case 'streak_days':
            earned = stats.streak_days >= (req.min || 0);
            break;
          case 'reviews_given':
            earned = stats.reviews_given >= (req.min || 0);
            break;
          case 'helpful_replies':
            earned = stats.helpful_replies >= (req.min || 0);
            break;
          case 'certificates':
            earned = stats.certificates >= (req.min || 0);
            break;
          case 'registration_date':
            // Early bird badge
            if (req.before) {
              earned = new Date() < new Date(req.before);
            }
            break;
        }

        if (earned) {
          await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id,
          });

          // Award XP for badge
          if (badge.xp_reward > 0) {
            await supabase.from('user_xp_log').insert({
              user_id: userId,
              action_id: (
                await supabase
                  .from('xp_actions')
                  .select('id')
                  .eq('action_key', 'daily_login')
                  .single()
              ).data?.id,
              xp_earned: badge.xp_reward,
              related_id: badge.id,
              related_type: 'badge',
            });
          }

          earnedBadges.push(badge);
          logger.info('Badge earned', { userId, badge: badge.badge_key });
        }
      }

      return earnedBadges;
    } catch (error) {
      logger.error('Failed to check badge unlocks', error);
      return [];
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(
    period: 'weekly' | 'monthly' | 'all-time' = 'weekly',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('user_xp_summary')
        .select(
          `
          user_id,
          total_xp,
          current_level
        `
        )
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((entry, index) => ({
        user_id: entry.user_id,
        total_xp: entry.total_xp,
        rank: index + 1,
        courses_completed: 0,
        lessons_completed: 0,
      }));
    } catch (error) {
      logger.error('Failed to get leaderboard', error);
      return [];
    }
  }

  /**
   * Get XP history for a user
   */
  static async getXPHistory(days: number = 30): Promise<{ date: string; xp: number }[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_xp_log')
        .select('xp_earned, earned_at')
        .eq('user_id', user.id)
        .gte('earned_at', startDate.toISOString())
        .order('earned_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const byDate = new Map<string, number>();
      for (const entry of data || []) {
        const date = entry.earned_at.split('T')[0];
        byDate.set(date, (byDate.get(date) || 0) + entry.xp_earned);
      }

      return Array.from(byDate.entries()).map(([date, xp]) => ({ date, xp }));
    } catch (error) {
      logger.error('Failed to get XP history', error);
      return [];
    }
  }
}
