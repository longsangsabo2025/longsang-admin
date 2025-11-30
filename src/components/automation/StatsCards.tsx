import { Card, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle, Clock, Zap, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DashboardStats } from '@/types/automation';

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading?: boolean;
}

export const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Agents',
      value: stats?.activeAgents || 0,
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Số lượng AI agents đang hoạt động và sẵn sàng xử lý tác vụ tự động',
    },
    {
      title: 'Actions Today',
      value: stats?.actionsToday || 0,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Tổng số hành động đã được thực hiện bởi các agents trong hôm nay',
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: 'Tỷ lệ thành công của 100 hành động gần nhất. Giá trị cao cho thấy hệ thống hoạt động ổn định',
    },
    {
      title: 'Queue Size',
      value: stats?.queueSize || 0,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      description: 'Số lượng nội dung đang chờ xử lý hoặc đã được lên lịch để xuất bản',
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-help">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-muted-foreground font-medium">
                            {stat.title}
                          </p>
                          <Info className="w-3 h-3 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-3xl font-bold">{stat.value}</h3>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{stat.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
