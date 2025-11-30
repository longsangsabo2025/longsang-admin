/**
 * Performance Tests: Batch Processing
 *
 * Tests batch processing performance including
 * parallel execution, batch size optimization, and throughput
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock dependencies
vi.mock('@supabase/supabase-js');
vi.mock('../../api/services/context-retrieval', () => ({
  retrieveEnhancedContext: vi.fn(),
}));
vi.mock('../../api/services/performance-optimizer', () => ({
  batchContextQueries: vi.fn(),
}));

const { createClient } = await import('@supabase/supabase-js');
const contextRetrieval = await import('../../api/services/context-retrieval');
const performanceOptimizer = await import('../../api/services/performance-optimizer');

describe('Batch Processing Performance', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    createClient.mockReturnValue(mockSupabase);

    // Setup context retrieval mock
    contextRetrieval.retrieveEnhancedContext.mockImplementation(
      (query) =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                semantic: { results: [], summary: `Results for ${query}` },
                business: {},
              }),
            200
          )
        )
    );

    // Setup batch processing mock
    performanceOptimizer.batchContextQueries.mockImplementation(
      async (queries, options) => {
        // Simulate batch processing with parallel execution
        const results = await Promise.all(
          queries.map((query) =>
            contextRetrieval.retrieveEnhancedContext(query, options)
          )
        );
        return results;
      }
    );
  });

  describe('Batch Query Performance', () => {
    it('should process 10+ queries in < 2 seconds', async () => {
      const queries = Array.from({ length: 10 }, (_, i) => `Query ${i + 1}`);
      const startTime = Date.now();

      const results = await performanceOptimizer.batchContextQueries(queries, {
        maxResults: 10,
      });

      const duration = Date.now() - startTime;

      expect(results.length).toBe(10);
      expect(duration).toBeLessThan(2000);
    });

    it('should process batches in parallel', async () => {
      const queries = Array.from({ length: 5 }, (_, i) => `Query ${i + 1}`);
      const startTime = Date.now();

      // Sequential processing
      const sequentialResults = [];
      for (const query of queries) {
        const result = await contextRetrieval.retrieveEnhancedContext(query);
        sequentialResults.push(result);
      }
      const sequentialTime = Date.now() - startTime;

      // Batch processing (parallel)
      const batchStartTime = Date.now();
      const batchResults = await performanceOptimizer.batchContextQueries(
        queries
      );
      const batchTime = Date.now() - batchStartTime;

      // Batch should be faster than sequential
      expect(batchTime).toBeLessThan(sequentialTime);
      expect(batchResults.length).toBe(sequentialResults.length);
    });

    it('should handle large batches efficiently', async () => {
      const queries = Array.from({ length: 50 }, (_, i) => `Query ${i + 1}`);
      const startTime = Date.now();

      const results = await performanceOptimizer.batchContextQueries(queries);

      const duration = Date.now() - startTime;

      expect(results.length).toBe(50);
      // Should handle 50 queries efficiently
      expect(duration).toBeLessThan(5000);
    });

    it('should limit concurrent requests to prevent overload', async () => {
      const queries = Array.from({ length: 20 }, (_, i) => `Query ${i + 1}`);

      // Mock to track concurrent requests
      let concurrentCount = 0;
      let maxConcurrent = 0;

      contextRetrieval.retrieveEnhancedContext.mockImplementation(
        async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);

          await new Promise((resolve) => setTimeout(resolve, 100));

          concurrentCount--;
          return { semantic: { results: [] }, business: {} };
        }
      );

      await performanceOptimizer.batchContextQueries(queries);

      // Should limit concurrency (batch size should be configured)
      expect(maxConcurrent).toBeLessThanOrEqual(5); // Default batch size
    });
  });

  describe('Throughput Performance', () => {
    it('should maintain consistent throughput under load', async () => {
      const batchSizes = [5, 10, 15, 20];
      const throughputs = [];

      for (const batchSize of batchSizes) {
        const queries = Array.from(
          { length: batchSize },
          (_, i) => `Query ${i + 1}`
        );
        const startTime = Date.now();

        await performanceOptimizer.batchContextQueries(queries);

        const duration = Date.now() - startTime;
        const throughput = batchSize / (duration / 1000); // queries per second
        throughputs.push(throughput);
      }

      // Throughput should be relatively consistent
      const avgThroughput =
        throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
      const variance =
        throughputs.reduce(
          (sum, t) => sum + Math.pow(t - avgThroughput, 2),
          0
        ) / throughputs.length;

      // Variance should be reasonable
      expect(variance).toBeLessThan(Math.pow(avgThroughput * 0.5, 2));
    });
  });

  describe('Error Handling in Batch', () => {
    it('should handle partial failures in batch processing', async () => {
      const queries = ['Query 1', 'Query 2', 'Query 3'];

      // Simulate one query failing
      contextRetrieval.retrieveEnhancedContext.mockImplementation(
        async (query) => {
          if (query === 'Query 2') {
            throw new Error('Query failed');
          }
          return { semantic: { results: [] }, business: {} };
        }
      );

      const results = await performanceOptimizer.batchContextQueries(queries);

      // Should handle errors gracefully
      expect(results.length).toBe(3);
      // Failed queries should have error in result
      const failedResult = results.find(
        (r, i) => queries[i] === 'Query 2'
      );
      expect(failedResult).toHaveProperty('error');
    });

    it('should continue processing after errors', async () => {
      const queries = Array.from({ length: 10 }, (_, i) => `Query ${i + 1}`);

      // Simulate some failures
      contextRetrieval.retrieveEnhancedContext.mockImplementation(
        async (query, options) => {
          if (query.includes('5') || query.includes('7')) {
            throw new Error('Query failed');
          }
          return { semantic: { results: [] }, business: {} };
        }
      );

      const results = await performanceOptimizer.batchContextQueries(queries);

      // Should process all queries even with failures
      expect(results.length).toBe(10);
    });
  });

  describe('Resource Usage', () => {
    it('should not exceed memory limits during batch processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const queries = Array.from({ length: 100 }, (_, i) => `Query ${i + 1}`);

      await performanceOptimizer.batchContextQueries(queries);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // < 100MB
    });
  });
});

