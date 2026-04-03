import { Download, RotateCcw, Save, SlidersHorizontal, Upload } from 'lucide-react';
import { useRef } from 'react';
import { StepConfigEditor } from '@/components/pipeline/StepConfigEditor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePipelineSettings } from '@/hooks/usePipelineSettings';

export default function PipelineSettings() {
  const { settings, isDirty, updateStep, save, resetToDefaults, exportSettings, importSettings } =
    usePipelineSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    save();
    toast({
      title: '✅ Pipeline Settings Saved',
      description: `${settings.steps.filter((s) => s.enabled).length} steps cấu hình đã được lưu.`,
    });
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: '🔄 Reset to Defaults',
      description: 'Tất cả settings đã trở về giá trị mặc định v3.',
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importSettings(file);
      toast({
        title: '📥 Import thành công',
        description: file.name,
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <SlidersHorizontal className="h-6 w-6" />
            Pipeline Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tùy chỉnh system prompts, models, và cấu hình cho từng step trong video pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="destructive" className="animate-pulse">
              Unsaved
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            v{settings.version} • {new Date(settings.updatedAt).toLocaleString('vi-VN')}
          </Badge>
        </div>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-4 pb-4">
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Lưu Settings
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Mặc Định
          </Button>
          <Separator orientation="vertical" className="mx-2 h-8" />
          <Button variant="outline" onClick={exportSettings}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </CardContent>
      </Card>

      {/* Steps Tabs */}
      <Tabs defaultValue="script">
        <TabsList className="grid w-full grid-cols-5">
          {settings.steps.map((step) => (
            <TabsTrigger key={step.id} value={step.id} className="gap-1.5">
              <span>{step.icon}</span>
              <span className="hidden sm:inline">{step.label}</span>
              {!step.enabled && (
                <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                  OFF
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {settings.steps.map((step) => (
          <TabsContent key={step.id} value={step.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{step.icon}</span> {step.label}
                </CardTitle>
                <CardDescription>
                  Model: <code className="text-xs">{step.model}</code>
                  {step.temperature > 0 && <> • Temp: {step.temperature}</>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StepConfigEditor config={step} onChange={updateStep} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
