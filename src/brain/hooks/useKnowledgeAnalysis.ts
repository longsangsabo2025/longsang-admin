/**
 * useKnowledgeAnalysis Hook
 * Manages knowledge analysis operations
 */

import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  KnowledgeAnalysisResult,
  KnowledgePattern,
  KeyConcept,
  KnowledgeRelationship,
  KnowledgeTopic,
} from '@/brain/types/core-logic.types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook to analyze domain knowledge
 */
export function useAnalyzeDomain(domainId: string | null) {
  return useMutation({
    mutationFn: async () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.analyzeDomainKnowledge(domainId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to analyze domain: ${error.message}`);
    },
  });
}

/**
 * Hook to get knowledge patterns
 */
export function useKnowledgePatterns(domainId: string | null) {
  return useQuery<KnowledgePattern[]>({
    queryKey: ['brain', 'knowledge-patterns', domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getKnowledgePatterns(domainId);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get key concepts
 */
export function useKeyConcepts(domainId: string | null) {
  return useQuery<KeyConcept[]>({
    queryKey: ['brain', 'key-concepts', domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getKeyConcepts(domainId);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get relationships
 */
export function useRelationships(domainId: string | null) {
  return useQuery<KnowledgeRelationship[]>({
    queryKey: ['brain', 'relationships', domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getRelationships(domainId);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get topics
 */
export function useTopics(domainId: string | null) {
  return useQuery<KnowledgeTopic[]>({
    queryKey: ['brain', 'topics', domainId],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getTopics(domainId);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
