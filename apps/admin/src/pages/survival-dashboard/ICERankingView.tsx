import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SurvivalTask } from '@/types/survival.types';
import { TaskCard } from './TaskCard';

// =====================================================
// PROPS
// =====================================================

export interface ICERankingViewProps {
  tasks: SurvivalTask[];
  onStartFocus: (task: SurvivalTask) => void;
  onComplete: (id: string) => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function ICERankingView({
  tasks,
  onStartFocus,
  onComplete,
}: ICERankingViewProps) {
  // Sort by ICE score descending
  const sortedTasks = [...tasks].sort((a, b) => b.ice_score - a.ice_score);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle>ICE Score Ranking</CardTitle>
              <CardDescription>
                Impact × Confidence × Ease = Priority
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTasks.map((task, index) => (
            <div key={task.id} className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                index === 0 ? "bg-yellow-500 text-yellow-950" :
                index === 1 ? "bg-gray-300 text-gray-700" :
                index === 2 ? "bg-orange-400 text-orange-950" :
                "bg-muted text-muted-foreground"
              )}>
                #{index + 1}
              </div>
              <div className="flex-1">
                <TaskCard
                  task={task}
                  onFocus={() => onStartFocus(task)}
                  onComplete={() => onComplete(task.id)}
                  showICE
                />
              </div>
            </div>
          ))}
          {sortedTasks.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Chưa có task nào. Thêm task mới để bắt đầu!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
