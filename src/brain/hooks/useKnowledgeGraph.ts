/**
 * useKnowledgeGraph Hook
 * Manages knowledge graph operations
 */

import { brainAPI } from "@/brain/lib/services/brain-api";
import type {
  BuildGraphResponse,
  GraphPath,
  RelatedConcept,
  GraphTraversalResult,
  GraphStatistics,
} from "@/brain/types/knowledge-graph.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to build knowledge graph
 */
export function useBuildGraph() {
  return useMutation<BuildGraphResponse, Error, { domainId: string }>({
    mutationFn: ({ domainId }) => brainAPI.buildKnowledgeGraph(domainId),
    onSuccess: (data) => {
      toast.success(`Graph built: ${data.nodesCreated} nodes, ${data.edgesCreated} edges`);
    },
    onError: (error) => {
      toast.error(`Failed to build graph: ${error.message}`);
    },
  });
}

/**
 * Hook to find paths between nodes
 */
export function useFindPaths() {
  return useMutation<
    GraphPath[],
    Error,
    { sourceNodeId: string; targetNodeId: string; maxDepth?: number }
  >({
    mutationFn: ({ sourceNodeId, targetNodeId, maxDepth }) =>
      brainAPI.findGraphPaths(sourceNodeId, targetNodeId, maxDepth),
    onError: (error) => {
      toast.error(`Failed to find paths: ${error.message}`);
    },
  });
}

/**
 * Hook to get related concepts
 */
export function useRelatedConcepts(nodeId: string | null, maxResults: number = 10) {
  return useQuery<RelatedConcept[]>({
    queryKey: ["brain", "related-concepts", nodeId, maxResults],
    queryFn: () => {
      if (!nodeId) throw new Error("Node ID is required");
      return brainAPI.getRelatedConcepts(nodeId, maxResults);
    },
    enabled: !!nodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to traverse graph
 */
export function useTraverseGraph() {
  return useMutation<
    GraphTraversalResult[],
    Error,
    { startNodeId: string; maxDepth?: number }
  >({
    mutationFn: ({ startNodeId, maxDepth }) => brainAPI.traverseGraph(startNodeId, maxDepth),
    onError: (error) => {
      toast.error(`Failed to traverse graph: ${error.message}`);
    },
  });
}

/**
 * Hook to get graph statistics
 */
export function useGraphStatistics(domainId: string | null) {
  return useQuery<GraphStatistics>({
    queryKey: ["brain", "graph-statistics", domainId],
    queryFn: () => {
      return brainAPI.getGraphStatistics(domainId || undefined);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

