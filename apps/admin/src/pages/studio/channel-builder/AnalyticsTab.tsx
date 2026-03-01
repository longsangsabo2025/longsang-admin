/**
 * Analytics Tab - Channel analytics and statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  Eye,
  Heart,
  BarChart3,
} from 'lucide-react';
import { PLATFORM_CONFIG, type Channel } from './types';

interface AnalyticsTabProps {
  channels: Channel[];
}

export function AnalyticsTab({ channels }: AnalyticsTabProps) {
  const connectedChannels = channels.filter(c => c.isConnected);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectedChannels.map(channel => {
          const config = PLATFORM_CONFIG[channel.platform];
          
          return (
            <Card key={channel.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-lg">{config.emoji}</span>
                  {channel.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{channel.followers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Followers
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">+5.2%</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Growth
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12.5K</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Views
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3.2%</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Engagement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Analytics chi tiết</h3>
            <p className="text-sm">
              Kết nối các kênh để xem analytics chi tiết
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
