/**
 * Performance Optimization Utilities
 * Lazy loading, memoization, and optimization helpers
 */

import { lazy, ComponentType } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Lazy load a component with loading fallback and error handling
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>,
  componentName: string
): ComponentType {
  const LazyComponent = lazy(async () => {
    try {
      logger.debug(`Loading component: ${componentName}`, undefined, 'Performance');
      const module = await importFunc();
      logger.debug(`Component loaded: ${componentName}`, undefined, 'Performance');
      return module;
    } catch (error) {
      logger.error(`Failed to load component: ${componentName}`, error, 'Performance');
      throw error;
    }
  });

  return LazyComponent;
}

/**
 * Debounce function - delay execution until after delay has elapsed
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Throttle function - limit execution to once per delay period
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let isThrottled = false;

  return function throttled(...args: Parameters<T>): void {
    if (isThrottled) return;

    func(...args);
    isThrottled = true;
    setTimeout(() => {
      isThrottled = false;
    }, delay);
  };
}

/**
 * Measure performance of an async function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` }, 'Performance');
    
    // Log slow operations (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name}`, { duration: `${duration.toFixed(2)}ms` }, 'Performance');
    }
    
    return result;
  } catch (error) {
    const end = performance.now();
    logger.error(`Performance measurement failed: ${name}`, error, 'Performance');
    logger.debug(`Failed operation duration`, { duration: `${(end - start).toFixed(2)}ms` }, 'Performance');
    throw error;
  }
}

/**
 * Cache with TTL (Time To Live)
 */
export class CacheWithTTL<T> {
  private readonly cache = new Map<string, { value: T; expiry: number }>();

  constructor(private readonly defaultTTL: number = 5 * 60 * 1000) {} // 5 minutes default

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Optimize image loading
 * Future: Integrate with image CDN (Cloudinary, imgix, etc.)
 */
export function optimizeImageUrl(url: string, _width?: number, _quality: number = 80): string {
  // Placeholder for image CDN integration
  // When ready, add CDN-specific query parameters for optimization
  return url;
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
  }
  
  document.head.appendChild(link);
  logger.debug(`Preloading resource: ${type}`, { url }, 'Performance');
}

/**
 * Batch multiple operations
 */
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly processor: (items: T[]) => Promise<R[]>,
    private readonly maxBatchSize: number = 10,
    private readonly maxWaitTime: number = 100
  ) {}

  add(item: T): Promise<R> {
    return new Promise((resolve) => {
      this.queue.push(item);

      if (this.queue.length >= this.maxBatchSize) {
        void this.flush().then(results => {
          const lastResult = results.at(-1);
          resolve(lastResult ?? ({} as R));
        });
      } else {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          void this.flush().then(results => {
            const lastResult = results.at(-1);
            resolve(lastResult ?? ({} as R));
          });
        }, this.maxWaitTime);
      }
    });
  }

  private async flush(): Promise<R[]> {
    if (this.queue.length === 0) return [];
    
    const items = [...this.queue];
    this.queue = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    return this.processor(items);
  }
}
