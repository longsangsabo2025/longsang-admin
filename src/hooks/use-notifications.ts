// ================================================
// REAL-TIME NOTIFICATIONS HOOK
// ================================================
// Subscribes to agent events and shows toast notifications

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export function useNotifications(agentId?: string) {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to activity logs
    const channel = supabase
      .channel('agent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: agentId ? `agent_id=eq.${agentId}` : undefined,
        },
        (payload) => {
          const log = payload.new as ActivityLog;
          
          // Show toast based on status
          if (log.status === 'error') {
            toast({
              title: '❌ Agent Error',
              description: log.error_message || log.action,
              variant: 'destructive',
            });
          } else if (log.status === 'success') {
            toast({
              title: '✅ Success',
              description: log.action,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, toast]);
}

// Budget alert notifications
export function useBudgetAlerts(agentId?: string) {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('budget-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'budget_alerts',
          filter: agentId ? `agent_id=eq.${agentId}` : undefined,
        },
        (payload) => {
          const alert = payload.new as Database['public']['Tables']['budget_alerts']['Row'];
          
          toast({
            title: '⚠️ Budget Alert',
            description: `${alert.alert_type}: ${alert.message}`,
            variant: alert.alert_type === 'exceeded' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, toast]);
}

// Content queue notifications
export function useContentNotifications(agentId?: string) {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('content-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_queue',
          filter: agentId ? `agent_id=eq.${agentId}` : undefined,
        },
        (payload) => {
          const content = payload.new as Database['public']['Tables']['content_queue']['Row'];
          const oldContent = payload.old as Database['public']['Tables']['content_queue']['Row'];
          
          // Notify when content is published
          if (oldContent.status !== 'published' && content.status === 'published') {
            toast({
              title: '📤 Content Published',
              description: content.title || 'Content published successfully',
            });
          }
          
          // Notify when content fails
          if (content.status === 'failed') {
            toast({
              title: '❌ Publishing Failed',
              description: content.error_message || 'Content failed to publish',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, toast]);
}
