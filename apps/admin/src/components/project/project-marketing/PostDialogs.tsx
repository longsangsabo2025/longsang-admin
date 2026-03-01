/**
 * ViewPostDialog + EditPostDialog - Scheduled post view/edit dialogs
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Send,
  Clock,
  Edit,
  Eye,
  Loader2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { PLATFORMS, STATUS_CONFIG } from './constants';
import { formatDate } from './utils';
import type { ScheduledPost, EditingPost } from './types';

// ==================== View Scheduled Post Dialog ====================

interface ViewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ScheduledPost | null;
  onCopyPost: (post: ScheduledPost) => void;
  onEditPost: (post: ScheduledPost) => void;
  onPublishNow: (postId: string) => void;
}

export function ViewPostDialog({
  open, onOpenChange, post, onCopyPost, onEditPost, onPublishNow,
}: ViewPostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Chi tiết bài đăng
          </DialogTitle>
        </DialogHeader>
        {post && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(post.scheduled_at)}</span>
              </div>
              <Badge className={cn("text-white", STATUS_CONFIG[post.status]?.color || 'bg-gray-500')}>
                {STATUS_CONFIG[post.status]?.label || post.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Nền tảng đăng</p>
              <div className="flex gap-2">
                {(post.platforms || [post.platform]).map(pId => {
                  const p = PLATFORMS.find(x => x.id === pId);
                  if (!p) return null;
                  const PIcon = p.icon;
                  return (
                    <div key={pId} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: `${p.color}15` }}>
                      <PIcon className="h-4 w-4" style={{ color: p.color }} />
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {post.campaign_name && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tiêu đề</p>
                <p className="font-medium">{post.campaign_name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Nội dung</p>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onCopyPost(post)} className="gap-2">
                <Copy className="h-4 w-4" /> Sao chép
              </Button>
              <Button variant="outline" onClick={() => { onOpenChange(false); onEditPost(post); }} className="gap-2">
                <Edit className="h-4 w-4" /> Chỉnh sửa
              </Button>
              {post.status === 'scheduled' && (
                <Button onClick={() => { onPublishNow(post.id); onOpenChange(false); }}
                  className="gap-2 bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4" /> Đăng ngay
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== Edit Scheduled Post Dialog ====================

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPost: EditingPost | null;
  onEditingPostChange: (post: EditingPost | null) => void;
  savingPost: boolean;
  onSavePost: () => void;
}

export function EditPostDialog({
  open, onOpenChange, editingPost, onEditingPostChange, savingPost, onSavePost,
}: EditPostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" /> Chỉnh sửa bài đăng
          </DialogTitle>
        </DialogHeader>
        {editingPost && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Thời gian đăng
              </Label>
              <Input type="datetime-local" value={editingPost.scheduled_at}
                onChange={(e) => onEditingPostChange({ ...editingPost, scheduled_at: e.target.value })}
                min={new Date().toISOString().slice(0, 16)} />
              <p className="text-xs text-muted-foreground">
                Chọn ngày và giờ bạn muốn bài đăng được tự động đăng
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-2 self-center">Đặt nhanh:</span>
              {[
                { label: '30 phút', minutes: 30 },
                { label: '1 giờ', minutes: 60 },
                { label: '3 giờ', minutes: 180 },
                { label: '6 giờ', minutes: 360 },
                { label: 'Ngày mai 9:00', custom: () => {
                  const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0); return t;
                }},
                { label: 'Ngày mai 19:00', custom: () => {
                  const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(19, 0, 0, 0); return t;
                }},
              ].map(({ label, minutes, custom }) => (
                <Button key={label} variant="outline" size="sm"
                  onClick={() => {
                    const newTime = custom ? custom() : new Date(Date.now() + (minutes! * 60 * 1000));
                    onEditingPostChange({ ...editingPost, scheduled_at: newTime.toISOString().slice(0, 16) });
                  }}>
                  {label}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Nền tảng đăng</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = editingPost.platforms.includes(platform.id);
                  return (
                    <Button key={platform.id} type="button" variant={isSelected ? 'default' : 'outline'}
                      size="sm" className="gap-2"
                      style={isSelected ? { backgroundColor: platform.color } : {}}
                      onClick={() => onEditingPostChange({
                        ...editingPost,
                        platforms: isSelected
                          ? editingPost.platforms.filter(p => p !== platform.id)
                          : [...editingPost.platforms, platform.id]
                      })}>
                      <Icon className="h-4 w-4" /> {platform.name}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nội dung bài đăng</Label>
              <Textarea value={editingPost.content}
                onChange={(e) => onEditingPostChange({ ...editingPost, content: e.target.value })}
                className="min-h-[200px]" placeholder="Nhập nội dung bài đăng..." />
              <p className="text-xs text-muted-foreground text-right">
                {editingPost.content.length} ký tự
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => { onOpenChange(false); onEditingPostChange(null); }}>
                Hủy
              </Button>
              <Button onClick={onSavePost} disabled={savingPost || !editingPost.content.trim()} className="gap-2">
                {savingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {savingPost ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
