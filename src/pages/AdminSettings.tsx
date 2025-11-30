// ================================================
// ADMIN SETTINGS PAGE
// ================================================
// Global configuration for admins

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Bell,
  Key,
  DollarSign,
  Brain,
  Save,
  Loader2,
  Server,
  Database,
} from 'lucide-react';
import { MCPSupabaseStatus } from '@/components/admin/MCPSupabaseStatus';

export default function AdminSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loadingEnvVars, setLoadingEnvVars] = useState(false);

  // Helper function for port validation
  const getStandardPort = (key: string): number => {
    const standardPorts: Record<string, number> = {
      admin: 8080,
      ainewbie: 5174,
      vungtau: 5175,
      secretary: 5173,
      portfolio: 5000,
      n8n: 5678,
      api: 3001,
    };
    return standardPorts[key] || 0;
  };

  const getPortDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      admin: 'Main admin dashboard and SABO Arena',
      ainewbie: 'AI learning platform for beginners',
      vungtau: 'Real estate platform for Vung Tau',
      secretary: 'AI assistant frontend',
      portfolio: 'Personal portfolio website',
      n8n: 'Workflow automation engine',
      api: 'Internal API server',
    };
    return descriptions[key] || '';
  };

  // General Settings
  const [defaultAiModel, setDefaultAiModel] = useState('gpt-4o-mini');
  const [autoApprove, setAutoApprove] = useState(false);
  const [systemWideLogging, setSystemWideLogging] = useState(true);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [toastNotifications, setToastNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Budget Settings
  const [globalDailyLimit, setGlobalDailyLimit] = useState(50);
  const [globalMonthlyLimit, setGlobalMonthlyLimit] = useState(1000);
  const [alertThreshold, setAlertThreshold] = useState(75);

  // API Keys
  const [openaiKey, setOpenaiKey] = useState('');
  const [resendKey, setResendKey] = useState('');
  const [linkedinKey, setLinkedinKey] = useState('');

  // Port Policy State
  const [portPolicy, setPortPolicy] = useState({
    admin: { port: 8080, name: 'Admin Dashboard' },
    ainewbie: { port: 5174, name: 'AI Newbie Web' },
    vungtau: { port: 5175, name: 'Vung Tau Dream Homes' },
    secretary: { port: 5173, name: 'AI Secretary' },
    portfolio: { port: 5000, name: 'Portfolio' },
    n8n: { port: 5678, name: 'N8N Automation' },
    api: { port: 3001, name: 'API Server' },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load admin settings from Supabase
      const { data: settings, error } = await supabase.from('admin_settings').select('*').single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to load settings:', error);
        return;
      }

      if (settings) {
        // Apply loaded settings
        const config = settings.config || {};
        setDefaultAiModel(config.default_ai_model || 'gpt-4o-mini');
        setAutoApprove(config.auto_approve || false);
        setSystemWideLogging(config.system_wide_logging !== false);
        setEmailNotifications(config.email_notifications !== false);
        setToastNotifications(config.toast_notifications !== false);
        setNotificationEmail(config.notification_email || '');
        setWebhookUrl(config.webhook_url || '');
        setGlobalDailyLimit(config.global_daily_limit || 50);
        setGlobalMonthlyLimit(config.global_monthly_limit || 1000);
        setAlertThreshold(config.alert_threshold || 75);

        if (config.port_policy) {
          setPortPolicy(config.port_policy);
        }
        if (config.environment_variables) {
          setEnvVars(config.environment_variables);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsConfig = {
        default_ai_model: defaultAiModel,
        auto_approve: autoApprove,
        system_wide_logging: systemWideLogging,
        email_notifications: emailNotifications,
        toast_notifications: toastNotifications,
        notification_email: notificationEmail,
        webhook_url: webhookUrl,
        global_daily_limit: globalDailyLimit,
        global_monthly_limit: globalMonthlyLimit,
        alert_threshold: alertThreshold,
        port_policy: portPolicy,
        environment_variables: envVars,
        last_updated: new Date().toISOString(),
      };

      // Upsert to Supabase admin_settings table
      const { error } = await supabase.from('admin_settings').upsert({
        id: 'system_config',
        config: settingsConfig,
      });

      if (error) {
        throw error;
      }

      toast({
        title: '✅ Settings Saved',
        description: 'All settings have been updated successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: '❌ Save Failed',
        description: `Could not save settings: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">
            Configure global settings for all agents and automation
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-8 w-full max-w-5xl">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="ports">
              <Settings className="h-4 w-4 mr-1" />
              Port Policy
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="budget">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="api-keys">
              <Key className="h-4 w-4 mr-1" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="ai-models">
              <Brain className="h-4 w-4 mr-1" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="environment">
              <Server className="h-4 w-4 mr-1" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="mcp-supabase">
              <Database className="h-4 w-4 mr-1" />
              MCP Supabase
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure default behavior for all agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <Select value={defaultAiModel} onValueChange={setDefaultAiModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Premium)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</SelectItem>
                      <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    New agents will use this model by default
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Auto-Approve Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Skip manual review and auto-publish all content
                    </p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>System-Wide Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all agent activities and API calls
                    </p>
                  </div>
                  <Switch checked={systemWideLogging} onCheckedChange={setSystemWideLogging} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Port Policy Settings */}
          <TabsContent value="ports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Port Policy Configuration</CardTitle>
                <CardDescription>
                  Manage port assignments for all projects and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Standard Port Map:</strong> These ports are finalized and should not be
                    changed unless absolutely necessary. All launch scripts, docs, and configs must
                    match this table.
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.entries(portPolicy).map(([key, config]) => {
                    const standardPort = getStandardPort(key);
                    const isStandardPort = config.port === standardPort;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <Label className="font-medium">{config.name}</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getPortDescription(key)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            value={config.port}
                            onChange={(e) => {
                              const newPort = Number(e.target.value);
                              setPortPolicy((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], port: newPort },
                              }));
                            }}
                            className="w-20 text-center"
                            min={3000}
                            max={9999}
                          />
                          <Badge variant={isStandardPort ? 'default' : 'destructive'}>
                            Port {config.port}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Warning:</strong> Changing ports requires updating all launch
                    scripts, documentation, and may break existing automation workflows.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Reset to standard values
                    setPortPolicy({
                      admin: { port: 8080, name: 'Admin Dashboard' },
                      ainewbie: { port: 5174, name: 'AI Newbie Web' },
                      vungtau: { port: 5175, name: 'Vung Tau Dream Homes' },
                      secretary: { port: 5173, name: 'AI Secretary' },
                      portfolio: { port: 5000, name: 'Portfolio' },
                      n8n: { port: 5678, name: 'N8N Automation' },
                      api: { port: 3001, name: 'API Server' },
                    });
                  }}
                >
                  Reset to Standard Ports
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email alerts for important events
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                {emailNotifications && (
                  <div className="space-y-2">
                    <Label>Notification Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@yourdomain.com"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Toast Notifications</Label>
                    <p className="text-sm text-muted-foreground">Show in-app notification toasts</p>
                  </div>
                  <Switch checked={toastNotifications} onCheckedChange={setToastNotifications} />
                </div>

                <div className="space-y-2">
                  <Label>Webhook URL (Optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://your-webhook.com/notify"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Send webhook notifications to external services (Slack, Discord, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Settings */}
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Budget Limits</CardTitle>
                <CardDescription>Set system-wide spending limits across all agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Global Daily Limit (USD)</Label>
                  <Input
                    type="number"
                    value={globalDailyLimit}
                    onChange={(e) => setGlobalDailyLimit(Number(e.target.value))}
                    min={0}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum total spend per day across all agents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Global Monthly Limit (USD)</Label>
                  <Input
                    type="number"
                    value={globalMonthlyLimit}
                    onChange={(e) => setGlobalMonthlyLimit(Number(e.target.value))}
                    min={0}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum total spend per month across all agents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Alert Threshold (%)</Label>
                  <Input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    Get notified when spending reaches this percentage of the limit
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Spending</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Today:</span>
                      <Badge>$0.00 / ${globalDailyLimit}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month:</span>
                      <Badge>$0.00 / ${globalMonthlyLimit}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys Management</CardTitle>
                <CardDescription>Configure API keys for external services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Security Note:</strong> API keys are stored securely in Supabase
                    Secrets. For production, use the CLI:{' '}
                    <code className="bg-blue-100 px-1 rounded">
                      npx supabase secrets set KEY_NAME="value"
                    </code>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>OpenAI API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Get from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener"
                      className="text-primary underline"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Resend API Key (Email)</Label>
                  <Input
                    type="password"
                    placeholder="re_..."
                    value={resendKey}
                    onChange={(e) => setResendKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Get from{' '}
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener"
                      className="text-primary underline"
                    >
                      resend.com/api-keys
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>LinkedIn Access Token</Label>
                  <Input
                    type="password"
                    placeholder="AQV..."
                    value={linkedinKey}
                    onChange={(e) => setLinkedinKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    OAuth 2.0 token from LinkedIn Developer Portal
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const results = [];

                    // Test OpenAI
                    if (openaiKey) {
                      try {
                        const response = await fetch('https://api.openai.com/v1/models', {
                          headers: { Authorization: `Bearer ${openaiKey}` },
                        });
                        results.push(`OpenAI: ${response.ok ? '✅ Connected' : '❌ Failed'}`);
                      } catch {
                        results.push('OpenAI: ❌ Network Error');
                      }
                    }

                    // Test webhook if provided
                    if (webhookUrl) {
                      try {
                        const response = await fetch(webhookUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
                        });
                        results.push(`Webhook: ${response.ok ? '✅ Connected' : '❌ Failed'}`);
                      } catch {
                        results.push('Webhook: ❌ Network Error');
                      }
                    }

                    toast({
                      title: '🔗 Connection Test Results',
                      description: results.join('\n') || 'No API keys to test',
                    });
                  }}
                >
                  Test All Connections
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Models */}
          <TabsContent value="ai-models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Models Overview</CardTitle>
                <CardDescription>Compare models and their costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'GPT-4o', cost: '$0.01/request', speed: 'Fast', quality: 'Excellent' },
                    {
                      name: 'GPT-4o Mini',
                      cost: '$0.002/request',
                      speed: 'Very Fast',
                      quality: 'Very Good',
                    },
                    {
                      name: 'GPT-3.5 Turbo',
                      cost: '$0.001/request',
                      speed: 'Fastest',
                      quality: 'Good',
                    },
                    {
                      name: 'Claude Sonnet 4',
                      cost: '$0.015/request',
                      speed: 'Fast',
                      quality: 'Excellent',
                    },
                    {
                      name: 'Claude Haiku',
                      cost: '$0.0008/request',
                      speed: 'Very Fast',
                      quality: 'Good',
                    },
                  ].map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold">{model.name}</h4>
                        <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                          <span>Speed: {model.speed}</span>
                          <span>•</span>
                          <span>Quality: {model.quality}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{model.cost}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environment Variables */}
          <TabsContent value="environment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables Manager</CardTitle>
                <CardDescription>
                  Manage environment variables for all projects centrally
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setLoadingEnvVars(true);
                        try {
                          const response = await fetch('/api/env/list');
                          if (response.ok) {
                            const vars = await response.json();
                            setEnvVars(vars);
                            toast({
                              title: 'Environment variables loaded',
                              description: 'Successfully loaded from system',
                            });
                          } else {
                            toast({
                              title: 'Load failed',
                              description: 'Could not load environment variables',
                              variant: 'destructive',
                            });
                          }
                        } catch (error) {
                          console.error('Failed to load environment variables:', error);
                          toast({
                            title: 'Load error',
                            description: 'Network error loading environment variables',
                            variant: 'destructive',
                          });
                        } finally {
                          setLoadingEnvVars(false);
                        }
                      }}
                      disabled={loadingEnvVars}
                    >
                      {loadingEnvVars && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Load from System
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newKey = prompt('Variable name:');
                        if (newKey?.trim()) {
                          setEnvVars((prev) => ({ ...prev, [newKey.trim()]: '' }));
                        }
                      }}
                    >
                      Add Variable
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {Object.keys(envVars).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No environment variables configured</p>
                        <p className="text-sm">
                          Click "Add Variable" or "Load from System" to get started
                        </p>
                      </div>
                    ) : (
                      Object.entries(envVars).map(([key, value]) => (
                        <div
                          key={key}
                          className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg"
                        >
                          <div className="col-span-4">
                            <Label className="text-xs font-mono">{key}</Label>
                          </div>
                          <div className="col-span-7">
                            <Input
                              type={
                                key.toLowerCase().includes('secret') ||
                                key.toLowerCase().includes('key') ||
                                key.toLowerCase().includes('token')
                                  ? 'password'
                                  : 'text'
                              }
                              placeholder={`Enter ${key} value...`}
                              value={value}
                              onChange={(e) =>
                                setEnvVars((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEnvVars((prev) => {
                                  const newVars = { ...prev };
                                  delete newVars[key];
                                  return newVars;
                                });
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {Object.keys(envVars).length > 0 && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/env/deploy', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ variables: envVars }),
                              });
                              if (response.ok) {
                                toast({
                                  title: 'Environment deployed',
                                  description: 'Variables updated across all projects',
                                });
                              } else {
                                toast({
                                  title: 'Deploy failed',
                                  description: await response.text(),
                                  variant: 'destructive',
                                });
                              }
                            } catch (error) {
                              console.error('Failed to deploy environment variables:', error);
                              toast({
                                title: 'Deploy error',
                                description: 'Network error deploying variables',
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          Deploy to Projects
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const envContent = Object.entries(envVars)
                              .map(([key, value]) => `${key}=${value}`)
                              .join('\n');
                            const blob = new Blob([envContent], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = '.env';
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({
                              title: 'Downloaded',
                              description: '.env file downloaded successfully',
                            });
                          }}
                        >
                          Download .env
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                        <strong>📋 Common Variables:</strong>
                        <br />
                        <code>OPENAI_API_KEY</code>, <code>SUPABASE_URL</code>,{' '}
                        <code>SUPABASE_ANON_KEY</code>, <code>VITE_API_URL</code>
                        <br />
                        <code>DATABASE_URL</code>, <code>RESEND_API_KEY</code>,{' '}
                        <code>GOOGLE_CLIENT_ID</code>, <code>NODE_ENV</code>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MCP Supabase Tab */}
          <TabsContent value="mcp-supabase" className="space-y-4">
            <MCPSupabaseStatus />
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => globalThis.location.reload()}>
            Reset Changes
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
}
