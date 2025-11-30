import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { n8nService } from '@/lib/automation/n8n-service';
import {
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Workflow as WorkflowIcon,
  ExternalLink,
} from 'lucide-react';

interface WorkflowDashboardProps {
  agentId?: string;
}

export const WorkflowDashboard = ({ agentId }: WorkflowDashboardProps) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await n8nService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateWorkflow = async (workflowId: string) => {
    try {
      await n8nService.activateWorkflow(workflowId);
      toast({
        title: 'Success',
        description: 'Workflow activated successfully',
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate workflow',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateWorkflow = async (workflowId: string) => {
    try {
      await n8nService.deactivateWorkflow(workflowId);
      toast({
        title: 'Success',
        description: 'Workflow deactivated successfully',
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate workflow',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await n8nService.executeWorkflow(workflowId, {});
      toast({
        title: 'Success',
        description: 'Workflow execution started',
      });
      setTimeout(loadDashboardData, 2000); // Reload after 2 seconds
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
    }
  };

  const openN8nEditor = () => {
    window.open('http://localhost:5678', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading workflow data...</p>
        </div>
      </div>
    );
  }

  const workflows = agentId
    ? dashboardData?.workflows?.filter((w: any) => w.agent_id === agentId) || []
    : dashboardData?.workflows || [];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.stats?.totalWorkflows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.stats?.activeWorkflows || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.stats?.totalExecutions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.stats?.totalExecutions > 0
                ? Math.round(
                    (dashboardData.stats.successfulExecutions /
                      dashboardData.stats.totalExecutions) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <CreateWorkflowForm
              templates={dashboardData?.templates || []}
              onSuccess={() => {
                setCreateModalOpen(false);
                loadDashboardData();
              }}
            />
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={openN8nEditor}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open n8n Editor
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <WorkflowIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow to start automating tasks
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow: any) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onActivate={() => handleActivateWorkflow(workflow.id)}
                  onDeactivate={() => handleDeactivateWorkflow(workflow.id)}
                  onExecute={() => handleExecuteWorkflow(workflow.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.executions?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No executions found</p>
              ) : (
                <div className="space-y-2">
                  {dashboardData?.executions?.map((execution: any) => (
                    <ExecutionItem key={execution.id} execution={execution} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData?.templates?.map((template: any) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={(template) => {
                  setSelectedTemplate(template);
                  setCreateModalOpen(true);
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Workflow Card Component
const WorkflowCard = ({ workflow, onActivate, onDeactivate, onExecute }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{workflow.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{workflow.ai_agents?.name}</p>
          </div>
          <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {workflow.description || 'No description'}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{workflow.total_executions || 0} executions</span>
            <span>
              {workflow.last_execution
                ? new Date(workflow.last_execution).toLocaleDateString()
                : 'Never run'}
            </span>
          </div>

          <div className="flex gap-2">
            {workflow.status === 'active' ? (
              <Button size="sm" variant="outline" onClick={onDeactivate}>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            ) : (
              <Button size="sm" onClick={onActivate}>
                <Play className="h-3 w-3 mr-1" />
                Activate
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={onExecute}>
              <Zap className="h-3 w-3 mr-1" />
              Run
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Execution Item Component
const ExecutionItem = ({ execution }: any) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {getStatusIcon(execution.status)}
        <div>
          <p className="font-medium">{execution.n8n_workflows?.name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(execution.start_time).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
          {execution.status}
        </p>
        {execution.duration_ms && (
          <p className="text-xs text-muted-foreground">{execution.duration_ms}ms</p>
        )}
      </div>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({ template, onUse }: any) => {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onUse(template)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">{template.category}</Badge>
          <Badge variant="outline">{template.usage_count} uses</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
        <div className="flex flex-wrap gap-1">
          {template.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Create Workflow Form Component
const CreateWorkflowForm = ({ templates, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agentId: '',
    templateId: '',
    tags: '',
  });
  const [agents, setAgents] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    // This would load agents from your existing API
    // For now, we'll use a placeholder
    setAgents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.templateId || !formData.agentId) {
        toast({
          title: 'Error',
          description: 'Please select both template and agent',
          variant: 'destructive',
        });
        return;
      }

      await n8nService.createWorkflowFromTemplate(formData.templateId, formData.agentId, {
        name: formData.name,
        description: formData.description,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });

      toast({
        title: 'Success',
        description: 'Workflow created successfully',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create workflow',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template">Template</Label>
        <Select
          value={formData.templateId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, templateId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template: any) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} - {template.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="agent">Agent</Label>
        <Select
          value={formData.agentId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, agentId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent: any) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter workflow name"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter workflow description"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
          placeholder="automation, email, ai"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">Create Workflow</Button>
      </div>
    </form>
  );
};
