/**
 * 🎬 YouTube Channels — Channel Selector Grid
 * 
 * Click a channel card → navigate to dedicated workspace page
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Tv, BookOpen, Brain, Sparkles, Loader2,
  CheckCircle2, Clock, FileText,
  Key, ChevronRight, Plus, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { youtubeChannelsService } from '@/services/youtube-channels.service';
import type { ChannelPlan } from '@/services/youtube-channels.service';
import { getAllRuns } from '@/services/pipeline';
import { getPool, addKey, removeKey, enableKey, disableKey, resetStats, onPoolChange, type PoolEntry } from '@/services/pipeline/api-key-pool';

// ─── STATUS CONFIG ─────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ready: { label: 'Ready to Launch', color: 'bg-green-500', icon: CheckCircle2 },
  planned: { label: 'Planned', color: 'bg-blue-500', icon: Clock },
  experimental: { label: 'Experimental', color: 'bg-purple-500', icon: Sparkles },
};

// ─── MAIN COMPONENT ────────────────────────────────────────

export default function YouTubeChannelsDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showKeyPoolDialog, setShowKeyPoolDialog] = useState(false);
  const [pool, setPool] = useState<PoolEntry[]>(getPool());

  // Subscribe to key pool changes
  useEffect(() => onPoolChange(() => setPool(getPool())), []);

  // ── Data Queries ──
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['youtube-channels', 'plans'],
    queryFn: () => youtubeChannelsService.getPlans(),
  });

  const { data: knowledgeData } = useQuery({
    queryKey: ['youtube-channels', 'knowledge'],
    queryFn: () => youtubeChannelsService.getKnowledgeStats(),
  });

  // Poll runs to detect running across channels
  const allRuns = getAllRuns();
  const runningRuns = allRuns.filter(r => r.status === 'running');
  const hasAnyRunning = runningRuns.length > 0;

  const { data: runsData } = useQuery({
    queryKey: ['youtube-channels', 'runs'],
    queryFn: () => youtubeChannelsService.getRuns(),
    refetchInterval: hasAnyRunning ? 3000 : false,
  });

  const channels = plansData?.channels || [];

  // Count total & running runs per channel
  const runsByChannel: Record<string, number> = {};
  const runningByChannel: Record<string, number> = {};
  runsData?.runs?.forEach(r => {
    if (r.channelId) {
      runsByChannel[r.channelId] = (runsByChannel[r.channelId] || 0) + 1;
      if (r.status === 'running') runningByChannel[r.channelId] = (runningByChannel[r.channelId] || 0) + 1;
    }
  });

  const activePoolCount = pool.filter(e => e.enabled).length;

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
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {knowledgeData.books} sách</span>
              <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {knowledgeData.transcripts.total} transcripts</span>
              <span className="flex items-center gap-1"><Brain className="h-4 w-4" /> {knowledgeData.voice ? '✅' : '❌'} Voice DNA</span>
            </div>
          )}
          {hasAnyRunning && (
            <Badge variant="outline" className="border-orange-500 text-orange-500 animate-pulse gap-1">
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
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{channel.avatar}</span>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              channel.status === 'ready' ? 'border-green-500 text-green-500' :
              channel.status === 'planned' ? 'border-blue-500 text-blue-500' :
              'border-purple-500 text-purple-500'
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
            <span className="font-medium" style={{ color: channel.color }}>{channel.score}/{channel.maxScore}</span>
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
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-orange-500 text-orange-500 animate-pulse">
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
