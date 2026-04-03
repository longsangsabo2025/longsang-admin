import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  ContentChannel,
  ContentItem,
  ContentPriority,
  ContentStage,
  ContentType,
} from '@/types/content-pipeline';
import { CHANNELS, CONTENT_TYPES, PRIORITY_CONFIG, STAGES } from '@/types/content-pipeline';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage?: ContentStage;
  onCreate: (item: Partial<ContentItem>) => void;
}

export function ContentQuickAdd({ open, onOpenChange, defaultStage = 'idea', onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<ContentStage>(defaultStage);
  const [channel, setChannel] = useState<ContentChannel>('longsang');
  const [contentType, setContentType] = useState<ContentType>('youtube-long');
  const [priority, setPriority] = useState<ContentPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  function handleSubmit() {
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      description: description.trim(),
      stage,
      channel,
      content_type: contentType,
      priority,
      due_date: dueDate || null,
      tags: [],
    });

    // Reset & close
    setTitle('');
    setDescription('');
    setStage(defaultStage);
    setChannel('longsang');
    setContentType('youtube-long');
    setPriority('medium');
    setDueDate('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Thêm nội dung mới
          </DialogTitle>
          <DialogDescription>Tạo nhanh ý tưởng hoặc content mới vào pipeline.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              placeholder="VD: 10 Mẹo AI Cho Người Mới..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              placeholder="Mô tả ngắn về ý tưởng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* 2-col Grid: Stage + Channel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Giai đoạn</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as ContentStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.icon} {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kênh</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as ContentChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2-col Grid: Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Loại nội dung</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ContentPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.icon} {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Deadline</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            <Sparkles className="h-4 w-4 mr-2" />
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
