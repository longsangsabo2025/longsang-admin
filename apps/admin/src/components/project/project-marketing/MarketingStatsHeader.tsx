/**
 * MarketingStatsHeader - Header stats cards (5 cards)
 */

import { Card, CardContent } from '@/components/ui/card';
import {
  Megaphone,
  PlayCircle,
  Users,
  Heart,
  Clock,
} from 'lucide-react';
import { formatNumber } from './utils';
import type { MarketingStats } from './types';

interface MarketingStatsHeaderProps {
  stats: MarketingStats;
}

export function MarketingStatsHeader({ stats }: MarketingStatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Chiến dịch</p>
              <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
            </div>
            <Megaphone className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Đang chạy</p>
              <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
            </div>
            <PlayCircle className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tiếp cận</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalReach)}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tương tác</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalEngagement)}</p>
            </div>
            <Heart className="h-8 w-8 text-pink-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Chờ đăng</p>
              <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
