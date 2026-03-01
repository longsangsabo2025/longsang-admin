import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, DollarSign, Focus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeleteTask } from '@/hooks/use-survival';
import {
  EISENHOWER_QUADRANTS,
  TASK_CATEGORIES,
  type SurvivalTask,
} from '@/types/survival.types';

// =====================================================
// PROPS
// =====================================================

export interface TaskCardProps {
  task: SurvivalTask;
  onFocus: () => void;
  onComplete: () => void;
  size?: 'small' | 'medium' | 'large';
  showQuadrant?: boolean;
  showICE?: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

export function TaskCard({
  task,
  onFocus,
  onComplete,
  size = 'medium',
  showQuadrant = true,
  showICE = false,
}: TaskCardProps) {
  const deleteTask = useDeleteTask();
  const category = TASK_CATEGORIES.find(c => c.id === task.category);
  const quadrant = EISENHOWER_QUADRANTS[task.quadrant];

  return (
    <div className={cn(
      "group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
      size === 'large' && "p-4"
    )}>
      {/* Complete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 rounded-full border-2 border-muted-foreground/30 hover:border-green-500 hover:bg-green-500/10"
        onClick={onComplete}
      >
        <CheckCircle2 className="h-4 w-4 opacity-0 group-hover:opacity-100 text-green-500" />
      </Button>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {category && <span>{category.icon}</span>}
          <span className={cn(
            "font-medium truncate",
            size === 'large' && "text-lg"
          )}>
            {task.title}
          </span>
          {task.potential_revenue && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              <DollarSign className="h-3 w-3" />
              {task.potential_revenue}
            </Badge>
          )}
        </div>
        
        {task.description && size !== 'small' && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          {showQuadrant && (
            <Badge variant="outline" className={cn("text-xs", quadrant.color)}>
              {quadrant.icon} {quadrant.nameVi}
            </Badge>
          )}
          {showICE && (
            <Badge variant="secondary" className="text-xs">
              ICE: {task.ice_score}
            </Badge>
          )}
          {task.estimated_minutes && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {task.estimated_minutes}m
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onFocus}
        >
          <Focus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => deleteTask.mutate(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
