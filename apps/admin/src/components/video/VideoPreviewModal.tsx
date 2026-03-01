/**
 * 📹 Video Preview Modal with Basic Editor
 * 
 * Features:
 * - Video playback with controls
 * - Trim start/end (basic)
 * - Thumbnail extraction
 * - Download options
 * - Share to social
 * 
 * @author LongSang
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Scissors,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Clock,
  Film,
  Copy,
  Check,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  videoTitle?: string;
  onThumbnailExtracted?: (thumbnailUrl: string) => void;
  onTrimmed?: (startTime: number, endTime: number) => void;
}

export function VideoPreviewModal({
  open,
  onOpenChange,
  videoUrl,
  videoTitle = 'Video Preview',
  onThumbnailExtracted,
  onTrimmed,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [copied, setCopied] = useState(false);
  const [extractedThumbnails, setExtractedThumbnails] = useState<string[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsPlaying(false);
      setCurrentTime(0);
      setTrimStart(0);
      setExtractedThumbnails([]);
    }
  }, [open]);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd(videoRef.current.duration);
    }
  }, []);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Seek to time
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    if (videoRef.current) {
      const vol = value[0];
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  }, []);

  // Extract thumbnail at current time
  const extractThumbnail = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.9);
        setExtractedThumbnails(prev => [...prev, thumbnailUrl]);
        
        if (onThumbnailExtracted) {
          onThumbnailExtracted(thumbnailUrl);
        }
        
        toast.success(`Đã trích xuất thumbnail tại ${formatTime(currentTime)}`);
      }
    }
  }, [currentTime, onThumbnailExtracted]);

  // Download video
  const downloadVideo = useCallback(async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '-')}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đang tải xuống video...');
    } catch {
      toast.error('Lỗi tải xuống video');
    }
  }, [videoUrl, videoTitle]);

  // Download thumbnail
  const downloadThumbnail = useCallback((thumbnailUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = thumbnailUrl;
    a.download = `thumbnail-${index + 1}.jpg`;
    a.click();
    toast.success('Đã tải xuống thumbnail');
  }, []);

  // Copy video URL
  const copyVideoUrl = useCallback(async () => {
    await navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Đã copy URL video');
  }, [videoUrl]);

  // Apply trim
  const applyTrim = useCallback(() => {
    if (onTrimmed) {
      onTrimmed(trimStart, trimEnd);
      toast.success(`Đã đánh dấu trim: ${formatTime(trimStart)} - ${formatTime(trimEnd)}`);
    }
  }, [trimStart, trimEnd, onTrimmed]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-purple-500" />
            {videoTitle}
            <Badge variant="secondary">Preview & Edit</Badge>
          </DialogTitle>
          <DialogDescription>
            Xem trước, trích xuất thumbnail, và cắt video
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="gap-2">
              <Play className="h-4 w-4" />
              Xem video
            </TabsTrigger>
            <TabsTrigger value="thumbnail" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Thumbnail
            </TabsTrigger>
            <TabsTrigger value="trim" className="gap-2">
              <Scissors className="h-4 w-4" />
              Cắt video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 space-y-4 mt-4">
            {/* Video Player */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              
              {/* Play overlay */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-8 w-8 text-black ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-2">
              {/* Progress bar */}
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={([v]) => seekTo(v)}
                className="w-full"
              />
              
              {/* Time display */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyVideoUrl}>
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Đã copy' : 'Copy URL'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadVideo}>
                    <Download className="h-4 w-4 mr-1" />
                    Tải xuống
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => videoRef.current?.requestFullscreen()}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="thumbnail" className="flex-1 space-y-4 mt-4">
            {/* Video for thumbnail extraction */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            {/* Seek and Extract */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={([v]) => seekTo(v)}
                className="w-full"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <Button onClick={extractThumbnail}>
                  <Camera className="h-4 w-4 mr-2" />
                  Trích xuất Thumbnail
                </Button>
              </div>
            </div>

            {/* Extracted thumbnails */}
            {extractedThumbnails.length > 0 && (
              <div className="space-y-2">
                <Label>Thumbnails đã trích xuất ({extractedThumbnails.length})</Label>
                <div className="grid grid-cols-4 gap-2">
                  {extractedThumbnails.map((thumb, i) => (
                    <div key={i} className="relative group rounded overflow-hidden">
                      <img src={thumb} alt={`Thumbnail ${i + 1}`} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => downloadThumbnail(thumb, i)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden canvas for thumbnail extraction */}
            <canvas ref={canvasRef} className="hidden" />
          </TabsContent>

          <TabsContent value="trim" className="flex-1 space-y-4 mt-4">
            {/* Video preview for trim */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            {/* Trim controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu (Start)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={trimStart.toFixed(1)}
                      onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTrimStart(currentTime)}
                    >
                      Set Current
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(trimStart)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Kết thúc (End)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={duration}
                      step={0.1}
                      value={trimEnd.toFixed(1)}
                      onChange={(e) => setTrimEnd(parseFloat(e.target.value) || duration)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTrimEnd(currentTime)}
                    >
                      Set Current
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(trimEnd)}</p>
                </div>
              </div>

              {/* Trim range slider */}
              <div className="space-y-2">
                <Label>Phạm vi cắt</Label>
                <div className="relative h-2 bg-muted rounded">
                  <div 
                    className="absolute h-full bg-primary rounded"
                    style={{
                      left: `${(trimStart / duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / duration) * 100}%`
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Thời lượng sau khi cắt: {formatTime(trimEnd - trimStart)}
                </p>
              </div>

              {/* Apply button */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTrimStart(0);
                    setTrimEnd(duration);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={applyTrim} disabled={!onTrimmed}>
                  <Scissors className="h-4 w-4 mr-2" />
                  Áp dụng Trim
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Trim video sẽ cần server-side processing. Hiện tại chỉ đánh dấu thời gian.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
