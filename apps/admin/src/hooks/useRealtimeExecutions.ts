/**
 * Real-time Executions Hook
 *
 * Subscribes to workflow execution updates via Supabase real-time
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Execution {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  cost_usd: number;
  current_step: string | null;
  total_steps: number;
  completed_steps: number;
  error_message: string | null;
}

export const useRealtimeExecutions = () => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchExecutions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('workflow_executions_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'workflow_executions',
        },
        (payload) => {
          console.log('Real-time update received:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              // Add new execution
              setExecutions((prev) => [payload.new as Execution, ...prev]);
              break;

            case 'UPDATE':
              // Update existing execution
              setExecutions((prev) =>
                prev.map((exec) => (exec.id === payload.new.id ? (payload.new as Execution) : exec))
              );
              break;

            case 'DELETE':
              // Remove deleted execution
              setExecutions((prev) => prev.filter((exec) => exec.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchExecutions = async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('workflow_executions')
        .select(
          `
          *,
          workflows:workflow_id (
            name
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // Transform data to include workflow name
      const transformedData =
        data?.map((exec) => ({
          ...exec,
          workflow_name: exec.workflows?.name || 'Unknown Workflow',
        })) || [];

      setExecutions(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching executions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchExecutions();
  };

  return {
    executions,
    loading,
    error,
    refetch,
  };
};

// Export individual execution subscription hook
export const useExecutionSubscription = (executionId: string) => {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!executionId) return;

    // Fetch initial data
    const fetchExecution = async () => {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (!error && data) {
        setExecution(data as Execution);
      }
      setLoading(false);
    };

    fetchExecution();

    // Subscribe to updates for this specific execution
    const channel = supabase
      .channel(`execution_${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_executions',
          filter: `id=eq.${executionId}`,
        },
        (payload) => {
          setExecution(payload.new as Execution);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [executionId]);

  return { execution, loading };
};

export default useRealtimeExecutions;
