import { Gamepad2, Globe, Hammer, MonitorPlay, Server, Sparkles, Video, Zap } from 'lucide-react';
import type React from 'react';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type ServiceStatus = 'up' | 'down' | 'checking' | 'unknown';

export interface EcosystemProduct {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
  displayUrl: string;
  description: string;
  statusField?: string;
}

export interface HealthResult {
  id: string;
  status: ServiceStatus;
  latencyMs: number | null;
  checkedAt: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  triggerType: 'cron' | 'webhook' | 'manual';
  lastRun: string | null;
  nextRun: string | null;
  enabled: boolean;
}

export interface PipelineRun {
  id: string;
  created_at: string;
  input_data: Record<string, unknown> | null;
  status: string;
  total_cost: number | null;
  duration_ms: number | null;
}

export interface CloudHealthResult {
  product: string;
  status: string;
  response_ms: number | null;
  http_status: number | null;
  error: string | null;
  checked_at: string;
}

export interface ContentCalendarItem {
  id: string;
  title: string | null;
  topic: string | null;
  type: string;
  scheduled_date: string;
  status: string;
  product: string | null;
  notes: string | null;
}

export interface QueuedJob {
  id: string;
  topic: string;
  mode: string;
  status: string;
  priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface AIToolService {
  id: string;
  name: string;
  port: number;
  description: string;
  icon: React.ElementType;
}

export interface AIToolsHealth {
  status: string;
  service: string;
  timestamp: string;
  services?: Record<string, { status: string; port: string }>;
  recent_executions?: number;
}

export interface AgentStats {
  total: number;
  active: number;
  idle: number;
  busy: number;
  error: number;
  departments: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

export const PRODUCTS: EcosystemProduct[] = [
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

export const AI_TOOLS: AIToolService[] = [
  {
    id: 'mem0',
    name: 'Mem0 Memory',
    port: 8200,
    description: 'Long-term agent memory',
    icon: Server,
  },
  {
    id: 'browser',
    name: 'Browser-Use',
    port: 8201,
    description: 'Web automation + scraping',
    icon: Globe,
  },
  {
    id: 'video',
    name: 'ShortGPT Video',
    port: 8202,
    description: 'TTS + video generation',
    icon: Video,
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    port: 8210,
    description: 'Unified pipeline gateway',
    icon: Zap,
  },
];

export const ORCHESTRATOR_URL = 'http://localhost:8210';

export const N8N_WORKFLOWS: N8nWorkflow[] = [
  {
    id: 'wf-youtube-daily',
    name: 'YouTube Daily Pipeline',
    triggerType: 'cron',
    lastRun: null,
    nextRun: null,
    enabled: true,
  },
  {
    id: 'wf-content-seeder',
    name: 'VT Homes Content Seeder',
    triggerType: 'cron',
    lastRun: null,
    nextRun: null,
    enabled: true,
  },
  {
    id: 'wf-social-poster',
    name: 'Social Media Auto-Post',
    triggerType: 'cron',
    lastRun: null,
    nextRun: null,
    enabled: false,
  },
  {
    id: 'wf-health-monitor',
    name: 'Service Health Monitor',
    triggerType: 'cron',
    lastRun: null,
    nextRun: null,
    enabled: true,
  },
  {
    id: 'wf-backup',
    name: 'Database Backup',
    triggerType: 'cron',
    lastRun: null,
    nextRun: null,
    enabled: true,
  },
  {
    id: 'wf-webhook-invoice',
    name: 'Invoice Webhook Handler',
    triggerType: 'webhook',
    lastRun: null,
    nextRun: null,
    enabled: true,
  },
];

// ─── HEALTH CHECK UTILITY ───────────────────────────────────────────────────

export async function pingService(
  url: string,
  timeoutMs = 8000
): Promise<{ ok: boolean; latencyMs: number }> {
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

export function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    checking: 'bg-yellow-500 animate-pulse',
    unknown: 'bg-gray-400',
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

export function RelativeTime({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground text-xs">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="text-xs">just now</span>;
  if (mins < 60) return <span className="text-xs">{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span className="text-xs">{hrs}h ago</span>;
  return <span className="text-xs">{Math.floor(hrs / 24)}d ago</span>;
}
