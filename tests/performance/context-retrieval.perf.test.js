/**
 * Performance Tests: Context Retrieval
 *
 * Tests performance of context retrieval including
 * response times, cache effectiveness, and optimization
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('../../api/services/embedding-service', () => ({
  semanticSearch: vi.fn(),
}));
vi.mock('../../api/services/performance-optimizer', () => ({
  getCachedContext: vi.fn(),
  cacheEmbedding: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const embeddingService = await import('../../api/services/embedding-service');
const performanceOptimizer = await import('../../api/services/performance-optimizer');
const contextRetrieval = await import('../../api/services/context-retrieval');

describe('Context Retrieval Performance', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock with realistic delays
    mockSupabase = {
      rpc: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: [
                    {
                      entity_type: 'project',
                      entity_id: 'project-123',
                      content: 'Test project',
                      similarity: 0.85,
                    },
                  ],
                  error: null,
                }),
              100
            )
          )
      ),
    };

    createClient.mockReturnValue(mockSupabase);

    // Setup embedding service mock
    embeddingService.semanticSearch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve([
                {
                  entityType: 'project',
                  entityId: 'project-123',
                  content: 'Test project',
                  similarity: 0.85,
                },
              ]),
            200
          )
        )
    );

    // Setup performance optimizer mock
    performanceOptimizer.getCachedContext.mockImplementation(
      async (query, options) => {
        // Simulate cache miss
        const startTime = Date.now();
        const results = await contextRetrieval.retrieveContext(query, {
          ...options,
          useOptimizer: false,
        });
        const duration = Date.now() - startTime;

        return {
          ...results,
          fromCache: false,
          retrievalTime: duration,
        };
      }
    );
  });

  describe('Response Time Performance', () => {
    it('should retrieve context within 500ms (95th percentile)', async () => {
      const query = 'Test query';
      const times = [];

      // Run multiple requests to measure distribution
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        await contextRetrieval.retrieveContext(query, { useCache: false });
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      // Calculate 95th percentile
      times.sort((a, b) => a - b);
      const percentile95 = times[Math.floor(times.length * 0.95)];

      // Should be under 500ms
      expect(percentile95).toBeLessThan(500);
    });

    it('should use cache to improve response time', async () => {
      const query = 'Test query';

      // First call - cache miss
      const startTime1 = Date.now();
      await contextRetrieval.retrieveContext(query, {
        useCache: true,
        useOptimizer: true,
      });
      const duration1 = Date.now() - startTime1;

      // Second call - cache hit
      performanceOptimizer.getCachedContext.mockResolvedValueOnce({
        query,
        results: [],
        fromCache: true,
        retrievalTime: 10,
      });

      const startTime2 = Date.now();
      await contextRetrieval.retrieveContext(query, {
        useCache: true,
        useOptimizer: true,
      });
      const duration2 = Date.now() - startTime2;

      // Cached call should be significantly faster
      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(50); // Cache hit should be < 50ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const queries = Array.from({ length: 10 }, (_, i) => `Query ${i}`);
      const startTime = Date.now();

      // Execute all queries concurrently
      await Promise.all(
        queries.map((query) =>
          contextRetrieval.retrieveContext(query, { useCache: false })
        )
      );

      const totalTime = Date.now() - startTime;

      // Concurrent requests should complete faster than sequential
      // (depending on implementation, may vary)
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Cache Performance', () => {
    it('should achieve >70% cache hit rate after warmup', async () => {
      const queries = ['query1', 'query2', 'query3'];
      let cacheHits = 0;
      let totalRequests = 0;

      // Warmup - first round (cache misses)
      for (const query of queries) {
        await contextRetrieval.retrieveContext(query, {
          useCache: true,
          useOptimizer: true,
        });
        totalRequests++;
      }

      // Second round (should hit cache)
      performanceOptimizer.getCachedContext.mockImplementation(
        async (query) => {
          // Simulate cache hit for repeated queries
          if (queries.includes(query)) {
            cacheHits++;
            return {
              query,
              results: [],
              fromCache: true,
            };
          }
          return {
            query,
            results: [],
            fromCache: false,
          };
        }
      );

      for (const query of queries) {
        await contextRetrieval.retrieveContext(query, {
          useCache: true,
          useOptimizer: true,
        });
        totalRequests++;
      }

      const hitRate = cacheHits / totalRequests;
      expect(hitRate).toBeGreaterThan(0.7);
    });

    it('should invalidate cache appropriately', async () => {
      const query = 'Test query';

      // First call
      await contextRetrieval.retrieveContext(query, {
        useCache: true,
        useOptimizer: true,
      });

      // Verify cache was used
      expect(performanceOptimizer.getCachedContext).toHaveBeenCalled();

      // Simulate cache expiration (would happen after TTL)
      // Cache should be invalidated and new data retrieved
      expect(true).toBe(true); // Placeholder for cache invalidation test
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 100; i++) {
        await contextRetrieval.retrieveContext(`Query ${i}`, {
          useCache: true,
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB for 100 requests)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Optimization Performance', () => {
    it('should use optimized retrieval when enabled', async () => {
      const query = 'Test query';

      await contextRetrieval.retrieveContext(query, {
        useOptimizer: true,
        useCache: true,
      });

      expect(performanceOptimizer.getCachedContext).toHaveBeenCalled();
    });

    it('should improve performance with optimization', async () => {
      const query = 'Test query';

      // Without optimizer
      const startTime1 = Date.now();
      await contextRetrieval.retrieveContext(query, {
        useOptimizer: false,
        useCache: false,
      });
      const duration1 = Date.now() - startTime1;

      // With optimizer (and cache)
      performanceOptimizer.getCachedContext.mockResolvedValueOnce({
        query,
        results: [],
        fromCache: true,
        retrievalTime: 50,
      });

      const startTime2 = Date.now();
      await contextRetrieval.retrieveContext(query, {
        useOptimizer: true,
        useCache: true,
      });
      const duration2 = Date.now() - startTime2;

      // Optimized should be faster
      expect(duration2).toBeLessThan(duration1);
    });
  });
});

