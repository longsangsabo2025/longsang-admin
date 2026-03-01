/**
 * AnalyticsTab - Analytics tab content
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { PLATFORMS } from './constants';
import { formatNumber } from './utils';
import type { Campaign, MarketingStats } from './types';

interface AnalyticsTabProps {
  stats: MarketingStats;
  campaigns: Campaign[];
}

export function AnalyticsTab({ stats, campaigns }: AnalyticsTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Hiệu suất chiến dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tổng tiếp cận</span>
              <span className="font-bold text-lg">{formatNumber(stats.totalReach)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tổng tương tác</span>
              <span className="font-bold text-lg">{formatNumber(stats.totalEngagement)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tỉ lệ tương tác</span>
              <span className="font-bold text-lg">
                {stats.totalReach > 0 ? ((stats.totalEngagement / stats.totalReach) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Phân bổ nền tảng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PLATFORMS.slice(0, 4).map((platform) => {
              const Icon = platform.icon;
              const count = campaigns.filter(c => c.platforms.includes(platform.id)).length;
              const percentage = campaigns.length > 0 ? (count / campaigns.length) * 100 : 0;

              return (
                <div key={platform.id} className="flex items-center gap-3">
                  <Icon className="h-4 w-4" style={{ color: platform.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{platform.name}</span>
                      <span className="text-muted-foreground">{count} chiến dịch</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: platform.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
