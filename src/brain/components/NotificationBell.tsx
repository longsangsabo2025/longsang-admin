import {
  useNotifications,
  useMarkNotificationAsRead,
  useDeleteNotification,
} from '@/brain/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  MailOpen,
  Trash2,
  Loader2,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, isLoading: isLoadingNotifications } = useNotifications(
    false,
    undefined,
    10,
    isOpen
  );
  const markAsReadMutation = useMarkNotificationAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const handleMarkAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotificationMutation.mutateAsync(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-purple-500" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
        </div>
        {isLoadingNotifications ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground text-sm">Loading notifications...</p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 hover:bg-muted/50">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Metadata: {JSON.stringify(notification.metadata)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        title="Mark as read"
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteNotification(notification.id)}
                      disabled={deleteNotificationMutation.isPending}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="p-3 text-center text-muted-foreground text-sm">No new notifications.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
