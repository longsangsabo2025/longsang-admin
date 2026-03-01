import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  PlayCircle,
  Brain,
  Mic,
  Share2,
  Server,
  CreditCard,
  Save,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Zap,
  RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppSetting {
  key: string;
  value: string;
  category: string;
  is_secret: boolean;
  updated_at: string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  isSecret: boolean;
  defaultValue?: string;
  helpText?: string;
  helpUrl?: string;
}

interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  fields: FieldDef[];
  testButton?: {
    label: string;
    action: (values: Record<string, string>) => Promise<{ ok: boolean; message: string }>;
  };
  extraContent?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Field definitions per category
// ---------------------------------------------------------------------------

const SECTIONS: SectionDef[] = [
  {
    id: 'youtube',
    label: 'YouTube API',
    icon: <PlayCircle className="h-4 w-4" />,
    description: 'YouTube Data API v3 & OAuth2 credentials for channel management',
    fields: [
      {
        key: 'YOUTUBE_CLIENT_ID',
        label: 'Client ID',
        placeholder: 'xxxx.apps.googleusercontent.com',
        isSecret: false,
        helpText: 'From Google Cloud Console > APIs & Services > Credentials',
        helpUrl: 'https://console.cloud.google.com/apis/credentials',
      },
      {
        key: 'YOUTUBE_CLIENT_SECRET',
        label: 'Client Secret',
        placeholder: 'GOCSPX-...',
        isSecret: true,
        helpText: 'OAuth 2.0 Client Secret',
      },
      {
        key: 'YOUTUBE_REFRESH_TOKEN',
        label: 'Refresh Token',
        placeholder: '1//0...',
        isSecret: true,
        helpText: 'Long-lived refresh token from OAuth2 flow',
      },
    ],
    testButton: {
      label: 'Test Connection',
      action: async () => {
        try {
          const res = await fetch('/api/youtube-crew/test-youtube-auth');
          if (res.ok) return { ok: true, message: 'YouTube API connected successfully' };
          return { ok: false, message: `YouTube API error: ${res.status}` };
        } catch {
          return { ok: false, message: 'Could not reach test endpoint' };
        }
      },
    },
  },
  {
    id: 'ai-models',
    label: 'AI Models',
    icon: <Brain className="h-4 w-4" />,
    description: 'API keys for OpenAI, Google Gemini, and default model selection',
    fields: [
      {
        key: 'OPENAI_API_KEY',
        label: 'OpenAI API Key',
        placeholder: 'sk-proj-...',
        isSecret: true,
        helpText: 'Get from platform.openai.com/api-keys',
        helpUrl: 'https://platform.openai.com/api-keys',
      },
      {
        key: 'GEMINI_API_KEY',
        label: 'Google Gemini API Key',
        placeholder: 'AIza...',
        isSecret: true,
        helpText: 'Get from Google AI Studio',
        helpUrl: 'https://aistudio.google.com/app/apikey',
      },
      {
        key: 'DEFAULT_AI_MODEL',
        label: 'Default AI Model',
        placeholder: 'gpt-4o-mini',
        isSecret: false,
        defaultValue: 'gpt-4o-mini',
        helpText: 'Model used by default across all agents',
      },
    ],
    testButton: {
      label: 'Test API Keys',
      action: async (values) => {
        const results: string[] = [];
        if (values['OPENAI_API_KEY']) {
          try {
            const r = await fetch('https://api.openai.com/v1/models', {
              headers: { Authorization: `Bearer ${values['OPENAI_API_KEY']}` },
            });
            results.push(r.ok ? 'OpenAI: Connected' : 'OpenAI: Invalid key');
          } catch {
            results.push('OpenAI: Network error');
          }
        }
        if (values['GEMINI_API_KEY']) {
          try {
            const r = await fetch(
              `https://generativelanguage.googleapis.com/v1/models?key=${values['GEMINI_API_KEY']}`
            );
            results.push(r.ok ? 'Gemini: Connected' : 'Gemini: Invalid key');
          } catch {
            results.push('Gemini: Network error');
          }
        }
        if (results.length === 0) return { ok: false, message: 'No API keys to test' };
        const allOk = results.every((r) => r.includes('Connected'));
        return { ok: allOk, message: results.join(' | ') };
      },
    },
  },
  {
    id: 'tts',
    label: 'TTS & Voice',
    icon: <Mic className="h-4 w-4" />,
    description: 'Text-to-Speech server, voice configuration, and audio parameters',
    fields: [
      {
        key: 'TTS_SERVER_URL',
        label: 'TTS Server URL',
        placeholder: 'http://localhost:8100',
        isSecret: false,
        defaultValue: 'http://localhost:8100',
      },
      {
        key: 'TTS_VOICE_REF_PATH',
        label: 'Voice Reference File',
        placeholder: 'D:/voices/reference.wav',
        isSecret: false,
        helpText: 'Path to the voice reference audio file for cloning',
      },
      {
        key: 'TTS_SPEED',
        label: 'Speech Speed',
        placeholder: '1.0',
        isSecret: false,
        defaultValue: '1.0',
        helpText: 'Speed multiplier (0.5 = slow, 1.0 = normal, 2.0 = fast)',
      },
      {
        key: 'TTS_CHUNK_SIZE',
        label: 'Chunk Size',
        placeholder: '250',
        isSecret: false,
        defaultValue: '250',
        helpText: 'Characters per TTS chunk (100-500)',
      },
    ],
    testButton: {
      label: 'Test TTS Server',
      action: async (values) => {
        const url = values['TTS_SERVER_URL'] || 'http://localhost:8100';
        try {
          const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
          return r.ok
            ? { ok: true, message: 'TTS server is running' }
            : { ok: false, message: `TTS server returned ${r.status}` };
        } catch {
          return { ok: false, message: 'TTS server unreachable' };
        }
      },
    },
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: <Share2 className="h-4 w-4" />,
    description: 'Credentials for Telegram (admin alerts + seeding), Twitter, Facebook, Reddit, and Forlike',
    fields: [
      {
        key: 'TELEGRAM_BOT_TOKEN',
        label: 'Telegram Admin Bot Token',
        placeholder: '123456:ABC-...',
        isSecret: true,
        helpText: 'Bot for pipeline alerts to admin. From @BotFather',
      },
      {
        key: 'TELEGRAM_ADMIN_CHAT_ID',
        label: 'Telegram Admin Chat ID',
        placeholder: '123456789',
        isSecret: false,
        helpText: 'Your personal chat ID for pipeline notifications (not the seeding channel)',
      },
      {
        key: 'TELEGRAM_SEED_BOT_TOKEN',
        label: 'Telegram Seed Bot Token',
        placeholder: '123456:ABC-...',
        isSecret: true,
        helpText: 'Bot for auto-seeding channel posts. From @BotFather',
      },
      {
        key: 'TELEGRAM_SEED_CHANNEL_ID',
        label: 'Telegram Seed Channel ID',
        placeholder: '-1001234567890',
        isSecret: false,
      },
      {
        key: 'TWITTER_BEARER_TOKEN',
        label: 'Twitter/X Bearer Token',
        placeholder: 'AAAA...',
        isSecret: true,
        helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
      },
      {
        key: 'FB_PAGE_TOKEN',
        label: 'Facebook Page Token',
        placeholder: 'EAA...',
        isSecret: true,
      },
      {
        key: 'FB_PAGE_ID',
        label: 'Facebook Page ID',
        placeholder: '123456789',
        isSecret: false,
      },
      {
        key: 'REDDIT_ACCESS_TOKEN',
        label: 'Reddit Access Token',
        placeholder: 'eyJ...',
        isSecret: true,
        helpUrl: 'https://www.reddit.com/prefs/apps',
      },
      {
        key: 'REDDIT_SUBREDDIT',
        label: 'Reddit Subreddit',
        placeholder: 'your_subreddit',
        isSecret: false,
      },
      {
        key: 'FORLIKE_TOKEN',
        label: 'Forlike Token',
        placeholder: 'flk_...',
        isSecret: true,
      },
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    icon: <Server className="h-4 w-4" />,
    description: 'Supabase, n8n, ComfyUI, and Langfuse connections',
    fields: [
      {
        key: 'SUPABASE_URL',
        label: 'Supabase URL',
        placeholder: 'https://xxxxx.supabase.co',
        isSecret: false,
        helpUrl: 'https://supabase.com/dashboard/project/_/settings/api',
      },
      {
        key: 'SUPABASE_ANON_KEY',
        label: 'Supabase Anon Key',
        placeholder: 'eyJhbGciOiJ...',
        isSecret: true,
      },
      {
        key: 'N8N_URL',
        label: 'n8n URL',
        placeholder: 'http://localhost:5678',
        isSecret: false,
        defaultValue: 'http://localhost:5678',
      },
      {
        key: 'COMFYUI_URL',
        label: 'ComfyUI URL',
        placeholder: 'http://localhost:8188',
        isSecret: false,
        defaultValue: 'http://localhost:8188',
      },
      {
        key: 'LANGFUSE_PUBLIC_KEY',
        label: 'Langfuse Public Key',
        placeholder: 'pk-lf-...',
        isSecret: false,
        helpUrl: 'https://cloud.langfuse.com',
      },
      {
        key: 'LANGFUSE_SECRET_KEY',
        label: 'Langfuse Secret Key',
        placeholder: 'sk-lf-...',
        isSecret: true,
      },
    ],
    testButton: {
      label: 'Test Infrastructure',
      action: async (values) => {
        const results: string[] = [];
        const n8n = values['N8N_URL'] || 'http://localhost:5678';
        try {
          const r = await fetch(`${n8n}/healthz`, { signal: AbortSignal.timeout(5000) });
          results.push(r.ok ? 'n8n: Running' : `n8n: ${r.status}`);
        } catch {
          results.push('n8n: Unreachable');
        }
        const comfy = values['COMFYUI_URL'] || 'http://localhost:8188';
        try {
          const r = await fetch(`${comfy}/system_stats`, { signal: AbortSignal.timeout(5000) });
          results.push(r.ok ? 'ComfyUI: Running' : `ComfyUI: ${r.status}`);
        } catch {
          results.push('ComfyUI: Unreachable');
        }
        return {
          ok: results.some((r) => r.includes('Running')),
          message: results.join(' | '),
        };
      },
    },
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Stripe and VNPay payment gateway credentials',
    fields: [
      {
        key: 'STRIPE_SECRET_KEY',
        label: 'Stripe Secret Key',
        placeholder: 'sk_live_...',
        isSecret: true,
        helpUrl: 'https://dashboard.stripe.com/apikeys',
      },
      {
        key: 'STRIPE_PUBLISHABLE_KEY',
        label: 'Stripe Publishable Key',
        placeholder: 'pk_live_...',
        isSecret: false,
      },
      {
        key: 'VNPAY_TMN_CODE',
        label: 'VNPay TMN Code',
        placeholder: 'XXXXXX',
        isSecret: false,
        helpUrl: 'https://sandbox.vnpayment.vn/merchantv2/',
      },
      {
        key: 'VNPAY_HASH_SECRET',
        label: 'VNPay Hash Secret',
        placeholder: 'XXXXXXXXXXXXXXXXXX',
        isSecret: true,
      },
    ],
  },
];

const ALL_FIELD_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

const FIELD_METADATA: Record<string, { category: string; isSecret: boolean }> = {};
for (const section of SECTIONS) {
  for (const field of section.fields) {
    FIELD_METADATA[field.key] = { category: section.id, isSecret: field.isSecret };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskSecret(value: string): string {
  if (!value || value.length <= 4) return value ? '****' : '';
  return '*'.repeat(Math.min(value.length - 4, 20)) + value.slice(-4);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SecretField({
  field,
  value,
  onChange,
}: Readonly<{
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}>) {
  const [visible, setVisible] = useState(false);
  const configured = value && value.length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{field.label}</Label>
        <div className="flex items-center gap-2">
          {configured ? (
            <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Configured
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Not set
            </Badge>
          )}
        </div>
      </div>
      <div className="relative">
        <Input
          type={field.isSecret && !visible ? 'password' : 'text'}
          placeholder={field.placeholder}
          value={field.isSecret && !visible && configured ? maskSecret(value) : value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (field.isSecret && !visible) setVisible(true);
          }}
          className="font-mono text-sm pr-10"
        />
        {field.isSecret && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
      {(field.helpText || field.helpUrl) && (
        <p className="text-xs text-muted-foreground">
          {field.helpText}
          {field.helpUrl && (
            <>
              {field.helpText ? ' ' : ''}
              <a
                href={field.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-0.5"
              >
                Open Console <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function SliderField({
  field,
  value,
  onChange,
  min,
  max,
  step,
}: Readonly<{
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
}>) {
  const numValue = Number.parseFloat(value) || Number.parseFloat(field.defaultValue || '1');
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{field.label}</Label>
        <span className="text-sm font-mono text-muted-foreground">{numValue}</span>
      </div>
      <Slider
        value={[numValue]}
        onValueChange={([v]) => onChange(String(v))}
        min={min}
        max={max}
        step={step}
      />
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
    </div>
  );
}

function SectionCard({
  section,
  values,
  onChange,
  onTest,
  testing,
}: Readonly<{
  section: SectionDef;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onTest: () => void;
  testing: boolean;
}>) {
  const [open, setOpen] = useState(true);
  const configuredCount = section.fields.filter((f) => values[f.key]?.length > 0).length;
  const totalCount = section.fields.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {section.icon}
                    {section.label}
                  </CardTitle>
                  <CardDescription className="mt-1">{section.description}</CardDescription>
                </div>
              </div>
              <Badge
                variant={configuredCount === totalCount ? 'default' : 'outline'}
                className={
                  configuredCount === totalCount
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
              >
                {configuredCount}/{totalCount} configured
              </Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-5 pt-2">
            {section.fields.map((field) => {
              if (field.key === 'TTS_SPEED') {
                return (
                  <SliderField
                    key={field.key}
                    field={field}
                    value={values[field.key] || field.defaultValue || '1.0'}
                    onChange={(v) => onChange(field.key, v)}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                );
              }
              if (field.key === 'TTS_CHUNK_SIZE') {
                return (
                  <SliderField
                    key={field.key}
                    field={field}
                    value={values[field.key] || field.defaultValue || '250'}
                    onChange={(v) => onChange(field.key, v)}
                    min={100}
                    max={500}
                    step={10}
                  />
                );
              }
              if (field.key === 'DEFAULT_AI_MODEL') {
                return (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-sm font-medium">{field.label}</Label>
                    <Select
                      value={values[field.key] || field.defaultValue || 'gpt-4o-mini'}
                      onValueChange={(v) => onChange(field.key, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Premium)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Balanced)</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</SelectItem>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                );
              }
              return (
                <SecretField
                  key={field.key}
                  field={field}
                  value={values[field.key] || ''}
                  onChange={(v) => onChange(field.key, v)}
                />
              );
            })}

            {section.testButton && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={onTest}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {section.testButton.label}
              </Button>
            )}

            {section.id === 'youtube' && (
              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                <p className="font-medium">How to get YouTube OAuth2 credentials:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>
                    Go to{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Create OAuth 2.0 Client ID (Web application)</li>
                  <li>Add redirect URI: <code>http://localhost:8080/oauth2callback</code></li>
                  <li>Enable YouTube Data API v3</li>
                  <li>Run the OAuth flow to obtain refresh token</li>
                </ol>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SettingsManager() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSection, setTestingSection] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load all settings from Supabase
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', ALL_FIELD_KEYS);

      if (error) {
        if (error.code === '42P01') {
          toast({
            title: 'Table not found',
            description: 'Run the migration 20260225_app_settings.sql first',
            variant: 'destructive',
          });
        } else {
          console.error('Load settings error:', error);
        }
        setLoading(false);
        return;
      }

      const loaded: Record<string, string> = {};
      (data as AppSetting[])?.forEach((row) => {
        loaded[row.key] = row.value || '';
      });

      // Fill defaults for fields that have them
      SECTIONS.forEach((s) =>
        s.fields.forEach((f) => {
          if (f.defaultValue && !loaded[f.key]) {
            loaded[f.key] = f.defaultValue;
          }
        })
      );

      setValues(loaded);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const buildSettingsRows = useCallback(() => {
    const now = new Date().toISOString();
    return Object.entries(values)
      .filter(([key]) => ALL_FIELD_KEYS.includes(key))
      .map(([key, value]) => ({
        key,
        value,
        category: FIELD_METADATA[key]?.category || 'unknown',
        is_secret: FIELD_METADATA[key]?.isSecret || false,
        updated_at: now,
      }));
  }, [values]);

  // Save all settings to Supabase
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const rows = buildSettingsRows();
      const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });

      if (error) throw error;

      setLastSaved(new Date().toISOString());
      toast({
        title: 'Settings Saved',
        description: `${rows.length} settings saved to database`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Save Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Test a section's connectivity
  const handleTest = async (section: SectionDef) => {
    if (!section.testButton) return;
    setTestingSection(section.id);
    try {
      const result = await section.testButton.action(values);
      toast({
        title: result.ok ? 'Test Passed' : 'Test Failed',
        description: result.message,
        variant: result.ok ? 'default' : 'destructive',
      });
    } catch {
      toast({
        title: 'Test Error',
        description: 'Unexpected error during test',
        variant: 'destructive',
      });
    } finally {
      setTestingSection(null);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys & Credentials</h1>
          <p className="text-muted-foreground mt-1">
            Manage all API keys and service credentials from one place. No more editing .env files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reload
          </Button>
          <Button onClick={handleSaveAll} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {lastSaved && (
        <p className="text-xs text-muted-foreground">
          Last saved: {new Date(lastSaved).toLocaleString()}
        </p>
      )}

      {/* Tabs */}
      <Tabs defaultValue="youtube" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {SECTIONS.map((s) => {
            const configured = s.fields.filter((f) => values[f.key]?.length > 0).length;
            const total = s.fields.length;
            return (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-3 py-1.5 rounded-md text-sm"
              >
                <span className="flex items-center gap-1.5">
                  {s.icon}
                  {s.label}
                  {configured === total && total > 0 && (
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  )}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            <SectionCard
              section={section}
              values={values}
              onChange={handleFieldChange}
              onTest={() => handleTest(section)}
              testing={testingSection === section.id}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          size="lg"
          className="shadow-lg"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}

export default SettingsManager;
