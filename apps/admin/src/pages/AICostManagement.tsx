/**
 * AI Cost Management Page
 * Tracks and displays pricing information for all AI APIs used in the system
 * Helps monitor usage and estimate costs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, Video, Image, Music, MessageSquare, 
  TrendingUp, Calculator, ExternalLink, RefreshCw,
  Sparkles, Zap, Clock, Database, AlertTriangle, Info
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// API Pricing Data - Updated December 2024
const AI_PRICING_DATA = {
  video: {
    title: '🎬 Video Generation APIs',
    description: 'AI Video Generation từ ảnh hoặc text',
    provider: 'Kie.ai',
    apis: [
      {
        id: 'veo3-fast',
        name: 'Google Veo 3 Fast',
        description: 'Nhanh, tiết kiệm - ~8 giây video',
        pricePerUnit: 0.40,
        unit: 'video (8s)',
        credits: 80,
        creditRate: 0.005,
        features: ['Text-to-Video', 'Image-to-Video', 'Audio sync'],
        quality: 'Standard',
        speed: 'Fast',
        comparison: {
          'Fal.ai': 6.00,
          'Replicate': 6.00,
          'AIMLAPI': 6.30,
        },
        savings: '93%'
      },
      {
        id: 'veo3-quality',
        name: 'Google Veo 3 Quality',
        description: 'Chất lượng cao, cinematic - ~8 giây video',
        pricePerUnit: 2.00,
        unit: 'video (8s)',
        credits: 400,
        creditRate: 0.005,
        features: ['1080p HD', 'Cinematic', 'Audio sync', 'Natural physics'],
        quality: 'Premium',
        speed: 'Standard',
        comparison: {
          'Fal.ai': 6.00,
          'Replicate': 6.00,
          'Google Vertex AI': 6.00,
        },
        savings: '67%'
      },
      {
        id: 'runway-gen3',
        name: 'Runway Gen-3 Alpha Turbo',
        description: 'Video generation từ Runway',
        pricePerUnit: 0.50,
        unit: 'video (5s, 720p)',
        credits: 100,
        creditRate: 0.005,
        features: ['Image-to-Video', 'Text-to-Video', 'Video Extension', '5s/10s duration'],
        quality: 'High',
        speed: 'Turbo (30s generation)',
        comparison: {
          'Runway Official': 5.00,
        },
        savings: '90%'
      },
      {
        id: 'runway-gen3-10s',
        name: 'Runway Gen-3 (10s, 720p)',
        description: 'Video dài hơn, 720p',
        pricePerUnit: 0.80,
        unit: 'video (10s)',
        credits: 160,
        creditRate: 0.005,
        features: ['10 giây video', '720p', 'Video Extension'],
        quality: 'High',
        speed: 'Standard',
      },
      {
        id: 'runway-gen3-1080p',
        name: 'Runway Gen-3 (5s, 1080p)',
        description: 'Full HD, chỉ hỗ trợ 5s',
        pricePerUnit: 0.75,
        unit: 'video (5s)',
        credits: 150,
        creditRate: 0.005,
        features: ['1080p Full HD', '5 giây', 'Premium quality'],
        quality: 'Premium',
        speed: 'Standard',
      },
    ],
  },
  image: {
    title: '🖼️ Image Generation APIs',
    description: 'AI Image Generation và Editing',
    provider: 'Kie.ai',
    apis: [
      {
        id: 'nano-banana',
        name: 'Nano Banana Pro',
        description: 'Image-to-Image transformation (đang dùng)',
        pricePerUnit: 0.02,
        unit: 'image',
        credits: 4,
        creditRate: 0.005,
        features: ['Image-to-Image', '4K Resolution', 'Fast generation'],
        quality: 'High',
        speed: 'Fast',
        inUse: true,
      },
      {
        id: 'flux-kontext',
        name: 'Flux Kontext',
        description: 'Context-aware image editing',
        pricePerUnit: 0.05,
        unit: 'image',
        credits: 10,
        creditRate: 0.005,
        features: ['Context-aware editing', 'Character consistency', 'Professional editing'],
        quality: 'Premium',
        speed: 'Standard',
      },
      {
        id: '4o-image',
        name: '4O Image (GPT-4O Vision)',
        description: 'OpenAI GPT-4O image generation',
        pricePerUnit: 0.08,
        unit: 'image',
        credits: 16,
        creditRate: 0.005,
        features: ['Text rendering', 'Style control', 'High fidelity'],
        quality: 'Premium',
        speed: 'Standard',
      },
    ],
  },
  music: {
    title: '🎵 Music Generation APIs',
    description: 'AI Music và Audio Generation',
    provider: 'Kie.ai',
    apis: [
      {
        id: 'suno-v4',
        name: 'Suno V4',
        description: 'AI Music generation',
        pricePerUnit: 0.10,
        unit: 'song',
        credits: 20,
        creditRate: 0.005,
        features: ['Full song generation', 'Vocals', 'Multiple genres', 'Up to 8 minutes'],
        quality: 'High',
        speed: 'Standard',
      },
      {
        id: 'suno-lyrics',
        name: 'Suno Lyrics Generation',
        description: 'AI Lyrics generation',
        pricePerUnit: 0.02,
        unit: 'generation',
        credits: 4,
        creditRate: 0.005,
        features: ['Lyrics from prompt', 'Multiple styles'],
        quality: 'Standard',
        speed: 'Fast',
      },
    ],
  },
  llm: {
    title: '💬 LLM APIs (Prompt Enhancement)',
    description: 'Large Language Models cho Prompt Enhancement',
    provider: 'Multiple',
    apis: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Google - Miễn phí quota cao (đang dùng)',
        pricePerUnit: 0.00,
        unit: '1M tokens',
        features: ['Free tier', '1M context', 'Fast'],
        quality: 'High',
        speed: 'Fast',
        inUse: true,
        note: 'Miễn phí với quota hàng ngày cao',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'OpenAI - Nhanh, tiết kiệm',
        pricePerUnit: 0.15,
        unit: '1M input tokens',
        outputPrice: 0.60,
        features: ['Fast', 'Cost-effective', '128K context'],
        quality: 'Good',
        speed: 'Fast',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'OpenAI - Chất lượng cao',
        pricePerUnit: 2.50,
        unit: '1M input tokens',
        outputPrice: 10.00,
        features: ['High quality', 'Vision', '128K context'],
        quality: 'Premium',
        speed: 'Standard',
      },
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic - Sáng tạo, tự nhiên',
        pricePerUnit: 3.00,
        unit: '1M input tokens',
        outputPrice: 15.00,
        features: ['Creative', 'Long context', 'Reasoning'],
        quality: 'Premium',
        speed: 'Standard',
      },
    ],
  },
};

// Usage tracking interface
interface UsageRecord {
  date: string;
  api: string;
  count: number;
  cost: number;
}

// Calculate estimated monthly cost
const calculateMonthlyCost = (dailyUsage: { [key: string]: number }) => {
  let total = 0;
  
  Object.entries(dailyUsage).forEach(([apiId, count]) => {
    // Find the API pricing
    for (const category of Object.values(AI_PRICING_DATA)) {
      const api = category.apis.find(a => a.id === apiId);
      if (api) {
        total += api.pricePerUnit * count * 30; // 30 days
        break;
      }
    }
  });
  
  return total;
};

export default function AICostManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [estimatedUsage, setEstimatedUsage] = useState({
    'veo3-fast': 10,
    'runway-gen3': 5,
    'nano-banana': 50,
  });
  const [kieBalance, setKieBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Calculate totals
  const monthlyEstimate = calculateMonthlyCost(estimatedUsage);
  
  // Check Kie.ai balance (would need API endpoint)
  const checkKieBalance = async () => {
    setIsLoadingBalance(true);
    try {
      // This would call the Kie.ai API to check balance
      // For now, show placeholder
      setTimeout(() => {
        setKieBalance(150.50); // Mock data
        setIsLoadingBalance(false);
      }, 1000);
    } catch (error) {
      setIsLoadingBalance(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            AI Cost Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý chi phí và theo dõi usage của các AI APIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkKieBalance} disabled={isLoadingBalance}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            Check Balance
          </Button>
          <Button asChild>
            <a href="https://kie.ai/api-key" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Kie.ai Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kie.ai Balance</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kieBalance !== null ? `$${kieBalance.toFixed(2)}` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              {kieBalance !== null ? `≈ ${Math.floor(kieBalance / 0.005)} credits` : 'Click Check Balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Estimate</CardTitle>
            <Calculator className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${monthlyEstimate.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current usage pattern
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Rate</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$0.005</div>
            <p className="text-xs text-muted-foreground">
              Per credit on Kie.ai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">~70%</div>
            <p className="text-xs text-muted-foreground">
              vs Fal.ai/Replicate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video APIs
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Image APIs
          </TabsTrigger>
          <TabsTrigger value="music" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Music APIs
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            LLM APIs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Bảng giá tổng hợp (Kie.ai)
                </CardTitle>
                <CardDescription>
                  So sánh chi phí với các provider khác
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API</TableHead>
                      <TableHead>Kie.ai</TableHead>
                      <TableHead>Others</TableHead>
                      <TableHead>Savings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Veo 3 Fast (8s)</TableCell>
                      <TableCell className="text-green-600 font-bold">$0.40</TableCell>
                      <TableCell className="text-muted-foreground">$6.00</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">93%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Veo 3 Quality (8s)</TableCell>
                      <TableCell className="text-green-600 font-bold">$2.00</TableCell>
                      <TableCell className="text-muted-foreground">$6.00</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">67%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Runway Gen-3 (5s)</TableCell>
                      <TableCell className="text-green-600 font-bold">$0.50</TableCell>
                      <TableCell className="text-muted-foreground">$5.00</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">90%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Nano Banana (image)</TableCell>
                      <TableCell className="text-green-600 font-bold">$0.02</TableCell>
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell>
                        <Badge variant="outline">N/A</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Usage Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cost Calculator
                </CardTitle>
                <CardDescription>
                  Ước tính chi phí hàng tháng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Veo 3 Fast videos/day
                    </Label>
                    <Input
                      type="number"
                      className="w-20 text-right"
                      value={estimatedUsage['veo3-fast'] || 0}
                      onChange={(e) => setEstimatedUsage(prev => ({
                        ...prev,
                        'veo3-fast': parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Runway videos/day
                    </Label>
                    <Input
                      type="number"
                      className="w-20 text-right"
                      value={estimatedUsage['runway-gen3'] || 0}
                      onChange={(e) => setEstimatedUsage(prev => ({
                        ...prev,
                        'runway-gen3': parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Images/day
                    </Label>
                    <Input
                      type="number"
                      className="w-20 text-right"
                      value={estimatedUsage['nano-banana'] || 0}
                      onChange={(e) => setEstimatedUsage(prev => ({
                        ...prev,
                        'nano-banana': parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Monthly Estimate:</span>
                    <span className="text-green-600">${monthlyEstimate.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    = {Math.ceil(monthlyEstimate / 0.005)} credits/month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Lưu ý quan trọng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Gemini 2.5 Flash</strong> đang được sử dụng cho Prompt Enhancement - <span className="text-green-600 font-medium">Miễn phí</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Nano Banana Pro</strong> đang được sử dụng cho Image-to-Image - <span className="text-green-600 font-medium">$0.02/ảnh</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">ℹ</span>
                  <span>Video URLs từ Kie.ai sẽ <strong>hết hạn sau 14 ngày</strong> - nhớ download hoặc save</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">ℹ</span>
                  <span>Credit rate: <strong>$0.005/credit</strong> - 1 credit = $0.005</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">★</span>
                  <span>Kie.ai cung cấp <strong>Free Trial</strong> khi đăng ký mới</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video APIs Tab */}
        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{AI_PRICING_DATA.video.title}</CardTitle>
              <CardDescription>{AI_PRICING_DATA.video.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {AI_PRICING_DATA.video.apis.map((api) => (
                  <div 
                    key={api.id} 
                    className={`p-4 border rounded-lg ${api.inUse ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{api.name}</h3>
                          {api.inUse && (
                            <Badge className="bg-green-500">Đang dùng</Badge>
                          )}
                          {api.savings && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Save {api.savings}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{api.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {api.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${api.pricePerUnit.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per {api.unit}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          = {api.credits} credits
                        </div>
                      </div>
                    </div>
                    
                    {api.comparison && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">So với các platform khác:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(api.comparison).map(([provider, price]) => (
                            <span key={provider} className="text-xs bg-muted px-2 py-0.5 rounded">
                              {provider}: <span className="line-through text-red-500">${price.toFixed(2)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image APIs Tab */}
        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{AI_PRICING_DATA.image.title}</CardTitle>
              <CardDescription>{AI_PRICING_DATA.image.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {AI_PRICING_DATA.image.apis.map((api) => (
                  <div 
                    key={api.id} 
                    className={`p-4 border rounded-lg ${api.inUse ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{api.name}</h3>
                          {api.inUse && (
                            <Badge className="bg-green-500">Đang dùng</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{api.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {api.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${api.pricePerUnit.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per {api.unit}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          = {api.credits} credits
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Music APIs Tab */}
        <TabsContent value="music" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{AI_PRICING_DATA.music.title}</CardTitle>
              <CardDescription>{AI_PRICING_DATA.music.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {AI_PRICING_DATA.music.apis.map((api) => (
                  <div key={api.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{api.name}</h3>
                        <p className="text-sm text-muted-foreground">{api.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {api.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${api.pricePerUnit.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per {api.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM APIs Tab */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{AI_PRICING_DATA.llm.title}</CardTitle>
              <CardDescription>{AI_PRICING_DATA.llm.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {AI_PRICING_DATA.llm.apis.map((api) => (
                  <div 
                    key={api.id} 
                    className={`p-4 border rounded-lg ${api.inUse ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{api.name}</h3>
                          {api.inUse && (
                            <Badge className="bg-green-500">Đang dùng</Badge>
                          )}
                          {api.pricePerUnit === 0 && (
                            <Badge className="bg-purple-500">FREE</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{api.description}</p>
                        {api.note && (
                          <p className="text-xs text-blue-600 mt-1">{api.note}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {api.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${api.pricePerUnit === 0 ? 'text-purple-600' : 'text-blue-600'}`}>
                          {api.pricePerUnit === 0 ? 'FREE' : `$${api.pricePerUnit.toFixed(2)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per {api.unit}
                        </div>
                        {api.outputPrice && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Output: ${api.outputPrice}/1M tokens
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Links */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <a 
              href="https://kie.ai/api-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Kie.ai API Dashboard
            </a>
            <a 
              href="https://docs.kie.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Kie.ai Documentation
            </a>
            <a 
              href="https://kie.ai/v3-api-pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Veo 3 Pricing Details
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
