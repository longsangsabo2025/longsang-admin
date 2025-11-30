/**
 * ⌨️ Command Input Component
 *
 * Natural language command input with autocomplete and execution preview
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ExecutionPlanPreview } from '@/components/copilot/ExecutionPlanPreview';
import { ChevronDown, ChevronUp, History, Loader2, Send, Sparkles, Filter } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CommandResult {
  id: string;
  command: string;
  result: any;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  project_id?: string | null;
  project_name?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Quick action presets
const QUICK_ACTIONS = [
  { icon: '📝', label: 'Tạo bài post', command: 'Tạo bài post mới cho dự án' },
  { icon: '💾', label: 'Backup DB', command: 'Backup database ngay' },
  { icon: '📊', label: 'Thống kê', command: 'Cho tôi xem thống kê hôm nay' },
  { icon: '🔍', label: 'Tạo SEO', command: 'Tạo bài SEO về bất động sản' },
];

// Command suggestions
const COMMAND_SUGGESTIONS = [
  'Tạo bài post về dự án Vũng Tàu',
  'Backup database lên Google Drive',
  'Tạo 5 bài SEO cho từ khóa bất động sản',
  'Thống kê workflows hôm nay',
  'Lên lịch đăng bài lúc 9h sáng',
  'Tạo workflow marketing campaign',
];

export function CommandInput() {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string>('');
  const [executionPlan, setExecutionPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load projects for context
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setProjects(data);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  // Load command history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_command_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.slice(0, 20)); // Last 20 commands
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  // Fetch suggestions when typing
  useEffect(() => {
    if (command.length > 2) {
      const filtered = COMMAND_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(command.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [command]);

  // Generate execution plan (preview) - Only parses, doesn't execute
  const generateExecutionPlan = async (cmd: string) => {
    if (!cmd.trim()) return;

    setPendingCommand(cmd);
    setPlanLoading(true);

    try {
      // Parse command in preview mode (doesn't execute)
      const response = await fetch(`${API_BASE}/api/ai/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, preview_only: true }),
      });

      const data = await response.json();

      if (data.success && data.parsed) {
        // Build execution plan from parsed result (without executing)
        const plan = {
          steps: [] as any[],
          estimatedTotalTime: '',
          workflowCount: data.parsed.functions?.length || 0, // Will generate this many workflows
          functionName: data.parsed.functions?.[0]?.name,
          functionArgs: data.parsed.functions?.[0]?.arguments,
        };

        // Step 1: Load context
        plan.steps.push({
          id: 'step-context',
          name: 'Load Business Context',
          description: 'Load projects, workflows, and execution history',
          estimatedTime: '~1s',
        });

        // Step 2: Parse command (already done, but show in plan)
        plan.steps.push({
          id: 'step-parse',
          name: 'Parse Command',
          description: `Identify action: ${plan.functionName || 'unknown'}`,
          estimatedTime: '~2s',
        });

        // Step 3: Generate workflow(s)
        plan.steps.push({
          id: 'step-generate',
          name: 'Generate Workflow(s)',
          description: `Create ${plan.workflowCount} workflow definition(s)`,
          estimatedTime: '~5s',
        });

        // Step 4: Execute function(s)
        data.parsed.functions?.forEach((func: any, index: number) => {
          plan.steps.push({
            id: `step-exec-${index}`,
            name: `Execute ${func.name}`,
            description: `Run function: ${func.name} with parameters`,
            estimatedTime: '~30s',
          });
        });

        plan.estimatedTotalTime = `~${plan.steps.length * 10}s`;
        setExecutionPlan(plan);
        setShowPlanPreview(true);
      } else {
        // If parsing fails, show error and don't execute
        toast({
          title: '❌ Parse Error',
          description: data.error || 'Không thể parse command',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: '❌ Error',
        description: 'Không thể tạo execution plan',
        variant: 'destructive',
      });
    } finally {
      setPlanLoading(false);
    }
  };

  // Execute command directly (without preview)
  const executeCommandDirectly = async (cmd: string) => {
    if (!cmd.trim()) return;

    setLoading(true);
    const newEntry: CommandResult = {
      id: Date.now().toString(),
      command: cmd,
      result: null,
      timestamp: new Date(),
      status: 'pending',
    };

    setHistory((prev) => [newEntry, ...prev.slice(0, 19)]);
    setCommand('');
    setShowSuggestions(false);
    setShowPlanPreview(false);

    try {
      const response = await fetch(`${API_BASE}/api/ai/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await response.json();

      // Extract project context from response
      const projectId = data.parsed?.functions?.[0]?.arguments?.project_id ||
                       data.context_used?.project_id ||
                       null;

      // Find project name
      const project = projects.find(p => p.id === projectId);
      const projectName = project?.name || null;

      setHistory((prev) =>
        prev.map((h) =>
          h.id === newEntry.id
            ? {
                ...h,
                result: data,
                status: data.success ? 'success' : 'error',
                project_id: projectId,
                project_name: projectName,
              }
            : h
        )
      );

      // Update saved history with project context
      const updatedEntry = {
        ...newEntry,
        result: data,
        status: data.success ? 'success' : 'error',
        project_id: projectId,
        project_name: projectName,
      };
      const updatedHistory = [updatedEntry, ...history.slice(0, 19)];
      localStorage.setItem('ai_command_history', JSON.stringify(updatedHistory));

      toast({
        title: data.success ? '✅ Hoàn thành' : '❌ Lỗi',
        description: data.message || data.error || 'Command executed',
        variant: data.success ? 'default' : 'destructive',
      });
    } catch (error) {
      setHistory((prev) =>
        prev.map((h) => (h.id === newEntry.id ? { ...h, result: error, status: 'error' } : h))
      );

      toast({
        title: '❌ Lỗi',
        description: 'Không thể thực hiện command',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="command-input">
      {/* Command Input */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Command Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                data-testid="command-input-field"
                placeholder="Gõ lệnh bằng tiếng Việt... (VD: Tạo bài post về dự án X)"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && !planLoading) {
                    generateExecutionPlan(command);
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setShowPlanPreview(false);
                  }
                }}
                onFocus={() => {
                  if (command.length > 2) {
                    setShowSuggestions(true);
                  }
                }}
                className="flex-1"
                disabled={loading}
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                  {suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                      onClick={() => {
                        setCommand(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => generateExecutionPlan(command)}
              disabled={loading || planLoading || !command.trim()}
            >
              {loading || planLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {QUICK_ACTIONS.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => generateExecutionPlan(action.command)}
                disabled={loading || planLoading}
                className="text-xs"
              >
                <span className="mr-1">{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Lịch sử commands
                <Badge variant="secondary">{history.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {projects.length > 0 && (
                  <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
                    <SelectTrigger className="w-[180px] h-8">
                      <Filter className="h-3 w-3 mr-2" />
                      <SelectValue placeholder="Tất cả projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showHistory && (
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-auto">
                {history
                  .filter((item) => {
                    if (selectedProjectFilter === 'all') return true;
                    if (selectedProjectFilter === 'no-project') return !item.project_id;
                    return item.project_id === selectedProjectFilter;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-muted/50"
                      data-testid="command-result"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <code className="text-sm font-medium break-words">{item.command}</code>
                          {item.project_name && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              📁 {item.project_name}
                            </Badge>
                          )}
                          {!item.project_id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              🌐 System
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant={
                            item.status === 'success'
                              ? 'default'
                              : item.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </div>
                      {item.result && (
                        <pre className="text-xs text-muted-foreground overflow-auto mt-2 max-h-32">
                          {JSON.stringify(item.result, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                {history.filter((item) => {
                  if (selectedProjectFilter === 'all') return true;
                  if (selectedProjectFilter === 'no-project') return !item.project_id;
                  return item.project_id === selectedProjectFilter;
                }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Không có command nào cho project này
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Execution Plan Preview */}
      <ExecutionPlanPreview
        plan={executionPlan}
        open={showPlanPreview}
        onConfirm={async () => {
          const cmdToExecute = pendingCommand || command;
          setShowPlanPreview(false);
          setPendingCommand('');
          await executeCommandDirectly(cmdToExecute);
        }}
        onCancel={() => {
          setShowPlanPreview(false);
          setExecutionPlan(null);
          setPendingCommand('');
        }}
        loading={loading}
      />
    </div>
  );
}
