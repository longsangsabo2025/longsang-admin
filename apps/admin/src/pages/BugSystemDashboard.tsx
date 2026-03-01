/**
 * Bug System Dashboard v2.0
 *
 * UI để theo dõi và quản lý:
 * - Error logs từ database
 * - Auto-fix history (healing actions)
 * - Alert logs (Slack/Discord/Telegram)
 * - AI Fix suggestions
 * - Predictive analytics
 * - Statistics & MTTR metrics
 * - Trigger auto-fix manually
 */

import { ErrorDetailsModal } from '@/components/bug-system/ErrorDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  getErrorStatistics,
  getHealingActionDetails,
  getHealingStatistics,
  triggerAutoFix,
} from '@/lib/bug-system/api';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  project_name?: string;
  page_url?: string;
  created_at: string;
  context?: any;
}

interface HealingAction {
  id: string;
  error_log_id: string;
  action_type: string;
  action_result: 'success' | 'failed' | 'skipped' | 'timeout';
  retry_count: number;
  execution_time_ms?: number;
  details?: any;
  created_at: string;
}

// v2.0 Types
interface AlertLog {
  id: string;
  error_id?: string;
  channel: 'slack' | 'discord' | 'telegram' | 'email';
  severity: string;
  title?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  project_name?: string;
  created_at: string;
}

interface AIFixSuggestion {
  id: string;
  error_id?: string;
  error_type: string;
  error_message: string;
  analysis: any;
  suggested_fix?: string;
  fix_code?: string;
  confidence: number;
  ai_model: string;
  was_applied: boolean;
  applied_at?: string;
  success?: boolean;
  created_at: string;
}

interface PredictionLog {
  id: string;
  prediction_type: string;
  severity: string;
  probability: number;
  predicted_at: string;
  description: string;
  recommendations: string[];
  was_accurate?: boolean;
  created_at: string;
}

// Copilot Auto-Fix History (from file watcher)
interface CopilotFix {
  id: string;
  timestamp: string;
  error: string;
  file: string;
  line: number;
  status: 'auto-fixed' | 'auto-fix-triggered' | 'pending' | 'failed';
  fixApplied?: string;
  sentryId?: string;
}

export default function BugSystemDashboard() {
  // Restore scroll & persist tab/filter states
  useScrollRestore('bug-system-dashboard');
  const [activeTab, setActiveTab] = usePersistedState('bug-system-tab', 'errors');
  const [searchTerm, setSearchTerm] = usePersistedState('bug-system-search', '');
  const [severityFilter, setSeverityFilter] = usePersistedState('bug-system-severity', 'all');

  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [healingActions, setHealingActions] = useState<HealingAction[]>([]);
  // v2.0 States
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AIFixSuggestion[]>([]);
  const [predictions, setPredictions] = useState<PredictionLog[]>([]);
  const [copilotFixes, setCopilotFixes] = useState<CopilotFix[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [selectedAction, setSelectedAction] = useState<HealingAction | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  // Fetch errors
  const fetchErrors = async () => {
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .eq('project_name', 'longsang-admin')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search term
      let filtered = data || [];
      if (searchTerm) {
        filtered = filtered.filter(
          (e) =>
            e.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.error_message.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setErrors(filtered);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch errors',
        variant: 'destructive',
      });
    }
  };

  // Fetch healing actions
  const fetchHealingActions = async () => {
    try {
      const { data, error } = await supabase
        .from('healing_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHealingActions(data || []);
    } catch (error) {
      console.error('Failed to fetch healing actions:', error);
    }
  };

  // v2.0: Fetch alert logs
  const fetchAlertLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlertLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch alert logs:', error);
    }
  };

  // v2.0: Fetch AI suggestions
  const fetchAISuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_fix_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table may not exist - silently fail
        console.warn('ai_fix_suggestions table not accessible:', error.message);
        setAISuggestions([]);
        return;
      }
      setAISuggestions(data || []);
    } catch (error) {
      console.warn('Failed to fetch AI suggestions:', error);
      setAISuggestions([]);
    }
  };

  // v2.0: Fetch predictions
  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table may not exist - silently fail
        console.warn('predictions_log table not accessible:', error.message);
        setPredictions([]);
        return;
      }
      setPredictions(data || []);
    } catch (error) {
      console.warn('Failed to fetch predictions:', error);
      setPredictions([]);
    }
  };

  // Fetch Copilot Auto-Fix History from API
  const fetchCopilotFixes = async () => {
    try {
      const response = await fetch('/api/copilot-bridge/fix-history');
      if (response.ok) {
        const data = await response.json();
        setCopilotFixes(Array.isArray(data) ? data : [data].filter(Boolean));
      }
    } catch (error) {
      console.error('Failed to fetch copilot fixes:', error);
      // Fallback: try to read from local
      setCopilotFixes([]);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const errorStats = await getErrorStatistics(7);
      const healingStats = await getHealingStatistics(7);

      setStatistics({
        ...errorStats,
        ...healingStats,
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchErrors(),
      fetchHealingActions(),
      fetchStatistics(),
      fetchAlertLogs(),
      fetchAISuggestions(),
      fetchPredictions(),
      fetchCopilotFixes(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [severityFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Trigger auto-fix (scan, fix, analyze, or clear mode)
  const handleAutoFix = async (mode: 'scan' | 'fix' | 'analyze' | 'clear' = 'scan') => {
    setFixing(true);

    const titles = {
      scan: 'Scanning...',
      fix: 'Auto-Fix Started',
      analyze: 'Analyzing...',
      clear: 'Clearing Logs...',
    };
    const descriptions = {
      scan: 'Scanning for ESLint errors...',
      fix: 'Running ESLint --fix (page may reload)...',
      analyze: 'Analyzing error patterns for insights...',
      clear: 'Deleting all error logs from database...',
    };

    toast({
      title: titles[mode],
      description: descriptions[mode],
    });

    try {
      const result = await triggerAutoFix(mode);

      if (result.success) {
        const successTitles = {
          scan: 'Scan Completed',
          fix: 'Auto-Fix Completed',
          analyze: 'Analysis Complete',
          clear: 'Logs Cleared',
        };

        // Special handling for analyze mode - show detailed results
        if (mode === 'analyze' && result.topPatterns) {
          const patternList = result.topPatterns
            .slice(0, 3)
            .map(
              (p: { message: string; count: number }) =>
                `• ${p.count}x: ${p.message.substring(0, 50)}...`
            )
            .join('\n');

          toast({
            title: `📊 ${result.total} Errors Analyzed`,
            description:
              result.total > 0
                ? `Top patterns:\n${patternList}\n\nReview before clearing!`
                : 'No errors found. Database is clean! ✨',
          });
        } else {
          toast({
            title: successTitles[mode],
            description:
              result.message ||
              (mode === 'clear'
                ? 'All error logs have been deleted'
                : `Found ${result.skipped} errors${mode === 'fix' ? `, fixed ${result.fixed}` : ''}`),
          });
        }

        // Show warning if files were modified
        if (result.warning) {
          setTimeout(() => {
            toast({
              title: '⚠️ Warning',
              description: result.warning,
              variant: 'destructive',
            });
          }, 500);
        }
      } else {
        const failTitles = {
          scan: 'Scan Failed',
          fix: 'Auto-Fix Failed',
          analyze: 'Analysis Failed',
          clear: 'Clear Failed',
        };
        toast({
          title: failTitles[mode],
          description: result.errors || 'Unknown error',
          variant: 'destructive',
        });
      }

      // Refresh data after operation (skip for fix mode to avoid HMR conflict)
      if (mode === 'scan' || mode === 'clear' || mode === 'analyze') {
        await loadData();
      }
    } catch (error) {
      toast({
        title: 'Operation Failed',
        description: error instanceof Error ? error.message : 'Failed to run auto-fix',
        variant: 'destructive',
      });
    } finally {
      setFixing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'skipped':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bug System Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage errors & auto-fix results</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => handleAutoFix('scan')}
            disabled={fixing}
            variant="outline"
            size="sm"
          >
            <Search className="h-4 w-4 mr-2" />
            {fixing ? 'Scanning...' : 'Scan ESLint'}
          </Button>
          <Button
            onClick={() => handleAutoFix('analyze')}
            disabled={fixing}
            size="sm"
            variant="secondary"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {fixing ? 'Analyzing...' : 'Analyze Errors'}
          </Button>
          <Button
            onClick={() => handleAutoFix('clear')}
            disabled={fixing}
            size="sm"
            variant="outline"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {fixing ? 'Clearing...' : 'Clear All Logs'}
          </Button>
          <Button
            onClick={() => handleAutoFix('fix')}
            disabled={fixing}
            size="sm"
            variant="destructive"
          >
            <Wrench className="h-4 w-4 mr-2" />
            {fixing ? 'Fixing...' : 'Auto-Fix (HMR)'}
          </Button>
        </div>
      </div>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Errors (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_errors ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {statistics.critical_errors || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Auto-Fixes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {statistics.total_actions || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.success_rate ? `${statistics.success_rate}%` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="errors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Errors ({errors.length})
          </TabsTrigger>
          <TabsTrigger value="healing">
            <Sparkles className="h-4 w-4 mr-2" />
            Healing ({healingActions.length})
          </TabsTrigger>
          <TabsTrigger value="copilot">
            <Wrench className="h-4 w-4 mr-2" />
            Copilot ({copilotFixes.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-4 w-4 mr-2" />
            Alerts ({alertLogs.length})
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="h-4 w-4 mr-2" />
            AI Fixes ({aiSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <TrendingUp className="h-4 w-4 mr-2" />
            Predictions ({predictions.length})
          </TabsTrigger>
        </TabsList>

        {/* Error Logs Tab */}
        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search errors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Errors Table */}
          <Card>
            <CardHeader>
              <CardTitle>Error Logs ({errors.length})</CardTitle>
              <CardDescription>Recent errors from the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No errors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      errors.map((error) => (
                        <TableRow key={error.id}>
                          <TableCell className="font-medium">{error.error_type}</TableCell>
                          <TableCell className="max-w-md truncate">{error.error_message}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{error.project_name || 'N/A'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(error.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedError(error);
                                setErrorModalOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Healing Actions Tab */}
        <TabsContent value="healing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Healing Actions ({healingActions.length})</CardTitle>
              <CardDescription>Auto-fix history and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action Type</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Retry Count</TableHead>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healingActions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No healing actions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      healingActions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell className="font-medium">{action.action_type}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(action.action_result)}>
                              {action.action_result}
                            </Badge>
                          </TableCell>
                          <TableCell>{action.retry_count}</TableCell>
                          <TableCell>
                            {action.execution_time_ms ? `${action.execution_time_ms}ms` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(action.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const details = await getHealingActionDetails(action.id);
                                setSelectedAction(details ?? action);
                                setActionModalOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Copilot Auto-Fix Tab */}
        <TabsContent value="copilot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                Copilot Auto-Fix History ({copilotFixes.length})
              </CardTitle>
              <CardDescription>
                Sentry errors automatically detected and fixed by VS Code Copilot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead>Fix Applied</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {copilotFixes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          <div className="py-8">
                            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>No Copilot fixes recorded yet.</p>
                            <p className="text-sm mt-2">
                              Fixes will appear here when Sentry detects errors and Copilot
                              auto-fixes them.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      copilotFixes.map((fix, index) => (
                        <TableRow key={fix.id || index}>
                          <TableCell>
                            {fix.status === 'auto-fixed' ? (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fixed
                              </Badge>
                            ) : fix.status === 'auto-fix-triggered' ? (
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Triggered
                              </Badge>
                            ) : fix.status === 'failed' ? (
                              <Badge className="bg-red-500 hover:bg-red-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate font-mono text-sm">
                            {fix.error}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-blue-600">
                            {fix.file?.split('/').pop() || fix.file}
                          </TableCell>
                          <TableCell className="text-center font-mono">{fix.line || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {fix.fixApplied || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {fix.timestamp ? new Date(fix.timestamp).toLocaleString('vi-VN') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchCopilotFixes}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      'vscode://file/D:/0.PROJECTS/.copilot-errors/fix-history.json',
                      '_blank'
                    )
                  }
                >
                  Open in VS Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Logs Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Logs ({alertLogs.length})
              </CardTitle>
              <CardDescription>Notifications sent via Slack, Discord, Telegram</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No alerts sent yet. Configure webhooks in .env to enable alerts.
                        </TableCell>
                      </TableRow>
                    ) : (
                      alertLogs.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {alert.channel === 'slack' && '💬 '}
                              {alert.channel === 'discord' && '🎮 '}
                              {alert.channel === 'telegram' && '📱 '}
                              {alert.channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                alert.status === 'sent'
                                  ? 'bg-green-500'
                                  : alert.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500'
                              }
                            >
                              {alert.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {alert.sent_at ? formatDate(alert.sent_at) : 'Pending'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Fix Suggestions Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Fix Suggestions ({aiSuggestions.length})
              </CardTitle>
              <CardDescription>AI-powered error analysis and fix recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Error Type</TableHead>
                      <TableHead>Suggested Fix</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>AI Model</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiSuggestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No AI suggestions yet. AI will analyze errors automatically.
                        </TableCell>
                      </TableRow>
                    ) : (
                      aiSuggestions.map((suggestion) => (
                        <TableRow key={suggestion.id}>
                          <TableCell className="font-medium">{suggestion.error_type}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {suggestion.suggested_fix || 'Analyzing...'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    suggestion.confidence >= 0.8
                                      ? 'bg-green-500'
                                      : suggestion.confidence >= 0.5
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${suggestion.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{suggestion.ai_model}</Badge>
                          </TableCell>
                          <TableCell>
                            {suggestion.was_applied ? (
                              <Badge className={suggestion.success ? 'bg-green-500' : 'bg-red-500'}>
                                {suggestion.success ? '✓ Success' : '✗ Failed'}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Applied</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(suggestion.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Analytics ({predictions.length})
              </CardTitle>
              <CardDescription>AI-powered error prediction and prevention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Accurate?</TableHead>
                      <TableHead>Predicted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No predictions yet. Enable predictive monitoring to start.
                        </TableCell>
                      </TableRow>
                    ) : (
                      predictions.map((pred) => (
                        <TableRow key={pred.id}>
                          <TableCell className="font-medium capitalize">
                            {pred.prediction_type.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell className="max-w-md truncate">{pred.description}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(pred.severity)}>
                              {pred.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    pred.probability >= 0.7
                                      ? 'bg-red-500'
                                      : pred.probability >= 0.4
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${pred.probability * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{Math.round(pred.probability * 100)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {pred.was_accurate === null ? (
                              <Badge variant="outline">Pending</Badge>
                            ) : pred.was_accurate ? (
                              <Badge className="bg-green-500">✓ Accurate</Badge>
                            ) : (
                              <Badge className="bg-gray-500">✗ False Alarm</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(pred.predicted_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Details Modal */}
      {selectedError && (
        <ErrorDetailsModal
          error={selectedError}
          open={errorModalOpen}
          onOpenChange={setErrorModalOpen}
        />
      )}

      {/* Action Details Modal - Similar to ErrorDetailsModal */}
      {selectedAction && (
        <ErrorDetailsModal
          error={selectedAction as any}
          open={actionModalOpen}
          onOpenChange={setActionModalOpen}
        />
      )}
    </div>
  );
}
