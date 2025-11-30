/**
 * 💡 Suggestion Card Component
 *
 * Displays a single suggestion with execute/dismiss actions
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCircle2, X, Loader2, Lightbulb, Clock, TrendingUp } from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'action' | 'reminder' | 'insight';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggested_action?: {
    action: string;
    parameters?: any;
  };
  estimated_impact?: string;
  project_id?: string | null;
  project_name?: string | null;
  score?: number;
  created_at?: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onExecute: () => void;
  onDismiss: () => void;
  executing?: boolean;
}

export function SuggestionCard({ suggestion, onExecute, onDismiss, executing }: SuggestionCardProps) {
  const typeConfig = {
    action: { label: 'Hành động', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-blue-500' },
    reminder: { label: 'Nhắc nhở', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500' },
    insight: { label: 'Insight', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-purple-500' },
  };

  const priorityConfig = {
    high: { label: 'Cao', color: 'bg-red-500', badge: 'destructive' as const },
    medium: { label: 'Trung bình', color: 'bg-yellow-500', badge: 'default' as const },
    low: { label: 'Thấp', color: 'bg-gray-500', badge: 'secondary' as const },
  };

  const config = typeConfig[suggestion.type] || typeConfig.action;
  const priority = priorityConfig[suggestion.priority] || priorityConfig.medium;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${config.color} text-white`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{config.label}</span>
                <Badge variant={priority.badge} className="text-xs">
                  {priority.label}
                </Badge>
                {suggestion.score && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {Math.round(suggestion.score)}
                  </Badge>
                )}
              </div>
              {suggestion.project_name && (
                <Badge variant="outline" className="text-xs mt-1">
                  {suggestion.project_name}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
            disabled={executing}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <p className="text-sm text-foreground mb-2">{suggestion.reason}</p>
        {suggestion.estimated_impact && (
          <p className="text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            {suggestion.estimated_impact}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={onExecute}
          disabled={executing}
        >
          {executing ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Đang thực hiện...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3 mr-2" />
              Thực hiện ngay
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          disabled={executing}
        >
          <X className="h-3 w-3 mr-2" />
          Bỏ qua
        </Button>
      </CardFooter>
    </Card>
  );
}

