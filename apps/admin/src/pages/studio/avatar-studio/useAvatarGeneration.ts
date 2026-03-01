/**
 * Hook for Avatar Content Generation
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { AvatarProfile, ContentTemplate, GeneratedContent, OwnerPortrait } from './types';
import { GENERATION_STYLES, PLATFORM_CONFIGS } from './constants';

interface UseAvatarGenerationOptions {
  profile: AvatarProfile;
  ownerPortraits: OwnerPortrait[];
}

export function useAvatarGeneration({ profile, ownerPortraits }: UseAvatarGenerationOptions) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [customScript, setCustomScript] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram' | 'facebook' | 'youtube'>('tiktok');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  // Generate avatar content (image or video)
  const generateAvatarContent = useCallback(async (type: 'image' | 'video') => {
    if (ownerPortraits.length === 0) {
      toast.error('Vui lòng upload ảnh chân dung trước!');
      return;
    }

    const script = customScript || selectedTemplate?.script || '';
    if (!script.trim()) {
      toast.error('Vui lòng nhập hoặc chọn script!');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const contentId = `content-${Date.now()}`;
    const newContent: GeneratedContent = {
      id: contentId,
      type,
      status: 'generating',
      prompt: script,
      createdAt: new Date(),
      platform: selectedPlatform,
    };

    setGeneratedContent(prev => [newContent, ...prev]);

    try {
      // Get style and platform config
      const style = GENERATION_STYLES.find(s => s.id === selectedStyle);
      const platform = PLATFORM_CONFIGS[selectedPlatform];

      // Select best portrait
      const portrait = ownerPortraits[0];

      // Build enhanced prompt
      const avatarPrompt = `
        Create a ${type === 'video' ? 'video' : 'professional image'} of ${profile.name}, ${profile.role} of ${profile.brand}.
        
        Reference face: Use the provided portrait as reference for consistent facial features.
        Style: ${style?.prompt}
        Setting: Modern billiard club environment, SABO Arena branding visible
        Expression: Confident, welcoming, speaking to camera
        Aspect ratio: ${platform.aspectRatio}
        
        Context: ${script}
        
        The person should look exactly like the reference portrait but in the described scene.
      `.trim();

      setGenerationProgress(20);

      if (type === 'image') {
        // Generate image with NanoBanana
        const response = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: avatarPrompt,
            referenceImage: portrait.imageUrl,
            style: selectedStyle,
            aspectRatio: platform.aspectRatio,
          }),
        });

        setGenerationProgress(60);

        if (response.ok) {
          const data = await response.json();
          setGenerationProgress(100);

          setGeneratedContent(prev => prev.map(c =>
            c.id === contentId
              ? { ...c, status: 'completed', outputUrl: data.imageUrl }
              : c
          ));

          toast.success('🎨 Avatar image generated!');
        } else {
          throw new Error('Image generation failed');
        }
      } else {
        // Generate video with Veo3
        setGenerationProgress(30);

        // Step 1: Generate image first
        const imageResponse = await fetch('/api/ai/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: avatarPrompt,
            referenceImage: portrait.imageUrl,
            style: selectedStyle,
          }),
        });

        if (!imageResponse.ok) throw new Error('Image generation failed');
        const imageData = await imageResponse.json();

        setGenerationProgress(50);

        // Step 2: Convert to video with Veo3
        const videoResponse = await fetch('/api/ai/video/veo3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${avatarPrompt}. Camera slowly zooms in as the person speaks. Subtle movement and gestures.`,
            imageUrl: imageData.imageUrl,
            duration: selectedTemplate?.duration || 15,
            aspectRatio: platform.aspectRatio,
          }),
        });

        setGenerationProgress(80);

        if (videoResponse.ok) {
          const videoData = await videoResponse.json();

          // Poll for completion
          const pollVideo = async (taskId: string): Promise<string> => {
            const statusResponse = await fetch(`/api/ai/video/status/${taskId}`);
            const status = await statusResponse.json();

            if (status.status === 'completed') {
              return status.videoUrl;
            } else if (status.status === 'failed') {
              throw new Error('Video generation failed');
            }

            await new Promise(r => setTimeout(r, 5000));
            return pollVideo(taskId);
          };

          const videoUrl = await pollVideo(videoData.taskId);
          setGenerationProgress(100);

          setGeneratedContent(prev => prev.map(c =>
            c.id === contentId
              ? { ...c, status: 'completed', outputUrl: videoUrl }
              : c
          ));

          toast.success('🎬 Avatar video generated!');
        } else {
          throw new Error('Video generation failed');
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratedContent(prev => prev.map(c =>
        c.id === contentId ? { ...c, status: 'failed' } : c
      ));
      toast.error('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [profile, ownerPortraits, selectedTemplate, customScript, selectedStyle, selectedPlatform]);

  return {
    selectedTemplate,
    setSelectedTemplate,
    customScript,
    setCustomScript,
    selectedStyle,
    setSelectedStyle,
    selectedPlatform,
    setSelectedPlatform,
    generationProgress,
    isGenerating,
    generatedContent,
    generateAvatarContent,
  };
}
