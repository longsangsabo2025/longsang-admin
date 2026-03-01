/**
 * 📊 Marketing Masterplan Component
 * Hiển thị Marketing Masterplan với UI đẹp, chuyên nghiệp
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Target,
  Users,
  Lightbulb,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  MessageSquare,
  Eye,
  ChevronRight,
  Rocket,
  Shield,
  Sparkles,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';

import {
  MarketingMasterplan,
  MarketingPhase,
  MasterplanCampaign,
  CustomerPersona,
  ContentPillar,
  PlatformType,
} from '@/types/ai-marketing';

interface MarketingMasterplanViewProps {
  masterplan: MarketingMasterplan;
  onGenerateContent?: (campaign: MasterplanCampaign) => void;
  onSave?: () => void;
}

const PLATFORM_ICONS: Record<PlatformType, React.ComponentType<{ className?: string }>> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  youtube: FaYoutube,
  threads: SiThreads,
  zalo: ({ className }) => <span className={`font-bold ${className}`}>Z</span>,
};

const PLATFORM_COLORS: Record<PlatformType, string> = {
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  twitter: 'bg-sky-500',
  youtube: 'bg-red-600',
  threads: 'bg-gray-900',
  zalo: 'bg-blue-500',
};

export function MarketingMasterplanView({
  masterplan,
  onGenerateContent,
  onSave,
}: MarketingMasterplanViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  // Calculate totals
  const totalCampaigns = masterplan.phases?.reduce(
    (sum, phase) => sum + (phase.campaigns?.length || 0),
    0
  ) || 0;

  const totalPosts = masterplan.phases?.reduce(
    (sum, phase) =>
      sum +
      (phase.campaigns?.reduce(
        (cSum, camp) =>
          cSum +
          (camp.contentCalendar?.reduce(
            (wSum, week) => wSum + (week.posts?.length || 0),
            0
          ) || 0),
        0
      ) || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Phases</p>
                <p className="text-2xl font-bold">{masterplan.phases?.length || 0}</p>
              </div>
              <Calendar className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Campaigns</p>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Personas</p>
                <p className="text-2xl font-bold">{masterplan.personas?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Planned Posts</p>
                <p className="text-2xl font-bold">{totalPosts}</p>
              </div>
              <MessageSquare className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {masterplan.executiveSummary}
          </p>
          
          {/* Timeline */}
          {masterplan.timeline && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {masterplan.timeline.startDate} → {masterplan.timeline.endDate}
              </Badge>
              <Badge variant="secondary">{masterplan.timeline.totalDuration}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {/* Brand Analysis */}
          {masterplan.brandAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Brand Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* USP */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      🎯 Unique Selling Proposition
                    </h4>
                    <p className="text-sm">{masterplan.brandAnalysis.usp}</p>
                  </div>

                  {/* Brand Voice */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      🗣️ Brand Voice
                    </h4>
                    <p className="text-sm">{masterplan.brandAnalysis.brandVoice}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {masterplan.brandAnalysis.brandPersonality?.map((trait) => (
                        <Badge key={trait} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SWOT */}
                {masterplan.brandAnalysis.swot && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
                      <h5 className="font-medium text-green-700 dark:text-green-300 text-sm mb-2">
                        💪 Strengths
                      </h5>
                      <ul className="text-xs space-y-1">
                        {masterplan.brandAnalysis.swot.strengths?.slice(0, 3).map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
                      <h5 className="font-medium text-red-700 dark:text-red-300 text-sm mb-2">
                        ⚠️ Weaknesses
                      </h5>
                      <ul className="text-xs space-y-1">
                        {masterplan.brandAnalysis.swot.weaknesses?.slice(0, 3).map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                      <h5 className="font-medium text-blue-700 dark:text-blue-300 text-sm mb-2">
                        🚀 Opportunities
                      </h5>
                      <ul className="text-xs space-y-1">
                        {masterplan.brandAnalysis.swot.opportunities?.slice(0, 3).map((o, i) => (
                          <li key={i}>• {o}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                      <h5 className="font-medium text-amber-700 dark:text-amber-300 text-sm mb-2">
                        🛡️ Threats
                      </h5>
                      <ul className="text-xs space-y-1">
                        {masterplan.brandAnalysis.swot.threats?.slice(0, 3).map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {masterplan.recommendations && masterplan.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {['quick-win', 'strategic', 'long-term'].map((category) => {
                    const items = masterplan.recommendations?.filter(
                      (r) => r.category === category
                    );
                    if (!items?.length) return null;

                    const colors = {
                      'quick-win': 'from-green-500 to-emerald-500',
                      strategic: 'from-blue-500 to-cyan-500',
                      'long-term': 'from-purple-500 to-pink-500',
                    };
                    const icons = {
                      'quick-win': Zap,
                      strategic: Target,
                      'long-term': Rocket,
                    };
                    const Icon = icons[category as keyof typeof icons];

                    return (
                      <div key={category}>
                        <div
                          className={`flex items-center gap-2 mb-3 p-2 rounded-lg bg-gradient-to-r ${colors[category as keyof typeof colors]} text-white`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="font-medium capitalize text-sm">
                            {category.replace('-', ' ')}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {items.map((rec, i) => (
                            <li
                              key={i}
                              className="p-2 rounded border bg-muted/30 text-sm"
                            >
                              <p className="font-medium">{rec.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge
                                  variant={
                                    rec.impact === 'high'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  Impact: {rec.impact}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Effort: {rec.effort}
                                </Badge>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PHASES TAB */}
        <TabsContent value="phases" className="space-y-4">
          <Accordion type="single" collapsible className="space-y-2">
            {masterplan.phases?.map((phase, index) => (
              <AccordionItem
                key={phase.id}
                value={phase.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0
                          ? 'bg-green-500'
                          : index === 1
                          ? 'bg-blue-500'
                          : index === 2
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{phase.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {phase.duration} • {phase.campaigns?.length || 0} campaigns
                      </p>
                    </div>
                    <Badge variant="outline">{phase.budgetPercentage}% budget</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {/* Phase objective & timeline */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">🎯 Objective</p>
                      <p className="text-sm text-muted-foreground">{phase.objective}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {phase.startDate} → {phase.endDate}
                        </Badge>
                      </div>
                    </div>

                    {/* Phase KPIs */}
                    {phase.kpis && phase.kpis.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">📊 KPIs</p>
                        <div className="flex flex-wrap gap-2">
                          {phase.kpis.map((kpi, i) => (
                            <Badge key={i} variant="outline">
                              {kpi.metric}: {kpi.target}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Campaigns */}
                    <div>
                      <p className="text-sm font-medium mb-3">📢 Campaigns</p>
                      <div className="space-y-3">
                        {phase.campaigns?.map((campaign) => (
                          <Card key={campaign.id} className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold">{campaign.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {campaign.objective}
                                  </p>
                                  
                                  {/* Platforms */}
                                  <div className="flex gap-2 mt-3">
                                    {campaign.platforms?.map((platform) => {
                                      const Icon = PLATFORM_ICONS[platform];
                                      return (
                                        <div
                                          key={platform}
                                          className={`p-1.5 rounded ${PLATFORM_COLORS[platform]} text-white`}
                                        >
                                          <Icon className="h-4 w-4" />
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Key Message */}
                                  <div className="mt-3 p-2 rounded bg-muted/50 text-sm">
                                    <span className="font-medium">Key Message: </span>
                                    {campaign.keyMessage}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                  <Badge
                                    variant={
                                      campaign.priority === 'critical' || campaign.priority === 'high'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {campaign.priority}
                                  </Badge>
                                  {onGenerateContent && (
                                    <Button
                                      size="sm"
                                      onClick={() => onGenerateContent(campaign)}
                                    >
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Generate
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* PERSONAS TAB */}
        <TabsContent value="personas" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {masterplan.personas?.map((persona, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{persona.name}</CardTitle>
                      <CardDescription>{persona.age} • {persona.occupation}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Interests */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {persona.interests?.slice(0, 4).map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Pain Points</p>
                    <ul className="text-xs space-y-1">
                      {persona.painPoints?.slice(0, 2).map((pain, i) => (
                        <li key={i} className="text-red-600 dark:text-red-400">
                          • {pain}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Goals */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Goals</p>
                    <ul className="text-xs space-y-1">
                      {persona.goals?.slice(0, 2).map((goal, i) => (
                        <li key={i} className="text-green-600 dark:text-green-400">
                          • {goal}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Platforms */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Active On</p>
                    <div className="flex gap-2">
                      {persona.platforms?.map((platform) => {
                        const Icon = PLATFORM_ICONS[platform];
                        return Icon ? (
                          <Icon key={platform} className="h-4 w-4 text-muted-foreground" />
                        ) : null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-4">
          {/* Content Pillars */}
          {masterplan.contentPillars && masterplan.contentPillars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Pillars</CardTitle>
                <CardDescription>Các trụ cột nội dung chính</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {masterplan.contentPillars.map((pillar, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pillar.name}</span>
                          <Badge variant="outline">{pillar.percentage}%</Badge>
                        </div>
                      </div>
                      <Progress value={pillar.percentage} className="h-2" />
                      <p className="text-sm text-muted-foreground">{pillar.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pillar.exampleTopics?.slice(0, 4).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Breakdown */}
          {masterplan.budget?.breakdown && masterplan.budget.breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {masterplan.budget.breakdown.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* KPIs TAB */}
        <TabsContent value="kpis" className="space-y-4">
          {/* Overall KPIs */}
          {masterplan.overallKPIs && masterplan.overallKPIs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Overall KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {masterplan.overallKPIs.map((kpi, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10"
                    >
                      <p className="text-sm text-muted-foreground">{kpi.metric}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold">{kpi.target}</span>
                        <span className="text-xs text-muted-foreground">
                          from {kpi.baseline}
                        </span>
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {kpi.timeframe}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {masterplan.risks && masterplan.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {masterplan.risks.map((risk, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        risk.impact === 'high'
                          ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                          : risk.impact === 'medium'
                          ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
                          : 'border-green-200 bg-green-50 dark:bg-green-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{risk.risk}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Mitigation:</span> {risk.mitigation}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Badge
                            variant={risk.likelihood === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {risk.likelihood}
                          </Badge>
                          <Badge
                            variant={risk.impact === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            Impact: {risk.impact}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button onClick={onSave} size="lg" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Lưu Masterplan & Tạo Campaigns
          </Button>
        </div>
      )}
    </div>
  );
}

export default MarketingMasterplanView;
