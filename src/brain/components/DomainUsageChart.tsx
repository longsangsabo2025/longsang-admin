import { useDomainUsageStatistics } from '@/brain/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface DomainUsageChartProps {
  domainId: string;
  days?: number;
}

export function DomainUsageChart({ domainId, days = 7 }: DomainUsageChartProps) {
  const { data: stats, isLoading } = useDomainUsageStatistics(domainId, days);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No usage data available for this domain
      </p>
    );
  }

  const chartData = stats.map((s) => ({
    date: s.date,
    events: s.event_count,
    users: s.unique_users,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Usage</CardTitle>
        <CardDescription>Usage statistics over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="events" fill="#8884d8" name="Events" />
            <Bar dataKey="users" fill="#82ca9d" name="Users" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
