/**
 * Brain API Client
 * Handles all API calls to the brain endpoints
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
  BulkOperationResult,
  DomainAnalytics,
  DomainExportData,
  DomainQueryResponse,
  DomainStats,
  DomainSuggestion,
  DomainSummary,
  DomainTrends,
} from '@/brain/types/domain-agent.types';
import type {
  CoreLogic,
  CoreLogicVersion,
  CoreLogicComparison,
  DistillationOptions,
  KnowledgeAnalysisResult,
  KnowledgePattern,
  KeyConcept,
  KnowledgeRelationship,
  KnowledgeTopic,
} from '@/brain/types/core-logic.types';
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
import { API_URL } from '@/config/api';

/**
 * Get the current user ID
 * Note: This should be replaced with actual auth system integration
 */
function getUserId(): string | null {
  // This should be replaced with actual auth system
  // For now, we'll try to get it from localStorage or return default dev user
  if (globalThis.window !== undefined) {
    const stored = globalThis.window.localStorage.getItem('userId');
    if (stored) return stored;

    // Fallback to default dev user ID for development
    const isDev = import.meta.env?.DEV || globalThis.window.location.hostname === 'localhost';
    if (isDev) {
      // Use default dev user ID and store it
      const defaultDevUserId = '6490f4e9-ed96-4121-9c70-bb4ad1feb71d';
      globalThis.window.localStorage.setItem('userId', defaultDevUserId);
      return defaultDevUserId;
    }
  }
  return null;
}

/**
 * Brain API Client Class
 */
export class BrainAPI {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

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

    const data: DomainListResponse = await response.json();
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
      const error = await response.json().catch(() => ({ error: 'Failed to ingest knowledge' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to search knowledge' }));
      throw new Error(error.error || 'Failed to search knowledge');
    }

    const data: KnowledgeSearchResponse = await response.json();
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
      const error = await response.json().catch(() => ({ error: 'Failed to fetch knowledge' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to query domain agent' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to get suggestions' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to generate summary' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to get statistics' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to get analytics' }));
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

  // ============================================
  // Bulk Operations Methods
  // ============================================

  /**
   * Bulk ingest knowledge
   */
  async bulkIngestKnowledge(
    knowledge: Array<{
      domainId: string;
      title: string;
      content: string;
      contentType?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }>
  ): Promise<BulkOperationResult> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/knowledge/bulk-ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ knowledge }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to bulk ingest' }));
      throw new Error(error.error || 'Failed to bulk ingest');
    }

    const data: ApiResponse<BulkOperationResult> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to bulk ingest');
    }

    return data.data;
  }

  /**
   * Export domain
   */
  async exportDomain(
    domainId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<DomainExportData | string> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(
      `${this.baseUrl}/brain/knowledge/domains/${domainId}/export?format=${format}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to export domain' }));
      throw new Error(error.error || 'Failed to export domain');
    }

    if (format === 'csv') {
      return await response.text();
    }

    const data: ApiResponse<DomainExportData> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to export domain');
    }

    return data.data;
  }

  /**
   * Bulk delete knowledge
   */
  async bulkDeleteKnowledge(ids: string[]): Promise<BulkOperationResult> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/knowledge/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to bulk delete' }));
      throw new Error(error.error || 'Failed to bulk delete');
    }

    const data: ApiResponse<BulkOperationResult> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to bulk delete');
    }

    return data.data;
  }

  /**
   * Bulk update knowledge
   */
  async bulkUpdateKnowledge(
    updates: Array<{
      id: string;
      title?: string;
      content?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }>
  ): Promise<BulkOperationResult> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/knowledge/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to bulk update' }));
      throw new Error(error.error || 'Failed to bulk update');
    }

    const data: ApiResponse<BulkOperationResult> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to bulk update');
    }

    return data.data;
  }

  // ============================================
  // Core Logic Methods
  // ============================================

  /**
   * Distill core logic from domain knowledge
   */
  async distillCoreLogic(domainId: string, options?: DistillationOptions): Promise<CoreLogic> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/core-logic/distill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ options }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to distill core logic' }));
      throw new Error(error.error || 'Failed to distill core logic');
    }

    const data: ApiResponse<CoreLogic> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to distill core logic');
    }

    return data.data;
  }

  /**
   * Get core logic for domain
   */
  async getCoreLogic(domainId: string, version?: number): Promise<CoreLogic> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const params = new URLSearchParams({});
    if (version) {
      params.append('version', version.toString());
    }

    const response = await fetch(
      `${this.baseUrl}/brain/domains/${domainId}/core-logic?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get core logic' }));
      throw new Error(error.error || 'Failed to get core logic');
    }

    const data: ApiResponse<CoreLogic> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Core logic not found');
    }

    return data.data;
  }

  /**
   * Get all versions for domain
   */
  async getCoreLogicVersions(domainId: string): Promise<CoreLogicVersion[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/core-logic/versions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get versions' }));
      throw new Error(error.error || 'Failed to get versions');
    }

    const data: ApiResponse<CoreLogicVersion[]> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get versions');
    }

    return data.data;
  }

  /**
   * Compare two versions
   */
  async compareCoreLogicVersions(
    version1Id: string,
    version2Id: string
  ): Promise<CoreLogicComparison> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/dummy/core-logic/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ version1Id, version2Id }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to compare versions' }));
      throw new Error(error.error || 'Failed to compare versions');
    }

    const data: ApiResponse<CoreLogicComparison> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to compare versions');
    }

    return data.data;
  }

  /**
   * Rollback to previous version
   */
  async rollbackCoreLogicVersion(
    domainId: string,
    targetVersion: number,
    reason?: string
  ): Promise<CoreLogic> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/core-logic/rollback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ targetVersion, reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to rollback' }));
      throw new Error(error.error || 'Failed to rollback');
    }

    const data: ApiResponse<CoreLogic> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to rollback');
    }

    return data.data;
  }

  // ============================================
  // Knowledge Analysis Methods
  // ============================================

  /**
   * Analyze domain knowledge
   */
  async analyzeDomainKnowledge(domainId: string): Promise<KnowledgeAnalysisResult> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to analyze' }));
      throw new Error(error.error || 'Failed to analyze');
    }

    const data: ApiResponse<KnowledgeAnalysisResult> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to analyze');
    }

    return data.data;
  }

  /**
   * Get knowledge patterns
   */
  async getKnowledgePatterns(domainId: string): Promise<KnowledgePattern[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/patterns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get patterns' }));
      throw new Error(error.error || 'Failed to get patterns');
    }

    const data: ApiResponse<KnowledgePattern[]> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get patterns');
    }

    return data.data;
  }

  /**
   * Get key concepts
   */
  async getKeyConcepts(domainId: string): Promise<KeyConcept[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/concepts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get concepts' }));
      throw new Error(error.error || 'Failed to get concepts');
    }

    const data: ApiResponse<KeyConcept[]> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get concepts');
    }

    return data.data;
  }

  /**
   * Get relationships
   */
  async getRelationships(domainId: string): Promise<KnowledgeRelationship[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/relationships`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get relationships' }));
      throw new Error(error.error || 'Failed to get relationships');
    }

    const data: ApiResponse<KnowledgeRelationship[]> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get relationships');
    }

    return data.data;
  }

  /**
   * Get topics
   */
  async getTopics(domainId: string): Promise<KnowledgeTopic[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/domains/${domainId}/topics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get topics' }));
      throw new Error(error.error || 'Failed to get topics');
    }

    const data: ApiResponse<KnowledgeTopic[]> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get topics');
    }

    return data.data;
  }

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
  async getRelevantDomains(query: string, maxDomains: number = 5): Promise<DomainRelevance[]> {
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
      const error = await response.json().catch(() => ({ error: 'Failed to synthesize' }));
      throw new Error(error.error || 'Failed to synthesize');
    }

    const data: ApiResponse<SynthesizedResponse> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to synthesize');
    }

    return data.data;
  }

  /**
   * Get routing history
   */
  async getRoutingHistory(limit: number = 50): Promise<RoutingHistoryEntry[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/routing/history?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get history' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to query Master Brain' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to create session' }));
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

    const response = await fetch(`${this.baseUrl}/brain/master/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get session' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to get sessions' }));
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
  async endMasterSession(sessionId: string, rating?: number, feedback?: string): Promise<void> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please authenticate.');
    }

    const response = await fetch(`${this.baseUrl}/brain/master/session/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ rating, feedback }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to end session' }));
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
      const error = await response.json().catch(() => ({ error: 'Failed to build graph' }));
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

    const response = await fetch(`${this.baseUrl}/brain/graph/paths?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to find paths' }));
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
  async getRelatedConcepts(nodeId: string, maxResults: number = 10): Promise<RelatedConcept[]> {
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
  async traverseGraph(startNodeId: string, maxDepth?: number): Promise<GraphTraversalResult[]> {
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
      const error = await response.json().catch(() => ({ error: 'Failed to traverse graph' }));
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

    const response = await fetch(`${this.baseUrl}/brain/graph/statistics?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get statistics' }));
      throw new Error(error.error || 'Failed to get statistics');
    }

    const data: ApiResponse<GraphStatistics> = await response.json();
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get statistics');
    }

    return data.data;
  }

  /**
   * Phase 5 - Actions
   */
  async getActions(
    status?: string,
    limit: number = 50
  ): Promise<import('@/brain/types/action.types').BrainAction[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const url = new URL(`${this.baseUrl}/brain/actions`);
    if (status) url.searchParams.set('status', status);
    if (limit) url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get actions' }))).error
      );
    const data: ApiResponse<import('@/brain/types/action.types').BrainAction[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get actions');
    return data.data;
  }

  async queueAction(
    req: import('@/brain/types/action.types').QueueActionRequest
  ): Promise<import('@/brain/types/action.types').BrainAction> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        actionType: req.actionType,
        payload: req.payload,
        sessionId: req.sessionId,
      }),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to queue action' }))).error
      );
    const data: ApiResponse<import('@/brain/types/action.types').BrainAction> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to queue action');
    return data.data;
  }

  /**
   * Phase 5 - Workflows
   */
  async getWorkflows(): Promise<import('@/brain/types/workflow.types').BrainWorkflow[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/workflows`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get workflows' }))).error
      );
    const data: ApiResponse<import('@/brain/types/workflow.types').BrainWorkflow[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get workflows');
    return data.data;
  }

  async createWorkflow(
    req: import('@/brain/types/workflow.types').CreateWorkflowRequest
  ): Promise<import('@/brain/types/workflow.types').BrainWorkflow> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        name: req.name,
        description: req.description,
        triggerType: req.triggerType,
        triggerConfig: req.triggerConfig,
        actions: req.actions,
        isActive: req.isActive,
      }),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to create workflow' }))).error
      );
    const data: ApiResponse<import('@/brain/types/workflow.types').BrainWorkflow> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create workflow');
    return data.data;
  }

  async updateWorkflow(
    id: string,
    req: import('@/brain/types/workflow.types').CreateWorkflowRequest
  ): Promise<import('@/brain/types/workflow.types').BrainWorkflow> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        name: req.name,
        description: req.description,
        triggerType: req.triggerType,
        triggerConfig: req.triggerConfig,
        actions: req.actions,
        isActive: req.isActive,
      }),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to update workflow' }))).error
      );
    const data: ApiResponse<import('@/brain/types/workflow.types').BrainWorkflow> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update workflow');
    return data.data;
  }

  async deleteWorkflow(id: string): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/workflows/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to delete workflow' }))).error
      );
  }

  async testWorkflow(
    id: string,
    context?: Record<string, any>
  ): Promise<{ actionsQueued: number }> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/workflows/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ context }),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to test workflow' }))).error
      );
    const data: ApiResponse<{ actionsQueued: number }> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to test workflow');
    return data.data;
  }

  /**
   * Phase 5 - Tasks
   */
  async getTasks(
    status?: string,
    limit: number = 100
  ): Promise<import('@/brain/types/task.types').BrainTask[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const url = new URL(`${this.baseUrl}/brain/tasks`);
    if (status) url.searchParams.set('status', status);
    if (limit) url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get tasks' }))).error
      );
    const data: ApiResponse<import('@/brain/types/task.types').BrainTask[]> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get tasks');
    return data.data;
  }

  async createTask(
    req: import('@/brain/types/task.types').CreateTaskRequest
  ): Promise<import('@/brain/types/task.types').BrainTask> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(req),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to create task' }))).error
      );
    const data: ApiResponse<import('@/brain/types/task.types').BrainTask> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create task');
    return data.data;
  }

  async updateTask(
    id: string,
    req: Partial<import('@/brain/types/task.types').CreateTaskRequest>
  ): Promise<import('@/brain/types/task.types').BrainTask> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(req),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to update task' }))).error
      );
    const data: ApiResponse<import('@/brain/types/task.types').BrainTask> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update task');
    return data.data;
  }

  /**
   * Phase 5 - Notifications
   */
  async getNotifications(
    limit: number = 50
  ): Promise<import('@/brain/types/notification.types').BrainNotification[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/notifications?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get notifications' }))).error
      );
    const data: ApiResponse<import('@/brain/types/notification.types').BrainNotification[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get notifications');
    return data.data;
  }

  async markNotificationsRead(ids: string[]): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to mark as read' }))).error
      );
  }

  /**
   * Phase 6B - Learning System
   */
  async submitFeedback(input: import('@/brain/types/learning.types').FeedbackInput): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/learning/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(input),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to submit feedback' }))).error
      );
  }

  async getLearningMetrics(
    metricType?: string,
    limit: number = 50
  ): Promise<import('@/brain/types/learning.types').LearningMetric[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const url = new URL(`${this.baseUrl}/brain/learning/metrics`);
    if (metricType) url.searchParams.set('metricType', metricType);
    if (limit) url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get learning metrics' }))).error
      );
    const data: ApiResponse<import('@/brain/types/learning.types').LearningMetric[]> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get learning metrics');
    return data.data;
  }

  async getRoutingAccuracy(
    timeRangeHours: number = 24
  ): Promise<{ accuracy: number; timeRangeHours: number }> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(
      `${this.baseUrl}/brain/learning/routing-accuracy?timeRangeHours=${timeRangeHours}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      }
    );
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get routing accuracy' }))).error
      );
    const data: ApiResponse<{ accuracy: number; timeRangeHours: number }> = await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get routing accuracy');
    return data.data;
  }

  async getRoutingWeights(): Promise<import('@/brain/types/learning.types').RoutingWeight[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/learning/routing-weights`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get routing weights' }))).error
      );
    const data: ApiResponse<import('@/brain/types/learning.types').RoutingWeight[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get routing weights');
    return data.data;
  }

  async scoreKnowledgeItem(
    knowledgeId: string
  ): Promise<import('@/brain/types/learning.types').KnowledgeQualityScore> {
    const response = await fetch(`${this.baseUrl}/brain/learning/knowledge/${knowledgeId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to score knowledge item' }))).error
      );
    const data: ApiResponse<import('@/brain/types/learning.types').KnowledgeQualityScore> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to score knowledge item');
    return data.data;
  }

  async getImprovementSuggestions(
    knowledgeId: string
  ): Promise<import('@/brain/types/learning.types').ImprovementSuggestion[]> {
    const response = await fetch(
      `${this.baseUrl}/brain/learning/knowledge/${knowledgeId}/improvements`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get improvement suggestions' })))
          .error
      );
    const data: ApiResponse<import('@/brain/types/learning.types').ImprovementSuggestion[]> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get improvement suggestions');
    return data.data;
  }

  /**
   * Phase 6B - Analytics
   */
  async trackEvent(
    eventType: import('@/brain/types/analytics.types').AnalyticsEventType,
    eventData?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ eventType, eventData, metadata }),
    });
    if (!response.ok) {
      // Silently fail - analytics should not break the main flow
      console.error('Failed to track event');
    }
  }

  async getUserBehaviorAnalytics(
    hours: number = 24
  ): Promise<import('@/brain/types/analytics.types').UserBehaviorAnalytics[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/analytics/user-behavior?hours=${hours}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get user behavior' }))).error
      );
    const data: ApiResponse<import('@/brain/types/analytics.types').UserBehaviorAnalytics[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get user behavior');
    return data.data;
  }

  async getSystemPerformanceMetrics(
    hours: number = 24
  ): Promise<import('@/brain/types/analytics.types').SystemPerformanceMetrics> {
    const response = await fetch(
      `${this.baseUrl}/brain/analytics/system-performance?hours=${hours}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get system metrics' }))).error
      );
    const data: ApiResponse<import('@/brain/types/analytics.types').SystemPerformanceMetrics> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get system metrics');
    return data.data;
  }

  async getDomainUsageStatistics(
    domainId: string,
    days: number = 7
  ): Promise<import('@/brain/types/analytics.types').DomainUsageStatistics[]> {
    const response = await fetch(
      `${this.baseUrl}/brain/analytics/domain-usage/${domainId}?days=${days}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get domain usage' }))).error
      );
    const data: ApiResponse<import('@/brain/types/analytics.types').DomainUsageStatistics[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get domain usage');
    return data.data;
  }

  async getQueryPatterns(
    days: number = 7
  ): Promise<import('@/brain/types/analytics.types').QueryPattern[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/analytics/query-patterns?days=${days}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get query patterns' }))).error
      );
    const data: ApiResponse<import('@/brain/types/analytics.types').QueryPattern[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get query patterns');
    return data.data;
  }

  async getDailyUserActivity(
    days: number = 7
  ): Promise<import('@/brain/types/analytics.types').DailyUserActivity[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/analytics/daily-activity?days=${days}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get daily activity' }))).error
      );
    const data: ApiResponse<import('@/brain/types/analytics.types').DailyUserActivity[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get daily activity');
    return data.data;
  }

  /**
   * Phase 6B - Suggestions & Predictions
   */
  async getRelatedKnowledge(
    knowledgeId: string
  ): Promise<import('@/brain/types/suggestions.types').RelatedKnowledge[]> {
    const response = await fetch(`${this.baseUrl}/brain/suggestions/related/${knowledgeId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get related knowledge' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').RelatedKnowledge[]> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get related knowledge');
    return data.data;
  }

  async getTaskSuggestions(
    context?: Record<string, any>
  ): Promise<import('@/brain/types/suggestions.types').TaskSuggestion[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const url = new URL(`${this.baseUrl}/brain/suggestions/tasks`);
    if (context) url.searchParams.set('context', JSON.stringify(context));
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get task suggestions' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').TaskSuggestion[]> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get task suggestions');
    return data.data;
  }

  async getPatterns(): Promise<import('@/brain/types/suggestions.types').UsagePattern[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/suggestions/patterns`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get patterns' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').UsagePattern[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get patterns');
    return data.data;
  }

  async getReminders(): Promise<import('@/brain/types/suggestions.types').Reminder[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/suggestions/reminders`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get reminders' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').Reminder[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get reminders');
    return data.data;
  }

  async getUserNeedPredictions(): Promise<
    import('@/brain/types/suggestions.types').UserNeedPrediction[]
  > {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/suggestions/user-needs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get predictions' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').UserNeedPrediction[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get predictions');
    return data.data;
  }

  async getAnticipatedQueries(): Promise<
    import('@/brain/types/suggestions.types').AnticipatedQuery[]
  > {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/suggestions/queries`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get anticipated queries' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').AnticipatedQuery[]> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get anticipated queries');
    return data.data;
  }

  async getKnowledgeGaps(
    domainId: string
  ): Promise<import('@/brain/types/suggestions.types').KnowledgeGap[]> {
    const response = await fetch(`${this.baseUrl}/brain/suggestions/knowledge-gaps/${domainId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get knowledge gaps' }))).error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').KnowledgeGap[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get knowledge gaps');
    return data.data;
  }

  async getDomainGrowthForecast(
    domainId: string
  ): Promise<import('@/brain/types/suggestions.types').DomainGrowthForecast> {
    const response = await fetch(`${this.baseUrl}/brain/suggestions/domain-growth/${domainId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get domain growth forecast' })))
          .error
      );
    const data: ApiResponse<import('@/brain/types/suggestions.types').DomainGrowthForecast> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get domain growth forecast');
    return data.data;
  }

  /**
   * Phase 6B - Collaboration
   */
  async shareKnowledge(
    request: import('@/brain/types/collaboration.types').ShareKnowledgeRequest
  ): Promise<import('@/brain/types/collaboration.types').KnowledgeShare> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/collaboration/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to share knowledge' }))).error
      );
    const data: ApiResponse<import('@/brain/types/collaboration.types').KnowledgeShare> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to share knowledge');
    return data.data;
  }

  async getSharedKnowledge(): Promise<
    import('@/brain/types/collaboration.types').KnowledgeShare[]
  > {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/collaboration/shared`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get shared knowledge' }))).error
      );
    const data: ApiResponse<import('@/brain/types/collaboration.types').KnowledgeShare[]> =
      await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to get shared knowledge');
    return data.data;
  }

  async addComment(
    request: import('@/brain/types/collaboration.types').AddCommentRequest
  ): Promise<import('@/brain/types/collaboration.types').Comment> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/collaboration/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to add comment' }))).error
      );
    const data: ApiResponse<import('@/brain/types/collaboration.types').Comment> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to add comment');
    return data.data;
  }

  async getComments(
    knowledgeId: string
  ): Promise<import('@/brain/types/collaboration.types').Comment[]> {
    const response = await fetch(`${this.baseUrl}/brain/collaboration/comments/${knowledgeId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get comments' }))).error
      );
    const data: ApiResponse<import('@/brain/types/collaboration.types').Comment[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get comments');
    return data.data;
  }

  async createTeam(
    request: import('@/brain/types/collaboration.types').CreateTeamRequest
  ): Promise<import('@/brain/types/collaboration.types').TeamWorkspace> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/collaboration/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to create team' }))).error
      );
    const data: ApiResponse<import('@/brain/types/collaboration.types').TeamWorkspace> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create team');
    return data.data;
  }

  async getTeams(): Promise<import('@/brain/types/collaboration.types').TeamWorkspace[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/collaboration/teams`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get teams' }))).error
      );
    const data: ApiResponse<import('@/brain/types/collaboration.types').TeamWorkspace[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get teams');
    return data.data;
  }

  async addTeamMember(
    teamId: string,
    request: import('@/brain/types/collaboration.types').AddTeamMemberRequest
  ): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/collaboration/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to add team member' }))).error
      );
    const data: ApiResponse<any> = await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to add team member');
    return data.data;
  }

  /**
   * Phase 6B - Integrations
   */
  async getIntegrations(): Promise<import('@/brain/types/integrations.types').Integration[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/integrations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to get integrations' }))).error
      );
    const data: ApiResponse<import('@/brain/types/integrations.types').Integration[]> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to get integrations');
    return data.data;
  }

  async createIntegration(
    request: import('@/brain/types/integrations.types').CreateIntegrationRequest
  ): Promise<import('@/brain/types/integrations.types').Integration> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/integrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to create integration' }))).error
      );
    const data: ApiResponse<import('@/brain/types/integrations.types').Integration> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to create integration');
    return data.data;
  }

  async updateIntegration(
    id: string,
    request: import('@/brain/types/integrations.types').UpdateIntegrationRequest
  ): Promise<import('@/brain/types/integrations.types').Integration> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/integrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to update integration' }))).error
      );
    const data: ApiResponse<import('@/brain/types/integrations.types').Integration> =
      await response.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Failed to update integration');
    return data.data;
  }

  async deleteIntegration(id: string): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/integrations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to delete integration' }))).error
      );
  }

  async testSlackIntegration(): Promise<{ success: boolean }> {
    const userId = getUserId();
    if (!userId) throw new Error('User ID is required. Please authenticate.');
    const response = await fetch(`${this.baseUrl}/brain/integrations/slack/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to test Slack integration' }))).error
      );
    const data: ApiResponse<{ success: boolean }> = await response.json();
    if (!data.success || !data.data)
      throw new Error(data.error || 'Failed to test Slack integration');
    return data.data;
  }

  async exportKnowledge(
    knowledgeId: string,
    format: 'markdown' | 'pdf'
  ): Promise<import('@/brain/types/integrations.types').ExportResult> {
    const response = await fetch(
      `${this.baseUrl}/brain/integrations/export/${knowledgeId}/${format}`,
      {
        method: 'GET',
      }
    );
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({ error: 'Failed to export knowledge' }))).error
      );
    const content = await response.text();
    const filename =
      response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
      `knowledge.${format}`;
    return { content, filename, format };
  }
}

// Export singleton instance
export const brainAPI = new BrainAPI();
