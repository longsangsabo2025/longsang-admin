/**
 * Brain API - Bulk Operations, Core Logic & Knowledge Analysis
 * Sections 5-7
 */

import type { ApiResponse } from '@/brain/types/brain.types';
import type {
  BulkOperationResult,
  DomainExportData,
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
import { type Constructor, BrainAPIBase, getUserId } from './brain-api-base';

export function withBulkMethods<T extends Constructor<BrainAPIBase>>(Base: T) {
  return class BulkMethods extends Base {
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
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to export domain' }));
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
    async distillCoreLogic(
      domainId: string,
      options?: DistillationOptions
    ): Promise<CoreLogic> {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID is required. Please authenticate.');
      }

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/core-logic/distill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ options }),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to distill core logic' }));
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
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get core logic' }));
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

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/core-logic/versions`,
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
          .catch(() => ({ error: 'Failed to get versions' }));
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

      const response = await fetch(
        `${this.baseUrl}/brain/domains/dummy/core-logic/compare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ version1Id, version2Id }),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to compare versions' }));
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

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/core-logic/rollback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ targetVersion, reason }),
        }
      );

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
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get patterns' }));
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
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to get concepts' }));
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

      const response = await fetch(
        `${this.baseUrl}/brain/domains/${domainId}/relationships`,
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
          .catch(() => ({ error: 'Failed to get relationships' }));
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
  };
}
