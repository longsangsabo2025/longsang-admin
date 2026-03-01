import {
  useUserBehavior,
  useSystemMetrics,
  useQueryPatterns,
  useDailyUserActivity,
} from '@/brain/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp, Activity, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;

  const { data: userBehavior, isLoading: isLoadingBehavior } = useUserBehavior(hours);
  const { data: systemMetrics, isLoading: isLoadingMetrics } = useSystemMetrics(hours);
  const { data: queryPatterns, isLoading: isLoadingPatterns } = useQueryPatterns(days);
  const { data: dailyActivity, isLoading: isLoadingActivity } = useDailyUserActivity(days);

  if (isLoadingBehavior || isLoadingMetrics || isLoadingPatterns || isLoadingActivity) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics?.total_queries?.value || 0}</div>
            <p className="text-xs text-muted-foreground">Queries in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.avg_query_response_time?.value?.toFixed(0) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">Average query response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.unique_active_users?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unique active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Patterns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queryPatterns?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Unique patterns detected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Behavior</CardTitle>
          <CardDescription>Event breakdown by type</CardDescription>
        </CardHeader>
        <CardContent>
          {userBehavior && userBehavior.length > 0 ? (
            <div className="space-y-2">
              {userBehavior.map((behavior) => (
                <div
                  key={behavior.event_type}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm font-medium">{behavior.event_type}</span>
                  <div className="flex items-center gap-2">
                    <Badge>{behavior.event_count} events</Badge>
                    <span className="text-xs text-muted-foreground">
                      {behavior.avg_per_day.toFixed(1)}/day
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No behavior data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyActivity && dailyActivity.length > 0 ? (
            <div className="space-y-2">
              {dailyActivity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <span>{activity.date}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{activity.event_type}</Badge>
                    <span>{activity.event_count} events</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No activity data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
