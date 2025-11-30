import { brainAPI } from '@/brain/lib/services/brain-api';
import type { Action, ActionInput } from '@/brain/types/action.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_ACTIONS = ['brain', 'actions'];

/**
 * Hook to queue a new action.
 */
export function useQueueAction() {
  const queryClient = useQueryClient();
  return useMutation<Action, Error, ActionInput>({
    mutationFn: (input) => brainAPI.queueAction(input.actionType, input.payload, input.sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_ACTIONS });
      toast.success('Action queued successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to queue action: ${error.message}`);
    },
  });
}

/**
 * Hook to fetch action history.
 */
export function useActionHistory(
  status?: Action['status'],
  actionType?: string,
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery<Action[]>({
    queryKey: [...QUERY_KEY_ACTIONS, status, actionType, limit],
    queryFn: () => brainAPI.getActionHistory(status, actionType, limit),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for active monitoring
  });
}

/**
 * Hook to manually trigger execution of pending actions.
 * Primarily for development/testing.
 */
export function useExecutePendingActions() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => brainAPI.executePendingActions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_ACTIONS });
      toast.success('Pending actions execution triggered.');
    },
    onError: (error) => {
      toast.error(`Failed to trigger pending actions execution: ${error.message}`);
    },
  });
}
