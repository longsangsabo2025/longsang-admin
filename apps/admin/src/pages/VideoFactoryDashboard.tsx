/**
 * 🎬 Video Factory Dashboard
 * Automated Video Production Control Center
 * LongSang AI Empire
 * 
 * Refactored: Split from 5188-line monolith into 16 focused components
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Bot, Brain, Film, GalleryHorizontalEnd, Loader2, Scissors, Sparkles } from 'lucide-react';
import { videoFactoryService } from '@/services/video-factory.service';

// Split components
import { StatsCards } from './video-factory/components/StatsCards';
import { QuickAddPanel } from './video-factory/components/QuickAddPanel';
import { AIBatchPanel } from './video-factory/components/AIBatchPanel';
import { VideoAnalyzerPanel } from './video-factory/components/VideoAnalyzerPanel';
import { AddJobDialog } from './video-factory/components/AddJobDialog';
import { QueueTable } from './video-factory/components/QueueTable';
import { GalleryTab } from './video-factory/components/GalleryTab';
import { CompositionsTab } from './video-factory/components/CompositionsTab';
import { StrategiesTab } from './video-factory/components/StrategiesTab';
import { ChannelsTab } from './video-factory/components/ChannelsTab';
import { ModelIntelligenceTab } from './video-factory/components/ModelIntelligenceTab';
import { AICommandCenterTab } from './video-factory/components/AICommandCenterTab';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoFactoryDashboard() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['video-factory', 'health'],
    queryFn: () => videoFactoryService.checkHealth(),
    refetchInterval: 30000,
    retry: 1,
  });

  const isOnline = health?.status === 'healthy';

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-primary" />
            Video Factory
          </h1>
          <p className="text-muted-foreground">
            Automated video production with Higgsfield.ai
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* API Status */}
          <div className="flex items-center gap-2">
            {healthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isOnline ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-600">API Online</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-600">API Offline</span>
              </>
            )}
          </div>

          <AddJobDialog />
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <StatsCards />

      {/* Quick Add Panel */}
      <QuickAddPanel />

      {/* AI Batch Generator */}
      <AIBatchPanel />

      {/* Video/Image URL Analyzer */}
      <VideoAnalyzerPanel />

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="gallery">🖼️ Gallery</TabsTrigger>
          <TabsTrigger value="compositions">✂️ Compositions</TabsTrigger>
          <TabsTrigger value="strategies">📋 Strategies</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="model-intelligence">🧠 Model Intelligence</TabsTrigger>
          <TabsTrigger value="ai-command">🤖 AI Command Center</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Video Queue</CardTitle>
              <CardDescription>All video generation jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <QueueTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Jobs</CardTitle>
              <CardDescription>Waiting to be processed</CardDescription>
            </CardHeader>
            <CardContent>
              <QueueTable statusFilter="pending" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Processing</CardTitle>
              <CardDescription>Currently generating</CardDescription>
            </CardHeader>
            <CardContent>
              <QueueTable statusFilter="processing" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Successfully generated videos</CardDescription>
            </CardHeader>
            <CardContent>
              <QueueTable statusFilter="completed" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Failed</CardTitle>
              <CardDescription>Failed jobs (can be retried)</CardDescription>
            </CardHeader>
            <CardContent>
              <QueueTable statusFilter="failed" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GalleryHorizontalEnd className="h-5 w-5 text-green-500" />
                Output Gallery
              </CardTitle>
              <CardDescription>Browse all completed videos and images</CardDescription>
            </CardHeader>
            <CardContent>
              <GalleryTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compositions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-orange-500" />
                Compositions
              </CardTitle>
              <CardDescription>Merge completed clips into final videos with transitions, review & reorder</CardDescription>
            </CardHeader>
            <CardContent>
              <CompositionsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                Content Strategies
              </CardTitle>
              <CardDescription>
                Define prompt templates → click Generate → batch jobs enter queue automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StrategiesTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Channels</CardTitle>
              <CardDescription>Configured YouTube/TikTok channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ChannelsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model-intelligence">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Model Intelligence Dashboard
              </CardTitle>
              <CardDescription>
                AI model performance tracking, real-time analytics & strategic recommendations — 2025/2026 landscape monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelIntelligenceTab />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai-command">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-500" />
                AI Command Center
                <Badge variant="outline" className="text-xs text-indigo-500 border-indigo-300 gap-1">
                  <Sparkles className="h-3 w-3" /> Gemini 2.0 Flash
                </Badge>
              </CardTitle>
              <CardDescription>
                All AI skills in one place — viral scripts, content calendar, repurpose, trend scout, script writer, SEO & captions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AICommandCenterTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
