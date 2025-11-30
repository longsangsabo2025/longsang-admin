import { useUserBehavior } from '@/brain/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserBehaviorChartProps {
  hours?: number;
}

export function UserBehaviorChart({ hours = 24 }: UserBehaviorChartProps) {
  const { data: behavior, isLoading } = useUserBehavior(hours);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!behavior || behavior.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No behavior data available</p>;
  }

  const chartData = behavior.map((b) => ({
    name: b.event_type,
    count: b.event_count,
    avgPerDay: b.avg_per_day,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Behavior</CardTitle>
        <CardDescription>Event distribution by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


