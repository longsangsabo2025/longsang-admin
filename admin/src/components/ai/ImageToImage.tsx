/**
 * Image to Image Generator Component
 * Connects to n8n workflow for AI image transformation
 * Kie.ai API integration via n8n
 */

import {
  Briefcase,
  Building2,
  Download,
  FolderPlus,
  History,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  Settings2,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
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

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';
const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY || '';
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';
const STORAGE_KEY = 'image-generator-history';

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
  creativity: 'balanced', // conservative, balanced, creative
};

interface GenerationResult {
  taskId: string;
  state: 'generating' | 'success' | 'fail';
  imageUrl?: string;
  error?: string;
  prompt?: string;
  createdAt?: string;
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

interface ImageToImageProps {
  selectedLibraryImage?: MediaItem;
}

export function ImageToImage({ selectedLibraryImage }: ImageToImageProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [libraryImageUrl, setLibraryImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [history, setHistory] = useState<GenerationResult[]>([]);

  // System Library hooks - connects to real Thư Viện
  const workspaceLib = useLibraryWorkspace();
  const productLib = useLibraryProducts();

  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveCategory, setSaveCategory] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('none');

  // AI Settings states
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiModel, setAiModel] = useState(DEFAULT_AI_SETTINGS.model);
  const [temperature, setTemperature] = useState(DEFAULT_AI_SETTINGS.temperature);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_AI_SETTINGS.maxTokens);

  // Update preview when library image is selected
  useEffect(() => {
    if (selectedLibraryImage) {
      setLibraryImageUrl(selectedLibraryImage.url);
      setPreviewUrl(selectedLibraryImage.url);
      setSelectedFile(null); // Clear file selection when using library image
    }
  }, [selectedLibraryImage]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = loadHistory();
    setHistory(savedHistory);
    // Show last successful result
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

  // Get style suffix
  const getStyleSuffix = () => {
    const style = STYLE_PRESETS.find((s) => s.id === selectedStyle);
    return style?.suffix || '';
  };

  // Enhance prompt using AI
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          type: 'image-to-image',
          style: selectedStyle,
          // AI Settings
          model: aiModel,
          temperature: temperature,
          maxTokens: maxTokens,
        }),
      });

      if (!response.ok) {
        // Fallback: enhance locally with style
        const enhanced = `${prompt}${styleSuffix}, highly detailed, professional quality, 8K resolution, masterpiece`;
        setPrompt(enhanced);
        toast.success('✨ Đã nâng cấp prompt (local)!');
        return;
      }

      const data = await response.json();
      // Append style suffix if not already enhanced
      let finalPrompt = data.enhancedPrompt || prompt;
      if (styleSuffix && !finalPrompt.includes(styleSuffix.substring(0, 20))) {
        finalPrompt += styleSuffix;
      }
      setPrompt(finalPrompt);
      toast.success('✨ Đã nâng cấp prompt với AI!');
    } catch (error) {
      // Fallback enhancement with style
      const styleSuffix = getStyleSuffix();
      const enhanced = `${prompt}${styleSuffix}, highly detailed, professional quality, 8K resolution, masterpiece`;
      setPrompt(enhanced);
      toast.success('✨ Đã nâng cấp prompt!');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Create task on Kie.ai
  const createKieTask = async (imageUrl: string, prompt: string): Promise<string> => {
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
          image_input: [imageUrl],
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
    const maxAttempts = 60; // 5 minutes max

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

      // Still generating, wait 5 seconds
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
    // Check for image source - either uploaded file or library image
    const hasImage = selectedFile || libraryImageUrl;
    if (!hasImage) {
      toast.error('Vui lòng chọn ảnh từ thư viện hoặc upload!');
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
      let imageUrl: string;

      // Step 1: Get image URL - either upload or use library URL
      if (selectedFile) {
        imageUrl = await uploadToImgbb(selectedFile);
        toast.success('Upload ảnh thành công!');
      } else if (libraryImageUrl) {
        imageUrl = libraryImageUrl;
        setProgress('Sử dụng ảnh từ thư viện...');
      } else {
        throw new Error('No image selected');
      }

      // Save job to database BEFORE creating task
      const dbJob = await createJob({
        job_type: 'text-to-image', // Using text-to-image for image-to-image variation
        status: 'processing',
        original_prompt: prompt,
        input_images: [{ url: imageUrl, source: selectedFile ? 'upload' : 'library' }],
        model: 'nano-banana-pro',
        provider: 'kie.ai',
        settings: {
          style: stylePreset,
          aiModel: aiModel,
          temperature: aiTemperature,
        },
      });

      if (dbJob?.id) {
        dbJobId = dbJob.id;
        console.log('[ImageToImage] Created DB job:', dbJobId);
      }

      // Step 2: Create Kie.ai task
      const taskId = await createKieTask(imageUrl, prompt);
      toast.info('Đang xử lý ảnh...');

      // Update DB job with task ID
      if (dbJobId) {
        updateJob(dbJobId, { external_task_id: taskId });
      }

      // Step 3: Poll for result
      const generationResult = await pollResult(taskId);

      // Add metadata
      const resultWithMeta: GenerationResult = {
        ...generationResult,
        prompt: prompt,
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

        // Save to history
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

  // Download result image - open in new tab to bypass CSP
  const handleDownload = () => {
    if (!result?.imageUrl) return;

    // Open in new tab - user can right-click save
    window.open(result.imageUrl, '_blank');
    toast.success('Ảnh đã mở trong tab mới - Right-click để lưu!');
  };

  // Copy image URL to clipboard
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
    setSelectedFile(null);
    setPreviewUrl(null);
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
      name: `AI Generated - ${(result.prompt || prompt).slice(0, 50)}...`,
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
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Card */}
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Ảnh gốc & Prompt
            </CardTitle>
            <CardDescription>Upload ảnh và mô tả cách bạn muốn chỉnh sửa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Chọn ảnh</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}

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
                            <span className="text-xs text-muted-foreground">
                              {model.description}
                            </span>
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

            {/* Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt">Prompt mô tả</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={enhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="h-7 text-xs"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Đang nâng cấp...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Nâng cấp AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="prompt"
                placeholder="Ví dụ: Transform to anime style, add sunset background..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              {selectedStyle !== 'none' ? (
                <p className="text-xs text-muted-foreground">
                  💡 Phong cách{' '}
                  <strong>{STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name}</strong> sẽ được
                  áp dụng khi tạo ảnh
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Chọn phong cách và nhấn "Nâng cấp AI" để có prompt chuyên nghiệp
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedFile || !prompt.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress || 'Đang xử lý...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tạo ảnh
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Kết quả
            </CardTitle>
            <CardDescription>Ảnh được tạo bởi AI sẽ hiển thị ở đây</CardDescription>
          </CardHeader>
          <CardContent>
            {result?.state === 'success' && result.imageUrl ? (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Mở ảnh
                  </Button>
                  <Button onClick={handleCopyUrl} variant="outline">
                    📋 Copy URL
                  </Button>
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">
                        <FolderPlus className="mr-2 h-4 w-4" />
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
                <p className="text-xs text-muted-foreground text-center">
                  💡 Right-click ảnh → "Save image as" để tải về
                </p>
              </div>
            ) : result?.state === 'fail' ? (
              <div className="flex flex-col items-center justify-center h-64 text-destructive">
                <p className="text-lg font-medium">Tạo ảnh thất bại</p>
                <p className="text-sm text-muted-foreground">{result.error}</p>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{progress || 'Đang xử lý...'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                <p>Chưa có kết quả</p>
                <p className="text-sm">Upload ảnh và nhập prompt để bắt đầu</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Lịch sử ({history.length})
              </CardTitle>
              <CardDescription>Click để xem lại ảnh đã tạo</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((item) => (
                <div
                  key={item.taskId}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 ${
                    result?.taskId === item.taskId
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleSelectHistory(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.prompt || 'Generated'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <p className="absolute bottom-1 left-1 right-1 text-xs text-white truncate">
                      {item.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Library Quick Access */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderPlus className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Thư viện đã lưu</h3>
                <p className="text-sm text-muted-foreground">
                  Workspace: {workspaceLib.items.length} ảnh • Products: {productLib.items.length}{' '}
                  ảnh
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => (window.location.href = '/admin/library')}>
              Mở Thư Viện
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
