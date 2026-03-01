import {
  useCreateWorkflow,
  useDeleteWorkflow,
  useWorkflows,
  useUpdateWorkflow,
  useTestWorkflow,
} from '@/brain/hooks/useWorkflows';
import type { Workflow, WorkflowInput } from '@/brain/types/workflow.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit, Trash2, Play, CheckCircle, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export function WorkflowManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<Workflow['trigger_type']>('on_query');
  const [triggerConfig, setTriggerConfig] = useState('{}');
  const [actions, setActions] = useState('[]');
  const [isActive, setIsActive] = useState(true);

  const { data: workflows, isLoading: isLoadingWorkflows } = useWorkflows();
  const createWorkflowMutation = useCreateWorkflow();
  const updateWorkflowMutation = useUpdateWorkflow();
  const deleteWorkflowMutation = useDeleteWorkflow();
  const testWorkflowMutation = useTestWorkflow();

  useEffect(() => {
    if (isEditDialogOpen && currentWorkflow) {
      setName(currentWorkflow.name);
      setDescription(currentWorkflow.description || '');
      setTriggerType(currentWorkflow.trigger_type);
      setTriggerConfig(JSON.stringify(currentWorkflow.trigger_config, null, 2));
      setActions(JSON.stringify(currentWorkflow.actions, null, 2));
      setIsActive(currentWorkflow.is_active);
    } else {
      setName('');
      setDescription('');
      setTriggerType('on_query');
      setTriggerConfig('{}');
      setActions('[]');
      setIsActive(true);
    }
  }, [isEditDialogOpen, currentWorkflow]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTriggerType('on_query');
    setTriggerConfig('{}');
    setActions('[]');
    setIsActive(true);
    setCurrentWorkflow(null);
  };

  const handleCreateWorkflow = async () => {
    try {
      const parsedTriggerConfig = JSON.parse(triggerConfig);
      const parsedActions = JSON.parse(actions);

      await createWorkflowMutation.mutateAsync({
        name,
        description,
        triggerType,
        triggerConfig: parsedTriggerConfig,
        actions: parsedActions,
        isActive,
      } as WorkflowInput);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`Invalid JSON: ${error.message}`);
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!currentWorkflow) return;
    try {
      const parsedTriggerConfig = JSON.parse(triggerConfig);
      const parsedActions = JSON.parse(actions);

      await updateWorkflowMutation.mutateAsync({
        id: currentWorkflow.id,
        updates: {
          name,
          description,
          triggerType,
          triggerConfig: parsedTriggerConfig,
          actions: parsedActions,
          isActive,
        },
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`Invalid JSON: ${error.message}`);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflowMutation.mutateAsync(id);
    }
  };

  const handleTestWorkflow = async (id: string) => {
    await testWorkflowMutation.mutateAsync({ id });
  };

  const renderWorkflowForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="workflow-name">Name</Label>
        <Input id="workflow-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="workflow-description">Description</Label>
        <Textarea
          id="workflow-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="trigger-type">Trigger Type</Label>
        <Select
          value={triggerType}
          onValueChange={(value) => setTriggerType(value as Workflow['trigger_type'])}
        >
          <SelectTrigger id="trigger-type">
            <SelectValue placeholder="Select a trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on_query">On Query</SelectItem>
            <SelectItem value="on_session_end">On Session End</SelectItem>
            <SelectItem value="schedule_daily">Schedule Daily</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="trigger-config">Trigger Configuration (JSON)</Label>
        <Textarea
          id="trigger-config"
          value={triggerConfig}
          onChange={(e) => setTriggerConfig(e.target.value)}
          rows={5}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          e.g., {'{"contains": "report", "min_confidence": 0.7}'} for &apos;on_query&apos;
        </p>
      </div>
      <div>
        <Label htmlFor="workflow-actions">Actions (JSON Array)</Label>
        <Textarea
          id="workflow-actions"
          value={actions}
          onChange={(e) => setActions(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          e.g.,{' '}
          {
            '[{"action_type": "create_task", "payload_template": {"title": "Review {{query}}", "priority": "high"}}]'
          }
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="is-active">Active</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> Workflow Management
          </CardTitle>
          <CardDescription>
            Define automated actions based on triggers within your AI Second Brain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Create New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Workflow</DialogTitle>
                <DialogDescription>
                  Define the trigger and actions for your new automated workflow.
                </DialogDescription>
              </DialogHeader>
              {renderWorkflowForm()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkflow}
                  disabled={createWorkflowMutation.isPending || !name.trim()}
                >
                  {createWorkflowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-lg font-semibold mt-6 mb-3">Your Workflows</h3>
          {isLoadingWorkflows ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading workflows...</p>
            </div>
          ) : workflows && workflows.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{workflow.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleTestWorkflow(workflow.id)}
                          disabled={testWorkflowMutation.isPending}
                          title="Test Workflow"
                        >
                          {testWorkflowMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Dialog
                          open={isEditDialogOpen && currentWorkflow?.id === workflow.id}
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (open) setCurrentWorkflow(workflow);
                            else resetForm();
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Edit Workflow">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Workflow</DialogTitle>
                              <DialogDescription>
                                Modify the details of your automated workflow.
                              </DialogDescription>
                            </DialogHeader>
                            {renderWorkflowForm()}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateWorkflow}
                                disabled={updateWorkflowMutation.isPending || !name.trim()}
                              >
                                {updateWorkflowMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          disabled={deleteWorkflowMutation.isPending}
                          title="Delete Workflow"
                        >
                          {deleteWorkflowMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{workflow.description}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <strong>Trigger:</strong> {workflow.trigger_type}
                        {workflow.last_triggered_at && (
                          <span>
                            {' '}
                            (Last: {format(new Date(workflow.last_triggered_at), 'MMM dd, HH:mm')})
                          </span>
                        )}
                      </p>
                      <p>
                        <strong>Actions:</strong> {workflow.actions.length} steps
                      </p>
                      {testWorkflowMutation.isSuccess &&
                        testWorkflowMutation.data &&
                        testWorkflowMutation.variables?.id === workflow.id && (
                          <p className="text-green-600">
                            Test Result: {testWorkflowMutation.data.message}
                          </p>
                        )}
                      {testWorkflowMutation.isError &&
                        testWorkflowMutation.variables?.id === workflow.id && (
                          <p className="text-destructive">
                            Test Error: {testWorkflowMutation.error?.message}
                          </p>
                        )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground">No workflows defined yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
