/**
 * 🎬 Scene Production - Main Component
 * Modular architecture with clean separation of concerns
 * 
 * @author LongSang (Elon Mode 🚀)
 * @description Scene-by-scene video production pipeline
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings2, Save, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'sonner';

// Types
import type { Scene, Settings, VideoProvider } from './types';
import { DEFAULT_SETTINGS, DEFAULT_SCENE_PROMPT } from './types';

// Hooks
import { useProductionData } from './useProductionData';
import { useSceneGeneration } from './useSceneGeneration';
import { useBrainImages } from './useBrainImages';

// Components
import { InputStep } from './InputStep';
import { ScenesStep } from './ScenesStep';
import { ProductionStep } from './ProductionStep';
import { 
  BrainPickerDialog, 
  AISettingsDialog,
  PromptDialog,
  FullscreenDialog,
  AIEnhanceSettingsDialog,
  EditPromptDialog,
} from './dialogs';
// 🚀 ELON MODE: Phase 3 UI Components
import { CacheStatsIndicator } from '@/components/CacheStatsIndicator';
import { CostBadge } from '@/components/CostTracker';
// 🚀 ELON MODE: Phase 4 - Export Service
import { exportAsJSON, exportAsCSV, exportAsPDF, type ExportData } from '@/services/exportService';
// 🚀 ELON MODE: Phase 4 - Undo/Redo
import { useHistoryManager } from '@/hooks/useHistoryManager';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStepLabel(step: number): string {
  switch (step) {
    case 1: return 'Input';
    case 2: return 'Scenes';
    case 3: return 'Production';
    default: return '';
  }
}

function getStepBadgeClass(step: number, currentStep: number): string {
  if (step === currentStep) {
    return 'bg-primary text-primary-foreground';
  }
  if (step < currentStep) {
    return 'bg-green-500 text-white';
  }
  return 'bg-muted text-muted-foreground';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SceneProductionContent() {
  // ====================================
  // Production Settings State
  // ====================================
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [scenePrompt, setScenePrompt] = useState(DEFAULT_SCENE_PROMPT);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('9:16');
  const [imageGenMode, setImageGenMode] = useState('nano-banana-pro');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [globalEnableImageEnhance, setGlobalEnableImageEnhance] = useState(true);
  const [globalEnableVideoEnhance, setGlobalEnableVideoEnhance] = useState(true);
  const [globalImageSystemPrompt, setGlobalImageSystemPrompt] = useState('');
  const [globalVideoSystemPrompt, setGlobalVideoSystemPrompt] = useState('');
  // 🚀 ELON MODE: Force Kie.ai only - Google disabled for reliability
  const videoProvider: VideoProvider = 'kie'; // Hardcoded, no switching
  
  // ====================================
  // UI State
  // ====================================
  const [expandedScene, setExpandedScene] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showBrainPicker, setShowBrainPicker] = useState(false);
  const [brainPickerSceneId, setBrainPickerSceneId] = useState<string | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showAIEnhanceSettings, setShowAIEnhanceSettings] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState('');
  
  // Prompt Edit Dialog State
  const [editingPromptScene, setEditingPromptScene] = useState<Scene | null>(null);
  const [editingPromptType, setEditingPromptType] = useState<'image' | 'video'>('image');
  const [showEditPromptDialog, setShowEditPromptDialog] = useState(false);
  
  // ====================================
  // Hooks
  // ====================================
  const productionSettings = useMemo(() => ({
    aspectRatio,
    aiModel,
    scenePrompt,
  }), [aspectRatio, aiModel, scenePrompt]);
  
  const { 
    scenes,
    setScenes,
    episode,
    setEpisode,
    productionId,
    currentStep,
    setCurrentStep,
    isSaving,
    isLoading,
    saveToSupabase,
    updateScene,
  } = useProductionData(productionSettings);
  
  const { brainImages } = useBrainImages();
  
  // 🚀 ELON MODE: History Manager (Undo/Redo)
  const historyManager = useHistoryManager(scenes);
  
  const generationProps = useMemo(() => ({
    scenes,
    brainImages,
    aspectRatio,
    imageGenMode,
    imageResolution,
    productionId,
    currentStep,
    globalEnableImageEnhance,
    globalEnableVideoEnhance,
    globalImageSystemPrompt,
    globalVideoSystemPrompt,
    episodeTitle: episode?.title,
    videoProvider,
    updateScene,
    setScenes,
  }), [
    scenes, brainImages, aspectRatio, imageGenMode, imageResolution,
    productionId, currentStep, globalEnableImageEnhance, globalEnableVideoEnhance,
    globalImageSystemPrompt, globalVideoSystemPrompt, episode?.title, videoProvider, updateScene, setScenes
  ]);
  
  const {
    isProducing,
    generatingSceneId,
    generatingType,
    generateSceneImage,
    generateSceneVideo,
    enhancePromptWithAI,
  } = useSceneGeneration(generationProps);
  
  // ====================================
  // UI Step Mapping
  // ====================================
  const currentStepNumber = useMemo(() => {
    switch (currentStep) {
      case 'input': return 1;
      case 'scenes': return 2;
      case 'production': return 3;
      case 'review': return 3;
      default: return 1;
    }
  }, [currentStep]);
  
  // ====================================
  // Scene Management
  // ====================================
  const deleteScene = useCallback((sceneId: string) => {
    setScenes(prev => {
      const filtered = prev.filter(s => s.id !== sceneId);
      const updated = filtered.map((s, idx) => ({ ...s, number: idx + 1 }));
      historyManager.saveState(updated, 'Xóa scene');
      return updated;
    });
  }, [setScenes, historyManager]);
  
  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setScenes(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      // Renumber scenes
      const updated = result.map((s, idx) => ({ ...s, number: idx + 1 }));
      historyManager.saveState(updated, 'Sắp xếp lại scene');
      return updated;
    });
  }, [setScenes, historyManager]);
  
  const addSceneAfter = useCallback((afterNumber: number) => {
    setScenes(prev => {
      const newScene: Scene = {
        id: `scene-${Date.now()}`,
        number: afterNumber + 1,
        description: 'New scene',
        visualPrompt: '',
        cameraMovement: 'Static - Cố định',
        mood: 'Vui vẻ - Upbeat',
        duration: 5,
        dialogue: '',
        referenceImageIds: [],
        status: 'pending',
      };
      
      const result: Scene[] = [];
      for (const s of prev) {
        result.push(s);
        if (s.number === afterNumber) {
          result.push(newScene);
        }
      }
      
      return result.map((s, idx) => ({ ...s, number: idx + 1 }));
    });
  }, [setScenes]);
  
  // Helper to update reference images for a scene
  const updateSceneReferences = (scene: Scene, imageId: string): Scene => {
    if (scene.referenceImageIds.includes(imageId)) {
      return { 
        ...scene, 
        referenceImageIds: scene.referenceImageIds.filter(id => id !== imageId) 
      };
    }
    return { 
      ...scene, 
      referenceImageIds: [...scene.referenceImageIds, imageId] 
    };
  };

  const toggleReference = useCallback((sceneId: string, imageId: string) => {
    setScenes(prev => prev.map(s => 
      s.id === sceneId ? updateSceneReferences(s, imageId) : s
    ));
  }, [setScenes]);
  
  // ====================================
  // Production Actions
  // ====================================
  const handleScenesGenerated = useCallback((newScenes: Scene[]) => {
    setScenes(newScenes);
    setCurrentStep('scenes');
  }, [setScenes, setCurrentStep]);
  
  // 📷 Enhance Image Prompt with AI
  const handleEnhanceImagePrompt = useCallback(async (scene: Scene) => {
    console.log('[Enhance Image] Starting with system prompt:', globalImageSystemPrompt?.slice(0, 100) || '(empty)');
    const enhanced = await enhancePromptWithAI(scene.visualPrompt, 'image');
    if (enhanced) {
      updateScene(scene.id, { visualPrompt: enhanced });
      toast.success('✨ Đã nâng cấp Image Prompt');
    }
  }, [enhancePromptWithAI, updateScene, globalImageSystemPrompt]);
  
  // 🎬 Enhance Video Prompt with AI
  const handleEnhanceVideoPrompt = useCallback(async (scene: Scene) => {
    // Import helper để dùng cùng logic với video generation
    const { buildMotionPrompt } = await import('./helpers');
    const basePrompt = buildMotionPrompt(scene);
    const enhanced = await enhancePromptWithAI(basePrompt, 'video');
    if (enhanced) {
      updateScene(scene.id, { videoPrompt: enhanced });
      toast.success('✨ Đã nâng cấp Video Prompt');
    }
  }, [enhancePromptWithAI, updateScene]);
  
  // ✏️ Open Edit Prompt Dialog
  const handleEditPrompt = useCallback((scene: Scene, type: 'image' | 'video') => {
    setEditingPromptScene(scene);
    setEditingPromptType(type);
    setShowEditPromptDialog(true);
  }, []);
  
  // 💾 Save Edited Prompt
  const handleSaveEditedPrompt = useCallback((newPrompt: string) => {
    if (!editingPromptScene) return;
    
    if (editingPromptType === 'image') {
      updateScene(editingPromptScene.id, { visualPrompt: newPrompt });
    } else {
      updateScene(editingPromptScene.id, { videoPrompt: newPrompt });
    }
    
    setShowEditPromptDialog(false);
    setEditingPromptScene(null);
    toast.success(`Đã cập nhật ${editingPromptType === 'image' ? 'Image' : 'Video'} Prompt`);
  }, [editingPromptScene, editingPromptType, updateScene]);
  
  const handleGenerateAllImages = useCallback(async () => {
    const pending = scenes.filter(s => !s.generatedImageUrl);
    for (const scene of pending) {
      await generateSceneImage(scene);
    }
  }, [scenes, generateSceneImage]);
  
  const handleGenerateAllVideos = useCallback(async () => {
    const pending = scenes.filter(s => s.generatedImageUrl && !s.generatedVideoUrl);
    for (const scene of pending) {
      await generateSceneVideo(scene);
    }
  }, [scenes, generateSceneVideo]);
  
  const handleDownloadAsset = useCallback(async (url: string, filename: string) => {
    try {
      toast.info('Đang tải xuống...', { duration: 2000 });
      
      // Fetch the file as blob (works in both browser and Electron)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup blob URL after download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      toast.success(`✅ Đã tải: ${filename}`);
    } catch (error) {
      console.error('[Download] Error:', error);
      toast.error('❌ Không thể tải file. Thử mở link trong tab mới.');
      
      // Fallback: Open in new tab
      window.open(url, '_blank');
    }
  }, []);
  
  const handleExport = useCallback((format: 'json' | 'csv' | 'pdf') => {
    const exportData: ExportData = {
      episodeTitle: episode?.title || 'Untitled Episode',
      seriesTitle: episode?.seriesTitle,
      scenes,
      totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      exportDate: new Date().toISOString(),
    };
    
    try {
      if (format === 'json') {
        exportAsJSON(exportData);
        toast.success('✅ Đã xuất JSON');
      } else if (format === 'csv') {
        exportAsCSV(exportData);
        toast.success('✅ Đã xuất CSV');
      } else if (format === 'pdf') {
        exportAsPDF(exportData);
        toast.success('✅ Đang mở PDF...');
      }
    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error('❌ Lỗi khi xuất file');
    }
  }, [scenes, episode]);
  
  const handleOpenBrainPicker = useCallback((sceneId: string) => {
    setBrainPickerSceneId(sceneId);
    setShowBrainPicker(true);
  }, []);
  
  const handleConfirmBrainPicker = useCallback((ids: string[]) => {
    if (brainPickerSceneId) {
      updateScene(brainPickerSceneId, { referenceImageIds: ids });
    }
    setBrainPickerSceneId(null);
  }, [brainPickerSceneId, updateScene]);
  
  // ====================================
  // 🚀 ELON MODE: Keyboard Shortcuts
  // ====================================
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl+S: Save production
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!isSaving && currentStep !== 'input') {
          saveToSupabase();
          toast.info('💾 Đang lưu...');
        }
        return;
      }
      
      // Ctrl+Z: Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyManager.canUndo) {
          const prevScenes = historyManager.undo();
          if (prevScenes) {
            setScenes(prevScenes);
            toast.info(`⏪ Hoàn tác: ${historyManager.currentAction}`);
          }
        }
        return;
      }
      
      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (historyManager.canRedo) {
          const nextScenes = historyManager.redo();
          if (nextScenes) {
            setScenes(nextScenes);
            toast.info(`⏩ Làm lại: ${historyManager.nextAction}`);
          }
        }
        return;
      }
      
      // Ctrl+G: Generate all images (if in production step)
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        if (currentStep === 'production' && !isProducing) {
          const pending = scenes.filter(s => !s.generatedImageUrl);
          if (pending.length > 0) {
            handleGenerateAllImages();
            toast.info(`🎨 Tạo ${pending.length} hình ảnh...`);
          }
        }
        return;
      }
      
      // Ctrl+V: Generate all videos (if in production step)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (currentStep === 'production' && !isProducing) {
          const pending = scenes.filter(s => s.generatedImageUrl && !s.generatedVideoUrl);
          if (pending.length > 0) {
            handleGenerateAllVideos();
            toast.info(`🎬 Tạo ${pending.length} video...`);
          }
        }
        return;
      }
      
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        if (showBrainPicker) setShowBrainPicker(false);
        if (showPromptDialog) setShowPromptDialog(false);
        if (showAIEnhanceSettings) setShowAIEnhanceSettings(false);
        if (showEditPromptDialog) setShowEditPromptDialog(false);
        if (fullscreenUrl) setFullscreenUrl(null);
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [
    currentStep, isSaving, isProducing, scenes,
    showSettings, showBrainPicker, showPromptDialog, showAIEnhanceSettings, showEditPromptDialog, fullscreenUrl,
    saveToSupabase, handleGenerateAllImages, handleGenerateAllVideos,
    historyManager, setScenes
  ]);
  
  // ====================================
  // Render
  // ====================================
  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (currentStepNumber === 1) {
      return (
        <InputStep
          episode={episode}
          aiModel={aiModel}
          scenePrompt={scenePrompt}
          onAiModelChange={setAiModel}
          onScenePromptChange={setScenePrompt}
          onScenesGenerated={handleScenesGenerated}
          onShowPromptDialog={() => setShowPromptDialog(true)}
          onEpisodeChange={setEpisode}
        />
      );
    }
    
    if (currentStepNumber === 2) {
      return (
        <ScenesStep
          scenes={scenes}
          brainImages={brainImages}
          expandedScene={expandedScene}
          onExpandScene={setExpandedScene}
          onUpdateScene={updateScene}
          onDeleteScene={deleteScene}
          onAddScene={addSceneAfter}
          onAddReference={toggleReference}
          onOpenBrainPicker={handleOpenBrainPicker}
          onReorderScenes={reorderScenes}
          onBack={() => setCurrentStep('input')}
          onNext={() => setCurrentStep('production')}
        />
      );
    }
    
    return (
      <ProductionStep
        scenes={scenes}
        episodeTitle={episode?.title || 'Untitled'}
        isGenerating={isProducing}
        generatingSceneId={generatingSceneId}
        generatingType={generatingType}
        imageGenMode={imageGenMode}
        enableImageEnhance={globalEnableImageEnhance}
        enableVideoEnhance={globalEnableVideoEnhance}
        onGenerateImage={generateSceneImage}
        onGenerateVideo={generateSceneVideo}
        onEnhanceImagePrompt={handleEnhanceImagePrompt}
        onEnhanceVideoPrompt={handleEnhanceVideoPrompt}
        onEditPrompt={handleEditPrompt}
        onRegenerateImage={generateSceneImage}
        onRegenerateVideo={generateSceneVideo}
        onDownloadAsset={handleDownloadAsset}
        onGenerateAllImages={handleGenerateAllImages}
        onGenerateAllVideos={handleGenerateAllVideos}
        onOpenBrainPicker={handleOpenBrainPicker}
        onOpenFullscreen={(url, title) => {
          setFullscreenUrl(url);
          setFullscreenTitle(title);
        }}
        onOpenAISettings={() => setShowAIEnhanceSettings(true)}
        onBack={() => setCurrentStep('scenes')}
        onExport={handleExport}
      />
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">🎬 Scene Production</h1>
          
          {/* Episode Info Badge */}
          {episode && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              📺 {episode.seriesTitle ? `${episode.seriesTitle} - ` : ''}{episode.title || 'Untitled Episode'}
            </Badge>
          )}
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <Badge 
                key={step}
                variant="outline"
                className={`cursor-pointer hover:opacity-80 ${getStepBadgeClass(step, currentStepNumber)}`}
                onClick={() => {
                  // Allow navigation between completed steps
                  if (step === 1) setCurrentStep('input');
                  else if (step === 2 && scenes.length > 0) setCurrentStep('scenes');
                  else if (step === 3 && scenes.length > 0) setCurrentStep('production');
                }}
              >
                {getStepLabel(step)}
              </Badge>
            ))}
          </div>
        </div>

        {/* 🚀 ELON MODE: Phase 3 - Real-time Metrics */}
        <div className="flex items-center gap-3">
          {/* Cache Stats Indicator */}
          <CacheStatsIndicator showDetails={false} />
          
          {/* Cost Tracker (Mini) */}
          {productionId && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Production Cost</div>
              <CostBadge amount={0.5} label="" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Aspect Ratio */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <span className="text-xs px-2 text-muted-foreground">📐</span>
            {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
              <Button
                key={ratio}
                variant={aspectRatio === ratio ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAspectRatio(ratio)}
              >
                {ratio}
              </Button>
            ))}
          </div>

          {/* Resolution */}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <span className="text-xs px-2 text-muted-foreground">🎨</span>
            {(['1K', '2K', '4K'] as const).map((res) => (
              <Button
                key={res}
                variant={imageResolution === res ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setImageResolution(res)}
              >
                {res}
              </Button>
            ))}
          </div>

          {/* Video Provider - Always Kie.ai */}
          <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 rounded-md border border-purple-500/20">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">🟣 Kie.ai Video</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prevScenes = historyManager.undo();
              if (prevScenes) {
                setScenes(prevScenes);
                toast.info(`⏪ Hoàn tác: ${historyManager.currentAction}`);
              }
            }}
            disabled={!historyManager.canUndo}
            title={`Hoàn tác${historyManager.previousAction ? `: ${historyManager.previousAction}` : ''} (Ctrl+Z)`}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextScenes = historyManager.redo();
              if (nextScenes) {
                setScenes(nextScenes);
                toast.info(`⏩ Làm lại: ${historyManager.nextAction}`);
              }
            }}
            disabled={!historyManager.canRedo}
            title={`Làm lại${historyManager.nextAction ? `: ${historyManager.nextAction}` : ''} (Ctrl+Y)`}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            size="sm"
            onClick={saveToSupabase}
            disabled={scenes.length === 0 || isSaving}
            title="Ctrl+S"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu <span className="ml-1 text-xs opacity-60">Ctrl+S</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        {renderStep()}
      </div>
      
      {/* Dialogs */}
      <AISettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={settings}
        onSave={setSettings}
      />
      
      <BrainPickerDialog
        open={showBrainPicker}
        onOpenChange={setShowBrainPicker}
        brainImages={brainImages}
        selectedIds={
          brainPickerSceneId 
            ? scenes.find(s => s.id === brainPickerSceneId)?.referenceImageIds || []
            : []
        }
        onConfirm={handleConfirmBrainPicker}
      />
      
      <PromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        scenePrompt={scenePrompt}
        onScenePromptChange={setScenePrompt}
      />
      
      <FullscreenDialog
        open={!!fullscreenUrl}
        onOpenChange={(open) => {
          if (!open) {
            setFullscreenUrl(null);
            setFullscreenTitle('');
          }
        }}
        url={fullscreenUrl}
        title={fullscreenTitle}
      />
      
      <AIEnhanceSettingsDialog
        open={showAIEnhanceSettings}
        onOpenChange={setShowAIEnhanceSettings}
        enableImageEnhance={globalEnableImageEnhance}
        enableVideoEnhance={globalEnableVideoEnhance}
        imageSystemPrompt={globalImageSystemPrompt}
        videoSystemPrompt={globalVideoSystemPrompt}
        imageGenMode={imageGenMode}
        videoProvider={videoProvider}
        onSave={(newSettings) => {
          setGlobalEnableImageEnhance(newSettings.enableImageEnhance);
          setGlobalEnableVideoEnhance(newSettings.enableVideoEnhance);
          setGlobalImageSystemPrompt(newSettings.imageSystemPrompt);
          setGlobalVideoSystemPrompt(newSettings.videoSystemPrompt);
          setImageGenMode(newSettings.imageGenMode);
          setVideoProvider(newSettings.videoProvider);
          toast.success('Đã lưu cài đặt AI');
        }}
      />
      
      <EditPromptDialog
        open={showEditPromptDialog}
        onOpenChange={setShowEditPromptDialog}
        scene={editingPromptScene}
        promptType={editingPromptType}
        onSave={handleSaveEditedPrompt}
        onEnhance={enhancePromptWithAI}
        isEnhancing={isProducing}
      />
    </div>
  );
}

export default SceneProductionContent;
