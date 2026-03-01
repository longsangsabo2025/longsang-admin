/**
 * Academy - Learning Stats Page
 * Shows detailed learning statistics and analytics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GamingSidebar } from '@/components/academy/gaming/GamingSidebar';
import { GamingRightSidebar } from '@/components/academy/gaming/GamingRightSidebar';
import { useUserEnrollments, useUserStats } from '@/hooks/useAcademy';
import { useGamification } from '@/hooks/useGamification';
import {
  BarChart3,
  BookOpen,
  Clock,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  Zap,
  Award,
  Star,
  CheckCircle,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AcademyStats() {
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useUserEnrollments();
  const { data: statsData, isLoading: loadingStats } = useUserStats();
  const { xpSummary, badges, streak, xpHistory } = useGamification();

  const enrollments = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.data || [];

  const stats = statsData || {
    total_enrollments: 0,
    completed_courses: 0,
    total_watch_time: 0,
    certificates_earned: 0,
  };

  const isLoading = loadingEnrollments || loadingStats;

  // Calculate additional stats
  const inProgressCount = enrollments.filter((e) => !e.completed_at && e.progress > 0).length;
  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
      : 0;

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Generate weekly activity data (mock for now)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyActivity = weekDays.map((day) => ({
    day: format(day, 'EEE', { locale: vi }),
    hours: Math.random() * 3, // Mock data - should come from actual data
  }));

  return (
    <div className="min-h-screen bg-background">
      <GamingSidebar />

      <main className="ml-0 xl:ml-[280px] mr-0 xl:mr-[300px] pt-[70px] px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gaming-gradient mb-2">📊 Learning Statistics</h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Zap}
                label="Total XP"
                value={xpSummary?.total_xp?.toLocaleString() || '0'}
                color="gaming-purple"
              />
              <StatCard
                icon={Trophy}
                label="Level"
                value={xpSummary?.level || 1}
                color="gaming-gold"
              />
              <StatCard
                icon={Flame}
                label="Day Streak"
                value={streak?.current_streak || 0}
                color="gaming-orange"
              />
              <StatCard
                icon={Award}
                label="Badges"
                value={badges?.length || 0}
                color="gaming-cyan"
              />
            </div>

            {/* Course Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gaming-purple" />
                    Course Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gaming-purple/10">
                      <p className="text-3xl font-bold text-gaming-purple">
                        {stats.total_enrollments}
                      </p>
                      <p className="text-sm text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gaming-green/10">
                      <p className="text-3xl font-bold text-gaming-green">
                        {stats.completed_courses}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Average Progress</span>
                      <span className="text-sm font-medium">{averageProgress}%</span>
                    </div>
                    <Progress value={averageProgress} className="h-3" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-gaming-cyan" />
                      <span>In Progress</span>
                    </div>
                    <span className="font-bold text-gaming-cyan">{inProgressCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Time Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gaming-cyan" />
                    Learning Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-gaming-cyan/20 to-gaming-purple/20">
                    <p className="text-4xl font-bold">{formatWatchTime(stats.total_watch_time)}</p>
                    <p className="text-sm text-muted-foreground mt-2">Total Watch Time</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-4">This Week</h4>
                    <div className="flex items-end justify-between gap-2 h-24">
                      {weeklyActivity.map((day, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-gaming-purple to-gaming-cyan"
                            style={{ height: `${Math.max(day.hours * 30, 8)}px` }}
                          />
                          <span className="text-xs text-muted-foreground">{day.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* XP & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* XP Progress */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gaming-gold" />
                    XP Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-gaming-purple/20 to-gaming-gold/20 mb-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold">{xpSummary?.level || 1}</p>
                        <p className="text-xs text-muted-foreground">LEVEL</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>XP: {xpSummary?.xp_in_level || 0}</span>
                      <span>{xpSummary?.xp_to_next || 100} to next level</span>
                    </div>
                    <Progress
                      value={
                        ((xpSummary?.xp_in_level || 0) /
                          ((xpSummary?.xp_in_level || 0) + (xpSummary?.xp_to_next || 100))) *
                        100
                      }
                      className="h-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-2 text-gaming-green" />
                      <p className="text-lg font-bold">{xpSummary?.total_xp || 0}</p>
                      <p className="text-xs text-muted-foreground">Total XP</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <Star className="h-5 w-5 mx-auto mb-2 text-gaming-gold" />
                      <p className="text-lg font-bold">{xpHistory?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">XP Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Streak & Badges */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-gaming-orange" />
                    Streaks & Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Streak */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-gaming-orange/20 to-gaming-red/20 text-center">
                    <Flame className="h-12 w-12 mx-auto mb-2 text-gaming-orange" />
                    <p className="text-4xl font-bold">{streak?.current_streak || 0}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                    {streak?.longest_streak && streak.longest_streak > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Best: {streak.longest_streak} days
                      </p>
                    )}
                  </div>

                  {/* Badges Preview */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium">Badges Earned</h4>
                      <a
                        href="/academy/leaderboard"
                        className="text-xs text-gaming-cyan hover:underline"
                      >
                        View All
                      </a>
                    </div>
                    {badges && badges.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {badges.slice(0, 6).map((badge, index) => (
                          <div
                            key={badge.id || index}
                            className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-2xl"
                            title={badge.name}
                          >
                            {badge.icon || '🏆'}
                          </div>
                        ))}
                        {badges.length > 6 && (
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-sm font-medium">
                            +{badges.length - 6}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Complete activities to earn badges!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Completions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gaming-green" />
                  Recent Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.filter((e) => e.completed_at).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No completed courses yet. Keep learning!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {enrollments
                      .filter((e) => e.completed_at)
                      .slice(0, 5)
                      .map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50"
                        >
                          <CheckCircle className="h-8 w-8 text-gaming-green" />
                          <div className="flex-1">
                            <p className="font-medium">{enrollment.course?.title || 'Course'}</p>
                            <p className="text-sm text-muted-foreground">
                              Completed{' '}
                              {format(new Date(enrollment.completed_at), 'dd MMM yyyy', {
                                locale: vi,
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gaming-gold">+100 XP</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <GamingRightSidebar />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className={`glass-card border-${color}/30`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}/20`}>
          <Icon className={`h-5 w-5 text-${color}`} />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}
