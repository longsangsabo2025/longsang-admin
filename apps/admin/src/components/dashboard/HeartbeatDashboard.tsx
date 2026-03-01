/**
 * 🫀 Heartbeat Dashboard — Real-time Empire Health Monitor
 * 
 * Uses Supabase Realtime to subscribe to project_heartbeats table.
 * Shows all projects with status, uptime, metrics, health checks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Globe,
  HardDrive,
  Heart,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
  BarChart3,
  ArrowUpDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  latency_ms?: number;
  message?: string;
  http_status?: number;
}

interface ProjectHeartbeat {
  id: string;
  project_slug: string;
  project_name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime_seconds: number;
  version: string;
  environment: string;
  metrics: Record<string, any>;
  health_checks: HealthCheck[];
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface EmpireStatus {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  stale: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'healthy': case 'ok': return 'text-green-500';
    case 'degraded': return 'text-yellow-500';
    case 'down': case 'error': return 'text-red-500';
    default: return 'text-gray-400';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'healthy': return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20';
    case 'degraded': return 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20';
    case 'down': return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20';
    default: return 'bg-gray-500/10 border-gray-500/30 hover:bg-gray-500/20';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'healthy': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'down': return <XCircle className="w-5 h-5 text-red-500" />;
    default: return <Clock className="w-5 h-5 text-gray-400" />;
  }
}

function isStale(lastHeartbeat: string, thresholdMs = 90000): boolean {
  return Date.now() - new Date(lastHeartbeat).getTime() > thresholdMs;
}

// ─── Components ───────────────────────────────────────────────────────

function EmpireSummary({ projects }: { projects: ProjectHeartbeat[] }) {
  const stats: EmpireStatus = {
    total: projects.length,
    healthy: projects.filter(p => p.status === 'healthy' && !isStale(p.updated_at)).length,
    degraded: projects.filter(p => p.status === 'degraded').length,
    down: projects.filter(p => p.status === 'down').length,
    stale: projects.filter(p => isStale(p.updated_at)).length,
  };

  const healthPercent = stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0;

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-red-500 animate-pulse" />
          Empire Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">{stats.healthy}/{stats.total} services healthy</span>
              <span className="text-sm font-bold">{healthPercent}%</span>
            </div>
            <Progress value={healthPercent} className="h-3" />
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">{stats.healthy}</div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{stats.degraded}</div>
              <div className="text-xs text-muted-foreground">Degraded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{stats.down}</div>
              <div className="text-xs text-muted-foreground">Down</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{stats.stale}</div>
              <div className="text-xs text-muted-foreground">Stale</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCheckBadge({ check }: { check: HealthCheck }) {
  const isOk = check.status === 'ok';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`text-xs ${isOk ? 'border-green-500/50 text-green-600' : 'border-red-500/50 text-red-600'}`}
        >
          {isOk ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
          {check.name}
          {check.latency_ms != null && <span className="ml-1 opacity-60">{check.latency_ms}ms</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {check.name}: {check.status}
          {check.latency_ms != null && ` (${check.latency_ms}ms)`}
          {check.message && `\n${check.message}`}
          {check.http_status && ` HTTP ${check.http_status}`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function ProjectCard({ project }: { project: ProjectHeartbeat }) {
  const stale = isStale(project.updated_at);
  const effectiveStatus = stale ? 'unknown' : project.status;
  const metrics = project.metrics || {};
  const checks = project.health_checks || [];

  return (
    <Card className={`border transition-colors ${statusBg(effectiveStatus)}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcon(effectiveStatus)}
            <CardTitle className="text-base">{project.project_name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {stale && (
              <Badge variant="outline" className="text-xs border-gray-500/50 text-gray-500">
                <WifiOff className="w-3 h-3 mr-1" /> stale
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {project.environment === 'production' ? (
                <><Globe className="w-3 h-3 mr-1" /> prod</>
              ) : (
                <><Server className="w-3 h-3 mr-1" /> dev</>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last heartbeat</span>
          <span className={stale ? 'text-yellow-500 font-medium' : ''}>
            {timeSince(project.updated_at)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uptime</span>
          <span>{formatUptime(project.uptime_seconds)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Version</span>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{project.version}</code>
        </div>

        {/* Metrics */}
        {Object.keys(metrics).length > 0 && (
          <div className="pt-1 border-t space-y-1">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Metrics
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {metrics.memory_mb != null && (
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-blue-400" />
                  <span>{metrics.memory_mb}MB RAM</span>
                </div>
              )}
              {metrics.cpu_percent != null && (
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>{metrics.cpu_percent}% CPU</span>
                </div>
              )}
              {metrics.pending_jobs != null && (
                <div className="flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-orange-400" />
                  <span>{metrics.pending_jobs} pending</span>
                </div>
              )}
              {metrics.processing_jobs != null && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-green-400" />
                  <span>{metrics.processing_jobs} processing</span>
                </div>
              )}
              {metrics.active_connections != null && (
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-cyan-400" />
                  <span>{metrics.active_connections} conn</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health checks */}
        {checks.length > 0 && (
          <div className="pt-1 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Health Checks
            </div>
            <div className="flex flex-wrap gap-1">
              {checks.map((check, i) => (
                <HealthCheckBadge key={i} check={check} />
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {project.error_count > 0 && (
          <div className="pt-1 border-t">
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="w-3 h-3" />
              {project.error_count} errors
              {project.last_error && (
                <span className="truncate text-red-400 ml-1" title={project.last_error}>
                  — {project.last_error}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export function HeartbeatDashboard() {
  const [projects, setProjects] = useState<ProjectHeartbeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const channelRef = useRef<any>(null);

  // Fetch all heartbeats
  const fetchHeartbeats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_heartbeats')
        .select('*')
        .order('project_name');

      if (error) {
        console.error('Failed to fetch heartbeats:', error);
        return;
      }

      setProjects(data || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Heartbeat fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    fetchHeartbeats();

    const channel = supabase
      .channel('heartbeat-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_heartbeats',
        },
        (payload) => {
          setProjects(prev => {
            const updated = payload.new as ProjectHeartbeat;
            const idx = prev.findIndex(p => p.project_slug === updated.project_slug);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            } else {
              return [...prev, updated].sort((a, b) => a.project_name.localeCompare(b.project_name));
            }
          });
          setLastRefresh(new Date());
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Fallback polling every 60s in case realtime drops
    const interval = setInterval(fetchHeartbeats, 60000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchHeartbeats]);

  // Force "time since" updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter by tab
  const [tab, setTab] = useState('all');
  const filteredProjects = projects.filter(p => {
    if (tab === 'all') return true;
    if (tab === 'issues') return p.status !== 'healthy' || isStale(p.updated_at);
    if (tab === 'local') return p.environment !== 'production';
    if (tab === 'deployed') return p.environment === 'production';
    return true;
  });

  const issueCount = projects.filter(p => p.status !== 'healthy' || isStale(p.updated_at)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500" />
            Heartbeat Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time health of all LongSang Empire services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={realtimeConnected ? 'border-green-500/50 text-green-600' : 'border-gray-500/50 text-gray-500'}
          >
            {realtimeConnected ? (
              <><Wifi className="w-3 h-3 mr-1" /> Live</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" /> Polling</>
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {timeSince(lastRefresh.toISOString())}
          </span>
          <Button size="sm" variant="outline" onClick={fetchHeartbeats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Empire Summary */}
      <EmpireSummary projects={projects} />

      {/* Tabs + Grid */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
          <TabsTrigger value="issues" className={issueCount > 0 ? 'text-red-500' : ''}>
            Issues ({issueCount})
          </TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="deployed">Deployed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse h-48">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No heartbeats yet</p>
                <p className="text-sm mt-1">
                  {projects.length === 0
                    ? 'Run the Supabase migration and start services to see heartbeats'
                    : 'No services match this filter'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProjects.map(project => (
                <ProjectCard key={project.project_slug} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HeartbeatDashboard;
