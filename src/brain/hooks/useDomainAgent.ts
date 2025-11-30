/**
 * useDomainAgent Hook
 * Manages domain agent operations
 */

import { brainAPI } from '@/brain/lib/services/brain-api';
import type {
  DomainQueryRequest,
  DomainQueryResponse,
  DomainSuggestion,
  DomainSummary,
} from '@/brain/types/domain-agent.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook to query domain agent
 */
export function useDomainQuery() {
  return useMutation({
    mutationFn: async (request: DomainQueryRequest) => {
      return brainAPI.queryDomainAgent(request.question, request.domainId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to query domain agent: ${error.message}`);
    },
  });
}

/**
 * Hook to auto-tag knowledge
 */
export function useAutoTag() {
  return useMutation({
    mutationFn: async ({
      knowledge,
      domainId,
    }: {
      knowledge: { title: string; content: string; tags?: string[] };
      domainId: string;
    }) => {
      return brainAPI.autoTagKnowledge(knowledge, domainId);
    },
    onSuccess: () => {
      toast.success('Tags generated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to auto-tag: ${error.message}`);
    },
  });
}

/**
 * Hook to get domain suggestions
 */
export function useDomainSuggestions(domainId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['brain', 'domain-suggestions', domainId, limit],
    queryFn: () => {
      if (!domainId) throw new Error('Domain ID is required');
      return brainAPI.getDomainSuggestions(domainId, limit);
    },
    enabled: !!domainId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to generate domain summary
 */
export function useDomainSummary() {
  return useMutation({
    mutationFn: async (domainId: string) => {
      return brainAPI.generateDomainSummary(domainId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });
}
