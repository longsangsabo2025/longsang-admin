/**
 * 🪝 useSceneGeneration Hook
 * Handles AI image/video generation for scenes
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { Scene, ReferenceImage } from './types';
import { SCENE_PRODUCTION_KEY } from './types';
import { buildFullImagePrompt, buildMotionPrompt } from './helpers';

interface UseSceneGenerationProps {
  scenes: Scene[];
  brainImages: ReferenceImage[];
  aspectRatio: string;
  imageGenMode: string;
  imageResolution: string;
  productionId: string | null;
  currentStep: string;
  globalEnableImageEnhance: boolean;
  globalEnableVideoEnhance: boolean;
  globalImageSystemPrompt: string;
  globalVideoSystemPrompt: string;
  episodeTitle?: string;
  videoProvider?: 'google' | 'kie'; // Provider: Google Direct or Kie.ai
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
}

interface UseSceneGenerationReturn {
  isProducing: boolean;
  generatingSceneId: string | null;
  generatingType: 'image' | 'video' | null;
  generateSceneImage: (scene: Scene) => Promise<void>;
  generateSceneVideo: (scene: Scene) => Promise<void>;
  produceAllScenes: () => Promise<void>;
  enhancePromptWithAI: (prompt: string, context: 'image' | 'video', customPrompt?: string) => Promise<string>;
}

export function useSceneGeneration({
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
  episodeTitle,
  videoProvider = 'google',
  updateScene,
  setScenes,
}: UseSceneGenerationProps): UseSceneGenerationReturn {
  const [isProducing, setIsProducing] = useState(false);
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<'image' | 'video' | null>(null);

  // Debug: Log when system prompts change
  useEffect(() => {
    console.log('[useSceneGeneration] System prompts updated:');
    console.log('  - Image prompt length:', globalImageSystemPrompt?.length || 0);
    console.log('  - Video prompt length:', globalVideoSystemPrompt?.length || 0);
  }, [globalImageSystemPrompt, globalVideoSystemPrompt]);

  // AI Prompt Enhancement
  const enhancePromptWithAI = useCallback(async (
    prompt: string, 
    context: 'image' | 'video',
    customPrompt?: string
  ): Promise<string> => {
    try {
      const systemPrompt = customPrompt || 
        (context === 'image' ? globalImageSystemPrompt : globalVideoSystemPrompt);
      
      console.log('[AI Enhance] Context:', context);
      console.log('[AI Enhance] System prompt length:', systemPrompt?.length || 0);
      console.log('[AI Enhance] System prompt preview:', systemPrompt?.slice(0, 100) || '(empty)');
      
      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: context === 'image' ? 'image_generation' : 'video_generation',
          style: 'cinematic',
          subject: episodeTitle || 'SABO Billiards',
          systemPrompt,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.enhanced_prompt || prompt;
      }
      return prompt;
    } catch (e) {
      console.error('[AI Enhance] Failed:', e);
      return prompt;
    }
  }, [globalImageSystemPrompt, globalVideoSystemPrompt, episodeTitle]);

  // 🚀 ELON MODE: Generate image with auto-retry (3 attempts)
  const generateSceneImage = useCallback(async (scene: Scene, attempt = 1, maxRetries = 3) => {
    console.log(`[Image Gen] Attempt ${attempt}/${maxRetries} for scene:`, scene.id, scene.number);
    updateScene(scene.id, { status: 'image_generating', error: undefined });
    setGeneratingSceneId(scene.id);
    setGeneratingType('image');
    
    try {
      // Get reference images URLs
      const refImages = brainImages.filter(img => 
        scene.referenceImageIds.includes(img.id)
      );
      console.log('[Image Gen] Reference images:', refImages.length, refImages.map(r => r.url));
      
      let fullPrompt = buildFullImagePrompt(scene);
      console.log('[Image Gen] Full prompt:', fullPrompt.slice(0, 200) + '...');
      
      // Auto-enhance if enabled globally
      if (globalEnableImageEnhance) {
        toast.info('🤖 AI đang nâng cấp prompt...', { duration: 2000 });
        fullPrompt = await enhancePromptWithAI(fullPrompt, 'image');
        console.log('[Image Gen] Enhanced prompt:', fullPrompt.slice(0, 200) + '...');
      }
      
      const requestBody = {
        prompt: fullPrompt,
        mode: imageGenMode,
        aspect_ratio: aspectRatio,
        resolution: imageResolution,
        style: 'cinematic',
        reference_images: refImages.map(r => r.url),
      };
      console.log('[Image Gen] Request body:', JSON.stringify(requestBody, null, 2));
      
      // Call Kie.ai Image generation API (Nano Banana)
      const response = await fetch('/api/kie/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      console.log('[Image Gen] Response:', data);
      
      if (data.success && (data.output || data.image_url)) {
        const imageUrl = data.output || data.image_url;
        console.log('[Image Gen] ✅ Generated image URL:', imageUrl);
        updateScene(scene.id, { 
          generatedImageUrl: imageUrl,
          status: 'image_ready' 
        });
        
        // Immediate save to localStorage
        setScenes(currentScenes => {
          const updatedScenes = currentScenes.map(s => 
            s.id === scene.id ? { ...s, generatedImageUrl: imageUrl, status: 'image_ready' as const } : s
          );
          localStorage.setItem(SCENE_PRODUCTION_KEY, JSON.stringify({
            productionId,
            scenes: updatedScenes,
            step: currentStep,
            updatedAt: new Date().toISOString(),
          }));
          return updatedScenes;
        });
        
        toast.success(`Scene ${scene.number}: Đã tạo hình ảnh`);
      } else {
        throw new Error(data.error || 'Image generation failed');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error(`[Image Gen] Attempt ${attempt} failed:`, e);
      
      // 🚀 ELON MODE: Auto-retry with exponential backoff
      if (attempt < maxRetries) {
        const backoffMs = 2000 * attempt; // 2s, 4s, 6s
        toast.info(`⚠️ Retry ${attempt}/${maxRetries} sau ${backoffMs/1000}s...`, { duration: backoffMs });
        
        setGeneratingSceneId(null);
        setGeneratingType(null);
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return generateSceneImage(scene, attempt + 1, maxRetries);
      }
      
      // All retries failed
      updateScene(scene.id, { status: 'error', error: errorMessage });
      toast.error(`Scene ${scene.number}: Lỗi tạo hình ảnh sau ${maxRetries} lần thử`);
    } finally {
      if (attempt >= maxRetries) {
        setGeneratingSceneId(null);
        setGeneratingType(null);
      }
    }
  }, [
    brainImages, 
    aspectRatio, 
    imageGenMode, 
    imageResolution, 
    productionId, 
    currentStep,
    globalEnableImageEnhance,
    enhancePromptWithAI,
    updateScene,
    setScenes,
  ]);

  // Generate video for single scene using VEO 3.1 Gemini API
  const generateSceneVideo = useCallback(async (scene: Scene) => {
    if (!scene.generatedImageUrl) {
      toast.error('Cần tạo hình ảnh trước');
      return;
    }
    
    updateScene(scene.id, { status: 'video_generating', error: undefined });
    setGeneratingSceneId(scene.id);
    setGeneratingType('video');
    
    try {
      let motionPrompt = buildMotionPrompt(scene);
      
      // Auto-enhance if enabled globally
      if (globalEnableVideoEnhance) {
        toast.info('🤖 AI đang nâng cấp motion prompt...', { duration: 2000 });
        motionPrompt = await enhancePromptWithAI(motionPrompt, 'video');
      }
      
      // Debug: Log aspect ratio and provider being sent
      const videoAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
      const videoResolution = '1080p'; // Always use 1080p for best quality (requires 8s duration)
      
      console.log('[VEO] Generating video with:', { 
        aspectRatio, 
        videoAspectRatio,
        duration: Math.min(scene.duration, 8),
        resolution: videoResolution,
        provider: 'kie',
        hasImage: !!scene.generatedImageUrl
      });
      
      // Call VEO via Kie.ai API
      const response = await fetch('/api/veo-gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: motionPrompt,
          image_url: scene.generatedImageUrl, // Use as first frame
          duration: 8, // Must be 8s for 1080p
          aspect_ratio: videoAspectRatio,
          resolution: videoResolution,
          provider: 'kie', // Always use Kie.ai
        }),
      });
      
      const data = await response.json();
      
      // Video gen là async - cần polling để lấy kết quả
      if (data.video_url) {
        // Có video URL ngay (đã ready)
        const videoUrl = data.video_url;
        console.log('[Video Gen] ✅ Generated video URL:', videoUrl);
        updateScene(scene.id, { 
          generatedVideoUrl: videoUrl,
          status: 'video_ready' 
        });
        
        // Immediate save to localStorage (same as image generation)
        setScenes(currentScenes => {
          const updatedScenes = currentScenes.map(s => 
            s.id === scene.id ? { ...s, generatedVideoUrl: videoUrl, status: 'video_ready' as const } : s
          );
          localStorage.setItem(SCENE_PRODUCTION_KEY, JSON.stringify({
            productionId,
            scenes: updatedScenes,
            step: currentStep,
            updatedAt: new Date().toISOString(),
          }));
          return updatedScenes;
        });
        
        toast.success(`Scene ${scene.number}: Đã tạo video`);
      } else if (data.prediction_id) {
        // VEO 3.1 via Kie.ai - cần polling để lấy kết quả
        toast.info(`Scene ${scene.number}: Đang tạo video VEO 3... (max 3 phút)`, { duration: 5000 });
        
        // 🚀 ELON MODE: Strict 3-minute timeout
        const maxAttempts = 36; // 36 * 5s = 180s = 3 minutes MAX
        let attempts = 0;
        const startTime = Date.now();
        
        const pollResult = async (): Promise<string | null> => {
          while (attempts < maxAttempts) {
            attempts++;
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            
            // 🚀 ELON MODE: Hard timeout check
            if (elapsedSeconds >= 180) {
              console.error('[VEO Polling] ⏰ TIMEOUT after 3 minutes');
              throw new Error('Video generation timeout (3 minutes). Try simpler prompt or shorter video.');
            }
            
            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
            
            try {
              // Use VEO Gemini status endpoint
              const statusRes = await fetch(`/api/veo-gemini/status/${encodeURIComponent(data.prediction_id)}`);
              const statusData = await statusRes.json();
              
              console.log(`[VEO Polling] Attempt ${attempts}:`, statusData);
              
              if (statusData.status === 'succeeded' && statusData.video_url) {
                return statusData.video_url;
              } else if (statusData.status === 'failed') {
                // Video generation explicitly failed - stop immediately
                const errorMsg = statusData.error || 'Video generation failed';
                const causes = statusData.possible_causes || [];
                console.error('[VEO Polling] Video generation failed:', errorMsg);
                console.error('[VEO Polling] Possible causes:', causes);
                
                // Show user-friendly error with possible causes
                const causeText = causes.length > 0 ? `\n\nCó thể do:\n${causes.map((c: string) => `• ${c}`).join('\n')}` : '';
                throw new Error(`${errorMsg}${causeText}`);
              } else if (statusData.done && !statusData.video_url) {
                // Operation done but no video - this is also a failure
                console.error('[VEO Polling] Operation completed but no video URL');
                throw new Error('Google VEO không tạo được video. Có thể prompt vi phạm policy hoặc quá phức tạp.');
              } else if (statusData.status === 'processing') {
                // Still processing, continue polling
                console.log(`[VEO Polling] Still processing... (attempt ${attempts}/${maxAttempts})`);
              }
            } catch (pollError: any) {
              // Check if this is a generation failure (not network error)
              if (pollError.message && (
                pollError.message.includes('No video in response') ||
                pollError.message.includes('failed') || 
                pollError.message.includes('rejected')
              )) {
                // This is a real failure, stop polling and propagate error
                throw pollError;
              }
              // Network/fetch error, continue polling
              console.log(`[VEO Polling] Attempt ${attempts} network error:`, pollError);
            }
          }
          return null;
        };
        
        const videoUrl = await pollResult();
        
        if (videoUrl) {
          console.log('[Video Gen] ✅ Polling completed, video URL:', videoUrl);
          updateScene(scene.id, { 
            generatedVideoUrl: videoUrl,
            status: 'video_ready' 
          });
          
          // Immediate save to localStorage (same as image generation)
          setScenes(currentScenes => {
            const updatedScenes = currentScenes.map(s => 
              s.id === scene.id ? { ...s, generatedVideoUrl: videoUrl, status: 'video_ready' as const } : s
            );
            localStorage.setItem(SCENE_PRODUCTION_KEY, JSON.stringify({
              productionId,
              scenes: updatedScenes,
              step: currentStep,
              updatedAt: new Date().toISOString(),
            }));
            return updatedScenes;
          });
          
          toast.success(`Scene ${scene.number}: Đã tạo video thành công!`);
        } else {
          throw new Error('Timeout waiting for video generation');
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else if (data.status === 'mock') {
        // Mock response for development
        toast.warning(`Scene ${scene.number}: Video API chưa được cấu hình (mock mode)`);
        updateScene(scene.id, { status: 'image_ready' });
      } else {
        throw new Error('Unexpected response from video API');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.error('Video gen error:', e);
      updateScene(scene.id, { status: 'error', error: errorMessage });
      
      // Show detailed error message
      if (errorMessage.includes('policy') || errorMessage.includes('rejected')) {
        toast.error(`Scene ${scene.number}: Google từ chối tạo video (có thể vi phạm policy)`, { duration: 8000 });
      } else if (errorMessage.includes('Timeout')) {
        toast.error(`Scene ${scene.number}: Timeout - VEO mất quá lâu (>3 phút)`, { duration: 6000 });
      } else {
        toast.error(`Scene ${scene.number}: ${errorMessage}`, { duration: 6000 });
      }
    } finally {
      setGeneratingSceneId(null);
      setGeneratingType(null);
    }
  }, [
    aspectRatio,
    globalEnableVideoEnhance,
    enhancePromptWithAI,
    updateScene,
    videoProvider,
    productionId,
    currentStep,
    setScenes,
  ]);

  // Produce all scenes sequentially
  const produceAllScenes = useCallback(async () => {
    setIsProducing(true);
    
    for (const scene of scenes) {
      // Generate image if not ready
      if (scene.status === 'pending' || scene.status === 'error') {
        await generateSceneImage(scene);
        await new Promise(r => setTimeout(r, 1000));
      }
      
      // Get updated scene
      const updatedScene = scenes.find(s => s.id === scene.id);
      if (updatedScene?.status === 'image_ready') {
        await generateSceneVideo(updatedScene);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    setIsProducing(false);
    toast.success('🎬 Hoàn thành sản xuất!');
  }, [scenes, generateSceneImage, generateSceneVideo]);

  return {
    isProducing,
    generatingSceneId,
    generatingType,
    generateSceneImage,
    generateSceneVideo,
    produceAllScenes,
    enhancePromptWithAI,
  };
}
