/**
 * Solo Founder Hub - React Hooks
 * Custom hooks for data fetching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { soloHubApi } from '@/services/solo-hub.service';
import type {
  MorningBriefing,
  AIAgent,
  AgentTask,
  CreateTaskInput,
  Decision,
  AgentMemory,
  CreateMemoryInput,
  AgentCommunication,
} from '@/types/solo-hub.types';
import { toast } from 'sonner';

// Query keys
export const soloHubKeys = {
  all: ['solo-hub'] as const,
  briefings: () => [...soloHubKeys.all, 'briefings'] as const,
  briefingToday: () => [...soloHubKeys.briefings(), 'today'] as const,
  agents: () => [...soloHubKeys.all, 'agents'] as const,
  agentById: (id: string) => [...soloHubKeys.agents(), id] as const,
  agentPerformance: () => [...soloHubKeys.agents(), 'performance'] as const,
  tasks: () => [...soloHubKeys.all, 'tasks'] as const,
  tasksByAgent: (agentId: string) => [...soloHubKeys.tasks(), 'agent', agentId] as const,
  decisions: () => [...soloHubKeys.all, 'decisions'] as const,
  decisionsSummary: () => [...soloHubKeys.decisions(), 'summary'] as const,
  memory: () => [...soloHubKeys.all, 'memory'] as const,
  memoryCategories: () => [...soloHubKeys.memory(), 'categories'] as const,
  communications: () => [...soloHubKeys.all, 'communications'] as const,
  unreadCount: () => [...soloHubKeys.communications(), 'unread'] as const,
};

// =====================================================
// MORNING BRIEFING HOOKS
// =====================================================

/**
 * Get today's morning briefing
 */
export function useTodayBriefing() {
  return useQuery({
    queryKey: soloHubKeys.briefingToday(),
    queryFn: async () => {
      const result = await soloHubApi.briefings.getToday();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Trigger briefing generation
 */
export function useTriggerBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => soloHubApi.briefings.triggerGeneration(),
    onSuccess: () => {
      toast.success('Briefing generation triggered');
      // Refetch after a delay to allow n8n to process
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: soloHubKeys.briefingToday() });
      }, 10000);
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger briefing: ${error.message}`);
    },
  });
}

/**
 * Mark briefing as read
 */
export function useMarkBriefingRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => soloHubApi.briefings.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: soloHubKeys.briefingToday() });
    },
  });
}

// =====================================================
// AI AGENTS HOOKS
// =====================================================

/**
 * Get all AI agents
 */
export function useAgents() {
  return useQuery({
    queryKey: soloHubKeys.agents(),
    queryFn: async () => {
      const result = await soloHubApi.agents.getAll();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get agent by ID
 */
export function useAgent(id: string) {
  return useQuery({
    queryKey: soloHubKeys.agentById(id),
    queryFn: async () => {
      const result = await soloHubApi.agents.getById(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Get agent performance summary
 */
export function useAgentPerformance() {
  return useQuery({
    queryKey: soloHubKeys.agentPerformance(),
    queryFn: async () => {
      const result = await soloHubApi.agents.getPerformance();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Update agent status
 */
export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AIAgent['status'] }) =>
      soloHubApi.agents.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: soloHubKeys.agents() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });
}

/**
 * Create default agents
 */
export function useCreateDefaultAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => soloHubApi.agents.createDefaults(),
    onSuccess: () => {
      toast.success('Default agents created');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.agents() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create agents: ${error.message}`);
    },
  });
}

// =====================================================
// AGENT TASKS HOOKS
// =====================================================

/**
 * Get all tasks
 */
export function useTasks(filters?: {
  status?: AgentTask['status'];
  agent_id?: string;
  task_type?: AgentTask['task_type'];
}) {
  return useQuery({
    queryKey: [...soloHubKeys.tasks(), filters],
    queryFn: async () => {
      const result = await soloHubApi.tasks.getAll(filters);
      return result;
    },
    staleTime: 10 * 1000, // 10 seconds
  });
}

/**
 * Get tasks by agent
 */
export function useTasksByAgent(agentId: string) {
  return useQuery({
    queryKey: soloHubKeys.tasksByAgent(agentId),
    queryFn: async () => {
      const result = await soloHubApi.tasks.getByAgent(agentId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!agentId,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => soloHubApi.tasks.create(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Task created and assigned to agent');
        queryClient.invalidateQueries({ queryKey: soloHubKeys.tasks() });
      } else {
        toast.error(result.error || 'Failed to create task');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

/**
 * Update task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      output_data,
    }: {
      id: string;
      status: AgentTask['status'];
      output_data?: Record<string, unknown>;
    }) => soloHubApi.tasks.updateStatus(id, status, output_data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: soloHubKeys.tasks() });
    },
  });
}

// =====================================================
// DECISION QUEUE HOOKS
// =====================================================

/**
 * Get pending decisions
 */
export function usePendingDecisions() {
  return useQuery({
    queryKey: soloHubKeys.decisions(),
    queryFn: async () => {
      const result = await soloHubApi.decisions.getPending();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Get decisions summary
 */
export function useDecisionsSummary() {
  return useQuery({
    queryKey: soloHubKeys.decisionsSummary(),
    queryFn: async () => {
      const result = await soloHubApi.decisions.getSummary();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Approve a decision
 */
export function useApproveDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback?: string }) =>
      soloHubApi.decisions.approve(id, feedback),
    onSuccess: () => {
      toast.success('Decision approved');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.decisions() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

/**
 * Reject a decision
 */
export function useRejectDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback?: string }) =>
      soloHubApi.decisions.reject(id, feedback),
    onSuccess: () => {
      toast.info('Decision rejected');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.decisions() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });
}

/**
 * Defer a decision
 */
export function useDeferDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => soloHubApi.decisions.defer(id),
    onSuccess: () => {
      toast.info('Decision deferred to later');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.decisions() });
    },
  });
}

// =====================================================
// AGENT MEMORY HOOKS
// =====================================================

/**
 * Get all memories
 */
export function useMemories(filters?: {
  memory_type?: AgentMemory['memory_type'];
  category?: string;
  importance?: AgentMemory['importance'];
  search?: string;
}) {
  return useQuery({
    queryKey: [...soloHubKeys.memory(), filters],
    queryFn: async () => {
      const result = await soloHubApi.memory.getAll(filters);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get memory categories
 */
export function useMemoryCategories() {
  return useQuery({
    queryKey: soloHubKeys.memoryCategories(),
    queryFn: async () => {
      const result = await soloHubApi.memory.getCategories();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

/**
 * Create a new memory
 */
export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMemoryInput) => soloHubApi.memory.create(input),
    onSuccess: () => {
      toast.success('Memory added');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.memory() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add memory: ${error.message}`);
    },
  });
}

/**
 * Update a memory
 */
export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AgentMemory> }) =>
      soloHubApi.memory.update(id, updates),
    onSuccess: () => {
      toast.success('Memory updated');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.memory() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update memory: ${error.message}`);
    },
  });
}

/**
 * Delete a memory
 */
export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => soloHubApi.memory.delete(id),
    onSuccess: () => {
      toast.success('Memory deleted');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.memory() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete memory: ${error.message}`);
    },
  });
}

/**
 * Search memories
 */
export function useSearchMemories(query: string) {
  return useQuery({
    queryKey: [...soloHubKeys.memory(), 'search', query],
    queryFn: async () => {
      const result = await soloHubApi.memory.semanticSearch(query);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: query.length > 2,
    staleTime: 30 * 1000,
  });
}

// =====================================================
// AGENT COMMUNICATIONS HOOKS
// =====================================================

/**
 * Get recent communications
 */
export function useCommunications(limit = 50) {
  return useQuery({
    queryKey: soloHubKeys.communications(),
    queryFn: async () => {
      const result = await soloHubApi.communications.getRecent(limit);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 10 * 1000,
  });
}

/**
 * Get unread count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: soloHubKeys.unreadCount(),
    queryFn: async () => {
      const result = await soloHubApi.communications.getUnreadCount();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Mark communication as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => soloHubApi.communications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: soloHubKeys.communications() });
      queryClient.invalidateQueries({ queryKey: soloHubKeys.unreadCount() });
    },
  });
}

/**
 * Mark all communications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => soloHubApi.communications.markAllAsRead(),
    onSuccess: () => {
      toast.success('All messages marked as read');
      queryClient.invalidateQueries({ queryKey: soloHubKeys.communications() });
      queryClient.invalidateQueries({ queryKey: soloHubKeys.unreadCount() });
    },
  });
}
