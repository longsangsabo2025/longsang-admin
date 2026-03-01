/**
 * 🔔 Scheduled Post Notification System
 * 
 * Tính năng:
 * - Browser push notifications khi đến giờ đăng bài
 * - Toast notifications trong app
 * - Check scheduled posts mỗi phút
 * - Sound alert option
 * 
 * @author LongSang
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

interface ScheduledPost {
  id: string;
  image_url: string;
  caption: string;
  platforms: string[];
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'draft';
  project_slug: string;
}

interface NotificationConfig {
  enableSound: boolean;
  enableBrowserNotification: boolean;
  advanceMinutes: number; // Notify X minutes before scheduled time
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: NotificationConfig = {
  enableSound: true,
  enableBrowserNotification: true,
  advanceMinutes: 5, // Notify 5 minutes before
};

// =============================================================================
// NOTIFICATION MANAGER
// =============================================================================

class ScheduledPostNotifier {
  private intervalId: number | null = null;
  private config: NotificationConfig = DEFAULT_CONFIG;
  private notifiedPostIds: Set<string> = new Set();
  private checkIntervalMs = 60000; // Check every minute
  
  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
  
  /**
   * Start checking for scheduled posts
   */
  start(config?: Partial<NotificationConfig>): void {
    if (this.intervalId !== null) {
      console.log('Notifier already running');
      return;
    }
    
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    // Request permission first
    this.requestPermission();
    
    // Start checking
    this.checkScheduledPosts();
    this.intervalId = window.setInterval(() => {
      this.checkScheduledPosts();
    }, this.checkIntervalMs);
    
    console.log('📢 Scheduled post notifier started');
  }
  
  /**
   * Stop checking
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📢 Scheduled post notifier stopped');
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Check for posts that need notification
   */
  private async checkScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const advanceMs = this.config.advanceMinutes * 60 * 1000;
      const checkUntil = new Date(now.getTime() + advanceMs);
      
      // Get scheduled posts in the next X minutes
      // Note: Table may use 'scheduled_time' or 'publish_at' instead of 'scheduled_at'
      const { data: posts, error } = await supabaseAdmin
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_time', checkUntil.toISOString())
        .gte('scheduled_time', now.toISOString())
        .order('scheduled_time', { ascending: true });
      
      if (error) {
        // Silently skip if table doesn't exist or column is wrong
        // This prevents console spam when feature isn't set up
        if (error.code === '42703' || error.message?.includes('does not exist')) {
          // Column doesn't exist - feature not configured, skip silently
          return;
        }
        console.warn('[ScheduledPostNotifier] Error fetching posts:', error.message);
        return;
      }
      
      if (!posts || posts.length === 0) {
        return;
      }
      
      // Notify for each post that hasn't been notified
      for (const post of posts as ScheduledPost[]) {
        if (!this.notifiedPostIds.has(post.id)) {
          await this.notifyPost(post);
          this.notifiedPostIds.add(post.id);
        }
      }
    } catch {
      // Silently ignore - database may not have this table/column configured
      // This is expected when feature is not set up
    }
  }
  
  /**
   * Send notification for a post
   */
  private async notifyPost(post: ScheduledPost): Promise<void> {
    // Support both scheduled_at and scheduled_time column names
    const scheduledTimeStr = (post as any).scheduled_time || post.scheduled_at;
    const scheduledTime = new Date(scheduledTimeStr);
    const now = new Date();
    const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
    
    const platformList = post.platforms.join(', ');
    const title = minutesUntil <= 0 
      ? '🔔 Đến giờ đăng bài!'
      : `🔔 ${minutesUntil} phút nữa đăng bài!`;
    const body = `Platforms: ${platformList}\n${post.caption.substring(0, 50)}...`;
    
    // In-app toast notification
    toast(title, {
      description: body,
      duration: 10000,
      action: {
        label: 'Xem',
        onClick: () => {
          // Navigate to auto-publish page with scheduled tab
          window.location.href = '/admin/auto-publish';
        },
      },
    });
    
    // Browser notification
    if (this.config.enableBrowserNotification && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: post.image_url,
        tag: post.id,
        requireInteraction: true,
      });
      
      notification.onclick = () => {
        window.focus();
        window.location.href = '/admin/auto-publish';
        notification.close();
      };
    }
    
    // Sound alert
    if (this.config.enableSound) {
      this.playNotificationSound();
    }
  }
  
  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore autoplay errors
        console.log('Could not play notification sound');
      });
    } catch {
      console.log('Notification sound not available');
    }
  }
  
  /**
   * Check if a specific post needs attention now
   */
  async checkSpecificPost(postId: string): Promise<boolean> {
    try {
      const { data: post, error } = await supabaseAdmin
        .from('scheduled_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error || !post) return false;
      
      const now = new Date();
      // Support both column names
      const scheduledTimeStr = (post as any).scheduled_time || post.scheduled_at;
      const scheduledTime = new Date(scheduledTimeStr);
      const advanceMs = this.config.advanceMinutes * 60 * 1000;
      
      return scheduledTime.getTime() - now.getTime() <= advanceMs;
    } catch {
      return false;
    }
  }
  
  /**
   * Get upcoming posts count
   */
  async getUpcomingCount(withinMinutes: number = 30): Promise<number> {
    try {
      const now = new Date();
      const until = new Date(now.getTime() + withinMinutes * 60 * 1000);
      
      const { count, error } = await supabaseAdmin
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .lte('scheduled_time', until.toISOString())
        .gte('scheduled_time', now.toISOString());
      
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  }
  
  /**
   * Clear notified posts cache (call when navigating away)
   */
  clearNotifiedCache(): void {
    this.notifiedPostIds.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const scheduledPostNotifier = new ScheduledPostNotifier();

// =============================================================================
// HOOKS
// =============================================================================

import { useEffect, useState } from 'react';

/**
 * Hook to manage scheduled post notifications
 */
export function useScheduledPostNotifications(autoStart: boolean = true) {
  const [isRunning, setIsRunning] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  
  useEffect(() => {
    if (autoStart) {
      scheduledPostNotifier.start();
      setIsRunning(true);
    }
    
    // Fetch upcoming count
    const updateCount = async () => {
      const count = await scheduledPostNotifier.getUpcomingCount();
      setUpcomingCount(count);
    };
    
    updateCount();
    const countInterval = setInterval(updateCount, 60000);
    
    return () => {
      clearInterval(countInterval);
    };
  }, [autoStart]);
  
  const start = () => {
    scheduledPostNotifier.start();
    setIsRunning(true);
  };
  
  const stop = () => {
    scheduledPostNotifier.stop();
    setIsRunning(false);
  };
  
  const requestPermission = async () => {
    return scheduledPostNotifier.requestPermission();
  };
  
  return {
    isRunning,
    upcomingCount,
    start,
    stop,
    requestPermission,
  };
}
