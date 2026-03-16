/**
 * 🎬 YouTube Channel Workspace — Dedicated per-channel generation workspace
 *
 * Full-screen workspace for a single channel with clear workflow:
 * Input → Pipeline → Results
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CopyPlus,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Film,
  ImageIcon,
  Key,
  Layers,
  Loader2,
  Mic,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  Volume2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import PipelineRoadmap, { type PipelineConfig } from '@/components/youtube/PipelineRoadmap';
import { DEFAULT_PIPELINE } from '@/components/youtube/pipeline-types';
import SmartAudio from '@/components/youtube/SmartAudio';
import { toast, useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getRunningIdsForChannel } from '@/services/pipeline';
import {
  addKey,
  disableKey,
  enableKey,
  getNextKey,
  getPool,
  hydrateFromDb as hydrateKeyPool,
  onPoolChange,
  type PoolEntry,
  pinKey,
  removeKey,
  resetStats,
  testKey,
  unpinKey,
} from '@/services/pipeline/api-key-pool';
import {
  backfillFromRuns,
  COST_RATES,
  type CostEntry,
  clearCostData,
  exportCostData,
  getCostEntries,
  getCostSummary,
  trackCost,
} from '@/services/pipeline/cost-tracker';
import {
  generateSingleImage,
  scanStorageForImages,
  uploadToStorage,
} from '@/services/pipeline/image-gen.agent';
import { fixAllOrphanedRuns, getAllRuns, updateRunFile } from '@/services/pipeline/run-tracker';
import { regenerateSingleClip } from '@/services/pipeline/voiceover.agent';
import type { GenerateRequest, GenerationRun } from '@/services/youtube-channels.service';
import { youtubeChannelsService } from '@/services/youtube-channels.service';

// ─── Read Pipeline config from localStorage (synced with PipelineRoadmap) ──
const PIPELINE_STORAGE_KEY = 'yt-pipeline-config';
function getSavedPipelineConfig(): PipelineConfig {
  try {
    const raw = localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (raw) return { ...DEFAULT_PIPELINE, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt data */
  }
  return DEFAULT_PIPELINE;
}

// ─── MAIN COMPONENT ────────────────────────────────────────

export default function YouTubeChannelWorkspace() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Persisted State (per channel) ──
  const storageKey = `yt-ws-${channelId}`;
  const s = (() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
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
  const [voiceConfig, setVoiceConfig] = useState<{
    engine: string;
    voice: string;
    speed: number;
    cleanedScript?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('yt-voice-config');
      if (saved) return { engine: 'gemini-tts', voice: 'Kore', speed: 1.0, ...JSON.parse(saved) };
    } catch {
      /* ignore */
    }
    return { engine: 'gemini-tts', voice: 'Kore', speed: 1.0 };
  });

  // Persist voiceConfig to localStorage + sync to Pipeline config
  useEffect(() => {
    localStorage.setItem('yt-voice-config', JSON.stringify(voiceConfig));
    // Sync voice settings to Pipeline config so both tabs stay consistent
    try {
      const raw = localStorage.getItem('yt-pipeline-config');
      if (raw) {
        const cfg = JSON.parse(raw);
        if (cfg.voiceover) {
          cfg.voiceover.engine = voiceConfig.engine;
          cfg.voiceover.voice = voiceConfig.voice;
          cfg.voiceover.speed = voiceConfig.speed;
          if (voiceConfig.cleanedScript) cfg.voiceover.cleanedScript = voiceConfig.cleanedScript;
          localStorage.setItem('yt-pipeline-config', JSON.stringify(cfg));
        }
      }
    } catch {
      /* ignore */
    }
  }, [voiceConfig]);

  // ── Hydrate Key Pool from Supabase on mount ──
  useEffect(() => {
    hydrateKeyPool();
  }, []);

  // ── Fetch channel data ──
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['youtube-channels', 'plans'],
    queryFn: () => youtubeChannelsService.getPlans(),
  });

  const channel = plansData?.channels?.find((c) => c.id === channelId) || null;

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

  // ── Clear stale pipeline display when user edits topic ──
  // If the previous run already finished, reset so PipelineRoadmap shows idle state
  useEffect(() => {
    if (activeRunId && !runningRunIds.has(activeRunId)) {
      setActiveRunId(null);
    }
  }, [topic]);

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
      // Detect orphaned runs stuck in 'running' for >5 min
      fixAllOrphanedRuns();
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
    queryFn: () => (activeRunId ? youtubeChannelsService.getRunStatus(activeRunId) : null),
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
        run.then((r) => {
          if (!r) return;
          if (r.status === 'completed' || r.status === 'failed' || r.status === 'interrupted') {
            setRunningRunIds((prev) => {
              const next = new Set(prev);
              next.delete(rid);
              return next;
            });
            const topicLabel = r.input?.topic?.slice(0, 40) || 'Run';
            if (r.status === 'completed') {
              toast({ title: `✅ ${topicLabel}`, description: 'Generation complete!' });
            } else if (r.status === 'interrupted') {
              toast({
                title: `⚠️ ${topicLabel}`,
                description: 'Pipeline interrupted',
                variant: 'destructive',
              });
            } else {
              toast({
                title: `❌ ${topicLabel}`,
                description: r.error || 'Failed',
                variant: 'destructive',
              });
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
      setRunningRunIds((prev) => new Set(prev).add(data.runId));
      setActiveTab('results');
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
      setRunningRunIds((prev) => new Set(prev).add(data.runId));
      toast({ title: '🔧 Step Started', description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handlePipelineRun = (pipelineConfig: PipelineConfig) => {
    if (!channel) return;
    // Batch mode: launch all topics in parallel
    if (batchMode && batchTopics.split('\n').filter((t) => t.trim()).length > 0) {
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
      assemblyTextOverlay: pipelineConfig.assembly.textOverlay,
      assemblyPanZoom: pipelineConfig.assembly.panZoom,
      assemblyFps: pipelineConfig.assembly.fps,
      assemblyFadeInOut: pipelineConfig.assembly.fadeInOut,
      assemblyTransitionDuration: pipelineConfig.assembly.transitionDuration,
      assemblyScenePadding: pipelineConfig.assembly.scenePadding,
      assemblyWatermarkUrl: pipelineConfig.assembly.watermarkUrl || undefined,
    };
    if (mode === 'topic' && topic.trim()) {
      req.topic = topic.trim();
    } else if (mode === 'transcript' && transcript) {
      req.transcript = transcript;
    } else if (activeRun?.input?.topic) {
      req.topic = activeRun.input.topic;
    } else if (activeRun?.input?.transcript) {
      req.transcript = activeRun.input.transcript;
    } else {
      toast({
        title: 'Missing Input',
        description: 'Enter a topic or select a transcript',
        variant: 'destructive',
      });
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
      assemblyTextOverlay: pipelineConfig.assembly.textOverlay,
      assemblyPanZoom: pipelineConfig.assembly.panZoom,
      assemblyFps: pipelineConfig.assembly.fps,
      assemblyFadeInOut: pipelineConfig.assembly.fadeInOut,
      assemblyTransitionDuration: pipelineConfig.assembly.transitionDuration,
      assemblyScenePadding: pipelineConfig.assembly.scenePadding,
      assemblyWatermarkUrl: pipelineConfig.assembly.watermarkUrl || undefined,
    };
    // Step re-run: prioritize the activeRun's topic (the run we're re-running)
    // over the input field which may contain a stale/different topic
    if (activeRun?.input?.topic) {
      req.topic = activeRun.input.topic;
    } else if (activeRun?.input?.transcript) {
      req.transcript = activeRun.input.transcript;
    } else if (mode === 'topic' && topic.trim()) {
      req.topic = topic.trim();
    } else if (mode === 'transcript' && transcript) {
      req.transcript = transcript;
    } else {
      toast({
        title: 'Missing Input',
        description: 'Enter a topic or select a transcript',
        variant: 'destructive',
      });
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
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (topics.length === 0) {
      toast({
        title: 'No topics',
        description: 'Enter one topic per line',
        variant: 'destructive',
      });
      return;
    }
    setBatchLaunching(true);
    toast({
      title: `🚀 Launching ${topics.length} topics...`,
      description: 'Starting parallel generation',
    });
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
        assemblyTextOverlay: pipelineConfig.assembly.textOverlay,
        assemblyPanZoom: pipelineConfig.assembly.panZoom,
        assemblyFps: pipelineConfig.assembly.fps,
        assemblyFadeInOut: pipelineConfig.assembly.fadeInOut,
        assemblyTransitionDuration: pipelineConfig.assembly.transitionDuration,
        assemblyScenePadding: pipelineConfig.assembly.scenePadding,
        assemblyWatermarkUrl: pipelineConfig.assembly.watermarkUrl || undefined,
      };
      try {
        const data = await youtubeChannelsService.generate(req);
        setRunningRunIds((prev) => new Set(prev).add(data.runId));
        if (i === 0) setActiveRunId(data.runId);
      } catch (err) {
        toast({
          title: `❌ Topic ${i + 1} failed to start`,
          description: (err as Error).message,
          variant: 'destructive',
        });
      }
      // Small delay between launches to stagger API calls
      if (i < topics.length - 1) await new Promise((r) => setTimeout(r, 500));
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

  // Filter runs for this channel only, sorted newest-first
  const channelRuns = (runsData?.runs?.filter((r) => r.channelId === channelId) || []).sort(
    (a, b) => b.startedAt.localeCompare(a.startedAt)
  );

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-4 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/admin/youtube-channels">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl border min-w-0"
            style={{
              borderColor: channel.color + '40',
              background: channel.bgGradient ? undefined : channel.color + '08',
            }}
          >
            <span className="text-3xl lg:text-4xl shrink-0">{channel.avatar}</span>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight truncate">
                {channel.name}
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">{channel.tagline}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 ${
              channel.status === 'ready'
                ? 'border-green-500 text-green-500'
                : channel.status === 'planned'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-purple-500 text-purple-500'
            }`}
          >
            {channel.status === 'ready' ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : channel.status === 'planned' ? (
              <Clock className="h-3 w-3 mr-1" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Knowledge stats — hidden on mobile, visible on lg */}
          <div className="hidden lg:flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1" title="Knowledge books">
              📚 {channel.knowledge.books}
            </span>
            <span className="flex items-center gap-1" title="Transcripts">
              📝 {channel.knowledge.transcripts}
            </span>
            <span className="flex items-center gap-1" title="Agents">
              🤖 {channel.resources.agents}
            </span>
            {channel.knowledge.voiceDNA && (
              <span className="flex items-center gap-1 text-green-500" title="Voice DNA trained">
                🎤 DNA
              </span>
            )}
          </div>
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
              title="Channel readiness score"
            >
              <span className="text-muted-foreground">Score</span>
              <span className="font-bold" style={{ color: channel.color }}>
                {channel.score}/{channel.maxScore}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowApiKeyDialog(true)}
            >
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Key Pool</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {getPool().filter((e) => !e.disabled).length || 'env'}
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
                <p className="font-medium">
                  {runningRunIds.size} run{runningRunIds.size > 1 ? 's' : ''} active
                </p>
              </div>
              {runningRunIds.size > 1 && (
                <Badge variant="outline" className="animate-pulse">
                  PARALLEL
                </Badge>
              )}
            </div>
            <div
              className={`grid gap-2 ${runningRunIds.size === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
            >
              {channelRuns
                .filter((r) => runningRunIds.has(r.id) && r.status === 'running')
                .map((run) => {
                  const completedCount = run.completedSteps?.length || 0;
                  const totalSteps = run.pipelineSteps?.length || 4;
                  const pct = Math.round((completedCount / totalSteps) * 100);
                  return (
                    <div key={run.id} className="rounded-lg border bg-card p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[70%]">
                          {run.input?.topic || run.input?.transcript || 'Run'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[11px] px-1.5"
                          onClick={() => {
                            setActiveRunId(run.id);
                            setActiveTab('results');
                          }}
                        >
                          <Eye className="h-3 w-3 mr-0.5" /> View
                        </Button>
                      </div>
                      <Progress value={pct || 10} className="h-1.5" />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {completedCount}/{totalSteps} steps
                        </span>
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
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6"
        style={{ minHeight: 'calc(100vh - 280px)' }}
      >
        {/* Left sidebar: Input Source */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
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
                  className="flex-1 font-medium"
                  onClick={() => setMode('topic')}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Topic
                </Button>
                <Button
                  variant={mode === 'transcript' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 font-medium"
                  onClick={() => setMode('transcript')}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Transcript
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
                        placeholder={
                          'Mỗi dòng = 1 topic chạy song song\n\nVí dụ:\nBí mật thẻ tín dụng\nCách tiết kiệm 50% thu nhập\n10 sai lầm đầu tư chứng khoán'
                        }
                        className="resize-none h-40 text-sm font-mono"
                        value={batchTopics}
                        onChange={(e) => setBatchTopics(e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {batchTopics.split('\n').filter((t) => t.trim()).length} topics
                        </span>
                        {batchTopics.split('\n').filter((t) => t.trim()).length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-orange-500 border-orange-500"
                          >
                            Sẽ chạy song song
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <Textarea
                      placeholder="e.g. Bí mật thẻ tín dụng — đòn bẩy hay bẫy nợ?"
                      className="resize-none h-28 text-sm"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
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
                          className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/80 text-xs transition-colors ${
                            transcript === t.id
                              ? 'bg-primary/15 border border-primary/40 ring-1 ring-primary/20'
                              : ''
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
                        <span>
                          {pl.icon} {pl.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {pl.episodes} ep
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Pipeline + Results */}
        <div className="lg:col-span-9">
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
              <TabsTrigger value="costs" className="gap-2">
                <DollarSign className="h-4 w-4" /> Costs
              </TabsTrigger>
            </TabsList>

            {/* ── Generate Tab ── */}
            <TabsContent value="generate">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Generation Pipeline
                        {activeRun?.input?.topic && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal max-w-[260px] truncate"
                          >
                            {activeRun.episodeNumber ? `Tập ${activeRun.episodeNumber} — ` : ''}{activeRun.input.topic}
                          </Badge>
                        )}
                        {!activeRunId && topic.trim() && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal text-green-600 border-green-500"
                          >
                            New Topic
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Cấu hình từng bước trước khi chạy. Bật/tắt step và tùy chỉnh settings.
                      </CardDescription>
                    </div>
                  </div>
                  {/* ── Per-topic Run Selector ── */}
                  {channelRuns.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <Button
                        variant={!activeRunId ? 'default' : 'ghost'}
                        size="sm"
                        className="h-6 text-[10px] px-2 gap-1"
                        onClick={() => setActiveRunId(null)}
                      >
                        <Plus className="h-3 w-3" /> New
                      </Button>
                      <Separator orientation="vertical" className="h-4" />
                      {channelRuns.slice(0, 4).map((run) => {
                        const isActive = activeRunId === run.id;
                        const isRunning = runningRunIds.has(run.id);
                        const epPrefix = run.episodeNumber ? `T${run.episodeNumber}. ` : '';
                        const label =
                          epPrefix + (run.input?.topic?.slice(0, 24) ||
                          run.input?.transcript?.slice(0, 18) ||
                          run.id.slice(0, 8));
                        return (
                          <Button
                            key={run.id}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              'h-6 text-[10px] px-2 gap-1 max-w-[180px]',
                              isRunning &&
                                !isActive &&
                                'border-blue-400 text-blue-600 animate-pulse'
                            )}
                            onClick={() => {
                              setActiveRunId(run.id);
                              // Sync topic so re-runs target correct topic
                              if (run.input?.topic) {
                                setTopic(run.input.topic);
                                setMode('topic');
                              } else if (run.input?.transcript) {
                                setTranscript(run.input.transcript);
                                setMode('transcript');
                              }
                            }}
                          >
                            {isRunning ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : run.status === 'completed' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : run.status === 'failed' ? (
                              <XCircle className="h-3 w-3 text-red-500" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span className="truncate">{label}</span>
                          </Button>
                        );
                      })}
                      {channelRuns.length > 4 && (
                        <Select
                          value=""
                          onValueChange={(runId) => {
                            setActiveRunId(runId);
                            const run = channelRuns.find((r) => r.id === runId);
                            if (run?.input?.topic) {
                              setTopic(run.input.topic);
                              setMode('topic');
                            } else if (run?.input?.transcript) {
                              setTranscript(run.input.transcript);
                              setMode('transcript');
                            }
                          }}
                        >
                          <SelectTrigger className="h-6 text-[10px] w-auto px-2 gap-1 border-dashed">
                            <span>+{channelRuns.length - 4} more</span>
                          </SelectTrigger>
                          <SelectContent>
                            {channelRuns.slice(4).map((run) => (
                              <SelectItem key={run.id} value={run.id} className="text-xs">
                                {run.status === 'completed'
                                  ? '✅'
                                  : run.status === 'failed'
                                    ? '❌'
                                    : '⏳'}{' '}
                                {run.episodeNumber ? `T${run.episodeNumber}. ` : ''}{run.input?.topic?.slice(0, 35) || run.id.slice(0, 8)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <PipelineRoadmap
                    channelId={channel.id}
                    channelStyle={channel.style}
                    onRun={handlePipelineRun}
                    onRunStep={handlePipelineStepRun}
                    onResume={() => resumeMut.mutate()}
                    isRunning={
                      generateMut.isPending ||
                      stepMut.isPending ||
                      resumeMut.isPending ||
                      batchLaunching
                    }
                    parallelCount={runningRunIds.size}
                    batchCount={
                      batchMode ? batchTopics.split('\n').filter((t) => t.trim()).length : 0
                    }
                    activeRun={
                      activeRun
                        ? {
                            status: activeRun.status,
                            logs: activeRun.logs,
                            error: activeRun.error,
                            result: activeRun.result,
                            completedSteps: activeRun.completedSteps,
                            pipelineSteps: activeRun.pipelineSteps,
                          }
                        : undefined
                    }
                    onVoiceConfigChange={(u) => setVoiceConfig((prev) => ({ ...prev, ...u }))}
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
                    <CardDescription>
                      {new Set(channelRuns.map((r) => r.input?.topic || r.input?.transcript)).size} tập
                      {' • '}
                      {channelRuns.length} runs for this channel
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => refetchRuns()}
                    aria-label="Refresh runs"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {channelRuns.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <Layers className="h-12 w-12 mx-auto text-muted-foreground/30" />
                        <p className="text-muted-foreground">No runs yet for {channel.name}</p>
                        <p className="text-xs text-muted-foreground/60">
                          Enter a topic and click Generate to start your first video pipeline
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('generate')}
                        >
                          <Zap className="h-4 w-4 mr-1" /> Go to Pipeline
                        </Button>
                      </div>
                    ) : (
                      (() => {
                        // Group runs by topic for clear visual separation
                        const groups = new Map<string, typeof channelRuns>();
                        for (const run of channelRuns) {
                          const key = run.input?.topic || run.input?.transcript || 'Unknown';
                          if (!groups.has(key)) groups.set(key, []);
                          groups.get(key)!.push(run);
                        }

                        // Sort by episode number (or first creation time), assign fallback numbers
                        const sorted = Array.from(groups.entries())
                          .map(([topicKey, topicRuns]) => {
                            const ep = topicRuns[0].episodeNumber;
                            const oldest = topicRuns.reduce(
                              (min, r) => (r.startedAt < min ? r.startedAt : min),
                              topicRuns[0].startedAt
                            );
                            return { topicKey, runs: topicRuns, ep, firstCreated: oldest };
                          })
                          .sort((a, b) => a.firstCreated.localeCompare(b.firstCreated));

                        // Assign fallback episode numbers for runs without one
                        let nextFallback = 1;
                        const numbered = sorted.map((g) => {
                          const epNum = g.ep || nextFallback;
                          nextFallback = Math.max(nextFallback, epNum) + 1;
                          return { ...g, ep: epNum };
                        });

                        // Display newest first (but episode numbers stay chronological)
                        numbered.reverse();

                        return numbered.map(({ topicKey, runs, ep }) => (
                          <div key={topicKey} className="space-y-1.5">
                            <div className="flex items-center gap-2 px-1">
                              <Badge className="text-[10px] shrink-0 bg-purple-600/80 hover:bg-purple-600 text-white font-mono px-1.5">
                                Tập {ep}
                              </Badge>
                              <span
                                className="text-xs font-semibold text-muted-foreground truncate max-w-[50%]"
                                title={topicKey}
                              >
                                📌 {topicKey.length > 55 ? topicKey.slice(0, 52) + '...' : topicKey}
                              </span>
                              <Separator className="flex-1" />
                              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                                {new Date(runs[0].startedAt).toLocaleDateString('vi-VN')}
                              </span>
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {runs.length} run{runs.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {runs.map((run) => (
                              <RunCard
                                key={run.id}
                                run={run}
                                onView={() => {
                                  setActiveRunId(run.id);
                                  setActiveTab('results');
                                  // Sync topic field so re-runs target the correct topic
                                  if (run.input?.topic) {
                                    setTopic(run.input.topic);
                                    setMode('topic');
                                  } else if (run.input?.transcript) {
                                    setTranscript(run.input.transcript);
                                    setMode('transcript');
                                  }
                                }}
                                onDelete={() => {
                                  youtubeChannelsService.deleteRun(run.id);
                                  if (activeRunId === run.id) setActiveRunId(null);
                                  refetchRuns();
                                }}
                              />
                            ))}
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Results Tab — synced with Pipeline config ── */}
            <TabsContent value="results">
              {activeRun?.result ? (
                <ResultsView
                  run={activeRun}
                  onRunImageGen={() => {
                    const cfg = getSavedPipelineConfig();
                    handlePipelineStepRun('imageGen', {
                      ...cfg,
                      imageGen: { ...cfg.imageGen, enabled: true },
                      voiceover: {
                        ...cfg.voiceover,
                        enabled: false,
                        engine: voiceConfig.engine,
                        voice: voiceConfig.voice,
                        speed: voiceConfig.speed,
                      },
                      assembly: { ...cfg.assembly, enabled: false },
                    });
                  }}
                  onRunVoiceover={() => {
                    const cfg = getSavedPipelineConfig();
                    handlePipelineStepRun('voiceover', {
                      ...cfg,
                      imageGen: { ...cfg.imageGen, enabled: false },
                      voiceover: {
                        ...cfg.voiceover,
                        enabled: true,
                        engine: voiceConfig.engine,
                        voice: voiceConfig.voice,
                        speed: voiceConfig.speed,
                        cleanedScript: voiceConfig.cleanedScript,
                      },
                      assembly: { ...cfg.assembly, enabled: false },
                    });
                  }}
                  onRunAssembly={() => {
                    const cfg = getSavedPipelineConfig();
                    handlePipelineStepRun('assembly', {
                      ...cfg,
                      imageGen: { ...cfg.imageGen, enabled: false },
                      voiceover: {
                        ...cfg.voiceover,
                        enabled: false,
                        engine: voiceConfig.engine,
                        voice: voiceConfig.voice,
                        speed: voiceConfig.speed,
                      },
                      assembly: { ...cfg.assembly, enabled: true },
                    });
                  }}
                  isGenerating={stepMut.isPending || activeRun?.status === 'running'}
                  voiceoverConfig={voiceConfig}
                  onVoiceoverConfigChange={(u) => setVoiceConfig((prev) => ({ ...prev, ...u }))}
                  onOpenKeyPool={() => setShowApiKeyDialog(true)}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <Eye className="h-12 w-12 mx-auto text-muted-foreground/20" />
                    <p className="text-muted-foreground font-medium">No results to display</p>
                    <p className="text-xs text-muted-foreground/60">
                      {channelRuns.length > 0
                        ? 'Select a run from the History tab or Pipeline to view its results'
                        : 'Run a generation from the Pipeline tab to see results here'}
                    </p>
                    {channelRuns.length === 0 && (
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('generate')}>
                        <Zap className="h-4 w-4 mr-1" /> Go to Pipeline
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Cost Statistics Tab ── */}
            <TabsContent value="costs">
              <CostDashboard channelId={channel?.id} />
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
              Add multiple API keys for round-robin rotation. Keys auto-disable after 3 consecutive
              errors. Get keys from{' '}
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
  // key status: 'testing' | 'ok' | error string
  const [keyStatus, setKeyStatus] = useState<Record<string, string>>({});
  const [pins, setPins] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('pipeline-api-key-pinned') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const unsub = onPoolChange(() => {
      setPool(getPool());
      try {
        setPins(JSON.parse(localStorage.getItem('pipeline-api-key-pinned') || '{}'));
      } catch {}
    });
    return unsub;
  }, []);

  const handlePin = (engine: string, key: string) => {
    if (pins[engine] === key) {
      unpinKey(engine);
    } else {
      pinKey(engine, key);
    }
  };

  const statusKey = (engine: string, key: string) => `${engine}::${key}`;

  const runTest = async (engine: string, key: string) => {
    const sk = statusKey(engine, key);
    setKeyStatus((prev) => ({ ...prev, [sk]: 'testing' }));
    const result = await testKey(engine, key);
    setKeyStatus((prev) => ({ ...prev, [sk]: result.ok ? 'ok' : result.error || 'Invalid' }));
    if (!result.ok) {
      disableKey(engine, key, result.error);
    } else {
      enableKey(engine, key);
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    const key = newKey.trim();
    const engine = newEngine;
    addKey(engine, key, newLabel.trim() || undefined);
    setNewKey('');
    setNewLabel('');
    // Auto-test the new key
    await runTest(engine, key);
  };

  const handleTestAll = async () => {
    const current = getPool();
    for (const entry of current) {
      await runTest(entry.engine, entry.key);
    }
  };

  const mask = (key: string) => key.slice(0, 6) + '...' + key.slice(-4);

  const engineKeys = (engine: string) => pool.filter((e) => e.engine === engine);
  const hasKeys = pool.length > 0;

  const statusBadge = (engine: string, key: string) => {
    const sk = statusKey(engine, key);
    const s = keyStatus[sk];
    if (!s) return null;
    if (s === 'testing')
      return (
        <Badge
          variant="outline"
          className="text-[10px] h-4 border-blue-500/40 text-blue-400 animate-pulse"
        >
          Testing...
        </Badge>
      );
    if (s === 'ok')
      return (
        <Badge variant="outline" className="text-[10px] h-4 border-green-500/40 text-green-400">
          ✓ OK
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-[10px] h-4 border-red-500/40 text-red-400 max-w-[120px] truncate"
        title={s}
      >
        ✗ {s.length > 20 ? s.slice(0, 20) + '…' : s}
      </Badge>
    );
  };

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
              {ENGINE_OPTIONS.map((e) => (
                <SelectItem key={e.value} value={e.value} className="text-xs">
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-8 text-xs flex-1"
            type="password"
            placeholder={ENGINE_OPTIONS.find((e) => e.value === newEngine)?.placeholder}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Input
            className="h-8 text-xs flex-1"
            placeholder="Label (optional, e.g. 'Key #1 - Free tier')"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
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

      {ENGINE_OPTIONS.map((eng) => {
        const keys = engineKeys(eng.value);
        if (keys.length === 0) return null;
        return (
          <div key={eng.value} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {eng.label} ({keys.length} key{keys.length > 1 ? 's' : ''})
            </Label>
            {keys.map((entry) => (
              <div
                key={entry.key}
                className={`flex items-center gap-2 rounded border p-2 text-xs ${entry.disabled ? 'opacity-50 bg-red-500/5' : ''}`}
              >
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${entry.disabled ? 'bg-red-500' : keyStatus[statusKey(eng.value, entry.key)] === 'ok' ? 'bg-green-500' : 'bg-green-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">{mask(entry.key)}</span>
                    {entry.label && <span className="text-muted-foreground">{entry.label}</span>}
                    {statusBadge(eng.value, entry.key)}
                  </div>
                  <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span>Used: {entry.usageCount}x</span>
                    {entry.lastError && (
                      <span className="text-red-400 truncate max-w-[180px]" title={entry.lastError}>
                        Err: {entry.lastError}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={pins[eng.value] === entry.key ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-6 px-2 text-[11px] ${pins[eng.value] === entry.key ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-muted-foreground'}`}
                  onClick={() => handlePin(eng.value, entry.key)}
                  title={pins[eng.value] === entry.key ? 'Bỏ ghim key này' : 'Áp dụng key này'}
                >
                  {pins[eng.value] === entry.key ? '📌 Đang dùng' : '📌 Áp dụng'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-blue-400 hover:text-blue-300"
                  onClick={() => runTest(eng.value, entry.key)}
                  title="Test key"
                >
                  <Zap className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    entry.disabled
                      ? enableKey(eng.value, entry.key)
                      : disableKey(eng.value, entry.key)
                  }
                  title={entry.disabled ? 'Enable' : 'Disable'}
                >
                  {entry.disabled ? (
                    <ToggleLeft className="h-3.5 w-3.5" />
                  ) : (
                    <ToggleRight className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-400 hover:text-red-500"
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleTestAll}>
            <Zap className="h-3 w-3 mr-1" /> Test All
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={resetStats}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset Stats
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── COST DASHBOARD ───────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  scriptWriter: '✍️ Script Writer',
  storyboard: '🎬 Storyboard',
  imageGen: '🖼️ Image Gen',
  voiceover: '🎤 Voiceover',
  assembly: '🎥 Assembly',
  aiSceneGen: '✨ AI Scene Gen',
  missingImageGen: '🖼️ Missing Image Gen',
};

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  image: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  tts: 'bg-green-500/20 text-green-400 border-green-500/30',
  video: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function CostDashboard({ channelId }: { channelId?: string }) {
  const [filter, setFilter] = useState<'all' | 'channel'>(channelId ? 'channel' : 'all');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [, setTick] = useState(0);

  // Force re-render to pick up latest data
  const refresh = () => setTick((t) => t + 1);

  // Backfill costs from existing runs on first mount (filter by channel if available)
  useEffect(() => {
    const allRuns = getAllRuns();
    const runs = channelId ? allRuns.filter((r) => r.channelId === channelId) : allRuns;
    const added = backfillFromRuns(runs);
    if (added > 0) refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const now = Date.now();
  const fromDate =
    timeRange === 'today'
      ? new Date().setHours(0, 0, 0, 0)
      : timeRange === '7d'
        ? now - 7 * 86400000
        : timeRange === '30d'
          ? now - 30 * 86400000
          : undefined;

  const summary = getCostSummary({
    channelId: filter === 'channel' ? channelId : undefined,
    fromDate,
  });

  const entries = getCostEntries({
    channelId: filter === 'channel' ? channelId : undefined,
    fromDate,
  });

  // Sort by day descending for chart
  const dayEntries = Object.entries(summary.byDay).sort((a, b) => b[0].localeCompare(a[0]));
  const maxDayCost = Math.max(...dayEntries.map(([, v]) => v.cost), 0.001);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Chi phí API Pipeline
            </CardTitle>
            <CardDescription className="text-xs">
              Theo dõi chi phí AI API calls: Image Gen, TTS, Script Writer, Storyboard
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger className="h-7 text-xs w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="7d">7 ngày</SelectItem>
                <SelectItem value="30d">30 ngày</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
            {channelId && (
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-7 text-xs w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="channel">Channel này</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={refresh}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Tổng chi phí
            </p>
            <p className="text-2xl font-bold text-green-500">${summary.totalCost.toFixed(4)}</p>
            <p className="text-[11px] text-muted-foreground">{summary.totalCalls} API calls</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">🖼️ Image Gen</p>
            <p className="text-lg font-bold text-purple-400">
              ${(summary.byType.image?.cost || 0).toFixed(4)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {summary.byType.image?.count || 0} images
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">🎤 TTS</p>
            <p className="text-lg font-bold text-green-400">
              ${(summary.byType.tts?.cost || 0).toFixed(4)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {summary.byType.tts?.count || 0} calls
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">📝 Text Gen</p>
            <p className="text-lg font-bold text-blue-400">
              ${(summary.byType.text?.cost || 0).toFixed(4)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {summary.byType.text?.count || 0} calls
            </p>
          </div>
        </div>

        {/* ── Cost by Step ── */}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium mb-2 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" /> Chi phí theo Step
          </p>
          <div className="space-y-1.5">
            {Object.entries(summary.byStep)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([step, data]) => (
                <div key={step} className="flex items-center gap-2 text-xs">
                  <span className="w-[160px] truncate">{STEP_LABELS[step] || step}</span>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500/60 to-green-500/30 rounded transition-all"
                      style={{
                        width: `${Math.max(2, (data.cost / Math.max(summary.totalCost, 0.001)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-[70px] text-right font-mono text-muted-foreground">
                    ${data.cost.toFixed(4)}
                  </span>
                  <span className="w-[40px] text-right text-muted-foreground">{data.count}×</span>
                </div>
              ))}
            {Object.keys(summary.byStep).length === 0 && (
              <p className="text-center text-muted-foreground py-2 text-xs">
                Chưa có dữ liệu cost. Chạy pipeline để bắt đầu tracking.
              </p>
            )}
          </div>
        </div>

        {/* ── Cost by Model ── */}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium mb-2">💰 Chi phí theo Model</p>
          <div className="space-y-1.5">
            {Object.entries(summary.byModel)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([model, data]) => {
                const rate = COST_RATES[model];
                return (
                  <div key={model} className="flex items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] w-[160px] justify-center truncate',
                        TYPE_COLORS[rate?.type || 'text']
                      )}
                    >
                      {model}
                    </Badge>
                    <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500/60 to-purple-500/30 rounded transition-all"
                        style={{
                          width: `${Math.max(2, (data.cost / Math.max(summary.totalCost, 0.001)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-[70px] text-right font-mono text-muted-foreground">
                      ${data.cost.toFixed(4)}
                    </span>
                    <span className="w-[40px] text-right text-muted-foreground">{data.count}×</span>
                    {rate && (
                      <span className="w-[120px] text-[10px] text-muted-foreground truncate">
                        {rate.note}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── Daily Cost Chart ── */}
        {dayEntries.length > 0 && (
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium mb-2">📅 Chi phí theo ngày</p>
            <div className="space-y-1">
              {dayEntries.slice(0, 14).map(([day, data]) => (
                <div key={day} className="flex items-center gap-2 text-xs">
                  <span className="w-[80px] font-mono text-muted-foreground">{day.slice(5)}</span>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500/60 to-orange-500/40 rounded transition-all"
                      style={{ width: `${(data.cost / maxDayCost) * 100}%` }}
                    />
                  </div>
                  <span className="w-[60px] text-right font-mono text-muted-foreground">
                    ${data.cost.toFixed(4)}
                  </span>
                  <span className="w-[35px] text-right text-muted-foreground">{data.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Entries ── */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium">📋 Gần đây nhất ({entries.length} entries)</p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px]"
                onClick={() => {
                  const json = exportCostData();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pipeline-costs-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: '✅ Exported', description: 'Cost data saved as JSON' });
                }}
              >
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-red-400"
                onClick={() => {
                  if (confirm('Xóa tất cả cost data?')) {
                    clearCostData();
                    refresh();
                  }
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[240px]">
            <div className="space-y-0.5">
              {entries
                .slice()
                .reverse()
                .slice(0, 100)
                .map((entry: CostEntry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 text-[11px] py-1 border-b border-muted/30"
                  >
                    <span className="w-[52px] text-muted-foreground font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString('vi', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-[8px] px-1 h-4', TYPE_COLORS[entry.type])}
                    >
                      {entry.type}
                    </Badge>
                    <span className="w-[110px] truncate">
                      {STEP_LABELS[entry.step] || entry.step}
                    </span>
                    <span className="flex-1 truncate text-muted-foreground">
                      {entry.detail || entry.model}
                    </span>
                    <span className="w-[60px] text-right font-mono font-medium">
                      ${entry.cost.toFixed(4)}
                    </span>
                  </div>
                ))}
              {entries.length === 0 && (
                <p className="text-center text-muted-foreground py-6 text-xs">
                  Chưa có cost data. Pipeline sẽ tự động track khi bạn chạy AI.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── Pricing Reference ── */}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium mb-2">📊 Bảng giá tham khảo</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(COST_RATES).map(([key, rate]) => (
              <div key={key} className="flex items-center justify-between text-[11px] py-0.5">
                <span className="truncate">{rate.model}</span>
                <span className="font-mono text-muted-foreground ml-2">
                  {rate.costPerUnit === 0 ? 'FREE' : `$${rate.costPerUnit}/${rate.unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── RUN CARD ─────────────────────────────────────────────

function RunCard({
  run,
  onView,
  onDelete,
}: {
  run: GenerationRun;
  onView: () => void;
  onDelete?: () => void;
}) {
  const statusColor =
    run.status === 'completed'
      ? 'text-green-500'
      : run.status === 'failed'
        ? 'text-red-500'
        : 'text-blue-500';
  const StatusIcon =
    run.status === 'completed' ? CheckCircle2 : run.status === 'failed' ? XCircle : Loader2;
  const stepIcons: Record<string, string> = {
    scriptWriter: '✍️',
    storyboard: '🎬',
    imageGen: '🖼️',
    voiceover: '🎤',
    assembly: '🎥',
  };
  const stepsLabel = run.completedSteps?.length
    ? run.completedSteps.map((s) => stepIcons[s] || s).join(' → ')
    : run.pipelineSteps?.map((s) => stepIcons[s] || s).join(' → ') || '';

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={onView}
    >
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon
          className={`h-5 w-5 shrink-0 ${statusColor} ${run.status === 'running' ? 'animate-spin' : ''}`}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(run.startedAt).toLocaleString('vi-VN')}
            </span>
            {run.durationMs && (
              <span className="flex items-center gap-1 text-blue-400">
                <Zap className="h-3 w-3" />
                {(run.durationMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          {stepsLabel && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{stepsLabel}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {run.status === 'failed' && run.error && (
          <span
            className="text-[10px] text-red-400 max-w-[150px] truncate hidden sm:inline"
            title={run.error}
          >
            {run.error.slice(0, 40)}
          </span>
        )}
        {(run.result || run.hasResult) && (
          <Badge variant="outline" className="text-green-500 text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Output
          </Badge>
        )}
        {onDelete && run.status !== 'running' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete run"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// ─── VOICE TAB (FULL-FEATURED) ────────────────────────────

type VoiceoverClip = {
  scene: number;
  url: string;
  duration: number;
  charCount: number;
  engine: string;
};
type VoiceoverData = {
  clips?: VoiceoverClip[];
  totalClips?: number;
  successCount?: number;
  failCount?: number;
  totalDuration?: number;
  engine?: string;
  voice?: string;
  speed?: number;
  fullAudioUrl?: string;
  archivedAt?: string;
};
type StoryboardData = {
  scenes?: {
    scene: number;
    dialogue: string;
    prompt: string;
    motion: string;
    transition: string;
  }[];
};

function VoiceTabContent({
  run,
  voiceoverJson,
  voiceoverHistory,
  storyboardJson,
  scriptTxt,
  voiceoverConfig,
  onVoiceoverConfigChange,
  onRunVoiceover,
  isGenerating,
  onOpenKeyPool,
}: {
  run: GenerationRun;
  voiceoverJson?: VoiceoverData;
  voiceoverHistory?: VoiceoverData[];
  storyboardJson?: StoryboardData;
  scriptTxt?: string;
  voiceoverConfig?: { engine: string; voice: string; speed: number; cleanedScript?: string };
  onVoiceoverConfigChange?: (
    u: Partial<{ engine: string; voice: string; speed: number; cleanedScript?: string }>
  ) => void;
  onRunVoiceover?: () => void;
  isGenerating?: boolean;
  onOpenKeyPool?: () => void;
}) {
  const engine = voiceoverConfig?.engine || 'gemini-tts';
  const [regeneratingScene, setRegeneratingScene] = useState<number | null>(null);
  const [downloadingVoices, setDownloadingVoices] = useState(false);
  const isElevenLabs = engine === 'elevenlabs';
  const isGemini = engine === 'gemini-tts';

  // ── TTS Script Optimizer ──
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizedScript, setOptimizedScript] = useState<string | null>(
    voiceoverConfig?.cleanedScript || null
  );
  const [optimizerError, setOptimizerError] = useState<string | null>(null);
  const [showOptimized, setShowOptimized] = useState(!!voiceoverConfig?.cleanedScript);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState<number | null>(null);

  // When viewing a history version, override the displayed voiceover data
  const displayVoiceover =
    selectedHistoryIdx !== null && voiceoverHistory?.[selectedHistoryIdx]
      ? voiceoverHistory[selectedHistoryIdx]
      : voiceoverJson;

  const handleRestoreVersion = (idx: number) => {
    if (!voiceoverHistory?.[idx]) return;
    const version = voiceoverHistory[idx];
    // Swap: current → push to history, selected version → becomes current
    const currentData = run.result?.files?.['voiceover.json'] as VoiceoverData | undefined;
    const history = [...(voiceoverHistory || [])];
    if (currentData?.clips) {
      // Replace the selected version in history with the current one
      history[idx] = { ...currentData, archivedAt: new Date().toISOString() };
    } else {
      // No current data, just remove from history
      history.splice(idx, 1);
    }
    // Set restored version as current
    updateRunFile(run.id, 'voiceover.json', version);
    updateRunFile(run.id, 'voiceover-history.json', history);
    setSelectedHistoryIdx(null);
    // Force re-render by touching the run object
    if (run.result?.files) {
      run.result.files['voiceover.json'] = version;
      run.result.files['voiceover-history.json'] = history;
    }
  };

  const handleOptimizeForTTS = async () => {
    if (!scriptTxt?.trim()) return;
    setOptimizerLoading(true);
    setOptimizerError(null);
    try {
      const apiKey = getNextKey('gemini');
      if (!apiKey)
        throw new Error(
          'No Gemini key available — add keys to Key Pool hoặc set VITE_GEMINI_API_KEY'
        );
      const scriptText = scriptTxt.length > 8000 ? scriptTxt.substring(0, 8000) : scriptTxt;
      const systemPrompt = `Trích xuất phần lời đọc (narration/voice) từ script video dưới đây.\n\nQuy tắc:\n- CHỈ giữ lại phần narrator sẽ đọc thành lời\n- BỎ: tiêu đề, heading, stage directions (VD: [B-roll], [cắt cảnh]), markdown (# ** * []()), emoji, ghi chú kỹ thuật\n- GIỮ NGUYÊN câu từ gốc — không viết lại, không thêm bớt ý\n- Trả về plain text, mỗi đoạn cách 1 dòng trống`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `Trích voice từ script:\n\n${scriptText}` }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } })?.error?.message || `Gemini error ${res.status}`
        );
      }
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!text) throw new Error('AI trả về rỗng');
      setOptimizedScript(text);
      setShowOptimized(true);
      // Auto-apply to voiceConfig so it's saved to localStorage immediately
      if (onVoiceoverConfigChange) {
        onVoiceoverConfigChange({ cleanedScript: text } as never);
      }
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

  // Auto-generate Vietnamese preview when voice changes (cached in localStorage)
  // Works for both ElevenLabs and Gemini TTS
  useEffect(() => {
    const isEL = voiceoverConfig?.engine === 'elevenlabs';
    const isGem = voiceoverConfig?.engine === 'gemini-tts';
    if ((!isEL && !isGem) || !voiceoverConfig?.voice) {
      if (previewUrl && !previewUrl.startsWith('data:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewError(null);
      return;
    }
    if (previewAudioRef.current) previewAudioRef.current.pause();

    const cacheKey = `voice-preview-vi-${voiceoverConfig.engine}__${voiceoverConfig.voice}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setPreviewUrl(cached);
        setPreviewError(null);
        setPreviewLoading(false);
        setTimeout(() => previewAudioRef.current?.play().catch(() => {}), 150);
        return;
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);

    const sampleText =
      'Xin chào, đây là giọng đọc mẫu bằng tiếng Việt. Bạn có thể nghe thử trước khi chọn.';

    const generatePreview = async (): Promise<Blob> => {
      if (isGem) {
        const apiKey = getNextKey('gemini');
        if (!apiKey) throw new Error('No Gemini key — add keys to Key Pool');
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: sampleText }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceoverConfig.voice || 'Kore' },
                  },
                },
              },
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: { message?: string } })?.error?.message ||
              `Gemini TTS error ${res.status}`
          );
        }
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const audioPart = parts.find((p: { inlineData?: { mimeType?: string } }) =>
          p.inlineData?.mimeType?.startsWith('audio/')
        );
        if (!audioPart) throw new Error('No audio returned');
        const b64 = audioPart.inlineData.data as string;
        const byteChars = atob(b64);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const mime = (audioPart.inlineData.mimeType as string) || '';
        if (mime.includes('L16') || mime.includes('pcm') || mime.includes('raw')) {
          const sampleRate = 24000;
          const wavHeader = new ArrayBuffer(44);
          const view = new DataView(wavHeader);
          const writeStr = (off: number, s: string) => {
            for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
          };
          writeStr(0, 'RIFF');
          view.setUint32(4, 36 + byteArr.length, true);
          writeStr(8, 'WAVE');
          writeStr(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          writeStr(36, 'data');
          view.setUint32(40, byteArr.length, true);
          return new Blob([wavHeader, byteArr], { type: 'audio/wav' });
        }
        return new Blob([byteArr], { type: mime || 'audio/wav' });
      } else {
        // ElevenLabs
        const apiKey = getNextKey('elevenlabs');
        if (!apiKey) throw new Error('No ElevenLabs key — add keys to Key Pool');
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceoverConfig.voice)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
            body: JSON.stringify({
              text: sampleText,
              model_id: 'eleven_multilingual_v2',
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          }
        );
        if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
        return await res.blob();
      }
    };

    generatePreview()
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewLoading(false);
        const reader = new FileReader();
        reader.onload = () => {
          try {
            localStorage.setItem(cacheKey, reader.result as string);
          } catch {
            /* quota */
          }
        };
        reader.readAsDataURL(blob);
        setTimeout(() => previewAudioRef.current?.play().catch(() => {}), 150);
      })
      .catch((err) => {
        if (cancelled) return;
        setPreviewError(err instanceof Error ? err.message : String(err));
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceoverConfig?.engine, voiceoverConfig?.voice]);

  // Clear preview when speed changes (non-ElevenLabs engines)
  useEffect(() => {
    if (voiceoverConfig?.engine !== 'elevenlabs') {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPreviewError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceoverConfig?.speed]);

  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePreview = async () => {
    if (!voiceoverConfig) return;
    setPreviewLoading(true);
    setPreviewError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Check localStorage cache — avoid repeated API calls for same voice
    const cacheKey = `voice-preview-${voiceoverConfig.engine}__${voiceoverConfig.voice}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setPreviewUrl(cached);
        setPreviewLoading(false);
        setTimeout(() => previewAudioRef.current?.play(), 100);
        return;
      }
    } catch {
      /* ignore localStorage errors */
    }

    const sampleText =
      'Xin chào, đây là giọng đọc mẫu. Bạn có thể nghe thử trước khi tạo voiceover cho video.';

    try {
      let blob: Blob;

      if (voiceoverConfig.engine === 'edge-tts') {
        const res = await fetch('http://localhost:5111/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sampleText,
            voice: voiceoverConfig.voice || 'vi-VN-HoaiMyNeural',
            speed: voiceoverConfig.speed || 1.0,
          }),
        });
        if (!res.ok) throw new Error(`Edge TTS error ${res.status}`);
        blob = await res.blob();
      } else if (voiceoverConfig.engine === 'fish-speech') {
        const res = await fetch('http://localhost:8200/v1/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sampleText,
            format: 'wav',
            chunk_length: 200,
            top_p: 0.8,
            temperature: 0.8,
            repetition_penalty: 1.1,
            streaming: false,
            references: [],
            ...(voiceoverConfig.voice && voiceoverConfig.voice !== 'default'
              ? { reference_id: voiceoverConfig.voice }
              : {}),
          }),
        });
        if (!res.ok) throw new Error(`Fish Audio S2 error ${res.status}`);
        blob = await res.blob();
      } else if (voiceoverConfig.engine === 'gemini-tts') {
        const apiKey = getNextKey('gemini');
        if (!apiKey) throw new Error('No Gemini key — add keys to Key Pool');
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: sampleText }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceoverConfig.voice || 'Kore' },
                  },
                },
              },
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: { message?: string } })?.error?.message ||
              `Gemini TTS error ${res.status}`
          );
        }
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const audioPart = parts.find((p: { inlineData?: { mimeType?: string } }) =>
          p.inlineData?.mimeType?.startsWith('audio/')
        );
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
          const writeStr = (off: number, s: string) => {
            for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
          };
          writeStr(0, 'RIFF');
          view.setUint32(4, 36 + byteArr.length, true);
          writeStr(8, 'WAVE');
          writeStr(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, numChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true);
          view.setUint16(32, (numChannels * bitsPerSample) / 8, true);
          view.setUint16(34, bitsPerSample, true);
          writeStr(36, 'data');
          view.setUint32(40, byteArr.length, true);
          blob = new Blob([wavHeader, byteArr], { type: 'audio/wav' });
        } else {
          blob = new Blob([byteArr], { type: mime || 'audio/wav' });
        }
      } else if (voiceoverConfig.engine === 'google-tts') {
        const apiKey = getNextKey('google-tts') || getNextKey('gemini');
        if (!apiKey) throw new Error('No Google TTS key — add keys to Key Pool');
        const langCode = voiceoverConfig.voice?.startsWith('en-') ? 'en-US' : 'vi-VN';
        const res = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: sampleText },
              voice: { languageCode: langCode, name: voiceoverConfig.voice },
              audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: voiceoverConfig.speed || 1.0,
                pitch: 0,
              },
            }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: { message?: string } })?.error?.message ||
              `Google TTS error ${res.status}`
          );
        }
        const data = (await res.json()) as { audioContent: string };
        const byteChars = atob(data.audioContent);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        blob = new Blob([byteArr], { type: 'audio/mpeg' });
      } else {
        const apiKey = getNextKey('elevenlabs');
        if (!apiKey) throw new Error('No ElevenLabs key — add keys to Key Pool');
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceoverConfig.voice)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
            body: JSON.stringify({
              text: sampleText,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                speed: voiceoverConfig.speed || 1.0,
              },
            }),
          }
        );
        if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`);
        blob = await res.blob();
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      // Cache audio as data URL — no more API calls for this voice
      const reader = new FileReader();
      reader.onload = () => {
        try {
          localStorage.setItem(cacheKey, reader.result as string);
        } catch {
          /* quota */
        }
      };
      reader.readAsDataURL(blob);

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
              🎤 {voiceoverJson.successCount || voiceoverJson.clips.length}/
              {voiceoverJson.totalClips || '?'} clips
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
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang tạo...
                </>
              ) : voiceoverJson?.clips ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" /> Re-gen Voice
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-1" /> Generate Voice
                </>
              )}
            </Button>
          )}
          {voiceoverJson?.clips && voiceoverJson.clips.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!voiceoverJson?.clips) return;
                setDownloadingVoices(true);
                try {
                  const channelName = run.channelId ? `ch${run.channelId}` : 'voice';
                  for (const clip of voiceoverJson.clips) {
                    try {
                      const resp = await fetch(clip.url);
                      const blob = await resp.blob();
                      const ext = blob.type.includes('mpeg')
                        ? 'mp3'
                        : blob.type.includes('wav')
                          ? 'wav'
                          : blob.type.includes('ogg')
                            ? 'ogg'
                            : 'mp3';
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `${channelName}_scene${String(clip.scene).padStart(2, '0')}.${ext}`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                      await new Promise((r) => setTimeout(r, 300));
                    } catch {
                      /* skip failed */
                    }
                  }
                } finally {
                  setDownloadingVoices(false);
                }
              }}
              disabled={downloadingVoices}
            >
              {downloadingVoices ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang tải...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" /> Tải hết voice
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Voiceover Config (collapsible) ── */}
        {voiceoverConfig && onVoiceoverConfigChange && (
          <details className="group rounded-lg border border-green-500/20 bg-green-500/5" open>
            <summary className="px-3 py-2.5 cursor-pointer text-[11px] font-semibold text-green-400 select-none flex items-center gap-1.5 hover:bg-green-500/10 rounded-lg transition-colors">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              ⚙️ Voice Settings
              <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                {engine === 'gemini-tts' ? 'Gemini' : 'ElevenLabs'} · {voiceoverConfig.voice} ·{' '}
                {voiceoverConfig.speed}x
              </span>
            </summary>
            <div className="px-3 pb-3 space-y-3">
              {/* Engine + Voice (2-col) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">TTS Engine</Label>
                  <Select
                    value={voiceoverConfig.engine}
                    onValueChange={(v) => {
                      if (v === 'elevenlabs')
                        onVoiceoverConfigChange({ engine: v, voice: 'pNInz6obpgDQGcFmaJgB' });
                      else onVoiceoverConfigChange({ engine: v, voice: 'Kore' });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-tts">Gemini TTS</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Voice</Label>
                  {isElevenLabs ? (
                    <Select
                      value={voiceoverConfig.voice}
                      onValueChange={(v) => onVoiceoverConfigChange({ voice: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            🎙️ Nam — Kể chuyện / Thuyết minh
                          </SelectLabel>
                          <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George (Storyteller)</SelectItem>
                          <SelectItem value="onwK4e9ZLuTAKqWW03F9">Daniel (Broadcaster)</SelectItem>
                          <SelectItem value="pqHfZKP75CvOlQylNhV4">Bill (Wise, Mature)</SelectItem>
                          <SelectItem value="cjVigY5qzO86Huf0OWal">Eric (Smooth)</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            👨 Nam — Social / Trẻ trung
                          </SelectLabel>
                          <SelectItem value="pNInz6obpgDQGcFmaJgB">Adam (Deep)</SelectItem>
                          <SelectItem value="nPczCjzI2devNBz1zQrb">
                            Brian (Deep, Comforting)
                          </SelectItem>
                          <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam (Energetic)</SelectItem>
                          <SelectItem value="CwhRBWXzGAHq8TQ4Fs17">Roger (Laid-Back)</SelectItem>
                          <SelectItem value="IKne3meq5aSn9XLyUdCD">Charlie (Confident)</SelectItem>
                          <SelectItem value="iP95p4xoKVk53GoZ742B">
                            Chris (Down-to-Earth)
                          </SelectItem>
                          <SelectItem value="bIHbv24MWmeRgasZH58o">Will (Relaxed)</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            🎙️ Nữ — Thuyết minh / Giáo dục
                          </SelectLabel>
                          <SelectItem value="Xb7hH8MSUJpSbSDYk0k2">Alice (Educator)</SelectItem>
                          <SelectItem value="XrExE9yKIg1WjnnlVkGX">
                            Matilda (Professional)
                          </SelectItem>
                          <SelectItem value="hpp4J3VqNfWAUOO0d1Us">Bella (Informative)</SelectItem>
                          <SelectItem value="pFZP5JQG7iQjIQuC4Bku">Lily (Velvety)</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            👩 Nữ — Social / Trẻ trung
                          </SelectLabel>
                          <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah (Mature)</SelectItem>
                          <SelectItem value="FGY2WhTYpPnrIDTdsKH5">Laura (Enthusiast)</SelectItem>
                          <SelectItem value="cgSgspJ2msm6clMCkdW9">Jessica (Playful)</SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            🌐 Trung tính
                          </SelectLabel>
                          <SelectItem value="SAz9YHcvj6GT2YYXdXww">River (Neutral)</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={voiceoverConfig.voice}
                      onValueChange={(v) => onVoiceoverConfigChange({ voice: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            👨 Nam
                          </SelectLabel>
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
                          <SelectLabel className="text-[11px] text-muted-foreground">
                            👩 Nữ
                          </SelectLabel>
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
                <Select
                  value={String(voiceoverConfig.speed)}
                  onValueChange={(v) => onVoiceoverConfigChange({ speed: parseFloat(v) })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
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
                {voiceoverConfig.engine === 'elevenlabs' ? (
                  <div className="space-y-1">
                    {previewLoading && (
                      <div className="flex items-center gap-2 text-[11px] text-yellow-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Đang tạo mẫu tiếng Việt...
                      </div>
                    )}
                    {previewUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-green-400 shrink-0">
                          🔊 Mẫu tiếng Việt
                        </span>
                        <audio
                          ref={previewAudioRef}
                          controls
                          src={previewUrl}
                          className="w-full h-8"
                          preload="auto"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs gap-2"
                      onClick={handlePreview}
                      disabled={previewLoading}
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Đang tạo mẫu...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" /> Nghe thử giọng đọc
                        </>
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
                  </>
                )}

                {previewError && (
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-red-400 flex-1">⚠️ {previewError}</p>
                    {onOpenKeyPool && (
                      <button
                        onClick={onOpenKeyPool}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
                      >
                        🔑 Đổi API Key
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

        {/* ── Script Preview + Doctor ── */}
        {scriptTxt?.trim() ? (
          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2 space-y-1.5">
            <button
              type="button"
              className="flex items-center gap-1.5 w-full text-left"
              onClick={() => setShowScriptPreview((v) => !v)}
            >
              {showScriptPreview ? (
                <ChevronDown className="h-3 w-3 text-blue-400 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />
              )}
              <span className="text-[11px] font-medium text-blue-400">
                📝 Script từ Step 1 ({scriptTxt.length.toLocaleString()} ký tự)
                {' — '}
                <span className="text-muted-foreground">
                  {showScriptPreview ? 'ẩn' : 'xem nội dung'}
                </span>
              </span>
            </button>

            {showScriptPreview && (
              <ScrollArea className="max-h-48">
                <p className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed pr-2">
                  {scriptTxt.length > 2000 ? scriptTxt.substring(0, 2000) + '...' : scriptTxt}
                </p>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
            <p className="text-[11px] text-yellow-400">
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
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang tối ưu script cho TTS...
                </>
              ) : optimizedScript ? (
                <>
                  <Sparkles className="h-3 w-3" /> 🔄 Tối ưu lại script cho TTS
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" /> ✨ AI tối ưu script → bản sạch cho TTS
                </>
              )}
            </Button>

            {optimizerError && <p className="text-[11px] text-red-400">⚠️ {optimizerError}</p>}

            {optimizedScript && (
              <div className="rounded-md border border-green-500/30 bg-green-500/5 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-green-500/10 transition-colors"
                  onClick={() => setShowOptimized((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-400">✅ Script TTS-Ready</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-green-500/50 text-green-400"
                    >
                      {optimizedScript.length.toLocaleString()} ký tự
                    </Badge>
                    {voiceoverConfig?.cleanedScript ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-green-500/50 text-green-400"
                      >
                        đã áp dụng
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-yellow-500/50 text-yellow-400"
                      >
                        chưa áp dụng
                      </Badge>
                    )}
                  </div>
                  {showOptimized ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>

                {showOptimized && (
                  <div className="px-3 pb-3 space-y-2 border-t border-green-500/20 pt-2">
                    <ScrollArea className="max-h-48">
                      <p className="text-[11px] text-foreground/80 whitespace-pre-wrap leading-relaxed pr-2 font-mono">
                        {optimizedScript}
                      </p>
                    </ScrollArea>

                    <div className="flex gap-2">
                      {!voiceoverConfig?.cleanedScript ||
                      voiceoverConfig.cleanedScript !== optimizedScript ? (
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-[11px] gap-1.5 bg-green-600 hover:bg-green-700 text-white"
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
                        className="h-7 text-[11px] text-muted-foreground hover:text-red-400"
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
          <p className="text-[11px] text-muted-foreground">
            🎤 Nếu có Storyboard → tạo audio per-scene từ dialogues. Nếu chỉ có Script → full
            narration.
            {isElevenLabs
              ? ' Cần VITE_ELEVENLABS_API_KEY trong .env.'
              : ' Dùng chung Gemini API key — không cần cấu hình thêm.'}
          </p>
        </div>

        {/* ── Voice History Selector ── */}
        {voiceoverHistory && voiceoverHistory.length > 0 && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-950/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-400">
                <Clock className="inline h-3 w-3 mr-1" />
                Lịch sử Voice ({voiceoverHistory.length} bản cũ)
              </span>
              {selectedHistoryIdx !== null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] gap-1 border-purple-500/40 text-purple-400 hover:bg-purple-500/20"
                  onClick={() => setSelectedHistoryIdx(null)}
                >
                  ← Quay về bản hiện tại
                </Button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {voiceoverHistory.map((ver, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedHistoryIdx(idx)}
                  className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                    selectedHistoryIdx === idx
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-border hover:border-purple-500/40 text-muted-foreground hover:text-purple-400'
                  }`}
                >
                  v{idx + 1} • {ver.engine || '?'} • {ver.voice || '?'} • ~{ver.totalDuration || 0}s
                  {ver.archivedAt && (
                    <span className="ml-1 opacity-60">
                      ({new Date(ver.archivedAt).toLocaleDateString('vi-VN')})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedHistoryIdx !== null && (
              <Button
                size="sm"
                className="h-7 text-[11px] gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleRestoreVersion(selectedHistoryIdx)}
              >
                <RefreshCw className="h-3 w-3" /> Khôi phục bản v{selectedHistoryIdx + 1} này
              </Button>
            )}
          </div>
        )}

        {/* ── Voice — Full Audio + Clips ── */}
        {displayVoiceover?.clips && displayVoiceover.clips.length > 0 ? (
          <div className="space-y-4">
            {selectedHistoryIdx !== null && (
              <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-[11px]">
                👁️ Đang xem bản v{selectedHistoryIdx + 1} (cũ) — bấm "Khôi phục" để dùng lại
              </Badge>
            )}
            {/* Full combined audio */}
            <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-400">🎧 Full Audio</span>
                <span className="text-[11px] text-muted-foreground">
                  ~{displayVoiceover.totalDuration || 0}s • {displayVoiceover.clips.length} phần
                  {displayVoiceover.engine && ` • ${displayVoiceover.engine}`}
                  {displayVoiceover.voice && ` (${displayVoiceover.voice})`}
                </span>
              </div>
              {displayVoiceover.fullAudioUrl ? (
                <SmartAudio src={displayVoiceover.fullAudioUrl} showRegenerate={false} />
              ) : displayVoiceover.clips.length === 1 ? (
                <SmartAudio src={displayVoiceover.clips[0].url} showRegenerate={false} />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Full audio chưa có (run cũ). Chạy lại voiceover để merge.
                </p>
              )}
            </div>

            {/* Individual clips — collapsible */}
            {displayVoiceover.clips.length > 1 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-purple-400 hover:text-purple-300 text-center py-1 list-none">
                  <span className="group-open:hidden">
                    ▼ Xem {displayVoiceover.clips.length} đoạn riêng
                  </span>
                  <span className="hidden group-open:inline">▲ Ẩn từng đoạn</span>
                </summary>
                <div className="space-y-3 mt-2">
                  {displayVoiceover.clips.map((clip, i) => {
                    const scene = storyboardJson?.scenes?.find((s) => s.scene === clip.scene);
                    return (
                      <div key={i} className="p-3 rounded-lg border hover:bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Đoạn {clip.scene}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {clip.duration.toFixed(1)}s • {clip.charCount} chars • {clip.engine}
                            </span>
                          </div>
                          <Volume2 className="h-3.5 w-3.5 text-green-400" />
                        </div>
                        {scene && (
                          <p className="text-xs text-muted-foreground italic truncate">
                            "{scene.dialogue}"
                          </p>
                        )}
                        <SmartAudio
                          src={clip.url}
                          regenerating={regeneratingScene === clip.scene}
                          onRegenerate={
                            scene?.dialogue
                              ? async () => {
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
                                }
                              : undefined
                          }
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

// ─── STORYBOARD EDITOR ────────────────────────────────────

type SceneData = {
  scene: number;
  dialogue: string;
  prompt: string;
  motion: string;
  transition: string;
};

function StoryboardEditor({
  scenes: initialScenes,
  imageMap: initialImageMap,
  runId,
  copiedField,
  copyToClipboard,
  topic,
  scriptContext,
  channelId,
  existingImages,
}: {
  scenes: SceneData[];
  imageMap: Map<number, string>;
  runId: string;
  copiedField: string | null;
  copyToClipboard: (text: string, field: string) => void;
  topic?: string;
  scriptContext?: string;
  channelId?: string;
  existingImages?: { scene: number; url: string; prompt: string }[];
}) {
  const [scenes, setScenes] = useState<SceneData[]>(initialScenes);
  const [imageMap, setImageMap] = useState<Map<number, string>>(initialImageMap);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SceneData | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addCount, setAddCount] = useState(3);
  const [addHint, setAddHint] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [imgGenerating, setImgGenerating] = useState(false);
  const [imgProgress, setImgProgress] = useState('');
  const [recoveringImages, setRecoveringImages] = useState(false);

  // Sync if parent data changes (e.g. re-generation)
  useEffect(() => {
    setScenes(initialScenes);
  }, [initialScenes]);
  useEffect(() => {
    setImageMap(initialImageMap);
  }, [initialImageMap]);

  const persist = (updated: SceneData[]) => {
    // Re-number scenes sequentially
    const renumbered = updated.map((s, i) => ({ ...s, scene: i + 1 }));
    setScenes(renumbered);
    updateRunFile(runId, 'storyboard.json', { scenes: renumbered });
  };

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...scenes[idx] });
  };

  const handleSaveEdit = () => {
    if (editingIdx === null || !editForm) return;
    const updated = [...scenes];
    updated[editingIdx] = editForm;
    persist(updated);
    setEditingIdx(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
  };

  const handleDelete = (idx: number) => {
    const updated = scenes.filter((_, i) => i !== idx);
    persist(updated);
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditForm(null);
    }
  };

  const handleDuplicate = (idx: number) => {
    const dup = { ...scenes[idx] };
    const updated = [...scenes];
    updated.splice(idx + 1, 0, dup);
    persist(updated);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...scenes];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    persist(updated);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= scenes.length - 1) return;
    const updated = [...scenes];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    persist(updated);
  };

  const handleAddBlankScene = () => {
    const newScene: SceneData = {
      scene: scenes.length + 1,
      dialogue: '',
      prompt: '',
      motion: 'slow zoom in',
      transition: 'fade through black',
    };
    const updated = [...scenes, newScene];
    persist(updated);
    setEditingIdx(updated.length - 1);
    setEditForm({ ...newScene, scene: updated.length });
  };

  const missingImageScenes = scenes.filter((s) => !imageMap.has(s.scene) && s.prompt.trim());

  /** Khôi phục ảnh đã upload lên Storage nhưng chưa được ghi vào images.json */
  const handleRecoverImages = async () => {
    if (!channelId) return;
    setRecoveringImages(true);
    try {
      const promptMap = new Map<number, string>(scenes.map((s) => [s.scene, s.prompt]));
      const found = await scanStorageForImages(channelId, runId, promptMap);
      if (found.length === 0) {
        toast({
          title: 'Không tìm thấy ảnh nào',
          description: `Storage chưa có ảnh tại pipeline-images/${channelId}/${runId}/`,
        });
        return;
      }
      // Merge with existing (don't overwrite already-mapped scenes)
      const merged = [
        ...(existingImages || []).filter((img) => !found.find((f) => f.scene === img.scene)),
        ...found,
      ];
      merged.sort((a, b) => a.scene - b.scene);
      // Update local map
      const updatedMap = new Map(imageMap);
      for (const img of found) updatedMap.set(img.scene, img.url);
      setImageMap(updatedMap);
      // Persist to DB
      updateRunFile(runId, 'images.json', {
        images: merged,
        totalScenes: scenes.length,
        successCount: merged.length,
        failCount: scenes.length - merged.length,
      });
      toast({
        title: `✅ Khôi phục ${found.length} ảnh thành công`,
        description: `${merged.length}/${scenes.length} scene có ảnh`,
      });
    } catch (err) {
      toast({
        title: 'Lỗi khôi phục',
        description: err instanceof Error ? err.message : 'Không thể kết nối Storage',
        variant: 'destructive',
      });
    } finally {
      setRecoveringImages(false);
    }
  };

  const handleGenerateMissingImages = async () => {
    if (missingImageScenes.length === 0) return;
    const apiKey = getNextKey('gemini');
    if (!apiKey) {
      toast({
        title: 'Thiếu API Key',
        description: 'Thêm Gemini key vào Key Pool',
        variant: 'destructive',
      });
      return;
    }
    setImgGenerating(true);
    const newImages: { scene: number; url: string; prompt: string; mimeType: string }[] = [];
    const updatedMap = new Map(imageMap);
    let failCount = 0;
    let firstError = '';
    try {
      for (let i = 0; i < missingImageScenes.length; i++) {
        const scene = missingImageScenes[i];
        setImgProgress(`🖼️ Tạo ảnh scene ${scene.scene} (${i + 1}/${missingImageScenes.length})...`);
        try {
          const fullPrompt = `${scene.prompt} 16:9 aspect ratio, photorealistic cinematic quality, film grain.`;
          const result = await generateSingleImage(fullPrompt, apiKey);
          if (result) {
            const publicUrl = await uploadToStorage(
              result.dataUrl,
              channelId || 'default',
              scene.scene,
              runId
            );
            newImages.push({
              scene: scene.scene,
              url: publicUrl,
              prompt: scene.prompt,
              mimeType: result.mimeType,
            });
            updatedMap.set(scene.scene, publicUrl);
            setImageMap(new Map(updatedMap));
            trackCost({
              step: 'missingImageGen',
              model: 'gemini-2.5-flash-image',
              type: 'image',
              quantity: 1,
              runId,
              channelId: channelId || undefined,
              detail: `Scene ${scene.scene}`,
            });
            // Save progress after each successful image so reloads don't lose work
            const mergedSoFar = [
              ...(existingImages || []).filter(
                (img) => !newImages.find((ni) => ni.scene === img.scene)
              ),
              ...newImages,
            ];
            mergedSoFar.sort((a, b) => a.scene - b.scene);
            updateRunFile(runId, 'images.json', {
              images: mergedSoFar,
              totalScenes: scenes.length,
              successCount: mergedSoFar.length,
              failCount: scenes.length - mergedSoFar.length,
            });
          } else {
            failCount++;
            if (!firstError)
              firstError = `Scene ${scene.scene}: Không nhận được dữ liệu ảnh từ model`;
          }
        } catch (err) {
          failCount++;
          if (!firstError)
            firstError = `Scene ${scene.scene}: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`;
          console.warn(`Scene ${scene.scene} image failed:`, err);
        }
        // Rate limit delay
        if (i < missingImageScenes.length - 1) await new Promise((r) => setTimeout(r, 1500));
      }
      const latestCount = (existingImages?.length || 0) + newImages.length;
      if (newImages.length === 0) {
        toast({
          title: '❌ Tạo ảnh thất bại',
          description:
            firstError ||
            `Không tạo được ảnh nào (${failCount}/${missingImageScenes.length} scene lỗi)`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: `🖼️ Đã tạo ${newImages.length} ảnh mới`,
          description:
            failCount > 0
              ? `${latestCount}/${scenes.length} scene có ảnh • ${failCount} scene lỗi`
              : `${latestCount}/${scenes.length} scene có ảnh`,
        });
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Tạo ảnh thất bại',
        variant: 'destructive',
      });
    } finally {
      setImgGenerating(false);
      setImgProgress('');
    }
  };

  const handleAIGenerateScenes = async () => {
    const apiKey = getNextKey('gemini');
    if (!apiKey) {
      toast({
        title: 'Thiếu API Key',
        description: 'Thêm Gemini key vào Key Pool',
        variant: 'destructive',
      });
      return;
    }
    setAiGenerating(true);
    try {
      const existingSummary = scenes
        .slice(-5)
        .map((s) => `Scene ${s.scene}: ${s.dialogue.slice(0, 80)}`)
        .join('\n');
      const contextParts = [
        topic ? `Chủ đề video: ${topic}` : '',
        scriptContext ? `Tóm tắt script (500 ký tự đầu): ${scriptContext.slice(0, 500)}` : '',
        existingSummary ? `Các scene gần nhất:\n${existingSummary}` : '',
        addHint ? `Yêu cầu thêm từ người dùng: ${addHint}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const systemPrompt = `Bạn là Visual Director chuyên nghiệp. Tạo ${addCount} scene MỚI tiếp nối storyboard hiện có.

Quy tắc:
- Mỗi scene có: dialogue (lời thoại narrator), prompt (mô tả hình ảnh chi tiết bằng tiếng Anh cho AI image gen), motion (camera movement), transition
- Prompt phải rất chi tiết, cinematic, mô tả rõ chủ thể, ánh sáng, góc quay, phong cách
- Motion options: slow zoom in, slow zoom out, pan left to right, pan right to left, tilt up, tilt down, dolly forward, static wide shot, handheld subtle
- Transition options: fade through black, cross dissolve, cut, whip pan, fade to white
- Dialogue bằng tiếng Việt, tự nhiên, phù hợp narration
- Sáng tạo, đa dạng góc quay và bố cục

Trả về JSON thuần (không markdown): { "scenes": [{ "dialogue": "...", "prompt": "...", "motion": "...", "transition": "..." }] }`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              { parts: [{ text: contextParts || `Tạo ${addCount} scene cho video YouTube` }] },
            ],
            generationConfig: { temperature: 0.9 },
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini error ${res.status}`);
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ');
      const parsed = JSON.parse(jsonMatch[0]) as {
        scenes: { dialogue: string; prompt: string; motion: string; transition: string }[];
      };
      if (!parsed.scenes?.length) throw new Error('AI trả về 0 scene');

      const newScenes: SceneData[] = parsed.scenes.map((s, i) => ({
        scene: scenes.length + i + 1,
        dialogue: s.dialogue || '',
        prompt: s.prompt || '',
        motion: s.motion || 'slow zoom in',
        transition: s.transition || 'fade through black',
      }));
      const updated = [...scenes, ...newScenes];
      persist(updated);
      setShowAddDialog(false);
      setAddHint('');
      trackCost({
        step: 'aiSceneGen',
        model: 'gemini-2.0-flash',
        type: 'text',
        quantity: 1,
        runId,
        channelId: channelId || undefined,
        detail: `${newScenes.length} scenes`,
      });
      toast({
        title: `✨ Đã tạo ${newScenes.length} scene mới`,
        description: 'AI đã viết dialogue + prompt sáng tạo',
      });
    } catch (err) {
      toast({
        title: 'Lỗi AI',
        description: err instanceof Error ? err.message : 'Không tạo được scene',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {scenes.map((scene, i) => {
        const imgUrl = imageMap.get(scene.scene);
        const isEditing = editingIdx === i;

        if (isEditing && editForm) {
          return (
            <div
              key={i}
              className="p-3 rounded-lg border-2 border-blue-500/50 bg-blue-500/5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-400">
                  ✏️ Editing Scene {scene.scene}
                </Badge>
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>
                    💾 Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Dialogue (lời thoại)</Label>
                  <Textarea
                    className="text-xs min-h-[80px] mt-1"
                    value={editForm.dialogue}
                    onChange={(e) => setEditForm({ ...editForm, dialogue: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Image Prompt</Label>
                  <Textarea
                    className="text-xs min-h-[150px] mt-1"
                    placeholder="Mô tả chi tiết hình ảnh: chủ thể, bối cảnh, ánh sáng, góc quay, phong cách..."
                    value={editForm.prompt}
                    onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-[11px] text-muted-foreground">Motion</Label>
                    <Input
                      className="h-7 text-xs mt-1"
                      value={editForm.motion}
                      onChange={(e) => setEditForm({ ...editForm, motion: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[11px] text-muted-foreground">Transition</Label>
                    <Input
                      className="h-7 text-xs mt-1"
                      value={editForm.transition}
                      onChange={(e) => setEditForm({ ...editForm, transition: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="p-3 rounded-lg border hover:bg-muted/30 space-y-2 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Scene {scene.scene}
                </Badge>
                {imgUrl && (
                  <Badge
                    variant="outline"
                    className="text-[11px] border-green-500/30 text-green-400"
                  >
                    ✅ Image
                  </Badge>
                )}
                {!imgUrl && scene.prompt.trim() && (
                  <Badge
                    variant="outline"
                    className="text-[11px] border-amber-500/30 text-amber-400"
                  >
                    ⬜ No image
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[11px]">
                  {scene.motion}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  {scene.transition}
                </Badge>
                <div className="flex items-center gap-0.5 ml-2 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    title="Di chuyển lên"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveDown(i)}
                    disabled={i === scenes.length - 1}
                    title="Di chuyển xuống"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-400"
                    onClick={() => handleEdit(i)}
                    title="Sửa scene"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-400"
                    onClick={() => handleDuplicate(i)}
                    title="Nhân đôi scene"
                  >
                    <CopyPlus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-400"
                    onClick={() => handleDelete(i)}
                    title="Xóa scene"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">"{scene.dialogue}"</p>
            <div className="flex items-start gap-2">
              <p className="text-xs bg-muted/50 p-2 rounded flex-1 leading-relaxed">
                {scene.prompt}
              </p>
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

      {/* Generate missing images */}
      {missingImageScenes.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <ImageIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300 flex-1">
            {imgGenerating
              ? imgProgress
              : recoveringImages
                ? '🔍 Đang quét Storage...'
                : `${missingImageScenes.length} scene chưa có ảnh (${missingImageScenes.map((s) => s.scene).join(', ')})`}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            onClick={handleRecoverImages}
            disabled={imgGenerating || recoveringImages}
            title="Quét Storage tìm ảnh đã upload nhưng chưa lưu (dùng khi reload mất tiến trình)"
          >
            {recoveringImages ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Đang quét...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" /> Khôi phục
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
            onClick={handleGenerateMissingImages}
            disabled={imgGenerating || recoveringImages}
          >
            {imgGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <ImageIcon className="h-3 w-3 mr-1" /> Tạo ảnh ({missingImageScenes.length})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Add Scene buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 border-dashed border-2 text-muted-foreground hover:text-foreground h-12"
          onClick={handleAddBlankScene}
        >
          <Plus className="h-4 w-4 mr-2" /> Thêm scene trống
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-dashed border-2 text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300 h-12"
          onClick={() => setShowAddDialog(true)}
        >
          <Sparkles className="h-4 w-4 mr-2" /> AI tạo scene
        </Button>
      </div>

      {/* AI Generate Scenes Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> AI Tạo Scene Mới
            </DialogTitle>
            <DialogDescription>
              Trợ lý AI sẽ viết dialogue + image prompt sáng tạo dựa trên nội dung hiện có
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Số lượng scene</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 5, 8].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={addCount === n ? 'default' : 'outline'}
                    className="h-9 w-12"
                    onClick={() => setAddCount(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Gợi ý thêm (tùy chọn)</Label>
              <Textarea
                className="mt-1.5 text-sm min-h-[70px]"
                placeholder="VD: Thêm cảnh tâm lý, close-up khuôn mặt, hoặc bối cảnh đường phố ban đêm..."
                value={addHint}
                onChange={(e) => setAddHint(e.target.value)}
              />
            </div>
            {topic && <p className="text-xs text-muted-foreground">📌 Chủ đề: {topic}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddDialog(false)} disabled={aiGenerating}>
              Hủy
            </Button>
            <Button
              onClick={handleAIGenerateScenes}
              disabled={aiGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Tạo {addCount} scene
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── RESULTS VIEW ─────────────────────────────────────────

function ResultsView({
  run,
  onRunImageGen,
  onRunVoiceover,
  onRunAssembly,
  isGenerating,
  voiceoverConfig,
  onVoiceoverConfigChange,
  onOpenKeyPool,
}: {
  run: GenerationRun;
  onRunImageGen?: () => void;
  onRunVoiceover?: () => void;
  onRunAssembly?: () => void;
  isGenerating?: boolean;
  voiceoverConfig?: { engine: string; voice: string; speed: number; cleanedScript?: string };
  onVoiceoverConfigChange?: (
    u: Partial<{ engine: string; voice: string; speed: number; cleanedScript?: string }>
  ) => void;
  onOpenKeyPool?: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadingImages, setDownloadingImages] = useState(false);
  const result = run.result;
  if (!result) return null;

  const scriptJson = result.files?.['script.json'] as Record<string, unknown> | undefined;
  const scriptTxt = result.files?.['script.txt'] as string | undefined;
  const storyboardMd = result.files?.['storyboard.md'] as string | undefined;
  const storyboardJson = result.files?.['storyboard.json'] as
    | {
        scenes?: {
          scene: number;
          dialogue: string;
          prompt: string;
          motion: string;
          transition: string;
        }[];
      }
    | undefined;
  const imagesJson = result.files?.['images.json'] as
    | {
        images?: { scene: number; url: string; prompt: string }[];
        successCount?: number;
        totalScenes?: number;
      }
    | undefined;
  const voiceoverJson = result.files?.['voiceover.json'] as
    | {
        clips?: {
          scene: number;
          url: string;
          duration: number;
          charCount: number;
          engine: string;
        }[];
        totalClips?: number;
        successCount?: number;
        failCount?: number;
        totalDuration?: number;
        engine?: string;
        voice?: string;
        speed?: number;
        fullAudioUrl?: string;
      }
    | undefined;
  const voiceoverHistory = result.files?.['voiceover-history.json'] as VoiceoverData[] | undefined;
  const assemblyJson = result.files?.['assembly.json'] as
    | {
        videoUrl?: string;
        format?: string;
        duration?: number;
        totalScenes?: number;
        resolution?: string;
        fileSize?: number;
        transitions?: string;
        bgMusic?: boolean;
      }
    | undefined;
  const imageMap = new Map<number, string>();
  if (imagesJson?.images) {
    for (const img of imagesJson.images) imageMap.set(img.scene, img.url);
  }

  const stats = scriptJson?.stats as
    | { totalWords?: number; estimatedMinutes?: string; sections?: number }
    | undefined;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadAllImages = async () => {
    if (!imagesJson?.images || imagesJson.images.length === 0) return;
    setDownloadingImages(true);
    try {
      const channelName = run.channelId ? `ch${run.channelId}` : 'storyboard';
      for (const img of imagesJson.images) {
        try {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          const ext = blob.type.includes('png')
            ? 'png'
            : blob.type.includes('webp')
              ? 'webp'
              : 'jpg';
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${channelName}_scene${String(img.scene).padStart(2, '0')}.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
          // Small delay between downloads to avoid browser blocking
          await new Promise((r) => setTimeout(r, 300));
        } catch {
          /* skip failed */
        }
      }
    } finally {
      setDownloadingImages(false);
    }
  };

  const topicLabel = run.input?.topic || run.input?.transcript;

  return (
    <div className="space-y-4">
      {/* Topic identification header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg font-semibold truncate">📌 {topicLabel || 'Unknown topic'}</span>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${
              run.status === 'completed'
                ? 'border-green-500/40 text-green-500'
                : run.status === 'running'
                  ? 'border-blue-500/40 text-blue-500'
                  : run.status === 'failed'
                    ? 'border-red-500/40 text-red-500'
                    : 'border-yellow-500/40 text-yellow-500'
            }`}
          >
            {run.status}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(run.startedAt).toLocaleString('vi-VN')}
          {run.durationMs ? ` • ${(run.durationMs / 1000).toFixed(1)}s` : ''}
        </span>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <TabsTrigger value="script" className="gap-1.5">
            📝 Script{' '}
            {scriptTxt ? (
              <span className="text-green-500 text-[10px]">●</span>
            ) : (
              <span className="text-muted-foreground/40 text-[10px]">○</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="storyboard" className="gap-1.5">
            🎬 Storyboard{' '}
            {storyboardJson?.scenes ? (
              <span className="text-green-500 text-[10px]">●</span>
            ) : (
              <span className="text-muted-foreground/40 text-[10px]">○</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5">
            🎤 Voice{' '}
            {voiceoverJson?.clips ? (
              <span className="text-green-500 text-[10px]">●</span>
            ) : (
              <span className="text-muted-foreground/40 text-[10px]">○</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-1.5">
            🎥 Video{' '}
            {assemblyJson?.videoUrl ? (
              <span className="text-green-500 text-[10px]">●</span>
            ) : (
              <span className="text-muted-foreground/40 text-[10px]">○</span>
            )}
          </TabsTrigger>
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
                {copiedField === 'script' ? (
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
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
                    🖼️ {imagesJson.successCount || imagesJson.images.length}/
                    {imagesJson.totalScenes || storyboardJson?.scenes?.length || '?'} ảnh
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
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang tạo...
                      </>
                    ) : imagesJson?.images ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" /> Re-gen Images
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-1" /> Generate Images
                      </>
                    )}
                  </Button>
                )}
                {imagesJson?.images && imagesJson.images.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAllImages}
                    disabled={downloadingImages}
                  >
                    {downloadingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang tải...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" /> Tải hết ảnh
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => storyboardMd && copyToClipboard(storyboardMd, 'storyboard')}
                >
                  {copiedField === 'storyboard' ? (
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copiedField === 'storyboard' ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {storyboardJson?.scenes ? (
                <StoryboardEditor
                  scenes={storyboardJson.scenes}
                  imageMap={imageMap}
                  runId={run.id}
                  copiedField={copiedField}
                  copyToClipboard={copyToClipboard}
                  topic={run.input?.topic}
                  scriptContext={scriptTxt}
                  channelId={run.channelId}
                  existingImages={imagesJson?.images}
                />
              ) : (
                <ScrollArea className="h-[600px]">
                  <pre className="whitespace-pre-wrap text-sm">
                    {storyboardMd || 'No storyboard generated'}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <VoiceTabContent
            run={run}
            voiceoverJson={voiceoverJson}
            voiceoverHistory={voiceoverHistory}
            storyboardJson={storyboardJson}
            scriptTxt={scriptTxt}
            voiceoverConfig={voiceoverConfig}
            onVoiceoverConfigChange={onVoiceoverConfigChange}
            onRunVoiceover={onRunVoiceover}
            isGenerating={isGenerating}
            onOpenKeyPool={onOpenKeyPool}
          />
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Video Assembly</CardTitle>
              <div className="flex items-center gap-2">
                {assemblyJson?.videoUrl && (
                  <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                    ✅ {assemblyJson.totalScenes} scenes · {Math.round(assemblyJson.duration || 0)}s
                    · {assemblyJson.resolution}
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
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang ghép...
                      </>
                    ) : assemblyJson?.videoUrl ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" /> Re-assemble
                      </>
                    ) : (
                      <>
                        <Film className="h-4 w-4 mr-1" /> Assemble Video
                      </>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{Math.round(assemblyJson.duration || 0)}s</p>
                      <p className="text-[11px] text-muted-foreground">Duration</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{assemblyJson.resolution}</p>
                      <p className="text-[11px] text-muted-foreground">Resolution</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">{assemblyJson.format?.toUpperCase()}</p>
                      <p className="text-[11px] text-muted-foreground">Format</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/30">
                      <p className="text-lg font-bold">
                        {assemblyJson.fileSize
                          ? (assemblyJson.fileSize / 1024 / 1024).toFixed(1) + 'MB'
                          : '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">File Size</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[11px]">
                      {assemblyJson.fps || 24} fps
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      🎬 {assemblyJson.transitions}
                    </Badge>
                    {assemblyJson.panZoom && assemblyJson.panZoom !== 'none' && (
                      <Badge variant="secondary" className="text-[11px]">
                        🔍 {assemblyJson.panZoom}
                      </Badge>
                    )}
                    {assemblyJson.textOverlay && (
                      <Badge variant="secondary" className="text-[11px]">
                        📝 phụ đề
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {assemblyJson.bgMusic ? '🎵 nhạc nền' : '🔇 không nhạc'}
                    </Badge>
                    <a href={assemblyJson.videoUrl} download className="ml-auto">
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Prerequisites status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`rounded-lg border p-3 ${imagesJson?.images ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {imagesJson?.images ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">Images (Step 3)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {imagesJson?.images
                          ? `✅ ${imagesJson.successCount || imagesJson.images.length} ảnh sẵn sàng`
                          : '⚠️ Chưa có — chạy Step 3 trước'}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 ${voiceoverJson?.clips ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {voiceoverJson?.clips ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Mic className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">Audio (Step 4)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {voiceoverJson?.clips
                          ? `✅ ${voiceoverJson.successCount} clips · ~${voiceoverJson.totalDuration}s · ${voiceoverJson.engine}`
                          : '⚠️ Chưa có — chạy Step 4 trước'}
                      </p>
                    </div>
                  </div>

                  {/* Scene-by-scene preview */}
                  {storyboardJson?.scenes &&
                    storyboardJson.scenes.length > 0 &&
                    (imagesJson?.images || voiceoverJson?.clips) && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          📋 Preview: {storyboardJson.scenes.length} scenes sẽ được ghép
                        </p>
                        <div className="grid gap-2">
                          {storyboardJson.scenes.map((scene, i) => {
                            const imgUrl = imageMap.get(scene.scene);
                            const clip = voiceoverJson?.clips?.find((c) => c.scene === scene.scene);
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                              >
                                {/* Thumbnail */}
                                <div className="w-24 h-14 rounded overflow-hidden bg-muted flex-shrink-0 border">
                                  {imgUrl ? (
                                    <img
                                      src={imgUrl}
                                      alt={`Scene ${scene.scene}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                                    </div>
                                  )}
                                </div>
                                {/* Scene info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5">
                                      Scene {scene.scene}
                                    </Badge>
                                    {imgUrl && (
                                      <span className="text-[10px] text-green-400">🖼️</span>
                                    )}
                                    {clip && (
                                      <span className="text-[10px] text-green-400">
                                        🎤 ~{clip.duration}s
                                      </span>
                                    )}
                                    {!imgUrl && (
                                      <span className="text-[10px] text-yellow-400">
                                        ⬜ no image
                                      </span>
                                    )}
                                    {!clip && (
                                      <span className="text-[10px] text-yellow-400">
                                        ⬜ no audio
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    "{scene.dialogue}"
                                  </p>
                                </div>
                                {/* Transition */}
                                <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                                  {scene.transition}
                                </Badge>
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
                        Nhấn "Assemble Video" để bắt đầu render. Video sẽ được tạo ngay trong
                        browser bằng Canvas API.
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
                            : '⚠️ Cần chạy Step 4 (Voiceover) trước — đã có ảnh, chỉ cần thêm audio.'}
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
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Generation Logs</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {run.logs.length} entries
              </Badge>
            </CardHeader>
            <CardContent>
              {run.logs.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No logs yet</p>
                  <p className="text-xs text-muted-foreground/60">
                    Logs will appear here when the pipeline runs
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="font-mono text-xs space-y-0.5">
                    {run.logs.map((log, i) => (
                      <div
                        key={i}
                        className={`py-0.5 flex items-start gap-2 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        <span className="text-muted-foreground shrink-0">
                          {new Date(log.t).toLocaleTimeString('vi-VN')}
                        </span>
                        {log.level === 'error' && (
                          <span className="text-red-500 shrink-0">ERR</span>
                        )}
                        {log.level === 'warn' && (
                          <span className="text-yellow-500 shrink-0">WRN</span>
                        )}
                        <span className="break-all">{log.msg}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
