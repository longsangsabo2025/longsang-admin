/**
 * 🚀 Quality Indicator Component
 * Real-time quality score display for image/video generations
 * 
 * Phase 3: Quality & Insights UI
 * @author LongSang (Elon Mode)
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityIndicatorProps {
  score?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function QualityIndicator({ 
  score, 
  grade,
  size = 'md', 
  showLabel = true,
  className 
}: QualityIndicatorProps) {
  if (!score && !grade) return null;

  // Determine grade from score if not provided
  const finalGrade = grade || getGradeFromScore(score || 0);
  const finalScore = score || getScoreFromGrade(finalGrade);

  const { icon: Icon, color, bgColor, label } = getGradeConfig(finalGrade);

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm',
    lg: 'h-6 w-6 text-base'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'flex items-center gap-1.5 font-medium',
        bgColor,
        color,
        className
      )}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && (
        <>
          <span>{finalGrade}</span>
          {score && <span className="text-xs opacity-75">({score})</span>}
        </>
      )}
    </Badge>
  );
}

// Helper functions
function getGradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreFromGrade(grade: string): number {
  switch (grade) {
    case 'A': return 95;
    case 'B': return 85;
    case 'C': return 75;
    case 'D': return 65;
    default: return 50;
  }
}

function getGradeConfig(grade: string) {
  switch (grade) {
    case 'A':
      return {
        icon: Sparkles,
        color: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        label: 'Xuất sắc'
      };
    case 'B':
      return {
        icon: CheckCircle2,
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
        label: 'Tốt'
      };
    case 'C':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-700 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
        label: 'Trung bình'
      };
    case 'D':
      return {
        icon: AlertTriangle,
        color: 'text-orange-700 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
        label: 'Yếu'
      };
    default:
      return {
        icon: XCircle,
        color: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
        label: 'Kém'
      };
  }
}

interface QualityBreakdownProps {
  breakdown: {
    prompt: number;
    metadata: number;
    timing: number;
    result: number;
    provider?: number;
  };
  type: 'image' | 'video';
}

export function QualityBreakdown({ breakdown, type }: QualityBreakdownProps) {
  const categories = type === 'video' 
    ? [
        { key: 'prompt', label: 'Prompt', max: 20 },
        { key: 'metadata', label: 'Metadata', max: 20 },
        { key: 'timing', label: 'Timing', max: 20 },
        { key: 'result', label: 'Result', max: 20 },
        { key: 'provider', label: 'Provider', max: 20 },
      ]
    : [
        { key: 'prompt', label: 'Prompt', max: 25 },
        { key: 'metadata', label: 'Metadata', max: 25 },
        { key: 'timing', label: 'Timing', max: 25 },
        { key: 'result', label: 'Result', max: 25 },
      ];

  return (
    <div className="space-y-2">
      {categories.map(cat => {
        const score = breakdown[cat.key as keyof typeof breakdown] || 0;
        const percentage = (score / cat.max) * 100;
        
        return (
          <div key={cat.key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-medium">{score}/{cat.max}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  percentage >= 80 ? "bg-green-500" :
                  percentage >= 60 ? "bg-blue-500" :
                  percentage >= 40 ? "bg-yellow-500" :
                  "bg-red-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
