/**
 * 💡 Proactive Suggestions Panel
 *
 * Displays AI-generated proactive suggestions
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Info, Lightbulb, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Suggestion {
  id: string;
  type: 'action' | 'workflow' | 'optimization' | 'alert';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggested_workflow_id?: string;
  suggested_action?: {
    action: string;
    parameters: Record<string, any>;
  };
  estimated_impact?: string;
  created_at: string;
  project_context?: string | null;
  project_name?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PRIORITY_CONFIG = {
  high: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  medium: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: <Info className="w-4 h-4" />,
  },
  low: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Info className="w-4 h-4" />,
  },
};

const TYPE_CONFIG = {
  action: { label: 'Hành động', icon: <Zap className="w-4 h-4" /> },
  workflow: { label: 'Workflow', icon: <Sparkles className="w-4 h-4" /> },
  optimization: { label: 'Tối ưu', icon: <TrendingUp className="w-4 h-4" /> },
  alert: { label: 'Cảnh báo', icon: <AlertTriangle className="w-4 h-4" /> },
};

export function ProactiveSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/ai/suggestions`);
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSuggestions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/suggestions/${id}/dismiss`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        toast({
          title: 'Đã bỏ qua',
          description: 'Suggestion đã được dismiss',
        });
      }
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể dismiss suggestion',
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async (suggestion: Suggestion) => {
    try {
      setExecuting(suggestion.id);
      const response = await fetch(`${API_BASE}/api/ai/suggestions/${suggestion.id}/execute`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        toast({
          title: '✅ Thành công',
          description: 'Đã thực hiện suggestion',
        });
      } else {
        throw new Error(data.error || 'Execution failed');
      }
    } catch (error) {
      console.error('Error executing suggestion:', error);
      toast({
        title: '❌ Lỗi',
        description: error instanceof Error ? error.message : 'Không thể thực hiện suggestion',
        variant: 'destructive',
      });
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-muted-foreground">Đang tải suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show panel if no suggestions
  }

  // Group by priority
  const highPriority = suggestions.filter((s) => s.priority === 'high');
  const mediumPriority = suggestions.filter((s) => s.priority === 'medium');
  const lowPriority = suggestions.filter((s) => s.priority === 'low');

  return (
    <div className="space-y-4 mb-6" data-testid="suggestions-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">💡 AI Đề Xuất</h3>
          <Badge variant="secondary">{suggestions.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchSuggestions}>
          Refresh
        </Button>
      </div>

      {/* High Priority Suggestions */}
      {highPriority.length > 0 && (
        <div className="space-y-2">
          {highPriority.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={handleDismiss}
              onExecute={handleExecute}
              executing={executing === suggestion.id}
            />
          ))}
        </div>
      )}

      {/* Medium Priority Suggestions */}
      {mediumPriority.length > 0 && (
        <div className="space-y-2">
          {mediumPriority.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={handleDismiss}
              onExecute={handleExecute}
              executing={executing === suggestion.id}
            />
          ))}
        </div>
      )}

      {/* Low Priority Suggestions */}
      {lowPriority.length > 0 && (
        <details className="space-y-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {lowPriority.length} suggestion(s) khác
          </summary>
          <div className="mt-2 space-y-2">
            {lowPriority.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={handleDismiss}
                onExecute={handleExecute}
                executing={executing === suggestion.id}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onDismiss,
  onExecute,
  executing,
}: {
  suggestion: Suggestion;
  onDismiss: (id: string) => void;
  onExecute: (suggestion: Suggestion) => void;
  executing: boolean;
}) {
  // Safe access with fallback defaults
  const priorityConfig = PRIORITY_CONFIG[suggestion.priority] || PRIORITY_CONFIG.low;
  const typeConfig = TYPE_CONFIG[suggestion.type] || {
    label: suggestion.type || 'Suggestion',
    icon: <Info className="w-4 h-4" />,
  };

  return (
    <Card
      data-testid="suggestion-card"
      className={`border-l-4 ${
        suggestion.priority === 'high'
          ? 'border-l-red-500'
          : suggestion.priority === 'medium'
            ? 'border-l-yellow-500'
            : 'border-l-blue-500'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {typeConfig.icon}
              <CardTitle className="text-base">{typeConfig.label}</CardTitle>
              <Badge className={priorityConfig.color}>
                {priorityConfig.icon}
                <span className="ml-1">{suggestion.priority}</span>
              </Badge>
            </div>
            <CardDescription className="text-sm">{suggestion.reason}</CardDescription>
            {suggestion.project_context && suggestion.project_name && (
              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  📁 {suggestion.project_name}
                </Badge>
              </div>
            )}
            {suggestion.estimated_impact && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Impact: {suggestion.estimated_impact}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(suggestion.id)}
            className="h-8 w-8 p-0"
            data-testid="dismiss-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          {suggestion.suggested_workflow_id || suggestion.suggested_action ? (
            <Button
              size="sm"
              onClick={() => onExecute(suggestion)}
              disabled={executing}
              className="flex-1"
            >
              {executing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang thực hiện...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Thực hiện ngay
                </>
              )}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Không có action
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
