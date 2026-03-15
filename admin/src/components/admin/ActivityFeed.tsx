import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Bell, CheckCircle2, Clock, Send, XCircle, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineRunRow {
  id: string;
  created_at: string;
  status: string;
  input_data: { title?: string } | null;
  duration_ms: number | null;
}

interface ScheduledPostRow {
  id: string;
  created_at: string;
  platform: string;
  scheduled_time: string;
  title: string;
  status: string;
}

interface BrainNotificationRow {
  id: string;
  created_at: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
}

type FeedSource = 'pipeline' | 'post' | 'notification';

interface FeedItem {
  id: string;
  source: FeedSource;
  title: string;
  description: string;
  createdAt: Date;
  icon: typeof Activity;
  color: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LAST_SEEN_KEY = 'activity-feed-last-seen';
const MAX_ITEMS = 20;
const REFETCH_INTERVAL = 30_000;

function getLastSeen(): Date {
  const stored = localStorage.getItem(LAST_SEEN_KEY);
  return stored ? new Date(stored) : new Date(0);
}

function setLastSeen(date: Date) {
  localStorage.setItem(LAST_SEEN_KEY, date.toISOString());
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapPipelineRun(row: PipelineRunRow): FeedItem {
  const isSuccess = row.status === 'completed' || row.status === 'success';
  const pipelineTitle = row.input_data?.title ?? 'Pipeline';
  return {
    id: `pipeline-${row.id}`,
    source: 'pipeline',
    title: isSuccess ? 'Pipeline hoàn thành' : 'Pipeline thất bại',
    description: `${pipelineTitle}${row.duration_ms ? ` - ${Math.round(row.duration_ms / 1000)}s` : ''}`,
    createdAt: new Date(row.created_at),
    icon: isSuccess ? CheckCircle2 : XCircle,
    color: 'text-blue-500',
  };
}

function mapScheduledPost(row: ScheduledPostRow): FeedItem {
  return {
    id: `post-${row.id}`,
    source: 'post',
    title: 'Bài đăng đã lên lịch',
    description: `${row.platform} - "${row.title}" lúc ${formatTime(row.scheduled_time)}`,
    createdAt: new Date(row.created_at),
    icon: Send,
    color: 'text-green-500',
  };
}

function mapNotification(row: BrainNotificationRow): FeedItem {
  return {
    id: `notif-${row.id}`,
    source: 'notification',
    title: row.title || row.type,
    description: row.message,
    createdAt: new Date(row.created_at),
    icon: Bell,
    color: 'text-amber-500',
  };
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchActivityFeed(): Promise<FeedItem[]> {
  const [pipelinesRes, postsRes, notifsRes] = await Promise.all([
    supabase
      .from('pipeline_runs')
      .select('id, created_at, status, input_data, duration_ms')
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS),
    supabase
      .from('scheduled_posts')
      .select('id, created_at, platform, scheduled_time, title, status')
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS),
    supabase
      .from('brain_notifications')
      .select('id, created_at, type, title, message, read')
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS),
  ]);

  const items: FeedItem[] = [];

  if (pipelinesRes.data) {
    items.push(...(pipelinesRes.data as PipelineRunRow[]).map(mapPipelineRun));
  }
  if (postsRes.data) {
    items.push(...(postsRes.data as ScheduledPostRow[]).map(mapScheduledPost));
  }
  if (notifsRes.data) {
    items.push(...(notifsRes.data as BrainNotificationRow[]).map(mapNotification));
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items.slice(0, MAX_ITEMS);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityFeed() {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeenState] = useState<Date>(getLastSeen);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: fetchActivityFeed,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 10_000,
  });

  // Realtime subscription for pipeline_runs
  useEffect(() => {
    const channel = supabase
      .channel('activity-feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pipeline_runs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => item.createdAt > lastSeen).length;
  }, [items, lastSeen]);

  const handleMarkRead = useCallback(() => {
    const now = new Date();
    setLastSeen(now);
    setLastSeenState(now);
  }, []);

  const handleOpen = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
  }, []);

  // Source icon for the left gutter
  const sourceIcon = (source: FeedSource) => {
    switch (source) {
      case 'pipeline':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'post':
        return <Send className="h-4 w-4 text-green-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Activity Feed">
          <Activity className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-semibold">Hoạt động hệ thống</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkRead}>
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        {/* Feed list */}
        <ScrollArea className="h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
              <Activity className="mb-2 h-8 w-8 opacity-30" />
              Chưa có hoạt động nào
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const isUnread = item.createdAt > lastSeen;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                      isUnread && 'bg-muted/30'
                    )}
                  >
                    {/* Source indicator */}
                    <div className="mt-0.5 flex-shrink-0">{sourceIcon(item.source)}</div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{item.title}</p>
                        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', item.color)} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {relativeTime(item.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={() => {
              setOpen(false);
              window.location.href = '/admin/mission-control';
            }}
          >
            Xem tất cả →
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
