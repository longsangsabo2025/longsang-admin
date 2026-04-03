import {
  ArrowRight,
  Calendar,
  CheckSquare,
  MessageSquare,
  Save,
  Send,
  Sparkles,
  Square,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  ChecklistItem,
  ContentChannel,
  ContentItem,
  ContentPriority,
  ContentStage,
  ContentType,
} from '@/types/content-pipeline';
import { CHANNELS, CONTENT_TYPES, PRIORITY_CONFIG, STAGES } from '@/types/content-pipeline';

interface Props {
  item: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<ContentItem>) => void;
  onMoveStage: (id: string, stage: ContentStage) => void;
  onDelete: (id: string) => void;
  onPublishToSocial?: (
    item: ContentItem
  ) => Promise<{ success: boolean; results: Record<string, any> }>;
}

export function ContentDetailPanel({
  item,
  open,
  onOpenChange,
  onUpdate,
  onMoveStage,
  onDelete,
  onPublishToSocial,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Hydrate from item
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setNotes(item.notes);
      setChecklist([...item.checklist]);
      setDirty(false);
    }
  }, [item]);

  const markDirty = useCallback(() => setDirty(true), []);

  function handleSave() {
    if (!item) return;
    onUpdate(item.id, {
      title,
      description,
      notes,
      checklist,
    });
    setDirty(false);
  }

  function toggleCheckItem(id: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
    markDirty();
  }

  function addCheckItem() {
    if (!newCheckItem.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newCheckItem.trim(), done: false },
    ]);
    setNewCheckItem('');
    markDirty();
  }

  function removeCheckItem(id: string) {
    setChecklist((prev) => prev.filter((c) => c.id !== id));
    markDirty();
  }

  if (!item) return null;

  const stage = STAGES.find((s) => s.key === item.stage);
  const stageIdx = STAGES.findIndex((s) => s.key === item.stage);
  const nextStage = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;
  const prevStage = stageIdx > 0 ? STAGES[stageIdx - 1] : null;
  const channel = CHANNELS.find((c) => c.key === item.channel);
  const priority = PRIORITY_CONFIG[item.priority];
  const checkDone = checklist.filter((c) => c.done).length;
  const checkTotal = checklist.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-0 bg-white/5">
              {stage?.icon} {stage?.label}
            </Badge>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                priority.color
              )}
            >
              {priority.icon} {priority.label}
            </span>
            {channel && (
              <Badge variant="outline" className={cn('text-[10px] border-0', channel.color)}>
                {channel.icon} {channel.label}
              </Badge>
            )}
          </div>
          <SheetTitle className="sr-only">Chi tiết nội dung</SheetTitle>
          <SheetDescription className="sr-only">
            Xem và chỉnh sửa chi tiết nội dung
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tiêu đề</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              className="text-lg font-semibold h-auto py-2"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
              rows={3}
              placeholder="Mô tả chi tiết..."
            />
          </div>

          {/* Stage Progression */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Chuyển giai đoạn</Label>
            <div className="flex gap-2">
              {prevStage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onMoveStage(item.id, prevStage.key)}
                >
                  ← {prevStage.icon} {prevStage.label}
                </Button>
              )}
              {nextStage && (
                <Button
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => onMoveStage(item.id, nextStage.key)}
                >
                  {nextStage.icon} {nextStage.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Kênh</Label>
              <Select
                value={item.channel}
                onValueChange={(v) => onUpdate(item.id, { channel: v as ContentChannel })}
              >
                <SelectTrigger className="h-9">
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ưu tiên</Label>
              <Select
                value={item.priority}
                onValueChange={(v) => onUpdate(item.id, { priority: v as ContentPriority })}
              >
                <SelectTrigger className="h-9">
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

          <Separator />

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Checklist {checkTotal > 0 && `(${checkDone}/${checkTotal})`}
              </Label>
            </div>

            <div className="space-y-1.5">
              {checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2 group">
                  <Checkbox checked={c.done} onCheckedChange={() => toggleCheckItem(c.id)} />
                  <span
                    className={cn('flex-1 text-sm', c.done && 'line-through text-muted-foreground')}
                  >
                    {c.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-60"
                    onClick={() => removeCheckItem(c.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Thêm task..."
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                className="h-8 text-sm"
              />
              <Button variant="outline" size="sm" className="h-8" onClick={addCheckItem}>
                Thêm
              </Button>
            </div>
          </div>

          <Separator />

          {/* AI Suggestions */}
          {item.ai_suggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                AI Gợi ý
              </Label>
              <div className="space-y-1">
                {item.ai_suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2 text-sm text-amber-200/80"
                  >
                    💡 {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ghi chú</Label>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markDirty();
              }}
              rows={4}
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    #{t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-[10px] text-muted-foreground/60 space-y-0.5">
            <p>Tạo: {new Date(item.created_at).toLocaleString('vi-VN')}</p>
            <p>Cập nhật: {new Date(item.updated_at).toLocaleString('vi-VN')}</p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                onDelete(item.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá
            </Button>
            <div className="flex items-center gap-2">
              {onPublishToSocial && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                  disabled={publishing}
                  onClick={async () => {
                    if (!item) return;
                    setPublishing(true);
                    try {
                      const res = await onPublishToSocial(item);
                      if (res.success) {
                        const platforms = Object.keys(res.results).filter(
                          (k) => res.results[k]?.success
                        );
                        alert(`\u2705 Đã đăng lên: ${platforms.join(', ')}`);
                      } else {
                        alert('\u274c Không có platform nào đăng thành công');
                      }
                    } finally {
                      setPublishing(false);
                    }
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {publishing ? 'Đang đăng...' : 'Đăng MXH'}
                </Button>
              )}
              <Button size="sm" className="text-xs gap-1.5" disabled={!dirty} onClick={handleSave}>
                <Save className="h-3.5 w-3.5" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
