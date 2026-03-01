/**
 * QuickPostTab - Quick post creation with platform selection
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Zap,
  Calendar,
  Send,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Hash,
} from 'lucide-react';
import { PLATFORMS } from './constants';

interface QuickPostTabProps {
  projectName: string;
  quickPostContent: string;
  selectedPlatforms: string[];
  isScheduled: boolean;
  scheduledTime: string;
  posting: boolean;
  aiGenerating: boolean;
  onContentChange: (content: string) => void;
  onTogglePlatform: (platformId: string) => void;
  onScheduledChange: (scheduled: boolean) => void;
  onScheduledTimeChange: (time: string) => void;
  onAIWritePost: () => void;
  onQuickPost: () => void;
}

export function QuickPostTab({
  projectName,
  quickPostContent,
  selectedPlatforms,
  isScheduled,
  scheduledTime,
  posting,
  aiGenerating,
  onContentChange,
  onTogglePlatform,
  onScheduledChange,
  onScheduledTimeChange,
  onAIWritePost,
  onQuickPost,
}: QuickPostTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Đăng nhanh lên Social Media
        </CardTitle>
        <CardDescription>
          Tạo và đăng bài nhanh chóng lên nhiều nền tảng cùng lúc
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Input */}
        <div className="space-y-2">
          <Label>Nội dung bài đăng</Label>
          <Textarea
            placeholder={`Chia sẻ tin tức mới nhất về ${projectName}...`}
            value={quickPostContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{quickPostContent.length} ký tự</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Thêm ảnh
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1">
                <Hash className="h-3.5 w-3.5" /> Hashtag
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-amber-600 hover:text-amber-700"
                onClick={onAIWritePost}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {aiGenerating ? 'Đang viết...' : 'AI viết'}
              </Button>
            </div>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <Label>Chọn nền tảng</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <Button
                  key={platform.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  style={isSelected ? { backgroundColor: platform.color } : {}}
                  onClick={() => onTogglePlatform(platform.id)}
                >
                  <Icon className="h-4 w-4" />
                  {platform.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Schedule Option */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Lên lịch đăng</p>
              <p className="text-sm text-muted-foreground">Đặt thời gian đăng bài tự động</p>
            </div>
          </div>
          <Switch checked={isScheduled} onCheckedChange={onScheduledChange} />
        </div>

        {isScheduled && (
          <div className="space-y-2">
            <Label>Thời gian đăng</Label>
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => onScheduledTimeChange(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onQuickPost}
          disabled={posting || !quickPostContent.trim() || selectedPlatforms.length === 0}
        >
          {posting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isScheduled ? (
            <Calendar className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {posting ? 'Đang xử lý...' : isScheduled ? 'Lên lịch đăng' : 'Đăng ngay'}
        </Button>
      </CardContent>
    </Card>
  );
}
