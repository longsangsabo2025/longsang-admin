import { describe, it, expect } from 'vitest';
import { 
  debounce, 
  throttle, 
  CacheWithTTL,
  memoize 
} from '../performance';

describe('Performance utilities', () => {
  describe('debounce', () => {
    it('should delay function execution', async () => {
      let count = 0;
      const increment = debounce(() => count++, 50);
      
      increment();
      increment();
      increment();
      
      expect(count).toBe(0); // Not called yet
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(count).toBe(1); // Called once after delay
    });
  });

  describe('throttle', () => {
    it('should limit function calls', async () => {
      let count = 0;
      const increment = throttle(() => count++, 50);
      
      increment(); // Called
      increment(); // Throttled
      increment(); // Throttled
      
      expect(count).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      increment(); // Called again
      expect(count).toBe(2);
    });
  });

  describe('CacheWithTTL', () => {
    it('should cache and retrieve values', () => {
      const cache = new CacheWithTTL<string>(1000);
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should expire values after TTL', async () => {
      const cache = new CacheWithTTL<string>(50);
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(cache.get('key1')).toBe(null);
    });

    it('should clear all values', () => {
      const cache = new CacheWithTTL<string>();
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe(null);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const expensive = (n: number) => {
        callCount++;
        return n * 2;
      };
      
      const memoized = memoize(expensive);
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1); // Only called once
      
      expect(memoized(10)).toBe(20);
      expect(callCount).toBe(2);
    });
  });
});
