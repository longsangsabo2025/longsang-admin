/**
 * 🎯 AI Strategist Config Dialog
 * Cấu hình AI tạo chiến lược marketing
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Save, RotateCcw, Brain, Copy, RefreshCw, Play, Download, Upload, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AIStrategistConfig,
  DEFAULT_STRATEGIST_CONFIG,
} from '@/types/ai-marketing';
import { PromptTemplatesDialog } from './PromptTemplatesDialog';
import { PromptTemplate } from '@/lib/prompt-templates';

interface AIStrategistConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onConfigSaved?: (config: AIStrategistConfig) => void;
}

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', desc: 'Nhanh, tiết kiệm' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai', desc: 'Mạnh nhất' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic', desc: 'Sáng tạo' },
];

const OBJECTIVES = [
  { value: 'awareness', label: 'Brand Awareness', desc: 'Tăng nhận diện thương hiệu' },
  { value: 'engagement', label: 'Engagement', desc: 'Tăng tương tác' },
  { value: 'conversion', label: 'Conversion', desc: 'Chuyển đổi, bán hàng' },
  { value: 'retention', label: 'Retention', desc: 'Giữ chân khách hàng' },
];

export function AIStrategistConfigDialog({
  open,
  onOpenChange,
  projectSlug,
  onConfigSaved,
}: AIStrategistConfigDialogProps) {
  const [config, setConfig] = useState<AIStrategistConfig>(DEFAULT_STRATEGIST_CONFIG);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('model');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Handle template selection
  const handleSelectTemplate = (template: PromptTemplate) => {
    setCustomPrompt(template.prompt);
    setUseCustomPrompt(true);
  };

  // Build system prompt from config
  const buildSystemPrompt = (): string => {
    const { expertise } = config;
    return `Bạn là ${expertise.role} với ${expertise.yearsExperience} năm kinh nghiệm.
Chuyên môn: ${expertise.specializations.join(', ')}

QUAN TRỌNG: Bạn CHỈ tạo CHIẾN LƯỢC MARKETING TỔNG THỂ, KHÔNG viết content chi tiết.

Output của bạn sẽ được sử dụng bởi các AI Content Writer chuyên biệt cho từng platform.`;
  };

  // Build user prompt from config
  const buildUserPrompt = (): string => {
    const { strategy, output } = config;
    return `📚 TÀI LIỆU DỰ ÁN: [Tên dự án]
[Nội dung tài liệu sẽ được đọc tự động từ database]

---

🎯 NHIỆM VỤ: Tạo CHIẾN LƯỢC MARKETING cho dự án này.

📋 YÊU CẦU:
- Mục tiêu chính: ${strategy.objective.toUpperCase()}
- Số chiến dịch: ${strategy.campaignsCount}
- Đối tượng mục tiêu: ${strategy.targetAudience || '[Chưa cấu hình]'}
- Thị trường: ${strategy.marketFocus || '[Chưa cấu hình]'}

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}

📤 OUTPUT FORMAT (JSON):
{
  "summary": "Tóm tắt chiến lược 2-3 câu",
  "brandAnalysis": {
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "opportunities": ["Cơ hội 1", "Cơ hội 2"],
    "uniqueValue": "Unique value proposition"
  },
  "targetAudience": {
    "primary": "Đối tượng chính",
    "secondary": "Đối tượng phụ",
    "painPoints": ["Pain point 1", "Pain point 2"]
  },
  "campaigns": [
    {
      "id": "campaign-1",
      "name": "Tên chiến dịch",
      "objective": "${strategy.objective}",
      "keyMessage": "Thông điệp chính",
      "targetAudience": "Đối tượng cụ thể",
      "platforms": ["facebook", "instagram"],
      "duration": "2 tuần",
      "priority": "high",
      "contentThemes": ["Theme 1", "Theme 2", "Theme 3"],
      "callToAction": "CTA chính"
    }
  ],
  ${output.includeTimeline ? `"timeline": [
    {"phase": "Phase 1", "duration": "1 tuần", "focus": "Launch"}
  ],` : ''}
  ${output.includeKPIs ? `"kpis": [
    {"metric": "Reach", "target": "10,000"},
    {"metric": "Engagement Rate", "target": "5%"}
  ],` : ''}
  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
}

⚠️ CHỈ trả về JSON hợp lệ, KHÔNG có markdown hay text khác.`;
  };

  // Get full prompt preview
  const getFullPrompt = (): string => {
    if (useCustomPrompt && customPrompt) {
      return customPrompt;
    }
    return `=== SYSTEM PROMPT ===
${buildSystemPrompt()}

=== USER PROMPT ===
${buildUserPrompt()}`;
  };

  // Update custom prompt when switching to custom mode
  useEffect(() => {
    if (useCustomPrompt && !customPrompt) {
      setCustomPrompt(getFullPrompt());
    }
  }, [useCustomPrompt]);

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

      if (data?.settings?.ai_config?.strategist) {
        const loadedConfig = { ...DEFAULT_STRATEGIST_CONFIG, ...data.settings.ai_config.strategist };
        setConfig(loadedConfig);
        
        // Load custom prompt if saved
        if (data.settings.ai_config.strategist.customFullPrompt) {
          setCustomPrompt(data.settings.ai_config.strategist.customFullPrompt);
          setUseCustomPrompt(true);
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Get existing settings
      const { data: existing } = await supabase
        .from('projects')
        .select('settings')
        .eq('slug', projectSlug)
        .single();

      // Save custom prompt if using custom mode
      const configToSave = {
        ...config,
        customFullPrompt: useCustomPrompt ? customPrompt : undefined,
        useCustomPrompt,
      };

      const newSettings = {
        ...(existing?.settings || {}),
        ai_config: {
          ...(existing?.settings?.ai_config || {}),
          strategist: configToSave,
        },
      };

      // Update projects table
      const { error } = await supabase
        .from('projects')
        .update({
          settings: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', projectSlug);

      if (error) throw error;

      toast.success('Đã lưu cấu hình AI Strategist');
      onConfigSaved?.(config);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving config:', err);
      toast.error('Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_STRATEGIST_CONFIG);
    setCustomPrompt('');
    setUseCustomPrompt(false);
    toast.info('Đã reset về mặc định');
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(getFullPrompt());
    toast.success('Đã copy prompt!');
  };

  const regeneratePrompt = () => {
    const newPrompt = `=== SYSTEM PROMPT ===
${buildSystemPrompt()}

=== USER PROMPT ===
${buildUserPrompt()}`;
    setCustomPrompt(newPrompt);
    toast.info('Đã tạo lại prompt từ config');
  };

  // Test prompt with AI
  const testPrompt = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const prompt = getFullPrompt();
      // Replace placeholder with sample content for testing
      const testPromptWithSample = prompt
        .replace('[Tên dự án]', 'Test Project')
        .replace('[Nội dung tài liệu sẽ được đọc tự động từ database]', 
          `=== Tài liệu mẫu ===
Sản phẩm: App quản lý tài chính cá nhân
Đối tượng: Người trẻ 18-35 tuổi
USP: Dễ sử dụng, AI tự động phân loại chi tiêu
Mục tiêu: Tăng downloads và user retention`);

      const systemMatch = testPromptWithSample.match(/=== SYSTEM PROMPT ===\s*([\s\S]*?)(?:=== USER PROMPT ===|$)/);
      const userMatch = testPromptWithSample.match(/=== USER PROMPT ===\s*([\s\S]*)/);

      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMatch?.[1]?.trim() || testPromptWithSample,
          systemPrompt: systemMatch?.[1]?.trim() || '',
          model: config.model.model,
          maxTokens: Math.min(config.model.maxTokens, 2000), // Limit for test
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
      config,
      customPrompt: useCustomPrompt ? customPrompt : undefined,
      useCustomPrompt,
      exportedAt: new Date().toISOString(),
      projectSlug,
      type: 'ai-strategist-config',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-strategist-config-${projectSlug}.json`;
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
        
        if (data.config) {
          setConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.customPrompt) {
          setCustomPrompt(data.customPrompt);
        }
        if (data.useCustomPrompt !== undefined) {
          setUseCustomPrompt(data.useCustomPrompt);
        }
        
        toast.success('Import thành công!');
      } catch (err) {
        toast.error('File JSON không hợp lệ');
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Cấu hình AI Marketing Strategist
          </DialogTitle>
          <DialogDescription>
            AI chuyên tạo chiến lược marketing tổng thể cho dự án
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="model">🤖 AI Model</TabsTrigger>
              <TabsTrigger value="strategy">🎯 Chiến lược</TabsTrigger>
              <TabsTrigger value="output">📤 Output</TabsTrigger>
              <TabsTrigger value="prompt">📝 Prompt</TabsTrigger>
            </TabsList>

            {/* AI Model Tab */}
            <TabsContent value="model" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Model AI</Label>
                <Select
                  value={config.model.model}
                  onValueChange={(value) => {
                    const model = AI_MODELS.find(m => m.value === value);
                    setConfig(prev => ({
                      ...prev,
                      model: {
                        ...prev.model,
                        model: value,
                        provider: (model?.provider || 'openai') as any,
                      },
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <span>{m.label}</span>
                          <Badge variant="outline" className="text-xs">{m.desc}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens: {config.model.maxTokens}</Label>
                <Slider
                  value={[config.model.maxTokens]}
                  onValueChange={([v]) => setConfig(prev => ({
                    ...prev,
                    model: { ...prev.model, maxTokens: v },
                  }))}
                  min={1000}
                  max={8000}
                  step={500}
                />
              </div>

              <div className="space-y-2">
                <Label>Vai trò AI</Label>
                <Input
                  value={config.expertise.role}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    expertise: { ...prev.expertise, role: e.target.value },
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Kinh nghiệm (năm)</Label>
                <Slider
                  value={[config.expertise.yearsExperience]}
                  onValueChange={([v]) => setConfig(prev => ({
                    ...prev,
                    expertise: { ...prev.expertise, yearsExperience: v },
                  }))}
                  min={5}
                  max={25}
                  step={1}
                />
                <p className="text-sm text-muted-foreground">{config.expertise.yearsExperience} năm kinh nghiệm</p>
              </div>
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Mục tiêu chính</Label>
                <Select
                  value={config.strategy.objective}
                  onValueChange={(value: any) => setConfig(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, objective: value },
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map(o => (
                      <SelectItem key={o.value} value={o.value}>
                        <div>
                          <span className="font-medium">{o.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{o.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Số chiến dịch tạo: {config.strategy.campaignsCount}</Label>
                <Slider
                  value={[config.strategy.campaignsCount]}
                  onValueChange={([v]) => setConfig(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, campaignsCount: v },
                  }))}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Đối tượng mục tiêu</Label>
                <Input
                  value={config.strategy.targetAudience}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, targetAudience: e.target.value },
                  }))}
                  placeholder="VD: Người dùng Việt Nam 18-45 tuổi"
                />
              </div>

              <div className="space-y-2">
                <Label>Thị trường focus</Label>
                <Input
                  value={config.strategy.marketFocus}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, marketFocus: e.target.value },
                  }))}
                  placeholder="VD: Vietnam, SEA"
                />
              </div>
            </TabsContent>

            {/* Output Tab */}
            <TabsContent value="output" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bao gồm Timeline</Label>
                  <p className="text-xs text-muted-foreground">Lịch trình triển khai</p>
                </div>
                <Switch
                  checked={config.output.includeTimeline}
                  onCheckedChange={(v) => setConfig(prev => ({
                    ...prev,
                    output: { ...prev.output, includeTimeline: v },
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Bao gồm KPIs</Label>
                  <p className="text-xs text-muted-foreground">Chỉ số đo lường</p>
                </div>
                <Switch
                  checked={config.output.includeKPIs}
                  onCheckedChange={(v) => setConfig(prev => ({
                    ...prev,
                    output: { ...prev.output, includeKPIs: v },
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Ước tính ngân sách</Label>
                  <p className="text-xs text-muted-foreground">Budget estimate</p>
                </div>
                <Switch
                  checked={config.output.includeBudgetEstimate}
                  onCheckedChange={(v) => setConfig(prev => ({
                    ...prev,
                    output: { ...prev.output, includeBudgetEstimate: v },
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Hướng dẫn tùy chỉnh</Label>
                <Textarea
                  value={config.customInstructions}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    customInstructions: e.target.value,
                  }))}
                  placeholder="Thêm hướng dẫn đặc biệt cho AI..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Prompt Tab - NEW */}
            <TabsContent value="prompt" className="space-y-4 mt-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <p className="text-sm text-purple-300">
                  💡 <strong>Prompt Preview:</strong> Xem và chỉnh sửa prompt cuối cùng sẽ gửi cho AI.
                  Bạn có thể paste prompt từ nơi khác hoặc tùy chỉnh theo ý muốn.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Sử dụng Custom Prompt</Label>
                  <p className="text-xs text-muted-foreground">
                    Bật để dùng prompt tùy chỉnh thay vì auto-generate từ config
                  </p>
                </div>
                <Switch
                  checked={useCustomPrompt}
                  onCheckedChange={setUseCustomPrompt}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPrompt}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regeneratePrompt}
                  disabled={!useCustomPrompt}
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

              {useCustomPrompt ? (
                <div className="space-y-2">
                  <Label>Custom Prompt (có thể chỉnh sửa)</Label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Paste hoặc viết prompt của bạn tại đây..."
                    rows={15}
                    className="font-mono text-sm bg-slate-950 border-slate-700"
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Prompt sẽ được lưu và sử dụng khi tạo chiến lược
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Auto-Generated Prompt (chỉ xem)</Label>
                  <div className="relative">
                    <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap text-slate-300 max-h-[250px] overflow-auto">
                      {getFullPrompt()}
                    </pre>
                    <Badge 
                      variant="outline" 
                      className="absolute top-2 right-2 bg-slate-900"
                    >
                      Read-only
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Bật "Sử dụng Custom Prompt" để chỉnh sửa
                  </p>
                </div>
              )}

              {/* Test Result */}
              {testResult && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    🧪 Kết quả Test
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {config.model.model}
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
        </ScrollArea>

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
          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </DialogFooter>

        {/* Templates Dialog */}
        <PromptTemplatesDialog
          open={showTemplates}
          onOpenChange={setShowTemplates}
          category="strategist"
          onSelectTemplate={handleSelectTemplate}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AIStrategistConfigDialog;
