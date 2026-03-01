/**
 * Pipeline Dashboard Component
 * Real-time monitoring of YouTube Agent Crew pipeline runs
 * 
 * Features:
 * - Trigger new pipeline runs
 * - View active/completed/failed runs
 * - Resume from checkpoints
 * - MCP Gateway service health
 * - Agent cards (A2A protocol)
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  RotateCcw,
  Activity,
  Zap,
  Server,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Loader2,
  RefreshCw,
  Mic,
  Brain,
  Pen,
  Eye,
  Film,
  Upload,
  Search,
} from 'lucide-react';
import { usePipelineRuns } from '@/hooks/usePipelineData';
import { supabase } from '@/lib/supabase';

const API_BASE = '/api';

interface Checkpoint {
  pipelineId: string;
  stageIndex: number;
  stageName: string;
  checkpointedAt: string;
}

interface ServiceHealth {
  id: string;
  name: string;
  status: string;
  error?: string;
}

interface AgentCard {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  model: string;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  'harvester': <Search className="h-4 w-4" />,
  'brain-curator': <Brain className="h-4 w-4" />,
  'script-writer': <Pen className="h-4 w-4" />,
  'voice-producer': <Mic className="h-4 w-4" />,
  'visual-director': <Eye className="h-4 w-4" />,
  'video-composer': <Film className="h-4 w-4" />,
  'publisher': <Upload className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  running: { color: 'bg-blue-500', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Running' },
  completed: { color: 'bg-green-500', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed' },
  failed: { color: 'bg-red-500', icon: <AlertCircle className="h-3 w-3" />, label: 'Failed' },
  paused_cost: { color: 'bg-yellow-500', icon: <Pause className="h-3 w-3" />, label: 'Paused (Cost)' },
  healthy: { color: 'bg-green-500', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Healthy' },
  offline: { color: 'bg-red-500', icon: <AlertCircle className="h-3 w-3" />, label: 'Offline' },
  unhealthy: { color: 'bg-yellow-500', icon: <AlertCircle className="h-3 w-3" />, label: 'Unhealthy' },
};

export function PipelineDashboard() {
  const { runs, refresh: refreshRuns } = usePipelineRuns();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [triggerInput, setTriggerInput] = useState('');
  const [triggerType, setTriggerType] = useState<'topic' | 'url'>('topic');
  const [activeTab, setActiveTab] = useState('runs');

  const fetchSupportData = useCallback(async () => {
    try {
      const [checkpointsRes, healthRes, agentsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/youtube-crew/checkpoints`),
        fetch(`${API_BASE}/mcp-gateway/health`),
        fetch(`${API_BASE}/youtube-crew/agents`),
      ]);

      if (checkpointsRes.status === 'fulfilled' && checkpointsRes.value.ok) {
        const data = await checkpointsRes.value.json();
        setCheckpoints(data.checkpoints || []);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const data = await healthRes.value.json();
        setServices(data.services || []);
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        const data = await agentsRes.value.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('[Pipeline Dashboard] Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  useEffect(() => {
    const channel = supabase
      .channel('pipeline-runs-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_runs',
      }, () => {
        refreshRuns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshRuns]);

  const handleRefresh = () => {
    refreshRuns();
    fetchSupportData();
  };

  const triggerPipeline = async () => {
    if (!triggerInput.trim()) return;
    setTriggering(true);
    try {
      const body = triggerType === 'url'
        ? { videoUrl: triggerInput }
        : { topic: triggerInput };
      const res = await fetch(`${API_BASE}/youtube-crew/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setTriggerInput('');
        setTimeout(refreshRuns, 1000);
      }
    } catch (err) {
      console.error('Trigger error:', err);
    } finally {
      setTriggering(false);
    }
  };

  const resumePipeline = async (pipelineId: string) => {
    try {
      await fetch(`${API_BASE}/youtube-crew/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId }),
      });
      setTimeout(refreshRuns, 1000);
    } catch (err) {
      console.error('Resume error:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.failed;
    return (
      <Badge variant="outline" className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Dashboard</h1>
          <p className="text-muted-foreground">
            YouTube Agent Crew — 7-agent AI video factory
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Trigger */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Trigger
          </CardTitle>
          <CardDescription>Start a new YouTube podcast pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${triggerType === 'topic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setTriggerType('topic')}
              >
                Topic
              </button>
              <button
                className={`px-3 py-2 text-sm ${triggerType === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setTriggerType('url')}
              >
                URL
              </button>
            </div>
            <Input
              value={triggerInput}
              onChange={(e) => setTriggerInput(e.target.value)}
              placeholder={triggerType === 'url' ? 'https://youtube.com/watch?v=...' : 'Chu ky 18 nam bat dong san'}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && triggerPipeline()}
            />
            <Button onClick={triggerPipeline} disabled={triggering || !triggerInput.trim()}>
              {triggering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run Pipeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Health Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {services.map((svc) => {
          const config = STATUS_CONFIG[svc.status] || STATUS_CONFIG.offline;
          return (
            <Card key={svc.id} className="p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${config.color}`} />
                <span className="text-xs font-medium truncate">{svc.name}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="runs" className="gap-1">
            <Activity className="h-4 w-4" />
            Runs ({runs.length})
          </TabsTrigger>
          <TabsTrigger value="checkpoints" className="gap-1">
            <RotateCcw className="h-4 w-4" />
            Checkpoints ({checkpoints.length})
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-1">
            <Server className="h-4 w-4" />
            Agents ({agents.length})
          </TabsTrigger>
        </TabsList>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-3">
          {runs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No pipeline runs yet. Use Quick Trigger above to start one.</p>
            </Card>
          ) : (
            runs.map((run) => (
              <Card key={run.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{run.pipelineId || run.id}</code>
                        {getStatusBadge(run.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(run.startedAt).toLocaleString('vi-VN')}
                        </span>
                        {run.input?.topic && <span>Topic: {String(run.input.topic).substring(0, 50)}</span>}
                        {run.input?.videoUrl && <span>URL: {String(run.input.videoUrl).substring(0, 50)}</span>}
                        {run.stages?.length > 0 && (
                          <span>{run.stages.filter(s => s.status === 'completed').length}/{run.stages.length} stages</span>
                        )}
                      </div>
                    </div>
                    {(run.status === 'failed' || run.status === 'paused_cost') && (
                      <Button variant="outline" size="sm" onClick={() => resumePipeline(run.pipelineId || run.id)}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Checkpoints Tab */}
        <TabsContent value="checkpoints" className="space-y-3">
          {checkpoints.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No checkpoints yet. Checkpoints are saved after each pipeline stage.</p>
            </Card>
          ) : (
            checkpoints.map((cp) => (
              <Card key={cp.pipelineId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <code className="text-sm font-mono">{cp.pipelineId}</code>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="secondary">Stage {cp.stageIndex + 1}: {cp.stageName}</Badge>
                        {cp.checkpointedAt && (
                          <span>{new Date(cp.checkpointedAt).toLocaleString('vi-VN')}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => resumePipeline(cp.pipelineId)}>
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {AGENT_ICONS[agent.id] || <Zap className="h-4 w-4" />}
                    {agent.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities?.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-[10px]">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Model: {agent.model}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
