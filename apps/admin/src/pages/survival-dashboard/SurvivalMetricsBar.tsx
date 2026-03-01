import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, DollarSign, Target, Brain, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricsData } from './shared';

// =====================================================
// PROPS
// =====================================================

export interface SurvivalMetricsBarProps {
  metrics?: MetricsData;
  isLoading: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

export function SurvivalMetricsBar({ metrics, isLoading }: SurvivalMetricsBarProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const progress = (metrics.currentAmount / metrics.targetAmount) * 100;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Days Remaining */}
      <Card className={cn(
        "border-2",
        metrics.daysRemaining <= 7 ? "border-red-500 bg-red-500/5" : 
        metrics.daysRemaining <= 14 ? "border-yellow-500 bg-yellow-500/5" : 
        "border-green-500/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            Còn lại
          </div>
          <div className="text-3xl font-bold mt-1">
            {metrics.daysRemaining} <span className="text-lg font-normal">ngày</span>
          </div>
        </CardContent>
      </Card>

      {/* Target Amount */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Target className="h-4 w-4" />
            Mục tiêu
          </div>
          <div className="text-3xl font-bold mt-1">
            ${metrics.targetAmount.toLocaleString()}
          </div>
          <Progress value={progress} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            ${metrics.currentAmount} / ${metrics.targetAmount}
          </p>
        </CardContent>
      </Card>

      {/* Daily Target */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <DollarSign className="h-4 w-4" />
            Mỗi ngày cần
          </div>
          <div className="text-3xl font-bold mt-1 text-orange-500">
            ${metrics.dailyTarget}
          </div>
        </CardContent>
      </Card>

      {/* Focus Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Brain className="h-4 w-4" />
            Focus Score
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-3xl font-bold">{metrics.focusScore}%</div>
            {metrics.streakDays > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {metrics.streakDays} ngày
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
