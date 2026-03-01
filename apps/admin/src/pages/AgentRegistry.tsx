/**
 * 🏢 Agent Registry — LIVE DATA from agent_registry (45 agents, 9 departments)
 * Fetches real-time data from Supabase agent_registry table.
 *
 * @version 2.0.0 — Wired to agent_registry
 * @date 2026-02-25
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Activity,
  Bot,
  Building2,
  Clock,
  DollarSign,
  Flame,
  GraduationCap,
  Home,
  Megaphone,
  Music,
  Pause,
  Play,
  RefreshCw,
  Search,
  Server,
  ShoppingCart,
  Sparkles,
  Trophy,
  Video,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useRegistryAgents, useAgentStats, useRecentExecutions, useUpdateAgentStatus, useStartExecution, useAgentRealtime } from '@/hooks/use-agent-company';
import type { RegistryAgent, Department, AgentStatus } from '@/services/agent-company.service';
import { useToast } from '@/hooks/use-toast';
import { AgentChatDialog } from '@/components/agent-center/AgentChatDialog';

// ─── Department Metadata ─────────────────────────────────────────────────────

const DEPARTMENT_META: Record<Department, {
  label: string;
  color: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  content: { label: 'Content', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <Video className="h-4 w-4 text-blue-400" />, variant: 'outline' },
  marketing: { label: 'Marketing', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: <Megaphone className="h-4 w-4 text-purple-400" />, variant: 'outline' },
  sales: { label: 'Sales', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: <ShoppingCart className="h-4 w-4 text-emerald-400" />, variant: 'outline' },
  entertainment: { label: 'Entertainment', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30', icon: <Music className="h-4 w-4 text-pink-400" />, variant: 'outline' },
  infrastructure: { label: 'Infrastructure', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: <Server className="h-4 w-4 text-amber-400" />, variant: 'outline' },
  operations: { label: 'Operations', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: <Building2 className="h-4 w-4 text-cyan-400" />, variant: 'outline' },
  sports: { label: 'Sports', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: <Trophy className="h-4 w-4 text-orange-400" />, variant: 'outline' },
  realestate: { label: 'Real Estate', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', icon: <Home className="h-4 w-4 text-teal-400" />, variant: 'outline' },
  education: { label: 'Education', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: <GraduationCap className="h-4 w-4 text-indigo-400" />, variant: 'outline' },
};

const STATUS_META: Record<AgentStatus, { label: string; dot: string; badgeClass: string }> = {
  active: { label: 'Active', dot: 'bg-green-400 animate-pulse', badgeClass: 'bg-green-500/10 text-green-400 border-green-500/30' },
  idle: { label: 'Idle', dot: 'bg-yellow-400', badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  busy: { label: 'Busy', dot: 'bg-blue-400 animate-pulse', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  error: { label: 'Error', dot: 'bg-red-400 animate-pulse', badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30' },
  disabled: { label: 'Disabled', dot: 'bg-zinc-500', badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' },
  maintenance: { label: 'Maintenance', dot: 'bg-orange-400', badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCost(cost: number): string {
  if (!cost || cost === 0) return 'Free';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatNumber(n: number): string {
  return (n || 0).toLocaleString('en-US');
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent, loading }: {
  label: string; value: string; icon: React.ElementType; accent: string; loading?: boolean;
}) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {loading ? <Skeleton className="h-7 w-16 mb-1" /> : <p className="text-2xl font-bold tracking-tight">{value}</p>}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentCard({ agent, onRun, onToggle }: {
  agent: RegistryAgent; onRun: (a: RegistryAgent) => void; onToggle: (a: RegistryAgent) => void;
}) {
  const dept = DEPARTMENT_META[agent.department] || DEPARTMENT_META.content;
  const st = STATUS_META[agent.status] || STATUS_META.idle;

  return (
    <Card className="group relative border-border/50 bg-card/80 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute right-3 top-3">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${st.dot}`} />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/50 text-lg group-hover:scale-110 transition-transform">
            {agent.emoji || '🤖'}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight truncate">{agent.name}</CardTitle>
            <CardDescription className="mt-0.5 text-xs leading-snug">{agent.description || agent.role}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={dept.variant} className={`text-[10px] px-1.5 py-0 ${dept.color}`}>{dept.label}</Badge>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${st.badgeClass}`}>{st.label}</Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">{agent.model}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs font-medium tabular-nums">{formatNumber(agent.total_executions)}</p>
            <p className="text-[10px] text-muted-foreground">Runs</p>
          </div>
          <div>
            <p className="text-xs font-medium tabular-nums">{formatRelativeTime(agent.last_active)}</p>
            <p className="text-[10px] text-muted-foreground">Last active</p>
          </div>
          <div>
            <p className="text-xs font-medium tabular-nums">{formatCost(agent.cost_per_run)}</p>
            <p className="text-[10px] text-muted-foreground">Cost/run</p>
          </div>
        </div>
        {/* Success Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Success rate</span>
            <span className="font-medium">{agent.success_rate}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${agent.success_rate >= 90 ? 'bg-green-400' : agent.success_rate >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${agent.success_rate}%` }} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="default" className="h-7 flex-1 gap-1 text-xs" onClick={() => onRun(agent)} disabled={agent.status === 'disabled' || agent.status === 'maintenance'}>
                  <Play className="h-3 w-3" /> Run
                </Button>
              </TooltipTrigger>
              <TooltipContent>Trigger a manual run</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-xs" onClick={() => onToggle(agent)}>
                  {agent.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {agent.status === 'active' ? 'Pause' : 'Activate'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{agent.status === 'active' ? 'Pause this agent' : 'Activate this agent'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentSection({ department, agents, onRun, onToggle }: {
  department: Department; agents: RegistryAgent[]; onRun: (a: RegistryAgent) => void; onToggle: (a: RegistryAgent) => void;
}) {
  const meta = DEPARTMENT_META[department];
  if (!meta || agents.length === 0) return null;
  const activeCount = agents.filter((a) => a.status === 'active').length;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {meta.icon}
        <span>{meta.label} Department</span>
        <Badge variant="secondary" className="ml-1 text-[10px]">{agents.length}</Badge>
        {activeCount > 0 && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/30">{activeCount} active</Badge>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((a) => <AgentCard key={a.id} agent={a} onRun={onRun} onToggle={onToggle} />)}
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-3"><div className="flex items-start gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></CardHeader>
      <CardContent className="space-y-3 pt-0"><div className="flex gap-1.5"><Skeleton className="h-4 w-16 rounded-full" /><Skeleton className="h-4 w-12 rounded-full" /></div><div className="grid grid-cols-3 gap-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const DEPT_ORDER: Department[] = ['content','marketing','sales','entertainment','infrastructure','operations','sports','realestate','education'];

const AgentRegistry = () => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<Department | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AgentStatus | 'all'>('all');
  const [chatAgent, setChatAgent] = useState<RegistryAgent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { toast } = useToast();

  const { data: agents = [], isLoading: agentsLoading, refetch } = useRegistryAgents({
    department: filterDept !== 'all' ? filterDept as Department : undefined,
    status: filterStatus !== 'all' ? filterStatus as AgentStatus : undefined,
    search: search || undefined,
  });
  const { data: stats, isLoading: statsLoading } = useAgentStats();
  const { data: executions = [] } = useRecentExecutions(20);
  const updateStatus = useUpdateAgentStatus();
  const startExecution = useStartExecution();
  useAgentRealtime();

  const groupedAgents = DEPT_ORDER.reduce((acc, dept) => {
    acc[dept] = agents.filter((a) => a.department === dept);
    return acc;
  }, {} as Record<Department, RegistryAgent[]>);

  // Known agent-runner codenames (have real LLM prompts in the Edge Function)
  const RUNNER_AGENTS = new Set([
    'marketing-seo-specialist', 'marketing-copywriter', 'marketing-email-wizard',
    'marketing-lead-qualifier', 'marketing-cro-optimizer', 'marketing-brand-guardian',
    'marketing-persona-builder', 'marketing-growth-hacker', 'sales-blog-writer',
    'sales-email-followup', 'sales-social-manager', 'sales-data-analyzer', 'ent-lyblack',
    'content-lyblack-writer', 'content-lyblack-editor', 'content-lyblack-summarizer',
    'ops-revenue-strategist', 'ops-content-scheduler',
  ]);

  const handleInteract = (agent: RegistryAgent) => {
    // Agents with LLM prompts in agent-runner → open chat dialog
    if (RUNNER_AGENTS.has(agent.codename)) {
      setChatAgent(agent);
      setChatOpen(true);
    } else {
      // Fallback: silent execution trigger for other agents
      startExecution.mutate({ agentId: agent.id, action: 'manual_trigger' }, {
        onSuccess: () => toast({ title: `▶️ ${agent.name}`, description: 'Execution started' }),
        onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
      });
    }
  };

  const handleToggle = (agent: RegistryAgent) => {
    const newStatus: AgentStatus = agent.status === 'active' ? 'idle' : 'active';
    updateStatus.mutate({ id: agent.id, status: newStatus }, {
      onSuccess: () => toast({ title: `${newStatus === 'active' ? '✅' : '⏸️'} ${agent.name}`, description: `Status → ${newStatus}` }),
      onError: (err) => toast({ title: 'Error', description: String(err), variant: 'destructive' }),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Agent Registry</h1>
            <Badge variant="outline" className="ml-2 text-xs"><Flame className="mr-1 h-3 w-3 text-orange-400" />LongSang AI Empire</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>
        </div>
        <p className="text-sm text-muted-foreground">45 AI agents across 9 departments — real-time from production database.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Agents" value={String(stats?.total ?? '—')} icon={Bot} accent="bg-primary/10 text-primary" loading={statsLoading} />
        <StatCard label="Active Now" value={String(stats?.active ?? '—')} icon={Activity} accent="bg-green-500/10 text-green-400" loading={statsLoading} />
        <StatCard label="Idle" value={String(stats?.idle ?? '—')} icon={Clock} accent="bg-yellow-500/10 text-yellow-400" loading={statsLoading} />
        <StatCard label="Total Executions" value={formatNumber(stats?.totalExecutions ?? 0)} icon={Zap} accent="bg-blue-500/10 text-blue-400" loading={statsLoading} />
        <StatCard label="Total Cost" value={formatCost(stats?.totalCost ?? 0)} icon={DollarSign} accent="bg-amber-500/10 text-amber-400" loading={statsLoading} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search agents..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value as Department | 'all')} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
          <option value="all">All Departments</option>
          {DEPT_ORDER.map((d) => <option key={d} value={d}>{DEPARTMENT_META[d].label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AgentStatus | 'all')} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="idle">Idle</option>
          <option value="busy">Busy</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Agent Grid */}
      {agentsLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <AgentCardSkeleton key={i} />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Search className="h-8 w-8" />
          <p className="text-sm">No agents match your filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {DEPT_ORDER.map((dept) => groupedAgents[dept]?.length > 0 ? (
            <DepartmentSection key={dept} department={dept} agents={groupedAgents[dept]} onRun={handleRun} onToggle={handleToggle} />
          ) : null)}
        </div>
      )}

      <Separator />

      {/* Execution Timeline */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Clock className="h-4 w-4" /><span>Recent Executions</span>
          <Badge variant="secondary" className="ml-1 text-[10px]">{executions.length}</Badge>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <ScrollArea className="h-[360px]">
            {executions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Sparkles className="h-8 w-8" /><p className="text-sm">No executions yet — trigger an agent to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {executions.map((exec) => (
                  <div key={exec.id} className="flex items-start gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                    <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground pt-0.5">
                      {new Date(exec.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${exec.status === 'success' ? 'bg-green-400' : exec.status === 'failed' ? 'bg-red-400' : 'bg-blue-400 animate-pulse'}`} />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{exec.action}</span>
                      {exec.error_message && <span className="ml-2 text-xs text-red-400">— {exec.error_message}</span>}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{exec.cost_usd > 0 ? formatCost(exec.cost_usd) : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Agent Chat Dialog */}
      <AgentChatDialog agent={chatAgent} open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default AgentRegistry;
