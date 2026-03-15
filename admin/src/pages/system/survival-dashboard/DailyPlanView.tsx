import { ListTodo, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MAX_DAILY_TASKS, type SurvivalTask } from '@/types/survival.types';
import type { DailyPlanData } from './shared';
import { TaskCard } from './TaskCard';

// =====================================================
// PROPS
// =====================================================

export interface DailyPlanViewProps {
  plan?: DailyPlanData;
  isLoading: boolean;
  onStartFocus: (task: SurvivalTask) => void;
  onComplete: (id: string) => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function DailyPlanView({ plan, isLoading, onStartFocus, onComplete }: DailyPlanViewProps) {
  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Major Task (1) */}
      <Card className="border-2 border-red-500/30 bg-red-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>🎯 Việc Lớn Nhất Hôm Nay</CardTitle>
              <CardDescription>Hoàn thành việc này = ngày thành công</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {plan?.major ? (
            <TaskCard
              task={plan.major}
              onFocus={() => onStartFocus(plan.major!)}
              onComplete={() => onComplete(plan.major!.id)}
              size="large"
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Chưa có task lớn nào. Thêm task mới với size "Major"!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Medium Tasks (3) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>📋 3 Việc Vừa</CardTitle>
                <CardDescription>
                  {plan?.completed.medium || 0} / {MAX_DAILY_TASKS.medium} hoàn thành
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">{plan?.medium.length || 0} tasks</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plan?.medium.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onFocus={() => onStartFocus(task)}
                onComplete={() => onComplete(task.id)}
              />
            ))}
            {(!plan?.medium || plan.medium.length === 0) && (
              <p className="text-muted-foreground text-center py-4">Thêm tasks với size "Medium"</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Small Tasks (5) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>⚡ 5 Việc Nhỏ</CardTitle>
                <CardDescription>
                  {plan?.completed.small || 0} / {MAX_DAILY_TASKS.small} hoàn thành
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">{plan?.small.length || 0} tasks</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {plan?.small.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onFocus={() => onStartFocus(task)}
                onComplete={() => onComplete(task.id)}
                size="small"
              />
            ))}
            {(!plan?.small || plan.small.length === 0) && (
              <p className="text-muted-foreground text-center py-4">Thêm tasks với size "Small"</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
