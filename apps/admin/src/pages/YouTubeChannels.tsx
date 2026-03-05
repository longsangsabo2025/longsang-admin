/**
 * 🎬 YouTube Channels — Channel Selector Grid
 * 
 * Click a channel card → navigate to dedicated workspace page
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Tv, BookOpen, Brain, Sparkles, Loader2,
  CheckCircle2, Clock, FileText, ExternalLink,
  Key, ChevronRight,
} from 'lucide-react';
import { youtubeChannelsService } from '@/services/youtube-channels.service';
import type { ChannelPlan } from '@/services/youtube-channels.service';

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
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  // ── API Key ──
  const { data: apiKeyStatus, refetch: refetchApiKey } = useQuery({
    queryKey: ['youtube-channels', 'api-key-status'],
    queryFn: () => youtubeChannelsService.getApiKeyStatus(),
    retry: false,
    meta: { errorMessage: false },
  });

  const apiKeyMut = useMutation({
    mutationFn: (key: string) => youtubeChannelsService.updateApiKey(key),
    onSuccess: (data) => {
      toast({ title: '✅ API Key Updated', description: data.message });
      setShowApiKeyDialog(false);
      setNewApiKey('');
      refetchApiKey();
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // ── Data Queries ──
  const { data: plansData, isLoading: plansLoading } = useQuery({
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
  });

  const channels = plansData?.channels || [];

  // Count runs per channel
  const runsByChannel: Record<string, number> = {};
  runsData?.runs?.forEach(r => {
    if (r.channelId) runsByChannel[r.channelId] = (runsByChannel[r.channelId] || 0) + 1;
  });

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
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowApiKeyDialog(true)}
          >
            <Key className="h-4 w-4" />
            API Key
            {apiKeyStatus && (
              <span className={`h-2 w-2 rounded-full ${apiKeyStatus.hasKey ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
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
              onClick={() => navigate(`/admin/youtube-channels/${channel.id}`)}
            />
          ))}
        </div>
      )}

      {/* ── API Key Dialog ── */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Google AI API Key
            </DialogTitle>
            <DialogDescription>
              Required for script generation with Gemini. Get your key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center gap-1"
              >
                Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className={`h-3 w-3 rounded-full ${apiKeyStatus?.hasKey ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {apiKeyStatus?.hasKey ? 'Key configured' : 'No key configured'}
                </p>
                {apiKeyStatus?.maskedKey && (
                  <p className="text-xs text-muted-foreground font-mono">{apiKeyStatus.maskedKey}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">New API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="AIzaSy..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newApiKey.trim() || apiKeyMut.isPending}
                onClick={() => apiKeyMut.mutate(newApiKey)}
              >
                {apiKeyMut.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  'Save Key'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CHANNEL CARD COMPONENT ─────────────────────────────────

function ChannelCard({
  channel,
  runsCount,
  onClick,
}: {
  channel: ChannelPlan;
  runsCount: number;
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
          <span>{runsCount} generations</span>
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
