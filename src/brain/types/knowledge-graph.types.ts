/**
 * TypeScript Types for Knowledge Graph Features
 */

/**
 * Knowledge Graph Node
 */
export interface KnowledgeNode {
  id: string;
  nodeType: "concept" | "knowledge" | "domain" | "principle" | "model" | "rule" | "pattern";
  nodeId?: string;
  nodeLabel: string;
  nodeDescription?: string;
  properties: Record<string, any>;
  domainId?: string;
  importanceScore: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Knowledge Graph Edge
 */
export interface KnowledgeEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType:
    | "related_to"
    | "similar_to"
    | "depends_on"
    | "contradicts"
    | "supports"
    | "part_of"
    | "instance_of";
  edgeLabel?: string;
  edgeWeight: number;
  properties: Record<string, any>;
  confidenceScore: number;
  isCrossDomain: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Graph Path
 */
export interface GraphPath {
  pathId: number;
  pathLength: number;
  pathNodes: string[];
  pathEdges: string[];
  totalWeight: number;
}

/**
 * Related Concept
 */
export interface RelatedConcept {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  edgeType: string;
  edgeWeight: number;
  similarityScore: number;
}

/**
 * Graph Traversal Result
 */
export interface GraphTraversalResult {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  depth: number;
  pathFromStart: string[];
}

/**
 * Graph Statistics
 */
export interface GraphStatistics {
  nodeCount: number;
  edgeCount: number;
  domainId: string | "all";
}

/**
 * Build Graph Request
 */
export interface BuildGraphRequest {
  domainId: string;
}

/**
 * Build Graph Response
 */
export interface BuildGraphResponse {
  nodesCreated: number;
  edgesCreated: number;
  domainId: string;
}

/**
 * Find Paths Request
 */
export interface FindPathsRequest {
  sourceNodeId: string;
  targetNodeId: string;
  maxDepth?: number;
}

/**
 * Traverse Graph Request
 */
export interface TraverseGraphRequest {
  startNodeId: string;
  maxDepth?: number;
}

