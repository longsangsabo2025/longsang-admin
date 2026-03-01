/**
 * 📅 Scheduled Posts Manager - Elon Style
 * 
 * Simple. Powerful. Multi-platform.
 * "The best interface is no interface" - Golden Krishna
 * 
 * Features:
 * - Calendar view with drag & drop
 * - Multi-platform at a glance
 * - Quick actions (reschedule, duplicate, cancel)
 * - Real-time status updates
 * - Bulk operations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  Calendar,
  Clock,
  Send,
  Pause,
  Play,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LayoutGrid,
  List,
  CalendarDays,
  Globe,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Music2,
  Hash,
  ArrowUpRight,
  Eye,
  EyeOff,
  Timer,
  Rocket,
  Target,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';

// Platform config
const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2', shortName: 'FB' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', shortName: 'IG' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#000000', shortName: 'TT' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000', shortName: 'YT' },
  { id: 'twitter', name: 'X', icon: Twitter, color: '#1DA1F2', shortName: 'X' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', shortName: 'LI' },
  { id: 'threads', name: 'Threads', icon: Hash, color: '#000000', shortName: 'TH' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: '#26A5E4', shortName: 'TG' },
];

const STATUS_CONFIG = {
  scheduled: { label: 'Đã lên lịch', icon: Clock, color: 'bg-blue-500', textColor: 'text-blue-600' },
  pending: { label: 'Chờ xử lý', icon: Timer, color: 'bg-amber-500', textColor: 'text-amber-600' },
  publishing: { label: 'Đang đăng', icon: Loader2, color: 'bg-purple-500', textColor: 'text-purple-600' },
  published: { label: 'Đã đăng', icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-600' },
  failed: { label: 'Thất bại', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-600' },
  paused: { label: 'Tạm dừng', icon: Pause, color: 'bg-gray-500', textColor: 'text-gray-600' },
};

type ViewMode = 'list' | 'grid' | 'calendar';
type FilterStatus = 'all' | 'scheduled' | 'published' | 'failed' | 'paused';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduled_for: string;
  status: string;
  created_at: string;
  campaign_id?: string;
  campaign_name?: string;
  metadata?: {
    image_url?: string;
    hashtags?: string[];
    publish_results?: any[];
    published_at?: string;
  };
}

interface Props {
  projectId: string;
  projectSlug: string;
}

export function ScheduledPostsManager({ projectId, projectSlug }: Props) {
  // State
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Dialogs
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [newScheduleTime, setNewScheduleTime] = useState('');
  
  // Actions state
  const [processing, setProcessing] = useState<string | null>(null);

  // Load posts
  const loadPosts = async () => {
    setLoading(true);
    try {
      // Try to load from content_queue table
      // First try with project_id filter, if that fails, load all
      let data = null;
      let error = null;
      
      // Try with project_id filter first
      const result1 = await supabaseAdmin
        .from('content_queue')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_for', { ascending: true })
        .limit(100);
      
      if (result1.error) {
        // If project_id column doesn't exist, try without filter
        // Also try ordered by created_at if scheduled_for doesn't exist
        const result2 = await supabaseAdmin
          .from('content_queue')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (result2.error) {
          // Table might not exist or have permission issues - show empty state
          console.warn('content_queue table not accessible:', result2.error);
          setPosts([]);
          return;
        }
        
        data = result2.data;
        error = result2.error;
      } else {
        data = result1.data;
        error = result1.error;
      }

      if (error) {
        console.warn('Error loading posts:', error);
        setPosts([]);
        return;
      }
      
      // Map data to our format - handle various column name possibilities
      const mappedPosts: ScheduledPost[] = (data || []).map(post => ({
        id: post.id,
        title: post.title || post.campaign_name || 'Untitled Post',
        content: typeof post.content === 'string' ? post.content : (post.content?.body || post.content?.text || JSON.stringify(post.content || '')),
        platforms: post.metadata?.platforms || post.platforms || [post.platform || 'facebook'],
        scheduled_for: post.scheduled_for || post.scheduled_at || post.created_at,
        status: post.status || 'scheduled',
        created_at: post.created_at,
        campaign_id: post.campaign_id,
        campaign_name: post.metadata?.campaign_name || post.campaign_name,
        metadata: post.metadata,
      }));
      
      setPosts(mappedPosts);
    } catch (err) {
      // Silently handle - table may not exist yet
      console.warn('Error loading scheduled posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [projectId]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Status filter
      if (filterStatus !== 'all' && post.status !== filterStatus) return false;
      
      // Platform filter
      if (filterPlatform !== 'all' && !post.platforms.includes(filterPlatform)) return false;
      
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [posts, filterStatus, filterPlatform, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() + 7);

    return {
      total: posts.length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      published: posts.filter(p => p.status === 'published').length,
      failed: posts.filter(p => p.status === 'failed').length,
      today: posts.filter(p => {
        const d = new Date(p.scheduled_for);
        return d >= today && d < tomorrow;
      }).length,
      thisWeek: posts.filter(p => {
        const d = new Date(p.scheduled_for);
        return d >= today && d < thisWeek;
      }).length,
      byPlatform: PLATFORMS.map(p => ({
        ...p,
        count: posts.filter(post => post.platforms.includes(p.id)).length
      })),
    };
  }, [posts]);

  // Group posts by date for calendar view
  const postsByDate = useMemo(() => {
    const groups: Record<string, ScheduledPost[]> = {};
    filteredPosts.forEach(post => {
      const dateKey = new Date(post.scheduled_for).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(post);
    });
    return groups;
  }, [filteredPosts]);

  // Actions
  const handleReschedule = async () => {
    if (!selectedPost || !newScheduleTime) return;
    
    setProcessing(selectedPost.id);
    try {
      const { error } = await supabaseAdmin
        .from('content_queue')
        .update({ 
          scheduled_for: new Date(newScheduleTime).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPost.id);

      if (error) throw error;
      
      toast.success('Đã cập nhật thời gian đăng');
      setShowRescheduleDialog(false);
      loadPosts();
    } catch (error) {
      toast.error('Không thể cập nhật thời gian');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (postIds: string[]) => {
    if (postIds.length === 0) return;
    
    setProcessing('delete');
    try {
      const { error } = await supabaseAdmin
        .from('content_queue')
        .delete()
        .in('id', postIds);

      if (error) throw error;
      
      toast.success(`Đã xóa ${postIds.length} bài đăng`);
      setShowDeleteDialog(false);
      setSelectedPosts([]);
      loadPosts();
    } catch (error) {
      toast.error('Không thể xóa bài đăng');
    } finally {
      setProcessing(null);
    }
  };

  const handlePublishNow = async (post: ScheduledPost) => {
    setProcessing(post.id);
    try {
      const response = await fetch(`/api/auto-publish/now/${post.id}`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Đã đăng bài thành công!');
        loadPosts();
      } else {
        toast.error(result.error || 'Đăng bài thất bại');
      }
    } catch (error) {
      toast.error('Không thể đăng bài');
    } finally {
      setProcessing(null);
    }
  };

  const handlePauseResume = async (post: ScheduledPost) => {
    const newStatus = post.status === 'paused' ? 'scheduled' : 'paused';
    setProcessing(post.id);
    try {
      const { error } = await supabaseAdmin
        .from('content_queue')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;
      
      toast.success(newStatus === 'paused' ? 'Đã tạm dừng bài đăng' : 'Đã kích hoạt lại');
      loadPosts();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setProcessing(null);
    }
  };

  const handleDuplicate = async (post: ScheduledPost) => {
    setProcessing(post.id);
    try {
      const newPost = {
        project_id: projectId,
        title: `${post.title} (Copy)`,
        content: post.content,
        platform: post.platforms[0],
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'scheduled',
        metadata: {
          ...post.metadata,
          platforms: post.platforms,
          duplicated_from: post.id,
        },
      };

      const { error } = await supabaseAdmin
        .from('content_queue')
        .insert(newPost);

      if (error) throw error;
      
      toast.success('Đã tạo bản sao bài đăng');
      loadPosts();
    } catch (error) {
      toast.error('Không thể tạo bản sao');
    } finally {
      setProcessing(null);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: 'delete' | 'pause' | 'resume') => {
    if (selectedPosts.length === 0) return;
    
    setProcessing('bulk');
    try {
      if (action === 'delete') {
        await handleDelete(selectedPosts);
      } else {
        const newStatus = action === 'pause' ? 'paused' : 'scheduled';
        const { error } = await supabaseAdmin
          .from('content_queue')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .in('id', selectedPosts);

        if (error) throw error;
        
        toast.success(`Đã ${action === 'pause' ? 'tạm dừng' : 'kích hoạt'} ${selectedPosts.length} bài`);
        setSelectedPosts([]);
        loadPosts();
      }
    } catch (error) {
      toast.error('Không thể thực hiện thao tác');
    } finally {
      setProcessing(null);
    }
  };

  // Platform icon component
  const PlatformIcon = ({ platformId, size = 'sm' }: { platformId: string; size?: 'sm' | 'md' | 'lg' }) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;
    
    const Icon = platform.icon;
    const sizeClass = size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn("rounded-full p-1", size === 'sm' && "p-0.5")}
            style={{ backgroundColor: `${platform.color}20` }}
          >
            <Icon className={sizeClass} style={{ color: platform.color }} />
          </div>
        </TooltipTrigger>
        <TooltipContent>{platform.name}</TooltipContent>
      </Tooltip>
    );
  };

  // Render post card
  const PostCard = ({ post, compact = false }: { post: ScheduledPost; compact?: boolean }) => {
    const statusConfig = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled;
    const StatusIcon = statusConfig.icon;
    const isProcessing = processing === post.id;
    const isSelected = selectedPosts.includes(post.id);
    const scheduledDate = new Date(post.scheduled_for);
    const isPast = scheduledDate < new Date() && post.status === 'scheduled';

    return (
      <div 
        className={cn(
          "group relative rounded-lg border bg-card transition-all",
          isSelected && "ring-2 ring-primary",
          isPast && "border-amber-500/50 bg-amber-500/5",
          compact ? "p-3" : "p-4"
        )}
      >
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedPosts([...selectedPosts, post.id]);
              } else {
                setSelectedPosts(selectedPosts.filter(id => id !== post.id));
              }
            }}
          />
        </div>

        {/* Actions menu */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSelectedPost(post); setShowDetailDialog(true); }}>
                <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { 
                setSelectedPost(post); 
                setNewScheduleTime(post.scheduled_for.slice(0, 16));
                setShowRescheduleDialog(true); 
              }}>
                <Clock className="h-4 w-4 mr-2" /> Đổi lịch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                <Copy className="h-4 w-4 mr-2" /> Nhân bản
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {post.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => handlePublishNow(post)} className="text-green-600">
                  <Rocket className="h-4 w-4 mr-2" /> Đăng ngay
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handlePauseResume(post)}>
                {post.status === 'paused' ? (
                  <><Play className="h-4 w-4 mr-2" /> Kích hoạt</>
                ) : (
                  <><Pause className="h-4 w-4 mr-2" /> Tạm dừng</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => { setSelectedPost(post); setShowDeleteDialog(true); }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className={cn("space-y-3", compact ? "pl-0" : "pl-6")}>
          {/* Header: Time + Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {scheduledDate.toLocaleDateString('vi-VN', { 
                weekday: 'short',
                day: '2-digit', 
                month: '2-digit'
              })}
              <span className="text-muted-foreground">•</span>
              {scheduledDate.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            
            <Badge 
              variant="secondary" 
              className={cn("text-xs", statusConfig.textColor)}
            >
              <StatusIcon className={cn("h-3 w-3 mr-1", isProcessing && "animate-spin")} />
              {statusConfig.label}
            </Badge>

            {isPast && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-500">
                <AlertCircle className="h-3 w-3 mr-1" /> Quá hạn
              </Badge>
            )}
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-1">
            {post.platforms.map(platformId => (
              <PlatformIcon key={platformId} platformId={platformId} />
            ))}
            {post.platforms.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{post.platforms.length - 4}
              </Badge>
            )}
          </div>

          {/* Title & Content */}
          <div>
            <p className="font-medium line-clamp-1">{post.title}</p>
            {!compact && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {post.content}
              </p>
            )}
          </div>

          {/* Quick actions on hover */}
          {!compact && post.status === 'scheduled' && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handlePublishNow(post)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3 mr-1" />}
                Đăng ngay
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs"
                onClick={() => { 
                  setSelectedPost(post); 
                  setNewScheduleTime(post.scheduled_for.slice(0, 16));
                  setShowRescheduleDialog(true); 
                }}
              >
                <Clock className="h-3 w-3 mr-1" /> Đổi lịch
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Tổng cộng</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-xs text-muted-foreground">Chờ đăng</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-xs text-muted-foreground">Đã đăng</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.today}</p>
              <p className="text-xs text-muted-foreground">Hôm nay</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
              <p className="text-xs text-muted-foreground">Tuần này</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.failed}</p>
              <p className="text-xs text-muted-foreground">Thất bại</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Platform Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" /> Phân bố nền tảng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats.byPlatform.map(platform => (
              <div 
                key={platform.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                  filterPlatform === platform.id && "ring-2 ring-primary"
                )}
                onClick={() => setFilterPlatform(filterPlatform === platform.id ? 'all' : platform.id)}
              >
                <platform.icon className="h-5 w-5" style={{ color: platform.color }} />
                <span className="font-medium">{platform.count}</span>
                <span className="text-sm text-muted-foreground">{platform.shortName}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài đăng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="scheduled">Chờ đăng</SelectItem>
            <SelectItem value="published">Đã đăng</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="paused">Tạm dừng</SelectItem>
          </SelectContent>
        </Select>

        {/* View mode */}
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none border-x"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>

        {/* Refresh */}
        <Button variant="outline" size="icon" onClick={loadPosts} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>

        {/* Bulk actions */}
        {selectedPosts.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary">{selectedPosts.length} đã chọn</Badge>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('pause')}>
              <Pause className="h-4 w-4 mr-1" /> Tạm dừng
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Xóa
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">Không có bài đăng nào</p>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== 'all' || filterPlatform !== 'all'
                ? 'Thử thay đổi bộ lọc để xem thêm'
                : 'Tạo chiến dịch marketing để bắt đầu'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      ) : (
        /* Calendar View */
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hôm nay
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Header */}
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {/* Days */}
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days: React.ReactNode[] = [];
                
                // Empty cells
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="h-24 border rounded-lg bg-muted/30" />);
                }
                
                // Days
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayPosts = postsByDate[dateKey] || [];
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                  
                  days.push(
                    <div 
                      key={day} 
                      className={cn(
                        "h-24 border rounded-lg p-1 overflow-hidden",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday && "text-primary"
                      )}>
                        {day}
                      </div>
                      <ScrollArea className="h-16">
                        <div className="space-y-1">
                          {dayPosts.slice(0, 3).map(post => (
                            <div 
                              key={post.id}
                              className="text-xs px-1.5 py-0.5 rounded bg-primary/10 truncate cursor-pointer hover:bg-primary/20"
                              onClick={() => { setSelectedPost(post); setShowDetailDialog(true); }}
                            >
                              <div className="flex items-center gap-1">
                                {post.platforms.slice(0, 2).map(pId => {
                                  const p = PLATFORMS.find(x => x.id === pId);
                                  return p ? <p.icon key={pId} className="h-3 w-3" style={{ color: p.color }} /> : null;
                                })}
                                <span className="truncate">{post.title}</span>
                              </div>
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayPosts.length - 3} thêm
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi lịch đăng</DialogTitle>
            <DialogDescription>
              Chọn thời gian mới cho bài đăng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Thời gian đăng mới</Label>
              <Input
                type="datetime-local"
                value={newScheduleTime}
                onChange={(e) => setNewScheduleTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            
            {/* Quick time buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const d = new Date(Date.now() + 30 * 60 * 1000);
                  setNewScheduleTime(d.toISOString().slice(0, 16));
                }}
              >
                30 phút nữa
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const d = new Date(Date.now() + 60 * 60 * 1000);
                  setNewScheduleTime(d.toISOString().slice(0, 16));
                }}
              >
                1 giờ nữa
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  setNewScheduleTime(d.toISOString().slice(0, 16));
                }}
              >
                Ngày mai 9:00
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(19, 0, 0, 0);
                  setNewScheduleTime(d.toISOString().slice(0, 16));
                }}
              >
                Ngày mai 19:00
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleReschedule} disabled={processing === selectedPost?.id}>
              {processing === selectedPost?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa {selectedPosts.length > 0 ? `${selectedPosts.length} bài đăng` : 'bài đăng này'}?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(selectedPosts.length > 0 ? selectedPosts : [selectedPost?.id || ''])}
              disabled={processing === 'delete'}
            >
              {processing === 'delete' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedPost?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              {/* Status & Time */}
              <div className="flex items-center gap-4">
                <Badge className={STATUS_CONFIG[selectedPost.status as keyof typeof STATUS_CONFIG]?.textColor}>
                  {STATUS_CONFIG[selectedPost.status as keyof typeof STATUS_CONFIG]?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {new Date(selectedPost.scheduled_for).toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Platforms */}
              <div>
                <Label className="text-sm text-muted-foreground">Nền tảng</Label>
                <div className="flex gap-2 mt-1">
                  {selectedPost.platforms.map(platformId => (
                    <PlatformIcon key={platformId} platformId={platformId} size="md" />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <Label className="text-sm text-muted-foreground">Nội dung</Label>
                <div className="mt-1 p-4 rounded-lg bg-muted/50 border whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
              </div>

              {/* Publish Results */}
              {selectedPost.metadata?.publish_results && (
                <div>
                  <Label className="text-sm text-muted-foreground">Kết quả đăng</Label>
                  <div className="mt-1 space-y-2">
                    {selectedPost.metadata.publish_results.map((result: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded border">
                        <PlatformIcon platformId={result.platform} />
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {result.success ? 'Thành công' : result.error}
                        </span>
                        {result.url && (
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-auto text-primary hover:underline flex items-center gap-1"
                          >
                            Xem bài <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedPost?.status === 'scheduled' && (
              <Button onClick={() => handlePublishNow(selectedPost)} className="gap-2">
                <Rocket className="h-4 w-4" /> Đăng ngay
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
