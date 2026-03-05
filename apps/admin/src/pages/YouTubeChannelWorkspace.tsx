/**
 * 🎬 YouTube Channel Workspace — Dedicated per-channel generation workspace
 * 
 * Full-screen workspace for a single channel with clear workflow:
 * Input → Pipeline → Results
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Play, BookOpen, Brain, Sparkles, Loader2,
  CheckCircle2, XCircle, Clock, Zap, Eye, FileText,
  Copy, RefreshCw, Search, ChevronRight, ExternalLink,
  Layers, Key, ArrowLeft, Tv, ImageIcon,
} from 'lucide-react';
import { youtubeChannelsService } from '@/services/youtube-channels.service';
import type { ChannelPlan, GenerateRequest, GenerationRun } from '@/services/youtube-channels.service';
import PipelineRoadmap, { type PipelineConfig } from '@/components/youtube/PipelineRoadmap';

// ─── MAIN COMPONENT ────────────────────────────────────────

export default function YouTubeChannelWorkspace() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Persisted State (per channel) ──
  const storageKey = `yt-ws-${channelId}`;
  const s = (() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  })();

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [topic, setTopic] = useState(s.topic || '');
  const [transcript, setTranscript] = useState(s.transcript || '');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mode, setMode] = useState<'topic' | 'transcript'>(s.mode || 'topic');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [activeTab, setActiveTab] = useState(s.activeTab || 'generate');

  // ── Fetch channel data ──
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['youtube-channels', 'plans'],
    queryFn: () => youtubeChannelsService.getPlans(),
  });

  const channel = plansData?.channels?.find(c => c.id === channelId) || null;

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

  // ── Persist state ──
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ topic, transcript, mode, activeTab }));
  }, [topic, transcript, mode, activeTab, storageKey]);

  // ── Debounce transcript search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(transcriptSearch), 300);
    return () => clearTimeout(timer);
  }, [transcriptSearch]);

  // ── Data Queries ──
  const { data: knowledgeData } = useQuery({
    queryKey: ['youtube-channels', 'knowledge'],
    queryFn: () => youtubeChannelsService.getKnowledgeStats(),
  });

  // Hydrate saved runs from Supabase on first load, then poll local map
  const { data: runsData, refetch: refetchRuns } = useQuery({
    queryKey: ['youtube-channels', 'runs', channelId],
    queryFn: async () => {
      // On first call, hydrate from DB; subsequent polls just read the in-memory map
      if (channelId) await youtubeChannelsService.hydrateChannel(channelId);
      return youtubeChannelsService.getRuns();
    },
    refetchInterval: activeRunId ? 3000 : false,
  });

  const { data: transcriptsData } = useQuery({
    queryKey: ['youtube-channels', 'transcripts', debouncedSearch],
    queryFn: () => youtubeChannelsService.searchTranscripts(debouncedSearch, 30),
    enabled: mode === 'transcript',
  });

  // ── Poll active run ──
  const { data: activeRun } = useQuery({
    queryKey: ['youtube-channels', 'run', activeRunId],
    queryFn: () => activeRunId ? youtubeChannelsService.getRunStatus(activeRunId) : null,
    enabled: !!activeRunId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (activeRun && (activeRun.status === 'completed' || activeRun.status === 'failed' || activeRun.status === 'interrupted')) {
      if (activeRun.status === 'completed') {
        toast({ title: '✅ Generation Complete', description: 'Script + Storyboard ready!' });
        setActiveTab('results');
      } else if (activeRun.status === 'interrupted') {
        toast({ title: '⚠️ Pipeline Interrupted', description: 'Bấm Resume để tiếp tục.', variant: 'destructive' });
      } else {
        toast({ title: '❌ Generation Failed', description: activeRun.error || 'Check logs', variant: 'destructive' });
      }
      queryClient.invalidateQueries({ queryKey: ['youtube-channels', 'runs'] });
    }
  }, [activeRun?.status, toast, queryClient]);

  // ── Generate Mutation ──
  const generateMut = useMutation({
    mutationFn: (req: GenerateRequest) => youtubeChannelsService.generate(req),
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      toast({ title: '🚀 Generation Started', description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // ── Single Step Mutation ──
  const stepMut = useMutation({
    mutationFn: ({ step, req }: { step: string; req: GenerateRequest }) =>
      youtubeChannelsService.generateStep(step, req),
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      toast({ title: '🔧 Step Started', description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handlePipelineRun = (pipelineConfig: PipelineConfig) => {
    if (!channel) return;
    const req: GenerateRequest = {
      channelId: channel.id,
      scenes: pipelineConfig.storyboard.scenes,
      duration: pipelineConfig.storyboard.duration,
      style: pipelineConfig.storyboard.style,
      scriptOnly: !pipelineConfig.storyboard.enabled,
      storyboardOnly: !pipelineConfig.scriptWriter.enabled,
      model: pipelineConfig.scriptWriter.model,
      storyboardModel: pipelineConfig.storyboard.model,
      tone: pipelineConfig.scriptWriter.tone,
      customPrompt: pipelineConfig.scriptWriter.customPrompt || undefined,
      storyboardPrompt: pipelineConfig.storyboard.customPrompt || undefined,
      wordTarget: pipelineConfig.scriptWriter.wordTarget,
      aspectRatio: pipelineConfig.storyboard.aspectRatio,
      visualIdentity: pipelineConfig.storyboard.visualIdentity,
      imageGenEnabled: pipelineConfig.imageGen.enabled,
      imageGenProvider: pipelineConfig.imageGen.provider,
      imageGenQuality: pipelineConfig.imageGen.quality,
      voiceoverEnabled: pipelineConfig.voiceover.enabled,
      voiceoverEngine: pipelineConfig.voiceover.engine,
      voiceoverVoice: pipelineConfig.voiceover.voice,
      voiceoverSpeed: pipelineConfig.voiceover.speed,
    };
    if (mode === 'topic' && topic.trim()) {
      req.topic = topic.trim();
    } else if (mode === 'transcript' && transcript) {
      req.transcript = transcript;
    } else if (activeRun?.input?.topic) {
      req.topic = activeRun.input.topic;
    } else if (activeRun?.input?.transcript) {
      req.transcript = activeRun.input.transcript;
    } else if (channelRuns[0]?.input?.topic) {
      req.topic = channelRuns[0].input.topic;
    } else if (channelRuns[0]?.input?.transcript) {
      req.transcript = channelRuns[0].input.transcript;
    } else {
      toast({ title: 'Missing Input', description: 'Enter a topic or select a transcript', variant: 'destructive' });
      return;
    }
    generateMut.mutate(req);
  };

  const handlePipelineStepRun = (step: string, pipelineConfig: PipelineConfig) => {
    if (!channel) return;
    const req: GenerateRequest = {
      channelId: channel.id,
      model: pipelineConfig.scriptWriter.model,
      storyboardModel: pipelineConfig.storyboard.model,
      tone: pipelineConfig.scriptWriter.tone,
      customPrompt: pipelineConfig.scriptWriter.customPrompt || undefined,
      storyboardPrompt: pipelineConfig.storyboard.customPrompt || undefined,
      scenes: pipelineConfig.storyboard.scenes,
      duration: pipelineConfig.storyboard.duration,
      style: pipelineConfig.storyboard.style,
      wordTarget: pipelineConfig.scriptWriter.wordTarget,
      aspectRatio: pipelineConfig.storyboard.aspectRatio,
      visualIdentity: pipelineConfig.storyboard.visualIdentity,
      imageGenEnabled: step === 'imageGen' ? true : pipelineConfig.imageGen.enabled,
      imageGenProvider: pipelineConfig.imageGen.provider,
      imageGenQuality: pipelineConfig.imageGen.quality,
      voiceoverEnabled: step === 'voiceover' ? true : pipelineConfig.voiceover.enabled,
      voiceoverEngine: pipelineConfig.voiceover.engine,
      voiceoverVoice: pipelineConfig.voiceover.voice,
      voiceoverSpeed: pipelineConfig.voiceover.speed,
    };
    if (mode === 'topic' && topic.trim()) {
      req.topic = topic.trim();
    } else if (mode === 'transcript' && transcript) {
      req.transcript = transcript;
    } else if (activeRun?.input?.topic) {
      req.topic = activeRun.input.topic;
    } else if (activeRun?.input?.transcript) {
      req.transcript = activeRun.input.transcript;
    } else if (channelRuns[0]?.input?.topic) {
      req.topic = channelRuns[0].input.topic;
    } else if (channelRuns[0]?.input?.transcript) {
      req.transcript = channelRuns[0].input.transcript;
    } else {
      toast({ title: 'Missing Input', description: 'Enter a topic or select a transcript', variant: 'destructive' });
      return;
    }
    stepMut.mutate({ step, req });
  };

  // ── Resume Mutation ──
  const resumeMut = useMutation({
    mutationFn: () => {
      if (!activeRunId) throw new Error('No active run to resume');
      return youtubeChannelsService.resumeRun(activeRunId);
    },
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      toast({ title: '🔄 Pipeline Resumed', description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: 'Resume Failed', description: err.message, variant: 'destructive' });
    },
  });

  // Filter runs for this channel only
  const channelRuns = runsData?.runs?.filter(r => r.channelId === channelId) || [];

  // ── Loading / Not Found ──
  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Channel not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/youtube-channels')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Channels
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* ── Header with channel identity ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/youtube-channels">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl border"
            style={{ borderColor: channel.color + '40', background: channel.bgGradient ? undefined : channel.color + '08' }}
          >
            <span className="text-4xl">{channel.avatar}</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {channel.name}
              </h1>
              <p className="text-sm text-muted-foreground">{channel.tagline}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${
              channel.status === 'ready' ? 'border-green-500 text-green-500' :
              channel.status === 'planned' ? 'border-blue-500 text-blue-500' :
              'border-purple-500 text-purple-500'
            }`}
          >
            {channel.status === 'ready' ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
             channel.status === 'planned' ? <Clock className="h-3 w-3 mr-1" /> :
             <Sparkles className="h-3 w-3 mr-1" />}
            {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {/* Knowledge stats */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">📚 {channel.knowledge.books}</span>
            <span className="flex items-center gap-1">📝 {channel.knowledge.transcripts}</span>
            <span className="flex items-center gap-1">🤖 {channel.resources.agents}</span>
            {channel.knowledge.voiceDNA && (
              <span className="flex items-center gap-1 text-green-500">🎤 DNA</span>
            )}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs">
              <span className="text-muted-foreground">Score</span>
              <span className="font-bold" style={{ color: channel.color }}>{channel.score}/{channel.maxScore}</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowApiKeyDialog(true)}>
              <Key className="h-4 w-4" />
              API Key
              {apiKeyStatus && (
                <span className={`h-2 w-2 rounded-full ${apiKeyStatus.hasKey ? 'bg-green-500' : 'bg-red-500'}`} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Active Run Banner ── */}
      {activeRun && activeRun.status === 'running' && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <div>
                  <p className="font-medium">Generating: {activeRun.input.topic || activeRun.input.transcript}</p>
                  <p className="text-sm text-muted-foreground">{activeRun.logs.length} log entries</p>
                </div>
              </div>
              <Badge variant="outline" className="animate-pulse">RUNNING</Badge>
            </div>
            {activeRun.logs.length > 0 && (
              <div className="mt-3 rounded bg-black/20 p-2 font-mono text-xs max-h-24 overflow-y-auto">
                {activeRun.logs.slice(-5).map((log, i) => (
                  <div key={i} className={log.level === 'error' ? 'text-red-400' : 'text-green-400'}>
                    {log.msg}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Main Workspace: 2-column layout ── */}
      <div className="grid grid-cols-12 gap-6" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {/* Left sidebar: Input Source */}
        <div className="col-span-3 space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                Input Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Mode */}
              <div className="flex gap-2">
                <Button
                  variant={mode === 'topic' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMode('topic')}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Topic
                </Button>
                <Button
                  variant={mode === 'transcript' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMode('transcript')}
                >
                  <FileText className="h-3 w-3 mr-1" /> Transcript
                </Button>
              </div>

              {mode === 'topic' ? (
                <div className="space-y-2">
                  <Label className="text-xs">Topic</Label>
                  <Textarea
                    placeholder="e.g. Bí mật thẻ tín dụng — đòn bẩy hay bẫy nợ?"
                    className="resize-none h-28 text-sm"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1">
                    {channel.sampleTopics.map((t, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 text-[10px]"
                        onClick={() => setTopic(t)}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Search Transcripts</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search..."
                      className="h-8 text-xs"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Search className="h-3 w-3" />
                    </Button>
                  </div>
                  {transcriptsData && (
                    <ScrollArea className="h-52 border rounded-md p-2">
                      {transcriptsData.transcripts.map((t) => (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted text-xs ${
                            transcript === t.id ? 'bg-primary/10 border border-primary/30' : ''
                          }`}
                          onClick={() => setTranscript(t.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{t.title}</p>
                            <p className="text-muted-foreground">
                              {t.source} • {t.viewCount?.toLocaleString() || '?'} views
                            </p>
                          </div>
                          {transcript === t.id && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Playlists overview */}
              {channel.playlists.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Playlists</Label>
                    {channel.playlists.map((pl, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{pl.icon} {pl.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{pl.episodes} ep</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Pipeline + Results */}
        <div className="col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="generate" className="gap-2">
                <Zap className="h-4 w-4" /> Pipeline
              </TabsTrigger>
              <TabsTrigger value="runs" className="gap-2">
                <Layers className="h-4 w-4" /> History ({channelRuns.length})
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <Eye className="h-4 w-4" /> Results
              </TabsTrigger>
            </TabsList>

            {/* ── Generate Tab ── */}
            <TabsContent value="generate">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Generation Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cấu hình từng bước trước khi chạy. Bật/tắt step và tùy chỉnh settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PipelineRoadmap
                    channelId={channel.id}
                    channelStyle={channel.style}
                    onRun={handlePipelineRun}
                    onRunStep={handlePipelineStepRun}
                    onResume={() => resumeMut.mutate()}
                    isRunning={generateMut.isPending || stepMut.isPending || resumeMut.isPending}
                    activeRun={activeRun ? { status: activeRun.status, logs: activeRun.logs, error: activeRun.error, result: activeRun.result, completedSteps: activeRun.completedSteps, pipelineSteps: activeRun.pipelineSteps } : undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── History Tab ── */}
            <TabsContent value="runs">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Generation History</CardTitle>
                    <CardDescription>{channelRuns.length} runs for this channel</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchRuns()}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {channelRuns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No runs yet for {channel.name}. Start a generation!</p>
                    ) : (
                      channelRuns.map((run) => (
                        <RunCard
                          key={run.id}
                          run={run}
                          onView={() => { setActiveRunId(run.id); setActiveTab('results'); }}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Results Tab ── */}
            <TabsContent value="results">
              {activeRun && activeRun.status === 'completed' && activeRun.result ? (
                <ResultsView run={activeRun} onRunImageGen={() => {
                  handlePipelineStepRun('imageGen', {
                    scriptWriter: { enabled: true, model: 'gemini-2.0-flash', tone: 'engaging', wordTarget: 600, customPrompt: '' },
                    storyboard: { enabled: true, model: 'hailuo-2.3', style: 'dark-cinematic', scenes: 5, duration: '10-15min', aspectRatio: '16:9', visualIdentity: {} as never, customPrompt: '' },
                    imageGen: { enabled: true, provider: 'gemini', quality: 'standard', negativePrompt: 'text, watermark, logo' },
                    voiceover: { enabled: false, engine: 'gemini-tts', voice: 'Kore', speed: 1.0 },
                    assembly: { enabled: false, format: 'mp4-1080p', transitions: 'crossfade', bgMusic: true },
                  });
                }} isGenerating={stepMut.isPending} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Run a generation to see results here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

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

// ─── RUN CARD ─────────────────────────────────────────────

function RunCard({ run, onView }: { run: GenerationRun; onView: () => void }) {
  const statusColor = run.status === 'completed' ? 'text-green-500' : run.status === 'failed' ? 'text-red-500' : 'text-blue-500';
  const StatusIcon = run.status === 'completed' ? CheckCircle2 : run.status === 'failed' ? XCircle : Loader2;
  const stepIcons: Record<string, string> = { scriptWriter: '✍️', storyboard: '🎬', imageGen: '🖼️', voiceover: '🎤', assembly: '🎥' };
  const stepsLabel = run.completedSteps?.length
    ? run.completedSteps.map(s => stepIcons[s] || s).join(' → ')
    : run.pipelineSteps?.map(s => stepIcons[s] || s).join(' → ') || '';

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-center gap-3">
        <StatusIcon className={`h-5 w-5 ${statusColor} ${run.status === 'running' ? 'animate-spin' : ''}`} />
        <div>
          <p className="text-sm font-medium">{run.input?.topic || run.input?.transcript || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(run.startedAt).toLocaleString('vi-VN')}
            {run.durationMs ? ` • ${(run.durationMs / 1000).toFixed(1)}s` : ''}
            {stepsLabel ? ` • ${stepsLabel}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(run.result || run.hasResult) && <Badge variant="outline" className="text-green-500 text-xs">Has Output</Badge>}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─── RESULTS VIEW ─────────────────────────────────────────

function ResultsView({ run, onRunImageGen, isGenerating }: { run: GenerationRun; onRunImageGen?: () => void; isGenerating?: boolean }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const result = run.result;
  if (!result) return null;

  const scriptJson = result.files?.['script.json'] as Record<string, unknown> | undefined;
  const scriptTxt = result.files?.['script.txt'] as string | undefined;
  const storyboardMd = result.files?.['storyboard.md'] as string | undefined;
  const promptsTxt = result.files?.['prompts.txt'] as string | undefined;
  const storyboardJson = result.files?.['storyboard.json'] as { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[] } | undefined;
  const imagesJson = result.files?.['images.json'] as { images?: { scene: number; url: string; prompt: string }[]; successCount?: number; totalScenes?: number } | undefined;
  const imageMap = new Map<number, string>();
  if (imagesJson?.images) {
    for (const img of imagesJson.images) imageMap.set(img.scene, img.url);
  }

  const stats = scriptJson?.stats as { totalWords?: number; estimatedMinutes?: string; sections?: number } | undefined;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{stats.totalWords}</p>
              <p className="text-xs text-muted-foreground">Words</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{stats.estimatedMinutes}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{stats.sections}</p>
              <p className="text-xs text-muted-foreground">Sections</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{storyboardJson?.scenes?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Scenes</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="script">
        <TabsList>
          <TabsTrigger value="script">📝 Script</TabsTrigger>
          <TabsTrigger value="storyboard">🎬 Storyboard</TabsTrigger>
          <TabsTrigger value="prompts">📋 Prompts</TabsTrigger>
          <TabsTrigger value="logs">📊 Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Generated Script</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scriptTxt && copyToClipboard(scriptTxt, 'script')}
              >
                {copiedField === 'script' ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedField === 'script' ? 'Copied!' : 'Copy All'}
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {scriptTxt || 'No script generated'}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storyboard">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Hailuo 2.3 Storyboard</CardTitle>
              <div className="flex items-center gap-2">
                {imagesJson?.images && imagesJson.images.length > 0 && (
                  <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                    🖼️ {imagesJson.successCount || imagesJson.images.length}/{imagesJson.totalScenes || storyboardJson?.scenes?.length || '?'} ảnh
                  </Badge>
                )}
                {onRunImageGen && storyboardJson?.scenes && storyboardJson.scenes.length > 0 && (
                  <Button
                    variant={imagesJson?.images ? 'outline' : 'default'}
                    size="sm"
                    onClick={onRunImageGen}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang tạo...</>
                    ) : imagesJson?.images ? (
                      <><RefreshCw className="h-4 w-4 mr-1" /> Re-gen Images</>
                    ) : (
                      <><ImageIcon className="h-4 w-4 mr-1" /> Generate Images</>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => storyboardMd && copyToClipboard(storyboardMd, 'storyboard')}
                >
                  {copiedField === 'storyboard' ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedField === 'storyboard' ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {storyboardJson?.scenes ? (
                <div className="space-y-3">
                  {storyboardJson.scenes.map((scene, i) => {
                    const imgUrl = imageMap.get(scene.scene);
                    return (
                    <div key={i} className="p-3 rounded-lg border hover:bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Scene {scene.scene}</Badge>
                          {imgUrl && <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">✅ Image</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{scene.motion}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{scene.transition}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{scene.dialogue}"</p>
                      <div className="flex items-start gap-2">
                        <code className="text-xs bg-primary/10 p-2 rounded flex-1">{scene.prompt}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => copyToClipboard(scene.prompt, `scene-${i}`)}
                        >
                          {copiedField === `scene-${i}` ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {imgUrl && (
                        <div className="mt-2">
                          <img
                            src={imgUrl}
                            alt={`Scene ${scene.scene}`}
                            className="w-full max-w-[400px] aspect-video object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <pre className="whitespace-pre-wrap text-sm">{storyboardMd || 'No storyboard generated'}</pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Copy-Paste Prompts</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => promptsTxt && copyToClipboard(promptsTxt, 'prompts')}
              >
                {copiedField === 'prompts' ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedField === 'prompts' ? 'Copied!' : 'Copy All'}
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">{promptsTxt || 'No prompts generated'}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="font-mono text-xs space-y-0.5">
                  {run.logs.map((log, i) => (
                    <div key={i} className={`py-0.5 ${log.level === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                      <span className="text-muted-foreground mr-2">
                        {new Date(log.t).toLocaleTimeString('vi-VN')}
                      </span>
                      {log.msg}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
