import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ContentItem, ContentStage } from '@/types/content-pipeline';
import { CHANNELS, CONTENT_TYPES, PRIORITY_CONFIG, STAGES } from '@/types/content-pipeline';

type SortKey = 'title' | 'stage' | 'priority' | 'channel' | 'due_date' | 'content_type';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const STAGE_ORDER = { idea: 0, script: 1, visual: 2, production: 3, review: 4, published: 5 };

interface Props {
  items: ContentItem[];
  onSelect: (item: ContentItem) => void;
  onMoveStage: (id: string, stage: ContentStage) => void;
  onDelete: (id: string) => void;
}

export function ContentTable({ items, onSelect, onMoveStage, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'stage':
          cmp = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
          break;
        case 'priority':
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'channel':
          cmp = a.channel.localeCompare(b.channel);
          break;
        case 'due_date': {
          const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          cmp = da - db;
          break;
        }
        case 'content_type':
          cmp = a.content_type.localeCompare(b.content_type);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [items, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    );
  }

  return (
    <div className="rounded-xl border bg-card/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {(
              [
                ['title', 'Tiêu đề'],
                ['stage', 'Giai đoạn'],
                ['priority', 'Ưu tiên'],
                ['channel', 'Kênh'],
                ['content_type', 'Loại'],
                ['due_date', 'Deadline'],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <TableHead key={key}>
                <button
                  type="button"
                  className="flex items-center text-xs font-medium hover:text-foreground transition-colors"
                  onClick={() => toggleSort(key)}
                >
                  {label}
                  <SortIcon col={key} />
                </button>
              </TableHead>
            ))}
            <TableHead className="w-14">
              <span className="text-xs">Tiến độ</span>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => {
            const stage = STAGES.find((s) => s.key === item.stage);
            const channel = CHANNELS.find((c) => c.key === item.channel);
            const priority = PRIORITY_CONFIG[item.priority];
            const contentType = CONTENT_TYPES.find((t) => t.key === item.content_type);
            const checkDone = item.checklist.filter((c) => c.done).length;
            const checkTotal = item.checklist.length;
            const progress = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;
            const isOverdue =
              item.due_date && new Date(item.due_date) < new Date() && item.stage !== 'published';

            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-white/[0.02] group"
                onClick={() => onSelect(item)}
              >
                {/* Title */}
                <TableCell className="max-w-[260px]">
                  <span className="text-sm font-medium line-clamp-1">{item.title}</span>
                  {item.tags.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {item.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] rounded bg-white/5 px-1 py-0.5 text-muted-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>

                {/* Stage */}
                <TableCell>
                  <Badge variant="outline" className="text-[10px] gap-1 border-0 bg-white/5">
                    {stage?.icon} {stage?.label}
                  </Badge>
                </TableCell>

                {/* Priority */}
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                      priority.color
                    )}
                  >
                    {priority.icon} {priority.label}
                  </span>
                </TableCell>

                {/* Channel */}
                <TableCell>
                  {channel && (
                    <Badge variant="outline" className={cn('text-[10px] border-0', channel.color)}>
                      {channel.icon} {channel.label}
                    </Badge>
                  )}
                </TableCell>

                {/* Type */}
                <TableCell>
                  <span className="text-[11px] text-muted-foreground">
                    {contentType?.icon} {contentType?.label}
                  </span>
                </TableCell>

                {/* Due Date */}
                <TableCell>
                  {item.due_date ? (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        isOverdue ? 'text-red-400' : 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(item.due_date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                {/* Progress */}
                <TableCell>
                  {checkTotal > 0 ? (
                    <div className="w-16">
                      <div className="text-[10px] text-muted-foreground mb-0.5 text-right">
                        {progress}%
                      </div>
                      <Progress value={progress} className="h-1" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {STAGES.filter((s) => s.key !== item.stage).map((s) => (
                        <DropdownMenuItem
                          key={s.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveStage(item.id, s.key);
                          }}
                        >
                          {s.icon} Chuyển → {s.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Xoá
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}

          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                Không có nội dung nào. Bấm "Thêm mới" để bắt đầu!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
