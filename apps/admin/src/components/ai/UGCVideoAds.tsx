/**
 * UGC Video Ads Generator Component
 * Tạo video quảng cáo UGC từ ảnh sản phẩm
 * Sử dụng Kie.AI trực tiếp (Veo 3.1, Sora 2)
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Upload, Video, Download, Loader2, Image as ImageIcon,
  RefreshCw, Play, Pause, Settings2, Sparkles, Film,
  User, Package, Lightbulb, MapPin, Wand2, CheckCircle,
  XCircle, Clock, ExternalLink, Copy, Info, AlertTriangle,
  Zap, Target, Users, Sliders
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import type { MediaItem } from '@/hooks/library/types';
import { 
  createUGCVideoAd, 
  type VideoModel, 
  type UGCVideoInput,
  type AISettings,
} from '@/lib/api/kie-video-service';

const IMGBB_API_KEY = '2c3d34ab82d9b3b679cc9303087a7769';
const STORAGE_KEY = 'ugc-video-ads-history';
const SETTINGS_KEY = 'ugc-video-ads-settings';

// AI Models for prompt enhancement
const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Nhanh, tiết kiệm chi phí' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Chất lượng cao nhất' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Cân bằng tốc độ/chất lượng' },
];

// Default AI Settings
const DEFAULT_AI_SETTINGS = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 300,
  systemPrompt: `You are an expert UGC video creator. Generate detailed, realistic video prompts for selfie-style product videos.
Focus on: natural lighting, authentic feel, ICP persona, product visibility, casual dialogue.
Output ONLY the video prompt, nothing else.`,
};

// Model configurations  
const UGC_MODELS = [
  {
    id: 'veo3' as VideoModel,
    name: '🎬 Veo 3.1',
    description: 'Video trực tiếp từ ảnh sản phẩm, 8 giây',
    features: ['Nhanh', 'Chất lượng cao', '9:16 vertical'],
    recommended: true,
    duration: '8s',
    steps: 1,
  },
  {
    id: 'sora2' as VideoModel,
    name: '🌟 Sora 2',
    description: 'OpenAI Sora 2, video 10 giây',
    features: ['OpenAI', '10 giây', 'Sáng tạo'],
    recommended: false,
    duration: '10s',
    steps: 1,
  },
];

// ICP Presets
const ICP_PRESETS = [
  { id: 'young-woman', label: 'Phụ nữ trẻ 20-30', value: 'Young woman, 20-30 years old, casual attire, friendly smile' },
  { id: 'young-man', label: 'Nam giới trẻ 20-30', value: 'Young man, 20-30 years old, casual style, confident look' },
  { id: 'professional', label: 'Chuyên gia/Office', value: 'Professional adult, 30-40 years old, business casual, trustworthy appearance' },
  { id: 'fitness', label: 'Fitness/Gym', value: 'Fitness enthusiast, athletic build, sportswear, energetic personality' },
  { id: 'mother', label: 'Mẹ bỉm sữa', value: 'Young mother, 25-35 years old, warm and caring, home environment' },
  { id: 'student', label: 'Sinh viên', value: 'College student, 18-24 years old, casual trendy style, youthful energy' },
];

// Video Setting Presets
const SETTING_PRESETS = [
  { id: 'kitchen', label: '🍳 Nhà bếp', value: 'Modern bright kitchen, natural morning light, cozy home atmosphere' },
  { id: 'bedroom', label: '🛏️ Phòng ngủ', value: 'Cozy bedroom, soft natural light, relaxed home setting' },
  { id: 'bathroom', label: '🚿 Phòng tắm', value: 'Clean modern bathroom, bright lighting, fresh atmosphere' },
  { id: 'office', label: '💼 Văn phòng', value: 'Modern office space, professional environment, good lighting' },
  { id: 'gym', label: '🏋️ Phòng gym', value: 'Fitness gym, workout equipment, energetic atmosphere' },
  { id: 'outdoor', label: '🌳 Ngoài trời', value: 'Beautiful outdoor setting, natural sunlight, fresh environment' },
  { id: 'car', label: '🚗 Trong xe', value: 'Inside car, natural daylight through window, casual setting' },
  { id: 'cafe', label: '☕ Quán cafe', value: 'Cozy cafe, warm ambient lighting, relaxed atmosphere' },
];

// Result type
interface UGCResult {
  id: string;
  request: UGCVideoInput;
  status: 'pending' | 'processing' | 'success' | 'failed';
  videoUrl?: string;
  imageUrl?: string;
  prompt?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// Settings type
interface UGCSettings {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// Load/Save history
const loadHistory = (): UGCResult[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveHistory = (items: UGCResult[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
};

// Load/Save settings
const loadSettings = (): Partial<UGCSettings> => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const saveSettings = (settings: UGCSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

interface UGCVideoAdsProps {
  selectedLibraryImage?: MediaItem;
}

export function UGCVideoAds({ selectedLibraryImage }: UGCVideoAdsProps) {
  // Load saved settings
  const savedSettings = loadSettings();
  
  // Form state
  const [product, setProduct] = useState('');
  const [productPhoto, setProductPhoto] = useState('');
  const [icp, setIcp] = useState('');
  const [productFeatures, setProductFeatures] = useState('');
  const [videoSetting, setVideoSetting] = useState('');
  const [selectedModel, setSelectedModel] = useState<VideoModel>('veo3');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<UGCResult | null>(null);
  const [history, setHistory] = useState<UGCResult[]>(() => loadHistory());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // AI Settings for prompt enhancement
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiModel, setAiModel] = useState(savedSettings.aiModel || DEFAULT_AI_SETTINGS.model);
  const [temperature, setTemperature] = useState(savedSettings.temperature ?? DEFAULT_AI_SETTINGS.temperature);
  const [maxTokens, setMaxTokens] = useState(savedSettings.maxTokens || DEFAULT_AI_SETTINGS.maxTokens);
  const [systemPrompt, setSystemPrompt] = useState(savedSettings.systemPrompt || DEFAULT_AI_SETTINGS.systemPrompt);

  // Auto-save settings when they change
  useEffect(() => {
    saveSettings({ aiModel, temperature, maxTokens, systemPrompt });
  }, [aiModel, temperature, maxTokens, systemPrompt]);

  // Update preview when library image is selected
  useEffect(() => {
    if (selectedLibraryImage) {
      setProductPhoto(selectedLibraryImage.url);
      setPreviewUrl(selectedLibraryImage.url);
    }
  }, [selectedLibraryImage]);

  // Upload to imgbb
  const uploadToImgbb = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.data.url;
  };

  // Handle file upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }

    // Show preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Upload to imgbb
    try {
      toast.loading('Đang upload ảnh...');
      const url = await uploadToImgbb(file);
      setProductPhoto(url);
      toast.dismiss();
      toast.success('Upload ảnh thành công!');
    } catch (error) {
      toast.dismiss();
      toast.error('Upload ảnh thất bại');
      console.error(error);
    }
  }, []);

  // Generate video - gọi trực tiếp Kie.AI
  const handleGenerate = useCallback(async () => {
    // Validation
    if (!product.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm!');
      return;
    }
    if (!productPhoto) {
      toast.error('Vui lòng upload ảnh sản phẩm!');
      return;
    }
    if (!icp.trim()) {
      toast.error('Vui lòng mô tả khách hàng mục tiêu (ICP)!');
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setProgressText('Đang khởi tạo...');

    const input: UGCVideoInput = {
      product,
      productPhoto,
      icp,
      productFeatures,
      videoSetting,
      model: selectedModel,
    };

    const newResult: UGCResult = {
      id: `ugc_${Date.now()}`,
      request: input,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    setResult(newResult);

    try {
      // Chuẩn bị AI settings
      const currentAISettings: AISettings = {
        model: aiModel,
        temperature,
        maxTokens,
        systemPrompt,
      };

      // Gọi trực tiếp Kie.AI (AI tạo prompt → Kie.AI tạo video)
      const response = await createUGCVideoAd(input, (status) => {
        setProgressText(status);
        if (status.includes('prompt')) setProgress(30);
        else if (status.includes('video')) setProgress(50);
        else if (status.includes('xử lý')) setProgress(70);
      }, currentAISettings);

      if (response.success && response.videoUrl) {
        newResult.status = 'success';
        newResult.videoUrl = response.videoUrl;
        newResult.prompt = response.prompt;
        newResult.completedAt = new Date().toISOString();
        setProgress(100);
        setProgressText('Hoàn thành!');
        toast.success('🎬 Video đã tạo thành công!');
      } else {
        throw new Error(response.error || 'Video generation failed');
      }
    } catch (error) {
      console.error('[UGC] Generation failed:', error);
      newResult.status = 'failed';
      newResult.error = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Tạo video thất bại: ${newResult.error}`);
    } finally {
      setResult(newResult);
      setHistory(prev => {
        const updated = [newResult, ...prev].slice(0, 20);
        saveHistory(updated);
        return updated;
      });
      setIsGenerating(false);
    }
  }, [product, productPhoto, icp, productFeatures, videoSetting, selectedModel, aiModel, temperature, maxTokens, systemPrompt]);

  // Reset AI Settings
  const resetAISettings = useCallback(() => {
    setAiModel(DEFAULT_AI_SETTINGS.model);
    setTemperature(DEFAULT_AI_SETTINGS.temperature);
    setMaxTokens(DEFAULT_AI_SETTINGS.maxTokens);
    setSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt);
    toast.success('Đã reset cài đặt AI!');
  }, []);

  // Copy video URL
  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã copy URL!');
  }, []);

  // Apply preset
  const applyIcpPreset = (value: string) => setIcp(value);
  const applySettingPreset = (value: string) => setVideoSetting(value);

  const selectedModelInfo = UGC_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Film className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">UGC Video Ads</h2>
              <p className="text-sm text-muted-foreground">
                Tạo video quảng cáo UGC tự động với AI
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Chọn Model AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {UGC_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedModel === model.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    {model.recommended && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500">
                        Recommended
                      </Badge>
                    )}
                    <div className="font-medium mb-1">{model.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {model.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {model.duration}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {model.steps} bước
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Settings - Collapsible */}
          <Collapsible open={showAISettings} onOpenChange={setShowAISettings}>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Cài đặt AI Nâng cấp Prompt
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      <Sliders className="h-4 w-4 mr-1" />
                      {showAISettings ? 'Thu gọn' : 'Mở rộng'}
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CardDescription>
                  Tùy chỉnh AI để tạo prompt video tốt hơn
                </CardDescription>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {/* AI Model */}
                  <div className="space-y-2">
                    <Label>Model AI</Label>
                    <Select value={aiModel} onValueChange={setAiModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <span>{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                - {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Temperature</Label>
                      <span className="text-sm text-muted-foreground">
                        {temperature.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={(v) => setTemperature(v[0])}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cao hơn = sáng tạo hơn, thấp hơn = nhất quán hơn
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Max Tokens</Label>
                      <span className="text-sm text-muted-foreground">
                        {maxTokens}
                      </span>
                    </div>
                    <Slider
                      value={[maxTokens]}
                      onValueChange={(v) => setMaxTokens(v[0])}
                      min={100}
                      max={1000}
                      step={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      Độ dài tối đa của prompt được tạo
                    </p>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={4}
                      placeholder="Hướng dẫn AI cách tạo prompt..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Tùy chỉnh cách AI tạo video prompt
                    </p>
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAISettings}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset về mặc định
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Product Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Thông tin sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Photo */}
              <div className="space-y-2">
                <Label>Ảnh sản phẩm *</Label>
                <div className="flex gap-4">
                  <div className="relative w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden flex items-center justify-center bg-muted/50">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload ảnh</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Hoặc nhập URL</Label>
                    <Input
                      placeholder="https://example.com/product.jpg"
                      value={productPhoto}
                      onChange={(e) => {
                        setProductPhoto(e.target.value);
                        setPreviewUrl(e.target.value);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Kéo ảnh từ Library bên trái vào đây
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <Label>Tên sản phẩm *</Label>
                <Input
                  placeholder="VD: Serum dưỡng da Vitamin C"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              {/* Product Features */}
              <div className="space-y-2">
                <Label>Đặc điểm nổi bật</Label>
                <Textarea
                  placeholder="VD: Làm sáng da, chống lão hóa, thành phần tự nhiên..."
                  value={productFeatures}
                  onChange={(e) => setProductFeatures(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Khách hàng mục tiêu (ICP) *
              </CardTitle>
              <CardDescription>
                Mô tả người sẽ xuất hiện trong video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ICP_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => applyIcpPreset(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="VD: Phụ nữ trẻ 25-35 tuổi, năng động, quan tâm đến skincare..."
                value={icp}
                onChange={(e) => setIcp(e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Video Setting */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bối cảnh video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SETTING_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => applySettingPreset(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="VD: Trong phòng tắm sáng sủa, ánh sáng tự nhiên..."
                value={videoSetting}
                onChange={(e) => setVideoSetting(e.target.value)}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full h-12 text-lg"
            disabled={isGenerating || !product || !productPhoto || !icp}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tạo video...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Tạo Video UGC
              </>
            )}
          </Button>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{progressText}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">
                    Model: {selectedModelInfo?.name} • {selectedModelInfo?.steps === 2 ? 'Đang tạo ảnh UGC → Video' : 'Đang tạo video'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && result.status !== 'processing' && (
            <Card className={result.status === 'success' ? 'border-green-500' : 'border-red-500'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {result.status === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Video đã sẵn sàng!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      Tạo video thất bại
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.status === 'success' && result.videoUrl ? (
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="relative aspect-[9/16] max-w-xs mx-auto bg-black rounded-lg overflow-hidden">
                      <video
                        src={result.videoUrl}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay={isPlaying}
                        loop
                      />
                    </div>

                    {/* UGC Image (for Nano+Veo) */}
                    {result.imageUrl && (
                      <div className="space-y-2">
                        <Label className="text-sm">Ảnh UGC (NanoBanana)</Label>
                        <img
                          src={result.imageUrl}
                          alt="UGC"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(result.videoUrl!)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={result.videoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Mở tab mới
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={result.videoUrl} download>
                          <Download className="h-4 w-4 mr-1" />
                          Tải xuống
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                    <p className="text-sm text-red-500">{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Lịch sử ({history.length})
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30"
                    >
                      <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                        {item.videoUrl ? (
                          <video src={item.videoUrl} className="w-full h-full object-cover" />
                        ) : item.request.productPhoto ? (
                          <img src={item.request.productPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.request.product}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.request.model} • {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.status === 'success' ? 'default' :
                          item.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {item.status === 'success' ? 'Thành công' :
                         item.status === 'failed' ? 'Thất bại' :
                         item.status === 'processing' ? 'Đang xử lý' : 'Chờ'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Info */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-300">Về UGC Video Ads</p>
                  <ul className="text-blue-600 dark:text-blue-400 space-y-1 text-xs">
                    <li>• Video được tạo tự động với AI (Veo/Sora)</li>
                    <li>• Định dạng 9:16 tối ưu cho TikTok/Reels/Shorts</li>
                    <li>• Người trong video nói về sản phẩm một cách tự nhiên</li>
                    <li>• Thời gian tạo: 1-5 phút tùy model</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
