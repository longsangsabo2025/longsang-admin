/**
 * Overview Tab - Stats cards, channels grid, and quick actions
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Globe,
  Lightbulb,
  Calendar,
  Tv,
  Plus,
  Zap,
  Brain,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { PLATFORM_CONFIG, type Channel, type ContentIdea } from './types';

interface OverviewTabProps {
  channels: Channel[];
  ideas: ContentIdea[];
  totalFollowers: number;
  connectedChannels: number;
  onGenerateIdeas: () => void;
  onShowNewIdeaDialog: () => void;
  onShowConnectDialog: () => void;
  onSetActiveTab: (tab: string) => void;
}

export function OverviewTab({
  channels,
  ideas,
  totalFollowers,
  connectedChannels,
  onGenerateIdeas,
  onShowNewIdeaDialog,
  onShowConnectDialog,
  onSetActiveTab,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Tổng followers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Globe className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedChannels}/{channels.length}</p>
                <p className="text-sm text-muted-foreground">Kênh đã kết nối</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Lightbulb className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ideas.length}</p>
                <p className="text-sm text-muted-foreground">Ý tưởng nội dung</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ideas.filter(i => i.status === 'scheduled').length}</p>
                <p className="text-sm text-muted-foreground">Đã lên lịch</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Kênh của bạn
            </CardTitle>
            <CardDescription>Quản lý tất cả kênh social media</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onShowConnectDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm kênh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map(channel => {
              const config = PLATFORM_CONFIG[channel.platform];
              
              return (
                <div
                  key={channel.id}
                  className={`p-4 rounded-xl border ${config.bgColor} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background text-2xl">
                      {config.emoji}
                    </div>
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-sm text-muted-foreground">{channel.handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{channel.followers.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {channel.isConnected ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">Đã kết nối</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          <span className="text-yellow-500">Chưa kết nối</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Hành động nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={onGenerateIdeas}>
              <Brain className="h-6 w-6 text-purple-500" />
              <span>Tạo ý tưởng AI</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={onShowNewIdeaDialog}>
              <Plus className="h-6 w-6 text-blue-500" />
              <span>Thêm ý tưởng</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onSetActiveTab('calendar')}>
              <Calendar className="h-6 w-6 text-green-500" />
              <span>Xem lịch</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => onSetActiveTab('analytics')}>
              <BarChart3 className="h-6 w-6 text-orange-500" />
              <span>Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
