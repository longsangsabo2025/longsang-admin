/**
 * Video Generator Page
 * AI-powered video generation tools
 * Includes: Image to Video, UGC Ads, Veo 3
 */

import { useState, useCallback, useEffect } from 'react';
import { ImageToVideo } from '@/components/ai/ImageToVideo';
import { UGCVideoAds } from '@/components/ai/UGCVideoAds';
import { VeoVideoGenerator } from '@/components/ai/VeoVideoGenerator';
import { LocalVideoGenerator } from '@/components/ai/LocalVideoGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Video, Film, Sparkles, Megaphone, ArrowLeft, Clapperboard, X, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Activity Log item type
interface ActivityLogItem {
  id: string;
  taskId?: string;
  type: 'video';
  model?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputUrl?: string;
  outputUrl?: string;
  prompt?: string;
  cost?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Selected library image type
interface SelectedImage {
  url: string;
  name?: string;
}

// Series video production data from Series Planner
interface SeriesProductionData {
  seriesId: string;
  seriesTitle: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  prompt: string;
  shortPrompt: string;
  character: string;
  location: string;
  duration: number;
  visualNotes: string;
  createdAt: string;
}

export default function VideoGenerator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('veo-video');
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [seriesData, setSeriesData] = useState<SeriesProductionData | null>(null);

  // Check for series production data from Series Planner
  useEffect(() => {
    try {
      const saved = localStorage.getItem('series-video-production');
      if (saved) {
        const data = JSON.parse(saved) as SeriesProductionData;
        // Only use if created within last 5 minutes
        const createdAt = new Date(data.createdAt).getTime();
        const now = Date.now();
        if (now - createdAt < 5 * 60 * 1000) {
          setSeriesData(data);
          toast.info(`📺 Đang tạo video cho: ${data.episodeTitle}`);
        } else {
          // Clear old data
          localStorage.removeItem('series-video-production');
        }
      }
    } catch (e) {
      console.error('Failed to load series production data:', e);
    }
  }, []);

  // Clear series data
  const clearSeriesData = () => {
    setSeriesData(null);
    localStorage.removeItem('series-video-production');
  };

  // Add to activity log
  const addToActivityLog = useCallback((item: Omit<ActivityLogItem, 'id' | 'createdAt'>) => {
    const newItem: ActivityLogItem = {
      ...item,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setActivityLog(prev => [newItem, ...prev].slice(0, 50));
    return newItem.id;
  }, []);

  // Update activity log item
  const updateActivityLog = useCallback((id: string, updates: Partial<ActivityLogItem>) => {
    setActivityLog(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Handle video generated callback
  const handleVideoGenerated = useCallback((video: { url: string; prompt: string; type: string }) => {
    toast.success('🎬 Video đã được tạo thành công!');
    addToActivityLog({
      type: 'video',
      status: 'completed',
      outputUrl: video.url,
      prompt: video.prompt,
    });
  }, [addToActivityLog]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Film className="h-6 w-6 text-purple-500" />
                  Video Generator
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Video
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tạo video AI với Veo 3, Image to Video, UGC Ads
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-4 border-r">
                <p className="text-2xl font-bold text-purple-500">
                  {activityLog.filter(l => l.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Videos Created</p>
              </div>
              <div className="text-center px-4">
                <p className="text-2xl font-bold text-green-500">
                  {activityLog.filter(l => l.status === 'processing').length}
                </p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="veo-video" className="flex items-center gap-2">
              <Film className="h-4 w-4 text-purple-500" />
              Veo 3 Video 🎬
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-purple-600 border-purple-500 bg-purple-50">
                NEW
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="local-wan" className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-green-500" />
              Local WAN 🖥️
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-green-600 border-green-500 bg-green-50">
                FREE
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Image to Video
            </TabsTrigger>
            <TabsTrigger value="ugc-ads" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              UGC Ads
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-pink-600 border-pink-600 bg-pink-50">
                HOT
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Veo 3 Video Tab */}
          <TabsContent value="veo-video" className="mt-0">
            <VeoVideoGenerator onVideoGenerated={handleVideoGenerated} />
          </TabsContent>

          {/* Local WAN Video Tab */}
          <TabsContent value="local-wan" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-green-500" />
                  Local AI Video (WAN 2.1)
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    FREE - Local GPU
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Tạo video AI với ComfyUI + WAN 2.1 trên local GPU. Không tốn API cost!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocalVideoGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Image to Video Tab */}
          <TabsContent value="image-to-video" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  Image to Video
                  <Badge variant="secondary">Kie.ai</Badge>
                </CardTitle>
                <CardDescription>
                  Biến ảnh tĩnh thành video động với AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageToVideo 
                  selectedLibraryImage={selectedImage?.url}
                  onActivityLog={addToActivityLog}
                  onUpdateActivityLog={updateActivityLog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* UGC Ads Tab */}
          <TabsContent value="ugc-ads" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-pink-500" />
                  UGC Video Ads
                  <Badge variant="secondary" className="bg-pink-500/20 text-pink-400">
                    Marketing
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Tạo video quảng cáo UGC style với AI avatar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UGCVideoAds selectedLibraryImage={selectedImage?.url} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Film className="h-5 w-5 text-purple-500" />
                Veo 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Google's most advanced video AI. Text-to-video với âm thanh tự động.
              </p>
              <p className="text-xs text-purple-400 mt-2">~$0.40/video</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-500" />
                Local WAN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                WAN 2.1 14B trên local GPU. Unlimited free video generation!
              </p>
              <p className="text-xs text-green-400 mt-2">$0/video (local)</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                Image to Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Biến ảnh tĩnh thành video động. Hỗ trợ nhiều style và motion.
              </p>
              <p className="text-xs text-blue-400 mt-2">Kie.ai powered</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 border-pink-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-pink-500" />
                UGC Ads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tạo video quảng cáo với AI avatar. Perfect cho TikTok, Reels.
              </p>
              <p className="text-xs text-pink-400 mt-2">Marketing ready</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
