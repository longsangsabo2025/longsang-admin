/**
 * CampaignDetailDialog - View campaign details with metrics and AI content
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Sparkles,
  Megaphone,
  PlayCircle,
} from 'lucide-react';
import { PLATFORMS, STATUS_CONFIG } from './constants';
import { formatNumber } from './utils';
import type { Campaign } from './types';

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  aiContent: string;
  generatingPosts: boolean;
  onGeneratePosts: (campaign: Campaign) => void;
  onStatusChange: (campaignId: string, newStatus: 'running' | 'paused' | 'completed') => void;
}

export function CampaignDetailDialog({
  open, onOpenChange, campaign, aiContent, generatingPosts, onGeneratePosts, onStatusChange,
}: CampaignDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="campaign-detail-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> {campaign?.name}
          </DialogTitle>
          <DialogDescription id="campaign-detail-description">
            Xem chi tiết và quản lý chiến dịch marketing
          </DialogDescription>
        </DialogHeader>
        {campaign && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <Badge className={cn('mt-1', STATUS_CONFIG[campaign.status]?.color)}>
                  {STATUS_CONFIG[campaign.status]?.label}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nền tảng</p>
                <div className="flex gap-1 mt-1">
                  {campaign.platforms?.map(platformId => {
                    const platform = PLATFORMS.find(p => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return <Icon key={platformId} className="h-5 w-5" style={{ color: platform.color }} />;
                  })}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Nội dung</p>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm whitespace-pre-wrap">{campaign.content}</p>
              </div>
            </div>
            {campaign.metrics && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Hiệu suất</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: campaign.metrics.impressions, label: 'Impressions', bg: 'bg-blue-500/10' },
                    { value: campaign.metrics.clicks, label: 'Clicks', bg: 'bg-green-500/10' },
                    { value: campaign.metrics.engagement, label: 'Engagement', bg: 'bg-pink-500/10' },
                    { value: campaign.metrics.conversions, label: 'Conversions', bg: 'bg-amber-500/10' },
                  ].map(m => (
                    <div key={m.label} className={`p-3 rounded-lg ${m.bg} text-center`}>
                      <p className="text-2xl font-bold">{formatNumber(m.value)}</p>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aiContent && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Generated Content
                </p>
                <ScrollArea className="h-[200px]">
                  <pre className="text-sm whitespace-pre-wrap p-3 rounded-lg bg-muted/50 border font-mono">
                    {aiContent}
                  </pre>
                </ScrollArea>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onGeneratePosts(campaign)}
                disabled={generatingPosts} className="gap-2">
                {generatingPosts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generatingPosts ? 'Đang tạo...' : 'AI Tạo bài đăng'}
              </Button>
              {campaign.status === 'draft' && (
                <Button onClick={() => { onStatusChange(campaign.id, 'running'); onOpenChange(false); }}
                  className="gap-2 bg-green-600 hover:bg-green-700">
                  <PlayCircle className="h-4 w-4" /> Bắt đầu chạy
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
