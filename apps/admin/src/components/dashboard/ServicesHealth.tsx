import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { checkConnectionHealth } from '@/lib/supabase';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Globe,
  Home,
  Loader2,
  Mic,
  Monitor,
  Paintbrush,
  Play,
  RefreshCw,
  Server,
  Swords,
  Timer,
  Video,
  Workflow,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type ServiceStatus = 'online' | 'offline' | 'checking';

interface HealthEntry {
  status: ServiceStatus;
  responseTime: number;
  timestamp: Date;
}

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  checkUrl: string;
  type: 'local' | 'external' | 'supabase';
  actionUrl?: string;
  actionLabel?: string;
}

const SERVICES: ServiceConfig[] = [
  {
    id: 'youtube-pipeline',
    name: 'YouTube Pipeline',
    description: 'Agent Crew API — video production pipeline',
    icon: Video,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    checkUrl: 'http://localhost:3001/api/youtube-crew/agents',
    type: 'local',
    actionUrl: '/admin/pipeline',
    actionLabel: 'Open Pipeline',
  },
  {
    id: 'voxcpm-tts',
    name: 'VoxCPM TTS',
    description: 'Vietnamese TTS on CUDA:0, port 8100',
    icon: Mic,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    checkUrl: 'http://localhost:8100/v1/health',
    type: 'local',
    actionLabel: 'Health API',
  },
  {
    id: 'comfyui',
    name: 'ComfyUI',
    description: 'Image generation server, port 8188',
    icon: Paintbrush,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    checkUrl: 'http://localhost:8188/system_stats',
    type: 'local',
    actionLabel: 'Open ComfyUI',
    actionUrl: 'http://localhost:8188',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Postgres database & auth — cloud hosted',
    icon: Database,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    checkUrl: '__supabase__',
    type: 'supabase',
    actionUrl: 'https://supabase.com/dashboard',
    actionLabel: 'Dashboard',
  },
  {
    id: 'n8n',
    name: 'n8n Workflows',
    description: 'Automation engine, port 5678',
    icon: Workflow,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    checkUrl: 'http://localhost:5678/api/v1/workflows',
    type: 'local',
    actionUrl: 'http://localhost:5678',
    actionLabel: 'Open n8n',
  },
  {
    id: 'vungtau',
    name: 'Vũng Tàu Dream Homes',
    description: 'Real estate — vungtauland.store',
    icon: Home,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    checkUrl: 'https://vungtauland.store',
    type: 'external',
    actionUrl: 'https://vungtauland.store',
    actionLabel: 'Visit Site',
  },
  {
    id: 'sabo-arena',
    name: 'Sabo Arena',
    description: 'Community platform — saboarena.com',
    icon: Swords,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    checkUrl: 'https://saboarena.com',
    type: 'external',
    actionUrl: 'https://saboarena.com',
    actionLabel: 'Visit Site',
  },
];

const HISTORY_LENGTH = 10;
const AUTO_REFRESH_MS = 30_000;

function Sparkline({ history }: { history: HealthEntry[] }) {
  if (history.length === 0) return null;

  const w = 120;
  const h = 28;
  const padding = 2;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const maxRt = Math.max(...history.map((h) => h.responseTime), 1);
  const points = history.map((entry, i) => {
    const x = padding + (i / Math.max(history.length - 1, 1)) * innerW;
    const y = padding + innerH - (entry.responseTime / maxRt) * innerH;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/50"
      />
      {history.map((entry, i) => {
        const x = padding + (i / Math.max(history.length - 1, 1)) * innerW;
        const y = padding + innerH - (entry.responseTime / maxRt) * innerH;
        const fill =
          entry.status === 'online'
            ? '#22c55e'
            : entry.status === 'offline'
              ? '#ef4444'
              : '#eab308';
        return <circle key={i} cx={x} cy={y} r={2.5} fill={fill} />;
      })}
    </svg>
  );
}

function StatusDot({ status }: { status: ServiceStatus }) {
  if (status === 'checking') {
    return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />;
  }
  if (status === 'online') {
    return <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />;
  }
  return <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

async function checkService(service: ServiceConfig): Promise<{ ok: boolean; ms: number }> {
  const start = performance.now();

  if (service.type === 'supabase') {
    const ok = await checkConnectionHealth();
    return { ok, ms: Math.round(performance.now() - start) };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(service.checkUrl, {
      method: 'GET',
      signal: controller.signal,
      mode: service.type === 'external' ? 'no-cors' : 'cors',
    });

    clearTimeout(timeout);
    // no-cors always gives opaque response (status 0), treat as online
    const ok = service.type === 'external' ? true : res.ok;
    return { ok, ms: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - start) };
  }
}

export function ServicesHealth() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({});
  const [lastChecked, setLastChecked] = useState<Record<string, Date>>({});
  const [history, setHistory] = useState<Record<string, HealthEntry[]>>({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAll = useCallback(async () => {
    setIsCheckingAll(true);

    const newStatuses: Record<string, ServiceStatus> = {};
    const newRt: Record<string, number> = {};
    const newLastChecked: Record<string, Date> = {};
    const newHistoryEntries: Record<string, HealthEntry> = {};

    SERVICES.forEach((s) => {
      newStatuses[s.id] = 'checking';
    });
    setStatuses((prev) => ({ ...prev, ...newStatuses }));

    await Promise.all(
      SERVICES.map(async (service) => {
        const { ok, ms } = await checkService(service);
        const status: ServiceStatus = ok ? 'online' : 'offline';
        const now = new Date();

        newStatuses[service.id] = status;
        newRt[service.id] = ms;
        newLastChecked[service.id] = now;
        newHistoryEntries[service.id] = { status, responseTime: ms, timestamp: now };
      })
    );

    setStatuses(newStatuses);
    setResponseTimes((prev) => ({ ...prev, ...newRt }));
    setLastChecked((prev) => ({ ...prev, ...newLastChecked }));
    setHistory((prev) => {
      const next = { ...prev };
      for (const [id, entry] of Object.entries(newHistoryEntries)) {
        const arr = [...(next[id] || []), entry];
        next[id] = arr.slice(-HISTORY_LENGTH);
      }
      return next;
    });

    setIsCheckingAll(false);
  }, []);

  useEffect(() => {
    checkAll();
    intervalRef.current = setInterval(checkAll, AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkAll]);

  const onlineCount = SERVICES.filter((s) => statuses[s.id] === 'online').length;
  const totalCount = SERVICES.length;
  const healthPct = Math.round((onlineCount / totalCount) * 100);

  const healthColor =
    healthPct === 100 ? 'text-green-600' : healthPct >= 70 ? 'text-yellow-600' : 'text-red-600';
  const progressColor =
    healthPct === 100
      ? '[&>div]:bg-green-500'
      : healthPct >= 70
        ? '[&>div]:bg-yellow-500'
        : '[&>div]:bg-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            Services Health
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified monitoring for all microservices and deployed apps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                Auto-refresh 30s
              </div>
            </TooltipTrigger>
            <TooltipContent>Checks all services every 30 seconds</TooltipContent>
          </Tooltip>
          <Button onClick={checkAll} disabled={isCheckingAll} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isCheckingAll ? 'animate-spin' : ''}`} />
            Check All
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                  healthPct === 100
                    ? 'border-green-500 bg-green-50'
                    : healthPct >= 70
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-red-500 bg-red-50'
                }`}
              >
                <span className={`text-xl font-bold ${healthColor}`}>
                  {onlineCount}/{totalCount}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {healthPct === 100
                    ? 'All Systems Operational'
                    : healthPct >= 70
                      ? 'Partial Degradation'
                      : 'Major Outage'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {onlineCount} of {totalCount} services online
                </p>
              </div>
            </div>
            <div className="w-full max-w-xs">
              <Progress value={healthPct} className={`h-3 ${progressColor}`} />
              <p className="text-xs text-muted-foreground mt-1 text-right">{healthPct}% healthy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const status = statuses[service.id] || 'checking';
          const rt = responseTimes[service.id];
          const lastCheck = lastChecked[service.id];
          const serviceHistory = history[service.id] || [];

          return (
            <Card
              key={service.id}
              className={`transition-all hover:shadow-md ${
                status === 'offline' ? 'border-red-300 bg-red-50/30' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${service.bgColor}`}>
                      <Icon className={`h-5 w-5 ${service.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                  <StatusDot status={status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Status Badge + Response Time */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={
                      status === 'online'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : status === 'offline'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }
                  >
                    {status === 'online' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {status === 'offline' && <XCircle className="h-3 w-3 mr-1" />}
                    {status === 'checking' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking'}
                  </Badge>

                  {rt !== undefined && (
                    <span
                      className={`text-xs font-mono ${
                        rt < 500
                          ? 'text-green-600'
                          : rt < 2000
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {rt}ms
                    </span>
                  )}
                </div>

                {/* Last Checked */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {lastCheck ? `Last checked ${formatTime(lastCheck)}` : 'Not checked yet'}
                </div>

                {/* Sparkline */}
                {serviceHistory.length > 1 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                      Response time (last {serviceHistory.length})
                    </p>
                    <Sparkline history={serviceHistory} />
                  </div>
                )}

                {/* Action Button */}
                {service.actionUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1 gap-2"
                    onClick={() => {
                      if (
                        service.actionUrl!.startsWith('http') ||
                        service.actionUrl!.startsWith('//')
                      ) {
                        window.open(service.actionUrl, '_blank');
                      } else {
                        window.location.href = service.actionUrl!;
                      }
                    }}
                  >
                    {service.type === 'external' ? (
                      <Globe className="h-3.5 w-3.5" />
                    ) : service.type === 'local' ? (
                      <Monitor className="h-3.5 w-3.5" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    {service.actionLabel || 'Open'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend / Info Footer */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              <span>
                {SERVICES.filter((s) => s.type === 'local').length} local services,{' '}
                {SERVICES.filter((s) => s.type === 'external').length} deployed sites,{' '}
                {SERVICES.filter((s) => s.type === 'supabase').length} cloud database
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Online</span>
              <div className="h-2 w-2 rounded-full bg-red-500 ml-2" />
              <span>Offline</span>
              <div className="h-2 w-2 rounded-full bg-yellow-500 ml-2" />
              <span>Checking</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-3.5 w-3.5" />
              <span>External sites use no-cors (opaque response = online)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
