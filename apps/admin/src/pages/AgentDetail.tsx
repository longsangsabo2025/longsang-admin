import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  getAgent,
  getActivityLogs,
  getTriggers,
  pauseAgent,
  resumeAgent,
  deleteAgent,
} from '@/lib/automation/api';
import { manuallyTriggerAgent } from '@/lib/automation/workflows';
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Zap,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ActivityLogList } from '@/components/automation/ActivityLogList';
import { EditConfigModal } from '@/components/automation/EditConfigModal';
import { BudgetControlsModal } from '@/components/automation/BudgetControlsModal';
import { AgentFullConfigModal } from '@/components/automation/AgentFullConfigModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [manualTriggerContext, setManualTriggerContext] = useState('');
  const [showEditConfig, setShowEditConfig] = useState(false);
  const [showBudgetControls, setShowBudgetControls] = useState(false);
  const [showFullConfig, setShowFullConfig] = useState(false);

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => getAgent(id!),
    enabled: !!id,
  });

  const { data: triggers, isLoading: triggersLoading } = useQuery({
    queryKey: ['triggers', id],
    queryFn: () => getTriggers(id),
    enabled: !!id,
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['agent-logs', id],
    queryFn: () => getActivityLogs(50, id),
    enabled: !!id,
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseAgent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      toast.success('Agent paused');
    },
    onError: () => {
      toast.error('Failed to pause agent');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeAgent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      toast.success('Agent resumed');
    },
    onError: () => {
      toast.error('Failed to resume agent');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAgent(id!),
    onSuccess: () => {
      toast.success('Agent deleted');
      navigate('/automation');
    },
    onError: () => {
      toast.error('Failed to delete agent');
    },
  });

  const manualTriggerMutation = useMutation({
    mutationFn: (context: any) => manuallyTriggerAgent(id!, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      queryClient.invalidateQueries({ queryKey: ['agent-logs', id] });
      toast.success('Agent triggered successfully');
      setManualTriggerContext('');
    },
    onError: (error: any) => {
      toast.error(`Failed to trigger agent: ${error.message}`);
    },
  });

  const handleManualTrigger = () => {
    let context = {};
    if (manualTriggerContext.trim()) {
      try {
        context = JSON.parse(manualTriggerContext);
      } catch (e) {
        toast.error('Invalid JSON in context field');
        return;
      }
    }
    manualTriggerMutation.mutate(context);
  };

  if (agentLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Agent Not Found</h3>
            <Button onClick={() => navigate('/automation')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const successRate =
    agent.total_runs > 0 ? Math.round((agent.successful_runs / agent.total_runs) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/automation')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{agent.name}</h1>
                <Badge
                  variant={
                    agent.status === 'active'
                      ? 'default'
                      : agent.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {agent.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">{agent.description}</p>
            </div>

            <div className="flex gap-2">
              {agent.status === 'active' ? (
                <Button
                  variant="outline"
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}

              <Button variant="default" onClick={() => setShowFullConfig(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configure All Settings
              </Button>

              <Button variant="outline" onClick={() => setShowBudgetControls(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Budget Only
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Manual Trigger
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Manually Trigger Agent</AlertDialogTitle>
                    <AlertDialogDescription>
                      Trigger this agent manually with optional context data (JSON format).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="context">Context (Optional JSON)</Label>
                      <Input
                        id="context"
                        placeholder='{"contact_id": "123"}'
                        value={manualTriggerContext}
                        onChange={(e) => setManualTriggerContext(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Example: {agent.type === 'content_writer' && '{"contact_id": "uuid"}'}
                        {agent.type === 'lead_nurture' && '{"contact_id": "uuid"}'}
                        {agent.type === 'social_media' && '{"content_id": "uuid"}'}
                      </p>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleManualTrigger}
                      disabled={manualTriggerMutation.isPending}
                    >
                      {manualTriggerMutation.isPending ? 'Triggering...' : 'Trigger Agent'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the agent and all its associated data. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      Delete Agent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Runs</p>
                  <h3 className="text-2xl font-bold">{agent.total_runs}</h3>
                </div>
                <Activity className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                  <h3 className="text-2xl font-bold">{successRate}%</h3>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Run</p>
                  <h3 className="text-sm font-bold">
                    {agent.last_run
                      ? formatDistanceToNow(new Date(agent.last_run), { addSuffix: true })
                      : 'Never'}
                  </h3>
                </div>
                <Clock className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Agent Type</p>
                  <h3 className="text-sm font-bold capitalize">{agent.type.replace('_', ' ')}</h3>
                </div>
                <Settings className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Agent settings and parameters</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditConfig(true)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Config
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(agent.config).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <EditConfigModal open={showEditConfig} onOpenChange={setShowEditConfig} agent={agent} />

        <BudgetControlsModal
          open={showBudgetControls}
          onOpenChange={setShowBudgetControls}
          agentId={agent.id}
          agentName={agent.name}
        />

        {/* Triggers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Automation Triggers</CardTitle>
            <CardDescription>Events that activate this agent</CardDescription>
          </CardHeader>
          <CardContent>
            {triggersLoading ? (
              <p className="text-muted-foreground">Loading triggers...</p>
            ) : triggers && triggers.length > 0 ? (
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold capitalize">{trigger.trigger_type} Trigger</h4>
                      <p className="text-sm text-muted-foreground">
                        {trigger.trigger_config.description ||
                          JSON.stringify(trigger.trigger_config)}
                      </p>
                    </div>
                    <Badge variant={trigger.enabled ? 'default' : 'secondary'}>
                      {trigger.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No triggers configured</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Activity History</h2>
          <ActivityLogList logs={logs || []} isLoading={logsLoading} />
        </div>

        {/* Configuration Modals */}
        {agent && (
          <>
            <AgentFullConfigModal
              open={showFullConfig}
              onOpenChange={setShowFullConfig}
              agentId={agent.id}
              currentConfig={agent.config || {}}
              agentType={agent.type}
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ['agent', id] });
              }}
            />
            <BudgetControlsModal
              open={showBudgetControls}
              onOpenChange={setShowBudgetControls}
              agentId={agent.id}
              agentName={agent.name}
            />
          </>
        )}
      </div>
  );
};

export default AgentDetail;
