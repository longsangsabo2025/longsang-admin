import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sliders, Wand2, Sparkles, Loader2, RefreshCw,
  Settings2, Clock, Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { AI_MODELS, MOTION_PRESETS } from './constants';

interface VideoSettingsPanelProps {
  // AI Settings
  showAISettings: boolean;
  onShowAISettingsChange: (open: boolean) => void;
  aiModel: string;
  onAiModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  maxTokens: number;
  onMaxTokensChange: (tokens: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onResetAISettings: () => void;

  // Prompt
  prompt: string;
  onPromptChange: (prompt: string) => void;
  isEnhancing: boolean;
  onEnhancePrompt: () => void;
  motionPreset: string;
  onMotionPresetChange: (preset: string) => void;

  // Video Settings
  showSettings: boolean;
  onShowSettingsChange: (open: boolean) => void;
  selectedModel: string;
  duration: number;
  onDurationChange: (d: number) => void;
  quality: string;
  onQualityChange: (q: string) => void;
  veoModel: string;
  onVeoModelChange: (m: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
}

export function VideoSettingsPanel({
  showAISettings, onShowAISettingsChange,
  aiModel, onAiModelChange,
  temperature, onTemperatureChange,
  maxTokens, onMaxTokensChange,
  systemPrompt, onSystemPromptChange,
  onResetAISettings,
  prompt, onPromptChange,
  isEnhancing, onEnhancePrompt,
  motionPreset, onMotionPresetChange,
  showSettings, onShowSettingsChange,
  selectedModel,
  duration, onDurationChange,
  quality, onQualityChange,
  veoModel, onVeoModelChange,
  aspectRatio, onAspectRatioChange,
}: VideoSettingsPanelProps) {
  return (
    <>
      {/* AI Settings for Prompt Enhancement */}
      <Collapsible open={showAISettings} onOpenChange={onShowAISettingsChange}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Cài đặt AI Nâng cấp
            </span>
            <Badge variant="secondary">
              {AI_MODELS.find(m => m.id === aiModel)?.name || aiModel}
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              AI Model
            </Label>
            <Select value={aiModel} onValueChange={onAiModelChange}>
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
              onValueChange={(v) => onTemperatureChange(v[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              0 = Chính xác, 1 = Sáng tạo cao
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Độ dài tối đa (Tokens)</Label>
              <span className="text-sm text-muted-foreground">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={(v) => onMaxTokensChange(v[0])}
              min={200}
              max={1000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Video prompt chi tiết nên dùng 500-800 tokens
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label>System Prompt (tùy chỉnh)</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="Hướng dẫn AI cách tạo prompt..."
              rows={5}
              className="text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Tùy chỉnh cách AI nâng cấp prompt của bạn
            </p>
          </div>

          {/* Auto-save notice */}
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md">
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✓ Tự động lưu
            </Badge>
            <span className="text-xs text-muted-foreground">
              Cài đặt được lưu tự động khi bạn thay đổi
            </span>
          </div>

          {/* Reset to defaults */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAISettings}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset mặc định
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Prompt Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Mô tả chuyển động
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
            >
              {isEnhancing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Nâng cấp AI
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Mô tả video bạn muốn tạo... VD: Sản phẩm xoay 360 độ, camera zoom vào chi tiết, ánh sáng lung linh..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
          />

          {/* Motion Presets */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Kiểu chuyển động
            </Label>
            <Select value={motionPreset} onValueChange={onMotionPresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn kiểu chuyển động" />
              </SelectTrigger>
              <SelectContent>
                {MOTION_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Video Settings */}
      <Collapsible open={showSettings} onOpenChange={onShowSettingsChange}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Cài đặt Video
                <Badge variant="outline" className="ml-auto">
                  {showSettings ? 'Thu gọn' : 'Mở rộng'}
                </Badge>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {selectedModel === 'runway' ? (
                <>
                  {/* Duration */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Thời lượng: {duration}s
                    </Label>
                    <div className="flex gap-2">
                      {[5, 10].map((d) => (
                        <Button
                          key={d}
                          variant={duration === d ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onDurationChange(d)}
                        >
                          {d} giây
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-2">
                      <Film className="h-3 w-3" />
                      Chất lượng
                    </Label>
                    <Select value={quality} onValueChange={onQualityChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p - Nhanh hơn</SelectItem>
                        <SelectItem value="1080p">1080p - HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  {/* Veo Model Variant */}
                  <div className="space-y-2">
                    <Label className="text-xs">Model Variant</Label>
                    <Select value={veoModel} onValueChange={onVeoModelChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="veo3_fast">Veo3 Fast - Nhanh</SelectItem>
                        <SelectItem value="veo3">Veo3 - Chất lượng cao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-2">
                    <Label className="text-xs">Tỷ lệ khung hình</Label>
                    <div className="flex gap-2">
                      {['16:9', '9:16', '1:1'].map((ratio) => (
                        <Button
                          key={ratio}
                          variant={aspectRatio === ratio ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            onAspectRatioChange(ratio);
                            if (ratio === '1:1') {
                              toast.info('⚠️ Veo3 có thể không hỗ trợ tốt tỷ lệ 1:1, kết quả có thể là 16:9');
                            }
                          }}
                        >
                          {ratio}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}
