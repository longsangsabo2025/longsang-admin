import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  FeedbackInput,
  LearningMetric,
  RoutingWeight,
  KnowledgeQualityScore,
  ImprovementSuggestion,
} from '@/brain/types/learning.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY_LEARNING = ['brain', 'learning'];

/**
 * Hook to submit feedback
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, FeedbackInput>({
    mutationFn: (input) => brainAPI.submitFeedback(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_LEARNING, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY_LEARNING, 'routing-accuracy'] });
      toast.success('Feedback submitted successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });
}

/**
 * Hook to get learning metrics
 */
export function useLearningMetrics(
  metricType?: string,
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery<LearningMetric[]>({
    queryKey: [...QUERY_KEY_LEARNING, 'metrics', metricType, limit],
    queryFn: () => brainAPI.getLearningMetrics(metricType, limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get routing accuracy
 */
export function useRoutingAccuracy(timeRangeHours: number = 24, enabled: boolean = true) {
  return useQuery<{ accuracy: number; timeRangeHours: number }>({
    queryKey: [...QUERY_KEY_LEARNING, 'routing-accuracy', timeRangeHours],
    queryFn: () => brainAPI.getRoutingAccuracy(timeRangeHours),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get routing weights
 */
export function useRoutingWeights(enabled: boolean = true) {
  return useQuery<RoutingWeight[]>({
    queryKey: [...QUERY_KEY_LEARNING, 'routing-weights'],
    queryFn: () => brainAPI.getRoutingWeights(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to score knowledge item
 */
export function useScoreKnowledge() {
  return useMutation<KnowledgeQualityScore, Error, string>({
    mutationFn: (knowledgeId) => brainAPI.scoreKnowledgeItem(knowledgeId),
    onSuccess: () => {
      toast.success('Knowledge item scored successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to score knowledge item: ${error.message}`);
    },
  });
}

/**
 * Hook to get improvement suggestions
 */
export function useImprovementSuggestions(knowledgeId: string | null, enabled: boolean = true) {
  return useQuery<ImprovementSuggestion[]>({
    queryKey: [...QUERY_KEY_LEARNING, 'improvements', knowledgeId],
    queryFn: () => {
      if (!knowledgeId) throw new Error('Knowledge ID is required');
      return brainAPI.getImprovementSuggestions(knowledgeId);
    },
    enabled: enabled && !!knowledgeId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
