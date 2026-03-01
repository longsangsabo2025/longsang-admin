/**
 * Shared types and constants for SystemMap
 */

export type ServiceStatus = 'online' | 'offline' | 'checking' | 'degraded' | 'unknown';

export interface ServiceHealth {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  url?: string;
  port?: number;
  latency?: number;
  lastChecked?: Date;
  category: 'core' | 'ai' | 'storage' | 'external' | 'automation';
  dependencies?: string[];
}
