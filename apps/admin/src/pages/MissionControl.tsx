/**
 * 🚀 MISSION CONTROL — Unified Command Center
 * Real-time ecosystem health, quick actions, automation status, revenue & costs.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Gamepad2,
  Globe,
  Hammer,
  ListTodo,
  Loader2,
  MonitorPlay,
  Play,
  RefreshCw,
  Rocket,
  Server,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Video,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type ServiceStatus = 'up' | 'down' | 'checking' | 'unknown';

interface EcosystemProduct {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
  displayUrl: string;
  description: string;
  statusField?: string;
}

interface HealthResult {
  id: string;
  status: ServiceStatus;
  latencyMs: number | null;
  checkedAt: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  triggerType: 'cron' | 'webhook' | 'manual';
  lastRun: string | null;
  nextRun: string | null;
  enabled: boolean;
}

interface PipelineRun {
  id: string;
  created_at: string;
  input_data: Record<string, unknown> | null;
  status: string;
  total_cost: number | null;
  duration_ms: number | null;
}

interface CloudHealthResult {
  product: string;
  status: string;
  response_ms: number | null;
  http_status: number | null;
  error: string | null;
  checked_at: string;
}

interface ContentCalendarItem {
  id: string;
  title: string | null;
  topic: string | null;
  type: string;
  scheduled_date: string;
  status: string;
  product: string | null;
  notes: string | null;
}

interface QueuedJob {
  id: string;
  topic: string;
  mode: string;
  status: string;
  priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface AIToolService {
  id: string;
  name: string;
  port: number;
  description: string;
  icon: React.ElementType;
}

interface AIToolsHealth {
  status: string;
  service: string;
  timestamp: string;
  services?: Record<string, { status: string; port: string }>;
  recent_executions?: number;
}

interface AgentStats {
  total: number;
  active: number;
  idle: number;
  busy: number;
  error: number;
  departments: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const PRODUCTS: EcosystemProduct[] = [
  {
    id: 'youtube-pipeline',
    name: 'YouTube Pipeline',
    icon: Video,
    url: 'http://localhost:3001',
    displayUrl: 'localhost:3001',
    description: 'AI video production pipeline',
  },
  {
    id: 'vt-dream-homes',
    name: 'VT Dream Homes',
    icon: Globe,
    url: 'https://vungtauland.store',
    displayUrl: 'vungtauland.store',
    description: 'Real estate platform',
  },
  {
    id: 'sabo-arena',
    name: 'SABO Arena',
    icon: Gamepad2,
    url: 'https://saboarena.com',
    displayUrl: 'saboarena.com',
    description: 'Billiards tournament platform',
  },
  {
    id: 'long-sang-forge',
    name: 'Long Sang Forge',
    icon: Hammer,
    url: 'https://longsang.org',
    displayUrl: 'longsang.org',
    description: 'Portfolio & dev services',
  },
  {
    id: 'ainewbie',
    name: 'AINewbieVN',
    icon: Sparkles,
    url: 'https://ainewbievn.shop',
    displayUrl: 'ainewbievn.shop',
    description: 'AI education platform',
  },
  {
    id: 'sabohub',
    name: 'SABOHUB',
    icon: MonitorPlay,
    url: '',
    displayUrl: 'Mobile App',
    description: 'Hub mobile app',
    statusField: 'dev',
  },
];

// ─── AI TOOLS STACK ────────────────────────────────────────────────────────
const AI_TOOLS: AIToolService[] = [
  { id: 'mem0', name: 'Mem0 Memory', port: 8200, description: 'Long-term agent memory', icon: Server },
  { id: 'browser', name: 'Browser-Use', port: 8201, description: 'Web automation + scraping', icon: Globe },
  { id: 'video', name: 'ShortGPT Video', port: 8202, description: 'TTS + video generation', icon: Video },
  { id: 'orchestrator', name: 'Orchestrator', port: 8210, description: 'Unified pipeline gateway', icon: Zap },
];

const ORCHESTRATOR_URL = 'http://localhost:8210';

const N8N_WORKFLOWS: N8nWorkflow[] = [
  { id: 'wf-youtube-daily', name: 'YouTube Daily Pipeline', triggerType: 'cron', lastRun: null, nextRun: null, enabled: true },
  { id: 'wf-content-seeder', name: 'VT Homes Content Seeder', triggerType: 'cron', lastRun: null, nextRun: null, enabled: true },
  { id: 'wf-social-poster', name: 'Social Media Auto-Post', triggerType: 'cron', lastRun: null, nextRun: null, enabled: false },
  { id: 'wf-health-monitor', name: 'Service Health Monitor', triggerType: 'cron', lastRun: null, nextRun: null, enabled: true },
  { id: 'wf-backup', name: 'Database Backup', triggerType: 'cron', lastRun: null, nextRun: null, enabled: true },
  { id: 'wf-webhook-invoice', name: 'Invoice Webhook Handler', triggerType: 'webhook', lastRun: null, nextRun: null, enabled: true },
];

// ─── HEALTH CHECK UTILITY ───────────────────────────────────────────────────

async function pingService(url: string, timeoutMs = 8000): Promise<{ ok: boolean; latencyMs: number }> {
  if (!url) return { ok: false, latencyMs: 0 };
  const start = performance.now();
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    const mode: RequestMode = url.startsWith('http://localhost') ? 'cors' : 'no-cors';
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, mode });
    clearTimeout(tid);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: res.ok || res.type === 'opaque', latencyMs };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    checking: 'bg-yellow-500 animate-pulse',
    unknown: 'bg-gray-400',
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

function RelativeTime({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground text-xs">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="text-xs">just now</span>;
  if (mins < 60) return <span className="text-xs">{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span className="text-xs">{hrs}h ago</span>;
  return <span className="text-xs">{Math.floor(hrs / 24)}d ago</span>;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const MissionControl = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Health state
  const [healthResults, setHealthResults] = useState<Record<string, HealthResult>>({});
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  // ── n8n workflow local state
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(N8N_WORKFLOWS);

  // ── Check single service health
  const checkHealth = useCallback(async (product: EcosystemProduct) => {
    setCheckingIds(prev => new Set(prev).add(product.id));
    const { ok, latencyMs } = await pingService(product.url);
    const result: HealthResult = {
      id: product.id,
      status: ok ? 'up' : 'down',
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
    setHealthResults(prev => ({ ...prev, [product.id]: result }));
    setCheckingIds(prev => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  }, []);

  // ── Check ALL services
  const checkAllServices = useCallback(async () => {
    await Promise.allSettled(PRODUCTS.filter(p => p.url).map(p => checkHealth(p)));
    toast({ title: 'Health check complete', description: 'All services have been pinged.' });
  }, [checkHealth, toast]);

  // ── Pipeline runs from Supabase (polling every 30s)
  const { data: pipelineRuns = [], isLoading: runsLoading } = useQuery<PipelineRun[]>({
    queryKey: ['mission-control', 'pipeline-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('id, created_at, input_data, status, total_cost, duration_ms')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) {
        console.warn('pipeline_runs query error:', error.message);
        return [];
      }
      return (data ?? []) as PipelineRun[];
    },
  });

  // ── Revenue & cost aggregates (polling every 30s)
  const { data: costStats } = useQuery({
    queryKey: ['mission-control', 'cost-stats'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const [todayCostRes, weekVideosRes, monthCostRes] = await Promise.all([
        supabase
          .from('pipeline_runs')
          .select('total_cost')
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('pipeline_runs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart.toISOString())
          .eq('status', 'completed'),
        supabase
          .from('pipeline_runs')
          .select('total_cost')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      const todayCost = (todayCostRes.data ?? []).reduce((s, r) => s + (r.total_cost ?? 0), 0);
      const monthCost = (monthCostRes.data ?? []).reduce((s, r) => s + (r.total_cost ?? 0), 0);
      const weekVideos = weekVideosRes.count ?? 0;
      const avgCost = weekVideos > 0 ? todayCost / Math.max(weekVideos, 1) : 0;

      return { todayCost, weekVideos, monthCost, avgCost };
    },
  });

  // ── Supabase Realtime: instant pipeline updates (replaces 30s polling)
  useEffect(() => {
    const channel = supabase
      .channel('pipeline-runs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_runs' },
        (payload) => {
          console.log('🔄 Realtime pipeline update:', payload.eventType, (payload.new as any)?.id);
          // Invalidate both queries → React Query auto-refetches
          queryClient.invalidateQueries({ queryKey: ['mission-control', 'pipeline-runs'] });
          queryClient.invalidateQueries({ queryKey: ['mission-control', 'cost-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ── Cloud health data from Edge Function (v_latest_health view)
  const { data: cloudHealth = [] } = useQuery<CloudHealthResult[]>({
    queryKey: ['mission-control', 'cloud-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_latest_health')
        .select('product, status, response_ms, http_status, error, checked_at');
      if (error) { console.warn('v_latest_health:', error.message); return []; }
      return (data ?? []) as CloudHealthResult[];
    },
    refetchInterval: 60000, // Refresh every 60s (Edge Function runs every 15min)
  });

  // ── Content calendar upcoming (next 7 days)
  const { data: calendarItems = [] } = useQuery<ContentCalendarItem[]>({
    queryKey: ['mission-control', 'content-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_content_calendar_upcoming')
        .select('id, title, topic, type, scheduled_date, status, product, notes');
      if (error) { console.warn('v_content_calendar_upcoming:', error.message); return []; }
      return (data ?? []) as ContentCalendarItem[];
    },
    refetchInterval: 300000, // 5 min
  });

  // ── Pipeline queue
  const { data: queuedJobs = [] } = useQuery<QueuedJob[]>({
    queryKey: ['mission-control', 'pipeline-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_queue')
        .select('id, topic, mode, status, priority, created_at, started_at, completed_at')
        .in('status', ['queued', 'running', 'processing'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10);
      if (error) { console.warn('pipeline_queue:', error.message); return []; }
      return (data ?? []) as QueuedJob[];
    },
    refetchInterval: 30000,
  });

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
      const depts = new Set(agents.map(a => a.department).filter(Boolean));
      return {
        total: agents.length,
        active: agents.filter(a => a.status === 'active' || a.status === 'idle').length,
        idle: agents.filter(a => a.status === 'idle').length,
        busy: agents.filter(a => a.status === 'busy').length,
        error: agents.filter(a => a.status === 'error').length,
        departments: depts.size,
      };
    },
    refetchInterval: 60000,
  });

  // ── Realtime for ecosystem_health_logs too
  useEffect(() => {
    const healthChannel = supabase
      .channel('health-logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ecosystem_health_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mission-control', 'cloud-health'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(healthChannel); };
  }, [queryClient]);

  // ── Trigger YouTube Pipeline
  const triggerYoutube = useMutation({
    mutationFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/youtube-pipeline-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ auto: true, source: 'manual' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'YouTube Pipeline triggered ✅' });
      queryClient.invalidateQueries({ queryKey: ['mission-control'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Pipeline trigger failed', description: err.message, variant: 'destructive' });
    },
  });

  // ── Trigger Shorts Batch (via same Edge Function with mode: "shorts")
  const triggerShorts = useMutation({
    mutationFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/youtube-pipeline-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ auto: true, mode: 'shorts', source: 'manual' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => toast({ title: 'Shorts batch triggered ✅' }),
    onError: (err: Error) => toast({ title: 'Shorts batch failed', description: err.message, variant: 'destructive' }),
  });

  // ── Trigger Content Seed (VT Homes — local MCP only, no cloud Edge Function yet)
  const triggerSeed = useMutation({
    mutationFn: async () => {
      // TODO: Create Edge Function for VT Homes content seeding when needed
      const res = await fetch('http://localhost:3002/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => toast({ title: 'VT Homes content seeded ✅' }),
    onError: (err: Error) => toast({ title: 'Seed failed', description: err.message, variant: 'destructive' }),
  });

  // ── AI Tools: Run Content Pipeline (Memory → Agent → Video → Memory)
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
      toast({ title: 'Content Pipeline completed ✅', description: `Duration: ${Math.round((data.total_duration_ms || 0) / 1000)}s` });
      queryClient.invalidateQueries({ queryKey: ['mission-control'] });
    },
    onError: (err: Error) => toast({ title: 'Pipeline failed', description: err.message, variant: 'destructive' }),
  });

  // ── AI Tools: Run Research Pipeline
  const runResearchPipeline = useMutation({
    mutationFn: async (topic: string) => {
      const res = await fetch(`${ORCHESTRATOR_URL}/pipeline/research?topic=${encodeURIComponent(topic)}&user_id=longsang`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => toast({ title: 'Research Pipeline completed ✅' }),
    onError: (err: Error) => toast({ title: 'Research failed', description: err.message, variant: 'destructive' }),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const getStatus = (id: string): ServiceStatus => {
    if (checkingIds.has(id)) return 'checking';
    // First check manual ping results
    if (healthResults[id]) return healthResults[id].status;
    // Fall back to cloud health data from Edge Function
    const product = PRODUCTS.find(p => p.id === id);
    if (product) {
      const cloud = cloudHealth.find(h => h.product.toLowerCase().replace(/\s+/g, '-') === id
        || product.name === h.product);
      if (cloud) return cloud.status === 'up' ? 'up' : 'down';
    }
    return 'unknown';
  };

  const getCloudCheck = (productName: string): CloudHealthResult | undefined => {
    return cloudHealth.find(h => h.product === productName);
  };

  const safe = costStats ?? { todayCost: 0, weekVideos: 0, monthCost: 0, avgCost: 0 };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* ── HEADER ─── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Mission Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified command center for the LongSang ecosystem
          </p>
        </div>
        <Button onClick={checkAllServices} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${checkingIds.size > 0 ? 'animate-spin' : ''}`} />
          Check All Services
        </Button>
      </div>

      <Separator />

      {/* ═══ SECTION 1 — ECOSYSTEM HEALTH (6 cards) ═══ */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5" /> Ecosystem Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {PRODUCTS.map(product => {
            const status = getStatus(product.id);
            const health = healthResults[product.id];
            const cloud = getCloudCheck(product.name);
            const Icon = product.icon;
            return (
              <Card key={product.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <StatusDot status={status} />
                  </div>
                  <CardTitle className="text-sm font-medium leading-tight">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {product.url ? (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {product.displayUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">{product.displayUrl}</span>
                  )}

                  {product.statusField && (
                    <Badge variant="secondary" className="text-[10px]">
                      {product.statusField}
                    </Badge>
                  )}

                  {/* Cloud health from Edge Function (15-min checks) */}
                  {cloud && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      Cloud: {cloud.status} {cloud.response_ms != null && `(${cloud.response_ms}ms)`}
                      {' · '}<RelativeTime iso={cloud.checked_at} />
                    </div>
                  )}

                  {status !== 'unknown' && (
                    <Badge
                      variant={status === 'up' ? 'default' : status === 'checking' ? 'secondary' : 'destructive'}
                      className="text-[10px]"
                    >
                      {status === 'up' && <Wifi className="h-3 w-3 mr-1" />}
                      {status === 'down' && <WifiOff className="h-3 w-3 mr-1" />}
                      {status === 'checking' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {status.toUpperCase()}
                      {health?.latencyMs != null && status === 'up' && ` ${health.latencyMs}ms`}
                    </Badge>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      disabled={checkingIds.has(product.id) || !product.url}
                      onClick={() => checkHealth(product)}
                    >
                      {checkingIds.has(product.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" /> Check
                        </>
                      )}
                    </Button>
                    {health && (
                      <span className="text-[10px] text-muted-foreground">
                        <RelativeTime iso={health.checkedAt} />
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══ SECTION 2 — QUICK ACTIONS ═══ */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5" /> Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => triggerYoutube.mutate()}
            disabled={triggerYoutube.isPending}
            className="gap-2"
          >
            {triggerYoutube.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run YouTube Pipeline
          </Button>

          <Button
            onClick={() => triggerShorts.mutate()}
            disabled={triggerShorts.isPending}
            variant="secondary"
            className="gap-2"
          >
            {triggerShorts.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            Run Shorts Batch
          </Button>

          <Button
            onClick={() => triggerSeed.mutate()}
            disabled={triggerSeed.isPending}
            variant="secondary"
            className="gap-2"
          >
            {triggerSeed.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Seed VT Homes Content
          </Button>

          <Button onClick={checkAllServices} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${checkingIds.size > 0 ? 'animate-spin' : ''}`} />
            Check All Services
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              copyToClipboard(
                'cd d:\\0.PROJECTS\\01-MAIN-PRODUCTS\\ainewbie-web && npm run build && npm run deploy',
                'Deploy command',
              )
            }
          >
            <Rocket className="h-4 w-4" />
            Deploy AINewbie
            <Copy className="h-3 w-3 ml-1 opacity-50" />
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => copyToClipboard('pm2 start ecosystem.config.js', 'PM2 command')}
          >
            <Server className="h-4 w-4" />
            Start All Services
            <Copy className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </div>
      </section>

      <Separator />

      {/* ═══ SECTION 2.5 — AI TOOLS STACK ═══ */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> AI Tools Stack
          {aiToolsHealth?.status === 'ok' && (
            <Badge variant="default" className="ml-2 text-[10px]">
              <Wifi className="h-3 w-3 mr-1" /> ONLINE
            </Badge>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* AI Tools Services */}
          {AI_TOOLS.map(tool => {
            const isUp = aiToolsHealth?.services?.[tool.id]?.status === 'up' || (tool.id === 'orchestrator' && aiToolsHealth?.status === 'ok');
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
                <Badge variant="secondary" className="text-[10px]">{agentStats?.departments || 0} depts</Badge>
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
            {runContentPipeline.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Content Pipeline
          </Button>

          <Button
            onClick={() => runResearchPipeline.mutate('AI trends Vietnam 2026')}
            disabled={runResearchPipeline.isPending || !aiToolsHealth}
            variant="outline"
            className="gap-2"
          >
            {runResearchPipeline.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
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
      </section>

      <Separator />

      {/* ═══ SECTION 3 + 4 — AUTOMATION STATUS & REVENUE/COSTS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── AUTOMATION STATUS (left, 2/3 width) ─── */}
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Automation Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {workflows.map(wf => (
              <Card key={wf.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{wf.name}</CardTitle>
                    <Switch
                      checked={wf.enabled}
                      onCheckedChange={checked => {
                        setWorkflows(prev =>
                          prev.map(w => (w.id === wf.id ? { ...w, enabled: checked } : w)),
                        );
                        toast({ title: `${wf.name} ${checked ? 'enabled' : 'disabled'}` });
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  <Badge variant="outline" className="text-[10px]">
                    {wf.triggerType}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last: <RelativeTime iso={wf.lastRun} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3" />
                    Next: {wf.nextRun ? new Date(wf.nextRun).toLocaleString() : '—'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── REVENUE & COSTS (right, 1/3 width) ─── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Revenue & Costs
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Today's Pipeline Cost</CardDescription>
                <CardTitle className="text-2xl">${safe.todayCost.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Videos This Week</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {safe.weekVideos}
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Est. Monthly Cost</CardDescription>
                <CardTitle className="text-2xl">${safe.monthCost.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cost / Video (avg)</CardDescription>
                <CardTitle className="text-2xl">${safe.avgCost.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>

      <Separator />

      {/* ═══ SECTION 3B — CONTENT CALENDAR & PIPELINE QUEUE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Content Calendar ─── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Content Calendar
          </h2>
          <Card>
            <CardContent className="p-0">
              {calendarItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No upcoming content scheduled.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title / Topic</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendarItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(item.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {item.title || item.topic || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === 'published' ? 'default'
                                : item.status === 'scheduled' ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─── Pipeline Queue ─── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" /> Pipeline Queue
          </h2>
          <Card>
            <CardContent className="p-0">
              {queuedJobs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No jobs in queue.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queuedJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {job.topic}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {job.mode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{job.priority}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              job.status === 'running' ? 'default'
                                : job.status === 'queued' ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {job.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <RelativeTime iso={job.created_at} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <Separator />

      {/* ═══ SECTION 5 — RECENT ACTIVITY (full-width table) ═══ */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" /> Recent Activity
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading pipeline runs…
                    </TableCell>
                  </TableRow>
                ) : pipelineRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                      No pipeline runs found. The <code className="text-xs">pipeline_runs</code> table
                      may not exist yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  pipelineRuns.map(run => (
                    <TableRow key={run.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(run.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {(run.input_data as any)?.topic || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            run.status === 'completed'
                              ? 'default'
                              : run.status === 'running'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-[10px]"
                        >
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {run.total_cost != null ? `$${Number(run.total_cost).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {run.duration_ms != null ? `${Math.round(run.duration_ms / 1000)}s` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default MissionControl;
