/**
 * CampaignsTab - Campaigns list tab content
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Plus,
  Eye,
  Copy,
  Trash2,
  MoreVertical,
  Heart,
  Target,
  Clock,
  Megaphone,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PLATFORMS, STATUS_CONFIG } from './constants';
import { formatNumber, formatDate } from './utils';
import type { Campaign } from './types';

interface CampaignsTabProps {
  campaigns: Campaign[];
  generatingPosts: boolean;
  onCreateCampaign: () => void;
  onViewCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onDuplicateCampaign: (campaignId: string) => void;
  onStatusChange: (campaignId: string, newStatus: 'running' | 'paused' | 'completed') => void;
  onGeneratePosts: (campaign: Campaign) => void;
}

export function CampaignsTab({
  campaigns,
  generatingPosts,
  onCreateCampaign,
  onViewCampaign,
  onDeleteCampaign,
  onDuplicateCampaign,
  onStatusChange,
  onGeneratePosts,
}: CampaignsTabProps) {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium mb-2">Chưa có chiến dịch nào</p>
          <p className="text-muted-foreground mb-4">Bắt đầu tạo chiến dịch marketing đầu tiên</p>
          <Button onClick={onCreateCampaign} className="gap-2">
            <Plus className="h-4 w-4" /> Tạo chiến dịch
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => {
        const statusConfig = STATUS_CONFIG[campaign.status];
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{campaign.name}</h3>
                    <Badge className={cn('text-white', statusConfig.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {campaign.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    {/* Platforms */}
                    <div className="flex items-center gap-1">
                      {campaign.platforms.map(platformId => {
                        const platform = PLATFORMS.find(p => p.id === platformId);
                        if (!platform) return null;
                        const Icon = platform.icon;
                        return (
                          <Icon
                            key={platformId}
                            className="h-4 w-4"
                            style={{ color: platform.color }}
                          />
                        );
                      })}
                    </div>

                    <Separator orientation="vertical" className="h-4" />

                    {/* Metrics */}
                    {campaign.metrics && campaign.status !== 'draft' && (
                      <>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{formatNumber(campaign.metrics.impressions)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="h-3.5 w-3.5" />
                          <span>{formatNumber(campaign.metrics.engagement)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Target className="h-3.5 w-3.5" />
                          <span>{formatNumber(campaign.metrics.conversions)}</span>
                        </div>
                      </>
                    )}

                    {campaign.scheduled_at && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(campaign.scheduled_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onViewCampaign(campaign)}
                    >
                      <Eye className="h-4 w-4" /> Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onGeneratePosts(campaign)}
                      disabled={generatingPosts}
                    >
                      <Sparkles className="h-4 w-4" />
                      {generatingPosts ? 'Đang tạo...' : 'AI Tạo bài đăng'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onDuplicateCampaign(campaign.id)}
                    >
                      <Copy className="h-4 w-4" /> Nhân bản
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {campaign.status === 'draft' && (
                      <DropdownMenuItem
                        className="gap-2 text-green-600"
                        onClick={() => onStatusChange(campaign.id, 'running')}
                      >
                        <PlayCircle className="h-4 w-4" /> Bắt đầu chạy
                      </DropdownMenuItem>
                    )}
                    {campaign.status === 'running' && (
                      <DropdownMenuItem
                        className="gap-2 text-amber-600"
                        onClick={() => onStatusChange(campaign.id, 'paused')}
                      >
                        <PauseCircle className="h-4 w-4" /> Tạm dừng
                      </DropdownMenuItem>
                    )}
                    {campaign.status === 'paused' && (
                      <DropdownMenuItem
                        className="gap-2 text-green-600"
                        onClick={() => onStatusChange(campaign.id, 'running')}
                      >
                        <PlayCircle className="h-4 w-4" /> Tiếp tục
                      </DropdownMenuItem>
                    )}
                    {(campaign.status === 'running' || campaign.status === 'paused') && (
                      <DropdownMenuItem
                        className="gap-2 text-blue-600"
                        onClick={() => onStatusChange(campaign.id, 'completed')}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Hoàn thành
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => onDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
