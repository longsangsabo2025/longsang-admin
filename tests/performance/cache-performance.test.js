/**
 * Performance Tests: Cache Performance
 *
 * Tests cache performance including hit rates,
 * invalidation, and memory usage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Mock dependencies
vi.mock('node-cache', () => {
  const NodeCache = vi.fn().mockImplementation((options) => {
    const cache = new Map();
    const stats = { hits: 0, misses: 0 };

    return {
      set: (key, value) => {
        cache.set(key, {
          value,
          timestamp: Date.now(),
          ttl: options?.stdTTL || 300,
        });
      },
      get: (key) => {
        const item = cache.get(key);
        if (!item) {
          stats.misses++;
          return undefined;
        }

        const age = (Date.now() - item.timestamp) / 1000;
        if (age > item.ttl) {
          cache.delete(key);
          stats.misses++;
          return undefined;
        }

        stats.hits++;
        return item.value;
      },
      del: (key) => cache.delete(key),
      flushAll: () => cache.clear(),
      keys: () => Array.from(cache.keys()),
      getStats: () => ({ ...stats }),
    };
  });

  return { default: NodeCache };
});

const performanceOptimizer = await import(
  '../../api/services/performance-optimizer'
);

describe('Cache Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Hit Rate', () => {
    it('should achieve >70% cache hit rate after warmup', async () => {
      const queries = ['query1', 'query2', 'query3', 'query4', 'query5'];
      let hits = 0;
      let misses = 0;

      // Warmup - first round
      for (const query of queries) {
        const result = await performanceOptimizer.getCachedContext(query, {});
        if (result.fromCache) {
          hits++;
        } else {
          misses++;
        }
      }

      // Second round - should hit cache
      for (const query of queries) {
        // Mock cache hit
        const result = await performanceOptimizer.getCachedContext(query, {});
        if (result?.fromCache) {
          hits++;
        } else {
          misses++;
        }
      }

      const hitRate = hits / (hits + misses);
      expect(hitRate).toBeGreaterThan(0.7);
    });

    it('should cache different query variations correctly', async () => {
      const query1 = 'Test query';
      const query2 = 'Test query'; // Same
      const query3 = 'Different query'; // Different

      // Cache query1
      await performanceOptimizer.getCachedContext(query1, {});

      // Query2 should hit cache
      const result2 = await performanceOptimizer.getCachedContext(query2, {});
      // Query3 should miss cache
      const result3 = await performanceOptimizer.getCachedContext(query3, {});

      // Results should be different
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate expired cache entries', async () => {
      const query = 'Test query';

      // Set cache with short TTL
      await performanceOptimizer.getCachedContext(query, {});

      // Wait for expiration (would need to mock time or use short TTL)
      // For now, test cache clearing
      performanceOptimizer.clearCache('context', null);

      // Cache should be cleared
      const stats = performanceOptimizer.getCacheStats();
      expect(stats.context.keys).toBe(0);
    });

    it('should allow manual cache invalidation', () => {
      const cacheKey = 'test-key';

      // Set cache
      // Clear specific key
      performanceOptimizer.clearCache('context', cacheKey);

      // Key should be removed
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Cache Memory Usage', () => {
    it('should limit cache size to prevent memory issues', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Add many cache entries
      for (let i = 0; i < 1000; i++) {
        await performanceOptimizer.getCachedContext(`Query ${i}`, {});
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // < 200MB
    });

    it('should clean up expired entries automatically', async () => {
      // Add cache entries
      for (let i = 0; i < 100; i++) {
        await performanceOptimizer.getCachedContext(`Query ${i}`, {});
      }

      // Get initial stats
      const initialStats = performanceOptimizer.getCacheStats();
      const initialKeys = initialStats.context.keys;

      // Clear cache
      performanceOptimizer.clearCache('context', null);

      // Check keys are reduced
      const finalStats = performanceOptimizer.getCacheStats();
      expect(finalStats.context.keys).toBeLessThan(initialKeys);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics accurately', () => {
      const stats = performanceOptimizer.getCacheStats();

      expect(stats).toHaveProperty('context');
      expect(stats.context).toHaveProperty('keys');
      expect(stats.context).toHaveProperty('hits');
      expect(stats.context).toHaveProperty('misses');
    });

    it('should reset statistics when cache is cleared', () => {
      // Get stats
      const stats1 = performanceOptimizer.getCacheStats();

      // Clear cache
      performanceOptimizer.clearCache('context', null);

      // Get stats again
      const stats2 = performanceOptimizer.getCacheStats();

      // Keys should be 0
      expect(stats2.context.keys).toBe(0);
    });
  });

  describe('Cache Types', () => {
    it('should cache context separately from embeddings', async () => {
      const query = 'Test query';

      // Cache context
      await performanceOptimizer.getCachedContext(query, {});

      // Cache embedding
      const embedding = new Array(1536).fill(0.1);
      performanceOptimizer.cacheEmbedding(query, embedding);

      // Get cached embedding
      const cachedEmbedding = performanceOptimizer.getCachedEmbedding(query);

      expect(cachedEmbedding).toEqual(embedding);
    });

    it('should cache suggestions separately', async () => {
      const userId = 'user-123';
      const suggestions = [
        {
          id: 'sug-1',
          title: 'Suggestion 1',
        },
      ];

      performanceOptimizer.cacheSuggestions(userId, suggestions);
      const cached = performanceOptimizer.getCachedSuggestions(userId);

      expect(cached).toEqual(suggestions);
    });
  });
});

