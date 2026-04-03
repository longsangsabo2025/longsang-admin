import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContentItem, ContentStage } from '@/types/content-pipeline';
import { CHANNELS, PRIORITY_CONFIG, STAGES } from '@/types/content-pipeline';

interface Props {
  items: ContentItem[];
  onSelect: (item: ContentItem) => void;
  onQuickAdd: (stage: ContentStage) => void;
}

export function ContentCalendar({ items, onSelect, onQuickAdd }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const result: Date[][] = [];
    let week: Date[] = [];
    let day = start;

    while (day <= end) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      day = addDays(day, 1);
    }
    return result;
  }, [currentMonth]);

  // Index items by date (due_date or scheduled_for)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of items) {
      const dateStr = item.scheduled_for || item.due_date;
      if (!dateStr) continue;
      const key = format(new Date(dateStr), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="space-y-4">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: vi })}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hôm nay
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border bg-card/50 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20">
          {weekDays.map((d) => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayItems = itemsByDate.get(key) || [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[100px] p-1.5 border-r last:border-r-0 transition-colors',
                    !inMonth && 'bg-muted/10 opacity-40',
                    today && 'bg-primary/5'
                  )}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium',
                        today && 'bg-primary text-primary-foreground',
                        !today && 'text-muted-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[9px] text-muted-foreground">{dayItems.length}</span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const stage = STAGES.find((s) => s.key === item.stage);
                      const priority = PRIORITY_CONFIG[item.priority];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelect(item)}
                          className={cn(
                            'w-full text-left rounded px-1.5 py-0.5 text-[10px] leading-tight truncate transition-colors',
                            'hover:ring-1 hover:ring-primary/40 cursor-pointer',
                            item.priority === 'urgent'
                              ? 'bg-red-500/15 text-red-300'
                              : item.priority === 'high'
                                ? 'bg-orange-500/15 text-orange-300'
                                : 'bg-white/5 text-foreground/80'
                          )}
                        >
                          <span className="mr-0.5">{stage?.icon}</span>
                          {item.title}
                        </button>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <span className="block text-[9px] text-muted-foreground text-center">
                        +{dayItems.length - 3} nữa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {STAGES.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            {s.icon} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
