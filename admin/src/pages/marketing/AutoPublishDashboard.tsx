/**
 * 🚀 AUTO-PUBLISH DASHBOARD
 *
 * Một nơi để:
 * - Soạn nội dung (AI hỗ trợ)
 * - Chọn platforms (Facebook, LinkedIn, Threads, Telegram...)
 * - Đăng ngay hoặc schedule
 * - Xem lịch sử đăng bài
 */

import {
  AtSign,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Hash,
  History,
  Image,
  MessageCircle,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Platform configs
const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Globe, color: 'bg-blue-600', maxLength: 63206 },
  { id: 'linkedin', name: 'LinkedIn', icon: Share2, color: 'bg-blue-700', maxLength: 3000 },
  { id: 'threads', name: 'Threads', icon: AtSign, color: 'bg-purple-600', maxLength: 500 },
  { id: 'twitter', name: 'Twitter/X', icon: Hash, color: 'bg-black', maxLength: 280 },
  { id: 'telegram', name: 'Telegram', icon: Send, color: 'bg-sky-500', maxLength: 4096 },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: MessageCircle,
    color: 'bg-pink-600',
    maxLength: 2200,
  },
] as const;

// Quick templates for billiard shop
const QUICK_TEMPLATES = [
  {
    id: 'promo',
    name: '🎱 Khuyến mãi',
    template: `🎱 KHUYẾN MÃI ĐẶC BIỆT!

💰 [Giảm giá/Ưu đãi chi tiết]

📍 Địa chỉ: [Địa chỉ quán]
📞 Hotline: [Số điện thoại]

#billiard #bida #khuyenmai #giamgia`,
  },
  {
    id: 'event',
    name: '🏆 Giải đấu',
    template: `🏆 GIẢI ĐẤU BI-A [Tên giải]

📅 Thời gian: [Ngày tháng]
🎯 Thể loại: [Pool/Carom/Snooker]
💵 Giải thưởng: [Chi tiết]
📝 Đăng ký: [Link/SĐT]

#billiard #tournament #giaidau #bida`,
  },
  {
    id: 'tips',
    name: '💡 Mẹo chơi',
    template: `💡 MẸO CHƠI BI-A

🎯 [Tiêu đề mẹo]

[Nội dung chi tiết...]

👉 Follow để xem thêm tips!

#billiard #tips #huongdan #bida`,
  },
  {
    id: 'intro',
    name: '📍 Giới thiệu',
    template: `📍 GIỚI THIỆU [Tên quán]

🎱 [Mô tả ngắn về quán]

✅ Bàn bi-a chất lượng cao
✅ Không gian thoáng mát
✅ Phục vụ đồ uống
✅ Wifi miễn phí

📍 Địa chỉ: [Địa chỉ]
⏰ Mở cửa: [Giờ mở cửa]

#billiard #bida #quan #giaitri`,
  },
];

interface ScheduledPost {
  id: string;
  content?: string;
  contentPreview?: string;
  platforms?: string[];
  scheduled_for?: string;
  scheduledFor?: string;
  status: 'scheduled' | 'published' | 'failed';
  created_at: string;
}

interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

export default function AutoPublishDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('compose');

  // Compose state
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [_publishProgress, setPublishProgress] = useState(0);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  // History state
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [_publishHistory] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    publishedToday: 0,
    scheduled: 0,
    totalReach: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load scheduled posts
      const scheduledRes = await fetch('/api/scheduler/list?status=scheduled');
      const scheduledData = await scheduledRes.json();
      if (scheduledData.success) {
        setScheduledPosts(scheduledData.posts || []);
      }

      // Load auto-publish status
      const statusRes = await fetch('/api/auto-publish/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        setStats((prev) => ({
          ...prev,
          publishedToday: statusData.status?.publishedToday || 0,
          scheduled: statusData.status?.totalScheduled || 0,
        }));
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  // Apply template
  const applyTemplate = (template: string) => {
    setContent(template);
  };

  // Generate content with AI
  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: 'Nhập chủ đề',
        description: 'Hãy nhập chủ đề để AI tạo nội dung',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `Viết bài đăng social media về: ${aiTopic}. 
          Yêu cầu: 
          - Viết bằng tiếng Việt
          - Có emoji phù hợp
          - Có hashtags
          - Ngắn gọn, hấp dẫn
          - Phù hợp đăng Facebook/LinkedIn`,
        }),
      });

      const data = await response.json();
      if (data.success && data.response) {
        setContent(data.response);
        toast({
          title: 'AI đã tạo nội dung!',
          description: 'Bạn có thể chỉnh sửa trước khi đăng',
        });
      }
    } catch (error) {
      console.error('AI generate error:', error);
      toast({
        title: 'Lỗi AI',
        description: 'Không thể tạo nội dung. Thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish now
  const publishNow = async () => {
    if (!content.trim()) {
      toast({
        title: 'Thiếu nội dung',
        description: 'Hãy nhập nội dung bài đăng',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Chọn platform',
        description: 'Hãy chọn ít nhất 1 nền tảng để đăng',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);
    setPublishProgress(0);
    setPublishResults([]);

    try {
      const response = await fetch('/api/cross-platform/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl || undefined,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (data.results) {
        setPublishResults(data.results);

        const successCount = data.results.filter((r: PublishResult) => r.success).length;
        toast({
          title: successCount > 0 ? '🎉 Đăng bài thành công!' : '❌ Đăng bài thất bại',
          description: `${successCount}/${selectedPlatforms.length} platforms`,
          variant: successCount > 0 ? 'default' : 'destructive',
        });

        if (successCount > 0) {
          setContent('');
          setImageUrl('');
          loadData();
        }
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể đăng bài. Thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
      setPublishProgress(100);
    }
  };

  // Schedule post
  const schedulePost = async () => {
    if (!content.trim() || !scheduledDate || !scheduledTime) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Hãy nhập nội dung và chọn thời gian',
        variant: 'destructive',
      });
      return;
    }

    try {
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);

      const response = await fetch('/api/scheduler/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl || undefined,
          platforms: selectedPlatforms,
          preferredTime: scheduledFor.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '📅 Đã lên lịch!',
          description: `Bài đăng sẽ được đăng lúc ${scheduledFor.toLocaleString('vi-VN')}`,
        });
        setContent('');
        setImageUrl('');
        setIsScheduled(false);
        loadData();
      }
    } catch (error) {
      console.error('Schedule error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lên lịch. Thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Auto Publish
          </h1>
          <p className="text-muted-foreground">Đăng bài tự động lên nhiều nền tảng cùng lúc</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Đã đăng hôm nay</p>
            <p className="text-2xl font-bold text-green-500">{stats.publishedToday}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Đang chờ</p>
            <p className="text-2xl font-bold text-blue-500">{stats.scheduled}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Soạn & Đăng
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="h-4 w-4" />
            Đã lên lịch ({scheduledPosts.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        {/* COMPOSE TAB */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Content Editor */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Templates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Mẫu nhanh</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((t) => (
                      <Button
                        key={t.id}
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(t.template)}
                      >
                        {t.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Generate */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Viết bài
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="VD: Khuyến mãi cuối tuần giảm 30%..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    />
                    <Button onClick={generateWithAI} disabled={isGenerating} className="shrink-0">
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Nội dung bài đăng</CardTitle>
                    <Badge variant="outline">{content.length} ký tự</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Nhập nội dung bài đăng..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="resize-none"
                  />

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Hình ảnh (URL)
                    </Label>
                    <Input
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="max-h-40 rounded-lg object-cover"
                        onError={() => setImageUrl('')}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Platforms & Actions */}
            <div className="space-y-4">
              {/* Platform Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Chọn nền tảng</CardTitle>
                  <CardDescription>Chọn các nền tảng để đăng bài</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    const isOverLimit = content.length > platform.maxLength;

                    return (
                      <div
                        key={platform.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50',
                          isOverLimit && isSelected && 'border-yellow-500 bg-yellow-500/5'
                        )}
                        onClick={() => togglePlatform(platform.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg text-white', platform.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Max: {platform.maxLength.toLocaleString()} ký tự
                            </p>
                          </div>
                        </div>
                        <Switch checked={isSelected} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Schedule Toggle */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Lên lịch
                    </CardTitle>
                    <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
                  </div>
                </CardHeader>
                {isScheduled && (
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Ngày</Label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Giờ</Label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Publish Button */}
              <Button
                className="w-full h-12 text-lg"
                size="lg"
                onClick={isScheduled ? schedulePost : publishNow}
                disabled={isPublishing || !content.trim() || selectedPlatforms.length === 0}
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Đang đăng...
                  </>
                ) : isScheduled ? (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Lên lịch đăng
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Đăng ngay ({selectedPlatforms.length} platforms)
                  </>
                )}
              </Button>

              {/* Publish Results */}
              {publishResults.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Kết quả</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {publishResults.map((result, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{result.platform}</span>
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SCHEDULED TAB */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Bài đăng đã lên lịch</CardTitle>
              <CardDescription>Các bài đăng sẽ được tự động đăng khi đến giờ</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có bài đăng nào được lên lịch</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm line-clamp-2">
                          {post.contentPreview || post.content?.substring(0, 100)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(post.scheduledFor || post.scheduled_for || '').toLocaleString(
                              'vi-VN'
                            )}
                          </Badge>
                          {post.platforms?.map((p) => (
                            <Badge key={p} variant="secondary" className="capitalize">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử đăng bài</CardTitle>
              <CardDescription>Các bài đã đăng gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tính năng đang phát triển...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
