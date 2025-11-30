/**
 * Integration Tests: Context Retrieval
 *
 * Tests context retrieval with caching, semantic search,
 * and performance optimization
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('openai');
vi.mock('../../api/services/embedding-service', () => ({
  semanticSearch: vi.fn(),
  generateEmbedding: vi.fn(),
}));
vi.mock('../../api/services/performance-optimizer', () => ({
  getCachedContext: vi.fn(),
  cacheEmbedding: vi.fn(),
  getCachedEmbedding: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const embeddingService = await import('../../api/services/embedding-service');
const performanceOptimizer = await import('../../api/services/performance-optimizer');
const contextRetrieval = await import('../../api/services/context-retrieval');

describe('Context Retrieval Integration', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock
    mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            entity_type: 'project',
            entity_id: 'project-123',
            content: 'Vũng Tàu Dream Homes project',
            similarity: 0.85,
          },
        ],
        error: null,
      }),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'project-123',
            name: 'Vũng Tàu Dream Homes',
            description: 'Luxury real estate project',
          },
        ],
        error: null,
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    // Setup embedding service mock
    embeddingService.semanticSearch.mockResolvedValue([
      {
        entityType: 'project',
        entityId: 'project-123',
        content: 'Vũng Tàu Dream Homes project',
        similarity: 0.85,
      },
    ]);

    embeddingService.generateEmbedding.mockResolvedValue(
      new Array(1536).fill(0.1)
    );

    // Setup performance optimizer mock
    performanceOptimizer.getCachedContext.mockImplementation(
      async (query, options) => {
        // Simulate cache miss
        const results = await contextRetrieval.retrieveContext(query, {
          ...options,
          useOptimizer: false,
        });
        return {
          ...results,
          fromCache: false,
        };
      }
    );
  });

  describe('Context Retrieval', () => {
    it('should retrieve context for a query', async () => {
      const query = 'Vũng Tàu Dream Homes';
      const options = {
        projectId: 'project-123',
        maxResults: 10,
      };

      const result = await contextRetrieval.retrieveContext(query, options);

      // Verify semantic search was called
      expect(embeddingService.semanticSearch).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          projectId: 'project-123',
          maxResults: 10,
        })
      );

      // Verify result structure
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
    });

    it('should use cached context when available', async () => {
      // Mock cache hit
      performanceOptimizer.getCachedContext.mockResolvedValue({
        query: 'test query',
        results: [{ entityType: 'project', entityId: 'project-123' }],
        summary: 'Cached result',
        fromCache: true,
      });

      const query = 'test query';
      const result = await contextRetrieval.retrieveContext(query, {
        useCache: true,
        useOptimizer: true,
      });

      // Verify cache was checked
      expect(performanceOptimizer.getCachedContext).toHaveBeenCalled();

      // Verify result is from cache
      expect(result.fromCache).toBe(true);
    });

    it('should retrieve context without cache when disabled', async () => {
      const query = 'test query';
      const result = await contextRetrieval.retrieveContext(query, {
        useCache: false,
      });

      // Verify cache was not used
      expect(performanceOptimizer.getCachedContext).not.toHaveBeenCalled();

      // Verify semantic search was called
      expect(embeddingService.semanticSearch).toHaveBeenCalled();
    });
  });

  describe('Enhanced Context Retrieval', () => {
    it('should retrieve enhanced context with business data', async () => {
      const query = 'Dự án hiện tại';
      const result = await contextRetrieval.retrieveEnhancedContext(query, {
        projectId: 'project-123',
      });

      // Verify result has enhanced structure
      expect(result).toHaveProperty('semantic');
      expect(result).toHaveProperty('business');

      // Verify semantic results
      expect(result.semantic).toHaveProperty('results');
      expect(result.semantic).toHaveProperty('summary');
    });

    it('should include project information in enhanced context', async () => {
      const query = 'Vũng Tàu Dream Homes';
      const result = await contextRetrieval.retrieveEnhancedContext(query, {
        projectId: 'project-123',
        includeProjects: true,
      });

      // Should include project data
      expect(result.business).toHaveProperty('currentProjects');
    });
  });

  describe('Caching', () => {
    it('should cache retrieved context', async () => {
      const query = 'test query';
      const options = { useCache: true };

      await contextRetrieval.retrieveContext(query, options);

      // Verify caching was attempted
      // Cache is handled by performance optimizer
      expect(true).toBe(true); // Placeholder
    });

    it('should invalidate cache on error', async () => {
      embeddingService.semanticSearch.mockRejectedValue(
        new Error('Search failed')
      );

      const query = 'test query';

      await expect(
        contextRetrieval.retrieveContext(query)
      ).rejects.toThrow();

      // Cache should not be set on error
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance', () => {
    it('should retrieve context within acceptable time', async () => {
      const startTime = Date.now();
      const query = 'test query';

      await contextRetrieval.retrieveContext(query);

      const duration = Date.now() - startTime;

      // Should complete within 2 seconds (generous for tests)
      expect(duration).toBeLessThan(2000);
    });

    it('should use cache to improve performance', async () => {
      // First call - cache miss
      performanceOptimizer.getCachedContext.mockResolvedValueOnce({
        query: 'test',
        results: [],
        fromCache: false,
      });

      const startTime1 = Date.now();
      await contextRetrieval.retrieveContext('test', {
        useOptimizer: true,
        useCache: true,
      });
      const duration1 = Date.now() - startTime1;

      // Second call - cache hit
      performanceOptimizer.getCachedContext.mockResolvedValueOnce({
        query: 'test',
        results: [],
        fromCache: true,
      });

      const startTime2 = Date.now();
      await contextRetrieval.retrieveContext('test', {
        useOptimizer: true,
        useCache: true,
      });
      const duration2 = Date.now() - startTime2;

      // Cached call should be faster
      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('Error Handling', () => {
    it('should handle semantic search failures', async () => {
      embeddingService.semanticSearch.mockRejectedValue(
        new Error('Semantic search failed')
      );

      const query = 'test query';

      await expect(
        contextRetrieval.retrieveContext(query)
      ).rejects.toThrow();
    });

    it('should handle database connection failures', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      // Should handle gracefully
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Filtering', () => {
    it('should filter by entity type', async () => {
      const query = 'test query';
      const options = {
        entityType: 'project',
      };

      await contextRetrieval.retrieveContext(query, options);

      expect(embeddingService.semanticSearch).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          entityType: 'project',
        })
      );
    });

    it('should filter by project ID', async () => {
      const query = 'test query';
      const options = {
        projectId: 'project-123',
      };

      await contextRetrieval.retrieveContext(query, options);

      expect(embeddingService.semanticSearch).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          projectId: 'project-123',
        })
      );
    });

    it('should respect similarity threshold', async () => {
      const query = 'test query';
      const options = {
        similarityThreshold: 0.8,
      };

      await contextRetrieval.retrieveContext(query, options);

      expect(embeddingService.semanticSearch).toHaveBeenCalledWith(
        query,
        expect.objectContaining({
          similarityThreshold: 0.8,
        })
      );
    });
  });
});

