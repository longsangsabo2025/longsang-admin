/**
 * TypeScript Types for Multi-Domain Features
 */

/**
 * Domain Relevance
 */
export interface DomainRelevance {
  domainId: string;
  domainName: string;
  relevanceScore: number;
  rank: number;
}

/**
 * Routing Decision
 */
export interface RoutingDecision {
  query: string;
  selectedDomains: DomainRelevance[];
  routingConfidence: number;
  routingId?: string;
  domainScores: Record<string, number>;
}

/**
 * Multi-Domain Query Request
 */
export interface MultiDomainQueryRequest {
  query: string;
  domainIds?: string[];
  options?: {
    maxDomains?: number;
    minScore?: number;
    matchThreshold?: number;
    matchCount?: number;
    rerank?: boolean;
    keywordBoost?: boolean;
    limit?: number;
  };
}

/**
 * Multi-Domain Query Result
 */
export interface MultiDomainQueryResult {
  id: string;
  title: string;
  content: string;
  domainId: string;
  domainName?: string;
  similarity: number;
  domainRelevance?: number;
  combinedScore?: number;
  tags?: string[];
  createdAt?: string;
}

/**
 * Synthesized Response
 */
export interface SynthesizedResponse {
  query: string;
  response: string;
  results: MultiDomainQueryResult[];
  context: string;
  tokensUsed?: number;
  resultCount: number;
}

/**
 * Routing History Entry
 */
export interface RoutingHistoryEntry {
  id: string;
  queryText: string;
  selectedDomainIds: string[];
  routingStrategy: string;
  routingConfidence: number;
  domainScores: Record<string, number>;
  resultsCount: number;
  resultsQualityScore: number;
  latencyMs?: number;
  tokensUsed?: number;
  userRating?: number;
  userFeedback?: string;
  wasHelpful?: boolean;
  createdAt: string;
}

