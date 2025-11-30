import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  RelatedKnowledge,
  TaskSuggestion,
  UsagePattern,
  Reminder,
  UserNeedPrediction,
  AnticipatedQuery,
  KnowledgeGap,
  DomainGrowthForecast,
} from '@/brain/types/suggestions.types';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEY_SUGGESTIONS = ['brain', 'suggestions'];

/**
 * Hook to get related knowledge
 */
export function useRelatedKnowledge(knowledgeId: string | null, enabled: boolean = true) {
  return useQuery<RelatedKnowledge[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'related', knowledgeId],
    queryFn: () => {
      if (!knowledgeId) throw new Error('Knowledge ID is required');
      return brainAPI.getRelatedKnowledge(knowledgeId);
    },
    enabled: enabled && !!knowledgeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get task suggestions
 */
export function useTaskSuggestions(context?: Record<string, any>, enabled: boolean = true) {
  return useQuery<TaskSuggestion[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'tasks', context],
    queryFn: () => brainAPI.getTaskSuggestions(context),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get detected patterns
 */
export function usePatterns(enabled: boolean = true) {
  return useQuery<UsagePattern[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'patterns'],
    queryFn: () => brainAPI.getPatterns(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get smart reminders
 */
export function useReminders(enabled: boolean = true) {
  return useQuery<Reminder[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'reminders'],
    queryFn: () => brainAPI.getReminders(),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to get user need predictions
 */
export function usePredictions(enabled: boolean = true) {
  return useQuery<UserNeedPrediction[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'predictions', 'user-needs'],
    queryFn: () => brainAPI.getUserNeedPredictions(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get anticipated queries
 */
export function useAnticipatedQueries(enabled: boolean = true) {
  return useQuery<AnticipatedQuery[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'predictions', 'queries'],
    queryFn: () => brainAPI.getAnticipatedQueries(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get knowledge gaps
 */
export function useKnowledgeGaps(domainId: string | null, enabled: boolean = true) {
  return useQuery<KnowledgeGap[]>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'predictions', 'knowledge-gaps', domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getKnowledgeGaps(domainId);
    },
    enabled: enabled && !!domainId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to get domain growth forecast
 */
export function useDomainGrowthForecast(domainId: string | null, enabled: boolean = true) {
  return useQuery<DomainGrowthForecast>({
    queryKey: [...QUERY_KEY_SUGGESTIONS, 'predictions', 'domain-growth', domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getDomainGrowthForecast(domainId);
    },
    enabled: enabled && !!domainId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}


