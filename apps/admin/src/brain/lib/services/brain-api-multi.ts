/**
 * Brain API - Multi-Domain, Routing History, Master Brain & Knowledge Graph
 * Sections 8-11
 */

import type { ApiResponse } from '@/brain/types/brain.types';
import type {
  MultiDomainQueryRequest,
  SynthesizedResponse,
  RoutingDecision,
  DomainRelevance,
  RoutingHistoryEntry,
} from '@/brain/types/multi-domain.types';
import type {
  MasterBrainQueryRequest,
  MasterBrainQueryResponse,
  MasterBrainSession,
  SessionState,
} from '@/brain/types/master-brain.types';
import type {
  BuildGraphResponse,
  GraphPath,
  RelatedConcept,
  GraphTraversalResult,
  GraphStatistics,
} from '@/brain/types/knowledge-graph.types';
import { type Constructor, BrainAPIBase, getUserId } from './brain-api-base';

export function withMultiMethods<T extends Constructor<BrainAPIBase>>(Base: T) {
  return class MultiMethods extends Base {
    // ============================================
    // Multi-Domain Methods
    // ============================================

    /**
     * Query across multiple domains
     */
    async multiDomainQuery(
      query: string,
      domainIds?: string[],
      options?: MultiDomainQueryRequest['options']
    ): Promise<SynthesizedResponse> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, domainIds, options }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to query' }));
        throw new Error(error.error || 'Failed to query');
      }

      const data: ApiResponse<SynthesizedResponse> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to query');
      }

      return data.data;
    }

    /**
     * Route query to domains
     */
    async routeQuery(query: string, options?: any): Promise<RoutingDecision> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, options }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to route' }));
        throw new Error(error.error || 'Failed to route');
      }

      const data: ApiResponse<RoutingDecision> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to route');
      }

      return data.data;
    }

    /**
     * Get relevant domains for query
     */
    async getRelevantDomains(
      query: string,
      maxDomains: number = 5
    ): Promise<DomainRelevance[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/domains/relevant?q=${encodeURIComponent(
          query
        )}&maxDomains=${maxDomains}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get relevant domains' }));
        throw new Error(error.error || 'Failed to get relevant domains');
      }

      const data: ApiResponse<DomainRelevance[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get relevant domains');
      }

      return data.data;
    }

    /**
     * Synthesize multi-domain response
     */
    async synthesizeResponse(
      query: string,
      domainIds?: string[],
      results?: any[],
      options?: any
    ): Promise<SynthesizedResponse> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, domainIds, results, options }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to synthesize' }));
        throw new Error(error.error || 'Failed to synthesize');
      }

      const data: ApiResponse<SynthesizedResponse> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to synthesize');
      }

      return data.data;
    }

    // ============================================
    // Routing History
    // ============================================

    /**
     * Get routing history
     */
    async getRoutingHistory(limit: number = 50): Promise<RoutingHistoryEntry[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/routing/history?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get history' }));
        throw new Error(error.error || 'Failed to get history');
      }

      const data: ApiResponse<RoutingHistoryEntry[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get history');
      }

      return data.data;
    }

    // ============================================
    // Master Brain Methods
    // ============================================

    /**
     * Query Master Brain
     */
    async masterBrainQuery(
      query: string,
      sessionId?: string,
      options?: MasterBrainQueryRequest['options']
    ): Promise<MasterBrainQueryResponse> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/master/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, sessionId, options }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to query Master Brain' }));
        throw new Error(error.error || 'Failed to query Master Brain');
      }

      const data: ApiResponse<MasterBrainQueryResponse> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to query Master Brain');
      }

      return data.data;
    }

    /**
     * Create Master Brain session
     */
    async createMasterSession(
      sessionName: string,
      domainIds: string[],
      options?: any
    ): Promise<string> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/master/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ sessionName, domainIds, options }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to create session' }));
        throw new Error(error.error || 'Failed to create session');
      }

      const data: ApiResponse<{ sessionId: string }> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to create session');
      }

      return data.data.sessionId;
    }

    /**
     * Get Master Brain session state
     */
    async getMasterSessionState(sessionId: string): Promise<SessionState> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/master/session/${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get session' }));
        throw new Error(error.error || 'Failed to get session');
      }

      const data: ApiResponse<SessionState> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get session');
      }

      return data.data;
    }

    /**
     * Get all Master Brain sessions
     */
    async getMasterBrainSessions(): Promise<MasterBrainSession[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/master/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get sessions' }));
        throw new Error(error.error || 'Failed to get sessions');
      }

      const data: ApiResponse<MasterBrainSession[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get sessions');
      }

      return data.data;
    }

    /**
     * End Master Brain session
     */
    async endMasterSession(
      sessionId: string,
      rating?: number,
      feedback?: string
    ): Promise<void> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/master/session/${sessionId}/end`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ rating, feedback }),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to end session' }));
        throw new Error(error.error || 'Failed to end session');
      }
    }

    // ============================================
    // Knowledge Graph Methods
    // ============================================

    /**
     * Build knowledge graph
     */
    async buildKnowledgeGraph(domainId: string): Promise<BuildGraphResponse> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/graph/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ domainId }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to build graph' }));
        throw new Error(error.error || 'Failed to build graph');
      }

      const data: ApiResponse<BuildGraphResponse> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to build graph');
      }

      return data.data;
    }

    /**
     * Find paths between nodes
     */
    async findGraphPaths(
      sourceNodeId: string,
      targetNodeId: string,
      maxDepth?: number
    ): Promise<GraphPath[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const params = new URLSearchParams({
        sourceNodeId,
        targetNodeId,
      });
      if (maxDepth) {
        params.append('maxDepth', maxDepth.toString());
      }

      const response = await fetch(
        `${this.baseUrl}/brain/graph/paths?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to find paths' }));
        throw new Error(error.error || 'Failed to find paths');
      }

      const data: ApiResponse<GraphPath[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to find paths');
      }

      return data.data;
    }

    /**
     * Get related concepts
     */
    async getRelatedConcepts(
      nodeId: string,
      maxResults: number = 10
    ): Promise<RelatedConcept[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/graph/related?nodeId=${nodeId}&maxResults=${maxResults}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get related concepts' }));
        throw new Error(error.error || 'Failed to get related concepts');
      }

      const data: ApiResponse<RelatedConcept[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get related concepts');
      }

      return data.data;
    }

    /**
     * Traverse graph
     */
    async traverseGraph(
      startNodeId: string,
      maxDepth?: number
    ): Promise<GraphTraversalResult[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/graph/traverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ startNodeId, maxDepth }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to traverse graph' }));
        throw new Error(error.error || 'Failed to traverse graph');
      }

      const data: ApiResponse<GraphTraversalResult[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to traverse graph');
      }

      return data.data;
    }

    /**
     * Get graph statistics
     */
    async getGraphStatistics(domainId?: string): Promise<GraphStatistics> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const params = new URLSearchParams();
      if (domainId) {
        params.append('domainId', domainId);
      }

      const response = await fetch(
        `${this.baseUrl}/brain/graph/statistics?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get statistics' }));
        throw new Error(error.error || 'Failed to get statistics');
      }

      const data: ApiResponse<GraphStatistics> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get statistics');
      }

      return data.data;
    }
  };
}
