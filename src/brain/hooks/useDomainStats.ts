/**
 * useDomainStats Hook
 * Manages domain statistics and analytics
 */

import { brainAPI } from "@/brain/lib/services/brain-api";
import type { DomainAnalytics, DomainStats, DomainTrends } from "@/brain/types/domain-agent.types";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get domain statistics
 */
export function useDomainStats(domainId: string | null, refresh = false) {
  return useQuery<DomainStats>({
    queryKey: ["brain", "domain-stats", domainId],
    queryFn: () => {
      if (!domainId) throw new Error("Domain ID is required");
      return brainAPI.getDomainStats(domainId, refresh);
    },
    enabled: !!domainId,
    staleTime: refresh ? 0 : 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get domain analytics
 */
export function useDomainAnalytics(domainId: string | null, days = 30) {
  return useQuery<DomainAnalytics>({
    queryKey: ["brain", "domain-analytics", domainId, days],
    queryFn: () => {
      if (!domainId) throw new Error("Domain ID is required");
      return brainAPI.getDomainAnalytics(domainId, days);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get domain trends
 */
export function useDomainTrends(domainId: string | null) {
  return useQuery<DomainTrends>({
    queryKey: ["brain", "domain-trends", domainId],
    queryFn: () => {
      if (!domainId) throw new Error("Domain ID is required");
      return brainAPI.getDomainTrends(domainId);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

