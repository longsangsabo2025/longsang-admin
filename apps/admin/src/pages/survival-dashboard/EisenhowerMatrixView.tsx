import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EISENHOWER_QUADRANTS, type SurvivalTask } from '@/types/survival.types';
import { TaskCard } from './TaskCard';

// =====================================================
// PROPS
// =====================================================

export interface EisenhowerMatrixViewProps {
  tasksByQuadrant: Record<string, SurvivalTask[]>;
  onStartFocus: (task: SurvivalTask) => void;
  onComplete: (id: string) => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function EisenhowerMatrixView({
  tasksByQuadrant,
  onStartFocus,
  onComplete,
}: EisenhowerMatrixViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(EISENHOWER_QUADRANTS).map(([key, quadrant]) => (
        <Card 
          key={key}
          className={cn(
            "border-2",
            quadrant.borderColor,
            quadrant.bgColor
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{quadrant.icon}</span>
                <div>
                  <CardTitle className={quadrant.color}>{quadrant.nameVi}</CardTitle>
                  <CardDescription>{quadrant.description}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={quadrant.color}>
                {tasksByQuadrant[key]?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-4">
                {tasksByQuadrant[key]?.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onFocus={() => onStartFocus(task)}
                    onComplete={() => onComplete(task.id)}
                    size="small"
                    showQuadrant={false}
                  />
                ))}
                {(!tasksByQuadrant[key] || tasksByQuadrant[key].length === 0) && (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    Không có task nào
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
