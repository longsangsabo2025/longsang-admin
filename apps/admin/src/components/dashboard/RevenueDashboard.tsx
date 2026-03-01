import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, TrendingUp, Activity, Globe, Hammer,
  Users, Server, RefreshCw, BarChart3, Cpu, Mic, Image,
  Video, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  ArrowUpRight, Loader2, Monitor,
} from 'lucide-react';

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
  </svg>
);
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineCostData {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  costPerVideo: number;
  runCountMonth: number;
  stageCosts: { stage: string; cost: number; runs: number }[];
}

interface RevenueEstimate {
  videosProduced: number;
  estimatedViews: number;
  cpmLow: number;
  cpmHigh: number;
  projectedMonthlyLow: number;
  projectedMonthlyHigh: number;
  videosPerWeek: number;
}

interface ProductInfo {
  name: string;
  slug: string;
  status: 'live' | 'ready' | 'building' | 'planned';
  icon: React.ElementType;
  color: string;
  metrics: { label: string; value: string }[];
  url?: string;
}

interface ServiceHealth {
  name: string;
  icon: React.ElementType;
  status: 'online' | 'offline' | 'unknown' | 'checking';
  detail: string;
  url?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  harvester: 'Harvester',
  'brain-curator': 'Brain Curator',
  'script-writer': 'Script Writer',
  'voice-producer': 'Voice Producer',
  'visual-director': 'Visual Director',
  'video-assembler': 'Video Composer',
  publisher: 'Publisher',
};

const STAGE_ICONS: Record<string, React.ElementType> = {
  harvester: Globe,
  'brain-curator': Sparkles,
  'script-writer': BarChart3,
  'voice-producer': Mic,
  'visual-director': Image,
  'video-assembler': Video,
  publisher: YoutubeIcon,
};

const VN_CPM_LOW = 0.5;
const VN_CPM_HIGH = 2;

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatUSD(amount: number): string {
  if (amount < 0.01 && amount > 0) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}

function formatVND(usd: number): string {
  const vnd = usd * 25000;
  if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(1)}M ₫`;
  if (vnd >= 1_000) return `${(vnd / 1_000).toFixed(0)}K ₫`;
  return `${vnd.toFixed(0)} ₫`;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'live': return 'bg-green-500/10 text-green-500 border-green-500/30';
    case 'ready': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    case 'building': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    case 'planned': return 'bg-muted text-muted-foreground border-muted';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
}

function getHealthColor(status: string) {
  switch (status) {
    case 'online': return 'text-green-500';
    case 'offline': return 'text-red-500';
    case 'checking': return 'text-yellow-500';
    default: return 'text-muted-foreground';
  }
}

// ─── Data Hooks ──────────────────────────────────────────────────────────────

function usePipelineCosts() {
  const [data, setData] = useState<PipelineCostData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: runs } = await supabase
        .from('pipeline_runs')
        .select('id, total_cost, stages, started_at, status')
        .gte('started_at', monthStart)
        .order('started_at', { ascending: false });

      if (!runs || runs.length === 0) {
        setData({
          totalToday: 0, totalWeek: 0, totalMonth: 0,
          costPerVideo: 0, runCountMonth: 0, stageCosts: [],
        });
        setLoading(false);
        return;
      }

      const todayRuns = runs.filter(r => r.started_at >= todayStart);
      const weekRuns = runs.filter(r => r.started_at >= weekStart);
      const completedRuns = runs.filter(r => r.status === 'completed');

      const totalToday = todayRuns.reduce((s, r) => s + (r.total_cost || 0), 0);
      const totalWeek = weekRuns.reduce((s, r) => s + (r.total_cost || 0), 0);
      const totalMonth = runs.reduce((s, r) => s + (r.total_cost || 0), 0);
      const costPerVideo = completedRuns.length > 0
        ? completedRuns.reduce((s, r) => s + (r.total_cost || 0), 0) / completedRuns.length
        : 0;

      const stageMap = new Map<string, { cost: number; runs: number }>();
      for (const run of runs) {
        const stages = run.stages as Array<{ name?: string; agentId?: string; cost?: number }> | null;
        if (!stages) continue;
        for (const stage of stages) {
          const key = stage.agentId || stage.name || 'unknown';
          const existing = stageMap.get(key) || { cost: 0, runs: 0 };
          existing.cost += stage.cost || 0;
          existing.runs += 1;
          stageMap.set(key, existing);
        }
      }

      const stageCosts = Array.from(stageMap.entries())
        .map(([stage, d]) => ({ stage, cost: d.cost, runs: d.runs }))
        .sort((a, b) => b.cost - a.cost);

      setData({
        totalToday, totalWeek, totalMonth,
        costPerVideo, runCountMonth: runs.length, stageCosts,
      });
    } catch (err) {
      console.error('Failed to fetch pipeline costs:', err);
      setData({
        totalToday: 0, totalWeek: 0, totalMonth: 0,
        costPerVideo: 0, runCountMonth: 0, stageCosts: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refresh: fetch };
}

function useServiceHealth() {
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'n8n Workflows', icon: Activity, status: 'checking', detail: 'Checking...' },
    { name: 'TTS Server', icon: Mic, status: 'checking', detail: 'Checking...' },
    { name: 'ComfyUI', icon: Image, status: 'checking', detail: 'Checking...' },
    { name: 'Supabase', icon: Server, status: 'checking', detail: 'Checking...' },
  ]);

  const check = useCallback(async () => {
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const, detail: 'Checking...' })));

    const results: ServiceHealth[] = [];

    // Supabase
    try {
      const { error } = await supabase.from('projects').select('id').limit(1);
      results.push({
        name: 'Supabase', icon: Server,
        status: error ? 'offline' : 'online',
        detail: error ? error.message : 'Connected',
        url: 'https://supabase.com/dashboard',
      });
    } catch {
      results.push({ name: 'Supabase', icon: Server, status: 'offline', detail: 'Connection failed' });
    }

    // TTS Server
    try {
      const res = await globalThis.fetch('http://localhost:8100/health', { signal: AbortSignal.timeout(3000) });
      results.push({
        name: 'TTS Server', icon: Mic,
        status: res.ok ? 'online' : 'offline',
        detail: res.ok ? `Port 8100 OK` : `HTTP ${res.status}`,
        url: 'http://localhost:8100',
      });
    } catch {
      results.push({ name: 'TTS Server', icon: Mic, status: 'offline', detail: 'Not reachable (8100)' });
    }

    // ComfyUI
    try {
      const res = await globalThis.fetch('http://localhost:8188/system_stats', { signal: AbortSignal.timeout(3000) });
      results.push({
        name: 'ComfyUI', icon: Image,
        status: res.ok ? 'online' : 'offline',
        detail: res.ok ? 'Port 8188 OK' : `HTTP ${res.status}`,
        url: 'http://localhost:8188',
      });
    } catch {
      results.push({ name: 'ComfyUI', icon: Image, status: 'offline', detail: 'Not reachable (8188)' });
    }

    // n8n — we attempt the API; if unreachable, show unknown
    try {
      const res = await globalThis.fetch('http://localhost:5678/api/v1/workflows?active=true', {
        signal: AbortSignal.timeout(3000),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const activeCount = json.data?.length ?? '?';
        results.push({
          name: 'n8n Workflows', icon: Activity,
          status: 'online',
          detail: `${activeCount} active workflows`,
          url: 'http://localhost:5678',
        });
      } else {
        results.push({ name: 'n8n Workflows', icon: Activity, status: 'offline', detail: `HTTP ${res.status}` });
      }
    } catch {
      results.push({ name: 'n8n Workflows', icon: Activity, status: 'unknown', detail: 'Not reachable (5678)' });
    }

    setServices(results);
  }, []);

  useEffect(() => { check(); }, [check]);
  return { services, refresh: check };
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CostTrackerSection({ data, loading }: Readonly<{ data: PipelineCostData | null; loading: boolean }>) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6"><div className="h-16 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const maxStageCost = Math.max(...data.stageCosts.map(s => s.cost), 0.001);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{formatUSD(data.totalToday)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{formatUSD(data.totalWeek)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatUSD(data.totalMonth)}</p>
                <p className="text-xs text-muted-foreground">{data.runCountMonth} runs</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Video</p>
                <p className="text-2xl font-bold">{formatUSD(data.costPerVideo)}</p>
                <p className="text-xs text-muted-foreground">{formatVND(data.costPerVideo)}</p>
              </div>
              <Video className="h-8 w-8 text-yellow-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {data.stageCosts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cost by Pipeline Stage</CardTitle>
            <CardDescription>Which agent costs the most this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stageCosts.map(sc => {
                const Icon = STAGE_ICONS[sc.stage] || Cpu;
                const pct = (sc.cost / maxStageCost) * 100;
                return (
                  <div key={sc.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{STAGE_LABELS[sc.stage] || sc.stage}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{sc.runs} runs</span>
                        <span className="font-mono font-medium text-foreground">{formatUSD(sc.cost)}</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RevenueEstimateSection({ costData }: Readonly<{ costData: PipelineCostData | null }>) {
  const estimates = useMemo<RevenueEstimate>(() => {
    const videosProduced = costData?.runCountMonth || 0;
    const videosPerWeek = videosProduced > 0 ? Math.ceil(videosProduced / 4) : 7;
    const estimatedViewsPerVideo = 500;
    const estimatedViews = videosProduced * estimatedViewsPerVideo;
    const projectedMonthlyVideos = videosPerWeek * 4;

    return {
      videosProduced,
      estimatedViews,
      cpmLow: VN_CPM_LOW,
      cpmHigh: VN_CPM_HIGH,
      projectedMonthlyLow: (projectedMonthlyVideos * estimatedViewsPerVideo * VN_CPM_LOW) / 1000,
      projectedMonthlyHigh: (projectedMonthlyVideos * estimatedViewsPerVideo * VN_CPM_HIGH) / 1000,
      videosPerWeek,
    };
  }, [costData]);

  const monthCost = costData?.totalMonth || 0;
  const netLow = estimates.projectedMonthlyLow - monthCost;
  const netHigh = estimates.projectedMonthlyHigh - monthCost;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Videos This Month</p>
                <p className="text-2xl font-bold">{estimates.videosProduced}</p>
                <p className="text-xs text-muted-foreground">~{estimates.videosPerWeek}/week target</p>
              </div>
              <YoutubeIcon className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Views</p>
                <p className="text-2xl font-bold">{estimates.estimatedViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">~500/video placeholder</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VN CPM Range</p>
                <p className="text-2xl font-bold">${estimates.cpmLow} – ${estimates.cpmHigh}</p>
                <p className="text-xs text-muted-foreground">Vietnamese content average</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Projected Monthly Revenue
          </CardTitle>
          <CardDescription>
            Based on {estimates.videosPerWeek * 4} videos/month × 500 views × ${estimates.cpmLow}–${estimates.cpmHigh} CPM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-background/60">
              <p className="text-sm text-muted-foreground mb-1">Revenue (Low)</p>
              <p className="text-xl font-bold text-green-500">{formatUSD(estimates.projectedMonthlyLow)}</p>
              <p className="text-xs text-muted-foreground">{formatVND(estimates.projectedMonthlyLow)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/60">
              <p className="text-sm text-muted-foreground mb-1">Revenue (High)</p>
              <p className="text-xl font-bold text-green-500">{formatUSD(estimates.projectedMonthlyHigh)}</p>
              <p className="text-xs text-muted-foreground">{formatVND(estimates.projectedMonthlyHigh)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/60">
              <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
              <p className={`text-xl font-bold ${netLow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatUSD(netLow)} – {formatUSD(netHigh)}
              </p>
              <p className="text-xs text-muted-foreground">After pipeline costs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-sm">
        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
        <span className="text-muted-foreground">
          Revenue estimates use placeholder view counts. Connect YouTube Analytics API for real data.
        </span>
      </div>
    </div>
  );
}

function ProductRevenueSection() {
  const products: ProductInfo[] = [
    {
      name: 'YouTube "ĐỨNG DẬY ĐI"',
      slug: 'youtube-channel',
      status: 'ready',
      icon: YoutubeIcon,
      color: 'text-red-500',
      metrics: [
        { label: 'Type', value: 'AI-Generated Podcast' },
        { label: 'Schedule', value: 'Daily 8AM via n8n' },
        { label: 'Pipeline', value: '7-stage autonomous' },
        { label: 'Est. Revenue', value: 'Pending first uploads' },
      ],
      url: '/admin/pipeline',
    },
    {
      name: 'Vũng Tàu Dream Homes',
      slug: 'vungtau-dream-homes',
      status: 'live',
      icon: Globe,
      color: 'text-blue-500',
      metrics: [
        { label: 'URL', value: 'vungtauland.store' },
        { label: 'Stack', value: 'React + Supabase + Vercel' },
        { label: 'Traffic', value: 'Awaiting GA setup' },
        { label: 'Revenue Model', value: 'Lead gen + listing fees' },
      ],
      url: 'https://vungtauland.store',
    },
    {
      name: 'Sabo Arena',
      slug: 'sabo-arena',
      status: 'live',
      icon: Monitor,
      color: 'text-purple-500',
      metrics: [
        { label: 'Status', value: 'Deployed' },
        { label: 'Completion', value: '95%' },
        { label: 'Traffic', value: 'Awaiting analytics' },
        { label: 'Revenue Model', value: 'SaaS subscriptions' },
      ],
    },
    {
      name: 'Long Sang Forge',
      slug: 'long-sang-forge',
      status: 'building',
      icon: Hammer,
      color: 'text-orange-500',
      metrics: [
        { label: 'Completion', value: '85%' },
        { label: 'Status', value: 'Final polish' },
        { label: 'Revenue Model', value: 'B2B services' },
      ],
    },
    {
      name: 'AINewbieVN',
      slug: 'ainewbie-vn',
      status: 'building',
      icon: Users,
      color: 'text-cyan-500',
      metrics: [
        { label: 'Type', value: 'Community platform' },
        { label: 'Completion', value: '60%' },
        { label: 'Monetization', value: 'Not yet — growth phase' },
      ],
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map(product => {
        const Icon = product.icon;
        return (
          <Card key={product.slug} className="group hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${product.color}`} />
                  <CardTitle className="text-base">{product.name}</CardTitle>
                </div>
                <Badge variant="outline" className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.metrics.map(m => (
                  <div key={m.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{m.value}</span>
                  </div>
                ))}
              </div>
              {product.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full justify-between text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const url = product.url;
                    if (!url) return;
                    if (url.startsWith('http')) {
                      globalThis.open(url, '_blank');
                    } else {
                      globalThis.location.href = url;
                    }
                  }}
                >
                  Open
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AutomationHealthSection({ services, onRefresh }: Readonly<{ services: ServiceHealth[]; onRefresh: () => void }>) {
  const onlineCount = services.filter(s => s.status === 'online').length;
  const total = services.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={onlineCount === total ? 'default' : 'secondary'}>
            {onlineCount}/{total} Online
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Re-check
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {services.map(service => {
          const Icon = service.icon;
          const statusIconMap: Record<string, React.ElementType> = {
            online: CheckCircle2,
            checking: Loader2,
            unknown: AlertTriangle,
            offline: XCircle,
          };
          const StatusIcon = statusIconMap[service.status] || XCircle;
          const borderMap: Record<string, string> = {
            online: 'border-green-500/20',
            offline: 'border-red-500/20',
          };
          const borderClass = borderMap[service.status] ?? '';
          return (
            <Card key={service.name} className={borderClass}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    service.status === 'online' ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${getHealthColor(service.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{service.name}</p>
                      <StatusIcon className={`h-3.5 w-3.5 ${getHealthColor(service.status)} ${
                        service.status === 'checking' ? 'animate-spin' : ''
                      }`} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{service.detail}</p>
                  </div>
                  {service.url && service.status === 'online' && (
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => globalThis.open(service.url, '_blank')}
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RevenueDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: costData, loading: costLoading, refresh: refreshCosts } = usePipelineCosts();
  const { services, refresh: refreshHealth } = useServiceHealth();

  const refreshAll = useCallback(() => {
    refreshCosts();
    refreshHealth();
  }, [refreshCosts, refreshHealth]);

  const monthCost = costData?.totalMonth || 0;
  const runCount = costData?.runCountMonth || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Revenue Dashboard
          </h2>
          <p className="text-muted-foreground">
            Costs, revenue projections & automation health — all in one place
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Quick Summary Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Monthly Cost</p>
            <p className="text-xl font-bold">{formatUSD(monthCost)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Videos Produced</p>
            <p className="text-xl font-bold">{runCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Products Live</p>
            <p className="text-xl font-bold">2 / 5</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Services Online</p>
            <p className="text-xl font-bold">
              {services.filter(s => s.status === 'online').length} / {services.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Cost Tracker
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Revenue Estimates
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Globe className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Automation Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <CostTrackerSection data={costData} loading={costLoading} />
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <RevenueEstimateSection costData={costData} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductRevenueSection />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <AutomationHealthSection services={services} onRefresh={refreshHealth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RevenueDashboard;
