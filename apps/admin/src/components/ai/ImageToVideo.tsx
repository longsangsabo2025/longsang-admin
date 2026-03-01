/**
 * Image to Video Generator Component
 * Uses Kie.ai Runway Gen-3 and Veo3 APIs for video generation
 *
 * Split into sub-modules under ./image-to-video/:
 *   types.ts, constants.ts, utils.ts, useImageToVideo.ts,
 *   VideoModelSelector.tsx, VideoSettingsPanel.tsx, VideoResultPanel.tsx
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Video, Loader2, Image as ImageIcon,
  Trash2, Sparkles,
} from 'lucide-react';
import { useImageToVideo } from './image-to-video/useImageToVideo';
import { VideoModelSelector } from './image-to-video/VideoModelSelector';
import { VideoSettingsPanel } from './image-to-video/VideoSettingsPanel';
import { VideoResultPanel } from './image-to-video/VideoResultPanel';
import type { ImageToVideoProps } from './image-to-video/types';

export function ImageToVideo(props: ImageToVideoProps) {
  const {
    prompt, setPrompt,
    selectedFile, previewUrl, libraryImageUrl,
    isGenerating, result, setResult, progress,
    history, clearHistory,
    selectedModel, setSelectedModel, currentModel,
    duration, setDuration, quality, setQuality,
    aspectRatio, setAspectRatio, motionPreset, setMotionPreset,
    veoModel, setVeoModel,
    showSettings, setShowSettings,
    isPlaying, setIsPlaying,
    isEnhancing, isSavingToDrive, isSavingToLibrary,
    showAISettings, setShowAISettings,
    aiModel, setAiModel, temperature, setTemperature,
    maxTokens, setMaxTokens, systemPrompt, setSystemPrompt,
    handleFileChange, enhanceMotionPrompt, generateVideo,
    downloadVideo, handleSaveToDrive, handleSaveToLibrary,
    resetAISettings,
  } = useImageToVideo(props);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold">Image to Video</h2>
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-1" />
            Xóa lịch sử
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Input Section */}
        <div className="space-y-4">
          <VideoModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />

          {/* Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Ảnh gốc
              </CardTitle>
              <CardDescription>
                Upload hoặc chọn từ Thư Viện bên trái
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />

                {previewUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    {libraryImageUrl && (
                      <Badge className="absolute top-2 left-2 bg-blue-500">
                        Từ Thư Viện
                      </Badge>
                    )}
                  </div>
                )}

                {!previewUrl && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Kéo thả ảnh hoặc click để chọn</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <VideoSettingsPanel
            showAISettings={showAISettings}
            onShowAISettingsChange={setShowAISettings}
            aiModel={aiModel}
            onAiModelChange={setAiModel}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            onResetAISettings={resetAISettings}
            prompt={prompt}
            onPromptChange={setPrompt}
            isEnhancing={isEnhancing}
            onEnhancePrompt={enhanceMotionPrompt}
            motionPreset={motionPreset}
            onMotionPresetChange={setMotionPreset}
            showSettings={showSettings}
            onShowSettingsChange={setShowSettings}
            selectedModel={selectedModel}
            duration={duration}
            onDurationChange={setDuration}
            quality={quality}
            onQualityChange={setQuality}
            veoModel={veoModel}
            onVeoModelChange={setVeoModel}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
          />

          {/* Generate Button */}
          <Button
            className="w-full h-12 text-base"
            onClick={generateVideo}
            disabled={isGenerating || (!selectedFile && !libraryImageUrl) || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {progress || 'Đang tạo video...'}
              </>
            ) : (
              <>
                <Video className="h-5 w-5 mr-2" />
                Tạo Video với {currentModel?.name?.split(' ')[1] || 'AI'}
              </>
            )}
          </Button>
        </div>

        {/* Right: Result Section */}
        <div className="space-y-4">
          <VideoResultPanel
            result={result}
            isGenerating={isGenerating}
            progress={progress}
            history={history}
            isPlaying={isPlaying}
            isSavingToDrive={isSavingToDrive}
            isSavingToLibrary={isSavingToLibrary}
            onSetIsPlaying={setIsPlaying}
            onDownload={downloadVideo}
            onSaveToDrive={handleSaveToDrive}
            onSaveToLibrary={handleSaveToLibrary}
            onSelectResult={setResult}
            onRetry={generateVideo}
          />
        </div>
      </div>
    </div>
  );
}
