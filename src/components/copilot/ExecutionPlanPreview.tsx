/**
 * 📋 Execution Plan Preview
 *
 * Shows execution plan before executing command
 * User can confirm or cancel
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Clock,
  FileText,
  Play,
  Settings,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface ExecutionStep {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  estimatedTime?: string;
  dependencies?: string[];
}

interface ExecutionPlan {
  steps: ExecutionStep[];
  estimatedTotalTime?: string;
  workflowCount?: number;
  functionName?: string;
  functionArgs?: Record<string, any>;
}

interface ExecutionPlanPreviewProps {
  plan: ExecutionPlan | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const STEP_ICONS = {
  context: <Settings className="w-4 h-4" />,
  generate: <Sparkles className="w-4 h-4" />,
  create: <FileText className="w-4 h-4" />,
  execute: <Play className="w-4 h-4" />,
  default: <CheckCircle2 className="w-4 h-4" />,
};

export function ExecutionPlanPreview({
  plan,
  open,
  onConfirm,
  onCancel,
  loading = false,
}: ExecutionPlanPreviewProps) {
  if (!plan) return null;

  const getStepIcon = (stepName: string) => {
    const name = stepName.toLowerCase();
    if (name.includes('context') || name.includes('load')) return STEP_ICONS.context;
    if (name.includes('generate') || name.includes('create content')) return STEP_ICONS.generate;
    if (name.includes('create') || name.includes('workflow')) return STEP_ICONS.create;
    if (name.includes('execute') || name.includes('run')) return STEP_ICONS.execute;
    return STEP_ICONS.default;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Xác nhận Execution Plan
          </DialogTitle>
          <DialogDescription>
            Kiểm tra các bước sẽ được thực hiện trước khi chạy command
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Function Info */}
          {plan.functionName && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Function</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{plan.functionName}</Badge>
                    {plan.workflowCount && (
                      <Badge variant="secondary">
                        {plan.workflowCount} workflow(s)
                      </Badge>
                    )}
                  </div>
                  {plan.functionArgs && Object.keys(plan.functionArgs).length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <strong>Parameters:</strong>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(plan.functionArgs, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execution Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Execution Steps ({plan.steps.length})
              </CardTitle>
              {plan.estimatedTotalTime && (
                <CardDescription>
                  Estimated time: {plan.estimatedTotalTime}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                        {step.icon || getStepIcon(step.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Step {index + 1}
                        </Badge>
                        <h4 className="text-sm font-medium">{step.name}</h4>
                      </div>
                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      )}
                      {step.estimatedTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {step.estimatedTime}
                        </div>
                      )}
                      {step.dependencies && step.dependencies.length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Depends on: {step.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang thực hiện...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Xác nhận & Thực hiện
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

