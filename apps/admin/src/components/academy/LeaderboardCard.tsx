/**
 * Leaderboard Component
 * Shows top XP earners and top revenue generators
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_xp?: number;
  current_level?: number;
  total_revenue?: number;
  rank: number;
}

export function LeaderboardCard() {
  const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [revenueLeaderboard, setRevenueLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();

    // Refresh every 5 minutes
    const interval = setInterval(loadLeaderboards, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboards = async () => {
    try {
      // Load XP Leaderboard from view
      const { data: xpData, error: xpError } = await supabase
        .from('leaderboard_xp')
        .select('*')
        .limit(10);

      if (xpError) {
        console.error('Error loading XP leaderboard:', xpError);
      } else {
        setXpLeaderboard(xpData || []);
      }

      // Load Revenue Leaderboard from view
      const { data: revenueData, error: revenueError } = await supabase
        .from('leaderboard_revenue')
        .select('*')
        .limit(10);

      if (revenueError) {
        console.error('Error loading revenue leaderboard:', revenueError);
      } else {
        setRevenueLeaderboard(revenueData || []);
      }
    } catch (error) {
      console.error('Error in loadLeaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-amber-500';
      case 2:
        return 'from-gray-400 to-gray-500';
      case 3:
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-purple-500 to-cyan-500';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900/50 border-purple-500/20">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h3 className="font-bold text-xl text-white">Leaderboard</h3>
      </div>

      <Tabs defaultValue="xp" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="xp" className="data-[state=active]:bg-purple-500">
            <Zap className="w-4 h-4 mr-2" />
            Top XP
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-green-500">
            <DollarSign className="w-4 h-4 mr-2" />
            Top Revenue
          </TabsTrigger>
        </TabsList>

        {/* XP Leaderboard */}
        <TabsContent value="xp" className="space-y-3 mt-4">
          {xpLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No students yet. Be the first!</p>
            </div>
          ) : (
            xpLeaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border
                  ${
                    entry.rank <= 3
                      ? `bg-gradient-to-r ${getRankColor(entry.rank)} border-transparent shadow-lg`
                      : 'bg-gray-800/50 border-gray-700'
                  }
                  hover:scale-[1.02] transition-transform cursor-pointer
                `}
              >
                {/* Rank */}
                <div className="text-2xl font-bold w-12 text-center">{getRankIcon(entry.rank)}</div>

                {/* Avatar */}
                <Avatar className="w-12 h-12 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-bold">
                    {entry.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-white">{entry.email.split('@')[0]}</p>
                  <p className="text-sm text-white/70">Level {entry.current_level}</p>
                </div>

                {/* XP */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Zap className="w-4 h-4" />
                    {entry.total_xp?.toLocaleString()}
                  </div>
                  <p className="text-xs text-white/50">XP</p>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Revenue Leaderboard */}
        <TabsContent value="revenue" className="space-y-3 mt-4">
          {revenueLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No revenue tracked yet. Start earning!</p>
            </div>
          ) : (
            revenueLeaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border
                  ${
                    entry.rank <= 3
                      ? `bg-gradient-to-r ${getRankColor(entry.rank)} border-transparent shadow-lg`
                      : 'bg-gray-800/50 border-gray-700'
                  }
                  hover:scale-[1.02] transition-transform cursor-pointer
                `}
              >
                {/* Rank */}
                <div className="text-2xl font-bold w-12 text-center">{getRankIcon(entry.rank)}</div>

                {/* Avatar */}
                <Avatar className="w-12 h-12 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold">
                    {entry.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-white">{entry.email.split('@')[0]}</p>
                  <p className="text-sm text-white/70">Entrepreneur</p>
                </div>

                {/* Revenue */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-400 font-bold">
                    <TrendingUp className="w-4 h-4" />${entry.total_revenue?.toLocaleString()}
                  </div>
                  <p className="text-xs text-white/50">Earned</p>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
