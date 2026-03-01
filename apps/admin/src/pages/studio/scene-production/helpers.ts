/**
 * 🛠️ Scene Production Helpers
 * Utility functions for Scene Production
 * 
 * @author LongSang (Elon Mode 🚀)
 */


import type { StatusBadgeInfo, Scene, ReferenceImage, ImageGenRequest, VideoGenRequest } from './types';

// =============================================================================
// CONTENT HELPERS
// =============================================================================

/**
 * Safely render content that might be object or string
 */
export const renderContent = (content: unknown): string => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return '[Object]';
    }
  }
  // For any other type, explicitly handle to avoid Object stringification
  return '[Unknown]';
};

// =============================================================================
// STATUS HELPERS
// =============================================================================

/**
 * Render status icon - avoids nested ternaries
 */
export const getStatusIconProps = (
  isGenerating: boolean,
  isReady: boolean,
  type: 'image' | 'video'
): { icon: 'loader' | 'check' | 'circle'; className: string } => {
  const color = type === 'image' ? 'text-blue-500' : 'text-green-500';
  
  if (isGenerating) {
    return { icon: 'loader', className: `h-4 w-4 animate-spin ${color}` };
  }
  if (isReady) {
    return { icon: 'check', className: 'h-4 w-4 text-green-500' };
  }
  return { icon: 'circle', className: 'h-4 w-4 text-muted-foreground' };
};

/**
 * Get step class - avoids nested ternaries
 */
export const getStepClass = (step: string, currentStep: string, idx: number): string => {
  const steps = ['input', 'scenes', 'production'];
  const currentIdx = steps.indexOf(currentStep);
  
  if (currentStep === step) {
    return 'bg-primary text-primary-foreground';
  }
  if (currentIdx > idx) {
    return 'bg-green-500 text-white';
  }
  return 'bg-muted text-muted-foreground';
};

/**
 * Get production status badge - avoids nested ternaries
 */
export const getProductionStatusBadge = (status: string): StatusBadgeInfo => {
  if (status === 'completed') {
    return { variant: 'default', label: 'Hoàn thành' };
  }
  if (status === 'in_progress') {
    return { variant: 'secondary', label: 'Đang làm' };
  }
  return { variant: 'outline', label: status };
};

/**
 * Get scene status badge based on scene generation state
 */
export const getSceneStatusBadge = (scene: Scene): StatusBadgeInfo => {
  if (scene.generatedVideoUrl) {
    return { variant: 'default', label: '✓ Video sẵn sàng' };
  }
  if (scene.generatedImageUrl) {
    return { variant: 'secondary', label: 'Ảnh sẵn sàng' };
  }
  if (scene.status === 'error') {
    return { variant: 'outline', label: '⚠ Lỗi' };
  }
  return { variant: 'outline', label: 'Chưa tạo' };
};

/**
 * Get button text - avoids nested ternaries
 */
export const getEnhanceButtonText = (isEnhancing: boolean, isEnabled: boolean): string => {
  if (isEnhancing) return 'Đang nâng cấp...';
  if (isEnabled) return '✓ Đã bật';
  return 'Bật';
};

// =============================================================================
// SCENE HELPERS
// =============================================================================

/**
 * Build motion prompt for video generation
 * Prioritizes videoPrompt if set, otherwise builds from visualPrompt + camera
 */
export const buildMotionPrompt = (scene: Scene): string => {
  // If scene has custom video prompt, use it
  if (scene.videoPrompt) {
    return scene.videoPrompt;
  }
  
  // Otherwise, build from visual prompt + motion info
  const basePart = scene.visualPrompt || scene.description;
  const dialoguePart = scene.dialogue ? ` Speaking: "${scene.dialogue}"` : '';
  const cameraPart = scene.cameraMovement ? ` Camera: ${scene.cameraMovement}.` : '';
  const moodPart = scene.mood ? ` Mood: ${scene.mood}.` : '';
  const durationPart = scene.duration ? ` Duration: ${scene.duration}s.` : '';
  
  return `${basePart}.${dialoguePart}${cameraPart}${moodPart}${durationPart}`.trim();
};

/**
 * Build full image prompt with mood and camera
 */
export const buildFullImagePrompt = (scene: Scene): string => {
  let fullPrompt = scene.visualPrompt;
  if (scene.mood) {
    fullPrompt += `\n\nMood/Style: ${scene.mood}`;
  }
  if (scene.cameraMovement) {
    fullPrompt += `\nCamera angle: ${scene.cameraMovement}`;
  }
  return fullPrompt;
};

/**
 * Build image generation request
 */
export const buildImageGenRequest = (
  scene: Scene, 
  brainImages: ReferenceImage[], 
  aspectRatio: string
): ImageGenRequest => {
  const refImages = brainImages.filter(img => 
    scene.referenceImageIds.includes(img.id)
  );
  
  return {
    prompt: buildFullImagePrompt(scene),
    reference_images: refImages.map(r => r.url),
    aspect_ratio: aspectRatio,
    scene,
  };
};

/**
 * Build video generation request
 */
export const buildVideoGenRequest = (
  scene: Scene, 
  aspectRatio: string
): VideoGenRequest => {
  return {
    prompt: buildMotionPrompt(scene),
    image_url: scene.generatedImageUrl || '',
    duration: Math.min(scene.duration, 8),
    aspect_ratio: aspectRatio,
    scene,
  };
};

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate scene has required fields
 */
export const isSceneValid = (scene: Scene): boolean => {
  return !!(
    scene.description?.trim() &&
    scene.visualPrompt?.trim() &&
    scene.duration > 0
  );
};

/**
 * Check if scene is ready for video generation
 */
export const canGenerateVideo = (scene: Scene): boolean => {
  return !!(
    scene.generatedImageUrl &&
    scene.status !== 'video_generating' &&
    scene.status !== 'image_generating'
  );
};

// =============================================================================
// PROGRESS HELPERS
// =============================================================================

/**
 * Calculate production progress
 */
export const calculateProgress = (scenes: Scene[]) => {
  return {
    total: scenes.length,
    imagesReady: scenes.filter(s => s.generatedImageUrl).length,
    videosReady: scenes.filter(s => s.generatedVideoUrl).length,
    totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
  };
};

// =============================================================================
// SCENE OPERATIONS
// =============================================================================

/**
 * Update a single scene in array
 */
export const updateSceneInArray = (
  scenes: Scene[], 
  sceneId: string, 
  updates: Partial<Scene>
): Scene[] => {
  return scenes.map(s => 
    s.id === sceneId ? { ...s, ...updates } : s
  );
};

/**
 * Toggle reference image for scene
 */
export const toggleReferenceImage = (
  scenes: Scene[], 
  sceneId: string, 
  imageId: string
): Scene[] => {
  return scenes.map(s => {
    if (s.id !== sceneId) return s;
    
    const refs = s.referenceImageIds.includes(imageId)
      ? s.referenceImageIds.filter(id => id !== imageId)
      : [...s.referenceImageIds, imageId];
    
    return { ...s, referenceImageIds: refs };
  });
};

/**
 * Delete scene and renumber
 */
export const deleteSceneAndRenumber = (scenes: Scene[], sceneId: string): Scene[] => {
  const filtered = scenes.filter(s => s.id !== sceneId);
  return filtered.map((s, idx) => ({ ...s, number: idx + 1 }));
};

/**
 * Add new scene after specific number
 */
export const addSceneAfter = (scenes: Scene[], afterNumber: number): Scene[] => {
  const newScene: Scene = {
    id: `scene-${Date.now()}`,
    number: afterNumber + 1,
    duration: 6,
    description: 'Scene mới',
    visualPrompt: '',
    cameraMovement: 'Static - Cố định',
    mood: 'Energetic - Năng động',
    referenceImageIds: [],
    status: 'pending',
  };
  
  const newScenes = [...scenes];
  newScenes.splice(afterNumber, 0, newScene);
  return newScenes.map((s, idx) => ({ ...s, number: idx + 1 }));
};

/**
 * Get the new scene ID after adding
 */
export const getNewSceneId = (afterNumber: number): string => {
  return `scene-${Date.now()}`;
};
