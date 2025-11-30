/**
 * Cache Service Tests
 */

const cacheService = require('../../services/cache-service');

describe('Cache Service', () => {
  beforeEach(() => {
    // Reset cache state if needed
  });

  test('should check if cache is available', () => {
    const available = cacheService.isAvailable();
    expect(typeof available).toBe('boolean');
  });

  test('should set and get cache value', async () => {
    const key = 'test:key';
    const value = { test: 'value' };

    if (cacheService.isAvailable()) {
      await cacheService.set(key, value, 60);
      const result = await cacheService.get(key);
      expect(result).toEqual(value);
    } else {
      // If cache is not available, get should return null
      const result = await cacheService.get(key);
      expect(result).toBeNull();
    }
  });

  test('should delete cache key', async () => {
    const key = 'test:delete';
    const value = { test: 'value' };

    if (cacheService.isAvailable()) {
      await cacheService.set(key, value, 60);
      await cacheService.del(key);
      const result = await cacheService.get(key);
      expect(result).toBeNull();
    }
  });

  test('should handle domain stats caching', async () => {
    const domainId = 'test-domain-id';
    const stats = { count: 10, lastUpdated: new Date().toISOString() };

    if (cacheService.isAvailable()) {
      await cacheService.setDomainStats(domainId, stats, 60);
      const result = await cacheService.getDomainStats(domainId);
      expect(result).toEqual(stats);

      await cacheService.invalidateDomainStats(domainId);
      const afterInvalidate = await cacheService.getDomainStats(domainId);
      expect(afterInvalidate).toBeNull();
    }
  });
});


