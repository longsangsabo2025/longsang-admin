/**
 * Brain API - Base class and utilities
 */

import { BRAIN_API_URL, getBrainUserId } from '../brain-config';

export function getUserId(): string {
  return getBrainUserId();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Brain API Base Class
 */
export class BrainAPIBase {
  protected readonly baseUrl: string;

  constructor(baseUrl: string = BRAIN_API_URL) {
    this.baseUrl = baseUrl;
  }
}
