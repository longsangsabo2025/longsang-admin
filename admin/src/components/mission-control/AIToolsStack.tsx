import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ExternalLink, Globe, Loader2, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  type AgentStats,
  AI_TOOLS,
  type AIToolsHealth,
  ORCHESTRATOR_URL,
  StatusDot,
} from './mission-control.types';

export function AIToolsStack() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── AI Tools Stack Health (orchestrator)
  const { data: aiToolsHealth } = useQuery<AIToolsHealth | null>({
    queryKey: ['mission-control', 'ai-tools-health'],
    queryFn: async () => {
      try {
        const res = await fetch(`${ORCHESTRATOR_URL}/health`, { method: 'GET' });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  // ── Agent Registry Stats
  const { data: agentStats } = useQuery<AgentStats>({
    queryKey: ['mission-control', 'agent-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_registry')
        .select('id, status, department');
      if (error) return { total: 0, active: 0, idle: 0, busy: 0, error: 0, departments: 0 };
      const agents = data ?? [];
      const depts = new Set(agents.map((a) => a.department).filter(Boolean));
      return {
        total: agents.length,
        active: agents.filter((a) => a.status === 'active' || a.status === 'idle').length,
        idle: agents.filter((a) => a.status === 'idle').length,
        busy: agents.filter((a) => a.status === 'busy').length,
        error: agents.filter((a) => a.status === 'error').length,
        departments: depts.size,
      };
    },
    refetchInterval: 60000,
  });

  // ── Run Content Pipeline
  const runContentPipeline = useMutation({
    mutationFn: async (topic: string) => {
      const res = await fetch(`${ORCHESTRATOR_URL}/pipeline/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          template: 'lyblack_tho',
          agent_codename: 'content-lyblack-writer',
          auto_video: true,
          save_memory: true,
          user_id: 'longsang',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Content Pipeline completed ✅',
        description: `Duration: ${Math.round((data.total_duration_ms || 0) / 1000)}s`,
      });
      queryClient.invalidateQueries({ queryKey: ['mission-control'] });
    },
    onError: (err: Error) =>
      toast({ title: 'Pipeline failed', description: err.message, variant: 'destructive' }),
  });

  // ── Run Research Pipeline
  const runResearchPipeline = useMutation({
    mutationFn: async (topic: string) => {
      const res = await fetch(
        `${ORCHESTRATOR_URL}/pipeline/research?topic=${encodeURIComponent(topic)}&user_id=longsang`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => toast({ title: 'Research Pipeline completed ✅' }),
    onError: (err: Error) =>
      toast({ title: 'Research failed', description: err.message, variant: 'destructive' }),
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* AI Tools Services */}
        {AI_TOOLS.map((tool) => {
          const isUp =
            aiToolsHealth?.services?.[tool.id]?.status === 'up' ||
            (tool.id === 'orchestrator' && aiToolsHealth?.status === 'ok');
          const Icon = tool.icon;
          return (
            <Card key={tool.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <StatusDot status={isUp ? 'up' : 'unknown'} />
                </div>
                <CardTitle className="text-sm font-medium">{tool.name}</CardTitle>
                <CardDescription className="text-xs">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-xs text-muted-foreground">localhost:{tool.port}</span>
              </CardContent>
            </Card>
          );
        })}

        {/* Agent Registry Stats */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-purple-500" />
              <Badge variant="secondary" className="text-[10px]">
                {agentStats?.departments || 0} depts
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium">Agent Registry</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Agents</span>
              <span className="font-medium">{agentStats?.total || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Active</span>
              <span className="font-medium text-green-500">{agentStats?.active || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Busy</span>
              <span className="font-medium text-yellow-500">{agentStats?.busy || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Tools Quick Actions */}
      <div className="flex flex-wrap gap-3 mt-4">
        <Button
          onClick={() => runContentPipeline.mutate('Test content pipeline từ Mission Control')}
          disabled={runContentPipeline.isPending || !aiToolsHealth}
          variant="secondary"
          className="gap-2"
        >
          {runContentPipeline.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Content Pipeline
        </Button>

        <Button
          onClick={() => runResearchPipeline.mutate('AI trends Vietnam 2026')}
          disabled={runResearchPipeline.isPending || !aiToolsHealth}
          variant="outline"
          className="gap-2"
        >
          {runResearchPipeline.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          Run Research
        </Button>

        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => window.open('http://localhost:8210/logs', '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          View Logs
        </Button>
      </div>
    </>
  );
}
