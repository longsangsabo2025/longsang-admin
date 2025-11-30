import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Trash2,
  Play,
  Settings,
  Clock,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

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
  config_override: Record<string, unknown>;
  schedule_cron: string | null;
  auto_trigger_events: string[];
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  total_cost_usd: number;
  notes: string | null;
  created_at: string;
  projects?: Project;
  ai_agents?: Agent;
}

const ProjectAgentsManager = () => {
  const [projectAgents, setProjectAgents] = useState<ProjectAgent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    project_id: '',
    agent_id: '',
    priority: 1,
    schedule_cron: '',
    auto_trigger_events: [] as string[],
    notes: '',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fetch project agents with joins
      const { data: paData, error: paError } = await supabase
        .from('project_agents')
        .select('*, projects(id, name, slug, icon), ai_agents(id, name, type, description, status)')
        .order('priority', { ascending: true });

      if (paError) throw paError;
      setProjectAgents(paData || []);

      // Fetch all projects
      const { data: projData } = await supabase
        .from('projects')
        .select('id, name, slug, icon')
        .order('name');
      setProjects(projData || []);

      // Fetch all agents
      const { data: agentData } = await supabase
        .from('ai_agents')
        .select('id, name, type, description, status')
        .eq('status', 'active')
        .order('name');
      setAgents(agentData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const assignAgentToProject = async () => {
    if (!newAssignment.project_id || !newAssignment.agent_id) {
      toast.error('Vui lòng chọn project và agent');
      return;
    }

    try {
      const { error } = await supabase.from('project_agents').insert({
        project_id: newAssignment.project_id,
        agent_id: newAssignment.agent_id,
        priority: newAssignment.priority,
        schedule_cron: newAssignment.schedule_cron || null,
        auto_trigger_events:
          newAssignment.auto_trigger_events.length > 0 ? newAssignment.auto_trigger_events : null,
        notes: newAssignment.notes || null,
        is_enabled: true,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Agent này đã được assign cho project này rồi');
          return;
        }
        throw error;
      }

      toast.success('Đã assign agent cho project');
      setIsAssignDialogOpen(false);
      setNewAssignment({
        project_id: '',
        agent_id: '',
        priority: 1,
        schedule_cron: '',
        auto_trigger_events: [],
        notes: '',
      });
      fetchAll();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Không thể assign agent');
    }
  };

  const toggleAgentEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('project_agents')
        .update({ is_enabled: !currentEnabled })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentEnabled ? 'Đã tắt agent' : 'Đã bật agent');
      fetchAll();
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast.error('Không thể cập nhật');
    }
  };

  const removeAssignment = async (id: string, agentName: string) => {
    if (!confirm(`Xóa "${agentName}" khỏi project này?`)) return;

    try {
      const { error } = await supabase.from('project_agents').delete().eq('id', id);

      if (error) throw error;

      toast.success('Đã xóa assignment');
      fetchAll();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Không thể xóa');
    }
  };

  const executeAgent = async (pa: ProjectAgent) => {
    toast.info(`🚀 Đang chạy ${pa.ai_agents?.name}...`);

    // TODO: Call actual agent execution API
    try {
      // Simulate execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

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

      toast.success(`✅ ${pa.ai_agents?.name} hoàn thành!`);
      fetchAll();
    } catch (error) {
      console.error('Error executing agent:', error);
      toast.error('Agent execution failed');
    }
  };

  const filteredProjectAgents =
    selectedProject === 'all'
      ? projectAgents
      : projectAgents.filter((pa) => pa.project_id === selectedProject);

  // Group by project
  const groupedByProject = filteredProjectAgents.reduce(
    (acc, pa) => {
      const projectName = pa.projects?.name || 'Unknown';
      if (!acc[projectName]) {
        acc[projectName] = { project: pa.projects, agents: [] };
      }
      acc[projectName].agents.push(pa);
      return acc;
    },
    {} as Record<string, { project: Project | undefined; agents: ProjectAgent[] }>
  );

  const TRIGGER_EVENTS = [
    { value: 'new_contact', label: 'New Contact Form' },
    { value: 'form_submission', label: 'Form Submission' },
    { value: 'new_order', label: 'New Order' },
    { value: 'schedule', label: 'Scheduled' },
    { value: 'manual', label: 'Manual Only' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Project Agents</h1>
            <p className="text-muted-foreground">
              {projectAgents.length} agent assignments across {projects.length} projects
            </p>
          </div>
        </div>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Agent to Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={newAssignment.project_id}
                  onValueChange={(v) => setNewAssignment({ ...newAssignment, project_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.icon} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>AI Agent</Label>
                <Select
                  value={newAssignment.agent_id}
                  onValueChange={(v) => setNewAssignment({ ...newAssignment, agent_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority (1 = highest)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newAssignment.priority}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      priority: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Auto Trigger Events</Label>
                <div className="flex flex-wrap gap-2">
                  {TRIGGER_EVENTS.map((event) => (
                    <Badge
                      key={event.value}
                      variant={
                        newAssignment.auto_trigger_events.includes(event.value)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const events = newAssignment.auto_trigger_events.includes(event.value)
                          ? newAssignment.auto_trigger_events.filter((e) => e !== event.value)
                          : [...newAssignment.auto_trigger_events, event.value];
                        setNewAssignment({ ...newAssignment, auto_trigger_events: events });
                      }}
                    >
                      {event.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schedule (Cron)</Label>
                <Input
                  placeholder="0 9 * * * (9am daily)"
                  value={newAssignment.schedule_cron}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, schedule_cron: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Ghi chú..."
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                />
              </div>

              <Button onClick={assignAgentToProject} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Assign Agent
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <Label>Filter by Project:</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents by Project */}
      {Object.entries(groupedByProject).map(([projectName, { project, agents: pas }]) => (
        <Card key={projectName}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{project?.icon || '📁'}</span>
              {projectName}
              <Badge variant="secondary">{pas.length} agents</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pas.map((pa) => (
                <div
                  key={pa.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    pa.is_enabled
                      ? 'bg-muted/50 border-border'
                      : 'bg-muted/20 border-muted opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Switch
                      checked={pa.is_enabled}
                      onCheckedChange={() => toggleAgentEnabled(pa.id, pa.is_enabled)}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pa.ai_agents?.name}</span>
                        <Badge variant="outline">{pa.ai_agents?.type}</Badge>
                        <Badge variant="secondary">Priority: {pa.priority}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {pa.ai_agents?.description?.slice(0, 80)}...
                      </div>
                      {pa.auto_trigger_events && pa.auto_trigger_events.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {pa.auto_trigger_events.map((e) => (
                            <Badge key={e} variant="outline" className="text-xs">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{pa.successful_runs}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>{pa.failed_runs}</span>
                        </div>
                        <div className="text-muted-foreground">
                          ${pa.total_cost_usd?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      {pa.last_run_at && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(pa.last_run_at).toLocaleString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => executeAgent(pa)}
                      disabled={!pa.is_enabled}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssignment(pa.id, pa.ai_agents?.name || '')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredProjectAgents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No agent assignments</h3>
            <p className="text-muted-foreground mb-4">
              Assign AI agents to your projects to automate tasks
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

export default ProjectAgentsManager;
