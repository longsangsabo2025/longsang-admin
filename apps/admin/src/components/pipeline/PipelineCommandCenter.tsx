import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Play, RotateCcw, Zap, Clock, AlertCircle, CheckCircle2,
  Loader2, RefreshCw, Mic, Brain, Pen, Eye, Film, Upload, Search,
  Settings2, Palette, History, Volume2,
  Save, ChevronDown, ChevronUp, DollarSign, Timer,
  ListPlus, Trash2, SkipForward, XCircle, CircleDot,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { VisualStudio } from './VisualStudio';

const API_BASE = '/api';

const AGENTS = [
  { id: 'harvester', name: 'Harvester', icon: Search, desc: 'Content extraction from YouTube/web' },
  { id: 'brain-curator', name: 'Brain Curator', icon: Brain, desc: 'Knowledge curation + book refs' },
  { id: 'script-writer', name: 'Script Writer', icon: Pen, desc: 'Podcast script with Voice DNA' },
  { id: 'voice-producer', name: 'Voice Producer', icon: Mic, desc: 'TTS audio generation' },
  { id: 'visual-director', name: 'Visual Director', icon: Eye, desc: 'Visual storyboard + scenes' },
  { id: 'video-assembler', name: 'Video Composer', icon: Film, desc: 'FFmpeg video assembly' },
  { id: 'publisher', name: 'Publisher', icon: Upload, desc: 'YouTube metadata + SEO' },
];

const MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (free, fast)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (smart, free tier)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini ($0.15/1M)' },
  { value: 'gpt-4o', label: 'GPT-4o ($2.50/1M)' },
];

interface AgentConfig {
  agent_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
}

interface VoiceConfig {
  tts_url: string;
  chunk_size: number;
  min_similarity: number;
  max_consecutive_fails: number;
  voice_ref?: string;
  speed: number;
}

interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  channel_name: string;
  bg_color: string;
  text_color: string;
  accent_color: string;
  subtitle_font_size: number;
  subtitle_margin_bottom: number;
  crf: number;
  comfyui_timeout: number;
  image_source: 'comfyui' | 'dalle' | 'gradient';
}

interface StageInfo {
  name: string;
  status: 'completed' | 'running' | 'failed' | 'pending' | 'skipped';
  duration_ms?: number;
  error?: string;
  cost?: number;
}

interface RunHistory {
  id: string;
  pipeline_id: string;
  status: string;
  input: Record<string, unknown>;
  total_cost: number;
  total_duration_ms: number;
  started_at: string;
  completed_at?: string;
  stages?: StageInfo[];
  failed_stage?: number;
  last_completed_stage?: number;
}

interface QueueItem {
  id: string;
  type: 'topic' | 'url';
  value: string;
  status: 'queued' | 'running' | 'done' | 'failed';
}

const DEFAULT_VOICE: VoiceConfig = {
  tts_url: 'http://localhost:8100',
  chunk_size: 250,
  min_similarity: 0.5,
  max_consecutive_fails: 3,
  speed: 1.0,
};

const DEFAULT_VIDEO: VideoConfig = {
  width: 1920, height: 1080, fps: 30,
  channel_name: 'ĐỨNG DẬY ĐI',
  bg_color: '#0a0a0f', text_color: '#ffffff', accent_color: '#e8e8e8',
  subtitle_font_size: 44, subtitle_margin_bottom: 80,
  crf: 20, comfyui_timeout: 30,
  image_source: 'comfyui',
};

const DEFAULT_PROMPTS: Record<string, string> = {
  'harvester': `You are a Content Harvester. Extract key insights, quotes, and data from the provided content. Output structured JSON with: coreTopic, keyPoints[], quotes[], statistics[], emotionalHooks[].`,
  'brain-curator': `You are a Brain Curator with access to a knowledge base of books and transcripts. Cross-reference the harvested content with your knowledge. Find related books, atomic ideas, and rate podcast potential (1-10).`,
  'script-writer': `You are a Script Writer for the Vietnamese podcast channel "ĐỨNG DẬY ĐI".

VOICE DNA:
- Tone: Trực tiếp, mạnh mẽ, nhưng có chiều sâu
- Rhythm: "The Wave" - xen kẽ câu ngắn đanh thép với câu dài sâu lắng
- Must include: [PAUSE], [EMPHASIS], [SLOW] markers
- Signature intro: "Chào mừng đến với ĐỨNG DẬY ĐI"
- Signature outro: "Không ai cứu bạn ngoài chính bạn. Đứng dậy đi."

OUTPUT: JSON with title, script[] (section, text), estimatedMinutes`,
  'voice-producer': 'You are a voice production assistant. Help prepare scripts for TTS conversion.',
  'visual-director': `You are a Visual Director for podcast-style YouTube videos.
Create a visual storyboard: scenes every 10-20s, stock footage keywords, text overlays (max 6 words), transitions.
Style: Dark theme, gold accents, modern finance aesthetic.
OUTPUT: JSON with thumbnail, scenes[], colorPalette, totalScenes`,
  'video-assembler': 'You are a video production assistant.',
  'publisher': `You are a YouTube SEO specialist for Vietnamese content.
Generate: title (<=100 chars), description with chapters, 20+ tags (mix VI/EN), category, social media posts.
OUTPUT: JSON with metadata.youtube, seo, social, analytics`,
};

// ─── COMPONENT ──────────────────────────────────────────

export function PipelineCommandCenter() {
  const [activeTab, setActiveTab] = useState('run');
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(DEFAULT_VIDEO);
  const [history, setHistory] = useState<RunHistory[]>([]);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerInput, setTriggerInput] = useState('');
  const [triggerType, setTriggerType] = useState<'topic' | 'url'>('topic');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [ttsHealth, setTtsHealth] = useState<'online' | 'offline' | 'checking'>('checking');
  const [savedMsg, setSavedMsg] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const loadConfigs = useCallback(async () => {
    try {
      const { data } = await supabase.from('pipeline_agent_configs').select('*');
      if (data?.length) {
        setAgentConfigs(data);
      } else {
        setAgentConfigs(AGENTS.map(a => ({
          agent_id: a.id,
          model: 'gemini-2.0-flash',
          temperature: a.id === 'script-writer' ? 0.85 : a.id === 'visual-director' ? 0.8 : 0.5,
          max_tokens: a.id === 'script-writer' ? 16384 : 4096,
          system_prompt: DEFAULT_PROMPTS[a.id] || '',
        })));
      }
    } catch {
      setAgentConfigs(AGENTS.map(a => ({
        agent_id: a.id, model: 'gemini-2.0-flash',
        temperature: 0.5, max_tokens: 4096,
        system_prompt: DEFAULT_PROMPTS[a.id] || '',
      })));
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      if (data) setHistory(data as RunHistory[]);
    } catch { /* offline */ }
  }, []);

  const checkTTS = useCallback(async () => {
    setTtsHealth('checking');
    try {
      const r = await fetch(`${voiceConfig.tts_url}/v1/health`, { signal: AbortSignal.timeout(5000) });
      setTtsHealth(r.ok ? 'online' : 'offline');
    } catch { setTtsHealth('offline'); }
  }, [voiceConfig.tts_url]);

  useEffect(() => { loadConfigs(); loadHistory(); checkTTS(); }, [loadConfigs, loadHistory, checkTTS]);

  useEffect(() => {
    const ch = supabase.channel('cmd-center-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_runs' }, () => loadHistory())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadHistory]);

  const saveAllConfigs = async () => {
    setSaving(true);
    try {
      for (const cfg of agentConfigs) {
        await supabase.from('pipeline_agent_configs').upsert({
          agent_id: cfg.agent_id,
          model: cfg.model,
          temperature: cfg.temperature,
          max_tokens: cfg.max_tokens,
          system_prompt: cfg.system_prompt || DEFAULT_PROMPTS[cfg.agent_id] || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agent_id' });
      }
      setSavedMsg('All configs saved!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      setSavedMsg('Save failed: ' + String(e));
    } finally { setSaving(false); }
  };

  const updateAgent = (agentId: string, field: string, value: unknown) => {
    setAgentConfigs(prev => prev.map(c =>
      c.agent_id === agentId ? { ...c, [field]: value } : c
    ));
  };

  const buildTriggerBody = (type: 'topic' | 'url', value: string, opts?: { fromStage?: number; pipelineId?: string }) => {
    const body: Record<string, unknown> = type === 'url'
      ? { videoUrl: value } : { topic: value };
    body.configs = Object.fromEntries(agentConfigs.map(c => [c.agent_id, {
      model: c.model, temperature: c.temperature, maxTokens: c.max_tokens,
    }]));
    body.voice = voiceConfig;
    body.video = videoConfig;
    if (opts?.fromStage !== undefined) body.fromStage = opts.fromStage;
    if (opts?.pipelineId) body.resume = opts.pipelineId;
    return body;
  };

  const triggerSingle = async (type: 'topic' | 'url', value: string, opts?: { fromStage?: number; pipelineId?: string }) => {
    const endpoint = opts?.pipelineId ? `${API_BASE}/youtube-crew/resume` : `${API_BASE}/youtube-crew/trigger`;
    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildTriggerBody(type, value, opts)),
    });
    return res.ok;
  };

  const triggerPipeline = async () => {
    if (!triggerInput.trim()) return;
    setTriggering(true);
    try {
      const ok = await triggerSingle(triggerType, triggerInput);
      if (ok) { setTriggerInput(''); loadHistory(); }
    } catch (e) { console.error('Trigger error:', e); }
    finally { setTriggering(false); }
  };

  const addToQueue = () => {
    if (!triggerInput.trim()) return;
    const lines = triggerInput.split('\n').filter(l => l.trim());
    const newItems: QueueItem[] = lines.map(line => ({
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: triggerType,
      value: line.trim(),
      status: 'queued' as const,
    }));
    setQueue(prev => [...prev, ...newItems]);
    setTriggerInput('');
  };

  const runQueue = async () => {
    if (queue.length === 0 || batchRunning) return;
    setBatchRunning(true);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== 'queued') continue;
      setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'running' } : q));
      try {
        const ok = await triggerSingle(item.type, item.value);
        setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: ok ? 'done' : 'failed' } : q));
        if (ok) loadHistory();
        // Wait 5s between runs so pipeline can initialize
        if (i < queue.length - 1) await new Promise(r => setTimeout(r, 5000));
      } catch {
        setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'failed' } : q));
      }
    }
    setBatchRunning(false);
  };

  const resumeFromStage = async (run: RunHistory, stageIndex: number) => {
    try {
      await triggerSingle('topic', String(run.input?.topic || ''), {
        pipelineId: run.pipeline_id || run.id,
        fromStage: stageIndex,
      });
      loadHistory();
    } catch (e) { console.error('Resume error:', e); }
  };

  const getStatusColor = (s: string) => {
    const map: Record<string, string> = {
      completed: 'text-green-500', running: 'text-blue-500',
      failed: 'text-red-500', pending: 'text-muted-foreground',
      paused_cost: 'text-yellow-500',
    };
    return map[s] || 'text-yellow-500';
  };

  const getStatusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle2 className="h-4 w-4" />;
    if (s === 'running') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (s === 'failed') return <XCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  // ─── RENDER ──────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Command Center</h1>
          <p className="text-muted-foreground">YouTube Agent Crew — configure, run, monitor</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ttsHealth === 'online' ? 'default' : 'destructive'} className="gap-1">
            <Volume2 className="h-3 w-3" />
            TTS: {ttsHealth}
          </Badge>
          {savedMsg && <Badge variant="outline" className="text-green-600">{savedMsg}</Badge>}
          <Button variant="outline" size="sm" onClick={() => { loadConfigs(); loadHistory(); checkTTS(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="run" className="gap-1"><Zap className="h-4 w-4" />Run</TabsTrigger>
          <TabsTrigger value="agents" className="gap-1"><Settings2 className="h-4 w-4" />Agents</TabsTrigger>
          <TabsTrigger value="voice" className="gap-1"><Mic className="h-4 w-4" />Voice</TabsTrigger>
          <TabsTrigger value="visual" className="gap-1"><Palette className="h-4 w-4" />Visual</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><History className="h-4 w-4" />History</TabsTrigger>
        </TabsList>

        {/* ═══ TAB: RUN ═══ */}
        <TabsContent value="run" className="space-y-4">
          {/* Single Run */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Production Run
              </CardTitle>
              <CardDescription>
                Template mặc định được áp dụng tự động. Nhập 1 topic/URL → RUN, hoặc thêm vào hàng đợi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="flex border rounded-md overflow-hidden">
                  <button className={`px-3 py-2 text-sm ${triggerType === 'topic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setTriggerType('topic')}>Topic</button>
                  <button className={`px-3 py-2 text-sm ${triggerType === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setTriggerType('url')}>URL</button>
                </div>
                <Input value={triggerInput} onChange={e => setTriggerInput(e.target.value)}
                  placeholder={triggerType === 'url' ? 'https://youtube.com/watch?v=...' : 'Bí mật giấc ngủ mà 99% người không biết'}
                  className="flex-1" onKeyDown={e => e.key === 'Enter' && triggerPipeline()} />
                <Button onClick={triggerPipeline} disabled={triggering || !triggerInput.trim()} size="lg" className="px-6">
                  {triggering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  RUN
                </Button>
                <Button variant="outline" onClick={addToQueue} disabled={!triggerInput.trim()} title="Thêm vào hàng đợi">
                  <ListPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Agent pipeline strip */}
              <div className="grid grid-cols-7 gap-2">
                {AGENTS.map(a => {
                  const cfg = agentConfigs.find(c => c.agent_id === a.id);
                  const Icon = a.icon;
                  return (
                    <Card key={a.id} className="p-2 text-center">
                      <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-[10px] font-medium truncate">{a.name}</p>
                      <p className="text-[9px] text-muted-foreground">{cfg?.model?.split('-').slice(-1)[0] || '?'}</p>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Batch Queue */}
          {queue.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListPlus className="h-4 w-4" />
                    Hàng đợi ({queue.filter(q => q.status === 'queued').length} chờ / {queue.length} tổng)
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={runQueue} disabled={batchRunning || queue.filter(q => q.status === 'queued').length === 0}
                      className="gap-1">
                      {batchRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      Run All
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setQueue([])} disabled={batchRunning}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                    <span className="text-muted-foreground w-6 text-right text-xs">{idx + 1}</span>
                    <span className={
                      item.status === 'done' ? 'text-green-500' :
                      item.status === 'running' ? 'text-blue-500' :
                      item.status === 'failed' ? 'text-red-500' : 'text-muted-foreground'
                    }>
                      {item.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                       item.status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                       item.status === 'failed' ? <XCircle className="h-3.5 w-3.5" /> :
                       <CircleDot className="h-3.5 w-3.5" />}
                    </span>
                    <Badge variant="outline" className="text-[9px]">{item.type}</Badge>
                    <span className="text-xs flex-1 truncate">{item.value}</span>
                    {item.status === 'queued' && !batchRunning && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => setQueue(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick recent runs */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Runs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.slice(0, 5).map(run => {
                  const topicStr = String(run.input?.topic ?? run.input?.videoUrl ?? '');
                  return (
                    <div key={run.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className={getStatusColor(run.status)}>
                          {getStatusIcon(run.status)}
                        </span>
                        <span className="font-mono text-xs">{run.pipeline_id?.slice(-8) || run.id?.slice(0, 8)}</span>
                        <span className="text-muted-foreground text-xs">{topicStr.slice(0, 40)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${(run.total_cost || 0).toFixed(4)}</span>
                        <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(0)}s` : '—'}</span>
                        {(run.status === 'failed' || run.status === 'paused_cost') && (
                          <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px]"
                            onClick={() => resumeFromStage(run, run.last_completed_stage ?? 0)}>
                            <SkipForward className="h-3 w-3" /> Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TAB: AGENTS ═══ */}
        <TabsContent value="agents" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Agent Configuration</h2>
            <Button onClick={saveAllConfigs} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All
            </Button>
          </div>

          {AGENTS.map(a => {
            const cfg = agentConfigs.find(c => c.agent_id === a.id);
            if (!cfg) return null;
            const Icon = a.icon;
            const isExpanded = expandedAgent === a.id;

            return (
              <Card key={a.id}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedAgent(isExpanded ? null : a.id)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon className="h-4 w-4" /> {a.name}
                      <Badge variant="outline" className="text-[10px] ml-2">{cfg.model}</Badge>
                      <Badge variant="secondary" className="text-[10px]">t={cfg.temperature}</Badge>
                    </CardTitle>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Model</Label>
                        <select className="w-full mt-1 text-sm border rounded-md p-2 bg-background"
                          value={cfg.model} onChange={e => updateAgent(a.id, 'model', e.target.value)}>
                          {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Temperature: {cfg.temperature}</Label>
                        <Slider className="mt-2" min={0} max={1} step={0.05}
                          value={[cfg.temperature]} onValueChange={v => updateAgent(a.id, 'temperature', v[0])} />
                      </div>
                      <div>
                        <Label className="text-xs">Max Tokens</Label>
                        <Input type="number" className="mt-1 text-sm" value={cfg.max_tokens}
                          onChange={e => updateAgent(a.id, 'max_tokens', Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">System Prompt</Label>
                      <Textarea className="mt-1 text-xs font-mono min-h-[200px]"
                        value={cfg.system_prompt || DEFAULT_PROMPTS[a.id] || ''}
                        onChange={e => updateAgent(a.id, 'system_prompt', e.target.value)} />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* ═══ TAB: VOICE ═══ */}
        <TabsContent value="voice" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Voice & TTS Configuration</h2>
            <Badge variant={ttsHealth === 'online' ? 'default' : 'destructive'} className="gap-1">
              <Volume2 className="h-3 w-3" />{ttsHealth}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">TTS Server</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">TTS URL</Label>
                  <Input className="mt-1 text-sm" value={voiceConfig.tts_url}
                    onChange={e => setVoiceConfig(v => ({ ...v, tts_url: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Voice Reference (optional .wav path)</Label>
                  <Input className="mt-1 text-sm" placeholder="D:/path/to/voice_ref.wav"
                    value={voiceConfig.voice_ref || ''}
                    onChange={e => setVoiceConfig(v => ({ ...v, voice_ref: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Speed: {voiceConfig.speed}x</Label>
                  <Slider className="mt-2" min={0.5} max={2.0} step={0.1}
                    value={[voiceConfig.speed]} onValueChange={v => setVoiceConfig(c => ({ ...c, speed: v[0] }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quality Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Chunk Size (chars): {voiceConfig.chunk_size}</Label>
                  <Slider className="mt-2" min={100} max={500} step={25}
                    value={[voiceConfig.chunk_size]} onValueChange={v => setVoiceConfig(c => ({ ...c, chunk_size: v[0] }))} />
                  <p className="text-[10px] text-muted-foreground mt-1">Smaller = more stable, slower. 200-300 recommended.</p>
                </div>
                <div>
                  <Label className="text-xs">Min Whisper Similarity: {voiceConfig.min_similarity}</Label>
                  <Slider className="mt-2" min={0.3} max={0.9} step={0.05}
                    value={[voiceConfig.min_similarity]} onValueChange={v => setVoiceConfig(c => ({ ...c, min_similarity: v[0] }))} />
                  <p className="text-[10px] text-muted-foreground mt-1">Lower = more lenient. 0.5 good for Vietnamese.</p>
                </div>
                <div>
                  <Label className="text-xs">Max Consecutive Fails</Label>
                  <Input type="number" className="mt-1 text-sm" value={voiceConfig.max_consecutive_fails}
                    onChange={e => setVoiceConfig(v => ({ ...v, max_consecutive_fails: Number(e.target.value) }))} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB: VISUAL STUDIO ═══ */}
        <TabsContent value="visual" className="space-y-4">
          <VisualStudio videoConfig={videoConfig} setVideoConfig={setVideoConfig} />
        </TabsContent>

        {/* ═══ TAB: HISTORY ═══ */}
        <TabsContent value="history" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Run History ({history.length})</h2>
            <Button variant="outline" size="sm" onClick={loadHistory}><RefreshCw className="h-4 w-4" /></Button>
          </div>

          {history.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No runs yet. Go to Run tab to start.</p>
            </Card>
          ) : (
            history.map(run => {
              const isExpanded = expandedRun === run.id;
              const topicStr = String(run.input?.topic ?? run.input?.videoUrl ?? '');
              const stages: StageInfo[] = (run.stages as StageInfo[] | undefined) || AGENTS.map((a, idx) => ({
                name: a.name,
                status: (run.failed_stage !== undefined && idx === run.failed_stage) ? 'failed' as const :
                        (run.last_completed_stage !== undefined && idx <= run.last_completed_stage) ? 'completed' as const :
                        run.status === 'completed' ? 'completed' as const :
                        run.status === 'running' ? (idx === 0 ? 'running' as const : 'pending' as const) :
                        'pending' as const,
              }));

              return (
                <Card key={run.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedRun(isExpanded ? null : run.id)}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={getStatusColor(run.status)}>
                            {getStatusIcon(run.status)}
                          </span>
                          <code className="text-sm font-mono">{run.pipeline_id?.slice(-12) || run.id?.slice(0, 12)}</code>
                          <Badge variant="outline" className="text-xs">{run.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {run.started_at ? new Date(run.started_at).toLocaleString('vi-VN') : '—'}
                          </span>
                          {topicStr && <span className="truncate max-w-[300px]">{topicStr.slice(0, 60)}</span>}
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${(run.total_cost || 0).toFixed(4)}</span>
                          {run.total_duration_ms ? <span>{(run.total_duration_ms / 1000).toFixed(0)}s</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(run.status === 'failed' || run.status === 'paused_cost') && (
                          <Button variant="default" size="sm" className="gap-1"
                            onClick={e => { e.stopPropagation(); resumeFromStage(run, run.last_completed_stage ?? 0); }}>
                            <SkipForward className="h-3 w-3" /> Resume
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1"
                          onClick={e => { e.stopPropagation(); resumeFromStage(run, 0); }}>
                          <RotateCcw className="h-3 w-3" /> Rerun
                        </Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Expanded: Stage-by-stage detail */}
                    {isExpanded && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pipeline Stages — click stage bị lỗi để resume từ đó:</p>
                        <div className="space-y-1">
                          {stages.map((stage, idx) => {
                            const agent = AGENTS[idx];
                            const Icon = agent?.icon || AlertCircle;
                            const isFailed = stage.status === 'failed';
                            return (
                              <div key={idx}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isFailed ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted/30'} ${isFailed ? 'cursor-pointer hover:bg-red-500/20' : ''}`}
                                onClick={() => { if (isFailed) resumeFromStage(run, idx); }}>
                                <span className="text-muted-foreground w-4 text-xs">{idx + 1}</span>
                                <span className={getStatusColor(stage.status)}>
                                  {getStatusIcon(stage.status)}
                                </span>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium flex-1">{stage.name || agent?.name || `Stage ${idx + 1}`}</span>
                                {stage.duration_ms ? (
                                  <span className="text-xs text-muted-foreground">{(stage.duration_ms / 1000).toFixed(1)}s</span>
                                ) : null}
                                {stage.cost ? (
                                  <span className="text-xs text-muted-foreground">${stage.cost.toFixed(4)}</span>
                                ) : null}
                                {isFailed && (
                                  <div className="flex items-center gap-2">
                                    {stage.error && <span className="text-xs text-red-400 max-w-[200px] truncate">{stage.error}</span>}
                                    <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px] border-red-500/50"
                                      onClick={e => { e.stopPropagation(); resumeFromStage(run, idx); }}>
                                      <SkipForward className="h-3 w-3" /> Fix & Resume
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
