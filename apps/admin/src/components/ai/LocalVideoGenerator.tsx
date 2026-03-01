/**
 * Local AI Video Generator Component
 * Uses local ComfyUI with Wan2.1 model for video generation
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Video, Wand2, Download, Play, Loader2, Settings, History, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalVideoGen, type VideoJob } from '@/hooks/useLocalVideoGen';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ===============================
// TYPES
// ===============================

interface VideoHistoryItem extends VideoJob {
  prompt: string;
  frames: number;
  fps: number;
  resolution: string;
}

// Resolution options
const RESOLUTIONS = [
  { value: '720p', label: '720p (1280×720)', desc: 'HD Landscape' },
  { value: '640x640', label: '640×640', desc: 'Square' },
];

// Frame presets
const FRAME_PRESETS = [
  { value: 41, label: '41 frames', desc: '~2.5s @ 16fps' },
  { value: 81, label: '81 frames', desc: '~5s @ 16fps (Default)' },
  { value: 121, label: '121 frames', desc: '~7.5s @ 16fps' },
];

// FPS options
const FPS_OPTIONS = [
  { value: 8, label: '8 FPS', desc: 'Slow motion' },
  { value: 16, label: '16 FPS', desc: 'Standard (Default)' },
  { value: 24, label: '24 FPS', desc: 'Cinematic' },
];

// Prompt suggestions
const PROMPT_SUGGESTIONS = [
  'A serene mountain lake at sunrise, mist rising from the water, cinematic lighting',
  'A cat walking elegantly through a sunlit garden, shallow depth of field',
  'Futuristic city skyline with flying vehicles, neon lights, cyberpunk atmosphere',
  'Ocean waves crashing on rocky shore, golden hour, slow motion',
  'A cozy coffee shop interior, steam rising from cups, warm ambient lighting',
];

// Local storage key for history
const HISTORY_KEY = 'local-video-gen-history';

// ===============================
// HELPER FUNCTIONS
// ===============================

const loadHistory = (): VideoHistoryItem[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history: VideoHistoryItem[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
  } catch {
    console.error('Failed to save video history');
  }
};

// ===============================
// COMPONENT
// ===============================

interface Props {
  onVideoGenerated?: (video: { url: string; prompt: string; type: string }) => void;
}

export function LocalVideoGenerator({ onVideoGenerated }: Props) {
  // Form state
  const [prompt, setPrompt] = useState('');
  const [frames, setFrames] = useState(81);
  const [fps, setFps] = useState(16);
  const [resolution, setResolution] = useState<'720p' | '640x640'>('720p');
  
  // UI state
  const [activeTab, setActiveTab] = useState('generate');
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);
  
  // Hook
  const {
    generateVideo,
    startPolling,
    stopPolling,
    downloadVideo,
    getDownloadUrl,
    reset,
    job,
    progress,
    loading,
    error,
  } = useLocalVideoGen();

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Watch for job completion
  useEffect(() => {
    if (job?.status === 'completed' && job.video_url) {
      toast.success('🎉 Video generated successfully!');
      
      // Add to history
      const historyItem: VideoHistoryItem = {
        ...job,
        prompt,
        frames,
        fps,
        resolution,
      };
      
      const newHistory = [historyItem, ...history.filter(h => h.job_id !== job.job_id)];
      setHistory(newHistory);
      saveHistory(newHistory);
      
      // Callback
      if (onVideoGenerated && job.video_url) {
        onVideoGenerated({
          url: job.video_url,
          prompt,
          type: 'video',
        });
      }
    } else if (job?.status === 'failed') {
      toast.error(`Generation failed: ${job.error || 'Unknown error'}`);
    }
  }, [job?.status, job?.video_url, job?.error, job?.job_id, prompt, frames, fps, resolution, history, onVideoGenerated]);

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video description');
      return;
    }

    try {
      toast.info('🎬 Starting video generation...');
      
      const newJob = await generateVideo({
        prompt: prompt.trim(),
        frames,
        fps,
        resolution,
      });
      
      // Start polling for status
      startPolling(newJob.job_id);
      
    } catch (err) {
      console.error('Generate error:', err);
    }
  }, [prompt, frames, fps, resolution, generateVideo, startPolling]);

  // Handle download
  const handleDownload = useCallback(async (jobId: string) => {
    try {
      await downloadVideo(jobId, `wan21-video-${Date.now()}.mp4`);
      toast.success('Video downloaded!');
    } catch {
      toast.error('Download failed');
    }
  }, [downloadVideo]);

  // Handle delete from history
  const handleDeleteHistory = useCallback((jobId: string) => {
    const newHistory = history.filter(h => h.job_id !== jobId);
    setHistory(newHistory);
    saveHistory(newHistory);
    toast.success('Removed from history');
  }, [history]);

  // Handle prompt suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPrompt(suggestion);
  }, []);

  // Get status badge
  const getStatusBadge = (status: VideoJob['status']) => {
    const variants: Record<VideoJob['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      queued: { variant: 'secondary', label: 'Queued' },
      processing: { variant: 'default', label: 'Processing' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    const config = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Estimated duration
  const estimatedDuration = Math.round(frames / fps * 10) / 10;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Panel */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Local AI Video Generator
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              <Wand2 className="h-3 w-3 mr-1" />
              Wan2.1 Model
            </Badge>
          </CardTitle>
          <CardDescription>
            Generate videos locally using ComfyUI with Wan2.1 model - No cloud costs!
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="generate" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History
                {history.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {history.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-4">
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Video Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the video you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={loading || (job?.status === 'processing')}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about scene, lighting, camera movement, and style.
                </p>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick prompts:</Label>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1 px-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={loading || (job?.status === 'processing')}
                    >
                      {suggestion.slice(0, 40)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Settings Summary */}
              <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Frames:</span>{' '}
                  <span className="font-medium">{frames}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">FPS:</span>{' '}
                  <span className="font-medium">{fps}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Resolution:</span>{' '}
                  <span className="font-medium">{resolution}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-medium">~{estimatedDuration}s</span>
                </div>
              </div>

              {/* Progress Section */}
              {job && (job.status === 'processing' || job.status === 'queued' || job.status === 'pending') && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="font-medium">Generating video...</span>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}% complete</span>
                    {job.eta && <span>ETA: {Math.round(job.eta)}s</span>}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Video Preview */}
              {job?.status === 'completed' && job.video_url && (
                <div className="space-y-3 p-4 border rounded-lg bg-green-500/10">
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-500" />
                      Video Ready!
                    </span>
                    {getStatusBadge('completed')}
                  </div>
                  <video
                    src={getDownloadUrl(job.job_id)}
                    controls
                    className="w-full rounded-lg max-h-96 bg-black"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(job.job_id)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Video
                    </Button>
                    <Button
                      variant="outline"
                      onClick={reset}
                    >
                      Generate Another
                    </Button>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {(!job || job.status === 'completed' || job.status === 'failed') && (
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Video
                    </>
                  )}
                </Button>
              )}

              {/* Cancel Button */}
              {job && (job.status === 'processing' || job.status === 'queued') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    stopPolling();
                    reset();
                  }}
                  className="w-full"
                >
                  Cancel Generation
                </Button>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Frames Setting */}
              <div className="space-y-2">
                <Label>Number of Frames</Label>
                <Select
                  value={frames.toString()}
                  onValueChange={(v) => setFrames(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAME_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{preset.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({preset.desc})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  More frames = longer video but more processing time
                </p>
              </div>

              {/* FPS Setting */}
              <div className="space-y-2">
                <Label>Frames Per Second (FPS)</Label>
                <Select
                  value={fps.toString()}
                  onValueChange={(v) => setFps(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FPS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({option.desc})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution Setting */}
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select
                  value={resolution}
                  onValueChange={(v) => setResolution(v as '720p' | '640x640')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((res) => (
                      <SelectItem key={res.value} value={res.value}>
                        <div className="flex items-center gap-2">
                          <span>{res.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({res.desc})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated Output */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated duration:</span>
                      <span className="font-medium">~{estimatedDuration} seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total frames:</span>
                      <span className="font-medium">{frames} frames</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Output:</span>
                      <span className="font-medium">{resolution} @ {fps}fps</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No video generation history yet.</p>
                  <p className="text-sm">Generated videos will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.job_id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm line-clamp-2 flex-1">{item.prompt}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteHistory(item.job_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{item.frames} frames</span>
                        <span>{item.fps} fps</span>
                        <span>{item.resolution}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      {item.status === 'completed' && item.video_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item.job_id)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5" />
            About Local Video Gen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">🚀 Features</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>100% local generation - No cloud costs</li>
              <li>Wan2.1 model via ComfyUI</li>
              <li>Customizable frame count & FPS</li>
              <li>720p and square resolutions</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">⚡ Requirements</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>ComfyUI running on port 8188</li>
              <li>Local Video API on port 8203</li>
              <li>GPU with 8GB+ VRAM</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-1">💡 Tips</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Be descriptive with prompts</li>
              <li>Include camera movement</li>
              <li>Specify lighting & mood</li>
              <li>More frames = longer generation</li>
            </ul>
          </div>

          {/* API Status */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API Endpoint:</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                localhost:8203
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LocalVideoGenerator;
