/**
 * AI Settings Page
 * Configure AI usage, budgets, and preferences
 */

import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  Brain, 
  Shield, 
  Bell,
  Save,
  RotateCcw,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AISettings {
  // Budget
  monthlyBudget: number;
  warningThreshold: number;
  autoDisableOnBudget: boolean;
  
  // Model preferences
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  
  // Features
  enablePlanning: boolean;
  enableLearning: boolean;
  cacheResponses: boolean;
  cacheTTL: number;
  
  // Notifications
  notifyOnError: boolean;
  notifyOnBudgetWarning: boolean;
  notifyOnCompletion: boolean;
}

const defaultSettings: AISettings = {
  monthlyBudget: 50,
  warningThreshold: 80,
  autoDisableOnBudget: false,
  defaultModel: 'gpt-4o-mini',
  maxTokens: 2000,
  temperature: 0.7,
  enablePlanning: true,
  enableLearning: true,
  cacheResponses: true,
  cacheTTL: 3600,
  notifyOnError: true,
  notifyOnBudgetWarning: true,
  notifyOnCompletion: false,
};

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load AI settings:', e);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const saved = localStorage.getItem('ai-settings');
    const current = JSON.stringify(settings);
    setHasChanges(saved !== current);
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('ai-settings', JSON.stringify(settings));
      
      // Optionally sync to server
      // await fetch(`${API_BASE}/api/settings/ai`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });

      toast({
        title: '✅ Settings saved',
        description: 'Your AI settings have been updated',
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast({
      title: '🔄 Settings reset',
      description: 'Settings have been reset to defaults',
    });
  };

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              AI Settings
            </h1>
            <p className="text-muted-foreground">
              Configure AI behavior, budgets, and preferences
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={loading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Budget Settings */}
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>Budget Management</CardTitle>
                <CardDescription>Control your AI spending limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyBudget">Monthly Budget ($)</Label>
                    <Input
                      id="monthlyBudget"
                      type="number"
                      min={0}
                      step={5}
                      value={settings.monthlyBudget}
                      onChange={(e) => updateSetting('monthlyBudget', parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum amount to spend on AI services per month
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Warning Threshold: {settings.warningThreshold}%</Label>
                    <Slider
                      value={[settings.warningThreshold]}
                      onValueChange={([value]) => updateSetting('warningThreshold', value)}
                      max={100}
                      min={50}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Show warning when budget usage reaches this percentage
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-disable on Budget</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically disable AI features when budget is exceeded
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoDisableOnBudget}
                      onCheckedChange={(checked) => updateSetting('autoDisableOnBudget', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Settings */}
          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>Configure AI model preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultModel">Default Model</Label>
                    <Select
                      value={settings.defaultModel}
                      onValueChange={(value) => updateSetting('defaultModel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Balanced)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Powerful)</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku (Fast)</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet (Balanced)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens: {settings.maxTokens}</Label>
                    <Slider
                      value={[settings.maxTokens]}
                      onValueChange={([value]) => updateSetting('maxTokens', value)}
                      max={8000}
                      min={500}
                      step={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum tokens per API call (affects response length and cost)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature: {settings.temperature}</Label>
                    <Slider
                      value={[settings.temperature * 100]}
                      onValueChange={([value]) => updateSetting('temperature', value / 100)}
                      max={100}
                      min={0}
                      step={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher = more creative, Lower = more focused
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Settings */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Configuration</CardTitle>
                <CardDescription>Enable or disable AI features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Planning Layer</Label>
                      <p className="text-xs text-muted-foreground">
                        Use Copilot Planner for multi-step task planning
                      </p>
                    </div>
                    <Switch
                      checked={settings.enablePlanning}
                      onCheckedChange={(checked) => updateSetting('enablePlanning', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Learning Layer</Label>
                      <p className="text-xs text-muted-foreground">
                        Collect feedback to improve AI responses over time
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableLearning}
                      onCheckedChange={(checked) => updateSetting('enableLearning', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cache Responses</Label>
                      <p className="text-xs text-muted-foreground">
                        Cache AI responses to reduce API calls and costs
                      </p>
                    </div>
                    <Switch
                      checked={settings.cacheResponses}
                      onCheckedChange={(checked) => updateSetting('cacheResponses', checked)}
                    />
                  </div>

                  {settings.cacheResponses && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <Label>Cache TTL: {settings.cacheTTL}s</Label>
                      <Slider
                        value={[settings.cacheTTL]}
                        onValueChange={([value]) => updateSetting('cacheTTL', value)}
                        max={86400}
                        min={60}
                        step={300}
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to keep cached responses (in seconds)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure when to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notify on Errors</Label>
                      <p className="text-xs text-muted-foreground">
                        Show notification when AI requests fail
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifyOnError}
                      onCheckedChange={(checked) => updateSetting('notifyOnError', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Budget Warnings</Label>
                      <p className="text-xs text-muted-foreground">
                        Alert when approaching budget limit
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifyOnBudgetWarning}
                      onCheckedChange={(checked) => updateSetting('notifyOnBudgetWarning', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Completion Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when long-running tasks complete
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifyOnCompletion}
                      onCheckedChange={(checked) => updateSetting('notifyOnCompletion', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status indicator */}
        {hasChanges && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium">You have unsaved changes</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
