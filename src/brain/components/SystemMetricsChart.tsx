import { useSystemMetrics } from '@/brain/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SystemMetricsChartProps {
  hours?: number;
}

export function SystemMetricsChart({ hours = 24 }: SystemMetricsChartProps) {
  const { data: metrics, isLoading } = useSystemMetrics(hours);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!metrics) {
    return <p className="text-muted-foreground text-center py-4">No metrics data available</p>;
  }

  // For now, show a simple representation
  // In a real implementation, you'd have time-series data
  const chartData = [
    {
      name: 'Response Time',
      value: metrics.avg_query_response_time?.value || 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Performance</CardTitle>
        <CardDescription>Key performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Average Response Time</span>
            <span className="font-bold">
              {metrics.avg_query_response_time?.value?.toFixed(0) || 0}ms
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Queries</span>
            <span className="font-bold">{metrics.total_queries?.value || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Users</span>
            <span className="font-bold">{metrics.unique_active_users?.value || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
