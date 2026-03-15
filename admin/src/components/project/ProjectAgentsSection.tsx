import { Bot, CheckCircle, Clock, Play, Plus, Settings, Trash2, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
}

interface ProjectAgent {
  id: string;
  project_id: string;
  agent_id: string;
  is_enabled: boolean;
  priority: number;
  auto_trigger_events: string[] | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  total_cost_usd: number;
  ai_agents?: Agent;
}

interface Props {
  projectId: string;
  projectName: string;
}

const ProjectAgentsSection = ({ projectId, projectName }: Props) => {
  const [projectAgents, setProjectAgents] = useState<ProjectAgent[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Check if using fallback project (not in database)
  const isFallback = projectId.startsWith('fallback-');

  useEffect(() => {
    if (!isFallback) {
      fetchProjectAgents();
      fetchAvailableAgents();
    } else {
      setLoading(false);
    }
  }, [projectId, isFallback]);

  const fetchProjectAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('project_agents')
        .select('*, ai_agents(id, name, type, description, status)')
        .eq('project_id', projectId)
        .order('priority', { ascending: true });

      if (error) throw error;
      setProjectAgents(data || []);
    } catch (error) {
      console.error('Error fetching project agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const { data } = await supabase
        .from('ai_agents')
        .select('id, name, type, description, status')
        .eq('status', 'active')
        .order('name');
      setAvailableAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const assignAgent = async () => {
    if (!selectedAgentId) {
      toast.error('Vui lòng chọn agent');
      return;
    }

    try {
      // 1. Insert project_agents record
      const { error } = await supabase.from('project_agents').insert({
        project_id: projectId,
        agent_id: selectedAgentId,
        is_enabled: true,
        priority: projectAgents.length + 1,
        auto_trigger_events: ['manual'],
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Agent này đã được assign rồi');
          return;
        }
        throw error;
      }

      // 2. Get agent info to find matching workflow template
      const selectedAgent = availableAgents.find((a) => a.id === selectedAgentId);
      if (selectedAgent) {
        // Find workflow template by agent type
        const { data: template } = await supabase
          .from('workflow_templates')
          .select('*')
          .eq('status', 'active')
          .ilike('name', `%${selectedAgent.type}%`)
          .single();

        if (template) {
          // 3. Auto-clone workflow for this project
          toast.info('🔄 Đang tạo workflow cho project...');

          try {
            const response = await fetch('/api/n8n/workflows/clone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projectId,
                template_slug: template.slug,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              const n8nInfo = result.n8nWorkflowId ? ' (n8n: ' + result.n8nWorkflowId + ')' : '';
              toast.success('✅ Đã assign agent và tạo workflow!' + n8nInfo);
            } else {
              toast.success('Đã assign agent (workflow sẽ được tạo sau)');
            }
          } catch (cloneError) {
            console.warn('Could not auto-clone workflow:', cloneError);
            toast.success('Đã assign agent (workflow sẽ được tạo sau)');
          }
        } else {
          toast.success('Đã assign agent');
        }
      } else {
        toast.success('Đã assign agent');
      }

      setIsAssignDialogOpen(false);
      setSelectedAgentId('');
      fetchProjectAgents();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Không thể assign agent');
    }
  };

  const toggleAgent = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('project_agents')
        .update({ is_enabled: !currentEnabled })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentEnabled ? 'Đã tắt agent' : 'Đã bật agent');
      fetchProjectAgents();
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const removeAgent = async (id: string, name: string) => {
    if (!confirm(`Xóa "${name}" khỏi project này?`)) return;

    try {
      const { error } = await supabase.from('project_agents').delete().eq('id', id);

      if (error) throw error;
      toast.success('Đã xóa agent');
      fetchProjectAgents();
    } catch (error) {
      console.error('Error removing agent:', error);
    }
  };

  const executeAgent = async (pa: ProjectAgent) => {
    toast.info(`🚀 Đang chạy ${pa.ai_agents?.name}...`);

    try {
      // First check if there's a workflow instance for this agent + project
      const { data: instance } = await supabase
        .from('project_workflow_instances')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (instance?.n8n_workflow_id) {
        // Execute real n8n workflow
        const response = await fetch(`/api/n8n/workflows/${instance.n8n_workflow_id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            agent_id: pa.agent_id,
            agent_name: pa.ai_agents?.name,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Workflow execution failed');
        }

        const result = await response.json();
        toast.success(`✅ ${pa.ai_agents?.name} hoàn thành! Execution ID: ${result.executionId}`);
      } else {
        // No n8n workflow - run mock
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success(`✅ ${pa.ai_agents?.name} hoàn thành! (Mock run)`);
      }

      // Update stats
      const { error } = await supabase
        .from('project_agents')
        .update({
          total_runs: pa.total_runs + 1,
          successful_runs: pa.successful_runs + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', pa.id);

      if (error) throw error;
      fetchProjectAgents();
    } catch (error) {
      console.error('Error executing agent:', error);

      // Update failed stats
      await supabase
        .from('project_agents')
        .update({
          total_runs: pa.total_runs + 1,
          failed_runs: pa.failed_runs + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', pa.id);

      toast.error(
        `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      fetchProjectAgents();
    }
  };

  // Agents already assigned
  const assignedAgentIds = projectAgents.map((pa) => pa.agent_id);
  const unassignedAgents = availableAgents.filter((a) => !assignedAgentIds.includes(a.id));

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Agents ({projectAgents.length})
        </h3>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Assign Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Agent to {projectName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn agent..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedAgents.length > 0 ? (
                    unassignedAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.type})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      Tất cả agents đã được assign
                    </div>
                  )}
                </SelectContent>
              </Select>

              <Button onClick={assignAgent} disabled={!selectedAgentId} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Assign Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projectAgents.length > 0 ? (
        <div className="space-y-3">
          {projectAgents.map((pa) => (
            <Card
              key={pa.id}
              className={`transition-all ${
                pa.is_enabled ? 'border-border' : 'border-muted opacity-60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={pa.is_enabled}
                      onCheckedChange={() => toggleAgent(pa.id, pa.is_enabled)}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pa.ai_agents?.name}</span>
                        <Badge variant="outline">{pa.ai_agents?.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {pa.ai_agents?.description}
                      </p>

                      {pa.auto_trigger_events && pa.auto_trigger_events.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {pa.auto_trigger_events.map((e) => (
                            <Badge key={e} variant="secondary" className="text-xs">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right text-sm hidden md:block">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {pa.successful_runs}
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          {pa.failed_runs}
                        </span>
                        <span className="text-muted-foreground">
                          ${pa.total_cost_usd?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {pa.last_run_at && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {new Date(pa.last_run_at).toLocaleString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => executeAgent(pa)}
                      disabled={!pa.is_enabled}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAgent(pa.id, pa.ai_agents?.name || '')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              Chưa có agent nào được assign cho project này
            </p>
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign First Agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectAgentsSection;
