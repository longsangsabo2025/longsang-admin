/**
 * useBulkOperations Hook
 * Manages bulk import, export, delete, and update operations
 */

import { brainAPI } from "@/brain/lib/services/brain-api";
import type {
  BulkIngestInput,
  BulkOperationResult,
  BulkUpdateInput,
  DomainExportData,
} from "@/brain/types/domain-agent.types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to bulk ingest knowledge
 */
export function useBulkIngest() {
  return useMutation({
    mutationFn: async (input: BulkIngestInput) => {
      return brainAPI.bulkIngestKnowledge(input.knowledge);
    },
    onSuccess: (result: BulkOperationResult) => {
      toast.success(
        `Bulk ingest completed: ${result.successful} successful, ${result.failed} failed`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to bulk ingest: ${error.message}`);
    },
  });
}

/**
 * Hook to export domain
 */
export function useExportDomain() {
  return useMutation({
    mutationFn: async ({ domainId, format = "json" }: { domainId: string; format?: "json" | "csv" }) => {
      return brainAPI.exportDomain(domainId, format);
    },
    onSuccess: () => {
      toast.success("Domain exported successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to export domain: ${error.message}`);
    },
  });
}

/**
 * Hook to bulk delete knowledge
 */
export function useBulkDelete() {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return brainAPI.bulkDeleteKnowledge(ids);
    },
    onSuccess: (result: BulkOperationResult) => {
      toast.success(`Deleted ${result.deleted} items`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to bulk delete: ${error.message}`);
    },
  });
}

/**
 * Hook to bulk update knowledge
 */
export function useBulkUpdate() {
  return useMutation({
    mutationFn: async (input: BulkUpdateInput) => {
      return brainAPI.bulkUpdateKnowledge(input.updates);
    },
    onSuccess: (result: BulkOperationResult) => {
      toast.success(
        `Bulk update completed: ${result.successful} successful, ${result.failed} failed`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to bulk update: ${error.message}`);
    },
  });
}

