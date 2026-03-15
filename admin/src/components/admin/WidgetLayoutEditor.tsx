/**
 * ⚙️ Widget Layout Editor — Floating panel for Mission Control customization
 * Allows users to show/hide sections, reorder them, and reset to defaults.
 */

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, RotateCcw, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { UseWidgetLayoutReturn, WidgetConfig } from '@/hooks/useWidgetLayout';
import { cn } from '@/lib/utils';

// ─── Widget display names (Vietnamese) ────────────────────────────────

const WIDGET_LABELS: Record<string, { label: string; description: string }> = {
  'ecosystem-health': {
    label: 'Sức khỏe Hệ thống',
    description: 'Trạng thái các dịch vụ',
  },
  'quick-actions': {
    label: 'Thao tác nhanh',
    description: 'Các nút hành động chính',
  },
  'ai-tools': {
    label: 'AI Tools Stack',
    description: 'Công cụ AI đang sử dụng',
  },
  automation: {
    label: 'Tự động hóa',
    description: 'Trạng thái workflow n8n',
  },
  revenue: {
    label: 'Doanh thu & Chi phí',
    description: 'Thống kê tài chính',
  },
  'calendar-queue': {
    label: 'Lịch & Pipeline',
    description: 'Lịch nội dung + hàng đợi',
  },
  'recent-activity': {
    label: 'Hoạt động gần đây',
    description: 'Lịch sử pipeline runs',
  },
};

// ─── WidgetLayoutEditor ───────────────────────────────────────────────

export interface WidgetLayoutEditorProps {
  layout: UseWidgetLayoutReturn['layout'];
  toggleVisibility: UseWidgetLayoutReturn['toggleVisibility'];
  moveUp: UseWidgetLayoutReturn['moveUp'];
  moveDown: UseWidgetLayoutReturn['moveDown'];
  resetLayout: UseWidgetLayoutReturn['resetLayout'];
}

export function WidgetLayoutEditor({
  layout,
  toggleVisibility,
  moveUp,
  moveDown,
  resetLayout,
}: WidgetLayoutEditorProps) {
  const sortedLayout = useMemo(() => [...layout].sort((a, b) => a.order - b.order), [layout]);

  const visibleCount = useMemo(() => layout.filter((w) => w.visible).length, [layout]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 px-2.5">
          <Settings className="h-3.5 w-3.5" />
          Tùy chỉnh
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[340px] sm:w-[380px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tùy chỉnh Dashboard
          </SheetTitle>
          <SheetDescription>
            Hiển thị, ẩn hoặc sắp xếp lại các mục trên Mission Control.
            <br />
            <span className="text-xs text-muted-foreground/70">
              Đang hiển thị {visibleCount}/{layout.length} mục
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* ── Widget list ── */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-4 space-y-1">
          {sortedLayout.map((config, index) => {
            const meta = WIDGET_LABELS[config.id];
            const isFirst = index === 0;
            const isLast = index === sortedLayout.length - 1;

            return (
              <WidgetRow
                key={config.id}
                config={config}
                label={meta?.label ?? config.id}
                description={meta?.description ?? ''}
                isFirst={isFirst}
                isLast={isLast}
                onToggle={() => toggleVisibility(config.id)}
                onMoveUp={() => moveUp(config.id)}
                onMoveDown={() => moveDown(config.id)}
              />
            );
          })}
        </div>

        {/* ── Reset button ── */}
        <div className="pt-4 border-t mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            onClick={resetLayout}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset mặc định
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Single row in the editor ─────────────────────────────────────────

interface WidgetRowProps {
  config: WidgetConfig;
  label: string;
  description: string;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function WidgetRow({
  config,
  label,
  description,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
}: WidgetRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-2 rounded-md transition-colors',
        'hover:bg-muted/50',
        !config.visible && 'opacity-50'
      )}
    >
      {/* Grip */}
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

      {/* Up/Down */}
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 rounded hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"
          title="Lên"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 rounded hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"
          title="Xuống"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {description && <div className="text-xs text-muted-foreground truncate">{description}</div>}
      </div>

      {/* Visibility toggle */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'p-1.5 rounded-md transition-colors shrink-0',
          config.visible
            ? 'text-foreground hover:bg-muted'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        title={config.visible ? 'Ẩn' : 'Hiện'}
      >
        {config.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}
