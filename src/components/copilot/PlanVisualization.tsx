/**
 * 📊 Plan Visualization Component
 *
 * Advanced visualization of execution plans
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanStep {
  id: string;
  name: string;
  description: string;
  dependencies?: string[];
  estimatedTime?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

interface PlanVisualizationProps {
  plan: {
    steps: PlanStep[];
    estimatedTotalTime?: number;
    canParallel?: boolean;
  };
  showTimeline?: boolean;
  showDependencies?: boolean;
  className?: string;
}

export function PlanVisualization({
  plan,
  showTimeline = true,
  showDependencies = true,
  className,
}: PlanVisualizationProps) {
  const [executionState, setExecutionState] = useState<Map<string, PlanStep['status']>>(
    new Map(plan.steps.map((step) => [step.id, step.status || 'pending']))
  );

  const getStepStatus = (stepId: string) => {
    return executionState.get(stepId) || 'pending';
  };

  const getStatusIcon = (status: PlanStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PlanStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            Hoàn thành
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-500">
            Đang chạy
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="outline">Chờ</Badge>;
    }
  };

  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Build dependency graph
  const buildDependencyGraph = () => {
    const graph = new Map<string, string[]>();
    plan.steps.forEach((step) => {
      if (step.dependencies && step.dependencies.length > 0) {
        graph.set(step.id, step.dependencies);
      } else {
        graph.set(step.id, []);
      }
    });
    return graph;
  };

  // Calculate execution order
  const getExecutionOrder = () => {
    const graph = buildDependencyGraph();
    const order: string[][] = [];
    const processed = new Set<string>();

    while (processed.size < plan.steps.length) {
      const currentLevel: string[] = [];
      plan.steps.forEach((step) => {
        if (!processed.has(step.id)) {
          const deps = graph.get(step.id) || [];
          const allDepsProcessed = deps.every((dep) => processed.has(dep));
          if (allDepsProcessed) {
            currentLevel.push(step.id);
          }
        }
      });
      order.push(currentLevel);
      currentLevel.forEach((id) => processed.add(id));
    }

    return order;
  };

  const executionOrder = getExecutionOrder();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Execution Plan</span>
          <div className="flex items-center gap-2">
            {plan.canParallel && <Badge variant="outline">Parallel Execution</Badge>}
            {plan.estimatedTotalTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatTime(plan.estimatedTotalTime)}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline View */}
        {showTimeline && (
          <div className="space-y-4">
            {executionOrder.map((level, levelIndex) => (
              <div key={levelIndex} className="space-y-2">
                {levelIndex > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-0.5 bg-border ml-6" />
                    <Badge variant="outline" className="text-xs">
                      Level {levelIndex + 1}
                      {level.length > 1 && ` (${level.length} parallel)`}
                    </Badge>
                  </div>
                )}
                <div className={cn('grid gap-2', level.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {level.map((stepId) => {
                    const step = plan.steps.find((s) => s.id === stepId);
                    if (!step) return null;

                    const status = getStepStatus(step.id);
                    const hasDeps = step.dependencies && step.dependencies.length > 0;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          'p-4 border rounded-lg space-y-2',
                          status === 'completed' && 'bg-green-50 border-green-200',
                          status === 'running' && 'bg-blue-50 border-blue-200',
                          status === 'failed' && 'bg-red-50 border-red-200'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {getStatusIcon(status)}
                            <div className="flex-1">
                              <div className="font-medium">{step.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {step.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                            {step.estimatedTime && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(step.estimatedTime)}
                              </div>
                            )}
                          </div>
                        </div>

                        {showDependencies && hasDeps && (
                          <div className="text-xs text-muted-foreground pl-6">
                            Depends on: {step.dependencies?.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Steps</div>
              <div className="font-medium">{plan.steps.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Parallel Levels</div>
              <div className="font-medium">{executionOrder.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Est. Time</div>
              <div className="font-medium">{formatTime(plan.estimatedTotalTime)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
