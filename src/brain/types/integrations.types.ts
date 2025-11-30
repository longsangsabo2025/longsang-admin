/**
 * TypeScript Types for Integrations
 */

export type IntegrationType = 'slack' | 'email' | 'webhook' | 'notion';

export interface Integration {
  id: string;
  user_id: string;
  integration_type: IntegrationType;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationRequest {
  integrationType: IntegrationType;
  config: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateIntegrationRequest {
  config?: Record<string, any>;
  isActive?: boolean;
}

export interface ExportResult {
  content: string;
  filename: string;
  format?: 'markdown' | 'pdf';
}

