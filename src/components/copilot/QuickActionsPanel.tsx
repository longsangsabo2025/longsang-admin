/**
 * ⚡ Quick Actions Panel
 *
 * Floating panel with common commands for quick access
 * Position: bottom-right corner
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Database,
  FileText,
  BarChart3,
  Share2,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  command: string;
  description: string;
  category: 'content' | 'analytics' | 'automation' | 'system';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'create-post',
    icon: <FileText className="w-4 h-4" />,
    label: 'Tạo bài post',
    command: 'Tạo bài post mới cho dự án',
    description: 'Tạo bài post cho social media',
    category: 'content',
  },
  {
    id: 'backup-db',
    icon: <Database className="w-4 h-4" />,
    label: 'Backup DB',
    command: 'Backup database ngay',
    description: 'Backup database lên Google Drive',
    category: 'system',
  },
  {
    id: 'stats',
    icon: <BarChart3 className="w-4 h-4" />,
    label: 'Thống kê',
    command: 'Cho tôi xem thống kê hôm nay',
    description: 'Xem analytics và metrics',
    category: 'analytics',
  },
  {
    id: 'publish-social',
    icon: <Share2 className="w-4 h-4" />,
    label: 'Đăng social',
    command: 'Đăng bài mới nhất lên tất cả mạng xã hội',
    description: 'Publish to social platforms',
    category: 'content',
  },
  {
    id: 'create-seo',
    icon: <Sparkles className="w-4 h-4" />,
    label: 'Tạo SEO',
    command: 'Tạo bài SEO về bất động sản',
    description: 'Generate SEO content',
    category: 'content',
  },
  {
    id: 'automate-workflow',
    icon: <Zap className="w-4 h-4" />,
    label: 'Tạo workflow',
    command: 'Tạo workflow marketing campaign',
    description: 'Create automation workflow',
    category: 'automation',
  },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface QuickActionsPanelProps {
  onCommandExecute?: (command: string) => void;
  className?: string;
}

export function QuickActionsPanel({ onCommandExecute, className = '' }: QuickActionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  const executeCommand = async (action: QuickAction) => {
    if (onCommandExecute) {
      onCommandExecute(action.command);
      return;
    }

    // Default execution if no handler provided
    setExecuting(action.id);
    try {
      const response = await fetch(`${API_BASE}/api/ai/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: action.command }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Execution failed');
      }

      // Could emit event or show toast here
      console.log('Command executed:', action.label, data);
    } catch (error) {
      console.error('Error executing command:', error);
    } finally {
      setExecuting(null);
    }
  };

  // Group actions by category
  const actionsByCategory = QUICK_ACTIONS.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  const categoryLabels = {
    content: '📝 Content',
    analytics: '📊 Analytics',
    automation: '⚡ Automation',
    system: '🔧 System',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {isOpen ? (
        <Card className="w-80 shadow-2xl border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Quick Actions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {Object.entries(actionsByCategory).map(([category, actions]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <div className="space-y-1">
                  {actions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => executeCommand(action)}
                      disabled={executing === action.id}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <div className="mt-0.5 text-primary">{action.icon}</div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{action.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                        {executing === action.id && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mt-1" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Open Quick Actions"
        >
          <Zap className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}

