/**
 * XP & Level Progress Display Component
 * Show user's XP, level, and progress to next level
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Star, Trophy, TrendingUp, Flame, Target } from 'lucide-react';
import { useGamification, useUserXP, useStreak } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

interface XPDisplayProps {
  variant?: 'full' | 'compact' | 'minimal';
  showStreak?: boolean;
  className?: string;
}

export const XPDisplay: React.FC<XPDisplayProps> = ({
  variant = 'full',
  showStreak = true,
  className,
}) => {
  const { xpSummary, xpProgress, xpToNextLevel, currentStreak, isLoading } = useGamification();

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
        <div className="h-2 bg-gray-700 rounded w-full" />
      </div>
    );
  }

  // Minimal variant - just XP and level
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1 text-yellow-500">
          <Zap className="h-4 w-4" />
          <span className="font-bold">{formatXP(xpSummary?.total_xp || 0)}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          Lv.{xpSummary?.level || 1}
        </Badge>
      </div>
    );
  }

  // Compact variant - progress bar with XP
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/20 rounded">
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="font-medium text-white">Level {xpSummary?.level || 1}</span>
          </div>
          <span className="text-gray-400">{formatXP(xpSummary?.total_xp || 0)} XP</span>
        </div>
        <div className="relative">
          <Progress value={xpProgress} className="h-2" />
          <span className="absolute right-0 top-3 text-xs text-gray-500">
            {formatXP(xpToNextLevel)} to next level
          </span>
        </div>
      </div>
    );
  }

  // Full variant - detailed card
  return (
    <Card className={cn('bg-gray-900/50 border-gray-800', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level display */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border-4 border-yellow-500/30">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{xpSummary?.level || 1}</p>
                <p className="text-xs text-gray-400">LEVEL</p>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className="bg-yellow-500 text-black font-bold">
                <Star className="h-3 w-3 mr-1" />
                {formatXP(xpSummary?.total_xp || 0)} XP
              </Badge>
            </div>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress to Level {(xpSummary?.level || 1) + 1}</span>
            <span className="text-white font-medium">{Math.round(xpProgress)}%</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <p className="text-xs text-gray-500 text-center">
            {formatXP(xpToNextLevel)} XP needed for next level
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{formatXP(xpSummary?.weekly_xp || 0)}</p>
            <p className="text-xs text-gray-400">This Week</p>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <Target className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{formatXP(xpSummary?.monthly_xp || 0)}</p>
            <p className="text-xs text-gray-400">This Month</p>
          </div>
          {showStreak && (
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <Flame
                className={cn(
                  'h-5 w-5 mx-auto mb-1',
                  currentStreak > 0 ? 'text-orange-500' : 'text-gray-500'
                )}
              />
              <p className="text-lg font-bold text-white">{currentStreak}</p>
              <p className="text-xs text-gray-400">Day Streak</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Standalone streak display
export const StreakDisplay: React.FC<{ className?: string }> = ({ className }) => {
  const { currentStreak, longestStreak, isLoading } = useStreak();

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-gray-700 rounded w-20" />;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-full',
          currentStreak > 0
            ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30'
            : 'bg-gray-800'
        )}
      >
        <Flame className={cn('h-5 w-5', currentStreak > 0 ? 'text-orange-500' : 'text-gray-500')} />
        <span className={cn('font-bold', currentStreak > 0 ? 'text-orange-500' : 'text-gray-500')}>
          {currentStreak}
        </span>
        <span className="text-sm text-gray-400">day streak</span>
      </div>
      {longestStreak > currentStreak && (
        <span className="text-xs text-gray-500">Best: {longestStreak}</span>
      )}
    </div>
  );
};

// Level up celebration modal
interface LevelUpCelebrationProps {
  level: number;
  isOpen: boolean;
  onClose: () => void;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  level,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-sm w-full text-center animate-bounce-in border border-yellow-500/30">
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center animate-pulse">
            <div className="w-28 h-28 rounded-full bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <Star className="h-10 w-10 text-yellow-500 mx-auto mb-1" />
                <p className="text-4xl font-bold text-yellow-500">{level}</p>
              </div>
            </div>
          </div>

          {/* Confetti effect placeholder */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6'][i % 4],
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">🎉 Level Up!</h2>
        <p className="text-gray-400 mb-6">
          Congratulations! You've reached{' '}
          <span className="text-yellow-500 font-bold">Level {level}</span>!
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Awesome! 🚀
        </button>
      </div>
    </div>
  );
};

export default XPDisplay;
