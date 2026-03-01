import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, Sparkles, Play, Download, Clock, AlertCircle, ImageIcon, Info, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { VideoPreviewModal } from '@/components/video/VideoPreviewModal';

// Veo 3 API Configuration
const VEO_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBfLqZs_2OeJ8ZptYcaeTlB1HqMegtKSmA';
const VEO_MODELS = {
  'veo-3.0-generate-001': { name: 'Veo 3.0', price: '$0.40/video', desc: 'Latest model with audio' },
  'veo-3.1-generate-preview': { name: 'Veo 3.1 Preview', price: '$0.40/video', desc: 'Enhanced quality' },
  'veo-2.0-generate-001': { name: 'Veo 2.0', price: '$0.35/video', desc: 'Faster generation' },
};

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)', icon: '🖥️' },
  { value: '9:16', label: '9:16 (Portrait/TikTok)', icon: '📱' },
  { value: '1:1', label: '1:1 (Square)', icon: '⬜' },
];

const DURATION_OPTIONS = [
  { value: '5', label: '5 giây', desc: 'Short clip' },
  { value: '8', label: '8 giây', desc: 'Standard' },
];

interface VideoResult {
  id: string;
  videoUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  duration: string;
  createdAt: Date;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

interface Props {
  onVideoGenerated?: (video: { url: string; prompt: string; type: string }) => void;
}

export function VeoVideoGenerator({ onVideoGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [previewVideo, setPreviewVideo] = useState<VideoResult | null>(null);
  const [model, setModel] = useState('veo-3.0-generate-001');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState('8');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Generate video using Veo API
  const generateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả video');
      return;
    }

    setIsGenerating(true);
    setCurrentProgress(0);
    
    const videoId = `video-${Date.now()}`;
    const newVideo: VideoResult = {
      id: videoId,
      videoUrl: '',
      prompt: prompt.trim(),
      model,
      aspectRatio,
      duration,
      createdAt: new Date(),
      status: 'generating',
      progress: 0,
    };
    
    setVideos(prev => [newVideo, ...prev]);
    toast.info('🎬 Đang tạo video với Veo 3...');

    try {
      // Step 1: Start video generation
      const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${VEO_API_KEY}`;
      
      const requestBody: Record<string, unknown> = {
        instances: [{
          prompt: prompt.trim(),
        }],
        parameters: {
          aspectRatio,
          durationSeconds: parseInt(duration),
          numberOfVideos: 1,
          personGeneration: 'allow_adult',
          includeRaiReason: true,
          generateAudio: model.includes('veo-3'),
        },
      };

      // Add reference image if provided
      if (referenceImage) {
        (requestBody.instances as Record<string, unknown>[])[0].image = {
          bytesBase64Encoded: referenceImage.split(',')[1],
        };
      }

      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const operationData = await response.json();
      const operationName = operationData.name;

      if (!operationName) {
        throw new Error('No operation name returned');
      }

      // Step 2: Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        attempts++;
        
        const progress = Math.min(95, (attempts / maxAttempts) * 100);
        setCurrentProgress(progress);
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, progress } : v
        ));

        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${VEO_API_KEY}`;
        const pollResponse = await fetch(pollUrl);
        
        if (!pollResponse.ok) {
          continue; // Retry
        }

        const pollData = await pollResponse.json();
        
        if (pollData.done) {
          completed = true;
          
          if (pollData.error) {
            throw new Error(pollData.error.message || 'Video generation failed');
          }

          const videoResult = pollData.response?.generatedVideos?.[0];
          
          if (videoResult?.video?.uri) {
            const videoUrl = videoResult.video.uri;
            
            setVideos(prev => prev.map(v => 
              v.id === videoId ? { ...v, videoUrl, status: 'completed', progress: 100 } : v
            ));
            
            setCurrentProgress(100);
            toast.success('🎉 Video đã được tạo thành công!');
            
            if (onVideoGenerated) {
              onVideoGenerated({
                url: videoUrl,
                prompt: prompt.trim(),
                type: 'video',
              });
            }
          } else if (videoResult?.video?.bytesBase64Encoded) {
            // Convert base64 to blob URL
            const base64 = videoResult.video.bytesBase64Encoded;
            const blob = await fetch(`data:video/mp4;base64,${base64}`).then(r => r.blob());
            const videoUrl = URL.createObjectURL(blob);
            
            setVideos(prev => prev.map(v => 
              v.id === videoId ? { ...v, videoUrl, status: 'completed', progress: 100 } : v
            ));
            
            setCurrentProgress(100);
            toast.success('🎉 Video đã được tạo thành công!');
            
            if (onVideoGenerated) {
              onVideoGenerated({
                url: videoUrl,
                prompt: prompt.trim(),
                type: 'video',
              });
            }
          } else {
            throw new Error('No video data in response');
          }
        }
      }

      if (!completed) {
        throw new Error('Video generation timed out');
      }

    } catch (error) {
      console.error('Veo API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, status: 'failed', error: errorMessage } : v
      ));
      
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
      setCurrentProgress(0);
    }
  }, [prompt, model, aspectRatio, duration, referenceImage, onVideoGenerated]);

  // Handle reference image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      toast.success('Đã thêm ảnh tham khảo');
    };
    reader.readAsDataURL(file);
  }, []);

  // Download video
  const downloadVideo = useCallback(async (video: VideoResult) => {
    if (!video.videoUrl) return;

    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `veo3-video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Đã tải video!');
    } catch {
      toast.error('Lỗi khi tải video');
    }
  }, []);

  // Prompt suggestions
  const promptSuggestions = [
    'A cat playing piano in a cozy living room, warm lighting, cinematic',
    'Aerial drone shot of a tropical beach at sunset, waves crashing',
    'A futuristic city at night with flying cars and neon lights',
    'Slow motion coffee being poured into a glass cup, studio lighting',
    'A cute robot learning to dance, pixar style animation',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Generator Panel */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-500" />
            Veo 3 Video Generator
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Video
            </Badge>
          </CardTitle>
          <CardDescription>
            Tạo video từ text với Google Veo 3 - Model video AI tiên tiến nhất
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Model Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VEO_MODELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{value.name}</span>
                        <Badge variant="outline" className="text-xs">{value.price}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Thời lượng</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tỉ lệ khung hình</label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map(ratio => (
                <Button
                  key={ratio.value}
                  variant={aspectRatio === ratio.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAspectRatio(ratio.value)}
                  className="flex-1"
                >
                  <span className="mr-1">{ratio.icon}</span>
                  {ratio.value}
                </Button>
              ))}
            </div>
          </div>

          {/* Reference Image (optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Ảnh tham khảo (tùy chọn)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="reference-image-upload"
              />
              <label
                htmlFor="reference-image-upload"
                className={cn(
                  "flex-1 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-purple-500 transition-colors text-center",
                  referenceImage ? "border-purple-500 bg-purple-500/10" : "border-border"
                )}
              >
                {referenceImage ? (
                  <div className="flex items-center justify-center gap-2">
                    <img src={referenceImage} alt="Reference" className="h-16 w-16 object-cover rounded" />
                    <span className="text-sm text-muted-foreground">Click để thay đổi</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Kéo thả hoặc click để upload ảnh làm khung hình đầu
                  </span>
                )}
              </label>
              {referenceImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReferenceImage(null)}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả video</label>
            <Textarea
              placeholder="Describe the video you want to create... (Veo 3 supports audio generation)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Mô tả chi tiết về chuyển động, góc quay, ánh sáng, và phong cách
            </p>
          </div>

          {/* Prompt Suggestions */}
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.slice(0, 3).map((suggestion, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPrompt(suggestion)}
              >
                {suggestion.slice(0, 40)}...
              </Button>
            ))}
          </div>

          {/* Generate Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={generateVideo}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo video... ({Math.round(currentProgress)}%)
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Tạo Video với Veo 3
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={currentProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                ⏱️ Video generation có thể mất 2-5 phút
              </p>
            </div>
          )}

          {/* Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Veo 3 là model video AI tiên tiến nhất của Google, hỗ trợ tạo video có âm thanh tự động.
              Chi phí ~$0.40/video (8 giây). Model được train với hàng triệu video chất lượng cao.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Video History Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Video History
          </CardTitle>
          <CardDescription>
            Video đã tạo ({videos.filter(v => v.status === 'completed').length})
          </CardDescription>
        </CardHeader>

        <CardContent>
          {videos.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Video className="h-12 w-12 mb-3 opacity-30" />
              <p>Chưa có video nào</p>
              <p className="text-xs mt-1">Tạo video để xem tại đây</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    video.status === 'completed' && "bg-green-950/30 border-green-800",
                    video.status === 'generating' && "bg-yellow-950/30 border-yellow-800",
                    video.status === 'failed' && "bg-red-950/30 border-red-800"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium line-clamp-2">{video.prompt}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-xs",
                        video.status === 'completed' && "text-green-400 border-green-600",
                        video.status === 'generating' && "text-yellow-400 border-yellow-600",
                        video.status === 'failed' && "text-red-400 border-red-600"
                      )}
                    >
                      {video.status === 'generating' ? `${Math.round(video.progress || 0)}%` : video.status}
                    </Badge>
                  </div>

                  {video.status === 'generating' && (
                    <Progress value={video.progress} className="h-1 mb-2" />
                  )}

                  {video.status === 'failed' && video.error && (
                    <div className="flex items-center gap-1 text-xs text-red-400 mb-2">
                      <AlertCircle className="h-3 w-3" />
                      {video.error}
                    </div>
                  )}

                  {video.status === 'completed' && video.videoUrl && (
                    <div className="space-y-2">
                      <video
                        src={video.videoUrl}
                        controls
                        className="w-full rounded aspect-video bg-black"
                        preload="metadata"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPreviewVideo(video)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview & Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => downloadVideo(video)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Tải video
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {VEO_MODELS[video.model as keyof typeof VEO_MODELS]?.name || video.model}
                    </Badge>
                    <span>{video.aspectRatio}</span>
                    <span>{video.duration}s</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPreviewModal
          open={!!previewVideo}
          onOpenChange={(open) => !open && setPreviewVideo(null)}
          videoUrl={previewVideo.videoUrl}
          videoTitle={`Veo Video - ${previewVideo.prompt.substring(0, 50)}...`}
          onThumbnailExtracted={(thumbnailUrl) => {
            toast.success('Thumbnail extracted!');
          }}
        />
      )}
    </div>
  );
}

export default VeoVideoGenerator;
