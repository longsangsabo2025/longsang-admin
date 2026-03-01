import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Play,
  Power,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Types
interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt: string;
  status: 'success' | 'error' | 'waiting' | 'running';
}

// Workflow categories based on naming convention
const WORKFLOW_CATEGORIES = {
  CORE: { icon: Settings, color: 'bg-slate-500', label: 'Core System' },
  CONTENT: { icon: FileText, color: 'bg-purple-500', label: 'Content' },
  LEAD: { icon: TrendingUp, color: 'bg-green-500', label: 'Lead Gen' },
  ANALYTICS: { icon: Activity, color: 'bg-blue-500', label: 'Analytics' },
  EMAIL: { icon: Mail, color: 'bg-orange-500', label: 'Email' },
  NOTIFICATION: { icon: Zap, color: 'bg-yellow-500', label: 'Notification' },
  AI: { icon: Bot, color: 'bg-pink-500', label: 'AI Agent' },
  TEST: { icon: AlertCircle, color: 'bg-gray-500', label: 'Test' },
  OTHER: { icon: Workflow, color: 'bg-cyan-500', label: 'Other' },
};

// Get category from workflow name
function getWorkflowCategory(name: string) {
  const upperName = name.toUpperCase();
  if (upperName.includes('CORE') || upperName.includes('⚙️')) return WORKFLOW_CATEGORIES.CORE;
  if (upperName.includes('CONTENT') || upperName.includes('🎬')) return WORKFLOW_CATEGORIES.CONTENT;
  if (upperName.includes('LEAD') || upperName.includes('🎯')) return WORKFLOW_CATEGORIES.LEAD;
  if (upperName.includes('ANLY') || upperName.includes('📊') || upperName.includes('📈'))
    return WORKFLOW_CATEGORIES.ANALYTICS;
  if (upperName.includes('EMAIL') || upperName.includes('📧')) return WORKFLOW_CATEGORIES.EMAIL;
  if (upperName.includes('NOTIF') || upperName.includes('🔔'))
    return WORKFLOW_CATEGORIES.NOTIFICATION;
  if (upperName.includes('AI-') || upperName.includes('🤖')) return WORKFLOW_CATEGORIES.AI;
  if (upperName.includes('TEST') || upperName.includes('🧪')) return WORKFLOW_CATEGORIES.TEST;
  return WORKFLOW_CATEGORIES.OTHER;
}

// Extract workflow number from name
function getWorkflowNumber(name: string): number {
  const regex = /^(\d+)\./;
  const match = regex.exec(name);
  return match ? Number.parseInt(match[1], 10) : 999;
}

// API Configuration - Route through backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678';

// Helper function to get badge variant for execution status
function getExecutionBadgeVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'success') return 'default';
  if (status === 'error') return 'destructive';
  return 'secondary';
}

export default function N8nManagement() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [serverOnline, setServerOnline] = useState(false);
  const [startingServer, setStartingServer] = useState(false);

  // Fetch workflows via backend API
  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/n8n/workflows/list`);

      if (!response.ok) throw new Error('Failed to fetch workflows');

      const data = await response.json();
      if (data.success) {
        setWorkflows(data.workflows || []);
        setServerOnline(true);
      } else {
        throw new Error(data.error || 'Failed to fetch');
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      setServerOnline(false);
      setWorkflows([]);
    }
  }, []);

  // Fetch recent executions - not supported via current backend, show empty
  const fetchExecutions = useCallback(async () => {
    // Executions API not exposed via backend yet
    // TODO: Add /api/n8n/executions endpoint
    setExecutions([]);
  }, []);

  // Toggle workflow active status
  const toggleWorkflow = async (id: string, currentActive: boolean) => {
    try {
      // Note: Current backend doesn't have activate/deactivate endpoints
      // Opening n8n directly for now
      toast({
        title: '📝 Manual Action Required',
        description: 'Please toggle workflow status in n8n editor',
      });
      openWorkflow(id);
    } catch (error) {
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Failed to toggle workflow',
        variant: 'destructive',
      });
    }
  };

  // Open workflow in n8n editor
  const openWorkflow = (id: string) => {
    window.open(`${N8N_BASE_URL}/workflow/${id}`, '_blank');
  };

  // Start n8n server via API
  const startN8nServer = useCallback(async () => {
    setStartingServer(true);
    toast({
      title: '🚀 Đang khởi động N8N Server...',
      description: 'Vui lòng đợi trong giây lát',
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/n8n/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start n8n server');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '✅ N8N Server đã khởi động!',
          description: 'Đang mở N8N Editor...',
        });
        
        // Wait a bit for server to fully start, then open
        setTimeout(() => {
          window.open(N8N_BASE_URL, '_blank');
          fetchWorkflows(); // Refresh to update online status
        }, 2000);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to start n8n:', error);
      toast({
        title: '❌ Không thể khởi động N8N',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại',
        variant: 'destructive',
      });
    } finally {
      setStartingServer(false);
    }
  }, [toast, fetchWorkflows]);

  // Open N8N - start server if offline, or just open if online
  const handleOpenN8n = useCallback(() => {
    if (serverOnline) {
      window.open(N8N_BASE_URL, '_blank');
    } else {
      startN8nServer();
    }
  }, [serverOnline, startN8nServer]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchWorkflows(), fetchExecutions()]);
      setLoading(false);
    };
    loadData();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchWorkflows();
      fetchExecutions();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchWorkflows, fetchExecutions]);

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    return workflows
      .filter((wf) => {
        // Search filter
        if (searchQuery && !wf.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'all') {
          const category = getWorkflowCategory(wf.name);
          if (category.label.toLowerCase() !== categoryFilter.toLowerCase()) {
            return false;
          }
        }
        // Status filter
        if (statusFilter === 'active' && !wf.active) return false;
        if (statusFilter === 'inactive' && wf.active) return false;
        return true;
      })
      .sort((a, b) => getWorkflowNumber(a.name) - getWorkflowNumber(b.name));
  }, [workflows, searchQuery, categoryFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = workflows.filter((w) => w.active).length;
    const recentExecutions = executions.slice(0, 20);
    const successCount = recentExecutions.filter((e) => e.status === 'success').length;
    const errorCount = recentExecutions.filter((e) => e.status === 'error').length;

    // Group by category
    const byCategory = workflows.reduce(
      (acc, wf) => {
        const cat = getWorkflowCategory(wf.name).label;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: workflows.length,
      active: activeCount,
      inactive: workflows.length - activeCount,
      successRate: recentExecutions.length > 0 ? (successCount / recentExecutions.length) * 100 : 0,
      errorCount,
      byCategory,
    };
  }, [workflows, executions]);

  // Render loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Workflow className="h-8 w-8 text-orange-500" />
            N8N Workflow Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage {stats.total} automation workflows via MCP integration
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={serverOnline ? 'default' : 'destructive'}
            className="gap-1 px-3 py-1.5 text-sm"
          >
            {serverOnline ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Server Online
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                Server Offline
              </>
            )}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchWorkflows();
              fetchExecutions();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={handleOpenN8n}
            disabled={startingServer}
            variant={serverOnline ? 'default' : 'outline'}
            className={!serverOnline ? 'border-orange-500 text-orange-600 hover:bg-orange-50' : ''}
          >
            {startingServer ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : serverOnline ? (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open N8N
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Start & Open N8N
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(stats.byCategory).length} categories
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.active / stats.total) * 100).toFixed(0)}% running
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">Paused or draft</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.successRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.errorCount > 0 ? `${stats.errorCount} errors` : 'No recent errors'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Workflows by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byCategory).map(([category, count]) => {
              const catInfo = Object.values(WORKFLOW_CATEGORIES).find(
                (c) => c.label === category
              ) || WORKFLOW_CATEGORIES.OTHER;
              const Icon = catInfo.icon;
              return (
                <Badge
                  key={category}
                  variant="outline"
                  className="gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-accent"
                  onClick={() =>
                    setCategoryFilter(category.toLowerCase() === categoryFilter ? 'all' : category.toLowerCase())
                  }
                >
                  <div className={`w-2 h-2 rounded-full ${catInfo.color}`} />
                  <Icon className="h-3.5 w-3.5" />
                  {category}
                  <span className="ml-1 font-bold">{count}</span>
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="executions" className="gap-2">
              <Activity className="h-4 w-4" />
              Recent Executions
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredWorkflows.map((workflow) => {
                const category = getWorkflowCategory(workflow.name);
                const Icon = category.icon;
                return (
                  <Card
                    key={workflow.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      workflow.active ? 'border-green-200 dark:border-green-900' : ''
                    }`}
                    onClick={() => openWorkflow(workflow.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${category.color} bg-opacity-20`}>
                          <Icon className={`h-4 w-4 ${category.color.replace('bg-', 'text-')}`} />
                        </div>
                        <Switch
                          checked={workflow.active}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkflow(workflow.id, workflow.active);
                          }}
                        />
                      </div>
                      <CardTitle className="text-sm font-medium line-clamp-2 mt-2">
                        {workflow.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {category.label}
                        </Badge>
                        <span>{new Date(workflow.updatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Workflow Name</TableHead>
                      <TableHead className="w-[120px]">Category</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Updated</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflows.map((workflow, index) => {
                      const category = getWorkflowCategory(workflow.name);
                      return (
                        <TableRow key={workflow.id}>
                          <TableCell className="font-mono text-muted-foreground">
                            {getWorkflowNumber(workflow.name) < 999
                              ? getWorkflowNumber(workflow.name)
                              : index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${category.color}`} />
                              <span className="font-medium">{workflow.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {category.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={workflow.active ? 'default' : 'secondary'}>
                              {workflow.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(workflow.updatedAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Switch
                                checked={workflow.active}
                                onCheckedChange={() => toggleWorkflow(workflow.id, workflow.active)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openWorkflow(workflow.id)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          )}

          {filteredWorkflows.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workflows found matching your filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 50 workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Execution ID</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((execution) => {
                      const workflow = workflows.find((w) => w.id === execution.workflowId);
                      const duration = execution.stoppedAt
                        ? Math.round(
                            (new Date(execution.stoppedAt).getTime() -
                              new Date(execution.startedAt).getTime()) /
                              1000
                          )
                        : null;

                      return (
                        <TableRow key={execution.id}>
                          <TableCell className="font-mono text-xs">
                            {execution.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {workflow?.name || execution.workflowId}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getExecutionBadgeVariant(execution.status)}
                              className="gap-1"
                            >
                              {execution.status === 'success' && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {execution.status === 'error' && <XCircle className="h-3 w-3" />}
                              {execution.status === 'running' && (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              )}
                              {execution.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{execution.mode}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(execution.startedAt).toLocaleString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {duration === null ? '-' : `${duration}s`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-900">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Quick Actions via Copilot MCP</p>
                <p className="text-sm text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">@n8n</code> in Copilot Chat to manage
                  workflows
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">@n8n list workflows</Badge>
              <Badge variant="outline">@n8n create from template</Badge>
              <Badge variant="outline">@n8n show executions</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
