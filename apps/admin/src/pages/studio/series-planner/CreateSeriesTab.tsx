import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Sparkles,
  Brain,
  Sliders,
  RefreshCw,
  Clapperboard,
  Maximize2,
} from 'lucide-react';
import { AI_MODELS, DEFAULT_AI_SETTINGS } from './shared';

export interface CreateSeriesTabProps {
  theme: string;
  setTheme: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  character: string;
  setCharacter: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  episodeCount: number;
  setEpisodeCount: (v: number) => void;
  isGenerating: boolean;
  generationStep: string;
  onGenerateSeries: () => void;
  showAISettings: boolean;
  setShowAISettings: (v: boolean) => void;
  aiModel: string;
  setAiModel: (v: string) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  maxTokens: number;
  setMaxTokens: (v: number) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  onShowPromptDialog: () => void;
  onResetAISettings: () => void;
}

export function CreateSeriesTab({
  theme, setTheme,
  location, setLocation,
  character, setCharacter,
  tone, setTone,
  episodeCount, setEpisodeCount,
  isGenerating, generationStep,
  onGenerateSeries,
  showAISettings, setShowAISettings,
  aiModel, setAiModel,
  temperature, setTemperature,
  maxTokens, setMaxTokens,
  systemPrompt, setSystemPrompt,
  onShowPromptDialog,
  onResetAISettings,
}: CreateSeriesTabProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Clapperboard className="h-7 w-7 text-purple-500" />
          Tạo Series Mới
        </h2>
        <p className="text-muted-foreground mt-2">
          AI sẽ tạo kịch bản cho cả series video có mạch truyện xuyên suốt
        </p>
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Series Concept
          </CardTitle>
          <CardDescription>
            Mô tả ý tưởng chính cho series của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme / Chủ đề chính *</Label>
            <Textarea
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="VD: Hành trình từ newbie đến master billiard tại SABO, với những bài học bida hài hước và tips pro..."
              rows={3}
            />
          </div>

          {/* Grid for other fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Địa điểm</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="SABO Billiards"
              />
            </div>
            <div className="space-y-2">
              <Label>Nhân vật chính</Label>
              <Input
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="Anh Long Magic"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone & Style</Label>
              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Hài hước, storytelling"
              />
            </div>
            <div className="space-y-2">
              <Label>Số tập: {episodeCount}</Label>
              <Slider
                value={[episodeCount]}
                onValueChange={(v) => setEpisodeCount(v[0])}
                min={3}
                max={15}
                step={1}
                className="mt-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Collapsible open={showAISettings} onOpenChange={setShowAISettings}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Cài đặt AI
            </span>
            <Badge variant="secondary">
              {AI_MODELS.find(m => m.id === aiModel)?.name || aiModel}
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          <div className="p-4 border rounded-lg space-y-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{model.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Creativity (Temperature)</Label>
                <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(v) => setTemperature(v[0])}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Tokens</Label>
                <span className="text-sm text-muted-foreground">{maxTokens}</span>
              </div>
              <Slider
                value={[maxTokens]}
                onValueChange={(v) => setMaxTokens(v[0])}
                min={500}
                max={4000}
                step={100}
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>System Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowPromptDialog}
                  className="h-6 px-2"
                >
                  <Maximize2 className="h-3 w-3 mr-1" />
                  <span className="text-xs">Mở rộng</span>
                </Button>
              </div>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                className="text-xs"
              />
            </div>

            {/* Reset */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onResetAISettings();
                toast.success('Đã reset về mặc định');
              }}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset mặc định
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Generate Button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg"
        onClick={onGenerateSeries}
        disabled={isGenerating || !theme.trim()}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {generationStep}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Tạo Series Concept
          </>
        )}
      </Button>
    </div>
  );
}
