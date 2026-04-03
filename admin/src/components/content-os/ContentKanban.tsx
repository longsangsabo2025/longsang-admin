import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ContentItem, ContentStage } from '@/types/content-pipeline';
import { STAGES } from '@/types/content-pipeline';
import { ContentKanbanCard } from './ContentKanbanCard';
import { KanbanColumn } from './KanbanColumn';

interface Props {
  items: ContentItem[];
  onMoveStage: (id: string, stage: ContentStage) => void;
  onSelect: (item: ContentItem) => void;
  onQuickAdd: (stage: ContentStage) => void;
}

export function ContentKanban({ items, onMoveStage, onSelect, onQuickAdd }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columnItems = useMemo(() => {
    const map: Record<ContentStage, ContentItem[]> = {
      idea: [],
      script: [],
      visual: [],
      production: [],
      review: [],
      published: [],
    };
    for (const item of items) {
      map[item.stage]?.push(item);
    }
    return map;
  }, [items]);

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    // Visual feedback handled by DnD context
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    const activeItemId = active.id as string;

    // Check if dropped on a stage column
    const targetStage = STAGES.find((s) => s.key === overId);
    if (targetStage) {
      const currentItem = items.find((i) => i.id === activeItemId);
      if (currentItem && currentItem.stage !== targetStage.key) {
        onMoveStage(activeItemId, targetStage.key);
      }
      return;
    }

    // Dropped on another card — move to that card's stage
    const targetItem = items.find((i) => i.id === overId);
    if (targetItem) {
      const currentItem = items.find((i) => i.id === activeItemId);
      if (currentItem && currentItem.stage !== targetItem.stage) {
        onMoveStage(activeItemId, targetItem.stage);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-320px)]">
        {STAGES.map((stage) => {
          const stageItems = columnItems[stage.key];
          return (
            <KanbanColumn
              key={stage.key}
              stage={stage}
              count={stageItems.length}
              onQuickAdd={() => onQuickAdd(stage.key)}
            >
              <SortableContext
                items={stageItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <ScrollArea className="flex-1 pr-1">
                  <div className="space-y-2 p-1">
                    {stageItems.map((item) => (
                      <ContentKanbanCard
                        key={item.id}
                        item={item}
                        onClick={() => onSelect(item)}
                        isDragging={activeId === item.id}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-2 scale-105">
            <ContentKanbanCard item={activeItem} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
