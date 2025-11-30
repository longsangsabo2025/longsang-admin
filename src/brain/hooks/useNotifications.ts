import { brainAPI } from '@/brain/lib/services/brain-api';
import type { Notification } from '@/brain/types/notification.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_NOTIFICATIONS = ['brain', 'notifications'];

/**
 * Hook to fetch notifications for the user.
 */
export function useNotifications(
  isRead?: boolean,
  type?: Notification['type'],
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery<Notification[]>({
    queryKey: [...QUERY_KEY_NOTIFICATIONS, isRead, type, limit],
    queryFn: () => brainAPI.getNotifications(isRead, type, limit),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
  });
}

/**
 * Hook to mark a notification as read.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation<Notification, Error, string>({
    mutationFn: (id) => brainAPI.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
      toast.success('Notification marked as read.');
    },
    onError: (error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => brainAPI.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTIFICATIONS });
      toast.success('Notification deleted successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });
}
