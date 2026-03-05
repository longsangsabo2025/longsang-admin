/**
 * 🎬 YouTube Channels — 5-Channel Strategy Dashboard
 * 
 * One-click video generation: Select channel → Pick topic → Generate script + storyboard
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Play, Tv, BookOpen, Brain, Mic, Sparkles, Loader2,
  CheckCircle2, XCircle, Clock, Zap, Eye, FileText,
  Copy, Download, RefreshCw, Search, ChevronRight, ExternalLink,
  Layers, Key,
} from 'lucide-react';
import { youtubeChannelsService } from '@/services/youtube-channels.service';
import type { ChannelPlan, GenerateRequest, GenerationRun } from '@/services/youtube-channels.service';
import PipelineRoadmap, { type PipelineConfig } from '@/components/youtube/PipelineRoadmap';

// ─── STATUS CONFIG ─────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ready: { label: 'Ready to Launch', color: 'bg-green-500', icon: CheckCircle2 },
  planned: { label: 'Planned', color: 'bg-blue-500', icon: Clock },
  experimental: { label: 'Experimental', color: 'bg-purple-500', icon: Sparkles },
};

// ─── MAIN COMPONENT ────────────────────────────────────────

export default function YouTubeChannelsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Persisted State (survives reload) ──
  const s = (() => {
    try { return JSON.parse(localStorage.getItem('yt-channels-state') || '{}'); } catch { return {}; }
  })();
  const [selectedChannel, setSelectedChannel] = useState<ChannelPlan | null>(null);
  const [_savedChannelId] = useState<string | null>(s.channelId || null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [topic, setTopic] = useState(s.topic || '');
  const [transcript, setTranscript] = useState(s.transcript || '');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mode, setMode] = useState<'topic' | 'transcript'>(s.mode || 'topic');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [activeTab, setActiveTab] = useState(s.activeTab || 'generate');

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

  // ── Restore selectedChannel from saved ID once plans load ──
  useEffect(() => {
    if (plansData?.channels && _savedChannelId && !selectedChannel) {
      const found = plansData.channels.find(c => c.id === _savedChannelId);
      if (found) setSelectedChannel(found);
    }
  }, [plansData, _savedChannelId, selectedChannel]);

  // ── Persist key state to localStorage ──
  useEffect(() => {
    const save: Record<string, unknown> = {
      channelId: selectedChannel?.id || null,
      topic,
      transcript,
      mode,
      activeTab,
    };
    localStorage.setItem('yt-channels-state', JSON.stringify(save));
  }, [selectedChannel, topic, transcript, mode, activeTab]);

  // ── Debounce transcript search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(transcriptSearch), 300);
    return () => clearTimeout(timer);
  }, [transcriptSearch]);

  const { data: knowledgeData } = useQuery({
    queryKey: ['youtube-channels', 'knowledge'],
    queryFn: () => youtubeChannelsService.getKnowledgeStats(),
  });

  const { data: runsData, refetch: refetchRuns } = useQuery({
    queryKey: ['youtube-channels', 'runs'],
    queryFn: () => youtubeChannelsService.getRuns(),
    refetchInterval: activeRunId ? 3000 : false,
  });

  const { data: transcriptsData } = useQuery({
    queryKey: ['youtube-channels', 'transcripts', debouncedSearch],
    queryFn: () => youtubeChannelsService.searchTranscripts(debouncedSearch, 30),
    enabled: mode === 'transcript',
  });

  // Poll active run
  const { data: activeRun } = useQuery({
    queryKey: ['youtube-channels', 'run', activeRunId],
    queryFn: () => activeRunId ? youtubeChannelsService.getRunStatus(activeRunId) : null,
    enabled: !!activeRunId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (activeRun && (activeRun.status === 'completed' || activeRun.status === 'failed')) {
      if (activeRun.status === 'completed') {
        toast({ title: '✅ Generation Complete', description: `Script + Storyboard ready!` });
        setActiveTab('results');
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

  const handleQuickGenerate = (channel: ChannelPlan, topicText: string) => {
    setSelectedChannel(channel);
    generateMut.mutate({
      channelId: channel.id,
      topic: topicText,
      scenes: 12,
      duration: 6,
      style: channel.style,
    });
  };

  const handlePipelineRun = (pipelineConfig: PipelineConfig) => {
    const req: GenerateRequest = {
      channelId: selectedChannel?.id,
      scenes: pipelineConfig.storyboard.scenes,
      duration: pipelineConfig.storyboard.duration,
      style: pipelineConfig.storyboard.style,
      scriptOnly: !pipelineConfig.storyboard.enabled,
      storyboardOnly: !pipelineConfig.scriptWriter.enabled,
      model: pipelineConfig.scriptWriter.model,
      tone: pipelineConfig.scriptWriter.tone,
      customPrompt: pipelineConfig.scriptWriter.customPrompt || undefined,
      wordTarget: pipelineConfig.scriptWriter.wordTarget,
      aspectRatio: pipelineConfig.storyboard.aspectRatio,
    };
    if (mode === 'topic' && topic.trim()) {
      req.topic = topic.trim();
    } else if (mode === 'transcript' && transcript) {
      req.transcript = transcript;
    } else {
      toast({ title: 'Missing Input', description: 'Enter a topic or select a transcript', variant: 'destructive' });
      return;
    }
    generateMut.mutate(req);
  };

  const handlePipelineStepRun = (step: string, pipelineConfig: PipelineConfig) => {
    const req: GenerateRequest = {
      channelId: selectedChannel?.id,
      model: pipelineConfig.scriptWriter.model,
      tone: pipelineConfig.scriptWriter.tone,
      customPrompt: pipelineConfig.scriptWriter.customPrompt || undefined,
      scenes: pipelineConfig.storyboard.scenes,
      duration: pipelineConfig.storyboard.duration,
      style: pipelineConfig.storyboard.style,
      wordTarget: pipelineConfig.scriptWriter.wordTarget,
      aspectRatio: pipelineConfig.storyboard.aspectRatio,
    };
    if (mode === 'topic' && topic.trim()) {
      req.topic = topic.trim();
    } else if (mode === 'transcript' && transcript) {
      req.transcript = transcript;
    } else {
      toast({ title: 'Missing Input', description: 'Enter a topic or select a transcript', variant: 'destructive' });
      return;
    }
    stepMut.mutate({ step, req });
  };

  const channels = plansData?.channels || [];

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
            5-Channel Strategy • Script + Hailuo 2.3 Storyboard Generator
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

      {/* ── Active Run Banner ── */}
      {activeRun && activeRun.status === 'running' && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <div>
                  <p className="font-medium">Generating: {activeRun.input.topic || activeRun.input.transcript}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeRun.channelName || 'Custom'} • {activeRun.logs.length} log entries
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="animate-pulse">RUNNING</Badge>
              </div>
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

      {/* ── Channel Cards ── */}
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
              isSelected={selectedChannel?.id === channel.id}
              onSelect={() => setSelectedChannel(channel)}
              onQuickGenerate={(topic) => handleQuickGenerate(channel, topic)}
            />
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" /> Generate
          </TabsTrigger>
          <TabsTrigger value="runs" className="gap-2">
            <Layers className="h-4 w-4" /> History ({runsData?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <Eye className="h-4 w-4" /> Results
          </TabsTrigger>
        </TabsList>

        {/* ── Generate Tab ── */}
        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Input Source */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Input Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Selection */}
                <div className="space-y-2">
                  <Label className="text-xs">Channel</Label>
                  <Select 
                    value={selectedChannel?.id || ''} 
                    onValueChange={(v) => setSelectedChannel(channels.find(c => c.id === v) || null)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select a channel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.avatar} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Input Mode */}
                <div className="space-y-2">
                  <Label className="text-xs">Input Type</Label>
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
                </div>

                {mode === 'topic' ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Topic</Label>
                    <Textarea
                      placeholder="e.g. Bí mật thẻ tín dụng — đòn bẩy hay bẫy nợ?"
                      className="resize-none h-20 text-sm"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                    {selectedChannel && (
                      <div className="flex flex-wrap gap-1">
                        {selectedChannel.sampleTopics.map((t, i) => (
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
                    )}
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
                      <ScrollArea className="h-36 border rounded-md p-2">
                        {transcriptsData.transcripts.map((t) => (
                          <div
                            key={t.id}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted text-xs ${transcript === t.id ? 'bg-primary/10 border border-primary/30' : ''}`}
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
              </CardContent>
            </Card>

            {/* Right: Pipeline Roadmap */}
            <Card className="lg:col-span-2">
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
                  channelId={selectedChannel?.id}
                  channelStyle={selectedChannel?.style}
                  onRun={handlePipelineRun}
                  onRunStep={handlePipelineStepRun}
                  isRunning={generateMut.isPending || stepMut.isPending}
                  activeRun={activeRun ? { status: activeRun.status, logs: activeRun.logs, error: activeRun.error, result: activeRun.result } : undefined}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Runs History Tab ── */}
        <TabsContent value="runs">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>{runsData?.total || 0} runs</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchRuns()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(!runsData?.runs || runsData.runs.length === 0) ? (
                  <p className="text-center text-muted-foreground py-8">No generation runs yet. Start one above!</p>
                ) : (
                  runsData.runs.map((run) => (
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
            <ResultsView run={activeRun} />
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
  isSelected,
  onSelect,
  onQuickGenerate,
}: {
  channel: ChannelPlan;
  isSelected: boolean;
  onSelect: () => void;
  onQuickGenerate: (topic: string) => void;
}) {
  const status = STATUS_MAP[channel.status] || STATUS_MAP.planned;
  const StatusIcon = status.icon;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onSelect}
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

        {/* Quick generate buttons */}
        <div className="space-y-1">
          {channel.sampleTopics.slice(0, 2).map((topic, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-7 truncate"
              onClick={(e) => {
                e.stopPropagation();
                onQuickGenerate(topic);
              }}
            >
              <Play className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{topic}</span>
            </Button>
          ))}
        </div>

        {/* Action */}
        <Button
          size="sm"
          className="w-full"
          style={{ backgroundColor: channel.color }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <Sparkles className="h-4 w-4 mr-1" /> Generate Video
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── RUN CARD ─────────────────────────────────────────────

function RunCard({ run, onView }: { run: GenerationRun; onView: () => void }) {
  const statusColor = run.status === 'completed' ? 'text-green-500' : run.status === 'failed' ? 'text-red-500' : 'text-blue-500';
  const StatusIcon = run.status === 'completed' ? CheckCircle2 : run.status === 'failed' ? XCircle : Loader2;

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
            {run.channelName || 'Custom'} • {new Date(run.startedAt).toLocaleString('vi-VN')}
            {run.durationMs ? ` • ${(run.durationMs / 1000).toFixed(1)}s` : ''}
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

function ResultsView({ run }: { run: GenerationRun }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const result = run.result;
  if (!result) return null;

  const scriptJson = result.files?.['script.json'] as Record<string, unknown> | undefined;
  const scriptTxt = result.files?.['script.txt'] as string | undefined;
  const storyboardMd = result.files?.['storyboard.md'] as string | undefined;
  const promptsTxt = result.files?.['prompts.txt'] as string | undefined;
  const storyboardJson = result.files?.['storyboard.json'] as { scenes?: { scene: number; dialogue: string; prompt: string; motion: string; transition: string }[] } | undefined;

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => storyboardMd && copyToClipboard(storyboardMd, 'storyboard')}
              >
                {copiedField === 'storyboard' ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copiedField === 'storyboard' ? 'Copied!' : 'Copy All'}
              </Button>
            </CardHeader>
            <CardContent>
              {storyboardJson?.scenes ? (
                <div className="space-y-3">
                  {storyboardJson.scenes.map((scene, i) => (
                    <div key={i} className="p-3 rounded-lg border hover:bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">Scene {scene.scene}</Badge>
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
                    </div>
                  ))}
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
