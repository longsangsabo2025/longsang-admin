/**
 * Academy - Leaderboard Page
 * Shows global and course-specific leaderboards
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GamingSidebar } from '@/components/academy/gaming/GamingSidebar';
import { GamingRightSidebar } from '@/components/academy/gaming/GamingRightSidebar';
import { useGamification } from '@/hooks/useGamification';
import { Trophy, Medal, Crown, Flame, Star, TrendingUp, Users, Zap, Award } from 'lucide-react';

export default function AcademyLeaderboard() {
  const [selectedTab, setSelectedTab] = useState('global');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>(
    'weekly'
  );

  const { leaderboard, isLoadingLeaderboard, xpSummary, badges } = useGamification();

  // Get user's rank (mock - should come from API)
  const userRank = leaderboard?.findIndex((u) => u.isCurrentUser) ?? -1;

  return (
    <div className="min-h-screen bg-background">
      <GamingSidebar />

      <main className="ml-0 xl:ml-[280px] mr-0 xl:mr-[300px] pt-[70px] px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gaming-gradient mb-2">🏆 Leaderboard</h1>
          <p className="text-muted-foreground">Compete with others and climb the ranks!</p>
        </div>

        {/* Your Rank Card */}
        <Card className="glass-card border-gaming-gold/30 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gaming-purple to-gaming-cyan flex items-center justify-center text-2xl font-bold">
                    #{userRank >= 0 ? userRank + 1 : '?'}
                  </div>
                  {userRank < 3 && userRank >= 0 && (
                    <Crown className="absolute -top-2 -right-2 h-6 w-6 text-gaming-gold" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Ranking</h3>
                  <p className="text-muted-foreground">
                    Level {xpSummary?.level || 1} • {xpSummary?.total_xp?.toLocaleString() || 0} XP
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <Zap className="h-6 w-6 mx-auto text-gaming-purple mb-1" />
                  <p className="text-xl font-bold">{xpSummary?.total_xp || 0}</p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
                <div className="text-center">
                  <Award className="h-6 w-6 mx-auto text-gaming-cyan mb-1" />
                  <p className="text-xl font-bold">{badges?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
                <div className="text-center">
                  <Trophy className="h-6 w-6 mx-auto text-gaming-gold mb-1" />
                  <p className="text-xl font-bold">#{userRank >= 0 ? userRank + 1 : '-'}</p>
                  <p className="text-xs text-muted-foreground">Rank</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'daily', label: 'Today' },
            { value: 'weekly', label: 'This Week' },
            { value: 'monthly', label: 'This Month' },
            { value: 'all_time', label: 'All Time' },
          ].map((period) => (
            <Button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              className={
                selectedPeriod === period.value
                  ? 'bg-gaming-purple hover:bg-gaming-purple/80'
                  : 'glass-card'
              }
              size="sm"
            >
              {period.label}
            </Button>
          ))}
        </div>

        {/* Leaderboard Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="global" className="gap-2">
              <Trophy className="h-4 w-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="xp" className="gap-2">
              <Zap className="h-4 w-4" />
              XP Leaders
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-2">
              <Flame className="h-4 w-4" />
              Streak Kings
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {/* Top 3 Podium */}
            {!isLoadingLeaderboard && leaderboard && leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <PodiumCard user={leaderboard[1]} position={2} color="text-gray-400" />
                {/* 1st Place */}
                <PodiumCard user={leaderboard[0]} position={1} color="text-gaming-gold" isFirst />
                {/* 3rd Place */}
                <PodiumCard user={leaderboard[2]} position={3} color="text-amber-700" />
              </div>
            )}

            {/* Leaderboard List */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingLeaderboard ? (
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : !leaderboard || leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No rankings yet. Be the first to earn XP!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(3).map((user, index) => (
                      <LeaderboardRow
                        key={user.user_id || index}
                        user={user}
                        position={index + 4}
                        isCurrentUser={user.isCurrentUser}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <GamingRightSidebar />
    </div>
  );
}

// Podium Card for Top 3
function PodiumCard({
  user,
  position,
  color,
  isFirst,
}: {
  user: any;
  position: number;
  color: string;
  isFirst?: boolean;
}) {
  const Icon = position === 1 ? Crown : position === 2 ? Medal : Trophy;

  return (
    <Card className={`glass-card ${isFirst ? 'border-gaming-gold/50 -mt-4' : ''}`}>
      <CardContent className="p-6 text-center">
        <div className="relative inline-block mb-4">
          <Avatar className={`h-20 w-20 ${isFirst ? 'h-24 w-24' : ''}`}>
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-gaming-purple to-gaming-cyan text-xl">
              {user.display_name?.[0] || user.email?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
              position === 1 ? 'bg-gaming-gold' : position === 2 ? 'bg-gray-400' : 'bg-amber-700'
            }`}
          >
            <span className="text-black font-bold">{position}</span>
          </div>
        </div>

        <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />

        <h3 className="font-semibold truncate">
          {user.display_name || user.email?.split('@')[0] || 'Anonymous'}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">Level {user.level || 1}</p>
        <Badge className="bg-gaming-purple/20 text-gaming-purple border-gaming-purple/30">
          <Zap className="h-3 w-3 mr-1" />
          {user.total_xp?.toLocaleString() || 0} XP
        </Badge>
      </CardContent>
    </Card>
  );
}

// Leaderboard Row
function LeaderboardRow({
  user,
  position,
  isCurrentUser,
}: {
  user: any;
  position: number;
  isCurrentUser?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
        isCurrentUser ? 'bg-gaming-purple/20 border border-gaming-purple/30' : 'hover:bg-muted/50'
      }`}
    >
      <div className="w-8 text-center font-bold text-muted-foreground">#{position}</div>

      <Avatar>
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="bg-gradient-to-br from-gaming-purple/50 to-gaming-cyan/50">
          {user.display_name?.[0] || user.email?.[0] || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-medium">
          {user.display_name || user.email?.split('@')[0] || 'Anonymous'}
          {isCurrentUser && (
            <Badge variant="outline" className="ml-2 text-xs">
              You
            </Badge>
          )}
        </p>
        <p className="text-sm text-muted-foreground">Level {user.level || 1}</p>
      </div>

      <div className="flex items-center gap-4">
        {user.streak_days > 0 && (
          <div className="flex items-center gap-1 text-gaming-orange">
            <Flame className="h-4 w-4" />
            <span className="text-sm">{user.streak_days}</span>
          </div>
        )}
        <Badge className="bg-gaming-purple/20 text-gaming-purple border-gaming-purple/30">
          <Zap className="h-3 w-3 mr-1" />
          {user.total_xp?.toLocaleString() || 0}
        </Badge>
      </div>
    </div>
  );
}
