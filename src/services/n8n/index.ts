/**
 * 🔗 n8n Service - Unified API & Business Logic
 *
 * Combines API client + Marketing automation features
 *
 * @author LongSang Admin
 * @version 2.0.0
 */

// Re-export everything from submodules
export * from './api';
export * from './marketing';
export * from './types';

// Default export for convenience
import { n8nApi } from './api';
import { n8nMarketing } from './marketing';

export const n8n = {
  api: n8nApi,
  marketing: n8nMarketing,
};

export default n8n;
