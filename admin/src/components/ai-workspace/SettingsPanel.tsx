/**
 * SettingsPanel Component
 * AI settings configuration panel with Model and Agent Prompts tabs
 */

import {
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  Cpu,
  DollarSign,
  Info,
  Newspaper,
  RotateCcw,
  Search,
  Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AssistantType, useAISettings } from '@/hooks/useAISettings';
import { cn } from '@/lib/utils';

const AGENT_INFO: Record<AssistantType, { name: string; icon: React.ElementType; color: string }> =
  {
    course: { name: 'Khóa học AI', icon: BookOpen, color: 'text-blue-500' },
    financial: { name: 'Tài chính Pro', icon: DollarSign, color: 'text-green-500' },
    research: { name: 'Nghiên cứu', icon: Search, color: 'text-purple-500' },
    news: { name: 'Tin tức', icon: Newspaper, color: 'text-orange-500' },
    career: { name: 'Career', icon: Briefcase, color: 'text-indigo-500' },
    daily: { name: 'Planner', icon: Calendar, color: 'text-pink-500' },
  };

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { settings, updateSettings, resetSettings, isSaving, lastSaved } = useAISettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  const handleSave = async () => {
    await updateSettings(localSettings);
    toast({
      title: '✅ Đã lưu vào Database',
      description: 'Settings đã được lưu và sẽ không bị mất khi xóa browser data',
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
    toast({
      title: '✅ Đã reset',
      description: 'Settings đã được reset về mặc định',
    });
  };

  const updateAgentPrompt = (
    agent: AssistantType,
    field: 'systemPrompt' | 'enabled',
    value: string | boolean
  ) => {
    setLocalSettings({
      ...localSettings,
      agentPrompts: {
        ...localSettings.agentPrompts,
        [agent]: {
          ...localSettings.agentPrompts[agent],
          [field]: value,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Cấu hình model, temperature, và custom prompts cho từng AI agent</span>
            {lastSaved && (
              <span className="text-xs text-green-600">
                💾 Đã lưu: {new Date(lastSaved).toLocaleString('vi-VN')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="model" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Model Settings
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agent Prompts
            </TabsTrigger>
          </TabsList>

          {/* Model Settings Tab */}
          <TabsContent value="model" className="space-y-6 py-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Model
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Select
                value={localSettings.model}
                onValueChange={(value: any) => setLocalSettings({ ...localSettings, model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🤖 Auto (Recommended)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Most capable)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o-mini (Fast & cheap)</SelectItem>
                  <SelectItem value="claude-sonnet-4">Claude Sonnet 4 (Best reasoning)</SelectItem>
                  <SelectItem value="claude-haiku">Claude Haiku (Ultra fast)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Auto sẽ tự động chọn model phù hợp dựa trên độ phức tạp của query
              </p>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Provider
                <Info className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Select
                value={localSettings.provider}
                onValueChange={(value: any) =>
                  setLocalSettings({ ...localSettings, provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Recommended)</SelectItem>
                  <SelectItem value="openai">OpenAI Only</SelectItem>
                  <SelectItem value="anthropic">Anthropic Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chọn provider mặc định (Auto sẽ dùng cả hai nếu có)
              </p>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Temperature
                  <Info className="h-3 w-3 text-muted-foreground" />
                </span>
                <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                  {localSettings.temperature}
                </span>
              </Label>
              <Slider
                value={[localSettings.temperature]}
                onValueChange={([value]) =>
                  setLocalSettings({ ...localSettings, temperature: value })
                }
                min={0}
                max={1}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>🎯 Chính xác</span>
                <span>🎨 Sáng tạo</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min={100}
                max={4000}
                value={localSettings.maxTokens}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    maxTokens: parseInt(e.target.value, 10) || 2000,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Số tokens tối đa cho response (100-4000)
              </p>
            </div>

            {/* Streaming */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  Streaming
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hiển thị response real-time (khuyến nghị bật)
                </p>
              </div>
              <Switch
                checked={localSettings.streaming}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, streaming: checked })
                }
              />
            </div>
          </TabsContent>

          {/* Agent Prompts Tab */}
          <TabsContent value="prompts" className="py-4">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                🎯 <strong>System Prompts đã được xây dựng chi tiết</strong> bởi dev team cho từng
                AI Agent. Bạn có thể tùy chỉnh thêm hoặc giữ nguyên.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {(Object.keys(AGENT_INFO) as AssistantType[]).map((agentId) => {
                const agent = AGENT_INFO[agentId];
                const Icon = agent.icon;
                const promptConfig = localSettings.agentPrompts?.[agentId] || {
                  systemPrompt: '',
                  enabled: true,
                };
                const promptLines = promptConfig.systemPrompt?.split('\n').length || 0;

                return (
                  <AccordionItem key={agentId} value={agentId} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 w-full">
                        <Icon className={cn('h-5 w-5', agent.color)} />
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto mr-2">
                          {promptLines} dòng
                        </span>
                        {!promptConfig.enabled && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded">
                            Custom OFF
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Sử dụng Custom Prompt</Label>
                          <p className="text-xs text-muted-foreground">
                            Tắt để dùng prompt mặc định từ backend
                          </p>
                        </div>
                        <Switch
                          checked={promptConfig.enabled}
                          onCheckedChange={(checked) =>
                            updateAgentPrompt(agentId, 'enabled', checked)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">System Prompt</Label>
                          <span className="text-xs text-muted-foreground">
                            {promptConfig.systemPrompt?.length || 0} ký tự
                          </span>
                        </div>
                        <Textarea
                          value={promptConfig.systemPrompt}
                          onChange={(e) =>
                            updateAgentPrompt(agentId, 'systemPrompt', e.target.value)
                          }
                          placeholder={`Nhập system prompt cho ${agent.name}...`}
                          className="min-h-[200px] resize-y font-mono text-xs"
                          disabled={!promptConfig.enabled}
                        />
                        <p className="text-xs text-muted-foreground">
                          Prompt này sẽ được gửi như system message cho AI mỗi lần chat
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            💾 Settings được lưu vào Database (không mất khi xóa browser)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang lưu...
                </>
              ) : (
                'Lưu Settings'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
