/**
 * Multiple Images to Image Generator Component
 * Combines multiple images into one AI-generated image using Kie.ai
 * Based on n8n workflow "Multiple Images to Image"
 */

import {
  Briefcase,
  Building2,
  Copy,
  Download,
  FolderPlus,
  History,
  Image as ImageIcon,
  Images,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  Settings2,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useLibraryProducts, useLibraryWorkspace } from '@/hooks/library';
import type { MediaItem } from '@/hooks/library/types';
import { createJob, estimateCost, updateJob } from '@/services/ai-jobs';

// Style Presets for professional image generation
const STYLE_PRESETS = [
  { id: 'none', name: 'Không áp dụng', suffix: '' },
  {
    id: 'cinematic',
    name: '🎬 Cinematic',
    suffix:
      ', cinematic composition, dramatic lighting, shallow depth of field, bokeh background, color grading, film grain, movie still quality',
  },
  {
    id: 'product',
    name: '📦 Product Photography',
    suffix:
      ', professional product photography, studio lighting, clean white background, high-end commercial style, sharp focus, reflection, minimalist',
  },
  {
    id: 'portrait',
    name: '👤 Portrait',
    suffix:
      ', professional portrait photography, soft studio lighting, shallow depth of field, natural skin tones, eye contact, magazine quality',
  },
  {
    id: 'fashion',
    name: '👗 Fashion',
    suffix:
      ', high fashion editorial style, dramatic pose, designer aesthetic, vogue magazine quality, stylish composition, trendy colors',
  },
  {
    id: 'minimalist',
    name: '⬜ Minimalist',
    suffix:
      ', minimalist design, clean lines, negative space, simple elegant composition, subtle colors, modern aesthetic',
  },
  {
    id: 'vibrant',
    name: '🌈 Vibrant',
    suffix:
      ', vibrant saturated colors, high contrast, dynamic composition, eye-catching, bold artistic style, energetic mood',
  },
  {
    id: 'vintage',
    name: '📷 Vintage',
    suffix:
      ', vintage photography style, film grain, muted warm tones, nostalgic mood, retro aesthetic, analog camera feel',
  },
  {
    id: 'realistic',
    name: '📸 Hyper Realistic',
    suffix:
      ', hyper realistic, photorealistic, ultra detailed, 8K resolution, natural lighting, lifelike textures, professional photography',
  },
  {
    id: 'artistic',
    name: '🎨 Artistic',
    suffix:
      ', artistic interpretation, creative composition, painterly style, expressive brushstrokes, fine art quality, gallery worthy',
  },
  {
    id: 'dark',
    name: '🌙 Dark & Moody',
    suffix:
      ', dark moody atmosphere, low key lighting, dramatic shadows, mysterious mood, noir aesthetic, rich contrast',
  },
  {
    id: 'bright',
    name: '☀️ Bright & Airy',
    suffix:
      ', bright airy atmosphere, soft natural light, white tones, clean fresh look, optimistic mood, Instagram aesthetic',
  },
];

// AI Models for prompt enhancement
const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Nhanh, tiết kiệm' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Chất lượng cao' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Mạnh mẽ, chi tiết' },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Sáng tạo, tự nhiên',
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Nhanh, hiệu quả',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Tốt nhất, miễn phí',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Nhanh, 1M context',
  },
];

// Default AI settings
const DEFAULT_AI_SETTINGS = {
  model: 'gpt-4o-mini',
  temperature: 0.8,
  maxTokens: 300,
};

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';
const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY || '';
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const STORAGE_KEY = 'multi-image-generator-history';
const MAX_IMAGES = 5;

interface GenerationResult {
  taskId: string;
  state: 'generating' | 'success' | 'fail';
  imageUrl?: string;
  error?: string;
  prompt?: string;
  imageCount?: number;
  createdAt?: string;
}

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
}

// Load history from localStorage
const loadHistory = (): GenerationResult[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Save history to localStorage
const saveHistory = (history: GenerationResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 10))); // Keep last 10
  } catch {
    console.error('Failed to save history');
  }
};

// Library image type for props
interface LibrarySelectedImage {
  id: string;
  url: string;
  name: string;
}

interface MultipleImagesToImageProps {
  selectedLibraryImages?: MediaItem[];
}

export function MultipleImagesToImage({ selectedLibraryImages = [] }: MultipleImagesToImageProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [libraryImages, setLibraryImages] = useState<LibrarySelectedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('none');

  // System Library hooks - connects to real Thư Viện
  const workspaceLib = useLibraryWorkspace();
  const productLib = useLibraryProducts();

  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveCategory, setSaveCategory] = useState('');

  // AI Settings states
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiModel, setAiModel] = useState(DEFAULT_AI_SETTINGS.model);
  const [temperature, setTemperature] = useState(DEFAULT_AI_SETTINGS.temperature);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_AI_SETTINGS.maxTokens);

  // Sync library images from props
  useEffect(() => {
    if (selectedLibraryImages.length > 0) {
      const libImages: LibrarySelectedImage[] = selectedLibraryImages.map((item) => ({
        id: item.id,
        url: item.url,
        name: item.name,
      }));
      setLibraryImages(libImages);
    }
  }, [selectedLibraryImages]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = loadHistory();
    setHistory(savedHistory);
    if (savedHistory.length > 0 && savedHistory[0].state === 'success') {
      setResult(savedHistory[0]);
    }
  }, []);

  // Total images count (uploaded + library)
  const totalImages = selectedImages.length + libraryImages.length;

  // Handle file selection - multiple files
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const remainingSlots = MAX_IMAGES - totalImages;
      const filesToAdd = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        toast.warning(`Chỉ có thể thêm ${remainingSlots} ảnh nữa (tối đa ${MAX_IMAGES} ảnh)`);
      }

      const newImages: SelectedImage[] = filesToAdd.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setSelectedImages((prev) => [...prev, ...newImages]);

      // Reset input
      e.target.value = '';
    },
    [totalImages]
  );

  // Remove an uploaded image
  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      // Revoke URL to free memory
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return updated;
    });
  };

  // Upload single image to imgbb
  const uploadToImgbb = async (file: File): Promise<string> => {
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

  // Upload all images and get URLs (including library images)
  const uploadAllImages = async (): Promise<string[]> => {
    const urls: string[] = [];

    // First add library images (already have URLs)
    if (libraryImages.length > 0) {
      setProgress(`Sử dụng ${libraryImages.length} ảnh từ thư viện...`);
      libraryImages.forEach((img) => urls.push(img.url));
    }

    // Then upload selected files
    for (let i = 0; i < selectedImages.length; i++) {
      setProgress(`Đang upload ảnh ${i + 1}/${selectedImages.length}...`);
      const url = await uploadToImgbb(selectedImages[i].file);
      urls.push(url);
    }

    return urls;
  };

  // Remove a library image
  const handleRemoveLibraryImage = (id: string) => {
    setLibraryImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Get style suffix
  const getStyleSuffix = () => {
    const style = STYLE_PRESETS.find((s) => s.id === selectedStyle);
    return style?.suffix || '';
  };

  // Enhance prompt with AI
  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập prompt trước!');
      return;
    }

    setIsEnhancing(true);
    try {
      const styleSuffix = getStyleSuffix();
      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'multiple-images',
          style: selectedStyle,
          imageCount: totalImages,
          // AI Settings
          model: aiModel,
          temperature: temperature,
          maxTokens: maxTokens,
        }),
      });

      if (!response.ok) {
        // Fallback: enhance locally with style
        const enhanced = `${prompt}${styleSuffix}, highly detailed, professional quality, 8K resolution, masterpiece, seamlessly combining all ${totalImages} input images`;
        setPrompt(enhanced);
        toast.success('✨ Đã nâng cấp prompt (local)!');
        return;
      }

      const data = await response.json();
      // Append style suffix if not already enhanced by AI
      let finalPrompt = data.enhancedPrompt || prompt;
      if (styleSuffix && !finalPrompt.includes(styleSuffix.substring(0, 20))) {
        finalPrompt += styleSuffix;
      }
      setPrompt(finalPrompt);
      toast.success('✨ Đã nâng cấp prompt với AI!');
    } catch {
      const styleSuffix = getStyleSuffix();
      const enhanced = `${prompt}${styleSuffix}, highly detailed, professional quality, 8K resolution, masterpiece, seamlessly combining all input images`;
      setPrompt(enhanced);
      toast.success('✨ Đã nâng cấp prompt!');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Create task on Kie.ai with multiple images
  const createKieTask = async (imageUrls: string[], prompt: string): Promise<string> => {
    setProgress('Đang gửi yêu cầu tạo ảnh...');
    const response = await fetch(`${KIE_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        input: {
          prompt: prompt,
          aspect_ratio: '1:1',
          resolution: '4K',
          output_format: 'png',
          image_input: imageUrls, // Multiple image URLs
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Tạo task thất bại');
    }

    const data = await response.json();
    return data.data.taskId;
  };

  // Poll for result
  const pollResult = async (taskId: string): Promise<GenerationResult> => {
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      setProgress(`Đang xử lý... (${attempts * 5}s)`);

      const response = await fetch(`${KIE_API_URL}/recordInfo?taskId=${taskId}`, {
        headers: {
          Authorization: `Bearer ${KIE_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể kiểm tra trạng thái');
      }

      const data = await response.json();
      const state = data.data.state;

      if (state === 'success') {
        const resultJson = JSON.parse(data.data.resultJson);
        return {
          taskId,
          state: 'success',
          imageUrl: resultJson.resultUrls[0],
        };
      }

      if (state === 'fail') {
        return {
          taskId,
          state: 'fail',
          error: 'Tạo ảnh thất bại',
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    return {
      taskId,
      state: 'fail',
      error: 'Timeout - quá thời gian chờ',
    };
  };

  // Main generation flow
  const handleGenerate = async () => {
    if (totalImages < 2) {
      toast.error('Vui lòng chọn ít nhất 2 ảnh (từ thư viện hoặc upload)!');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Vui lòng nhập prompt!');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    const startTime = Date.now();

    // Create job in database
    let dbJobId: string | undefined;

    try {
      // Step 1: Upload all images (library images already have URLs)
      const imageUrls = await uploadAllImages();
      toast.success(`Sử dụng ${imageUrls.length} ảnh!`);

      // Save job to database BEFORE creating task
      const dbJob = await createJob({
        job_type: 'text-to-image', // Using text-to-image for multi-image fusion
        status: 'processing',
        original_prompt: prompt,
        input_images: imageUrls.map((url, idx) => ({
          url,
          source: selectedImages[idx] ? 'upload' : 'library',
        })),
        model: 'nano-banana-pro',
        provider: 'kie.ai',
        settings: {
          style: selectedStyle,
          imageCount: totalImages,
          aiModel: aiModel,
          temperature: temperature,
        },
      });

      if (dbJob?.id) {
        dbJobId = dbJob.id;
        console.log('[MultiImage] Created DB job:', dbJobId);
      }

      // Step 2: Create Kie.ai task
      const taskId = await createKieTask(imageUrls, prompt);
      toast.info('Đang xử lý kết hợp ảnh...');

      // Update DB job with task ID
      if (dbJobId) {
        updateJob(dbJobId, { external_task_id: taskId });
      }

      // Step 3: Poll for result
      const generationResult = await pollResult(taskId);

      const resultWithMeta: GenerationResult = {
        ...generationResult,
        prompt: prompt,
        imageCount: totalImages,
        createdAt: new Date().toISOString(),
      };

      setResult(resultWithMeta);

      if (generationResult.state === 'success') {
        toast.success('🎉 Tạo ảnh thành công!');

        // Update DB job as SUCCESS
        if (dbJobId) {
          updateJob(dbJobId, {
            status: 'success',
            output_url: generationResult.imageUrl,
            cost_usd: estimateCost('nano-banana-pro'),
            processing_time_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          });
        }

        const newHistory = [resultWithMeta, ...history.filter((h) => h.taskId !== taskId)];
        setHistory(newHistory);
        saveHistory(newHistory);
      } else {
        // Update DB job as FAILED
        if (dbJobId) {
          updateJob(dbJobId, {
            status: 'failed',
            processing_time_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          });
        }
        toast.error(generationResult.error || 'Tạo ảnh thất bại');
      }
    } catch (error) {
      console.error('Generation error:', error);

      // Update DB job as FAILED
      if (dbJobId) {
        updateJob(dbJobId, {
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        });
      }

      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  // Download result
  const handleDownload = () => {
    if (!result?.imageUrl) return;
    window.open(result.imageUrl, '_blank');
    toast.success('Ảnh đã mở trong tab mới - Right-click để lưu!');
  };

  // Copy URL
  const handleCopyUrl = async () => {
    if (!result?.imageUrl) return;
    try {
      await navigator.clipboard.writeText(result.imageUrl);
      toast.success('Đã copy URL ảnh!');
    } catch {
      toast.error('Không thể copy URL');
    }
  };

  // Reset form
  const handleReset = () => {
    setPrompt('');
    for (const img of selectedImages) {
      URL.revokeObjectURL(img.previewUrl);
    }
    setSelectedImages([]);
    setResult(null);
    setProgress('');
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Đã xóa lịch sử!');
  };

  // Select from history
  const handleSelectHistory = (item: GenerationResult) => {
    setResult(item);
    if (item.prompt) {
      setPrompt(item.prompt);
    }
  };

  // Save to library (using system hooks)
  const handleSaveToLibrary = (type: 'workspace' | 'product') => {
    if (!result?.imageUrl || result.state !== 'success') {
      toast.error('Không có ảnh để lưu!');
      return;
    }

    const mediaItem: MediaItem = {
      id: `ai-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `AI Multi-Image - ${(result.prompt || prompt).slice(0, 50)}...`,
      url: result.imageUrl,
      thumbnailUrl: result.imageUrl,
      mimeType: 'image/png',
      size: 0,
      modifiedTime: new Date().toISOString(),
      type: 'image',
    };

    if (type === 'workspace') {
      workspaceLib.addItems([mediaItem]);
      toast.success('✅ Đã lưu vào Workspace! Xem trong Library → Workspace');
    } else {
      productLib.addItems([mediaItem], 'draft');
      toast.success('✅ Đã lưu vào Products! Xem trong Library → Products');
    }

    setSaveDialogOpen(false);
    setSaveCategory('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            Kết hợp nhiều ảnh
          </CardTitle>
          <CardDescription>Upload 2-5 ảnh và mô tả cách kết hợp chúng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <Label>
              Chọn ảnh ({selectedImages.length}/{MAX_IMAGES})
            </Label>

            {/* Image Grid */}
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-lg overflow-hidden border"
                >
                  <img src={img.previewUrl} alt="Selected" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Xóa ảnh"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add more button */}
              {selectedImages.length < MAX_IMAGES && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                  <Plus className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-400">Thêm ảnh</span>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {selectedImages.length === 0 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click để chọn ảnh (2-5 ảnh)</span>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Style Preset Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Phong cách hình ảnh
            </Label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phong cách" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Settings Collapsible */}
          <Collapsible open={showAISettings} onOpenChange={setShowAISettings}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Cài đặt AI Model
                </span>
                <span className="text-xs text-muted-foreground">
                  {AI_MODELS.find((m) => m.id === aiModel)?.name || aiModel}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  AI Model
                </Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Độ sáng tạo (Temperature)</Label>
                  <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={(v) => setTemperature(v[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">0 = Chính xác, 1 = Sáng tạo cao</p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Độ dài tối đa (Tokens)</Label>
                  <span className="text-sm text-muted-foreground">{maxTokens}</span>
                </div>
                <Slider
                  value={[maxTokens]}
                  onValueChange={(v) => setMaxTokens(v[0])}
                  min={100}
                  max={500}
                  step={50}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Prompt dài hơn = chi tiết hơn</p>
              </div>

              {/* Reset to defaults */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAiModel(DEFAULT_AI_SETTINGS.model);
                  setTemperature(DEFAULT_AI_SETTINGS.temperature);
                  setMaxTokens(DEFAULT_AI_SETTINGS.maxTokens);
                  toast.success('Đã reset về mặc định');
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset mặc định
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="prompt">Mô tả cách kết hợp</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={enhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Nâng cấp AI
              </Button>
            </div>
            <Textarea
              id="prompt"
              placeholder="Ví dụ: Một người đàn ông mặc áo thun từ ảnh 1, đeo đồng hồ từ ảnh 2, cầm chai nước từ ảnh 3, đang leo núi"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            {selectedStyle !== 'none' && (
              <p className="text-xs text-muted-foreground">
                💡 Phong cách{' '}
                <strong>{STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name}</strong> sẽ được
                áp dụng khi tạo ảnh
              </p>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating || selectedImages.length < 2 || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Tạo ảnh kết hợp
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Result & History */}
      <div className="space-y-4">
        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Kết quả
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result?.state === 'success' && result.imageUrl && (
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống
                  </Button>
                  <Button variant="outline" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Lưu
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Lưu vào Thư viện</DialogTitle>
                        <DialogDescription>Chọn thư viện và danh mục để lưu ảnh</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Danh mục (tùy chọn)</Label>
                          <Input
                            placeholder="VD: Banner, Poster, Avatar..."
                            value={saveCategory}
                            onChange={(e) => setSaveCategory(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSaveToLibrary('workspace')}
                          className="flex-1"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          Workspace
                        </Button>
                        <Button onClick={() => handleSaveToLibrary('product')} className="flex-1">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Product
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {result.imageCount && (
                  <p className="text-xs text-muted-foreground text-center">
                    Kết hợp từ {result.imageCount} ảnh
                  </p>
                )}
              </div>
            )}
            {result?.state === 'fail' && (
              <div className="h-48 flex items-center justify-center text-red-500">
                {result.error || 'Tạo ảnh thất bại'}
              </div>
            )}
            {(!result || (result.state !== 'success' && result.state !== 'fail')) && (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Images className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Kết quả sẽ hiển thị ở đây</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Lịch sử ({history.length})
              </CardTitle>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-2">
            {history.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {history.slice(0, 8).map((item) => (
                  <button
                    key={item.taskId}
                    onClick={() => handleSelectHistory(item)}
                    className={`aspect-square rounded overflow-hidden border-2 transition-colors ${
                      result?.taskId === item.taskId
                        ? 'border-primary'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    title="Xem ảnh từ lịch sử"
                    aria-label="Xem ảnh từ lịch sử"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="History"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có lịch sử</p>
            )}
          </CardContent>
        </Card>

        {/* Library Quick Access */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderPlus className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">Thư viện đã lưu</h3>
                  <p className="text-xs text-muted-foreground">
                    Workspace: {workspaceLib.items.length} • Products: {productLib.items.length}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/admin/library')}
              >
                Mở Thư Viện
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MultipleImagesToImage;
