/**
 * Leaderboard Component
 * Display XP leaderboard with rankings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Star,
  Zap,
} from 'lucide-react';
import { useLeaderboard, useUserXP } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  limit = 10,
  showHeader = true,
  compact = false,
}) => {
  const [period, setPeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const { leaderboard, isLoading, refetch } = useLeaderboard(limit, period);
  const { user } = useAuth();
  const { xp, level } = useUserXP();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-mono w-5 text-center">{rank}</span>;
    }
  };

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return 'bg-gray-800/50 border-gray-700';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <ChevronUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <ChevronDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-700 rounded" />
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-16" />
                </div>
                <div className="h-6 bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      {showHeader && (
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <CardTitle className="text-white">Leaderboard</CardTitle>
            </div>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              {(['all', 'monthly', 'weekly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-colors',
                    period === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn('space-y-3', compact ? 'p-3' : 'p-6')}>
        {/* Current user highlight if not in top list */}
        {user && !leaderboard.some((e) => e.user_id === user.id) && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 font-mono w-8">--</span>
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user.user_metadata?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-white flex items-center gap-2">
                  {user.user_metadata?.full_name || 'You'}
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                </p>
                <p className="text-xs text-gray-400">Level {level}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatXP(xp)} XP</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard entries */}
        {leaderboard.map((entry, index) => {
          const isCurrentUser = user?.id === entry.user_id;
          const rank = index + 1;

          return (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg border transition-all',
                getRankBgClass(rank),
                isCurrentUser && 'ring-2 ring-primary'
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8">{getRankIcon(rank)}</div>

              {/* Avatar */}
              <Avatar
                className={cn(
                  'h-10 w-10 border-2',
                  rank === 1
                    ? 'border-yellow-500'
                    : rank === 2
                      ? 'border-gray-400'
                      : rank === 3
                        ? 'border-amber-600'
                        : 'border-gray-600'
                )}
              >
                <AvatarImage src={entry.avatar_url} />
                <AvatarFallback className="bg-gray-700 text-white">
                  {entry.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate flex items-center gap-2">
                  {entry.display_name || 'Anonymous'}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                  {rank === 1 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Level {entry.level}
                  </span>
                  {entry.streak_days > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" /> {entry.streak_days}d
                    </span>
                  )}
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <p
                  className={cn(
                    'font-bold',
                    rank === 1
                      ? 'text-yellow-500'
                      : rank === 2
                        ? 'text-gray-300'
                        : rank === 3
                          ? 'text-amber-500'
                          : 'text-white'
                  )}
                >
                  {formatXP(entry.total_xp)} XP
                </p>
                {entry.rank_change !== undefined && entry.rank_change !== 0 && (
                  <div className="flex items-center justify-end text-xs">
                    {getChangeIcon(entry.rank_change)}
                    <span className={cn(entry.rank_change > 0 ? 'text-green-500' : 'text-red-500')}>
                      {Math.abs(entry.rank_change)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No leaderboard data yet</p>
            <p className="text-sm">Start learning to climb the ranks!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mini leaderboard widget for sidebar
export const LeaderboardWidget: React.FC = () => {
  const { leaderboard, isLoading } = useLeaderboard(5);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-700 rounded-full" />
            <div className="flex-1 h-4 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.slice(0, 5).map((entry, index) => (
        <div
          key={entry.user_id}
          className={cn(
            'flex items-center gap-2 p-2 rounded',
            user?.id === entry.user_id ? 'bg-primary/10' : 'hover:bg-gray-800/50'
          )}
        >
          <span
            className={cn(
              'w-5 text-center text-xs font-bold',
              index === 0
                ? 'text-yellow-500'
                : index === 1
                  ? 'text-gray-400'
                  : index === 2
                    ? 'text-amber-600'
                    : 'text-gray-500'
            )}
          >
            {index + 1}
          </span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={entry.avatar_url} />
            <AvatarFallback className="text-xs bg-gray-700">
              {entry.display_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm text-white truncate">{entry.display_name}</span>
          <span className="text-xs text-gray-400">
            {entry.total_xp >= 1000 ? `${(entry.total_xp / 1000).toFixed(1)}K` : entry.total_xp}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
