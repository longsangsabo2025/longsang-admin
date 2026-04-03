import { RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { PipelineStepId, StepConfig } from '@/types/pipeline-settings';
import { STEP_MODELS } from '@/types/pipeline-settings';

interface StepConfigEditorProps {
  config: StepConfig;
  onChange: (stepId: PipelineStepId, patch: Partial<StepConfig>) => void;
}

export function StepConfigEditor({ config, onChange }: StepConfigEditorProps) {
  const models = STEP_MODELS[config.id] || [];
  const hasPrompts = config.id === 'script' || config.id === 'visual';
  const hasTTSRates = config.id === 'tts';
  const hasVideoParams = config.id === 'video';
  const hasPostParams = config.id === 'post';

  return (
    <div className="space-y-6">
      {/* Header: Enable/Disable + Model */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="text-lg font-semibold">{config.label}</h3>
            <p className="text-sm text-muted-foreground">Step: {config.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`enabled-${config.id}`} className="text-sm">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
          <Switch
            id={`enabled-${config.id}`}
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange(config.id, { enabled })}
          />
        </div>
      </div>

      <Separator />

      {/* Model Selection */}
      {models.length > 0 && (
        <div className="space-y-2">
          <Label>Model / Engine</Label>
          <Select value={config.model} onValueChange={(model) => onChange(config.id, { model })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn model..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Temperature (only for AI steps) */}
      {hasPrompts && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <Badge variant="outline">{config.temperature.toFixed(2)}</Badge>
          </div>
          <Slider
            value={[config.temperature]}
            min={0}
            max={2}
            step={0.05}
            onValueChange={([t]) => onChange(config.id, { temperature: t })}
          />
          <p className="text-xs text-muted-foreground">Thấp = chính xác hơn. Cao = sáng tạo hơn.</p>
        </div>
      )}

      {/* System Prompt */}
      {hasPrompts && (
        <div className="space-y-2">
          <Label>System Prompt</Label>
          <Textarea
            value={config.systemPrompt}
            onChange={(e) => onChange(config.id, { systemPrompt: e.target.value })}
            className="min-h-[300px] font-mono text-xs"
            placeholder="System prompt cho agent..."
          />
          <p className="text-xs text-muted-foreground">{config.systemPrompt.length} ký tự</p>
        </div>
      )}

      {/* User Prompt Template */}
      {hasPrompts && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>User Prompt Template</Label>
            <Badge variant="secondary" className="text-xs">
              {'{{TOPIC}}'} = chủ đề
            </Badge>
          </div>
          <Textarea
            value={config.userPromptTemplate}
            onChange={(e) => onChange(config.id, { userPromptTemplate: e.target.value })}
            className="min-h-[200px] font-mono text-xs"
            placeholder="User prompt template..."
          />
          <p className="text-xs text-muted-foreground">
            Dùng {'{{TOPIC}}'}, {'{{SECTION}}'}, {'{{VISUAL_MOOD}}'} làm biến thay thế.
          </p>
        </div>
      )}

      {/* TTS Rate Params */}
      {hasTTSRates && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">Tốc độ đọc theo Scene</Label>
          <p className="text-sm text-muted-foreground">
            Điều chỉnh tốc độ Edge TTS cho từng section. VD: +5%, -10%, +0%
          </p>
          {['HOOK', 'BOI_CANH', 'GIAI_PHAU', 'TWIST', 'DUNG_DAY'].map((section) => {
            const key = `rate_${section}`;
            return (
              <div key={key} className="flex items-center gap-3">
                <Badge variant="outline" className="w-28 justify-center font-mono text-xs">
                  {section}
                </Badge>
                <Input
                  value={(config.params[key] as string) || '+0%'}
                  onChange={(e) =>
                    onChange(config.id, {
                      params: { ...config.params, [key]: e.target.value },
                    })
                  }
                  className="w-24 font-mono"
                  placeholder="+0%"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Video Params */}
      {hasVideoParams && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">FFmpeg Parameters</Label>
          {[
            { key: 'resolution', label: 'Resolution', placeholder: '1080x1920' },
            { key: 'fps', label: 'FPS', placeholder: '30' },
            { key: 'kenBurnsZoom', label: 'Ken Burns Zoom', placeholder: '1.15' },
            { key: 'fontSize', label: 'Font Size', placeholder: '56' },
            { key: 'fontFamily', label: 'Font Family', placeholder: 'Arial' },
            { key: 'crossfadeDuration', label: 'Crossfade (s)', placeholder: '0.3' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-40 text-sm">{label}</Label>
              <Input
                value={String(config.params[key] ?? '')}
                onChange={(e) =>
                  onChange(config.id, {
                    params: { ...config.params, [key]: e.target.value },
                  })
                }
                className="w-40 font-mono"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Params */}
      {hasPostParams && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">Caption Template</Label>
          <Textarea
            value={(config.params.captionTemplate as string) || ''}
            onChange={(e) =>
              onChange(config.id, {
                params: { ...config.params, captionTemplate: e.target.value },
              })
            }
            className="min-h-[100px] font-mono text-xs"
            placeholder="Template cho caption..."
          />
          <p className="text-xs text-muted-foreground">
            Biến: {'{{TITLE}}'}, {'{{TOPIC}}'}, {'{{DURATION}}'}
          </p>
        </div>
      )}

      {/* Reset step to default */}
      <Separator />
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          // This triggers the parent to reset just this step
          onChange(config.id, { _reset: true } as unknown as Partial<StepConfig>);
        }}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset step về mặc định
      </Button>
    </div>
  );
}
