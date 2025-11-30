import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Bot,
  Workflow,
  Settings,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'agent' | 'workflow' | 'system';
  category?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Mock data - replace with real Supabase queries
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Agent Execution Complete',
        message: 'Marketing Specialist đã hoàn thành task tạo nội dung',
        type: 'agent',
        category: 'agent-execution',
        link: '/agent-center',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: '2',
        title: 'Workflow Finished',
        message: 'AI Content Factory workflow đã chạy thành công',
        type: 'workflow',
        category: 'workflow-complete',
        link: '/admin/workflows',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: '3',
        title: 'System Update',
        message: 'Hệ thống đã được cập nhật lên phiên bản 2.5.0',
        type: 'system',
        category: 'system-alert',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: '4',
        title: 'Credential Accessed',
        message: 'OpenAI API Key đã được truy cập',
        type: 'warning',
        category: 'credential-access',
        link: '/admin/credentials',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '5',
        title: 'File Upload Complete',
        message: '5 files đã được upload lên Google Drive',
        type: 'success',
        category: 'file-upload',
        link: '/admin/files',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.is_read).length);

    // TODO: Setup Supabase Realtime subscription
    // const subscription = supabase
    //   .channel('notifications')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
    //     // Handle new notifications
    //   })
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'agent':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'workflow':
        return <Workflow className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
    return `${Math.floor(diffMins / 1440)} ngày trước`;
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    // TODO: Update in Supabase
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast({
      title: "Đã đánh dấu tất cả",
      description: "Tất cả thông báo đã được đánh dấu là đã đọc",
    });
    // TODO: Update in Supabase
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.is_read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
    // TODO: Delete from Supabase
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Thông Báo</h3>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Không có thông báo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors group relative",
                    !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" className="w-full" size="sm">
                Xem tất cả thông báo
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
