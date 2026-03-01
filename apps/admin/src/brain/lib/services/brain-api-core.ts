/**
 * Brain API - Core Domain CRUD, Knowledge, Domain Agent & Statistics
 * Sections 1-4
 */

import type {
  ApiResponse,
  CreateDomainInput,
  Domain,
  DomainListResponse,
  IngestKnowledgeInput,
  Knowledge,
  KnowledgeSearchOptions,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
  UpdateDomainInput,
} from '@/brain/types/brain.types';
import type {
  DomainAnalytics,
  DomainQueryResponse,
  DomainStats,
  DomainSuggestion,
  DomainSummary,
  DomainTrends,
} from '@/brain/types/domain-agent.types';
import { type Constructor, BrainAPIBase, getUserId } from './brain-api-base';

export function withCoreMethods<T extends Constructor<BrainAPIBase>>(Base: T) {
  return class CoreMethods extends Base {
    // ============================================
    // Core Domain CRUD
    // ============================================

    /**
     * Get all domains for the current user
     */
    async getDomains(): Promise<Domain[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch domains' }));
        throw new Error(error.error || 'Failed to fetch domains');
      }

      const data: DomainListResponse & { error?: string } = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch domains');
      }

      return data.data || [];
    }

    /**
     * Get a domain by ID
     */
    async getDomain(id: string): Promise<Domain> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${id}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch domain' }));
        throw new Error(error.error || 'Failed to fetch domain');
      }

      const data: ApiResponse<Domain> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Domain not found');
      }

      return data.data;
    }

    /**
     * Create a new domain
     */
    async createDomain(input: CreateDomainInput): Promise<Domain> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create domain' }));
        throw new Error(error.error || 'Failed to create domain');
      }

      const data: ApiResponse<Domain> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to create domain');
      }

      return data.data;
    }

    /**
     * Update a domain
     */
    async updateDomain(id: string, input: UpdateDomainInput): Promise<Domain> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update domain' }));
        throw new Error(error.error || 'Failed to update domain');
      }

      const data: ApiResponse<Domain> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to update domain');
      }

      return data.data;
    }

    /**
     * Delete a domain
     */
    async deleteDomain(id: string): Promise<void> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${id}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete domain' }));
        throw new Error(error.error || 'Failed to delete domain');
      }

      const data: ApiResponse<void> = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete domain');
      }
    }

    // ============================================
    // Knowledge CRUD & Search
    // ============================================

    /**
     * Ingest knowledge into the brain
     */
    async ingestKnowledge(input: IngestKnowledgeInput): Promise<Knowledge> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/knowledge/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to ingest knowledge' }));
        throw new Error(error.error || 'Failed to ingest knowledge');
      }

      const data: ApiResponse<Knowledge> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to ingest knowledge');
      }

      return data.data;
    }

    /**
     * Search knowledge by text query
     */
    async searchKnowledge(
      query: string,
      options: KnowledgeSearchOptions = {}
    ): Promise<KnowledgeSearchResult[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const params = new URLSearchParams({
        q: query,
        userId,
        ...(options.domainId && { domainId: options.domainId }),
        ...(options.domainIds && { domainIds: options.domainIds.join(',') }),
        ...(options.matchThreshold !== undefined && {
          matchThreshold: options.matchThreshold.toString(),
        }),
        ...(options.matchCount !== undefined && { matchCount: options.matchCount.toString() }),
      });

      const response = await fetch(`${this.baseUrl}/brain/knowledge/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to search knowledge' }));
        throw new Error(error.error || 'Failed to search knowledge');
      }

      const data: KnowledgeSearchResponse & { error?: string } = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to search knowledge');
      }

      return data.data || [];
    }

    /**
     * Get knowledge by ID
     */
    async getKnowledge(id: string): Promise<Knowledge> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/knowledge/${id}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to fetch knowledge' }));
        throw new Error(error.error || 'Failed to fetch knowledge');
      }

      const data: ApiResponse<Knowledge> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Knowledge not found');
      }

      return data.data;
    }

    // ============================================
    // Domain Agent Methods
    // ============================================

    /**
     * Query domain agent
     */
    async queryDomainAgent(question: string, domainId: string): Promise<DomainQueryResponse> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to query domain agent' }));
        throw new Error(error.error || 'Failed to query domain agent');
      }

      const data: ApiResponse<DomainQueryResponse> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to query domain agent');
      }

      return data.data;
    }

    /**
     * Auto-tag knowledge
     */
    async autoTagKnowledge(
      knowledge: { title: string; content: string; tags?: string[] },
      domainId: string
    ): Promise<string[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/auto-tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ knowledge }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to auto-tag' }));
        throw new Error(error.error || 'Failed to auto-tag');
      }

      const data: ApiResponse<{ tags: string[] }> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to auto-tag');
      }

      return data.data.tags;
    }

    /**
     * Get domain suggestions
     */
    async getDomainSuggestions(domainId: string, limit = 5): Promise<DomainSuggestion[]> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/suggestions?limit=${limit}`,
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
          .catch(() => ({ error: 'Failed to get suggestions' }));
        throw new Error(error.error || 'Failed to get suggestions');
      }

      const data: ApiResponse<DomainSuggestion[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      return data.data;
    }

    /**
     * Generate domain summary
     */
    async generateDomainSummary(domainId: string): Promise<DomainSummary> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to generate summary' }));
        throw new Error(error.error || 'Failed to generate summary');
      }

      const data: ApiResponse<DomainSummary> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      return data.data;
    }

    // ============================================
    // Domain Statistics Methods
    // ============================================

    /**
     * Get domain statistics
     */
    async getDomainStats(domainId: string, refresh = false): Promise<DomainStats> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/stats?refresh=${refresh}`,
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

      const data: ApiResponse<DomainStats> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get statistics');
      }

      return data.data;
    }

    /**
     * Get domain analytics
     */
    async getDomainAnalytics(domainId: string, days = 30): Promise<DomainAnalytics> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/analytics?days=${days}`,
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
          .catch(() => ({ error: 'Failed to get analytics' }));
        throw new Error(error.error || 'Failed to get analytics');
      }

      const data: ApiResponse<DomainAnalytics> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get analytics');
      }

      return data.data;
    }

    /**
     * Get domain trends
     */
    async getDomainTrends(domainId: string): Promise<DomainTrends> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/trends`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to get trends' }));
        throw new Error(error.error || 'Failed to get trends');
      }

      const data: ApiResponse<DomainTrends> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to get trends');
      }

      return data.data;
    }
  };
}
