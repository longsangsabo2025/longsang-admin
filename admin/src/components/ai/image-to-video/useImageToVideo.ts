import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { libraryActions } from '@/hooks/library';
import type { MediaItem } from '@/hooks/library/types';
import { createJob, estimateCost, updateJob } from '@/services/ai-jobs';
import {
  DEFAULT_AI_SETTINGS,
  IMGBB_API_KEY,
  KIE_API_KEY,
  STORAGE_KEY,
  VIDEO_MODELS,
} from './constants';
import type { ImageToVideoProps, VideoResult, VideoSettings } from './types';
import { getMotionSuffix, loadHistory, loadSettings, saveHistory, saveSettings } from './utils';

export function useImageToVideo({
  selectedLibraryImage,
  onActivityLog,
  onUpdateActivityLog,
}: ImageToVideoProps) {
  // Load saved settings on init
  const savedSettings = loadSettings();

  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [libraryImageUrl, setLibraryImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [history, setHistory] = useState<VideoResult[]>([]);

  // Video Settings - load from saved or use defaults
  const [selectedModel, setSelectedModel] = useState(savedSettings.selectedModel || 'runway');
  const [duration, setDuration] = useState<number>(savedSettings.duration || 5);
  const [quality, setQuality] = useState(savedSettings.quality || '720p');
  const [aspectRatio, setAspectRatio] = useState(savedSettings.aspectRatio || '16:9');
  const [motionPreset, setMotionPreset] = useState(savedSettings.motionPreset || 'smooth');
  const [veoModel, setVeoModel] = useState(savedSettings.veoModel || 'veo3_fast');

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);

  // AI Settings for prompt enhancement
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiModel, setAiModel] = useState(savedSettings.aiModel || DEFAULT_AI_SETTINGS.model);
  const [temperature, setTemperature] = useState(
    savedSettings.temperature ?? DEFAULT_AI_SETTINGS.temperature
  );
  const [maxTokens, setMaxTokens] = useState(
    savedSettings.maxTokens || DEFAULT_AI_SETTINGS.maxTokens
  );
  const [systemPrompt, setSystemPrompt] = useState(
    savedSettings.systemPrompt || DEFAULT_AI_SETTINGS.systemPrompt
  );

  // Auto-save settings when they change
  useEffect(() => {
    const settings: VideoSettings = {
      aiModel,
      temperature,
      maxTokens,
      systemPrompt,
      selectedModel,
      duration,
      quality,
      aspectRatio,
      motionPreset,
      veoModel,
    };
    saveSettings(settings);
  }, [
    aiModel,
    temperature,
    maxTokens,
    systemPrompt,
    selectedModel,
    duration,
    quality,
    aspectRatio,
    motionPreset,
    veoModel,
  ]);

  // Update preview when library image is selected
  useEffect(() => {
    if (selectedLibraryImage) {
      setLibraryImageUrl(selectedLibraryImage.url);
      setPreviewUrl(selectedLibraryImage.url);
      setSelectedFile(null);
    }
  }, [selectedLibraryImage]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = loadHistory();
    setHistory(savedHistory);
    if (savedHistory.length > 0 && savedHistory[0].state === 'success') {
      setResult(savedHistory[0]);
    }
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh!');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
    }
  }, []);

  // Upload to imgbb
  const uploadToImgbb = async (file: File): Promise<string> => {
    setProgress('Đang upload ảnh...');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload ảnh thất bại');
    }

    const data = await response.json();
    return data.data.url;
  };

  // Enhance motion prompt using AI
  const enhanceMotionPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả trước khi nâng cấp!');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          type: 'video-motion',
          style: motionPreset !== 'none' ? motionPreset : 'cinematic',
          model: aiModel,
          temperature: temperature,
          maxTokens: maxTokens,
          systemPrompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        // Fallback: enhance locally
        const motionSuffix = getMotionSuffix(motionPreset);
        const enhanced = `${prompt}${motionSuffix}, smooth camera movement, cinematic quality, 4K resolution, professional video`;
        setPrompt(enhanced);
        toast.success('✨ Đã nâng cấp prompt (local)!');
        return;
      }

      const data = await response.json();
      if (data.success && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        toast.success('✨ Đã nâng cấp mô tả chuyển động!');
      } else {
        throw new Error(data.error || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('[Video] Enhance error:', error);
      // Fallback
      const motionSuffix = getMotionSuffix(motionPreset);
      const enhanced = `${prompt}${motionSuffix}, smooth camera movement, cinematic quality, professional video`;
      setPrompt(enhanced);
      toast.success('✨ Đã nâng cấp prompt!');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Create video task on Kie.ai
  const createVideoTask = async (imageUrl: string, promptText: string): Promise<string> => {
    setProgress('Đang gửi yêu cầu tạo video...');

    const modelConfig = VIDEO_MODELS.find((m) => m.id === selectedModel);
    if (!modelConfig) throw new Error('Model không hợp lệ');

    const fullPrompt = `${promptText}${getMotionSuffix(motionPreset)}`;

    let requestBody: Record<string, unknown>;
    let apiUrl: string;

    if (selectedModel === 'runway') {
      // Runway Gen-3 API
      apiUrl = `https://api.kie.ai/api/v1/${modelConfig.apiPath}`;
      requestBody = {
        prompt: fullPrompt,
        imageUrl: imageUrl,
        duration: duration,
        quality: quality,
      };
    } else {
      // Veo3 API
      apiUrl = `https://api.kie.ai/api/v1/${modelConfig.apiPath}`;
      requestBody = {
        prompt: fullPrompt,
        imageUrls: [imageUrl],
        model: veoModel,
        aspectRatio: aspectRatio,
      };
    }

    console.log('[Video] 🎬 Creating task with settings:', {
      apiUrl,
      model: selectedModel,
      veoModel,
      aspectRatio,
      duration,
      promptLength: fullPrompt.length,
      prompt: fullPrompt.substring(0, 200) + '...',
    });
    console.log('[Video] 📦 Full request body:', requestBody);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Video] API Error:', errorData);
      throw new Error(errorData.message || 'Tạo video task thất bại');
    }

    const data = await response.json();
    console.log('[Video] Task created:', data);
    return data.data?.taskId || data.taskId;
  };

  // Poll for result
  const pollResult = async (taskId: string): Promise<VideoResult> => {
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max for video

    while (attempts < maxAttempts) {
      setProgress(`Đang xử lý video... (${attempts * 5}s)`);

      // Determine which API to poll based on model
      const recordUrl =
        selectedModel === 'runway'
          ? `https://api.kie.ai/api/v1/runway/record-info?taskId=${taskId}`
          : `https://api.kie.ai/api/v1/veo/record-info?taskId=${taskId}`;

      const response = await fetch(recordUrl, {
        headers: {
          Authorization: `Bearer ${KIE_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể kiểm tra trạng thái');
      }

      const data = await response.json();
      console.log('[Video] Poll result:', data);

      // Kie.ai Veo3 uses successFlag (1 = success, 0 = processing, -1 = failed)
      const successFlag = data.data?.successFlag;
      const state = data.data?.state || data.state;

      // Check for success - either by successFlag or state
      if (successFlag === 1 || state === 'success' || state === 'completed') {
        // Kie.ai Veo3 returns video URL in data.response.resultUrls[0]
        const videoUrl =
          data.data?.response?.resultUrls?.[0] ||
          data.data?.output?.video ||
          data.data?.videoUrl ||
          data.output?.video;

        console.log('[Video] ✅ Success! Video URL:', videoUrl);

        return {
          taskId,
          state: 'success',
          videoUrl,
          prompt: prompt,
          model: selectedModel,
          duration: duration,
          createdAt: new Date().toISOString(),
        };
      }

      // Check for failure
      if (successFlag === -1 || state === 'fail' || state === 'failed') {
        return {
          taskId,
          state: 'fail',
          error: data.data?.errorMessage || data.data?.error || data.error || 'Tạo video thất bại',
          prompt: prompt,
          model: selectedModel,
        };
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    return {
      taskId,
      state: 'fail',
      error: 'Timeout - Video generation taking too long',
      prompt: prompt,
      model: selectedModel,
    };
  };

  // Main generation function
  const generateVideo = async () => {
    if (!selectedFile && !libraryImageUrl) {
      toast.error('Vui lòng chọn ảnh trước!');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả cho video!');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setProgress('Đang chuẩn bị...');
    const startTime = Date.now();

    // Add to activity log (UI)
    let logId: string | undefined;
    if (onActivityLog) {
      logId = onActivityLog({
        type: 'video',
        model: selectedModel,
        status: 'processing',
        inputUrl: libraryImageUrl || undefined,
        prompt: prompt,
        metadata: { duration, quality, aspectRatio, motionPreset },
      });
    }

    // Create job in database for tracking
    let dbJobId: string | undefined;

    try {
      // Get image URL
      let imageUrl: string;

      if (selectedFile) {
        imageUrl = await uploadToImgbb(selectedFile);
      } else if (libraryImageUrl) {
        imageUrl = libraryImageUrl;
      } else {
        throw new Error('Không có ảnh');
      }

      // Build final prompt with all settings applied
      const motionSuffix = getMotionSuffix(motionPreset);
      const finalPrompt = prompt.includes(motionSuffix.substring(0, 20))
        ? prompt
        : `${prompt}${motionSuffix}`;

      // Save job to database BEFORE creating task
      const dbJob = await createJob({
        job_type: 'image-to-video',
        status: 'processing',
        original_prompt: prompt,
        enhanced_prompt: finalPrompt,
        input_images: [{ url: imageUrl, source: selectedFile ? 'upload' : 'library' }],
        model: selectedModel === 'veo3' ? veoModel : selectedModel,
        provider: 'kie.ai',
        settings: {
          duration,
          quality,
          aspectRatio,
          motionPreset,
          veoModel: selectedModel === 'veo3' ? veoModel : undefined,
          aiEnhanceSettings: {
            model: aiModel,
            temperature: temperature,
          },
        },
      });

      if (dbJob?.id) {
        dbJobId = dbJob.id;
        console.log('[Video] Created DB job:', dbJobId);
      }

      // Create task with final prompt
      const taskId = await createVideoTask(imageUrl, finalPrompt);

      // Update DB job with external task ID
      if (dbJobId) {
        updateJob(dbJobId, {
          external_task_id: taskId,
          external_task_url: `https://kie.ai/task/${taskId}`,
        });
      }

      // Update activity log with task ID
      if (logId && onUpdateActivityLog) {
        onUpdateActivityLog(logId, { taskId });
      }

      // Poll for result
      const videoResult = await pollResult(taskId);

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      // Add more metadata to result
      videoResult.prompt = finalPrompt;
      videoResult.model = selectedModel;
      videoResult.duration = duration;
      videoResult.createdAt = new Date().toISOString();

      setResult(videoResult);

      if (videoResult.state === 'success') {
        toast.success('🎬 Tạo video thành công!');

        // Update DB job as SUCCESS
        const cost = estimateCost(selectedModel === 'veo3' ? veoModel : selectedModel);
        if (dbJobId) {
          updateJob(dbJobId, {
            status: 'success',
            output_url: videoResult.videoUrl,
            output_metadata: {
              duration: videoResult.duration,
              thumbnailUrl: videoResult.thumbnailUrl,
            },
            cost_usd: cost,
            processing_time_ms: processingTimeMs,
            completed_at: new Date().toISOString(),
          });
        }

        // Update activity log as completed
        if (logId && onUpdateActivityLog) {
          onUpdateActivityLog(logId, {
            status: 'completed',
            outputUrl: videoResult.videoUrl,
            completedAt: new Date().toISOString(),
            cost: cost,
          });
        }

        // Save to history immediately
        const newHistory = [videoResult, ...history.filter((h) => h.taskId !== taskId)].slice(
          0,
          20
        );
        setHistory(newHistory);
        saveHistory(newHistory);

        // Auto-save to Cloudinary and Google Drive in background
        if (videoResult.videoUrl) {
          saveToCloudinary(videoResult, dbJobId);
          saveVideoToDrive(videoResult, dbJobId);
        }
      } else {
        // Update DB job as FAILED
        if (dbJobId) {
          updateJob(dbJobId, {
            status: 'failed',
            processing_time_ms: processingTimeMs,
            completed_at: new Date().toISOString(),
          });
        }

        // Update activity log as failed
        if (logId && onUpdateActivityLog) {
          onUpdateActivityLog(logId, {
            status: 'failed',
            error: videoResult.error || 'Unknown error',
          });
        }
        toast.error(videoResult.error || 'Tạo video thất bại');
      }
    } catch (error) {
      console.error('[Video] Generation error:', error);

      // Update DB job as FAILED
      if (dbJobId) {
        updateJob(dbJobId, {
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        });
      }

      // Update activity log as failed
      if (logId && onUpdateActivityLog) {
        onUpdateActivityLog(logId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  // Save video to Cloudinary (primary storage)
  const saveToCloudinary = async (video: VideoResult, dbJobId?: string) => {
    if (!video.videoUrl) return null;

    try {
      console.log('[Video] Uploading to Cloudinary...');
      const response = await fetch('/api/cloudinary/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: video.videoUrl,
          folder: 'ai-videos',
          resourceType: 'video',
          tags: ['ai-generated', video.model || 'video', 'veo3'],
          metadata: {
            taskId: video.taskId,
            prompt: video.prompt?.substring(0, 200),
            model: video.model,
            duration: video.duration,
            source: 'image-to-video',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('[Video] ☁️ Saved to Cloudinary:', data.data.publicId);
          toast.success('☁️ Đã lưu vào Cloud Storage!');

          // Update DB job with Cloudinary info
          if (dbJobId) {
            updateJob(dbJobId, {
              cloudinary_id: data.data.publicId,
              cloudinary_url: data.data.url,
            });
          }

          return data.data;
        }
      }
      console.warn('[Video] Cloudinary upload failed');
      return null;
    } catch (error) {
      console.error('[Video] Cloudinary upload error:', error);
      return null;
    }
  };

  // Save video to Google Drive
  const saveVideoToDrive = async (video: VideoResult, dbJobId?: string) => {
    if (!video.videoUrl) return;

    setIsSavingToDrive(true);
    try {
      const response = await fetch('/api/drive/library/upload-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: video.videoUrl,
          filename: `ai-video-${video.taskId}.mp4`,
          folder: 'AI Videos',
          metadata: {
            prompt: video.prompt,
            model: video.model,
            duration: video.duration,
            createdAt: video.createdAt,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('☁️ Đã lưu video vào Google Drive!');
        console.log('[Video] Saved to Drive:', data);

        // Update DB job with Drive info
        if (dbJobId && data.fileId) {
          updateJob(dbJobId, {
            drive_id: data.fileId,
            drive_url: data.webViewLink || `https://drive.google.com/file/d/${data.fileId}/view`,
          });
        }
      } else {
        console.warn('[Video] Drive upload failed, video still in history');
      }
    } catch (error) {
      console.error('[Video] Drive upload error:', error);
      // Don't show error to user - video is still in history
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Manual save to Drive
  const handleSaveToDrive = () => {
    if (result?.state === 'success') {
      saveVideoToDrive(result);
    }
  };

  // Save video to Library Workspace
  const handleSaveToLibrary = async () => {
    if (!result?.videoUrl || result.state !== 'success') return;

    setIsSavingToLibrary(true);
    try {
      const mediaItem: MediaItem = {
        id: `video_${result.taskId}_${Date.now()}`,
        name: `AI_Video_${result.taskId}.mp4`,
        url: result.videoUrl,
        type: 'video',
        mimeType: 'video/mp4',
      };

      const success = await libraryActions.addToWorkspace(mediaItem, true);
      if (success) {
        toast.success('✅ Đã lưu video vào Thư Viện!');
      } else {
        toast.info('Video đã có trong Thư Viện');
      }
    } catch (error) {
      console.error('[Video] Library save error:', error);
      toast.error('Lưu vào Thư Viện thất bại');
    } finally {
      setIsSavingToLibrary(false);
    }
  };

  // Download video
  const downloadVideo = async () => {
    if (!result?.videoUrl) return;

    try {
      const response = await fetch(result.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${result.taskId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Đã tải video!');
    } catch {
      // Fallback: open in new tab
      window.open(result.videoUrl, '_blank');
    }
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Đã xóa lịch sử');
  };

  // Reset AI settings to defaults
  const resetAISettings = useCallback(() => {
    setAiModel(DEFAULT_AI_SETTINGS.model);
    setTemperature(DEFAULT_AI_SETTINGS.temperature);
    setMaxTokens(DEFAULT_AI_SETTINGS.maxTokens);
    setSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt);
    toast.success('Đã reset về mặc định');
  }, []);

  const currentModel = VIDEO_MODELS.find((m) => m.id === selectedModel);

  return {
    // Prompt
    prompt,
    setPrompt,
    // File/Image
    selectedFile,
    previewUrl,
    libraryImageUrl,
    handleFileChange,
    // Generation
    isGenerating,
    result,
    setResult,
    progress,
    generateVideo,
    // History
    history,
    clearHistory,
    // Model
    selectedModel,
    setSelectedModel,
    currentModel,
    // Video Settings
    duration,
    setDuration,
    quality,
    setQuality,
    aspectRatio,
    setAspectRatio,
    motionPreset,
    setMotionPreset,
    veoModel,
    setVeoModel,
    showSettings,
    setShowSettings,
    // AI Settings
    showAISettings,
    setShowAISettings,
    aiModel,
    setAiModel,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    systemPrompt,
    setSystemPrompt,
    // Actions
    isEnhancing,
    enhanceMotionPrompt,
    downloadVideo,
    handleSaveToDrive,
    handleSaveToLibrary,
    isSavingToDrive,
    isSavingToLibrary,
    isPlaying,
    setIsPlaying,
    resetAISettings,
  };
}
