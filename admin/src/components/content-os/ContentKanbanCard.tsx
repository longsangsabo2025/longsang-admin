import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ContentItem } from '@/types/content-pipeline';
import { CHANNELS, CONTENT_TYPES, PRIORITY_CONFIG } from '@/types/content-pipeline';

interface Props {
  item: ContentItem;
  onClick: () => void;
  isDragging?: boolean;
}

export function ContentKanbanCard({ item, onClick, isDragging }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const channel = CHANNELS.find((c) => c.key === item.channel);
  const contentType = CONTENT_TYPES.find((t) => t.key === item.content_type);
  const priority = PRIORITY_CONFIG[item.priority];
  const checkDone = item.checklist.filter((c) => c.done).length;
  const checkTotal = item.checklist.length;
  const progress = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  const isOverdue =
    item.due_date && new Date(item.due_date) < new Date() && item.stage !== 'published';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card/80 backdrop-blur-sm p-3 cursor-pointer transition-all duration-150',
        'hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 hover:bg-card',
        isDragging || isSortableDragging
          ? 'opacity-50 shadow-xl ring-2 ring-primary/30'
          : 'opacity-100',
        isOverdue && 'border-red-500/40'
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Top Row: Priority + Type */}
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
            priority.color
          )}
        >
          {priority.icon} {priority.label}
        </span>
        {contentType && (
          <span className="text-[10px] text-muted-foreground">
            {contentType.icon} {contentType.label}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium leading-tight line-clamp-2 mb-2 text-foreground">
        {item.title}
      </h4>

      {/* Channel Badge */}
      {channel && (
        <Badge variant="outline" className={cn('text-[10px] mb-2 border-0', channel.color)}>
          {channel.icon} {channel.label}
        </Badge>
      )}

      {/* Progress Bar (if checklist) */}
      {checkTotal > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>
              {checkDone}/{checkTotal} tasks
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Bottom Row: Date + Tags */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.due_date && (
            <span
              className={cn(
                'flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-red-400' : 'text-muted-foreground'
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(item.due_date).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          )}
          {item.ai_suggestions.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
              <MessageSquare className="h-3 w-3" />
              {item.ai_suggestions.length}
            </span>
          )}
        </div>
        {item.tags.length > 0 && (
          <div className="flex gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/5 px-1 py-0.5 text-[9px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
