/**
 * useMultiDomain Hook
 * Manages multi-domain query operations
 */

import { brainAPI } from "@/brain/lib/services/brain-api";
import type {
  MultiDomainQueryRequest,
  MultiDomainQueryResult,
  SynthesizedResponse,
  RoutingDecision,
  DomainRelevance,
  RoutingHistoryEntry,
} from "@/brain/types/multi-domain.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to query across multiple domains
 */
export function useMultiDomainQuery() {
  return useMutation<
    SynthesizedResponse,
    Error,
    { query: string; domainIds?: string[]; options?: MultiDomainQueryRequest["options"] }
  >({
    mutationFn: ({ query, domainIds, options }) => brainAPI.multiDomainQuery(query, domainIds, options),
    onError: (error) => {
      toast.error(`Multi-domain query failed: ${error.message}`);
    },
  });
}

/**
 * Hook to route query to domains
 */
export function useRouteQuery() {
  return useMutation<RoutingDecision, Error, { query: string; options?: any }>({
    mutationFn: ({ query, options }) => brainAPI.routeQuery(query, options),
    onError: (error) => {
      toast.error(`Query routing failed: ${error.message}`);
    },
  });
}

/**
 * Hook to get relevant domains for query
 */
export function useRelevantDomains(query: string | null, maxDomains: number = 5) {
  return useQuery<DomainRelevance[]>({
    queryKey: ["brain", "relevant-domains", query, maxDomains],
    queryFn: () => {
      if (!query) throw new Error("Query is required");
      return brainAPI.getRelevantDomains(query, maxDomains);
    },
    enabled: !!query && query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to synthesize multi-domain response
 */
export function useSynthesizeResponse() {
  return useMutation<
    SynthesizedResponse,
    Error,
    { query: string; domainIds?: string[]; results?: MultiDomainQueryResult[]; options?: any }
  >({
    mutationFn: ({ query, domainIds, results, options }) =>
      brainAPI.synthesizeResponse(query, domainIds, results, options),
    onError: (error) => {
      toast.error(`Synthesis failed: ${error.message}`);
    },
  });
}

/**
 * Hook to get routing history
 */
export function useRoutingHistory(limit: number = 50) {
  return useQuery<RoutingHistoryEntry[]>({
    queryKey: ["brain", "routing-history", limit],
    queryFn: () => brainAPI.getRoutingHistory(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

