/**
 * 🎬 YouTube Channel Workspace — Dedicated per-channel generation workspace
 * 
 * Full-screen workspace for a single channel with clear workflow:
 * Input → Pipeline → Results
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Play, BookOpen, Brain, Sparkles, Loader2,
  CheckCircle2, XCircle, Clock, Zap, Eye, FileText,
  Copy, RefreshCw, Search, ChevronRight, ChevronDown, ExternalLink,
  Layers, Key, ArrowLeft, Tv, ImageIcon, Mic, Volume2,
  Plus, Trash2, ToggleLeft, ToggleRight, Film, Download,
} from 'lucide-react';
import { youtubeChannelsService } from '@/services/youtube-channels.service';
import type { ChannelPlan, GenerateRequest, GenerationRun } from '@/services/youtube-channels.service';
import PipelineRoadmap, { type PipelineConfig } from '@/components/youtube/PipelineRoadmap';
import SmartAudio from '@/components/youtube/SmartAudio';
import { getPool, addKey, removeKey, enableKey, disableKey, resetStats, onPoolChange, type PoolEntry } from '@/services/pipeline/api-key-pool';
import { getRunningIdsForChannel } from '@/services/pipeline';
import { regenerateSingleClip } from '@/services/pipeline/voiceover.agent';

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
  const [runningRunIds, setRunningRunIds] = useState<Set<string>>(new Set());
  const [topic, setTopic] = useState(s.topic || '');
  const [transcript, setTranscript] = useState(s.transcript || '');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mode, setMode] = useState<'topic' | 'transcript'>(s.mode || 'topic');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchTopics, setBatchTopics] = useState('');
  const [batchLaunching, setBatchLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState(s.activeTab || 'generate');
  const [voiceConfig, setVoiceConfig] = useState<{ engine: string; voice: string; speed: number; cleanedScript?: string }>({ engine: 'gemini-tts', voice: 'Kore', speed: 1.0 });

  // ── Fetch channel data ──
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['youtube-channels', 'plans'],
    queryFn: () => youtubeChannelsService.getPlans(),
  });

  const channel = plansData?.channels?.find(c => c.id === channelId) || null;

  // ── Persist state ──
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ topic, transcript, mode, activeTab }));
  }, [topic, transcript, mode, activeTab, storageKey]);

  // ── Re-hydrate runningRunIds from in-memory map on (re-)mount ──
  // This ensures returning to a channel after navigating away still shows active runs
  useEffect(() => {
    if (!channelId) return;
    const ids = getRunningIdsForChannel(channelId);
    if (ids.length > 0) {
      setRunningRunIds(new Set(ids));
      if (!activeRunId) setActiveRunId(ids[0]);
    }
  }, [channelId]); // activeRunId intentionally excluded to only run on channel change

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
    refetchInterval: activeRunId || runningRunIds.size > 0 ? 3000 : false,
  });

  const { data: transcriptsData } = useQuery({
    queryKey: ['youtube-channels', 'transcripts', debouncedSearch],
    queryFn: () => youtubeChannelsService.searchTranscripts(debouncedSearch, 30),
    enabled: mode === 'transcript',
  });

  // ── Poll active run (for Results tab) ──
  const { data: activeRun } = useQuery({
    queryKey: ['youtube-channels', 'run', activeRunId],
    queryFn: () => activeRunId ? youtubeChannelsService.getRunStatus(activeRunId) : null,
    enabled: !!activeRunId,
    refetchInterval: 2000,
  });

  // ── Poll ALL running runs for completion detection ──
  const runningIdsArray = Array.from(runningRunIds);
  useEffect(() => {
    if (runningIdsArray.length === 0) return;
    const interval = setInterval(() => {
      for (const rid of runningIdsArray) {
        const run = youtubeChannelsService.getRunStatus(rid).catch(() => null);
        run.then(r => {
          if (!r) return;
          if (r.status === 'completed' || r.status === 'failed' || r.status === 'interrupted') {
            setRunningRunIds(prev => {
              const next = new Set(prev);
              next.delete(rid);
              return next;
            });
            const topicLabel = r.input?.topic?.slice(0, 40) || 'Run';
            if (r.status === 'completed') {
              toast({ title: `✅ ${topicLabel}`, description: 'Generation complete!' });
            } else if (r.status === 'interrupted') {
              toast({ title: `⚠️ ${topicLabel}`, description: 'Pipeline interrupted', variant: 'destructive' });
            } else {
              toast({ title: `❌ ${topicLabel}`, description: r.error || 'Failed', variant: 'destructive' });
            }
            queryClient.invalidateQueries({ queryKey: ['youtube-channels', 'runs'] });
          }
        });
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [runningIdsArray.join(',')]); // re-subscribe when set changes

  // ── Generate Mutation ──
  const generateMut = useMutation({
    mutationFn: (req: GenerateRequest) => youtubeChannelsService.generate(req),
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      setRunningRunIds(prev => new Set(prev).add(data.runId));
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
      setRunningRunIds(prev => new Set(prev).add(data.runId));
      toast({ title: '🔧 Step Started', description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handlePipelineRun = (pipelineConfig: PipelineConfig) => {
    if (!channel) return;
    // Batch mode: launch all topics in parallel
    if (batchMode && batchTopics.split('\n').filter(t => t.trim()).length > 0) {
      lastPipelineConfigRef.current = pipelineConfig;
      handleBatchLaunch(pipelineConfig);
      return;
    }
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
      voiceoverCleanedScript: pipelineConfig.voiceover.cleanedScript || undefined,
      assemblyEnabled: pipelineConfig.assembly.enabled,
      assemblyFormat: pipelineConfig.assembly.format,
      assemblyTransitions: pipelineConfig.assembly.transitions,
      assemblyBgMusic: pipelineConfig.assembly.bgMusic,
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
      voiceoverCleanedScript: pipelineConfig.voiceover.cleanedScript || undefined,
      assemblyEnabled: step === 'assembly' ? true : pipelineConfig.assembly.enabled,
      assemblyFormat: pipelineConfig.assembly.format,
      assemblyTransitions: pipelineConfig.assembly.transitions,
      assemblyBgMusic: pipelineConfig.assembly.bgMusic,
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

  // ── Batch Launch: run multiple topics in parallel ──
  const lastPipelineConfigRef = useRef<PipelineConfig | null>(null);

  const handleBatchLaunch = async (pipelineConfig: PipelineConfig) => {
    if (!channel) return;
    const topics = batchTopics
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    if (topics.length === 0) {
      toast({ title: 'No topics', description: 'Enter one topic per line', variant: 'destructive' });
      return;
    }
    setBatchLaunching(true);
    toast({ title: `🚀 Launching ${topics.length} topics...`, description: 'Starting parallel generation' });
    for (let i = 0; i < topics.length; i++) {
      const req: GenerateRequest = {
        channelId: channel.id,
        topic: topics[i],
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
        voiceoverCleanedScript: pipelineConfig.voiceover.cleanedScript || undefined,
        assemblyEnabled: pipelineConfig.assembly.enabled,
        assemblyFormat: pipelineConfig.assembly.format,
        assemblyTransitions: pipelineConfig.assembly.transitions,
        assemblyBgMusic: pipelineConfig.assembly.bgMusic,
      };
      try {
        const data = await youtubeChannelsService.generate(req);
        setRunningRunIds(prev => new Set(prev).add(data.runId));
        if (i === 0) setActiveRunId(data.runId);
      } catch (err) {
        toast({ title: `❌ Topic ${i + 1} failed to start`, description: (err as Error).message, variant: 'destructive' });
      }
      // Small delay between launches to stagger API calls
      if (i < topics.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    setBatchLaunching(false);
    setBatchTopics('');
    setBatchMode(false);
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
              Key Pool
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {getPool().filter(e => !e.disabled).length || 'env'}
              </Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Active Runs Banner ── */}
      {runningRunIds.size > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <p className="font-medium">{runningRunIds.size} run{runningRunIds.size > 1 ? 's' : ''} active</p>
              </div>
              <Badge variant="outline" className="animate-pulse">PARALLEL</Badge>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(runningRunIds.size, 3)}, 1fr)` }}>
              {channelRuns.filter(r => runningRunIds.has(r.id) && r.status === 'running').map(run => {
                const completedCount = run.completedSteps?.length || 0;
                const totalSteps = run.pipelineSteps?.length || 4;
                const pct = Math.round((completedCount / totalSteps) * 100);
                return (
                  <div key={run.id} className="rounded-lg border bg-card p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate max-w-[70%]">{run.input?.topic || run.input?.transcript || 'Run'}</span>
                      <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => { setActiveRunId(run.id); setActiveTab('results'); }}>
                        <Eye className="h-3 w-3 mr-0.5" /> View
                      </Button>
                    </div>
                    <Progress value={pct || 10} className="h-1.5" />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{completedCount}/{totalSteps} steps</span>
                      <span>{run.logs.slice(-1)[0]?.msg?.slice(0, 30) || '...'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Topic</Label>
                    <Button
                      variant={batchMode ? 'default' : 'ghost'}
                      size="sm"
                      className="h-5 text-[10px] px-2 gap-1"
                      onClick={() => setBatchMode(!batchMode)}
                    >
                      <Layers className="h-3 w-3" />
                      {batchMode ? 'Batch ON' : 'Batch'}
                    </Button>
                  </div>
                  {batchMode ? (
                    <>
                      <Textarea
                        placeholder={"Mỗi dòng = 1 topic chạy song song\n\nVí dụ:\nBí mật thẻ tín dụng\nCách tiết kiệm 50% thu nhập\n10 sai lầm đầu tư chứng khoán"}
                        className="resize-none h-40 text-sm font-mono"
                        value={batchTopics}
                        onChange={(e) => setBatchTopics(e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {batchTopics.split('\n').filter(t => t.trim()).length} topics
                        </span>
                        {batchTopics.split('\n').filter(t => t.trim()).length > 0 && (
                          <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500">
                            Sẽ chạy song song
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Textarea
                        placeholder="e.g. Bí mật thẻ tín dụng — đòn bẩy hay bẫy nợ?"
                        className="resize-none h-28 text-sm"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </>
                  )}
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
                    isRunning={generateMut.isPending || stepMut.isPending || resumeMut.isPending || batchLaunching}
                    parallelCount={runningRunIds.size}
                    batchCount={batchMode ? batchTopics.split('\n').filter(t => t.trim()).length : 0}
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
              {activeRun && activeRun.result ? (
                <ResultsView run={activeRun} onRunImageGen={() => {
                  handlePipelineStepRun('imageGen', {
                    scriptWriter: { enabled: true, model: 'gemini-2.0-flash', tone: 'engaging', wordTarget: 600, customPrompt: '' },
                    storyboard: { enabled: true, model: 'hailuo-2.3', style: 'dark-cinematic', scenes: 5, duration: 6, aspectRatio: '16:9', visualIdentity: {} as never, customPrompt: '' },
                    imageGen: { enabled: true, provider: 'gemini', quality: 'standard', negativePrompt: 'text, watermark, logo' },
                    voiceover: { enabled: false, engine: voiceConfig.engine, voice: voiceConfig.voice, speed: voiceConfig.speed },
                    assembly: { enabled: false, format: 'mp4-1080p', transitions: 'crossfade', bgMusic: true },
                  });
                }} onRunVoiceover={() => {
                  handlePipelineStepRun('voiceover', {
                    scriptWriter: { enabled: true, model: 'gemini-2.0-flash', tone: 'engaging', wordTarget: 600, customPrompt: '' },
                    storyboard: { enabled: true, model: 'hailuo-2.3', style: 'dark-cinematic', scenes: 5, duration: 6, aspectRatio: '16:9', visualIdentity: {} as never, customPrompt: '' },
                    imageGen: { enabled: false, provider: 'gemini', quality: 'standard', negativePrompt: 'text, watermark, logo' },
                    voiceover: { enabled: true, engine: voiceConfig.engine, voice: voiceConfig.voice, speed: voiceConfig.speed, cleanedScript: voiceConfig.cleanedScript },
                    assembly: { enabled: false, format: 'mp4-1080p', transitions: 'crossfade', bgMusic: true },
                  });
                }} onRunAssembly={() => {
                  handlePipelineStepRun('assembly', {
                    scriptWriter: { enabled: true, model: 'gemini-2.0-flash', tone: 'engaging', wordTarget: 600, customPrompt: '' },
                    storyboard: { enabled: true, model: 'hailuo-2.3', style: 'dark-cinematic', scenes: 5, duration: 6, aspectRatio: '16:9', visualIdentity: {} as never, customPrompt: '' },
                    imageGen: { enabled: false, provider: 'gemini', quality: 'standard', negativePrompt: 'text, watermark, logo' },
                    voiceover: { enabled: false, engine: voiceConfig.engine, voice: voiceConfig.voice, speed: voiceConfig.speed },
                    assembly: { enabled: true, format: 'mp4-1080p', transitions: 'crossfade', bgMusic: true },
                  });
                }} isGenerating={stepMut.isPending}
                  voiceoverConfig={voiceConfig}
                  onVoiceoverConfigChange={(u) => setVoiceConfig(prev => ({ ...prev, ...u }))}
                />
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

      {/* ── API Key Pool Manager Dialog ── */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Pool Manager
            </DialogTitle>
            <DialogDescription>
              Add multiple API keys for round-robin rotation. Keys auto-disable after 3 consecutive errors.
              Get keys from{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1">
                Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </DialogDescription>
          </DialogHeader>
          <KeyPoolManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── KEY POOL MANAGER ─────────────────────────────────────

const ENGINE_OPTIONS = [
  { value: 'gemini', label: '🤖 Gemini', placeholder: 'AIzaSy...' },
  { value: 'elevenlabs', label: '🎤 ElevenLabs', placeholder: 'sk_...' },
  { value: 'google-tts', label: '🔊 Google TTS', placeholder: 'AIzaSy...' },
] as const;

function KeyPoolManager() {
  const [pool, setPool] = useState<PoolEntry[]>(getPool());
  const [newEngine, setNewEngine] = useState<string>('gemini');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    const unsub = onPoolChange(() => setPool(getPool()));
    return unsub;
  }, []);

  const handleAdd = () => {
    if (!newKey.trim()) return;
    addKey(newEngine, newKey.trim(), newLabel.trim() || undefined);
    setNewKey('');
    setNewLabel('');
  };

  const mask = (key: string) => key.slice(0, 6) + '...' + key.slice(-4);

  const engineKeys = (engine: string) => pool.filter(e => e.engine === engine);
  const hasKeys = pool.length > 0;

  return (
    <div className="space-y-4">
      {/* Add new key form */}
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex gap-2">
          <Select value={newEngine} onValueChange={setNewEngine}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENGINE_OPTIONS.map(e => (
                <SelectItem key={e.value} value={e.value} className="text-xs">{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-8 text-xs flex-1"
            type="password"
            placeholder={ENGINE_OPTIONS.find(e => e.value === newEngine)?.placeholder}
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Input
            className="h-8 text-xs flex-1"
            placeholder="Label (optional, e.g. 'Key #1 - Free tier')"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
          />
          <Button size="sm" className="h-8" disabled={!newKey.trim()} onClick={handleAdd}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Pool keys by engine */}
      {!hasKeys && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No keys in pool. Add keys above, or set env vars (VITE_GEMINI_API_KEY) as fallback.
        </p>
      )}

      {ENGINE_OPTIONS.map(eng => {
        const keys = engineKeys(eng.value);
        if (keys.length === 0) return null;
        return (
          <div key={eng.value} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{eng.label} ({keys.length} key{keys.length > 1 ? 's' : ''})</Label>
            {keys.map(entry => (
              <div key={entry.key} className={`flex items-center gap-2 rounded border p-2 text-xs ${entry.disabled ? 'opacity-50 bg-red-500/5' : ''}`}>
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${entry.disabled ? 'bg-red-500' : 'bg-green-500'}`} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono">{mask(entry.key)}</span>
                  {entry.label && <span className="ml-2 text-muted-foreground">{entry.label}</span>}
                  <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
                    <span>Used: {entry.usageCount}x</span>
                    {entry.lastError && <span className="text-red-400 truncate max-w-[150px]">Err: {entry.lastError}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6"
                  onClick={() => entry.disabled ? enableKey(eng.value, entry.key) : disableKey(eng.value, entry.key)}
                  title={entry.disabled ? 'Enable' : 'Disable'}
                >
                  {entry.disabled ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500"
                  onClick={() => removeKey(eng.value, entry.key)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        );
      })}

      {/* Actions */}
      {hasKeys && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={resetStats}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset Stats
          </Button>
        </div>
      )}
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

// ─── VOICE TAB (FULL-FEATURED) ────────────────────────────

type VoiceoverClip = { scene: number; url: string; duration: number; charCount: number; engine: string };
type VoiceoverData = { clips?: VoiceoverClip[]; totalClips?: number; successCount?: number; failCount?: number; totalDuration?: number; engine?: string; voice?: string; speed?: number; fullAudioUrl?: string };
type StoryboardData = { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[] };

function VoiceTabContent({
  run,
  voiceoverJson,
  storyboardJson,
  scriptTxt,
  voiceoverConfig,
  onVoiceoverConfigChange,
  onRunVoiceover,
  isGenerating,
}: {
  run: GenerationRun;
  voiceoverJson?: VoiceoverData;
  storyboardJson?: StoryboardData;
  scriptTxt?: string;
  voiceoverConfig?: { engine: string; voice: string; speed: number };
  onVoiceoverConfigChange?: (u: Partial<{ engine: string; voice: string; speed: number }>) => void;
  onRunVoiceover?: () => void;
  isGenerating?: boolean;
}) {
  const engine = voiceoverConfig?.engine || 'gemini-tts';
  const [regeneratingScene, setRegeneratingScene] = useState<number | null>(null);
  const isElevenLabs = engine === 'elevenlabs';
  const isGemini = engine === 'gemini-tts';
  const isGoogleTTS = engine === 'google-tts';

  // ── TTS Script Optimizer ──
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizedScript, setOptimizedScript] = useState<string | null>(voiceoverConfig?.cleanedScript || null);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  const [showOptimized, setShowOptimized] = useState(!!voiceoverConfig?.cleanedScript);

  const handleOptimizeForTTS = async () => {
    if (!scriptTxt?.trim()) return;
    setOptimizerLoading(true);
    setOptimizerError(null);
    try {
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;
      if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');
      const scriptText = scriptTxt.length > 8000 ? scriptTxt.substring(0, 8000) : scriptTxt;
      const systemPrompt = `Bạn là chuyên gia làm sạch script cho Text-to-Speech (TTS).\n\nNHIỆM VỤ: Nhận script gốc → trả về bản GẦN NHƯ Y HỆT, chỉ sửa những gì TTS engine không đọc được.\n\nNGUYÊN TẮC VÀNG: GIỮ NGUYÊN TỐI ĐA — chỉ sửa khi CẦN THIẾT cho TTS.\n- GIỮ NGUYÊN: từ ngữ, câu văn, phong cách, tone giọng, thứ tự nội dung, độ dài\n- KHÔNG được viết lại câu, KHÔNG thêm/bớt ý\n\nCHỈ SỬA:\n1. XÓA TIÊU ĐỀ → dòng đầu nếu là heading thì BỎ\n2. SỐ → viết thành chữ (100k → một trăm nghìn)\n3. KÝ HIỆU/VIẾT TẮT → AI → A.I., CEO → C.E.O.\n4. LOẠI BỎ → heading (#), markdown, links, emoji\n5. CÂU QUÁ DÀI (trên 40 từ) → tách bằng dấu phẩy/chấm, GIỮ NGUYÊN TỪ NGỮ\n6. NHỊP THỞ → thêm "..." hoặc dấu phẩy ở chỗ cần nhấn mạnh\n\nĐỊNH DẠNG: Chỉ trả text thuần, mỗi đoạn cách 1 dòng trống.`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `Tối ưu script sau cho TTS:\n\n${scriptText}` }] }],
            generationConfig: { temperature: 0.2 },
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini error ${res.status}`);
      }
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!text) throw new Error('AI trả về rỗng');
      setOptimizedScript(text);
      setShowOptimized(true);
    } catch (err) {
      setOptimizerError(err instanceof Error ? err.message : String(err));
    } finally {
      setOptimizerLoading(false);
    }
  };

  const handleApplyOptimized = () => {
    if (optimizedScript && onVoiceoverConfigChange) {
      onVoiceoverConfigChange({ cleanedScript: optimizedScript } as never);
    }
  };

  const handleClearOptimized = () => {
    setOptimizedScript(null);
    setShowOptimized(false);
    if (onVoiceoverConfigChange) {
      onVoiceoverConfigChange({ cleanedScript: '' } as never);
    }
  };

  // Voice Preview states
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Script Preview
  const [showScriptPreview, setShowScriptPreview] = useState(false);



  // Clear preview when engine/voice/speed changes
  useEffect(() => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    setPreviewError(null);
  }, [voiceoverConfig?.engine, voiceoverConfig?.voice, voiceoverConfig?.speed]); // previewUrl is intentionally excluded

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handlePreview = async () => {
    if (!voiceoverConfig) return;
    setPreviewLoading(true);
    setPreviewError(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }

    const sampleText = 'Xin chào, đây là giọng đọc mẫu. Bạn có thể nghe thử trước khi tạo voiceover cho video.';

    try {
      let blob: Blob;

      if (voiceoverConfig.engine === 'gemini-tts') {
        const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;
        if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: sampleText }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceoverConfig.voice || 'Kore' } } },
              },
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini TTS error ${res.status}`);
        }
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const audioPart = parts.find((p: { inlineData?: { mimeType?: string } }) => p.inlineData?.mimeType?.startsWith('audio/'));
        if (!audioPart) throw new Error('No audio returned');
        const b64 = audioPart.inlineData.data as string;
        const byteChars = atob(b64);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const mime = (audioPart.inlineData.mimeType as string) || '';
        if (mime.includes('L16') || mime.includes('pcm') || mime.includes('raw')) {
          const sampleRate = 24000;
          const numChannels = 1;
          const bitsPerSample = 16;
          const wavHeader = new ArrayBuffer(44);
          const view = new DataView(wavHeader);
          const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
          writeStr(0, 'RIFF');
          view.setUint32(4, 36 + byteArr.length, true);
          writeStr(8, 'WAVE');
          writeStr(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, numChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
          view.setUint16(32, numChannels * bitsPerSample / 8, true);
          view.setUint16(34, bitsPerSample, true);
          writeStr(36, 'data');
          view.setUint32(40, byteArr.length, true);
          blob = new Blob([wavHeader, byteArr], { type: 'audio/wav' });
        } else {
          blob = new Blob([byteArr], { type: mime || 'audio/wav' });
        }
      } else if (voiceoverConfig.engine === 'google-tts') {
        const apiKey = (import.meta.env.VITE_GOOGLE_TTS_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '') as string;
        if (!apiKey) throw new Error('Missing Google TTS API key');
        const langCode = voiceoverConfig.voice?.startsWith('en-') ? 'en-US' : 'vi-VN';
        const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: sampleText },
            voice: { languageCode: langCode, name: voiceoverConfig.voice },
            audioConfig: { audioEncoding: 'MP3', speakingRate: voiceoverConfig.speed || 1.0, pitch: 0 },
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: { message?: string } })?.error?.message || `Google TTS error ${res.status}`);
        }
        const data = await res.json() as { audioContent: string };
        const byteChars = atob(data.audioContent);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        blob = new Blob([byteArr], { type: 'audio/mpeg' });
      } else {
        const apiKey = (import.meta.env.VITE_ELEVENLABS_API_KEY || '') as string;
        if (!apiKey) throw new Error('Missing VITE_ELEVENLABS_API_KEY');
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceoverConfig.voice}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
          body: JSON.stringify({
            text: sampleText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: voiceoverConfig.speed || 1.0 },
          }),
        });
        if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`);
        blob = await res.blob();
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setTimeout(() => previewAudioRef.current?.play(), 100);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  };



  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">Voiceover / TTS</CardTitle>
        <div className="flex items-center gap-2">
          {voiceoverJson?.clips && voiceoverJson.clips.length > 0 && (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
              🎤 {voiceoverJson.successCount || voiceoverJson.clips.length}/{voiceoverJson.totalClips || '?'} clips
              {voiceoverJson.totalDuration ? ` • ${voiceoverJson.totalDuration.toFixed(1)}s` : ''}
            </Badge>
          )}
          {onRunVoiceover && (storyboardJson?.scenes?.length || scriptTxt) && (
            <Button
              variant={voiceoverJson?.clips ? 'outline' : 'default'}
              size="sm"
              onClick={onRunVoiceover}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang tạo...</>
              ) : voiceoverJson?.clips ? (
                <><RefreshCw className="h-4 w-4 mr-1" /> Re-gen Voice</>
              ) : (
                <><Mic className="h-4 w-4 mr-1" /> Generate Voice</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Voiceover Config ── */}
        {voiceoverConfig && onVoiceoverConfigChange && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-3">
            <span className="text-[11px] font-semibold text-green-400">⚙️ Cấu hình Voice</span>

            {/* Engine + Voice (2-col) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">TTS Engine</Label>
                <Select value={voiceoverConfig.engine} onValueChange={(v) => {
                  if (v === 'elevenlabs') onVoiceoverConfigChange({ engine: v, voice: 'pNInz6obpgDQGcFmaJgB' });
                  else if (v === 'google-tts') onVoiceoverConfigChange({ engine: v, voice: 'vi-VN-Neural2-D' });
                  else onVoiceoverConfigChange({ engine: v, voice: 'Kore' });
                }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-tts">Gemini TTS (recommended)</SelectItem>
                    <SelectItem value="google-tts">Google Cloud TTS</SelectItem>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Voice</Label>
                {isElevenLabs ? (
                  <Select value={voiceoverConfig.voice} onValueChange={(v) => onVoiceoverConfigChange({ voice: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">👨 Nam</SelectLabel>
                        <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam (Deep)</SelectItem>
                        <SelectItem value="yoZ06aMxZJJ28mfd3POQ">Sam (Authoritative)</SelectItem>
                        <SelectItem value="onwK4e9ZLuTAKqWW03F9">Daniel (British)</SelectItem>
                        <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam (Natural)</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">👩 Nữ</SelectLabel>
                        <SelectItem value="21m00Tcm4TlvDq8ikWAM">Rachel (Narrator)</SelectItem>
                        <SelectItem value="EXAVITQu4vr4xnSDxMaL">Bella (Warm)</SelectItem>
                        <SelectItem value="jBpfuIE2acCO8z3wKNLl">Gigi (Animated)</SelectItem>
                        <SelectItem value="XB0fDUnXU5powFXDhCwa">Charlotte (Calm)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : isGoogleTTS ? (
                  <Select value={voiceoverConfig.voice} onValueChange={(v) => onVoiceoverConfigChange({ voice: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">🇻🇳 Tiếng Việt — Nam</SelectLabel>
                        <SelectItem value="vi-VN-Neural2-D">Neural2-D (tự nhiên)</SelectItem>
                        <SelectItem value="vi-VN-Wavenet-B">Wavenet-B (mượt)</SelectItem>
                        <SelectItem value="vi-VN-Wavenet-D">Wavenet-D (trầm)</SelectItem>
                        <SelectItem value="vi-VN-Standard-B">Standard-B</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">🇻🇳 Tiếng Việt — Nữ</SelectLabel>
                        <SelectItem value="vi-VN-Neural2-A">Neural2-A (tự nhiên)</SelectItem>
                        <SelectItem value="vi-VN-Wavenet-A">Wavenet-A (mượt)</SelectItem>
                        <SelectItem value="vi-VN-Wavenet-C">Wavenet-C (nhẹ nhàng)</SelectItem>
                        <SelectItem value="vi-VN-Standard-A">Standard-A</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">🇺🇸 English — Male</SelectLabel>
                        <SelectItem value="en-US-Neural2-D">Neural2-D (natural)</SelectItem>
                        <SelectItem value="en-US-Neural2-A">Neural2-A (warm)</SelectItem>
                        <SelectItem value="en-US-Studio-O">Studio-O (premium)</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">🇺🇸 English — Female</SelectLabel>
                        <SelectItem value="en-US-Neural2-F">Neural2-F (natural)</SelectItem>
                        <SelectItem value="en-US-Neural2-C">Neural2-C (warm)</SelectItem>
                        <SelectItem value="en-US-Studio-Q">Studio-Q (premium)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={voiceoverConfig.voice} onValueChange={(v) => onVoiceoverConfigChange({ voice: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">👨 Nam</SelectLabel>
                        <SelectItem value="Charon">Charon — trầm, sâu</SelectItem>
                        <SelectItem value="Fenrir">Fenrir — kể chuyện</SelectItem>
                        <SelectItem value="Puck">Puck — năng động</SelectItem>
                        <SelectItem value="Orus">Orus — chắc, rõ</SelectItem>
                        <SelectItem value="Gacrux">Gacrux — chín chắn</SelectItem>
                        <SelectItem value="Iapetus">Iapetus — trong trẻo</SelectItem>
                        <SelectItem value="Umbriel">Umbriel — điềm tĩnh</SelectItem>
                        <SelectItem value="Algenib">Algenib — trầm khàn</SelectItem>
                        <SelectItem value="Rasalgethi">Rasalgethi — truyền thông</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-muted-foreground">👩 Nữ</SelectLabel>
                        <SelectItem value="Kore">Kore — biểu cảm ⭐</SelectItem>
                        <SelectItem value="Aoede">Aoede — ấm áp</SelectItem>
                        <SelectItem value="Leda">Leda — nhẹ nhàng</SelectItem>
                        <SelectItem value="Zephyr">Zephyr — tươi sáng</SelectItem>
                        <SelectItem value="Achernar">Achernar — dịu dàng</SelectItem>
                        <SelectItem value="Autonoe">Autonoe — rõ ràng</SelectItem>
                        <SelectItem value="Callirrhoe">Callirrhoe — ấm vừa</SelectItem>
                        <SelectItem value="Despina">Despina — trong trẻo</SelectItem>
                        <SelectItem value="Erinome">Erinome — nhẹ, sáng</SelectItem>
                        <SelectItem value="Laomedeia">Laomedeia — vui tươi</SelectItem>
                        <SelectItem value="Sulafat">Sulafat — ấm, thì thầm</SelectItem>
                        <SelectItem value="Vindemiatrix">Vindemiatrix — trầm nhẹ</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Speed */}
            <div className="space-y-1">
              <Label className="text-xs">Speed</Label>
              <Select value={String(voiceoverConfig.speed)} onValueChange={(v) => onVoiceoverConfigChange({ speed: parseFloat(v) })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8">0.8x (Chậm)</SelectItem>
                  <SelectItem value="0.9">0.9x</SelectItem>
                  <SelectItem value="1.0">1.0x (Bình thường)</SelectItem>
                  <SelectItem value="1.1">1.1x</SelectItem>
                  <SelectItem value="1.2">1.2x (Nhanh)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Voice Preview */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-2"
                onClick={handlePreview}
                disabled={previewLoading}
              >
                {previewLoading ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Đang tạo mẫu...</>
                ) : (
                  <><Play className="h-3 w-3" /> Nghe thử giọng đọc</>
                )}
              </Button>

              {previewUrl && (
                <audio
                  ref={previewAudioRef}
                  controls
                  src={previewUrl}
                  className="w-full h-8"
                  preload="auto"
                />
              )}

              {previewError && (
                <p className="text-[10px] text-red-400">⚠️ {previewError}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Script Preview + Doctor ── */}
        {scriptTxt?.trim() ? (
          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2 space-y-1.5">
            <button
              type="button"
              className="flex items-center gap-1.5 w-full text-left"
              onClick={() => setShowScriptPreview(v => !v)}
            >
              {showScriptPreview ? <ChevronDown className="h-3 w-3 text-blue-400 shrink-0" /> : <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />}
              <span className="text-[10px] font-medium text-blue-400">
                📝 Script từ Step 1 ({scriptTxt.length.toLocaleString()} ký tự)
                {' — '}
                <span className="text-muted-foreground">{showScriptPreview ? 'ẩn' : 'xem nội dung'}</span>
              </span>
            </button>

            {showScriptPreview && (
              <ScrollArea className="max-h-48">
                <p className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed pr-2">
                  {scriptTxt.length > 2000 ? scriptTxt.substring(0, 2000) + '...' : scriptTxt}
                </p>
              </ScrollArea>
            )}

          </div>
        ) : (
          <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
            <p className="text-[10px] text-yellow-400">
              ⚠️ Chưa có Script. Chạy Step 1 (Script Writer) trước để tạo nội dung cho TTS.
            </p>
          </div>
        )}

        {/* ── TTS Script Optimizer ── */}
        {scriptTxt?.trim() && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-[11px] gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
              onClick={handleOptimizeForTTS}
              disabled={optimizerLoading}
            >
              {optimizerLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Đang tối ưu script cho TTS...</>
              ) : optimizedScript ? (
                <><Sparkles className="h-3 w-3" /> 🔄 Tối ưu lại script cho TTS</>
              ) : (
                <><Sparkles className="h-3 w-3" /> ✨ AI tối ưu script → bản sạch cho TTS</>
              )}
            </Button>

            {optimizerError && (
              <p className="text-[10px] text-red-400">⚠️ {optimizerError}</p>
            )}

            {optimizedScript && (
              <div className="rounded-md border border-green-500/30 bg-green-500/5 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-green-500/10 transition-colors"
                  onClick={() => setShowOptimized(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-400">✅ Script TTS-Ready</span>
                    <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">
                      {optimizedScript.length.toLocaleString()} ký tự
                    </Badge>
                    {voiceoverConfig?.cleanedScript ? (
                      <Badge variant="outline" className="text-[9px] border-green-500/50 text-green-400">đã áp dụng</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] border-yellow-500/50 text-yellow-400">chưa áp dụng</Badge>
                    )}
                  </div>
                  {showOptimized ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>

                {showOptimized && (
                  <div className="px-3 pb-3 space-y-2 border-t border-green-500/20 pt-2">
                    <ScrollArea className="max-h-48">
                      <p className="text-[10px] text-foreground/80 whitespace-pre-wrap leading-relaxed pr-2 font-mono">
                        {optimizedScript}
                      </p>
                    </ScrollArea>

                    <div className="flex gap-2">
                      {!voiceoverConfig?.cleanedScript || voiceoverConfig.cleanedScript !== optimizedScript ? (
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-[10px] gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleApplyOptimized}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Áp dụng cho TTS
                        </Button>
                      ) : (
                        <Badge className="flex-1 justify-center bg-green-600/20 text-green-400 border-green-500/50 h-7">
                          ✅ Đã áp dụng — Re-gen Voice sẽ dùng bản này
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] text-muted-foreground hover:text-red-400"
                        onClick={handleClearOptimized}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Engine info hint */}
        <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            🎤 Nếu có Storyboard → tạo audio per-scene từ dialogues. Nếu chỉ có Script → full narration.
            {isGemini && ' Dùng chung Gemini API key — không cần cấu hình thêm.'}
            {isElevenLabs && ' Cần VITE_ELEVENLABS_API_KEY trong .env.'}
            {isGoogleTTS && ' Cần enable Cloud Text-to-Speech API trong GCP Console.'}
          </p>
        </div>

        {/* ── Voice — Full Audio + Clips ── */}
        {voiceoverJson?.clips && voiceoverJson.clips.length > 0 ? (
          <div className="space-y-4">
            {/* Full combined audio */}
            <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-400">🎧 Full Audio</span>
                <span className="text-[10px] text-muted-foreground">
                  ~{voiceoverJson.totalDuration || 0}s • {voiceoverJson.clips.length} phần
                </span>
              </div>
              {voiceoverJson.fullAudioUrl ? (
                <SmartAudio src={voiceoverJson.fullAudioUrl} showRegenerate={false} />
              ) : voiceoverJson.clips.length === 1 ? (
                <SmartAudio src={voiceoverJson.clips[0].url} showRegenerate={false} />
              ) : (
                <p className="text-xs text-muted-foreground italic">Full audio chưa có (run cũ). Chạy lại voiceover để merge.</p>
              )}
            </div>

            {/* Individual clips — collapsible */}
            {voiceoverJson.clips.length > 1 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-purple-400 hover:text-purple-300 text-center py-1 list-none">
                  <span className="group-open:hidden">▼ Xem {voiceoverJson.clips.length} đoạn riêng</span>
                  <span className="hidden group-open:inline">▲ Ẩn từng đoạn</span>
                </summary>
                <div className="space-y-3 mt-2">
                  {voiceoverJson.clips.map((clip, i) => {
                    const scene = storyboardJson?.scenes?.find(s => s.scene === clip.scene);
                    return (
                      <div key={i} className="p-3 rounded-lg border hover:bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Đoạn {clip.scene}</Badge>
                            <span className="text-[10px] text-muted-foreground">{clip.duration.toFixed(1)}s • {clip.charCount} chars • {clip.engine}</span>
                          </div>
                          <Volume2 className="h-3.5 w-3.5 text-green-400" />
                        </div>
                        {scene && <p className="text-xs text-muted-foreground italic truncate">"{scene.dialogue}"</p>}
                        <SmartAudio
                          src={clip.url}
                          regenerating={regeneratingScene === clip.scene}
                          onRegenerate={scene?.dialogue ? async () => {
                            setRegeneratingScene(clip.scene);
                            try {
                              const result = await regenerateSingleClip({
                                text: scene.dialogue,
                                engine: voiceoverConfig?.engine || clip.engine,
                                voice: voiceoverConfig?.voice || 'Kore',
                                speed: voiceoverConfig?.speed || 1.0,
                                channelId: run.input?.channelId || 'default',
                                runId: run.id,
                                sceneNum: clip.scene,
                              });
                              clip.url = result.url;
                              clip.duration = result.duration;
                              clip.charCount = result.charCount;
                            } catch (err) {
                              console.error('Regenerate failed:', err);
                            } finally {
                              setRegeneratingScene(null);
                            }
                          } : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có voiceover.</p>
            <p className="text-xs mt-1">Chọn engine + voice ở trên rồi bấm Generate Voice.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── RESULTS VIEW ─────────────────────────────────────────

function ResultsView({ run, onRunImageGen, onRunVoiceover, onRunAssembly, isGenerating, voiceoverConfig, onVoiceoverConfigChange }: {
  run: GenerationRun;
  onRunImageGen?: () => void;
  onRunVoiceover?: () => void;
  onRunAssembly?: () => void;
  isGenerating?: boolean;
  voiceoverConfig?: { engine: string; voice: string; speed: number };
  onVoiceoverConfigChange?: (u: Partial<{ engine: string; voice: string; speed: number }>) => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const result = run.result;
  if (!result) return null;

  const scriptJson = result.files?.['script.json'] as Record<string, unknown> | undefined;
  const scriptTxt = result.files?.['script.txt'] as string | undefined;
  const storyboardMd = result.files?.['storyboard.md'] as string | undefined;
  const storyboardJson = result.files?.['storyboard.json'] as { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[] } | undefined;
  const imagesJson = result.files?.['images.json'] as { images?: { scene: number; url: string; prompt: string }[]; successCount?: number; totalScenes?: number } | undefined;
  const voiceoverJson = result.files?.['voiceover.json'] as { clips?: { scene: number; url: string; duration: number; charCount: number; engine: string }[]; totalClips?: number; successCount?: number; failCount?: number; totalDuration?: number; engine?: string; voice?: string; speed?: number; fullAudioUrl?: string } | undefined;
  const assemblyJson = result.files?.['assembly.json'] as { videoUrl?: string; format?: string; duration?: number; totalScenes?: number; resolution?: string; fileSize?: number; transitions?: string; bgMusic?: boolean } | undefined;
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
          <TabsTrigger value="voice">🎤 Voice</TabsTrigger>
          <TabsTrigger value="video">🎥 Video</TabsTrigger>
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

        <TabsContent value="voice">
          <VoiceTabContent
            run={run}
            voiceoverJson={voiceoverJson}
            storyboardJson={storyboardJson}
            scriptTxt={scriptTxt}
            voiceoverConfig={voiceoverConfig}
            onVoiceoverConfigChange={onVoiceoverConfigChange}
            onRunVoiceover={onRunVoiceover}
            isGenerating={isGenerating}
          />
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Video Assembly</CardTitle>
              <div className="flex items-center gap-2">
                {assemblyJson?.videoUrl && (
                  <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                    ✅ {assemblyJson.totalScenes} scenes · {Math.round(assemblyJson.duration || 0)}s · {assemblyJson.resolution}
                  </Badge>
                )}
                {onRunAssembly && imagesJson?.images && voiceoverJson?.clips && (
                  <Button
                    variant={assemblyJson?.videoUrl ? 'outline' : 'default'}
                    size="sm"
                    onClick={onRunAssembly}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang ghép...</>
                    ) : assemblyJson?.videoUrl ? (
                      <><RefreshCw className="h-4 w-4 mr-1" /> Re-assemble</>  
                    ) : (
                      <><Film className="h-4 w-4 mr-1" /> Assemble Video</>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assemblyJson?.videoUrl ? (
                <div className="space-y-4">
                  <video
                    src={assemblyJson.videoUrl}
                    controls
                    className="w-full max-w-[800px] mx-auto rounded-lg border aspect-video bg-black"
                  />
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{Math.round(assemblyJson.duration || 0)}s</p>
                      <p className="text-[10px] text-muted-foreground">Duration</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{assemblyJson.resolution}</p>
                      <p className="text-[10px] text-muted-foreground">Resolution</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{assemblyJson.format?.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground">Format</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{assemblyJson.fileSize ? (assemblyJson.fileSize / 1024 / 1024).toFixed(1) + 'MB' : '—'}</p>
                      <p className="text-[10px] text-muted-foreground">File Size</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">Transitions: {assemblyJson.transitions}</Badge>
                    <Badge variant="secondary" className="text-[10px]">BG Music: {assemblyJson.bgMusic ? 'On' : 'Off'}</Badge>
                    <a href={assemblyJson.videoUrl} download className="ml-auto">
                      <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> Download</Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Prerequisites status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-lg border p-3 ${imagesJson?.images ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {imagesJson?.images ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <ImageIcon className="h-4 w-4 text-yellow-500" />}
                        <span className="text-sm font-medium">Images (Step 3)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {imagesJson?.images ? `✅ ${imagesJson.successCount || imagesJson.images.length} ảnh sẵn sàng` : '⚠️ Chưa có — chạy Step 3 trước'}
                      </p>
                    </div>
                    <div className={`rounded-lg border p-3 ${voiceoverJson?.clips ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {voiceoverJson?.clips ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Mic className="h-4 w-4 text-yellow-500" />}
                        <span className="text-sm font-medium">Audio (Step 4)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {voiceoverJson?.clips ? `✅ ${voiceoverJson.successCount} clips · ~${voiceoverJson.totalDuration}s · ${voiceoverJson.engine}` : '⚠️ Chưa có — chạy Step 4 trước'}
                      </p>
                    </div>
                  </div>

                  {/* Scene-by-scene preview */}
                  {storyboardJson?.scenes && storyboardJson.scenes.length > 0 && (imagesJson?.images || voiceoverJson?.clips) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">📋 Preview: {storyboardJson.scenes.length} scenes sẽ được ghép</p>
                      <div className="grid gap-2">
                        {storyboardJson.scenes.map((scene, i) => {
                          const imgUrl = imageMap.get(scene.scene);
                          const clip = voiceoverJson?.clips?.find(c => c.scene === scene.scene);
                          return (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                              {/* Thumbnail */}
                              <div className="w-24 h-14 rounded overflow-hidden bg-muted flex-shrink-0 border">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={`Scene ${scene.scene}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>
                              {/* Scene info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] px-1.5">Scene {scene.scene}</Badge>
                                  {imgUrl && <span className="text-[10px] text-green-400">🖼️</span>}
                                  {clip && <span className="text-[10px] text-green-400">🎤 ~{clip.duration}s</span>}
                                  {!imgUrl && <span className="text-[10px] text-yellow-400">⬜ no image</span>}
                                  {!clip && <span className="text-[10px] text-yellow-400">⬜ no audio</span>}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">"{scene.dialogue}"</p>
                              </div>
                              {/* Transition */}
                              <Badge variant="secondary" className="text-[9px] flex-shrink-0">{scene.transition}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Summary + estimated output */}
                  {imagesJson?.images && voiceoverJson?.clips && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-1.5">
                      <p className="text-xs font-medium text-blue-400">🎥 Ước tính video output:</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>📐 1920×1080</span>
                        <span>⏱️ ~{voiceoverJson.totalDuration}s</span>
                        <span>🖼️ {imagesJson.images.length} scenes</span>
                        <span>📦 WebM (VP9+Opus)</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Nhấn "Assemble Video" để bắt đầu render. Video sẽ được tạo ngay trong browser bằng Canvas API.
                      </p>
                    </div>
                  )}

                  {/* Missing prerequisites */}
                  {(!imagesJson?.images || !voiceoverJson?.clips) && (
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                      <p className="text-xs text-yellow-400">
                        {!imagesJson?.images && !voiceoverJson?.clips
                          ? '⚠️ Cần chạy Step 3 (Images) + Step 4 (Voiceover) trước khi ghép video.'
                          : !imagesJson?.images
                          ? '⚠️ Cần chạy Step 3 (Image Gen) trước — đã có audio, chỉ cần thêm ảnh.'
                          : '⚠️ Cần chạy Step 4 (Voiceover) trước — đã có ảnh, chỉ cần thêm audio.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
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
