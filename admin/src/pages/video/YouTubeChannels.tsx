/**
 * 🎬 YouTube Channels — Channel Selector Grid
 *
 * Click a channel card → navigate to dedicated workspace page
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Key,
  Loader2,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Tv,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  addKey,
  disableKey,
  enableKey,
  getPool,
  hydrateFromDb as hydrateKeyPool,
  onPoolChange,
  type PoolEntry,
  removeKey,
  resetStats,
} from '@/services/pipeline/api-key-pool';
import type { ChannelPlan } from '@/services/youtube-channels.service';
import { youtubeChannelsService } from '@/services/youtube-channels.service';

// ─── STATUS CONFIG ─────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ready: { label: 'Ready to Launch', color: 'bg-green-500', icon: CheckCircle2 },
  planned: { label: 'Planned', color: 'bg-blue-500', icon: Clock },
  experimental: { label: 'Experimental', color: 'bg-purple-500', icon: Sparkles },
};

// ─── MAIN COMPONENT ────────────────────────────────────────

export default function YouTubeChannelsDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showKeyPoolDialog, setShowKeyPoolDialog] = useState(false);
  const [pool, setPool] = useState<PoolEntry[]>(getPool());

  // Hydrate key pool from Supabase, then subscribe to changes
  useEffect(() => {
    hydrateKeyPool().then(() => setPool(getPool()));
    return onPoolChange(() => setPool(getPool()));
  }, []);

  // ── Data Queries ──
  const {
    data: plansData,
    isLoading: plansLoading,
    isError: plansError,
    error: plansErrObj,
  } = useQuery({
    queryKey: ['youtube-channels', 'plans'],
    queryFn: () => youtubeChannelsService.getPlans(),
  });

  const { data: knowledgeData } = useQuery({
    queryKey: ['youtube-channels', 'knowledge'],
    queryFn: () => youtubeChannelsService.getKnowledgeStats(),
  });

  const { data: runsData } = useQuery({
    queryKey: ['youtube-channels', 'runs'],
    queryFn: () => youtubeChannelsService.getRuns(),
    refetchInterval: (query) => {
      const data = query.state.data as { runs?: { status?: string }[] } | undefined;
      const hasRunning = !!data?.runs?.some((r) => r.status === 'running');
      return hasRunning ? 3000 : false;
    },
  });

  const runningRuns = runsData?.runs?.filter((r) => r.status === 'running') || [];
  const hasAnyRunning = runningRuns.length > 0;

  const channels = plansData?.channels || [];

  // Count total & running runs per channel
  const runsByChannel: Record<string, number> = {};
  const runningByChannel: Record<string, number> = {};
  runsData?.runs?.forEach((r) => {
    if (r.channelId) {
      runsByChannel[r.channelId] = (runsByChannel[r.channelId] || 0) + 1;
      if (r.status === 'running')
        runningByChannel[r.channelId] = (runningByChannel[r.channelId] || 0) + 1;
    }
  });

  const activePoolCount = pool.filter((e) => !e.disabled).length;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Tv className="h-8 w-8 text-red-500" />
            YouTube Channels
          </h1>
          <p className="text-muted-foreground">
            5-Channel Strategy • Click a channel to open its workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          {knowledgeData && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> {knowledgeData.books} sách
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> {knowledgeData.transcripts.total} transcripts
              </span>
              <span className="flex items-center gap-1">
                <Brain className="h-4 w-4" /> {knowledgeData.voice ? '✅' : '❌'} Voice DNA
              </span>
            </div>
          )}
          {hasAnyRunning && (
            <Badge
              variant="outline"
              className="border-orange-500 text-orange-500 animate-pulse gap-1"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              {runningRuns.length} running
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowKeyPoolDialog(true)}
          >
            <Key className="h-4 w-4" />
            Key Pool
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {activePoolCount || 'env'}
            </Badge>
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── Channel Cards Grid ── */}
      {plansLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : plansError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-8 text-center space-y-3">
            <p className="font-medium text-destructive">Failed to load channels</p>
            <p className="text-sm text-muted-foreground">
              {plansErrObj instanceof Error ? plansErrObj.message : 'Unknown error'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['youtube-channels', 'plans'] })
              }
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Tv className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-medium">No channels configured</p>
            <p className="text-sm text-muted-foreground">Add channel plans to start generating.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              runsCount={runsByChannel[channel.id] || 0}
              runningCount={runningByChannel[channel.id] || 0}
              onClick={() => navigate(`/admin/youtube-channels/${channel.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── Key Pool Manager Dialog ── */}
      <Dialog open={showKeyPoolDialog} onOpenChange={setShowKeyPoolDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Pool
            </DialogTitle>
            <DialogDescription>
              Manage multiple API keys for parallel runs. Keys rotate automatically.
            </DialogDescription>
          </DialogHeader>
          <DashboardKeyPoolManager pool={pool} toast={toast} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CHANNEL CARD COMPONENT ─────────────────────────────────

function ChannelCard({
  channel,
  runsCount,
  runningCount,
  onClick,
}: {
  channel: ChannelPlan;
  runsCount: number;
  runningCount: number;
  onClick: () => void;
}) {
  const status = STATUS_MAP[channel.status] || STATUS_MAP.planned;
  const StatusIcon = status.icon;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${channel.name} workspace`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{channel.avatar}</span>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              channel.status === 'ready'
                ? 'border-green-500 text-green-500'
                : channel.status === 'planned'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-purple-500 text-purple-500'
            }`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <CardTitle className="text-lg">{channel.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{channel.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Readiness</span>
            <span className="font-medium" style={{ color: channel.color }}>
              {channel.score}/{channel.maxScore}
            </span>
          </div>
          <Progress value={(channel.score / channel.maxScore) * 100} className="h-1.5" />
        </div>

        {/* Knowledge chips */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px]">
            📚 {channel.knowledge.books}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            📝 {channel.knowledge.transcripts}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            🤖 {channel.resources.agents}
          </Badge>
          {channel.knowledge.voiceDNA && (
            <Badge variant="secondary" className="text-[10px] border-green-500/30">
              🎤 Voice DNA
            </Badge>
          )}
        </div>

        {/* Runs count + categories */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {runsCount} generations
            {runningCount > 0 && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-orange-500 text-orange-500 animate-pulse"
              >
                <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />
                {runningCount}
              </Badge>
            )}
          </span>
          <span>{channel.categories?.length || 0} categories</span>
        </div>

        {/* Action */}
        <Button
          size="sm"
          className="w-full group-hover:gap-3 transition-all"
          style={{ backgroundColor: channel.color }}
        >
          Open Workspace <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── KEY POOL MANAGER (Dashboard version) ───────────────────

const ENGINE_OPTIONS = [
  { value: 'gemini', label: 'Gemini', placeholder: 'AIzaSy...' },
  { value: 'elevenlabs', label: 'ElevenLabs', placeholder: 'sk_...' },
  { value: 'google-tts', label: 'Google Cloud TTS', placeholder: 'AIzaSy...' },
] as const;

function DashboardKeyPoolManager({
  pool,
  toast,
}: {
  pool: PoolEntry[];
  toast: ReturnType<typeof import('@/hooks/use-toast').useToast>['toast'];
}) {
  const [newEngine, setNewEngine] = useState<string>('gemini');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    const key = newKey.trim();
    if (!key) return;
    addKey(newEngine, key, newLabel.trim() || undefined);
    setNewKey('');
    setNewLabel('');
    toast({ title: 'Key added', description: `${newEngine} key added to pool` });
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex gap-2">
          <Select value={newEngine} onValueChange={setNewEngine}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENGINE_OPTIONS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="password"
            placeholder={ENGINE_OPTIONS.find((e) => e.value === newEngine)?.placeholder}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Label (optional)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newKey.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Key list by engine */}
      {ENGINE_OPTIONS.map((eng) => {
        const keys = pool.filter((e) => e.engine === eng.value);
        if (!keys.length) return null;
        return (
          <div key={eng.value} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {eng.label} ({keys.length})
            </Label>
            {keys.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center gap-2 rounded border px-2 py-1 text-xs"
              >
                <span
                  className={`h-2 w-2 rounded-full ${!entry.disabled ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="font-mono flex-1 truncate">
                  {entry.label || `...${entry.key.slice(-6)}`}
                </span>
                <span className="text-muted-foreground">{entry.usageCount}×</span>
                {entry.lastError && (
                  <span className="text-red-500 truncate max-w-[100px]">{entry.lastError}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    if (!entry.disabled) {
                      disableKey(entry.engine, entry.key);
                    } else {
                      enableKey(entry.engine, entry.key);
                    }
                  }}
                >
                  {!entry.disabled ? (
                    <ToggleRight className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-3.5 w-3.5 text-red-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeKey(entry.engine, entry.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        );
      })}

      {pool.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No keys in pool — using .env fallbacks
        </p>
      )}

      {pool.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            resetStats();
            toast({ title: 'Stats reset' });
          }}
        >
          Reset All Stats
        </Button>
      )}
    </div>
  );
}
