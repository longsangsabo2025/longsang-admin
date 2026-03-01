/**
 * 🔔 Notification Bell Component
 * 
 * Hiển thị trên header với:
 * - Số bài sắp đăng
 * - Toggle on/off notifications
 * - List upcoming posts
 */

import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellOff, Clock, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { useScheduledPostNotifications } from '@/lib/notifications/scheduled-post-notifier';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ScheduledPost {
  id: string;
  image_url: string;
  caption: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { isRunning, upcomingCount, start, stop, requestPermission } = useScheduledPostNotifications(true);
  
  // Fetch upcoming posts for the next 24 hours
  const { data: upcomingPosts = [] } = useQuery({
    queryKey: ['upcoming-scheduled-posts'],
    queryFn: async () => {
      try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const { data, error } = await supabaseAdmin
          .from('scheduled_posts')
          .select('*')
          .eq('status', 'scheduled')
          .gte('scheduled_time', now.toISOString())
          .lte('scheduled_time', tomorrow.toISOString())
          .order('scheduled_time', { ascending: true })
          .limit(10);
        
        if (error) {
          // Silently return empty if table/column doesn't exist
          if (error.code === '42703' || error.message?.includes('does not exist')) {
            return [];
          }
          throw error;
        }
        return data as ScheduledPost[];
      } catch {
        // Feature not set up, return empty
        return [];
      }
    },
    refetchInterval: 60000, // Refetch every minute
    retry: false, // Don't retry if feature not configured
  });
  
  const handleToggleNotifications = async () => {
    if (isRunning) {
      stop();
    } else {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        start();
      }
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isRunning ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {upcomingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {upcomingCount > 9 ? '9+' : upcomingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Lịch đăng bài</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isRunning ? 'Bật' : 'Tắt'}
              </span>
              <Switch 
                checked={isRunning} 
                onCheckedChange={handleToggleNotifications}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-2">
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {upcomingPosts.length} bài sắp đăng
            </Badge>
          </div>
          
          {/* Upcoming Posts List */}
          {upcomingPosts.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {upcomingPosts.map((post) => (
                  <div 
                    key={post.id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <img 
                      src={post.image_url} 
                      alt="" 
                      className="h-12 w-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {post.caption.substring(0, 40)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.scheduled_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                        <span className="text-xs">
                          {post.platforms.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Không có bài nào sắp đăng</p>
            </div>
          )}
          
          {/* Footer */}
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/admin/auto-publish';
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Xem tất cả lịch đăng
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
