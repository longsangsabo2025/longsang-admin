/**
 * Ideas Tab - Content ideas list with AI settings collapsible
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  Plus,
  Sparkles,
  Clock,
  Trash2,
  Edit,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { formatLastSaved } from '@/hooks/useAutoSave';
import {
  AI_MODELS,
  DEFAULT_AI_SETTINGS,
  PLATFORM_CONFIG,
  type ContentIdea,
} from './types';

interface IdeasTabProps {
  ideas: ContentIdea[];
  isLoadingIdeas: boolean;
  isSavingIdeas: boolean;
  ideasLastSaved: Date | null;
  isGeneratingIdeas: boolean;
  showAISettings: boolean;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  onSetShowAISettings: (val: boolean) => void;
  onSetAiModel: (val: string) => void;
  onSetTemperature: (val: number) => void;
  onSetMaxTokens: (val: number) => void;
  onSetSystemPrompt: (val: string) => void;
  onShowNewIdeaDialog: () => void;
  onGenerateIdeas: () => void;
  onScheduleIdea: (ideaId: string) => void;
  onDeleteIdea: (ideaId: string) => void;
}

export function IdeasTab({
  ideas,
  isLoadingIdeas,
  isSavingIdeas,
  ideasLastSaved,
  isGeneratingIdeas,
  showAISettings,
  aiModel,
  temperature,
  maxTokens,
  systemPrompt,
  onSetShowAISettings,
  onSetAiModel,
  onSetTemperature,
  onSetMaxTokens,
  onSetSystemPrompt,
  onShowNewIdeaDialog,
  onGenerateIdeas,
  onScheduleIdea,
  onDeleteIdea,
}: IdeasTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Ý tưởng nội dung</h2>
          <p className="text-sm text-muted-foreground">
            {isLoadingIdeas ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tải từ Supabase...
              </span>
            ) : isSavingIdeas ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ✅ {formatLastSaved(ideasLastSaved)} • AI sẽ gợi ý dựa trên persona và xu hướng
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onShowNewIdeaDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm ý tưởng
          </Button>
          <Button onClick={onGenerateIdeas} disabled={isGeneratingIdeas}>
            {isGeneratingIdeas ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Tạo ý tưởng AI
          </Button>
        </div>
      </div>

      {/* AI Settings for Idea Generation */}
      <Collapsible open={showAISettings} onOpenChange={onSetShowAISettings}>
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
            <Select value={aiModel} onValueChange={onSetAiModel}>
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
              onValueChange={(v) => onSetTemperature(v[0])}
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
              onValueChange={(v) => onSetMaxTokens(v[0])}
              min={200}
              max={2000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Ý tưởng chi tiết nên dùng 800-1500 tokens
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label>System Prompt (tùy chỉnh)</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => onSetSystemPrompt(e.target.value)}
              placeholder="Hướng dẫn AI cách tạo ý tưởng..."
              rows={6}
              className="text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Tùy chỉnh cách AI tạo ý tưởng nội dung
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
            onClick={() => {
              onSetAiModel(DEFAULT_AI_SETTINGS.model);
              onSetTemperature(DEFAULT_AI_SETTINGS.temperature);
              onSetMaxTokens(DEFAULT_AI_SETTINGS.maxTokens);
              onSetSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt);
              toast.success('Đã reset về mặc định');
            }}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset mặc định
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Ideas List */}
      <div className="space-y-3">
        {ideas.map(idea => (
          <Card key={idea.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {idea.aiGenerated && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {idea.type}
                    </Badge>
                    {idea.status === 'scheduled' && (
                      <Badge className="text-xs bg-green-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Đã lên lịch
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{idea.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>
                  <div className="flex items-center gap-2">
                    {idea.platform.map(p => {
                      const config = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG];
                      if (!config) return null;
                      return (
                        <div key={p} className={`p-1.5 rounded ${config.bgColor} text-sm`}>
                          {config.emoji}
                        </div>
                      );
                    })}
                    <div className="flex gap-1 ml-2">
                      {idea.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {idea.status !== 'scheduled' && (
                    <Button size="sm" onClick={() => onScheduleIdea(idea.id)}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Lên lịch
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDeleteIdea(idea.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
