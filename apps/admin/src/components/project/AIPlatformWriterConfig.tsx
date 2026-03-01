/**
 * ✍️ AI Platform Writer Config Dialog
 * Cấu hình AI viết content cho từng platform
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, RotateCcw, Pencil, Copy, RefreshCw, Play, Download, Upload, Loader2, BookOpen } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { supabase } from '@/lib/supabase';
import {
  AIPlatformWriterConfig,
  PLATFORM_WRITER_DEFAULTS,
  PlatformType,
} from '@/types/ai-marketing';
import { PromptTemplatesDialog } from './PromptTemplatesDialog';
import { PromptTemplate } from '@/lib/prompt-templates';

interface AIPlatformWriterConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onConfigSaved?: () => void;
}

const PLATFORM_ICONS: Record<PlatformType, any> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  youtube: FaYoutube,
  threads: SiThreads,
  zalo: () => <span className="font-bold text-blue-600">Z</span>,
};

const PLATFORM_COLORS: Record<PlatformType, string> = {
  facebook: 'text-blue-600',
  instagram: 'text-pink-600',
  tiktok: 'text-black',
  linkedin: 'text-blue-700',
  twitter: 'text-sky-500',
  youtube: 'text-red-600',
  threads: 'text-gray-900',
  zalo: 'text-blue-500',
};

const TONE_STYLES = [
  { value: 'professional', label: 'Chuyên nghiệp' },
  { value: 'friendly', label: 'Thân thiện' },
  { value: 'casual', label: 'Thoải mái' },
  { value: 'playful', label: 'Vui vẻ' },
  { value: 'luxury', label: 'Sang trọng' },
  { value: 'bold', label: 'Mạnh mẽ' },
];

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
];

export function AIPlatformWriterConfigDialog({
  open,
  onOpenChange,
  projectSlug,
  onConfigSaved,
}: AIPlatformWriterConfigDialogProps) {
  const [writers, setWriters] = useState<Record<PlatformType, AIPlatformWriterConfig>>(PLATFORM_WRITER_DEFAULTS);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('facebook');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('tone');
  
  // Custom prompt states
  const [customPrompts, setCustomPrompts] = useState<Record<PlatformType, string>>({} as Record<PlatformType, string>);
  const [useCustomPrompts, setUseCustomPrompts] = useState<Record<PlatformType, boolean>>({} as Record<PlatformType, boolean>);
  
  // Test prompt states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const currentConfig = writers[selectedPlatform];

  // Handle template selection
  const handleSelectTemplate = (template: PromptTemplate) => {
    setCustomPrompts(prev => ({ ...prev, [selectedPlatform]: template.prompt }));
    setUseCustomPrompts(prev => ({ ...prev, [selectedPlatform]: true }));
  };

  // Build platform prompt from config
  const buildPlatformPrompt = (platform: PlatformType, config: AIPlatformWriterConfig): string => {
    const PLATFORM_PROMPTS: Record<PlatformType, string> = {
      facebook: `Bạn là CHUYÊN GIA VIẾT CONTENT FACEBOOK với phong cách ${config.tone.style}.

✍️ YÊU CẦU CONTENT FACEBOOK:
- Độ dài: ${config.content.length === 'short' ? '50-100' : config.content.length === 'medium' ? '150-250' : '300+'} từ
- ${config.content.useEmojis ? `Emoji: ${config.content.emojiDensity}` : 'KHÔNG dùng emoji'}
- Hashtags: ${config.content.hashtagCount} tags
- CTA style: ${config.content.ctaStyle}
- ${config.content.useStoryTelling ? 'Dùng storytelling' : 'Direct approach'}
- Formality: ${config.tone.formality}% (0=casual, 100=formal)
- Creativity: ${config.tone.creativity}%
- Emotion: ${config.tone.emotionLevel}%

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}

Ngôn ngữ: ${config.language === 'vi' ? 'Tiếng Việt' : config.language === 'en' ? 'English' : 'Song ngữ'}`,

      instagram: `Bạn là CHUYÊN GIA VIẾT CAPTION INSTAGRAM với phong cách ${config.tone.style}.

✍️ YÊU CẦU CAPTION INSTAGRAM:
- Caption: ${config.content.length === 'short' ? '50-80' : '100-150'} từ
- ${config.content.useEmojis ? `Emoji NHIỀU: ${config.content.emojiDensity}` : 'Emoji tối thiểu'}
- Hashtags: ${config.content.hashtagCount} hashtags (ĐỂ CUỐI caption)
- Visual-first approach
- Hook mạnh dòng đầu
- Formality: ${config.tone.formality}%

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,

      tiktok: `Bạn là CHUYÊN GIA CONTENT TIKTOK với phong cách ${config.tone.style}.

✍️ YÊU CẦU TIKTOK:
- Caption ngắn: 50-100 từ max
- 🎯 HOOK MẠNH 3 GIÂY ĐẦU
- Gen Z vibe, trendy
- ${config.content.emojiDensity} emoji
- Hashtags trending: ${config.content.hashtagCount}

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,

      linkedin: `Bạn là THOUGHT LEADER LINKEDIN với phong cách ${config.tone.style}.

✍️ YÊU CẦU LINKEDIN:
- Bài dài: 200-400 từ
- Professional tone
- Data-driven insights
- Storytelling chuyên nghiệp
- Hashtags: ${config.content.hashtagCount} (professional tags)

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,

      twitter: `Bạn là CHUYÊN GIA TWITTER/X với phong cách ${config.tone.style}.

✍️ YÊU CẦU:
- MAX 280 ký tự!
- Punch line mạnh
- Hashtags: ${config.content.hashtagCount} max

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,

      youtube: `Bạn là CHUYÊN GIA YOUTUBE với phong cách ${config.tone.style}.

✍️ YÊU CẦU:
- Title SEO-optimized (60 chars max)
- Description đầy đủ (200-500 từ)
- Gợi ý thumbnail
- CTA subscribe + like

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,

      threads: `Bạn là CHUYÊN GIA THREADS với phong cách ${config.tone.style}.

✍️ YÊU CẦU:
- Conversational, authentic
- Reply-bait - kích thích comment
- KHÔNG hashtags
- 100-200 từ max

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,

      zalo: `Bạn là CHUYÊN GIA ZALO OA với phong cách ${config.tone.style}.

✍️ YÊU CẦU ZALO:
- Tiếng Việt thân thiện
- Official Account format
- 100-200 từ
- Emoji vừa phải

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}`,
    };

    return PLATFORM_PROMPTS[platform];
  };

  // Get current prompt (custom or auto-generated)
  const getCurrentPrompt = (): string => {
    if (useCustomPrompts[selectedPlatform] && customPrompts[selectedPlatform]) {
      return customPrompts[selectedPlatform];
    }
    return buildPlatformPrompt(selectedPlatform, currentConfig);
  };

  // Load config on mount
  useEffect(() => {
    if (open && projectSlug) {
      loadConfig();
    }
  }, [open, projectSlug]);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('settings')
        .eq('slug', projectSlug)
        .single();

      if (data?.settings?.ai_config?.writers) {
        setWriters(prev => ({
          ...prev,
          ...data.settings.ai_config.writers,
        }));
      }
      
      // Load custom prompts
      if (data?.settings?.ai_config?.writerPrompts) {
        setCustomPrompts(data.settings.ai_config.writerPrompts);
      }
      if (data?.settings?.ai_config?.useCustomWriterPrompts) {
        setUseCustomPrompts(data.settings.ai_config.useCustomWriterPrompts);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const updateConfig = (updates: Partial<AIPlatformWriterConfig>) => {
    setWriters(prev => ({
      ...prev,
      [selectedPlatform]: {
        ...prev[selectedPlatform],
        ...updates,
      },
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('projects')
        .select('settings')
        .eq('slug', projectSlug)
        .single();

      const newSettings = {
        ...(existing?.settings || {}),
        ai_config: {
          ...(existing?.settings?.ai_config || {}),
          writers,
          writerPrompts: customPrompts,
          useCustomWriterPrompts: useCustomPrompts,
        },
      };

      const { error } = await supabase
        .from('projects')
        .update({
          settings: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', projectSlug);

      if (error) throw error;

      toast.success('Đã lưu cấu hình AI Writers');
      onConfigSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving config:', err);
      toast.error('Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const resetPlatform = () => {
    setWriters(prev => ({
      ...prev,
      [selectedPlatform]: PLATFORM_WRITER_DEFAULTS[selectedPlatform],
    }));
    setCustomPrompts(prev => ({ ...prev, [selectedPlatform]: '' }));
    setUseCustomPrompts(prev => ({ ...prev, [selectedPlatform]: false }));
    toast.info(`Đã reset ${selectedPlatform} về mặc định`);
  };

  // Copy prompt
  const copyPrompt = () => {
    navigator.clipboard.writeText(getCurrentPrompt());
    toast.success('Đã copy prompt!');
  };

  // Regenerate prompt from config
  const regeneratePrompt = () => {
    const newPrompt = buildPlatformPrompt(selectedPlatform, currentConfig);
    setCustomPrompts(prev => ({ ...prev, [selectedPlatform]: newPrompt }));
    toast.info('Đã tạo lại prompt từ config');
  };

  // Test prompt with AI
  const testPrompt = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const prompt = getCurrentPrompt();
      const testMessage = `${prompt}

📋 TEST CAMPAIGN:
- Tên: "Test Campaign"
- Thông điệp: "Sản phẩm tuyệt vời cho cuộc sống của bạn"
- CTA: "Tìm hiểu ngay"

Viết 1 bài mẫu cho platform ${selectedPlatform}.`;

      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          model: currentConfig.model.model,
          maxTokens: currentConfig.model.maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      setTestResult(data.response || data.content || 'Không có kết quả');
      toast.success('Test thành công!');
    } catch (err: any) {
      console.error('Test error:', err);
      toast.error('Lỗi test prompt');
      setTestResult('❌ Lỗi: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  // Export config to JSON
  const exportConfig = () => {
    const exportData = {
      writers,
      customPrompts,
      useCustomPrompts,
      exportedAt: new Date().toISOString(),
      projectSlug,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-writers-config-${projectSlug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã export config!');
  };

  // Import config from JSON
  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.writers) {
          setWriters(prev => ({ ...prev, ...data.writers }));
        }
        if (data.customPrompts) {
          setCustomPrompts(prev => ({ ...prev, ...data.customPrompts }));
        }
        if (data.useCustomPrompts) {
          setUseCustomPrompts(prev => ({ ...prev, ...data.useCustomPrompts }));
        }
        
        toast.success('Import thành công!');
      } catch (err) {
        toast.error('File JSON không hợp lệ');
      }
    };
    input.click();
  };

  const Icon = PLATFORM_ICONS[selectedPlatform];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-500" />
            Cấu hình AI Content Writers
          </DialogTitle>
          <DialogDescription>
            Cấu hình AI viết content riêng cho từng nền tảng
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-[60vh]">
          {/* Platform List */}
          <div className="w-48 space-y-1">
            <Label className="text-xs text-muted-foreground">PLATFORMS</Label>
            {(Object.keys(PLATFORM_WRITER_DEFAULTS) as PlatformType[]).map((platform) => {
              const PIcon = PLATFORM_ICONS[platform];
              const isEnabled = writers[platform]?.enabled;
              return (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedPlatform(platform)}
                >
                  <PIcon className={`h-4 w-4 ${PLATFORM_COLORS[platform]}`} />
                  <span className="capitalize">{platform}</span>
                  {isEnabled && (
                    <Badge variant="outline" className="ml-auto text-xs">ON</Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Config Panel */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Header */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-6 w-6 ${PLATFORM_COLORS[selectedPlatform]}`} />
                      <CardTitle className="capitalize">{selectedPlatform} Writer</CardTitle>
                    </div>
                    <Switch
                      checked={currentConfig.enabled}
                      onCheckedChange={(v) => updateConfig({ enabled: v })}
                    />
                  </div>
                  <CardDescription>
                    {currentConfig.enabled ? 'AI sẽ viết content cho platform này' : 'Đã tắt'}
                  </CardDescription>
                </CardHeader>
              </Card>

              {currentConfig.enabled && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tone">🎨 Tone</TabsTrigger>
                    <TabsTrigger value="content">✍️ Content</TabsTrigger>
                    <TabsTrigger value="advanced">⚙️ Nâng cao</TabsTrigger>
                    <TabsTrigger value="prompt">📝 Prompt</TabsTrigger>
                  </TabsList>

                  {/* Tone Tab */}
                  <TabsContent value="tone" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Phong cách</Label>
                      <Select
                        value={currentConfig.tone.style}
                        onValueChange={(v: any) => updateConfig({
                          tone: { ...currentConfig.tone, style: v },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_STYLES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Formality: {currentConfig.tone.formality}%</Label>
                      <Slider
                        value={[currentConfig.tone.formality]}
                        onValueChange={([v]) => updateConfig({
                          tone: { ...currentConfig.tone, formality: v },
                        })}
                        max={100}
                      />
                      <p className="text-xs text-muted-foreground">0 = Casual, 100 = Formal</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Creativity: {currentConfig.tone.creativity}%</Label>
                      <Slider
                        value={[currentConfig.tone.creativity]}
                        onValueChange={([v]) => updateConfig({
                          tone: { ...currentConfig.tone, creativity: v },
                        })}
                        max={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Emotion Level: {currentConfig.tone.emotionLevel}%</Label>
                      <Slider
                        value={[currentConfig.tone.emotionLevel]}
                        onValueChange={([v]) => updateConfig({
                          tone: { ...currentConfig.tone, emotionLevel: v },
                        })}
                        max={100}
                      />
                    </div>
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Độ dài content</Label>
                      <Select
                        value={currentConfig.content.length}
                        onValueChange={(v: any) => updateConfig({
                          content: { ...currentConfig.content, length: v },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Ngắn (50-100 từ)</SelectItem>
                          <SelectItem value="medium">Trung bình (150-250 từ)</SelectItem>
                          <SelectItem value="long">Dài (300+ từ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Sử dụng Emoji</Label>
                      <Switch
                        checked={currentConfig.content.useEmojis}
                        onCheckedChange={(v) => updateConfig({
                          content: { ...currentConfig.content, useEmojis: v },
                        })}
                      />
                    </div>

                    {currentConfig.content.useEmojis && (
                      <div className="space-y-2">
                        <Label>Mật độ Emoji</Label>
                        <Select
                          value={currentConfig.content.emojiDensity}
                          onValueChange={(v: any) => updateConfig({
                            content: { ...currentConfig.content, emojiDensity: v },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Ít (1-2)</SelectItem>
                            <SelectItem value="moderate">Vừa (3-5)</SelectItem>
                            <SelectItem value="heavy">Nhiều (5+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Số Hashtags: {currentConfig.content.hashtagCount}</Label>
                      <Slider
                        value={[currentConfig.content.hashtagCount]}
                        onValueChange={([v]) => updateConfig({
                          content: { ...currentConfig.content, hashtagCount: v },
                        })}
                        max={30}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Call to Action</Label>
                      <Switch
                        checked={currentConfig.content.includeCallToAction}
                        onCheckedChange={(v) => updateConfig({
                          content: { ...currentConfig.content, includeCallToAction: v },
                        })}
                      />
                    </div>

                    {currentConfig.content.includeCallToAction && (
                      <div className="space-y-2">
                        <Label>CTA Style</Label>
                        <Select
                          value={currentConfig.content.ctaStyle}
                          onValueChange={(v: any) => updateConfig({
                            content: { ...currentConfig.content, ctaStyle: v },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="soft">Nhẹ nhàng</SelectItem>
                            <SelectItem value="direct">Trực tiếp</SelectItem>
                            <SelectItem value="urgent">Khẩn cấp (FOMO)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label>Storytelling</Label>
                      <Switch
                        checked={currentConfig.content.useStoryTelling}
                        onCheckedChange={(v) => updateConfig({
                          content: { ...currentConfig.content, useStoryTelling: v },
                        })}
                      />
                    </div>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>AI Model</Label>
                      <Select
                        value={currentConfig.model.model}
                        onValueChange={(v) => updateConfig({
                          model: { ...currentConfig.model, model: v },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens: {currentConfig.model.maxTokens}</Label>
                      <Slider
                        value={[currentConfig.model.maxTokens]}
                        onValueChange={([v]) => updateConfig({
                          model: { ...currentConfig.model, maxTokens: v },
                        })}
                        min={500}
                        max={4000}
                        step={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ngôn ngữ</Label>
                      <Select
                        value={currentConfig.language}
                        onValueChange={(v: any) => updateConfig({ language: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="both">Song ngữ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Hướng dẫn tùy chỉnh</Label>
                      <Textarea
                        value={currentConfig.customInstructions}
                        onChange={(e) => updateConfig({ customInstructions: e.target.value })}
                        placeholder={`Hướng dẫn đặc biệt cho AI viết ${selectedPlatform}...`}
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  {/* Prompt Tab - NEW */}
                  <TabsContent value="prompt" className="space-y-4 mt-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-blue-300">
                        💡 <strong>Prompt Preview:</strong> Xem và chỉnh sửa prompt cho <span className="capitalize font-bold">{selectedPlatform}</span>.
                        Có thể paste prompt từ nơi khác hoặc test trực tiếp.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Sử dụng Custom Prompt</Label>
                        <p className="text-xs text-muted-foreground">
                          Bật để dùng prompt tùy chỉnh cho {selectedPlatform}
                        </p>
                      </div>
                      <Switch
                        checked={useCustomPrompts[selectedPlatform] || false}
                        onCheckedChange={(v) => setUseCustomPrompts(prev => ({ ...prev, [selectedPlatform]: v }))}
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={copyPrompt}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regeneratePrompt}
                        disabled={!useCustomPrompts[selectedPlatform]}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tạo lại
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplates(true)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Templates
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={testPrompt}
                        disabled={testing}
                      >
                        {testing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                    </div>

                    {useCustomPrompts[selectedPlatform] ? (
                      <div className="space-y-2">
                        <Label>Custom Prompt cho {selectedPlatform}</Label>
                        <Textarea
                          value={customPrompts[selectedPlatform] || ''}
                          onChange={(e) => setCustomPrompts(prev => ({ ...prev, [selectedPlatform]: e.target.value }))}
                          placeholder="Paste hoặc viết prompt của bạn tại đây..."
                          rows={10}
                          className="font-mono text-sm bg-slate-950 border-slate-700"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Auto-Generated Prompt (chỉ xem)</Label>
                        <div className="relative">
                          <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap text-slate-300 max-h-[200px] overflow-auto">
                            {getCurrentPrompt()}
                          </pre>
                          <Badge variant="outline" className="absolute top-2 right-2 bg-slate-900">
                            Read-only
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Test Result */}
                    {testResult && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          🧪 Kết quả Test
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {currentConfig.model.model}
                          </Badge>
                        </Label>
                        <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-4 max-h-[200px] overflow-auto">
                          <pre className="text-sm whitespace-pre-wrap text-green-200">
                            {testResult}
                          </pre>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <div className="flex gap-2 mr-auto">
            <Button variant="ghost" size="sm" onClick={importConfig}>
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="ghost" size="sm" onClick={exportConfig}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          <Button variant="outline" onClick={resetPlatform}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset {selectedPlatform}
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </Button>
        </DialogFooter>

        {/* Templates Dialog */}
        <PromptTemplatesDialog
          open={showTemplates}
          onOpenChange={setShowTemplates}
          category={selectedPlatform}
          onSelectTemplate={handleSelectTemplate}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AIPlatformWriterConfigDialog;
