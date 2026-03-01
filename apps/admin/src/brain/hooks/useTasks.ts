import { brainAPI } from '@/brain/lib/services/brain-api';
import type { Task, TaskInput } from '@/brain/types/task.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_TASKS = ['brain', 'tasks'];

/**
 * Hook to fetch tasks for the user.
 */
export function useTasks(
  status?: Task['status'],
  priority?: Task['priority'],
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery<Task[]>({
    queryKey: [...QUERY_KEY_TASKS, status, priority, limit],
    queryFn: () => brainAPI.getTasks(status, priority, limit),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch a single task by ID.
 */
export function useTask(taskId: string | null, enabled: boolean = true) {
  return useQuery<Task>({
    queryKey: [...QUERY_KEY_TASKS, taskId],
    queryFn: () => {
      if (!taskId) throw new Error('Task ID is required.');
      return brainAPI.getTask(taskId);
    },
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new task.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, TaskInput>({
    mutationFn: (input) => brainAPI.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_TASKS });
      toast.success('Task created successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing task.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, { id: string; updates: Partial<TaskInput> }>({
    mutationFn: ({ id, updates }) => brainAPI.updateTask(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_TASKS });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_TASKS, id] });
      toast.success('Task updated successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a task.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => brainAPI.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_TASKS });
      toast.success('Task deleted successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}
