/**
 * =================================================================
 * AUTO POST SCHEDULER
 * =================================================================
 * Schedule and manage automatic social media posts
 */

import { Calendar, Clock, Loader2, Plus, RefreshCw, Send, XCircle, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AutoUploadTextarea, ImagePicker } from '@/components/media';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Platform icons
const PLATFORM_ICONS: Record<string, string> = {
  facebook: '📘',
  instagram: '📸',
  linkedin: '💼',
  twitter: '🐦',
  youtube: '▶️',
  tiktok: '🎵',
  telegram: '✈️',
  discord: '🎮',
  threads: '🧵',
};

interface ScheduledPost {
  id: string;
  project_id: string;
  content: string;
  image_url?: string;
  platforms: string[];
  scheduled_at: string;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  created_at: string;
  results?: Record<string, { success: boolean; postId?: string; error?: string }>;
}

interface AutoPostSchedulerProps {
  readonly projectId: string;
  readonly projectName?: string;
}

export function AutoPostScheduler({ projectId, projectName }: Readonly<AutoPostSchedulerProps>) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New post form
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['facebook']);
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Auto-post settings
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  // TODO: Implement interval selection UI
  const _autoPostInterval = 'daily';

  // Load scheduled posts
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      // For now using mock data - would query from Supabase
      const mockPosts: ScheduledPost[] = [
        {
          id: '1',
          project_id: projectId,
          content: '🚀 Exciting news coming soon! Stay tuned for our latest updates.',
          image_url: 'https://picsum.photos/800/600',
          platforms: ['facebook', 'instagram', 'linkedin'],
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          project_id: projectId,
          content: 'Thank you for 10K followers! 🎉',
          platforms: ['twitter', 'threads'],
          scheduled_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'published',
          created_at: new Date().toISOString(),
          results: {
            twitter: { success: true, postId: '123456' },
            threads: { success: true, postId: '789012' },
          },
        },
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Schedule a new post
  const schedulePost = async () => {
    if (!content.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung bài đăng',
        variant: 'destructive',
      });
      return;
    }

    if (platforms.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất 1 nền tảng',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      let scheduledAt = new Date().toISOString();

      if (scheduleType === 'later' && scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const newPost: ScheduledPost = {
        id: Date.now().toString(),
        project_id: projectId,
        content,
        image_url: imageUrl || undefined,
        platforms,
        scheduled_at: scheduledAt,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // If posting now, trigger the post
      if (scheduleType === 'now') {
        // Call API to post
        toast({
          title: '⏳ Đang đăng bài...',
          description: `Đăng lên ${platforms.length} nền tảng`,
        });

        // Simulate posting (would call real API)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        newPost.status = 'published';
        newPost.results = {};
        for (const platform of platforms) {
          newPost.results[platform] = { success: true, postId: `post_${Date.now()}` };
        }

        toast({
          title: '✅ Đăng bài thành công!',
          description: `Đã đăng lên ${platforms.length} nền tảng`,
        });
      } else {
        toast({
          title: '📅 Đã lên lịch',
          description: `Bài viết sẽ được đăng vào ${new Date(scheduledAt).toLocaleString('vi-VN')}`,
        });
      }

      setPosts((prev) => [newPost, ...prev]);

      // Reset form
      setContent('');
      setImageUrl('');
      setPlatforms(['facebook']);
      setScheduleType('now');
      setScheduleDate('');
      setScheduleTime('');
    } catch (error) {
      toast({
        title: '❌ Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  // Cancel a scheduled post
  const cancelPost = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p))
    );
    toast({
      title: 'Đã hủy',
      description: 'Bài đăng đã được hủy',
    });
  };

  // Format date
  const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN');

  // Get status badge
  const getStatusBadge = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            ⏳ Chờ đăng
          </Badge>
        );
      case 'published':
        return (
          <Badge variant="default" className="bg-green-500">
            ✅ Đã đăng
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">❌ Thất bại</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">🚫 Đã hủy</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Auto Post Scheduler
          </h2>
          <p className="text-muted-foreground">{projectName || 'Lên lịch và tự động đăng bài'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoPostEnabled} onCheckedChange={setAutoPostEnabled} />
            <Label>Auto-post</Label>
          </div>
          <Button variant="outline" onClick={loadPosts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* New Post Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tạo bài đăng mới
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content */}
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <AutoUploadTextarea
              placeholder="Viết nội dung bài đăng... (Paste ảnh để auto-upload)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              onImageUpload={(url) => setImageUrl(url)}
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Hình ảnh</Label>
            <ImagePicker
              value={imageUrl}
              onChange={(url) => setImageUrl(url || '')}
              placeholder="Chọn hoặc upload ảnh"
              aspect="video"
            />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Nền tảng</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_ICONS).map(([platform, icon]) => (
                <Button
                  key={platform}
                  variant={platforms.includes(platform) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlatform(platform)}
                  className="gap-1"
                >
                  <span>{icon}</span>
                  <span className="capitalize">{platform}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <Tabs value={scheduleType} onValueChange={(v) => setScheduleType(v as 'now' | 'later')}>
            <TabsList>
              <TabsTrigger value="now" className="gap-2">
                <Send className="h-4 w-4" /> Đăng ngay
              </TabsTrigger>
              <TabsTrigger value="later" className="gap-2">
                <Calendar className="h-4 w-4" /> Lên lịch
              </TabsTrigger>
            </TabsList>
            <TabsContent value="later" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Ngày</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Giờ</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={schedulePost}
            disabled={creating || !content.trim() || platforms.length === 0}
          >
            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {!creating && scheduleType === 'now' && <Send className="h-4 w-4 mr-2" />}
            {!creating && scheduleType === 'later' && <Calendar className="h-4 w-4 mr-2" />}
            {scheduleType === 'now' ? 'Đăng ngay' : 'Lên lịch'}
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Bài đăng đã lên lịch</CardTitle>
          <CardDescription>{posts.length} bài đăng</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có bài đăng nào</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Status & Time */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(post.status)}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(post.scheduled_at)}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-sm line-clamp-2">{post.content}</p>

                      {/* Platforms */}
                      <div className="flex gap-1">
                        {post.platforms.map((platform) => (
                          <span key={platform} title={platform}>
                            {PLATFORM_ICONS[platform]}
                          </span>
                        ))}
                      </div>

                      {/* Results */}
                      {post.results && (
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(post.results).map(([platform, result]) => (
                            <Badge
                              key={platform}
                              variant={result.success ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {PLATFORM_ICONS[platform]} {result.success ? '✓' : '✗'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Image Preview */}
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="w-16 h-16 rounded object-cover" />
                    )}

                    {/* Actions */}
                    {post.status === 'pending' && (
                      <Button variant="ghost" size="icon" onClick={() => cancelPost(post.id)}>
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AutoPostScheduler;
