import { brainAPI } from '@/brain/lib/services/brain-api';
import type { Workflow, WorkflowInput } from '@/brain/types/workflow.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_WORKFLOWS = ['brain', 'workflows'];

/**
 * Hook to fetch all workflows for the user.
 */
export function useWorkflows(enabled: boolean = true) {
  return useQuery<Workflow[]>({
    queryKey: QUERY_KEY_WORKFLOWS,
    queryFn: () => brainAPI.getWorkflows(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single workflow by ID.
 */
export function useWorkflow(workflowId: string | null, enabled: boolean = true) {
  return useQuery<Workflow>({
    queryKey: [...QUERY_KEY_WORKFLOWS, workflowId],
    queryFn: () => {
      if (!workflowId) throw new Error('Workflow ID is required.');
      return brainAPI.getWorkflow(workflowId);
    },
    enabled: enabled && !!workflowId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new workflow.
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation<Workflow, Error, WorkflowInput>({
    mutationFn: (input) => brainAPI.createWorkflow(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_WORKFLOWS });
      toast.success('Workflow created successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing workflow.
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation<Workflow, Error, { id: string; updates: Partial<WorkflowInput> }>({
    mutationFn: ({ id, updates }) => brainAPI.updateWorkflow(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_WORKFLOWS });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_WORKFLOWS, id] });
      toast.success('Workflow updated successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a workflow.
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => brainAPI.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_WORKFLOWS });
      toast.success('Workflow deleted successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to delete workflow: ${error.message}`);
    },
  });
}

/**
 * Hook to test a workflow by simulating an event.
 */
export function useTestWorkflow() {
  return useMutation<
    { message: string; actionsQueued: number },
    Error,
    { id: string; eventType?: string; context?: Record<string, any> }
  >({
    mutationFn: ({ id, eventType, context }) => brainAPI.testWorkflow(id, eventType, context),
    onSuccess: (data) => {
      toast.success(`Workflow test completed: ${data.actionsQueued} actions queued.`);
    },
    onError: (error) => {
      toast.error(`Failed to test workflow: ${error.message}`);
    },
  });
}
