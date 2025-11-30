/**
 * Domain Statistics Component
 * Statistics dashboard for domain analytics
 */

import { useDomainAnalytics, useDomainStats, useDomainTrends } from '@/brain/hooks/useDomainStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Search,
  Tag,
  Activity,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DomainStatisticsProps {
  readonly domainId: string;
}

export function DomainStatistics({ domainId }: DomainStatisticsProps) {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDomainStats(domainId);
  const { data: analytics, isLoading: analyticsLoading } = useDomainAnalytics(domainId, 30);
  const { data: trends, isLoading: trendsLoading } = useDomainTrends(domainId);

  if (statsLoading || analyticsLoading || trendsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domain Statistics</h2>
          <p className="text-muted-foreground">Analytics and insights for this domain</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchStats()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Knowledge</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalKnowledge || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>This month: {stats?.thisMonth || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-3xl">{stats?.thisWeek || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>New items added</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Queries</CardDescription>
            <CardTitle className="text-3xl">{stats?.totalQueries || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Search activity</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique Tags</CardDescription>
            <CardTitle className="text-3xl">{stats?.uniqueTags || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>Tagged items</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trend */}
      {trends && (
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend</CardTitle>
            <CardDescription>Knowledge growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {(() => {
                  if (trends.growth.direction === 'up') {
                    return <TrendingUp className="h-5 w-5 text-green-500" />;
                  }
                  if (trends.growth.direction === 'down') {
                    return <TrendingDown className="h-5 w-5 text-red-500" />;
                  }
                  return <Minus className="h-5 w-5 text-gray-500" />;
                })()}
                <span className="text-2xl font-bold">
                  {trends.growth.rate > 0 ? '+' : ''}
                  {trends.growth.rate.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Current: {trends.growth.current} items</p>
                <p>Previous: {trends.growth.previous} items</p>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={trends.activity.level === 'very_active' ? 'default' : 'secondary'}>
                Activity: {trends.activity.level.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Tags */}
      {stats && stats.topTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
            <CardDescription>Most frequently used tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map((tag) => (
                <Badge key={tag.tag} variant="secondary" className="text-sm">
                  {tag.tag} ({tag.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {trends && trends.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>AI-generated insights about this domain</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {trends.insights.map((insight) => (
                <li key={insight} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Summary</CardTitle>
            <CardDescription>Last {analytics.period.days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Knowledge</p>
                <p className="text-2xl font-bold">{analytics.summary.totalKnowledge}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Queries</p>
                <p className="text-2xl font-bold">{analytics.summary.totalQueries}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Queries/Day</p>
                <p className="text-2xl font-bold">
                  {analytics.summary.avgQueriesPerDay.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Active Day</p>
                <p className="text-lg font-semibold">
                  {analytics.summary.mostActiveDay
                    ? new Date(analytics.summary.mostActiveDay.date).toLocaleDateString()
                    : 'N/A'}
                </p>
                {analytics.summary.mostActiveDay && (
                  <p className="text-sm text-muted-foreground">
                    {analytics.summary.mostActiveDay.count} queries
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
