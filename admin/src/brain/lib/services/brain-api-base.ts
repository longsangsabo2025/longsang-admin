/**
 * Brain API - Base class and utilities
 */

import { API_URL } from '@/config/api';

/**
 * Default User ID for Longsang Admin (longsangsabo@gmail.com)
 * Single user app - no multi-user needed
 */
const DEFAULT_USER_ID = '89917901-cf15-45c4-a7ad-8c4c9513347e';

/**
 * Get the current user ID
 * Note: This should be replaced with actual auth system integration
 */
export function getUserId(): string {
  // Try to get from localStorage first
  if (globalThis.window !== undefined) {
    const stored = globalThis.window.localStorage.getItem('userId');
    if (stored) return stored;

    // Store default user ID in localStorage for consistency
    globalThis.window.localStorage.setItem('userId', DEFAULT_USER_ID);
  }

  // Return default user ID for Longsang Admin
  return DEFAULT_USER_ID;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Brain API Base Class
 */
export class BrainAPIBase {
  protected readonly baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }
}
