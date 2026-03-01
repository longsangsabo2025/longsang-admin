import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ExternalLink,
  Globe,
  Hash,
  Megaphone,
  MousePointerClick,
  Play,
  Rocket,
  Send,
  Share2,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  name: string;
  status: 'live' | 'dev' | 'paused';
  lastDeploy: string;
  actions: {
    autoSeedSocial: boolean;
    blogPost: boolean;
    newsletter: boolean;
    telegramAnnounce: boolean;
  };
}

interface DistributionRow {
  id: string;
  source: string;
  sourceIcon: React.ReactNode;
  destinations: { label: string; enabled: boolean }[];
}

interface SocialAccount {
  platform: string;
  handle: string;
  url: string;
  metric: string;
  metricValue: string;
  lastActivity: string;
  status: 'connected' | 'disconnected' | 'pending';
  color: string;
}

interface Campaign {
  name: string;
  targetProduct: string;
  channels: string[];
  schedule: string;
  message: string;
}

// ─── Default Data ────────────────────────────────────────────────────────────

const defaultProducts: Product[] = [
  {
    name: 'YouTube Channel',
    status: 'live',
    lastDeploy: '2026-02-24 18:30',
    actions: { autoSeedSocial: true, blogPost: true, newsletter: true, telegramAnnounce: true },
  },
  {
    name: 'VT Dream Homes',
    status: 'live',
    lastDeploy: '2026-02-23 09:15',
    actions: { autoSeedSocial: true, blogPost: false, newsletter: true, telegramAnnounce: false },
  },
  {
    name: 'SABO Arena',
    status: 'dev',
    lastDeploy: '2026-02-20 14:00',
    actions: { autoSeedSocial: false, blogPost: false, newsletter: false, telegramAnnounce: true },
  },
  {
    name: 'Long Sang Forge',
    status: 'live',
    lastDeploy: '2026-02-22 11:45',
    actions: { autoSeedSocial: true, blogPost: true, newsletter: false, telegramAnnounce: true },
  },
  {
    name: 'AINewbieVN',
    status: 'live',
    lastDeploy: '2026-02-25 08:00',
    actions: { autoSeedSocial: true, blogPost: true, newsletter: true, telegramAnnounce: true },
  },
];

const defaultDistribution: DistributionRow[] = [
  {
    id: 'youtube-video',
    source: 'YouTube Video',
    sourceIcon: <Video className="h-4 w-4" />,
    destinations: [
      { label: 'Blog (AINewbie)', enabled: true },
      { label: 'Facebook', enabled: true },
      { label: 'Twitter/X', enabled: true },
      { label: 'Telegram', enabled: true },
      { label: 'TikTok', enabled: false },
      { label: 'Newsletter', enabled: true },
      { label: 'Shorts', enabled: true },
    ],
  },
  {
    id: 'blog-post',
    source: 'Blog Post',
    sourceIcon: <Globe className="h-4 w-4" />,
    destinations: [
      { label: 'Social Snippets', enabled: true },
      { label: 'Newsletter Digest', enabled: true },
      { label: 'Telegram', enabled: false },
    ],
  },
  {
    id: 'product-update',
    source: 'Product Update',
    sourceIcon: <Rocket className="h-4 w-4" />,
    destinations: [
      { label: 'Telegram Announce', enabled: true },
      { label: 'Social Post', enabled: true },
      { label: 'Blog Post', enabled: false },
      { label: 'Newsletter', enabled: false },
    ],
  },
];

const defaultSocialAccounts: SocialAccount[] = [
  {
    platform: 'YouTube',
    handle: '@dungdaydi',
    url: 'https://youtube.com/@dungdaydi',
    metric: 'Subscribers',
    metricValue: '12.4K',
    lastActivity: '2 hours ago',
    status: 'connected',
    color: 'bg-red-500',
  },
  {
    platform: 'Facebook',
    handle: 'longsang.org',
    url: 'https://facebook.com/longsang.org',
    metric: 'Followers',
    metricValue: '8.2K',
    lastActivity: '5 hours ago',
    status: 'connected',
    color: 'bg-blue-600',
  },
  {
    platform: 'Telegram',
    handle: 'longsang_community',
    url: 'https://t.me/longsang_community',
    metric: 'Members',
    metricValue: '3.1K',
    lastActivity: '1 hour ago',
    status: 'connected',
    color: 'bg-sky-500',
  },
  {
    platform: 'Twitter / X',
    handle: '@longsang_ai',
    url: 'https://x.com/longsang_ai',
    metric: 'Followers',
    metricValue: '2.7K',
    lastActivity: '12 hours ago',
    status: 'pending',
    color: 'bg-neutral-800',
  },
  {
    platform: 'TikTok',
    handle: '@longsang',
    url: 'https://tiktok.com/@longsang',
    metric: 'Followers',
    metricValue: '1.9K',
    lastActivity: '3 days ago',
    status: 'disconnected',
    color: 'bg-pink-500',
  },
];

const allProducts = ['YouTube Channel', 'VT Dream Homes', 'SABO Arena', 'Long Sang Forge', 'AINewbieVN'];
const allChannels = ['YouTube', 'Facebook', 'Telegram', 'Twitter/X', 'TikTok', 'Blog', 'Newsletter'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketingEngine() {
  // Section 1 state
  const [products, setProducts] = useState<Product[]>(defaultProducts);

  // Section 2 state
  const [distribution, setDistribution] = useState<DistributionRow[]>(defaultDistribution);

  // Section 4 state
  const [campaign, setCampaign] = useState<Campaign>({
    name: '',
    targetProduct: allProducts[0],
    channels: [],
    schedule: '',
    message: 'Hey! Check out the latest update from {{product_name}} 🚀\n\n{{product_url}}',
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleProductAction = (productIdx: number, action: keyof Product['actions']) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIdx ? { ...p, actions: { ...p.actions, [action]: !p.actions[action] } } : p
      )
    );
  };

  const toggleDistDest = (rowId: string, destIdx: number) => {
    setDistribution((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              destinations: row.destinations.map((d, i) =>
                i === destIdx ? { ...d, enabled: !d.enabled } : d
              ),
            }
          : row
      )
    );
  };

  const toggleChannel = (ch: string) => {
    setCampaign((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  // ── Status helpers ───────────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      live: { variant: 'default', label: 'Live' },
      dev: { variant: 'secondary', label: 'In Dev' },
      paused: { variant: 'outline', label: 'Paused' },
      connected: { variant: 'default', label: 'Connected' },
      disconnected: { variant: 'destructive', label: 'Disconnected' },
      pending: { variant: 'outline', label: 'Pending' },
    };
    const s = map[status] ?? { variant: 'outline' as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Marketing Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Cross-product promotion &amp; content distribution control center
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Zap className="mr-2 h-4 w-4" /> Run All Automations
        </Button>
      </div>

      <Tabs defaultValue="amplifier" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="amplifier">Launch Amplifier</TabsTrigger>
          <TabsTrigger value="distribution">Distribution Matrix</TabsTrigger>
          <TabsTrigger value="social">Social Accounts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ─────────────────── SECTION 1: PRODUCT LAUNCH AMPLIFIER ─────────────────── */}
        <TabsContent value="amplifier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" /> Product Launch Amplifier
              </CardTitle>
              <CardDescription>
                Control which marketing actions fire when a product is deployed or updated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 font-medium">Product</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Last Deploy</th>
                      <th className="pb-3 px-2 font-medium text-center">Auto-Seed Social</th>
                      <th className="pb-3 px-2 font-medium text-center">Blog Post</th>
                      <th className="pb-3 px-2 font-medium text-center">Newsletter</th>
                      <th className="pb-3 px-2 font-medium text-center">Telegram Announce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, idx) => (
                      <tr key={product.name} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{product.name}</td>
                        <td className="py-3 pr-4">{statusBadge(product.status)}</td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{product.lastDeploy}</td>
                        <td className="py-3 px-2 text-center">
                          <Switch
                            checked={product.actions.autoSeedSocial}
                            onCheckedChange={() => toggleProductAction(idx, 'autoSeedSocial')}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Switch
                            checked={product.actions.blogPost}
                            onCheckedChange={() => toggleProductAction(idx, 'blogPost')}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Switch
                            checked={product.actions.newsletter}
                            onCheckedChange={() => toggleProductAction(idx, 'newsletter')}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Switch
                            checked={product.actions.telegramAnnounce}
                            onCheckedChange={() => toggleProductAction(idx, 'telegramAnnounce')}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────── SECTION 2: CONTENT DISTRIBUTION MATRIX ──────────────── */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" /> Content Distribution Matrix
              </CardTitle>
              <CardDescription>
                Map where each content source gets distributed. Toggle destinations on/off.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {distribution.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {row.sourceIcon}
                    {row.source}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground font-normal text-sm">
                      {row.destinations.filter((d) => d.enabled).length} destinations active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {row.destinations.map((dest, dIdx) => (
                      <div
                        key={dest.label}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <Switch
                          checked={dest.enabled}
                          onCheckedChange={() => toggleDistDest(row.id, dIdx)}
                          className="scale-90"
                        />
                        <span className={dest.enabled ? '' : 'text-muted-foreground line-through'}>
                          {dest.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────── SECTION 3: SOCIAL MEDIA ACCOUNTS ────────────────────── */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultSocialAccounts.map((account) => (
              <Card key={account.platform}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${account.color}`} />
                      {account.platform}
                    </CardTitle>
                    {statusBadge(account.status)}
                  </div>
                  <CardDescription>{account.handle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{account.metric}</span>
                    <span className="font-bold text-lg">{account.metricValue}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Activity</span>
                    <span>{account.lastActivity}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Send className="mr-1 h-3 w-3" /> Post Now
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={account.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─────────────────── SECTION 4: CAMPAIGN BUILDER ─────────────────────────── */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" /> Campaign Builder
              </CardTitle>
              <CardDescription>
                Create a cross-product marketing campaign in seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Campaign Name */}
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g. SABO Arena Launch Week"
                    value={campaign.name}
                    onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  />
                </div>

                {/* Target Product */}
                <div className="space-y-2">
                  <Label htmlFor="target-product">Target Product</Label>
                  <select
                    id="target-product"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={campaign.targetProduct}
                    onChange={(e) => setCampaign({ ...campaign, targetProduct: e.target.value })}
                  >
                    {allProducts.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Channels multi-select */}
              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {allChannels.map((ch) => {
                    const selected = campaign.channels.includes(ch);
                    return (
                      <Button
                        key={ch}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleChannel(ch)}
                      >
                        {selected && <Hash className="mr-1 h-3 w-3" />}
                        {ch}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Schedule */}
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <div className="flex gap-2">
                    <Input
                      id="schedule"
                      type="datetime-local"
                      value={campaign.schedule}
                      onChange={(e) => setCampaign({ ...campaign, schedule: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCampaign({ ...campaign, schedule: '' })}
                    >
                      <Calendar className="mr-1 h-3 w-3" /> Now
                    </Button>
                  </div>
                </div>
              </div>

              {/* Message Template */}
              <div className="space-y-2">
                <Label htmlFor="message-template">Message Template</Label>
                <Textarea
                  id="message-template"
                  rows={4}
                  placeholder="Use {{product_name}}, {{product_url}} as variables..."
                  value={campaign.message}
                  onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Variables: <code className="text-primary">{'{{product_name}}'}</code>,{' '}
                  <code className="text-primary">{'{{product_url}}'}</code>,{' '}
                  <code className="text-primary">{'{{date}}'}</code>
                </p>
              </div>

              {/* Preview & Launch */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="lg"
                  disabled={!campaign.name || campaign.channels.length === 0}
                  onClick={() => {
                    alert(
                      `🚀 Campaign "${campaign.name}" launched!\nProduct: ${campaign.targetProduct}\nChannels: ${campaign.channels.join(', ')}\nSchedule: ${campaign.schedule || 'Now'}`
                    );
                  }}
                >
                  <Play className="mr-2 h-4 w-4" /> Launch Campaign
                </Button>
                <span className="text-sm text-muted-foreground">
                  {campaign.channels.length} channel{campaign.channels.length !== 1 && 's'} selected
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────── SECTION 5: ANALYTICS ────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Top-level metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Total Reach (This Week)', value: '47.2K', icon: Users, delta: '+12%' },
              { label: 'Total Clicks', value: '3,841', icon: MousePointerClick, delta: '+8%' },
              { label: 'Top Channel', value: 'YouTube', icon: Video, delta: '54% of traffic' },
              { label: 'Cross-Referrals', value: '1,204', icon: TrendingUp, delta: '+23%' },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{m.label}</p>
                      <p className="text-2xl font-bold">{m.value}</p>
                    </div>
                    <m.icon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {m.delta}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Clicks per product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Clicks per Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { product: 'AINewbieVN', clicks: 1420, pct: 37 },
                  { product: 'YouTube Channel', clicks: 980, pct: 26 },
                  { product: 'VT Dream Homes', clicks: 640, pct: 17 },
                  { product: 'Long Sang Forge', clicks: 510, pct: 13 },
                  { product: 'SABO Arena', clicks: 291, pct: 7 },
                ].map((row) => (
                  <div key={row.product} className="flex items-center gap-4">
                    <span className="w-36 text-sm font-medium">{row.product}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm text-muted-foreground">
                      {row.clicks.toLocaleString()} clicks
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cross-product referral tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" /> Cross-Product Referral Tracking
              </CardTitle>
              <CardDescription>
                Which products are driving traffic to other products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 font-medium">Source</th>
                      <th className="pb-3 pr-4 font-medium">Destination</th>
                      <th className="pb-3 pr-4 font-medium text-right">Referrals</th>
                      <th className="pb-3 font-medium text-right">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { src: 'YouTube Channel', dest: 'AINewbieVN', refs: 412, conv: '8.2%' },
                      { src: 'AINewbieVN', dest: 'VT Dream Homes', refs: 287, conv: '5.6%' },
                      { src: 'YouTube Channel', dest: 'Long Sang Forge', refs: 194, conv: '4.1%' },
                      { src: 'Long Sang Forge', dest: 'SABO Arena', refs: 156, conv: '3.8%' },
                      { src: 'VT Dream Homes', dest: 'YouTube Channel', refs: 98, conv: '2.4%' },
                      { src: 'SABO Arena', dest: 'AINewbieVN', refs: 57, conv: '1.9%' },
                    ].map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 pr-4">{r.src}</td>
                        <td className="py-3 pr-4 flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" /> {r.dest}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium">{r.refs.toLocaleString()}</td>
                        <td className="py-3 text-right text-muted-foreground">{r.conv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
