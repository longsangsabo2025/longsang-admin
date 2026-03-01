/**
 * TypeScript Types for Notifications
 */

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'insight' | 'reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationInput {
  type?: NotificationType;
  message: string;
  metadata?: Record<string, any>;
}
