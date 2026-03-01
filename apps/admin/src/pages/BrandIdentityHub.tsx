/**
 * Brand Identity Hub
 * Complete brand management system with AI-powered content generation
 * 
 * Features:
 * 1. Brand Assets Generator - AI profile images, logos
 * 2. Bio & Social Content Writer
 * 3. Go-to-Market Strategy Planner
 * 4. Social Platform Setup Guide
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Palette,
  FileText,
  Target,
  Share2,
  Globe,
  Camera,
  Wand2,
  Copy,
  Check,
  ExternalLink,
  Rocket,
  TrendingUp,
  Calendar,
  MessageSquare,
  Zap,
  Crown,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

// Custom icons for social platforms (replacing deprecated ones)
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// Import Social Media Kit
import { TWITTER, LINKEDIN, INDIE_HACKERS } from '@/brain/data/social-media-kit';

// Brand Profile Data (from codebase research)
const BRAND_PROFILE = {
  personal: {
    name: 'Long Sang',
    email: 'longsangsabo1@gmail.com',
    github: 'longsangautomation-max',
    role: 'Solo Founder & Full-Stack Developer',
    location: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
    languages: ['Vietnamese (native)', 'English (fluent)'],
  },
  brand: {
    name: 'LongSang Automation',
    tagline: 'AI-Powered Automation for Solo Founders',
    mission: 'Democratize marketing automation for indie hackers and solo founders',
    vision: 'Every solo founder can compete with enterprise marketing teams',
    values: [
      'Automation First',
      'Build in Public',
      'Community Driven',
      'Open Source When Possible',
    ],
  },
  products: [
    { name: 'LongSang Forge', status: 'Beta', revenueGoal: 24000, emoji: '🔨' },
    { name: 'SABO Arena', status: 'Production', revenueGoal: 30000, emoji: '🎱' },
    { name: 'LS Secretary', status: 'Development', revenueGoal: 60000, emoji: '🤖' },
    { name: 'VungTauLand', status: 'Development', revenueGoal: 18000, emoji: '🏠' },
  ],
  skills: {
    technical: ['React/TypeScript', 'Flutter/Dart', 'TailwindCSS', 'Node.js', 'PostgreSQL', 'Supabase'],
    ai: ['OpenAI GPT-4', 'Anthropic Claude', 'Google Gemini'],
    marketing: ['Content marketing', 'Social media automation', 'Email campaigns', 'SEO'],
  },
};

// Social Platform Templates
const SOCIAL_PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: TwitterIcon,
    priority: 1,
    color: 'bg-black',
    setupUrl: 'https://twitter.com/i/flow/signup',
    bioMaxLength: 160,
    bestFor: 'Build in Public, Dev Community, Quick Updates',
    contentTypes: ['Threads', 'Quick tips', 'Progress updates', 'Memes'],
    postingFrequency: 'Daily',
    suggestedHandle: '@LongSangDev',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedinIcon,
    priority: 4,
    color: 'bg-blue-600',
    setupUrl: 'https://www.linkedin.com/signup',
    bioMaxLength: 2000,
    bestFor: 'Professional Networking, B2B, Enterprise clients',
    contentTypes: ['Long-form posts', 'Case studies', 'Company updates'],
    postingFrequency: '2-3x/week',
    suggestedHandle: 'longsang-automation',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: YoutubeIcon,
    priority: 3,
    color: 'bg-red-600',
    setupUrl: 'https://www.youtube.com/create_channel',
    bioMaxLength: 1000,
    bestFor: 'Long-form tutorials, Product demos, Vlogs',
    contentTypes: ['Tutorials', 'Product demos', 'Behind the scenes'],
    postingFrequency: 'Weekly',
    suggestedHandle: '@LongSangAutomation',
  },
  {
    id: 'indiehackers',
    name: 'IndieHackers',
    icon: Rocket,
    priority: 2,
    color: 'bg-blue-500',
    setupUrl: 'https://www.indiehackers.com/start',
    bioMaxLength: 500,
    bestFor: 'Indie community, Revenue sharing, Networking',
    contentTypes: ['Milestones', 'Revenue updates', 'Lessons learned'],
    postingFrequency: 'Weekly',
    suggestedHandle: 'longsang',
  },
];

// Content Templates
const CONTENT_TEMPLATES = {
  twitterBio: `🚀 Solo Founder building {productCount} products
💼 {mainProduct} - {tagline}
🛠️ {skills}
📍 {location}
🔗 {website}`,

  linkedinHeadline: `Solo Founder & Full-Stack Developer | Building AI-Powered Automation Tools for Indie Hackers`,

  linkedinAbout: `Hi, I'm {name} 👋

I'm a solo founder from {location} building tools that help indie hackers and solo founders compete with enterprise marketing teams.

🎯 What I'm building:
{productList}

💡 My philosophy:
- Ship fast, iterate faster
- Automate everything
- Build in public
- Customer-first

🛠️ Tech Stack:
{techStack}

📫 Let's connect if you're interested in:
- Marketing automation
- AI-powered tools
- Indie hacking journey
- Flutter/React development`,

  firstTweet: `gm! 👋

I'm {name}, a solo founder from {location}.

Building in public from today:

🔨 {products}

Goal: ${BRAND_PROFILE.products.reduce((sum, p) => sum + p.revenueGoal, 0).toLocaleString()}/year

Follow along for:
• Daily progress updates
• Lessons learned
• Open source tools
• Revenue transparency

Let's connect! 🚀`,

  indiehackersIntro: `# Hey IndieHackers! 👋

I'm {name}, a solo founder from {location}.

## What I'm Building

{productDescriptions}

## My Background

Full-stack developer with experience in React, Flutter, Node.js, and AI integrations. I believe every solo founder should have access to enterprise-level marketing automation.

## Goals

- Year 1 Revenue Target: $132,000
- Help 1000+ solo founders automate their marketing
- Build in public and share everything I learn

Looking forward to connecting with this amazing community!`,
};

export default function BrandIdentityHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [setupProgress, setSetupProgress] = useState({
    twitter: false,
    linkedin: false,
    youtube: false,
    indiehackers: false,
  });

  // Memoize sorted platforms to avoid re-sorting on every render
  const sortedPlatforms = useMemo(() => 
    [...SOCIAL_PLATFORMS].sort((a, b) => a.priority - b.priority), 
    []
  );

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Use Social Media Kit for content generation
  const generateContent = (templateKey: keyof typeof CONTENT_TEMPLATES) => {
    let content = '';
    
    // Use pre-written content from Social Media Kit
    switch (templateKey) {
      case 'twitterBio':
        content = TWITTER.bio;
        break;
      case 'firstTweet':
        content = TWITTER.firstTweet;
        break;
      case 'linkedinAbout':
        content = LINKEDIN.about;
        break;
      case 'indiehackersIntro':
        content = INDIE_HACKERS.introPost;
        break;
      default: {
        // Fallback to template
        const template = CONTENT_TEMPLATES[templateKey];
        content = template
          .replace('{name}', BRAND_PROFILE.personal.name)
          .replace('{location}', BRAND_PROFILE.personal.location)
          .replace('{tagline}', BRAND_PROFILE.brand.tagline)
          .replace('{mainProduct}', BRAND_PROFILE.products[0].name)
          .replace('{productCount}', BRAND_PROFILE.products.length.toString())
          .replace('{skills}', BRAND_PROFILE.skills.technical.slice(0, 3).join(' • '))
          .replace('{website}', 'longsang.dev')
          .replace('{products}', BRAND_PROFILE.products.map(p => `${p.emoji} ${p.name}`).join('\n'))
          .replace('{productList}', BRAND_PROFILE.products.map(p => `• ${p.emoji} ${p.name} (${p.status})`).join('\n'))
          .replace('{techStack}', BRAND_PROFILE.skills.technical.join(', '))
          .replace('{productDescriptions}', BRAND_PROFILE.products.map(p => 
            `### ${p.emoji} ${p.name}\n- Status: ${p.status}\n- Revenue Goal: $${p.revenueGoal.toLocaleString()}/year`
          ).join('\n\n'));
        break;
      }
    }
    
    setGeneratedContent(prev => ({ ...prev, [templateKey]: content }));
    return content;
  };

  const totalRevenue = BRAND_PROFILE.products.reduce((sum, p) => sum + p.revenueGoal, 0);
  const setupComplete = Object.values(setupProgress).filter(Boolean).length;
  const setupTotal = Object.keys(setupProgress).length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-4xl font-bold">Brand Identity Hub</h1>
            <p className="text-muted-foreground">
              Build your personal brand with AI-powered tools
            </p>
          </div>
        </div>
        
        {/* Setup Progress */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Brand Setup Progress</span>
            <span className="text-sm text-muted-foreground">{setupComplete}/{setupTotal} platforms</span>
          </div>
          <Progress value={(setupComplete / setupTotal) * 100} className="h-2" />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2 py-3">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Brand Assets</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2 py-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Strategy</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    LS
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{BRAND_PROFILE.personal.name}</h3>
                    <p className="text-muted-foreground">{BRAND_PROFILE.personal.role}</p>
                    <p className="text-sm text-muted-foreground">📍 {BRAND_PROFILE.personal.location}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{BRAND_PROFILE.personal.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GitHub</span>
                    <span>{BRAND_PROFILE.personal.github}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone</span>
                    <span>{BRAND_PROFILE.personal.timezone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Brand Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{BRAND_PROFILE.brand.name}</h3>
                  <p className="text-primary italic">"{BRAND_PROFILE.brand.tagline}"</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Mission</Label>
                  <p className="text-sm">{BRAND_PROFILE.brand.mission}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vision</Label>
                  <p className="text-sm">{BRAND_PROFILE.brand.vision}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Values</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {BRAND_PROFILE.brand.values.map(value => (
                      <Badge key={value} variant="secondary">{value}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Product Portfolio
              </CardTitle>
              <CardDescription>
                Year 1 Revenue Goal: <span className="font-bold text-primary">${totalRevenue.toLocaleString()}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {BRAND_PROFILE.products.map(product => {
                  const getBadgeVariant = (status: string) => {
                    if (status === 'Production') return 'default';
                    if (status === 'Beta') return 'secondary';
                    return 'outline';
                  };
                  const badgeVariant = getBadgeVariant(product.status);
                  return (
                    <div key={product.name} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{product.emoji}</span>
                        <h4 className="font-semibold">{product.name}</h4>
                      </div>
                      <Badge variant={badgeVariant}>
                        {product.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Goal: ${product.revenueGoal.toLocaleString()}/year
                      </div>
                      <Progress 
                        value={0} 
                        className="h-1"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Skills & Tech Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Technical</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BRAND_PROFILE.skills.technical.map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">AI</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BRAND_PROFILE.skills.ai.map(skill => (
                      <Badge key={skill} variant="outline" className="border-purple-500">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Marketing</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BRAND_PROFILE.skills.marketing.map(skill => (
                      <Badge key={skill} variant="outline" className="border-green-500">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Image Generator
              </CardTitle>
              <CardDescription>
                Generate consistent brand images with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-32 flex-col gap-2" asChild>
                  <a href="/admin/brain" target="_blank">
                    <User className="h-8 w-8" />
                    <span>Owner Portrait</span>
                    <span className="text-xs text-muted-foreground">Create in Brain Library</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-32 flex-col gap-2" asChild>
                  <a href="/admin/image-generator" target="_blank">
                    <Palette className="h-8 w-8" />
                    <span>Logo Generator</span>
                    <span className="text-xs text-muted-foreground">Use Imagen4</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-32 flex-col gap-2" asChild>
                  <a href="/admin/image-generator" target="_blank">
                    <Globe className="h-8 w-8" />
                    <span>Social Banners</span>
                    <span className="text-xs text-muted-foreground">1500x500 for Twitter</span>
                  </a>
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Suggested Prompts for AI Image Generation</h4>
                <div className="space-y-3">
                  {[
                    {
                      id: 'prompt-headshot',
                      title: 'Professional Headshot',
                      prompt: 'Professional headshot of Asian male developer, confident smile, wearing casual smart clothes, gradient blue-purple background, high quality, 4K',
                    },
                    {
                      id: 'prompt-logo',
                      title: 'Brand Logo',
                      prompt: 'Modern minimalist logo for "LongSang Automation", tech startup, AI and automation theme, blue and purple gradient, clean design',
                    },
                    {
                      id: 'prompt-banner',
                      title: 'Twitter Banner',
                      prompt: 'Twitter banner 1500x500, modern tech aesthetic, "AI-Powered Automation for Solo Founders" text, gradient blue to purple, minimalist',
                    },
                  ].map((item) => (
                    <div key={item.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.title}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(item.prompt, item.id)}
                        >
                          {copiedId === item.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {[
                  { name: 'Primary Blue', hex: '#3B82F6', class: 'bg-blue-500' },
                  { name: 'Secondary Purple', hex: '#8B5CF6', class: 'bg-purple-500' },
                  { name: 'Accent Cyan', hex: '#06B6D4', class: 'bg-cyan-500' },
                  { name: 'Success Green', hex: '#22C55E', class: 'bg-green-500' },
                  { name: 'Dark', hex: '#1E293B', class: 'bg-slate-800' },
                ].map(color => (
                  <div key={color.name} className="text-center">
                    <button 
                      type="button"
                      className={`h-20 w-full rounded-lg ${color.class} mb-2 cursor-pointer hover:scale-105 transition-transform`}
                      onClick={() => copyToClipboard(color.hex, color.hex)}
                      aria-label={`Copy ${color.name} color: ${color.hex}`}
                    />
                    <p className="font-medium text-sm">{color.name}</p>
                    <p className="text-xs text-muted-foreground">{color.hex}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Bio Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bio & Content Generator
              </CardTitle>
              <CardDescription>
                Generate platform-specific bios and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Twitter Bio */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TwitterIcon className="h-5 w-5" />
                    <Label>Twitter Bio (160 chars)</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateContent('twitterBio')}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
                <Textarea
                  value={generatedContent.twitterBio || ''}
                  onChange={(e) => setGeneratedContent(prev => ({ ...prev, twitterBio: e.target.value }))}
                  placeholder="Click Generate to create your Twitter bio..."
                  className="min-h-[100px]"
                />
                {generatedContent.twitterBio && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {generatedContent.twitterBio.length}/160 characters
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedContent.twitterBio, 'twitter-bio')}
                    >
                      {copiedId === 'twitter-bio' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* First Tweet */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <Label>First "Build in Public" Tweet</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateContent('firstTweet')}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
                <Textarea
                  value={generatedContent.firstTweet || ''}
                  onChange={(e) => setGeneratedContent(prev => ({ ...prev, firstTweet: e.target.value }))}
                  placeholder="Click Generate to create your first tweet..."
                  className="min-h-[200px]"
                />
                {generatedContent.firstTweet && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedContent.firstTweet, 'first-tweet')}
                  >
                    {copiedId === 'first-tweet' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                )}
              </div>

              <Separator />

              {/* LinkedIn About */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkedinIcon className="h-5 w-5" />
                    <Label>LinkedIn About Section</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateContent('linkedinAbout')}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
                <Textarea
                  value={generatedContent.linkedinAbout || ''}
                  onChange={(e) => setGeneratedContent(prev => ({ ...prev, linkedinAbout: e.target.value }))}
                  placeholder="Click Generate to create your LinkedIn about..."
                  className="min-h-[300px]"
                />
                {generatedContent.linkedinAbout && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedContent.linkedinAbout, 'linkedin-about')}
                  >
                    {copiedId === 'linkedin-about' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                )}
              </div>

              <Separator />

              {/* IndieHackers Intro */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    <Label>IndieHackers Introduction Post</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateContent('indiehackersIntro')}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
                <Textarea
                  value={generatedContent.indiehackersIntro || ''}
                  onChange={(e) => setGeneratedContent(prev => ({ ...prev, indiehackersIntro: e.target.value }))}
                  placeholder="Click Generate to create your IndieHackers intro..."
                  className="min-h-[300px]"
                />
                {generatedContent.indiehackersIntro && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedContent.indiehackersIntro, 'ih-intro')}
                  >
                    {copiedId === 'ih-intro' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Content Schedule
              </CardTitle>
              <CardDescription>
                Recommended posting schedule for maximum engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { day: 'Monday', platform: 'Twitter', content: 'Weekly goals thread', Icon: Target },
                  { day: 'Tuesday', platform: 'Twitter', content: 'Tech tip or code snippet', Icon: Zap },
                  { day: 'Wednesday', platform: 'YouTube', content: 'Tutorial or demo video', Icon: Camera },
                  { day: 'Thursday', platform: 'Twitter', content: 'Behind the scenes', Icon: Camera },
                  { day: 'Friday', platform: 'IndieHackers', content: 'Weekly revenue/metrics update', Icon: TrendingUp },
                  { day: 'Saturday', platform: 'Twitter', content: 'Community engagement', Icon: MessageSquare },
                  { day: 'Sunday', platform: 'LinkedIn', content: 'Reflection/lesson learned', Icon: FileText },
                ].map((item) => (
                  <div key={item.day} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="w-24 font-medium">{item.day}</div>
                    <Badge variant="outline">{item.platform}</Badge>
                    <div className="flex items-center gap-2 flex-1">
                      <item.Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          {/* Social Platform Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Social Platform Setup Guide
              </CardTitle>
              <CardDescription>
                Step-by-step guide to set up your social presence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPlatforms.map((platform) => (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                          <platform.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {platform.name}
                            <Badge variant="outline" className="text-xs">
                              Priority #{platform.priority}
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Suggested: {platform.suggestedHandle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setupProgress[platform.id as keyof typeof setupProgress]}
                          onCheckedChange={(checked) => {
                            setSetupProgress(prev => ({ ...prev, [platform.id]: checked }));
                            if (checked) {
                              toast.success(`${platform.name} marked as complete!`);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={platform.setupUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Setup
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Best For: </span>
                        {platform.bestFor}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Content Types: </span>
                        {platform.contentTypes.join(', ')}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Posting Frequency: </span>
                        {platform.postingFrequency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SABO Arena Go-to-Market */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                SABO Arena - Go-to-Market Strategy
              </CardTitle>
              <CardDescription>
                Focus product: Billiard tournament management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Target Market */}
              <div>
                <h4 className="font-semibold mb-3">🎯 Target Market</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-medium">Primary:</span>
                    <p className="text-sm text-muted-foreground">
                      Billiard club owners in Vietnam looking to organize tournaments
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-medium">Secondary:</span>
                    <p className="text-sm text-muted-foreground">
                      Billiard players wanting to find and join tournaments
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Model */}
              <div>
                <h4 className="font-semibold mb-3">💰 Revenue Model</h4>
                <div className="space-y-2">
                  {[
                    { model: 'Freemium', description: 'Free for players, premium for club owners' },
                    { model: 'Commission', description: '5-10% of entry fees for tournaments' },
                    { model: 'Subscription', description: 'Monthly fee for premium features' },
                  ].map((item) => (
                    <div key={item.model} className="flex items-center gap-3 p-2 border rounded">
                      <Badge>{item.model}</Badge>
                      <span className="text-sm">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Phases */}
              <div>
                <h4 className="font-semibold mb-3">🚀 Launch Phases</h4>
                <div className="space-y-3">
                  {[
                    {
                      phase: 'Phase 1: Soft Launch',
                      duration: 'Week 1-2',
                      tasks: [
                        'Partner with 3-5 local billiard clubs',
                        'Run 2-3 test tournaments',
                        'Collect feedback and iterate',
                      ],
                    },
                    {
                      phase: 'Phase 2: Beta Launch',
                      duration: 'Week 3-4',
                      tasks: [
                        'Expand to 10+ clubs',
                        'Launch marketing on Facebook Groups',
                        'Create video tutorials',
                      ],
                    },
                    {
                      phase: 'Phase 3: Public Launch',
                      duration: 'Month 2',
                      tasks: [
                        'App Store optimization',
                        'Influencer partnerships',
                        'Press release to sports media',
                      ],
                    },
                  ].map((phase) => (
                    <div key={phase.phase} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{phase.phase}</h5>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <ul className="space-y-1">
                        {phase.tasks.map((task) => (
                          <li key={task} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="text-primary">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing Channels */}
              <div>
                <h4 className="font-semibold mb-3">📢 Marketing Channels (Vietnam Focus)</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    { channel: 'Facebook Groups', priority: 'HIGH', reason: 'Billiard communities very active' },
                    { channel: 'Zalo OA', priority: 'HIGH', reason: 'Most used messaging app in VN' },
                    { channel: 'TikTok', priority: 'MEDIUM', reason: 'Short billiard trick videos' },
                    { channel: 'YouTube', priority: 'MEDIUM', reason: 'Tournament highlights' },
                  ].map((item) => (
                    <div key={item.channel} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.channel}</span>
                        <Badge variant={item.priority === 'HIGH' ? 'default' : 'secondary'}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Action Items Checklist
              </CardTitle>
              <CardDescription>
                Complete these tasks to launch your brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'task-1', task: 'Create Owner Portrait in Brain Library', link: '/admin/brain', done: false },
                  { id: 'task-2', task: 'Set up Twitter/X account @LongSangDev', link: 'https://twitter.com/i/flow/signup', done: false },
                  { id: 'task-3', task: 'Create IndieHackers profile', link: 'https://www.indiehackers.com/start', done: false },
                  { id: 'task-4', task: 'Generate 5 brand images with Imagen4', link: '/admin/image-generator', done: false },
                  { id: 'task-5', task: 'Write and post first "Build in Public" tweet', link: null, done: false },
                  { id: 'task-6', task: 'Partner with first 3 billiard clubs for SABO Arena', link: null, done: false },
                  { id: 'task-7', task: 'Record first YouTube tutorial video', link: null, done: false },
                  { id: 'task-8', task: 'Set up Zalo OA for customer support', link: null, done: false },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <input
                      id={item.id}
                      type="checkbox"
                      className="h-5 w-5 rounded"
                      defaultChecked={item.done}
                      aria-label={item.task}
                    />
                    <label htmlFor={item.id} className="flex-1 cursor-pointer">{item.task}</label>
                    {item.link && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`Open link for ${item.task}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
