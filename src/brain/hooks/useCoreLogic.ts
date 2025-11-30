/**
 * useCoreLogic Hook
 * Manages core logic operations
 */

import { brainAPI } from "@/brain/lib/services/brain-api";
import type {
  CoreLogic,
  CoreLogicVersion,
  CoreLogicComparison,
  DistillationOptions,
} from "@/brain/types/core-logic.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to get core logic for domain
 */
export function useCoreLogic(domainId: string | null, version?: number) {
  return useQuery<CoreLogic>({
    queryKey: ["brain", "core-logic", domainId, version],
    queryFn: () => {
      if (!domainId) throw new Error("Domain ID is required");
      return brainAPI.getCoreLogic(domainId, version);
    },
    enabled: !!domainId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get all versions
 */
export function useCoreLogicVersions(domainId: string | null) {
  return useQuery<CoreLogicVersion[]>({
    queryKey: ["brain", "core-logic-versions", domainId],
    queryFn: () => {
      if (!domainId) throw new Error("Domain ID is required");
      return brainAPI.getCoreLogicVersions(domainId);
    },
    enabled: !!domainId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to trigger distillation
 */
export function useDistillCoreLogic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      domainId,
      options,
    }: {
      domainId: string;
      options?: DistillationOptions;
    }) => {
      return brainAPI.distillCoreLogic(domainId, options);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "core-logic", variables.domainId] });
      queryClient.invalidateQueries({ queryKey: ["brain", "core-logic-versions", variables.domainId] });
      toast.success(`Core logic distilled successfully (version ${data.version})`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to distill core logic: ${error.message}`);
    },
  });
}

/**
 * Hook to compare versions
 */
export function useCompareVersions() {
  return useMutation({
    mutationFn: async ({
      version1Id,
      version2Id,
    }: {
      version1Id: string;
      version2Id: string;
    }) => {
      return brainAPI.compareCoreLogicVersions(version1Id, version2Id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to compare versions: ${error.message}`);
    },
  });
}

/**
 * Hook to rollback version
 */
export function useRollbackVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      domainId,
      targetVersion,
      reason,
    }: {
      domainId: string;
      targetVersion: number;
      reason?: string;
    }) => {
      return brainAPI.rollbackCoreLogicVersion(domainId, targetVersion, reason);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brain", "core-logic", variables.domainId] });
      queryClient.invalidateQueries({ queryKey: ["brain", "core-logic-versions", variables.domainId] });
      toast.success(`Rolled back to version ${variables.targetVersion}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to rollback: ${error.message}`);
    },
  });
}

