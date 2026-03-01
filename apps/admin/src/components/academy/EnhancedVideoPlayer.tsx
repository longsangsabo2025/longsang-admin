/**
 * Enhanced Video Player for Learning Platform
 * Features: Transcripts, Bookmarks, Notes, Picture-in-Picture, Keyboard shortcuts
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  PictureInPicture,
  Bookmark,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Transcript {
  start: number;
  end: number;
  text: string;
}

interface Bookmark {
  id: string;
  timestamp: number;
  note: string;
  created_at: string;
}

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  transcripts?: Transcript[];
  bookmarks?: Bookmark[];
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  onBookmark?: (timestamp: number, note: string) => void;
  initialProgress?: number;
  autoPlay?: boolean;
}

export function EnhancedVideoPlayer({
  src,
  poster,
  title,
  transcripts = [],
  bookmarks = [],
  onProgress,
  onComplete,
  onBookmark,
  initialProgress = 0,
  autoPlay = false,
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPiP, setIsPiP] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('transcript');
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(-1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(5);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'b':
          e.preventDefault();
          handleQuickBookmark();
          break;
        case ',':
          e.preventDefault();
          setPlaybackRate((prev) => Math.max(0.25, prev - 0.25));
          break;
        case '.':
          e.preventDefault();
          setPlaybackRate((prev) => Math.min(2, prev + 0.25));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialProgress > 0) {
        video.currentTime = (initialProgress / 100) * video.duration;
      }
      if (autoPlay) {
        video.play().catch(() => {});
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const progress = (video.currentTime / video.duration) * 100;
      onProgress?.(progress, video.currentTime);

      // Update current transcript
      if (transcripts.length > 0) {
        const index = transcripts.findIndex(
          (t) => video.currentTime >= t.start && video.currentTime < t.end
        );
        if (index !== currentTranscriptIndex) {
          setCurrentTranscriptIndex(index);
        }
      }

      // Mark as complete at 95%
      if (progress >= 95 && !video.ended) {
        onComplete?.();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [initialProgress, onProgress, onComplete, transcripts, currentTranscriptIndex, autoPlay]);

  // Apply volume changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Apply playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  // Functions
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [isPlaying]);

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      await container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isPiP) {
      await video.requestPictureInPicture?.();
      setIsPiP(true);
    } else {
      await document.exitPictureInPicture?.();
      setIsPiP(false);
    }
  };

  const handleQuickBookmark = () => {
    if (onBookmark) {
      setShowBookmarkInput(true);
    }
  };

  const saveBookmark = () => {
    if (onBookmark && newBookmarkNote.trim()) {
      onBookmark(currentTime, newBookmarkNote.trim());
      setNewBookmarkNote('');
      setShowBookmarkInput(false);
    }
  };

  const jumpToTranscript = (timestamp: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = timestamp;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex bg-black rounded-xl overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none'
      )}
    >
      {/* Main Video Area */}
      <div className={cn('relative flex-1', sidebarOpen && !isFullscreen && 'mr-80')}>
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full aspect-video cursor-pointer"
          onClick={togglePlay}
        />

        {/* Controls Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <h3 className="text-white font-medium truncate">{title}</h3>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-white/20"
              >
                {sidebarOpen ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Center play button */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-primary/80 hover:bg-primary hover:scale-110 transition-transform"
              >
                <Play className="h-10 w-10" fill="white" />
              </Button>
            </div>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {/* Progress bar with preview */}
            <div ref={progressRef} className="relative group">
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
              />

              {/* Bookmark markers */}
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full cursor-pointer hover:scale-125 transition-transform"
                  style={{ left: `${(bookmark.timestamp / duration) * 100}%` }}
                  title={bookmark.note}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToTranscript(bookmark.timestamp);
                  }}
                />
              ))}
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                  title="Lùi 10s (J)"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                  title="Tiến 10s (L)"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 ml-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={(v) => setVolume(v[0] / 100)}
                    max={100}
                    className="w-20"
                  />
                </div>

                <span className="text-white text-sm font-mono ml-3">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Bookmark button */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleQuickBookmark}
                  className="text-white hover:bg-white/20"
                  title="Đánh dấu (B)"
                >
                  <Bookmark className="h-5 w-5" />
                </Button>

                {/* Speed control */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 min-w-[50px]"
                    >
                      {playbackRate}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <DropdownMenuItem
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={playbackRate === rate ? 'bg-accent' : ''}
                      >
                        {rate}x {rate === 1 && '(Bình thường)'}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* PiP */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePiP}
                  className="text-white hover:bg-white/20"
                  title="Picture in Picture"
                >
                  <PictureInPicture className="h-5 w-5" />
                </Button>

                {/* Fullscreen */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                  title="Toàn màn hình (F)"
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookmark input overlay */}
        {showBookmarkInput && (
          <div className="absolute bottom-20 left-4 right-4 bg-background/95 rounded-lg p-4 shadow-lg">
            <div className="flex gap-2">
              <Input
                placeholder="Thêm ghi chú cho bookmark..."
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveBookmark()}
                autoFocus
              />
              <Button onClick={saveBookmark}>Lưu</Button>
              <Button variant="ghost" onClick={() => setShowBookmarkInput(false)}>
                Hủy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tại {formatTime(currentTime)}</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {sidebarOpen && !isFullscreen && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 m-2">
              <TabsTrigger value="transcript" className="gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Transcript</span>
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="gap-1">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Bookmarks</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            {/* Transcript Tab */}
            <TabsContent value="transcript" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {transcripts.length > 0 ? (
                    transcripts.map((t, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-2 rounded cursor-pointer hover:bg-accent transition-colors',
                          currentTranscriptIndex === idx &&
                            'bg-primary/10 border-l-2 border-primary'
                        )}
                        onClick={() => jumpToTranscript(t.start)}
                      >
                        <span className="text-xs text-muted-foreground">{formatTime(t.start)}</span>
                        <p className="text-sm">{t.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Chưa có transcript</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="flex-1 m-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {bookmarks.length > 0 ? (
                    bookmarks.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-lg bg-accent/50 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => jumpToTranscript(b.timestamp)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-primary">
                            {formatTime(b.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{b.note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Chưa có bookmark</p>
                      <p className="text-xs mt-1">Nhấn B để đánh dấu</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="flex-1 m-0">
              <div className="p-2 h-full flex flex-col">
                <textarea
                  className="flex-1 w-full p-3 rounded-lg bg-accent/50 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ghi chú của bạn cho bài học này..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
