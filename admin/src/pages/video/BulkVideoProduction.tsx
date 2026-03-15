/**
 * 🎬 Bulk Video Factory - Elon Mode
 * Simple. Fast. Works.
 */

import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Video,
  Volume2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// =============================================================================
// TYPES
// =============================================================================

interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  step: string;
  data: { topic: string; voice_id: string; duration: number };
  script?: string;
  audio_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
}

// =============================================================================
// API
// =============================================================================

const API = 'http://localhost:3012';

const api = {
  health: () => fetch(`${API}/health`).then((r) => r.json()),
  voices: () =>
    fetch(`${API}/api/voices`)
      .then((r) => r.json())
      .then((d) => d.voices as Voice[]),
  jobs: () => fetch(`${API}/api/jobs`).then((r) => r.json()) as Promise<VideoJob[]>,

  generateScript: (topic: string, duration = 60) =>
    fetch(`${API}/api/script/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, duration }),
    }).then((r) => r.json()),

  createVideo: (topic: string, voice_id: string, duration = 60) =>
    fetch(`${API}/api/produce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, voice_id, duration }),
    }).then((r) => r.json()),

  createBatch: (topics: string[], voice_id: string, duration = 60) =>
    fetch(`${API}/api/produce/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics, voice_id, duration }),
    }).then((r) => r.json()),

  deleteJob: (id: string) =>
    fetch(`${API}/api/job/${id}`, { method: 'DELETE' }).then((r) => r.json()),
};

// =============================================================================
// STATUS BADGE
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: {
      color: 'bg-yellow-500/10 text-yellow-500',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    processing: {
      color: 'bg-blue-500/10 text-blue-500',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    completed: {
      color: 'bg-green-500/10 text-green-500',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    failed: { color: 'bg-red-500/10 text-red-500', icon: <XCircle className="w-3 h-3" /> },
  };
  const { color, icon } = config[status] || config.pending;

  return (
    <Badge className={`${color} gap-1`}>
      {icon}
      {status}
    </Badge>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BulkVideoProduction() {
  const navigate = useNavigate();

  // State
  const [connected, setConnected] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [topic, setTopic] = useState('');
  const [batchTopics, setBatchTopics] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-HoaiMyNeural');
  const [duration, setDuration] = useState(60);
  const [scriptPreview, setScriptPreview] = useState('');

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const health = await api.health();
        setConnected(health.status === 'ok');

        const [voiceList, jobList] = await Promise.all([api.voices(), api.jobs()]);
        setVoices(voiceList);
        setJobs(jobList);
      } catch {
        setConnected(false);
        toast.error('Cannot connect to Bulk Video Factory');
      }
    };
    init();
  }, []);

  // Poll jobs every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const jobList = await api.jobs();
        setJobs(jobList);
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate script preview
  const handlePreviewScript = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Nhập chủ đề trước');
      return;
    }
    setLoading(true);
    try {
      const result = await api.generateScript(topic, duration);
      setScriptPreview(result.script);
      toast.success('Script generated!');
    } catch {
      toast.error('Failed to generate script');
    } finally {
      setLoading(false);
    }
  }, [topic, duration]);

  // Create single video
  const handleCreateVideo = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Nhập chủ đề');
      return;
    }
    setLoading(true);
    try {
      const result = await api.createVideo(topic, selectedVoice, duration);
      toast.success(`Video job created: ${result.job_id}`);
      setTopic('');
      setScriptPreview('');
      const jobList = await api.jobs();
      setJobs(jobList);
    } catch {
      toast.error('Failed to create video');
    } finally {
      setLoading(false);
    }
  }, [topic, selectedVoice, duration]);

  // Create batch
  const handleCreateBatch = useCallback(async () => {
    const topics = batchTopics
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    if (topics.length === 0) {
      toast.error('Nhập ít nhất 1 chủ đề');
      return;
    }
    setLoading(true);
    try {
      const result = await api.createBatch(topics, selectedVoice, duration);
      toast.success(`Created ${result.job_ids.length} video jobs`);
      setBatchTopics('');
      const jobList = await api.jobs();
      setJobs(jobList);
    } catch {
      toast.error('Failed to create batch');
    } finally {
      setLoading(false);
    }
  }, [batchTopics, selectedVoice, duration]);

  // Delete job
  const handleDeleteJob = useCallback(
    async (id: string) => {
      await api.deleteJob(id);
      setJobs(jobs.filter((j) => j.id !== id));
      toast.success('Job deleted');
    },
    [jobs]
  );

  // Refresh jobs
  const handleRefresh = useCallback(async () => {
    const jobList = await api.jobs();
    setJobs(jobList);
    toast.success('Refreshed');
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Bulk Video Factory
            </h1>
            <p className="text-muted-foreground">Elon Mode: Simple & Fast</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'destructive'}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Workflow Guide */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-none">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">Quy trình sản xuất video:</span>
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <div className="flex items-center gap-2 bg-background/80 px-3 py-2 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Nhập chủ đề</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2 bg-background/80 px-3 py-2 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>AI viết script</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2 bg-background/80 px-3 py-2 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>TTS đọc voice</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2 bg-background/80 px-3 py-2 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Download audio</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 <strong>Tip:</strong> Preview script trước để kiểm tra nội dung. Voice sử dụng Edge
            TTS (miễn phí, chất lượng cao).
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Video */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="single">
            <TabsList>
              <TabsTrigger value="single">🎬 Single Video</TabsTrigger>
              <TabsTrigger value="batch">📦 Batch Create</TabsTrigger>
              <TabsTrigger value="guide">📖 Hướng dẫn</TabsTrigger>
            </TabsList>

            {/* Guide Tab */}
            <TabsContent value="guide" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📖 Hướng dẫn sử dụng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <h4 className="font-semibold mb-2">🎬 Tạo Video Đơn</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Nhập <strong>chủ đề</strong> video (VD: "Cách kiếm tiền online 2026")
                        </li>
                        <li>
                          Chọn <strong>giọng đọc</strong> (Tiếng Việt hoặc English)
                        </li>
                        <li>
                          Đặt <strong>thời lượng</strong> mong muốn (15-300 giây)
                        </li>
                        <li>
                          Click <strong>"Preview Script"</strong> để xem nội dung AI viết
                        </li>
                        <li>
                          Click <strong>"Create Video"</strong> để bắt đầu sản xuất
                        </li>
                      </ol>
                    </div>

                    <div className="p-4 bg-purple-500/10 rounded-lg">
                      <h4 className="font-semibold mb-2">📦 Tạo Batch (Nhiều video)</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Nhập nhiều chủ đề, <strong>mỗi dòng 1 chủ đề</strong>
                        </li>
                        <li>Chọn giọng đọc và thời lượng chung cho tất cả</li>
                        <li>
                          Click <strong>"Create X Videos"</strong>
                        </li>
                        <li>Hệ thống sẽ tự động xử lý từng video</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <h4 className="font-semibold mb-2">💾 Output hiện tại</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          <strong>Script:</strong> Nội dung video do AI viết
                        </li>
                        <li>
                          <strong>Audio MP3:</strong> File giọng đọc (Edge TTS - miễn phí)
                        </li>
                        <li>
                          Click <strong>Play</strong> để nghe, <strong>Download</strong> để tải về
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-500/10 rounded-lg">
                      <h4 className="font-semibold mb-2">🚀 Roadmap sắp tới</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>✅ AI Script Generation (OpenAI)</li>
                        <li>✅ Text-to-Speech (Edge TTS)</li>
                        <li>⏳ Stock Video từ Pexels</li>
                        <li>⏳ Auto Video Composition (FFmpeg)</li>
                        <li>⏳ Subtitle Generation</li>
                        <li>⏳ YouTube Auto Upload</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">⚙️ Yêu cầu kỹ thuật</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Service chạy trên port{' '}
                          <code className="bg-background px-1 rounded">3012</code>
                        </li>
                        <li>
                          Cần có <code className="bg-background px-1 rounded">OPENAI_API_KEY</code>{' '}
                          trong .env
                        </li>
                        <li>Edge TTS: Miễn phí, không cần API key</li>
                        <li>
                          Start service:{' '}
                          <code className="bg-background px-1 rounded">python api.py</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Single Video Tab */}
            <TabsContent value="single" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Single Video</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Topic / Chủ đề</Label>
                    <Input
                      placeholder="VD: Cách kiếm tiền online 2026"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Voice</Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.language})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min={15}
                        max={300}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviewScript}
                      disabled={loading || !topic.trim()}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Preview Script
                    </Button>
                    <Button onClick={handleCreateVideo} disabled={loading || !topic.trim()}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      Create Video
                    </Button>
                  </div>

                  {scriptPreview && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <Label className="mb-2 block">Script Preview:</Label>
                      <pre className="text-sm whitespace-pre-wrap">{scriptPreview}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Batch Tab */}
            <TabsContent value="batch" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Create Videos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Topics (mỗi dòng 1 chủ đề)</Label>
                    <Textarea
                      placeholder={`VD:\nCách kiếm tiền online\nKinh nghiệm đầu tư crypto\nBí quyết học tiếng Anh`}
                      value={batchTopics}
                      onChange={(e) => setBatchTopics(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Voice</Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.language})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration each (seconds)</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min={15}
                        max={300}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateBatch}
                    disabled={loading || !batchTopics.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1" />
                    )}
                    Create {batchTopics.split('\n').filter((t) => t.trim()).length} Videos
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Job Queue */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>📋 Job Queue</span>
                <Badge variant="outline">{jobs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {jobs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No jobs yet. Create one!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={job.status} />
                          <span className="text-xs text-muted-foreground">{job.id}</span>
                        </div>

                        <p className="text-sm font-medium line-clamp-1">{job.data.topic}</p>

                        {job.status === 'processing' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{job.step}</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-1" />
                          </div>
                        )}

                        {job.status === 'completed' && job.audio_url && (
                          <div className="flex gap-2">
                            <a
                              href={`${API}${job.audio_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button size="sm" variant="outline" className="w-full">
                                <Volume2 className="w-3 h-3 mr-1" />
                                Play
                              </Button>
                            </a>
                            <a href={`${API}${job.audio_url}`} download>
                              <Button size="sm" variant="outline">
                                <Download className="w-3 h-3" />
                              </Button>
                            </a>
                          </div>
                        )}

                        {job.status === 'failed' && job.error && (
                          <p className="text-xs text-red-500">{job.error}</p>
                        )}

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleTimeString()}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteJob(job.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
