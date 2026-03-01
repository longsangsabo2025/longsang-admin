import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Film, Loader2, Tv, XCircle } from 'lucide-react';
import { videoFactoryService } from '@/services/video-factory.service';

export const StatsCards = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['video-factory', 'stats'],
    queryFn: () => videoFactoryService.getStats(),
    refetchInterval: 5000,
  });

  const { data: capacity } = useQuery({
    queryKey: ['video-factory', 'capacity'],
    queryFn: () => videoFactoryService.getCapacity(),
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsConfig = [
    { label: 'In Queue', value: stats?.total_in_queue || 0, icon: Clock, color: 'text-blue-500' },
    { label: 'Processing', value: stats?.processing || 0, icon: Loader2, color: 'text-yellow-500' },
    { label: 'Completed', value: stats?.completed_today || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Failed', value: stats?.failed_today || 0, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Card className={capacity?.video?.available === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-green-500/50 bg-green-500/5'}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Video Slots</CardTitle>
          <Film className={capacity?.video?.available === 0 ? 'h-4 w-4 text-yellow-500' : 'h-4 w-4 text-green-500'} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {capacity?.video?.current || 0}/{capacity?.video?.limit || 4}
          </div>
          <p className="text-xs text-muted-foreground">
            {capacity?.video?.available || 4} available
          </p>
        </CardContent>
      </Card>

      <Card className={capacity?.image?.available === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-purple-500/50 bg-purple-500/5'}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Image Slots</CardTitle>
          <Tv className={capacity?.image?.available === 0 ? 'h-4 w-4 text-yellow-500' : 'h-4 w-4 text-purple-500'} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {capacity?.image?.current || 0}/{capacity?.image?.limit || 8}
          </div>
          <p className="text-xs text-muted-foreground">
            {capacity?.image?.available || 8} available
          </p>
        </CardContent>
      </Card>

      {statsConfig.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
