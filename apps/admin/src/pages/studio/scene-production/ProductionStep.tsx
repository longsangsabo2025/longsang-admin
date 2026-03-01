/**
 * 🎬 ProductionStep Component
 * Step 3: Generate images and videos for each scene
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import './production-step-modern.css';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft,
  Image as ImageIcon,
  Video,
  RefreshCw,
  Download,
  Maximize2,
  ImagePlus,
  Settings2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Sparkles,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import type { Scene } from './types';
import { getSceneStatusBadge } from './helpers';

interface ProductionStepProps {
  scenes: Scene[];
  episodeTitle: string;
  isGenerating: boolean;
  generatingSceneId: string | null;
  generatingType: 'image' | 'video' | null;
  imageGenMode: string;
  enableImageEnhance: boolean;
  enableVideoEnhance: boolean;
  onGenerateImage: (scene: Scene) => void;
  onGenerateVideo: (scene: Scene) => void;
  onEnhanceImagePrompt: (scene: Scene) => void;
  onEnhanceVideoPrompt: (scene: Scene) => void;
  onEditPrompt: (scene: Scene, type: 'image' | 'video') => void;
  onRegenerateImage: (scene: Scene) => void;
  onRegenerateVideo: (scene: Scene) => void;
  onDownloadAsset: (url: string, filename: string) => void;
  onGenerateAllImages: () => void;
  onGenerateAllVideos: () => void;
  onOpenBrainPicker: (sceneId: string) => void;
  onOpenFullscreen: (url: string, title: string) => void;
  onOpenAISettings: () => void;
  onBack: () => void;
  onExport: (format: 'json' | 'csv' | 'pdf') => void;
}

export function ProductionStep({
  scenes,
  episodeTitle,
  isGenerating,
  generatingSceneId,
  generatingType,
  imageGenMode,
  enableImageEnhance,
  enableVideoEnhance,
  onGenerateImage,
  onGenerateVideo,
  onEnhanceImagePrompt,
  onEnhanceVideoPrompt,
  onEditPrompt,
  onRegenerateImage,
  onRegenerateVideo,
  onDownloadAsset,
  onGenerateAllImages,
  onGenerateAllVideos,
  onOpenBrainPicker,
  onOpenFullscreen,
  onOpenAISettings,
  onBack,
  onExport,
}: Readonly<ProductionStepProps>) {
  // Guard against undefined scenes
  const safeScenes = scenes || [];
  
  // Debug: Log scenes when they change
  console.log('[ProductionStep] Scenes updated:', safeScenes.map(s => ({
    id: s.id,
    number: s.number,
    status: s.status,
    hasImage: !!s.generatedImageUrl,
    hasVideo: !!s.generatedVideoUrl,
    videoUrl: s.generatedVideoUrl?.substring(0, 50)
  })));
  
  // State to track which prompts are expanded
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  
  const togglePromptExpand = (sceneId: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };
  
  const completedImages = safeScenes.filter(s => s.generatedImageUrl).length;
  const completedVideos = safeScenes.filter(s => s.generatedVideoUrl).length;
  const imageProgress = safeScenes.length > 0 ? (completedImages / safeScenes.length) * 100 : 0;
  const videoProgress = safeScenes.length > 0 ? (completedVideos / safeScenes.length) * 100 : 0;
  
  const allImagesReady = safeScenes.length > 0 && completedImages === safeScenes.length;
  const allVideosReady = safeScenes.length > 0 && completedVideos === safeScenes.length;

  // Helper to render image section content
  const renderImageContent = (scene: Scene, isCurrentlyGenerating: boolean) => {
    if (isCurrentlyGenerating && generatingType === 'image') {
      return <Skeleton className="aspect-video rounded" />;
    }
    
    if (scene.generatedImageUrl) {
      return (
        <div className="aspect-video rounded overflow-hidden relative group">
          <button
            type="button"
            className="w-full h-full p-0 border-0 bg-transparent cursor-pointer"
            onClick={() => onOpenFullscreen(scene.generatedImageUrl!, `Scene ${scene.number}`)}
          >
            <img 
              src={scene.generatedImageUrl} 
              alt={`Scene ${scene.number}`}
              className="w-full h-full object-cover"
            />
          </button>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none">
            <div className="pointer-events-auto flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white"
                title="Xem toàn màn hình"
                onClick={() => onOpenFullscreen(scene.generatedImageUrl!, `Scene ${scene.number}`)}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white"
                title="Tải về"
                onClick={() => onDownloadAsset(scene.generatedImageUrl!, `scene-${scene.number}.png`)}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white"
                title="Tạo lại"
                onClick={() => onRegenerateImage(scene)}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <button
        type="button"
        title="Tạo ảnh"
        className="aspect-video rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors w-full"
        onClick={() => onGenerateImage(scene)}
        disabled={isGenerating}
      >
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </button>
    );
  };

  // Helper to check if video URL is a Google authenticated URL (won't work in browser)
  const isGoogleAuthUrl = (url: string) => {
    return url.includes('generativelanguage.googleapis.com') || 
           url.includes('storage.googleapis.com') ||
           url.startsWith('https://files.');
  };

  // Helper to render video section content
  const renderVideoContent = (scene: Scene, isCurrentlyGenerating: boolean) => {
    if (isCurrentlyGenerating && generatingType === 'video') {
      return (
        <div className="aspect-video rounded border-2 border-dashed border-primary/50 flex flex-col items-center justify-center bg-primary/5">
          <Skeleton className="h-8 w-8 rounded-full mb-2" />
          <span className="text-xs text-muted-foreground animate-pulse">Đang tạo video...</span>
        </div>
      );
    }
    
    if (scene.generatedVideoUrl) {
      // Check if URL is old Google URL (needs re-generation)
      if (isGoogleAuthUrl(scene.generatedVideoUrl)) {
        return (
          <div className="aspect-video rounded border-2 border-dashed border-orange-500/50 flex flex-col items-center justify-center bg-orange-500/5 gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <span className="text-xs text-orange-500 text-center px-2">Video cũ không thể phát. Vui lòng tạo lại.</span>
            <Button
              variant="outline"
              size="sm"
              className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
              onClick={() => onRegenerateVideo(scene)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tạo lại video
            </Button>
          </div>
        );
      }
      
      console.log('[ProductionStep] Rendering video for scene', scene.number, ':', scene.generatedVideoUrl);
      return (
        <div className="aspect-video rounded overflow-hidden relative group">
          <video 
            src={scene.generatedVideoUrl}
            poster={scene.generatedImageUrl} // Use image as thumbnail/poster
            className="w-full h-full object-cover cursor-pointer"
            muted
            loop
            playsInline
            preload="metadata"
            onClick={() => onOpenFullscreen(scene.generatedVideoUrl!, `Scene ${scene.number} Video`)}
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
            onError={(e) => console.error('[Video Error]', scene.number, e)}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white"
              title="Xem toàn màn hình"
              onClick={() => onOpenFullscreen(scene.generatedVideoUrl!, `Scene ${scene.number} Video`)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white"
              title="Tải về"
              onClick={() => onDownloadAsset(scene.generatedVideoUrl!, `scene-${scene.number}.mp4`)}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white"
              title="Tạo lại"
              onClick={() => onRegenerateVideo(scene)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          {/* Video indicator badge */}
          <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Video className="h-2.5 w-2.5" />
            Ready
          </div>
        </div>
      );
    }
    
    return (
      <button
        type="button"
        title="Tạo video"
        className="aspect-video rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors w-full disabled:opacity-50"
        onClick={() => onGenerateVideo(scene)}
        disabled={isGenerating || !scene.generatedImageUrl}
      >
        <Video className="h-6 w-6 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{episodeTitle}</CardTitle>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại chỉnh scene
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bars */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </span>
                <span className="font-medium">{completedImages}/{safeScenes.length}</span>
              </div>
              <Progress value={imageProgress} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videos
                </span>
                <span className="font-medium">{completedVideos}/{safeScenes.length}</span>
              </div>
              <Progress value={videoProgress} className="h-2" />
            </div>
          </div>
          
          {/* Bulk Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAISettings}
              title="Cài đặt AI Enhance"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              AI Settings
              {(enableImageEnhance || enableVideoEnhance) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {enableImageEnhance && enableVideoEnhance ? '2' : '1'}
                </Badge>
              )}
            </Button>
            <Badge variant="outline" className="flex items-center gap-1.5 px-2">
              🍌 {imageGenMode === 'nano-banana-pro' ? 'Pro (4K, 14 refs)' : 'Standard (3 refs)'}
            </Badge>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAllImages}
              disabled={isGenerating || allImagesReady}
              title="Ctrl+G"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Tạo tất cả ảnh <span className="ml-1 text-xs opacity-60">Ctrl+G</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAllVideos}
              disabled={isGenerating || !allImagesReady || allVideosReady}
              title="Ctrl+V"
            >
              <Video className="h-4 w-4 mr-2" />
              Tạo tất cả video <span className="ml-1 text-xs opacity-60">Ctrl+V</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={safeScenes.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Xuất file
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport('json')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Xuất JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Xuất CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Xuất PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      
      {/* Scene Production Cards */}
      <ScrollArea className="h-[calc(100vh-24rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-4">
          {safeScenes.map((scene) => {
            const isCurrentlyGenerating = generatingSceneId === scene.id;
            
            return (
              <Card 
                key={scene.id}
                className={`overflow-hidden ${isCurrentlyGenerating ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        Scene {scene.number}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {scene.duration}s
                      </span>
                    </div>
                    <Badge variant={getSceneStatusBadge(scene).variant}>
                      {getSceneStatusBadge(scene).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Image Prompt - Expandable */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-500">Image Prompt</span>
                      <div className="ml-auto flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          onClick={() => onEditPrompt(scene, 'image')}
                          title="Chỉnh sửa Image Prompt"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          onClick={() => onEnhanceImagePrompt(scene)}
                          disabled={isGenerating || !scene.visualPrompt}
                          title="AI Enhance Image Prompt"
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 rounded overflow-hidden border border-blue-500/20">
                      <div 
                        className={`text-xs text-muted-foreground p-2 ${
                          expandedPrompts.has(`${scene.id}-image`) ? '' : 'line-clamp-2'
                        }`}
                      >
                        {scene.visualPrompt || <span className="italic">Chưa có prompt</span>}
                      </div>
                      {scene.visualPrompt && scene.visualPrompt.length > 80 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-5 text-xs rounded-none border-t border-blue-500/20 hover:bg-blue-500/10"
                          onClick={() => togglePromptExpand(`${scene.id}-image`)}
                        >
                          {expandedPrompts.has(`${scene.id}-image`) ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Xem đầy đủ
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Video Prompt - Expandable */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Video className="h-3 w-3 text-purple-500" />
                      <span className="text-xs font-medium text-purple-500">Video Prompt</span>
                      {!scene.videoPrompt && (
                        <span className="text-xs text-muted-foreground italic">(auto)</span>
                      )}
                      <div className="ml-auto flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                          onClick={() => onEditPrompt(scene, 'video')}
                          title="Chỉnh sửa Video Prompt"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                          onClick={() => onEnhanceVideoPrompt(scene)}
                          disabled={isGenerating || (!scene.videoPrompt && !scene.visualPrompt)}
                          title="AI Enhance Video Prompt"
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-purple-500/10 rounded overflow-hidden border border-purple-500/20">
                      <div 
                        className={`text-xs text-muted-foreground p-2 ${
                          expandedPrompts.has(`${scene.id}-video`) ? '' : 'line-clamp-2'
                        }`}
                      >
                        {scene.videoPrompt || (
                          <span className="text-purple-400/70">
                            {scene.visualPrompt ? `${scene.visualPrompt.slice(0, 50)}... + ${scene.cameraMovement}` : 'Auto từ Image Prompt'}
                          </span>
                        )}
                      </div>
                      {(scene.videoPrompt?.length ?? 0) > 80 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-5 text-xs rounded-none border-t border-purple-500/20 hover:bg-purple-500/10"
                          onClick={() => togglePromptExpand(`${scene.id}-video`)}
                        >
                          {expandedPrompts.has(`${scene.id}-video`) ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Xem đầy đủ
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Reference Images */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Refs:</span>
                    {(scene.referenceImageIds?.length ?? 0) > 0 ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="h-5 text-xs">
                          {scene.referenceImageIds?.length ?? 0} ảnh
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa có</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs ml-auto"
                      onClick={() => onOpenBrainPicker(scene.id)}
                      title="Thêm ảnh tham chiếu từ Brain Library"
                    >
                      <ImagePlus className="h-3 w-3 mr-1" />
                      Thêm
                    </Button>
                  </div>
                  
                  {/* Generated Assets */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Image Section */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Image
                      </div>
                      {renderImageContent(scene, isCurrentlyGenerating)}
                    </div>
                    
                    {/* Video Section */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Video
                      </div>
                      {renderVideoContent(scene, isCurrentlyGenerating)}
                    </div>
                  </div>
                  
                  {/* Quick Actions - Generate Only */}
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                      onClick={() => onGenerateImage(scene)}
                      disabled={isGenerating}
                    >
                      <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                      {scene.generatedImageUrl ? 'Tạo lại ảnh' : 'Tạo ảnh'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                      onClick={() => onGenerateVideo(scene)}
                      disabled={isGenerating || !scene.generatedImageUrl}
                    >
                      <Video className="h-3.5 w-3.5 mr-1.5" />
                      {scene.generatedVideoUrl ? 'Tạo lại video' : 'Tạo video'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ProductionStep;
