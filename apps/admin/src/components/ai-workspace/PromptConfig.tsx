/**
 * ⚙️ PromptConfig - System Prompt & Parameters Configuration
 *
 * Allows users to customize:
 * - System prompt (persona/instructions)
 * - Temperature (creativity level)
 * - Max tokens (response length)
 * - Top P (nucleus sampling)
 * - Presence/Frequency penalty
 * - Stop sequences
 */

import React, { useState, useEffect } from 'react';
import {
  Settings2,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Thermometer,
  Hash,
  Sliders,
  FileText,
  AlertCircle,
  Wand2,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

// =============================================================================
// TYPES & CONFIG
// =============================================================================

export interface PromptSettings {
  // Core
  systemPrompt: string;

  // Generation params
  temperature: number;
  maxTokens: number;
  topP: number;

  // Penalties
  presencePenalty: number;
  frequencyPenalty: number;

  // Advanced
  stopSequences: string[];
  responseFormat: 'text' | 'json' | 'markdown';

  // Features
  enableStreaming: boolean;
  enableMemory: boolean;
  enableWebSearch: boolean;
}

export const DEFAULT_SETTINGS: PromptSettings = {
  systemPrompt: `Bạn là trợ lý AI thông minh, thân thiện và hữu ích. 

Nguyên tắc:
- Trả lời bằng tiếng Việt tự nhiên
- Giải thích rõ ràng, dễ hiểu
- Đưa ra ví dụ cụ thể khi cần
- Thừa nhận khi không biết
- Tôn trọng và lịch sự`,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
  stopSequences: [],
  responseFormat: 'markdown',
  enableStreaming: true,
  enableMemory: true,
  enableWebSearch: false,
};

// Preset prompts
export const PROMPT_PRESETS = [
  {
    id: 'default',
    name: '🤖 Mặc định',
    description: 'Trợ lý đa năng, thân thiện',
    settings: { ...DEFAULT_SETTINGS },
  },
  {
    id: 'coder',
    name: '💻 Lập trình viên',
    description: 'Chuyên gia code, debug, architecture',
    settings: {
      ...DEFAULT_SETTINGS,
      systemPrompt: `Bạn là Senior Software Engineer với 15+ năm kinh nghiệm.

Chuyên môn:
- Full-stack: React, Node.js, TypeScript, Python
- DevOps: Docker, K8s, CI/CD
- Database: PostgreSQL, MongoDB, Redis
- Cloud: AWS, GCP, Azure

Phong cách:
- Code clean, có comment rõ ràng
- Giải thích từng bước
- Đề xuất best practices
- Review và optimize code
- Luôn xem xét security & performance`,
      temperature: 0.3,
      responseFormat: 'markdown',
    },
  },
  {
    id: 'writer',
    name: '✍️ Nhà văn',
    description: 'Sáng tạo nội dung, copywriting',
    settings: {
      ...DEFAULT_SETTINGS,
      systemPrompt: `Bạn là Content Writer chuyên nghiệp.

Kỹ năng:
- Viết blog, bài báo, content marketing
- Copywriting cho quảng cáo, landing page
- SEO content với keywords tự nhiên
- Storytelling hấp dẫn

Phong cách:
- Ngôn ngữ sinh động, cuốn hút
- Cấu trúc rõ ràng, dễ đọc
- Phù hợp với đối tượng target
- Tối ưu cho đọc online (scannable)`,
      temperature: 0.8,
      maxTokens: 8192,
    },
  },
  {
    id: 'analyst',
    name: '📊 Phân tích',
    description: 'Data analysis, business intelligence',
    settings: {
      ...DEFAULT_SETTINGS,
      systemPrompt: `Bạn là Data Analyst chuyên nghiệp.

Chuyên môn:
- Phân tích dữ liệu, thống kê
- Business Intelligence
- Data visualization
- Financial modeling

Phong cách:
- Logic, chính xác với số liệu
- Insights actionable
- Visualize data khi cần
- So sánh, benchmark
- Đề xuất dựa trên evidence`,
      temperature: 0.4,
      responseFormat: 'markdown',
    },
  },
  {
    id: 'tutor',
    name: '👨‍🏫 Gia sư',
    description: 'Dạy học, giải thích khái niệm',
    settings: {
      ...DEFAULT_SETTINGS,
      systemPrompt: `Bạn là Gia sư AI kiên nhẫn và tận tâm.

Phương pháp:
- Giải thích từ cơ bản đến nâng cao
- Dùng ví dụ thực tế, dễ hiểu
- Hỏi để kiểm tra hiểu biết
- Khuyến khích học viên suy nghĩ
- Khen ngợi khi làm đúng

Nguyên tắc:
- Không đưa đáp án ngay
- Gợi ý từng bước
- Điều chỉnh theo level của học viên
- Tạo bài tập thực hành`,
      temperature: 0.6,
      presencePenalty: 0.1,
    },
  },
  {
    id: 'researcher',
    name: '🔬 Nghiên cứu',
    description: 'Research, fact-checking, citations',
    settings: {
      ...DEFAULT_SETTINGS,
      systemPrompt: `Bạn là Research Assistant chuyên nghiệp.

Nhiệm vụ:
- Tìm kiếm và tổng hợp thông tin
- Fact-checking với nguồn đáng tin
- Trích dẫn và reference
- So sánh các nguồn khác nhau

Tiêu chuẩn:
- Khách quan, không bias
- Ghi rõ nguồn khi có thể
- Phân biệt fact vs opinion
- Đề cập limitations
- Cập nhật thông tin mới nhất`,
      temperature: 0.3,
      enableWebSearch: true,
    },
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

interface PromptConfigProps {
  settings: PromptSettings;
  onSettingsChange: (settings: PromptSettings) => void;
  compact?: boolean;
  className?: string;
}

export function PromptConfig({
  settings,
  onSettingsChange,
  compact = false,
  className,
}: Readonly<PromptConfigProps>) {
  const [localSettings, setLocalSettings] = useState<PromptSettings>(settings);
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync with external settings
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PROMPT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setLocalSettings(preset.settings);
    }
  };

  const updateSetting = <K extends keyof PromptSettings>(key: K, value: PromptSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Trigger button
  const TriggerButton = compact ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('h-8 w-8', className)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cấu hình Prompt</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Button variant="outline" className={cn('gap-2', className)}>
      <Settings2 className="h-4 w-4" />
      Cấu hình
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{TriggerButton}</SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Cấu hình AI
          </SheetTitle>
          <SheetDescription>Tùy chỉnh system prompt và các tham số generation</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-4 pr-4">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prompt" className="gap-1">
                <FileText className="h-3.5 w-3.5" />
                Prompt
              </TabsTrigger>
              <TabsTrigger value="params" className="gap-1">
                <Sliders className="h-3.5 w-3.5" />
                Params
              </TabsTrigger>
              <TabsTrigger value="presets" className="gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Presets
              </TabsTrigger>
            </TabsList>

            {/* PROMPT TAB */}
            <TabsContent value="prompt" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  System Prompt
                </Label>
                <Textarea
                  value={localSettings.systemPrompt}
                  onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                  placeholder="Nhập system prompt..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Đây là prompt định hình tính cách và hành vi của AI
                </p>
              </div>

              {/* Quick toggles */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Tính năng</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Streaming</Label>
                    <p className="text-xs text-muted-foreground">Hiện response từng chữ</p>
                  </div>
                  <Switch
                    checked={localSettings.enableStreaming}
                    onCheckedChange={(v) => updateSetting('enableStreaming', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Bộ nhớ</Label>
                    <p className="text-xs text-muted-foreground">Nhớ context cuộc trò chuyện</p>
                  </div>
                  <Switch
                    checked={localSettings.enableMemory}
                    onCheckedChange={(v) => updateSetting('enableMemory', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm flex items-center gap-1">
                      Web Search
                      <Badge variant="outline" className="text-[10px]">
                        Beta
                      </Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">Tìm kiếm thông tin real-time</p>
                  </div>
                  <Switch
                    checked={localSettings.enableWebSearch}
                    onCheckedChange={(v) => updateSetting('enableWebSearch', v)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* PARAMS TAB */}
            <TabsContent value="params" className="space-y-6 mt-4">
              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature
                  </Label>
                  <Badge variant="secondary">{localSettings.temperature}</Badge>
                </div>
                <Slider
                  value={[localSettings.temperature]}
                  onValueChange={([v]) => updateSetting('temperature', v)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Chính xác (0)</span>
                  <span>Cân bằng (0.7)</span>
                  <span>Sáng tạo (2)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Max Tokens
                  </Label>
                  <Badge variant="secondary">{localSettings.maxTokens.toLocaleString()}</Badge>
                </div>
                <Slider
                  value={[localSettings.maxTokens]}
                  onValueChange={([v]) => updateSetting('maxTokens', v)}
                  min={256}
                  max={16384}
                  step={256}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Ngắn (256)</span>
                  <span>Dài (16K)</span>
                </div>
              </div>

              {/* Response Format */}
              <div className="space-y-2">
                <Label>Response Format</Label>
                <Select
                  value={localSettings.responseFormat}
                  onValueChange={(v) =>
                    updateSetting('responseFormat', v as PromptSettings['responseFormat'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Tham số nâng cao
                    </span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {/* Top P */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Top P (Nucleus Sampling)</Label>
                      <Badge variant="outline">{localSettings.topP}</Badge>
                    </div>
                    <Slider
                      value={[localSettings.topP]}
                      onValueChange={([v]) => updateSetting('topP', v)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>

                  {/* Presence Penalty */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Presence Penalty</Label>
                      <Badge variant="outline">{localSettings.presencePenalty}</Badge>
                    </div>
                    <Slider
                      value={[localSettings.presencePenalty]}
                      onValueChange={([v]) => updateSetting('presencePenalty', v)}
                      min={-2}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">Cao hơn = đa dạng chủ đề hơn</p>
                  </div>

                  {/* Frequency Penalty */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Frequency Penalty</Label>
                      <Badge variant="outline">{localSettings.frequencyPenalty}</Badge>
                    </div>
                    <Slider
                      value={[localSettings.frequencyPenalty]}
                      onValueChange={([v]) => updateSetting('frequencyPenalty', v)}
                      min={-2}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">Cao hơn = ít lặp từ hơn</p>
                  </div>

                  {/* Stop Sequences */}
                  <div className="space-y-2">
                    <Label>Stop Sequences</Label>
                    <Input
                      placeholder="Nhập các chuỗi stop, phân cách bằng dấu phẩy"
                      value={localSettings.stopSequences.join(', ')}
                      onChange={(e) =>
                        updateSetting(
                          'stopSequences',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      AI sẽ dừng khi gặp các chuỗi này
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            {/* PRESETS TAB */}
            <TabsContent value="presets" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">Chọn preset để áp dụng nhanh cấu hình</p>

              {PROMPT_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  className={cn(
                    'w-full justify-start h-auto py-3 px-4',
                    localSettings.systemPrompt === preset.settings.systemPrompt &&
                      'border-primary bg-primary/5'
                  )}
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </div>
                </Button>
              ))}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Preset sẽ ghi đè toàn bộ cấu hình hiện tại
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <SheetFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Lưu cấu hình
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default PromptConfig;
