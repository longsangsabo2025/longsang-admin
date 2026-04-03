import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContentStage } from '@/types/content-pipeline';

interface StageConfig {
  key: ContentStage;
  label: string;
  icon: string;
  color: string;
}

interface Props {
  stage: StageConfig;
  count: number;
  children: ReactNode;
  onQuickAdd: () => void;
}

export function KanbanColumn({ stage, count, children, onQuickAdd }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[280px] w-[280px] rounded-xl border bg-gradient-to-b transition-all duration-200',
        stage.color,
        isOver && 'ring-2 ring-primary/50 scale-[1.01] shadow-lg shadow-primary/10'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{stage.icon}</span>
          <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
          <span className="flex items-center justify-center h-5 min-w-[20px] rounded-full bg-white/10 px-1.5 text-[10px] font-bold text-muted-foreground">
            {count}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-md hover:bg-white/10"
          onClick={onQuickAdd}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Column Body */}
      <div className="flex-1 flex flex-col min-h-[200px] p-2">{children}</div>
    </div>
  );
}
