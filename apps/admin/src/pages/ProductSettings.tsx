// ================================================
// PRODUCT SETTINGS PAGE
// ================================================
// Unified configuration for ALL products from one UI

import { useState, useEffect, useCallback } from 'react';
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
  Save,
  Loader2,
  Youtube,
  Home,
  Gamepad2,
  Hammer,
  GraduationCap,
  Server,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'masked' | 'number' | 'toggle' | 'select' | 'readonly';
  default?: string | number | boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

interface ProductCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  sections: {
    title: string;
    description?: string;
    fields: SettingField[];
  }[];
}

// ---------------------------------------------------------------------------
// Product Definitions
// ---------------------------------------------------------------------------

const PRODUCTS: ProductCategory[] = [
  {
    id: 'youtube',
    label: 'YouTube Pipeline',
    icon: <Youtube className="h-4 w-4" />,
    sections: [
      {
        title: 'AI / LLM Configuration',
        description: 'API keys and model settings for content generation',
        fields: [
          { key: 'youtube.gemini_api_key', label: 'Gemini API Key', type: 'masked', placeholder: 'AIza...' },
          {
            key: 'youtube.default_llm_model',
            label: 'Default LLM Model',
            type: 'select',
            default: 'gemini-2.0-flash',
            options: [
              { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
              { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
              { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
            ],
          },
          { key: 'youtube.tts_server_url', label: 'TTS Server URL', type: 'text', default: 'http://localhost:8100', placeholder: 'http://localhost:8100' },
          { key: 'youtube.voice_ref_path', label: 'Voice Reference File Path', type: 'text', placeholder: '/path/to/voice_ref.wav' },
          { key: 'youtube.max_cost_per_video', label: 'Max Cost Per Video ($)', type: 'number', default: 0.5 },
        ],
      },
      {
        title: 'YouTube Upload',
        description: 'OAuth credentials and auto-upload settings',
        fields: [
          { key: 'youtube.auto_upload', label: 'Auto-upload to YouTube', type: 'toggle', default: false },
          { key: 'youtube.oauth_client_id', label: 'YouTube OAuth Client ID', type: 'masked', placeholder: '...' },
          { key: 'youtube.oauth_client_secret', label: 'YouTube OAuth Client Secret', type: 'masked', placeholder: '...' },
          { key: 'youtube.oauth_refresh_token', label: 'YouTube OAuth Refresh Token', type: 'masked', placeholder: '...' },
        ],
      },
      {
        title: 'Notifications & Repurpose',
        fields: [
          { key: 'youtube.content_repurpose', label: 'Content Repurpose Enabled', type: 'toggle', default: false },
          { key: 'youtube.telegram_enabled', label: 'Telegram Notifications Enabled', type: 'toggle', default: false },
          { key: 'youtube.telegram_chat_id', label: 'Telegram Admin Chat ID', type: 'text', placeholder: '-100...' },
        ],
      },
    ],
  },
  {
    id: 'vt_dream_homes',
    label: 'VT Dream Homes',
    icon: <Home className="h-4 w-4" />,
    sections: [
      {
        title: 'VT Dream Homes — vungtauland.store',
        description: 'Real estate platform configuration',
        fields: [
          { key: 'vtdream.supabase_url', label: 'Supabase URL', type: 'text', placeholder: 'https://xxx.supabase.co' },
          { key: 'vtdream.vercel_url', label: 'Vercel Deploy URL', type: 'text', placeholder: 'https://vungtauland.store' },
          { key: 'vtdream.ga_tracking_id', label: 'GA Tracking ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
          { key: 'vtdream.sentry_dsn', label: 'Sentry DSN', type: 'text', placeholder: 'https://xxx@sentry.io/xxx' },
          { key: 'vtdream.auto_seed', label: 'Auto-seed Enabled', type: 'toggle', default: false },
          { key: 'vtdream.seed_count', label: 'Seed Count', type: 'number', default: 10 },
        ],
      },
    ],
  },
  {
    id: 'sabo_arena',
    label: 'SABO Arena',
    icon: <Gamepad2 className="h-4 w-4" />,
    sections: [
      {
        title: 'SABO Arena — saboarena.com',
        description: 'Gaming & tournament platform configuration',
        fields: [
          { key: 'sabo.supabase_url', label: 'Supabase URL (separate instance)', type: 'text', placeholder: 'https://xxx.supabase.co' },
          { key: 'sabo.vercel_url', label: 'Vercel Deploy URL', type: 'text', placeholder: 'https://saboarena.com' },
          { key: 'sabo.ga_tracking_id', label: 'GA Tracking ID', type: 'text', default: 'G-96E9M5KCFY' },
          { key: 'sabo.sentry_dsn', label: 'Sentry DSN', type: 'text', placeholder: 'https://xxx@sentry.io/xxx', description: 'Currently missing — needs setup' },
          { key: 'sabo.momo_partner_code', label: 'MoMo Partner Code', type: 'masked', placeholder: 'MoMo partner code' },
          { key: 'sabo.momo_access_key', label: 'MoMo Access Key', type: 'masked', placeholder: 'MoMo access key' },
          { key: 'sabo.momo_secret_key', label: 'MoMo Secret Key', type: 'masked', placeholder: 'MoMo secret key' },
        ],
      },
    ],
  },
  {
    id: 'long_sang_forge',
    label: 'Long Sang Forge',
    icon: <Hammer className="h-4 w-4" />,
    sections: [
      {
        title: 'Long Sang Forge — longsang.org',
        description: 'SaaS toolkit & forge platform',
        fields: [
          { key: 'longsang.supabase_url', label: 'Supabase URL', type: 'text', placeholder: 'https://xxx.supabase.co' },
          { key: 'longsang.stripe_publishable_key', label: 'Stripe Publishable Key', type: 'masked', placeholder: 'pk_live_...' },
          { key: 'longsang.stripe_secret_key', label: 'Stripe Secret Key', type: 'masked', placeholder: 'sk_live_...' },
          { key: 'longsang.vnpay_merchant_id', label: 'VNPay Merchant ID', type: 'masked', placeholder: 'Merchant ID' },
          { key: 'longsang.vnpay_hash_secret', label: 'VNPay Hash Secret', type: 'masked', placeholder: 'Hash secret' },
          { key: 'longsang.vnpay_payment_url', label: 'VNPay Payment URL', type: 'text', placeholder: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html' },
          { key: 'longsang.ga_tracking_id', label: 'GA Tracking ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
          { key: 'longsang.domain_status', label: 'Domain Setup Status', type: 'text', placeholder: 'active / pending / error' },
        ],
      },
    ],
  },
  {
    id: 'ainewbie',
    label: 'AINewbieVN',
    icon: <GraduationCap className="h-4 w-4" />,
    sections: [
      {
        title: 'AINewbieVN — ainewbievn.shop',
        description: 'AI learning platform configuration',
        fields: [
          { key: 'ainewbie.supabase_url', label: 'Supabase URL', type: 'text', placeholder: 'https://xxx.supabase.co' },
          { key: 'ainewbie.supabase_anon_key', label: 'Supabase Anon Key', type: 'masked', placeholder: 'eyJ...' },
          { key: 'ainewbie.vercel_deploy_status', label: 'Vercel Deploy Status', type: 'text', placeholder: 'deployed / building / error' },
          { key: 'ainewbie.ga_tracking_id', label: 'GA Tracking ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
          { key: 'ainewbie.deploy_command', label: 'Deploy Command', type: 'readonly', default: 'npx vercel --prod' },
        ],
      },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: <Server className="h-4 w-4" />,
    sections: [
      {
        title: 'Shared Infrastructure',
        description: 'Core services and shared resources',
        fields: [
          { key: 'infra.supabase_shared_url', label: 'Supabase Shared Instance URL', type: 'text', placeholder: 'https://xxx.supabase.co' },
          { key: 'infra.n8n_url', label: 'n8n URL', type: 'text', default: 'http://localhost:5678' },
          { key: 'infra.voxcpm_tts_url', label: 'VoxCPM TTS URL', type: 'text', default: 'http://localhost:8100' },
          { key: 'infra.comfyui_url', label: 'ComfyUI URL', type: 'text', default: 'http://localhost:8188' },
          { key: 'infra.api_gateway_url', label: 'API Gateway URL', type: 'text', default: 'http://localhost:3001' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Masked Input Component
// ---------------------------------------------------------------------------

function MaskedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'idle' | 'checking' | 'ok' | 'error' }) {
  if (status === 'idle') return null;
  if (status === 'checking') return <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin mr-1" />Checking…</Badge>;
  if (status === 'ok') return <Badge className="bg-green-600"><Wifi className="h-3 w-3 mr-1" />Connected</Badge>;
  return <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" />Failed</Badge>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProductSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string | number | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'idle' | 'checking' | 'ok' | 'error'>>({});

  // ---- Load from Supabase app_settings (key-value with category) ----
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to load product settings:', error);
        // Fall through — use defaults
      }

      const loaded: Record<string, string | number | boolean> = {};

      if (data) {
        for (const row of data as any[]) {
          // Each row has: key, value, category
          loaded[row.key] = row.value;
        }
      }

      // Apply defaults for any field not yet in the DB
      for (const product of PRODUCTS) {
        for (const section of product.sections) {
          for (const field of section.fields) {
            if (loaded[field.key] === undefined && field.default !== undefined) {
              loaded[field.key] = String(field.default);
            }
          }
        }
      }

      setSettings(loaded);
    } catch (err) {
      console.error('Error loading product settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ---- Persist a single value ----
  const updateSetting = (key: string, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ---- Save an entire category ----
  const saveCategory = async (categoryId: string) => {
    setSaving(categoryId);
    try {
      const product = PRODUCTS.find((p) => p.id === categoryId);
      if (!product) throw new Error('Unknown product');

      const rows = product.sections.flatMap((s) =>
        s.fields.map((f) => ({
          key: f.key,
          value: String(settings[f.key] ?? f.default ?? ''),
          category: categoryId,
          updated_at: new Date().toISOString(),
        })),
      );

      const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' } as any);

      if (error) throw error;

      toast({ title: '✅ Saved', description: `${product.label} settings saved successfully.` });
    } catch (err: any) {
      console.error('Save failed:', err);
      toast({ title: '❌ Save Failed', description: err.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  // ---- Test Connection (for URL fields) ----
  const testConnection = async (key: string) => {
    const url = String(settings[key] ?? '');
    if (!url) {
      toast({ title: 'No URL', description: 'Enter a URL first.', variant: 'destructive' });
      return;
    }
    setConnectionStatus((prev) => ({ ...prev, [key]: 'checking' }));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(url, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeout);
      // no-cors always gives opaque response — treat as success if no error thrown
      setConnectionStatus((prev) => ({ ...prev, [key]: 'ok' }));
      toast({ title: '✅ Reachable', description: `${url} responded.` });
    } catch {
      setConnectionStatus((prev) => ({ ...prev, [key]: 'error' }));
      toast({ title: '❌ Unreachable', description: `Could not reach ${url}`, variant: 'destructive' });
    }
  };

  // ---- Render a single field ----
  const renderField = (field: SettingField) => {
    const value = settings[field.key] ?? field.default ?? '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <div className="flex gap-2 items-center">
              <Input
                id={field.key}
                value={String(value)}
                onChange={(e) => updateSetting(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
              {(field.key.includes('url') || field.key.includes('_url')) && (
                <>
                  <Button variant="outline" size="sm" onClick={() => testConnection(field.key)}>
                    <RefreshCw className="h-4 w-4 mr-1" />Test
                  </Button>
                  <StatusBadge status={connectionStatus[field.key] ?? 'idle'} />
                </>
              )}
            </div>
          </div>
        );

      case 'masked':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <MaskedInput
              value={String(value)}
              onChange={(v) => updateSetting(field.key, v)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              value={String(value)}
              onChange={(e) => updateSetting(field.key, Number(e.target.value))}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'toggle':
        return (
          <div key={field.key} className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            </div>
            <Switch
              id={field.key}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => updateSetting(field.key, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select value={String(value)} onValueChange={(v) => updateSetting(field.key, v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'readonly':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input id={field.key} value={String(value)} readOnly className="bg-muted cursor-not-allowed" />
          </div>
        );

      default:
        return null;
    }
  };

  // ---- Infrastructure: "Test All Connections" ----
  const infraUrlKeys = PRODUCTS.find((p) => p.id === 'infrastructure')
    ?.sections.flatMap((s) => s.fields.filter((f) => f.key.includes('url')).map((f) => f.key)) ?? [];

  const testAllInfra = async () => {
    for (const key of infraUrlKeys) {
      await testConnection(key);
    }
  };

  // =========================================================================
  // Render
  // =========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Product Settings</h1>
        <p className="text-muted-foreground">
          Configure every product in the ecosystem from a single dashboard.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="youtube" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {PRODUCTS.map((product) => (
            <TabsTrigger key={product.id} value={product.id} className="gap-1">
              {product.icon}
              {product.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PRODUCTS.map((product) => (
          <TabsContent key={product.id} value={product.id} className="space-y-6">
            {product.sections.map((section, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && <CardDescription>{section.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.fields.map((field) => renderField(field))}
                </CardContent>
              </Card>
            ))}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button onClick={() => saveCategory(product.id)} disabled={saving === product.id}>
                {saving === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save {product.label}
              </Button>

              {product.id === 'infrastructure' && (
                <Button variant="outline" onClick={testAllInfra}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test All Connections
                </Button>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
