/**
 * 🔗 n8n Workflow Library
 * 
 * Hiển thị tất cả workflows từ n8n instance
 * Cho phép chọn và promote thành AI Agent chính thức
 * 
 * Flow: n8n Workflows → Ideas Library → Production AI Agents
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Workflow as WorkflowIcon,
  RefreshCw,
  Search,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
  Settings,
  ExternalLink,
  Loader2,
  AlertCircle,
  Webhook,
  Calendar,
  Mail,
  Bot,
  Link2,
  Filter,
  LayoutGrid,
  List,
  LayoutList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { n8nApi, saveN8nConfig } from "@/services/n8n";
import type { N8nWorkflow } from "@/services/n8n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================
// TYPES
// ============================================================

type FilterStatus = 'all' | 'active' | 'inactive';
type ViewMode = 'grid' | 'list' | 'compact';

// ============================================================
// CONSTANTS
// ============================================================

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  webhook: <Webhook className="w-4 h-4" />,
  scheduled: <Calendar className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  manual: <Play className="w-4 h-4" />,
  trigger: <Zap className="w-4 h-4" />,
  telegram: <Bot className="w-4 h-4" />,
  slack: <Link2 className="w-4 h-4" />,
  discord: <Link2 className="w-4 h-4" />,
};

// ============================================================
// COMPONENT
// ============================================================

interface N8nWorkflowLibraryProps {
  onPromoteToAgent?: (workflow: N8nWorkflow) => void;
}

export const N8nWorkflowLibrary = ({ onPromoteToAgent }: N8nWorkflowLibraryProps) => {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [n8nConnected, setN8nConnected] = useState(false);
  const { toast } = useToast();

  // Config form - Priority: env vars > localStorage > defaults
  const [configForm, setConfigForm] = useState({
    baseUrl: import.meta.env.VITE_N8N_BASE_URL || localStorage.getItem('n8n_base_url') || 'http://localhost:5678',
    apiKey: import.meta.env.VITE_N8N_API_KEY || localStorage.getItem('n8n_api_key') || '',
  });

  // Check n8n connection
  const checkConnection = useCallback(async () => {
    const result = await n8nApi.health.check();
    setN8nConnected(result.healthy);
    return result.healthy;
  }, []);

  // Fetch workflows
  const fetchWorkflows = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      
      const isConnected = await checkConnection();
      if (!isConnected) {
        setWorkflows([]);
        if (showToast) {
          toast({
            title: "⚠️ n8n Not Connected",
            description: "Please configure your n8n instance in Settings",
            variant: "destructive",
          });
        }
        return;
      }

      const data = await n8nApi.workflows.list();
      setWorkflows(data);
      
      if (showToast) {
        toast({
          title: "✅ Synced!",
          description: `Loaded ${data.length} workflows from n8n`,
        });
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      if (showToast) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch workflows",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkConnection, toast]);

  // Initial load
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkflows(true);
  };

  // Save config
  const handleSaveConfig = async () => {
    saveN8nConfig(configForm);
    setShowConfigDialog(false);
    
    toast({
      title: "Config Saved",
      description: "Checking connection...",
    });

    await fetchWorkflows(true);
  };

  // Toggle workflow active state
  const handleToggleActive = async (workflow: N8nWorkflow) => {
    try {
      if (workflow.active) {
        await n8nApi.workflows.deactivate(workflow.id);
        toast({ title: "Workflow Deactivated", description: workflow.name });
      } else {
        await n8nApi.workflows.activate(workflow.id);
        toast({ title: "Workflow Activated", description: workflow.name });
      }
      fetchWorkflows();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle workflow",
        variant: "destructive",
      });
    }
  };

  // Execute workflow
  const handleExecute = async (workflow: N8nWorkflow) => {
    try {
      const result = await n8nApi.workflows.execute(workflow.id);
      toast({
        title: "🚀 Workflow Started",
        description: `Execution ID: ${result.executionId}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  // Promote to Agent
  const handlePromote = (workflow: N8nWorkflow) => {
    if (onPromoteToAgent) {
      onPromoteToAgent(workflow);
    }
  };

  // Open in n8n
  const openInN8n = (workflowId: string) => {
    const baseUrl = localStorage.getItem('n8n_base_url') || 'http://localhost:5678';
    window.open(`${baseUrl}/workflow/${workflowId}`, '_blank');
  };

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && workflow.active) ||
      (statusFilter === 'inactive' && !workflow.active);
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.active).length,
    inactive: workflows.filter(w => !w.active).length,
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <Card className="bg-slate-900 border-slate-700">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <WorkflowIcon className="w-16 h-16 text-slate-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-slate-200">No workflows found</h3>
        <p className="text-sm text-slate-400">
          {searchQuery ? 'Try different search terms' : 'Create workflows in n8n to see them here'}
        </p>
      </CardContent>
    </Card>
  );

  // Render workflow grid (default)
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredWorkflows.map((workflow) => (
        <Card 
          key={workflow.id}
          className="bg-slate-900 border-slate-700 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${workflow.active ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                  {TRIGGER_ICONS[workflow.triggerType || 'manual'] || <WorkflowIcon className="w-4 h-4" />}
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-100 line-clamp-1">
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={workflow.active 
                        ? 'border-green-500/50 text-green-400' 
                        : 'border-slate-600 text-slate-400'
                      }
                    >
                      {workflow.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span>{workflow.nodeCount} nodes</span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400 line-clamp-2">
              {workflow.description || 'No description'}
            </p>

            {workflow.tags && workflow.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {workflow.tags.slice(0, 3).map(tag => (
                  <Badge key={tag.id} variant="outline" className="text-xs border-slate-600 text-slate-300">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(workflow.updatedAt).toLocaleDateString()}
              </span>
              <span className="capitalize">{workflow.triggerType}</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
              <Button 
                size="sm" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handlePromote(workflow)}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                Promote
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleActive(workflow)}
                    >
                      {workflow.active ? (
                        <Pause className="w-3 h-3 text-yellow-400" />
                      ) : (
                        <Play className="w-3 h-3 text-green-400" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {workflow.active ? 'Deactivate' : 'Activate'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExecute(workflow)}
                    >
                      <Zap className="w-3 h-3 text-orange-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Run Now</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openInN8n(workflow.id)}
                    >
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in n8n</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render workflow list view
  const renderListView = () => (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-800/50">
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-300 w-12">Status</TableHead>
            <TableHead className="text-slate-300">Workflow</TableHead>
            <TableHead className="text-slate-300 w-24">Nodes</TableHead>
            <TableHead className="text-slate-300 w-28">Trigger</TableHead>
            <TableHead className="text-slate-300 w-28">Updated</TableHead>
            <TableHead className="text-slate-300 text-right w-48">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWorkflows.map((workflow) => (
            <TableRow key={workflow.id} className="border-slate-700 hover:bg-slate-800/50">
              <TableCell>
                <div className={`w-3 h-3 rounded-full ${workflow.active ? 'bg-green-500' : 'bg-slate-500'}`} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-200">{workflow.name}</span>
                  <span className="text-xs text-slate-500 line-clamp-1">
                    {workflow.description || 'No description'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-slate-400">{workflow.nodeCount}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-slate-400">
                  {TRIGGER_ICONS[workflow.triggerType || 'manual'] || <WorkflowIcon className="w-4 h-4" />}
                  <span className="capitalize text-xs">{workflow.triggerType}</span>
                </div>
              </TableCell>
              <TableCell className="text-slate-500 text-xs">
                {new Date(workflow.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 h-7 px-2 text-xs"
                    onClick={() => handlePromote(workflow)}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Promote
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleToggleActive(workflow)}
                  >
                    {workflow.active ? (
                      <Pause className="w-3 h-3 text-yellow-400" />
                    ) : (
                      <Play className="w-3 h-3 text-green-400" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleExecute(workflow)}
                  >
                    <Zap className="w-3 h-3 text-orange-400" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openInN8n(workflow.id)}
                  >
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Render compact view - smaller cards
  const renderCompactView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {filteredWorkflows.map((workflow) => (
        <Card 
          key={workflow.id}
          className="bg-slate-900 border-slate-700 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all p-3"
        >
          <div className="flex items-start gap-2">
            <div className={`p-1.5 rounded ${workflow.active ? 'bg-green-500/20' : 'bg-slate-800'} shrink-0`}>
              {TRIGGER_ICONS[workflow.triggerType || 'manual'] || <WorkflowIcon className="w-3 h-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-100 line-clamp-1">{workflow.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1 py-0 ${workflow.active 
                    ? 'border-green-500/50 text-green-400' 
                    : 'border-slate-600 text-slate-400'
                  }`}
                >
                  {workflow.active ? 'Active' : 'Off'}
                </Badge>
                <span className="text-[10px] text-slate-500">{workflow.nodeCount} nodes</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Button 
              size="sm" 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-6 text-[10px] px-2"
              onClick={() => handlePromote(workflow)}
            >
              Promote
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={() => handleToggleActive(workflow)}
            >
              {workflow.active ? (
                <Pause className="w-3 h-3 text-yellow-400" />
              ) : (
                <Play className="w-3 h-3 text-green-400" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6"
              onClick={() => openInN8n(workflow.id)}
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  // Render content based on state and view mode
  const renderContent = () => {
    if (loading) return renderLoading();
    if (filteredWorkflows.length === 0) return renderEmpty();
    
    switch (viewMode) {
      case 'list':
        return renderListView();
      case 'compact':
        return renderCompactView();
      case 'grid':
      default:
        return renderGridView();
    }
  };

  // Not connected state
  if (!n8nConnected && !loading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-slate-200">n8n Not Connected</h3>
          <p className="text-sm text-slate-400 mb-4 text-center max-w-md">
            Connect your n8n instance to import workflows into the Ideas Library
          </p>
          <Button onClick={() => setShowConfigDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Settings className="w-4 h-4 mr-2" />
            Configure n8n Connection
          </Button>

          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  n8n Configuration
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Connect to your n8n instance to import workflows
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="n8n-url-1" className="text-sm font-medium text-slate-200">n8n Base URL</label>
                  <Input
                    id="n8n-url-1"
                    placeholder="http://localhost:5678"
                    value={configForm.baseUrl}
                    onChange={(e) => setConfigForm({ ...configForm, baseUrl: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="n8n-key-1" className="text-sm font-medium text-slate-200">API Key</label>
                  <Input
                    id="n8n-key-1"
                    type="password"
                    placeholder="Enter your n8n API key"
                    value={configForm.apiKey}
                    onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig} className="bg-indigo-600 hover:bg-indigo-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Connect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-950 to-indigo-900 border-indigo-700 shadow-lg shadow-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">n8n Workflows</CardTitle>
            <WorkflowIcon className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-slate-400">
              {n8nConnected ? (
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Disconnected
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Active</CardTitle>
            <Play className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-950 to-slate-900 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Inactive</CardTitle>
            <Pause className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-lg shadow-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Ready to Promote</CardTitle>
            <ArrowRight className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <p className="text-xs text-slate-400">to AI Agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <WorkflowIcon className="w-6 h-6 text-indigo-400" />
            n8n Workflow Library
          </h2>
          <p className="text-sm text-slate-400">
            Select workflows to promote to production AI Agents
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-slate-200"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-32 bg-slate-900 border-slate-700">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border border-slate-700 rounded-md overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-none ${viewMode === 'grid' ? 'bg-indigo-600' : ''}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`rounded-none border-x border-slate-700 ${viewMode === 'list' ? 'bg-indigo-600' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('compact')}
                    className={`rounded-none ${viewMode === 'compact' ? 'bg-indigo-600' : ''}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compact View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh from n8n</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowConfigDialog(true)}
                  className="border-slate-700"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>n8n Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              n8n Configuration
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Connect to your n8n instance to import workflows
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="n8n-base-url" className="text-sm font-medium text-slate-200">n8n Base URL</label>
              <Input
                id="n8n-base-url"
                placeholder="http://localhost:5678"
                value={configForm.baseUrl}
                onChange={(e) => setConfigForm({ ...configForm, baseUrl: e.target.value })}
                className="bg-slate-800 border-slate-600"
              />
              <p className="text-xs text-slate-500">
                The URL where your n8n instance is running
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="n8n-api-key" className="text-sm font-medium text-slate-200">API Key</label>
              <Input
                id="n8n-api-key"
                type="password"
                placeholder="Enter your n8n API key"
                value={configForm.apiKey}
                onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                className="bg-slate-800 border-slate-600"
              />
              <p className="text-xs text-slate-500">
                Generate an API key in n8n: Settings → API → Create API Key
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} className="bg-indigo-600 hover:bg-indigo-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Save & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default N8nWorkflowLibrary;
