/**
 * 🌅 Morning Dashboard Widget
 *
 * Tổng hợp tất cả thông tin quan trọng mỗi sáng:
 * - Errors overnight
 * - Key metrics
 * - Pending tasks
 * - AI suggestions
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Brain,
  Bug,
  RefreshCw,
  Sun,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ErrorSummary {
  total: number;
  critical: number;
  high: number;
  recentErrors: Array<{
    id: string;
    error_type: string;
    error_message: string;
    severity: string;
    created_at: string;
  }>;
}

interface MetricsSummary {
  brainKnowledge: number;
  brainDomains: number;
  activeProjects: number;
  pendingTasks: number;
}

interface AISuggestion {
  id: string;
  type: 'task' | 'insight' | 'warning';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function MorningDashboard() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorSummary | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Fetch errors (last 24h)
      const errorsData = await fetchErrors();
      setErrors(errorsData);

      // Fetch metrics
      const metricsData = await fetchMetrics();
      setMetrics(metricsData);

      // Generate AI suggestions based on data
      const suggestionsData = generateSuggestions(errorsData, metricsData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchErrors = async (): Promise<ErrorSummary> => {
    // In development, backend API may not be running
    // Return mock data to avoid console errors
    if (import.meta.env.DEV) {
      return { total: 0, critical: 0, high: 0, recentErrors: [] };
    }

    try {
      const response = await fetch(`${API_BASE}/api/bug-system/errors?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch errors');

      const data = await response.json();
      const errors = data.data || [];

      return {
        total: errors.length,
        critical: errors.filter((e: any) => e.severity === 'critical').length,
        high: errors.filter((e: any) => e.severity === 'high').length,
        recentErrors: errors.slice(0, 5),
      };
    } catch (error) {
      return { total: 0, critical: 0, high: 0, recentErrors: [] };
    }
  };

  const fetchMetrics = async (): Promise<MetricsSummary> => {
    // In development, backend API may not be running
    // Return mock data to avoid console errors
    if (import.meta.env.DEV) {
      return {
        brainKnowledge: 42,
        brainDomains: 5,
        activeProjects: 8,
        pendingTasks: 3,
      };
    }

    const userId = localStorage.getItem('userId') || '89917901-cf15-45c4-a7ad-8c4c9513347e';

    try {
      // Fetch brain stats
      const brainResponse = await fetch(`${API_BASE}/api/brain/domains?userId=${userId}`, {
        headers: { 'x-user-id': userId },
      });
      const brainData = brainResponse.ok ? await brainResponse.json() : { data: [] };

      // Fetch knowledge count
      const knowledgeResponse = await fetch(`${API_BASE}/api/brain/knowledge?limit=1`, {
        headers: { 'x-user-id': userId },
      });
      const knowledgeData = knowledgeResponse.ok ? await knowledgeResponse.json() : { total: 0 };

      return {
        brainKnowledge: knowledgeData.total || 0,
        brainDomains: brainData.data?.length || 0,
        activeProjects: 8, // Hardcoded for now, can be fetched from projects API
        pendingTasks: 0, // Can be fetched from task system
      };
    } catch (error) {
      return { brainKnowledge: 0, brainDomains: 0, activeProjects: 0, pendingTasks: 0 };
    }
  };

  const generateSuggestions = (
    errors: ErrorSummary | null,
    metrics: MetricsSummary | null
  ): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    // Error-based suggestions
    if (errors && errors.critical > 0) {
      suggestions.push({
        id: 'critical-errors',
        type: 'warning',
        title: `${errors.critical} Critical Errors cần xử lý`,
        description: 'Có lỗi nghiêm trọng cần attention ngay',
        action: { label: 'Xem Bug System', href: '/admin/bug-system' },
      });
    }

    // Brain-based suggestions
    if (metrics && metrics.brainKnowledge < 20) {
      suggestions.push({
        id: 'add-knowledge',
        type: 'task',
        title: 'Nạp thêm knowledge vào AI Brain',
        description: `Hiện có ${metrics.brainKnowledge} items. Chạy auto-scan để thêm docs từ workspace.`,
        action: { label: 'Mở Brain', href: '/admin/brain' },
      });
    }

    // Daily tasks
    suggestions.push({
      id: 'daily-backup',
      type: 'task',
      title: 'Backup hàng ngày',
      description: 'Đảm bảo data được backup lên Google Drive',
      action: { label: 'Backup', href: '/admin/backup' },
    });

    // Insight
    suggestions.push({
      id: 'ai-insight',
      type: 'insight',
      title: 'Tip: Sử dụng AI Workspace hiệu quả',
      description: 'Dùng Research assistant cho market research, Code assistant khi coding.',
      action: { label: 'Mở AI Workspace', href: '/admin/ai-workspace' },
    });

    return suggestions;
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="h-8 w-8 text-yellow-500" />
          <div>
            <CardTitle className="text-2xl">{greeting}, Boss! 👋</CardTitle>
            <CardDescription>
              Đây là tổng quan cho ngày{' '}
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Errors */}
          <Card className={errors && errors.critical > 0 ? 'border-red-500/50 bg-red-500/5' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Errors (24h)</p>
                  <p className="text-2xl font-bold">{errors?.total || 0}</p>
                </div>
                <Bug
                  className={`h-8 w-8 ${errors && errors.critical > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
                />
              </div>
              {errors && errors.critical > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {errors.critical} critical
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Brain Knowledge */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Brain Knowledge</p>
                  <p className="text-2xl font-bold">{metrics?.brainKnowledge || 0}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.brainDomains || 0} domains
              </p>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{metrics?.activeProjects || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="text-2xl font-bold text-green-500">Online</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: Recent Errors & AI Suggestions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Errors */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Recent Errors
                </CardTitle>
                <Link to="/admin/bug-system">
                  <Button variant="ghost" size="sm">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {errors && errors.recentErrors.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {errors.recentErrors.map((error) => (
                      <div
                        key={error.id}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <Badge
                          variant={error.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {error.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{error.error_type}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {error.error_message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(error.created_at), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
                  <p>Không có lỗi mới! 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={`p-3 rounded-lg border ${
                        suggestion.type === 'warning'
                          ? 'border-yellow-500/50 bg-yellow-500/5'
                          : suggestion.type === 'task'
                            ? 'border-blue-500/50 bg-blue-500/5'
                            : 'border-purple-500/50 bg-purple-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                        {suggestion.action && (
                          <Link to={suggestion.action.href}>
                            <Button size="sm" variant="outline">
                              {suggestion.action.label}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/brain">
            <Button variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              AI Brain
            </Button>
          </Link>
          <Link to="/admin/ai-workspace">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Workspace
            </Button>
          </Link>
          <Link to="/admin/bug-system">
            <Button variant="outline" size="sm">
              <Bug className="h-4 w-4 mr-2" />
              Bug System
            </Button>
          </Link>
          <Link to="/admin/backup">
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Backup
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default MorningDashboard;
