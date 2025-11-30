/**
 * n8n API Client
 * 
 * Low-level API client for n8n REST API
 */

import type { 
  N8nWorkflow, 
  N8nExecution, 
  N8nCredential, 
  N8nTag, 
  N8nConfig, 
  N8nNode 
} from './types';

// ============================================================
// CONFIGURATION
// ============================================================

const getN8nConfig = (): N8nConfig => {
  const baseUrl = import.meta.env.VITE_N8N_BASE_URL || 
                  localStorage.getItem('n8n_base_url') || 
                  'http://localhost:5678';
  
  const apiKey = import.meta.env.VITE_N8N_API_KEY || 
                 localStorage.getItem('n8n_api_key') || 
                 '';

  return { baseUrl, apiKey };
};

const getApiUrl = (): string => {
  if (import.meta.env.DEV) {
    return '/n8n-api';
  }
  const { baseUrl } = getN8nConfig();
  return `${baseUrl}/api/v1`;
};

export const saveN8nConfig = (config: Partial<N8nConfig>) => {
  if (config.baseUrl) localStorage.setItem('n8n_base_url', config.baseUrl);
  if (config.apiKey) localStorage.setItem('n8n_api_key', config.apiKey);
};

// ============================================================
// API CLIENT HELPERS
// ============================================================

const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (!import.meta.env.DEV) {
    const { apiKey } = getN8nConfig();
    if (apiKey) {
      headers['X-N8N-API-KEY'] = apiKey;
    }
  }
  
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function detectTriggerType(nodes: N8nNode[]): string {
  const triggerNode = nodes.find(n => 
    n.type.includes('Trigger') || 
    n.type.includes('webhook') ||
    n.type.includes('Schedule') ||
    n.type.includes('Cron')
  );

  if (!triggerNode) return 'manual';

  const type = triggerNode.type.toLowerCase();
  if (type.includes('webhook')) return 'webhook';
  if (type.includes('schedule') || type.includes('cron')) return 'scheduled';
  if (type.includes('email')) return 'email';
  if (type.includes('telegram')) return 'telegram';
  if (type.includes('slack')) return 'slack';
  if (type.includes('discord')) return 'discord';
  
  return 'trigger';
}

function extractDescription(workflow: N8nWorkflow): string {
  const settings = workflow.settings as { description?: string } | undefined;
  if (settings?.description) return settings.description;

  const nodes = workflow.nodes || [];
  if (nodes.length === 0) return 'Empty workflow';

  const nodeTypes = [...new Set(nodes.map(n => n.type.replace('n8n-nodes-base.', '')))];
  return `${nodes.length} nodes: ${nodeTypes.slice(0, 3).join(', ')}${nodeTypes.length > 3 ? '...' : ''}`;
}

// ============================================================
// WORKFLOWS API
// ============================================================

export const n8nWorkflowsApi = {
  async list(): Promise<N8nWorkflow[]> {
    const { apiKey } = getN8nConfig();
    const apiUrl = getApiUrl();
    
    if (!apiKey && !import.meta.env.DEV) {
      throw new Error('n8n API key not configured. Please set it in Settings.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (!import.meta.env.DEV && apiKey) {
      headers['X-N8N-API-KEY'] = apiKey;
    }

    const response = await fetch(`${apiUrl}/workflows`, {
      method: 'GET',
      headers,
    });

    const result = await handleResponse<{ data: N8nWorkflow[] }>(response);
    
    return (result.data || []).map(workflow => ({
      ...workflow,
      nodeCount: workflow.nodes?.length || 0,
      triggerType: detectTriggerType(workflow.nodes || []),
      description: extractDescription(workflow),
    }));
  },

  async getById(id: string): Promise<N8nWorkflow | null> {
    const apiUrl = getApiUrl();

    const response = await fetch(`${apiUrl}/workflows/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (response.status === 404) return null;
    
    const workflow = await handleResponse<N8nWorkflow>(response);
    return {
      ...workflow,
      nodeCount: workflow.nodes?.length || 0,
      triggerType: detectTriggerType(workflow.nodes || []),
      description: extractDescription(workflow),
    };
  },

  async activate(id: string): Promise<N8nWorkflow> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/workflows/${id}/activate`, {
      method: 'POST',
      headers: createHeaders(),
    });

    return handleResponse<N8nWorkflow>(response);
  },

  async deactivate(id: string): Promise<N8nWorkflow> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/workflows/${id}/deactivate`, {
      method: 'POST',
      headers: createHeaders(),
    });

    return handleResponse<N8nWorkflow>(response);
  },

  async execute(id: string, data?: Record<string, unknown>): Promise<{ executionId: string }> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/workflows/${id}/run`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data || {}),
    });

    return handleResponse<{ executionId: string }>(response);
  },
};

// ============================================================
// EXECUTIONS API
// ============================================================

export const n8nExecutionsApi = {
  async list(workflowId?: string, limit = 20): Promise<N8nExecution[]> {
    const apiUrl = getApiUrl();

    const params = new URLSearchParams();
    if (workflowId) params.append('workflowId', workflowId);
    params.append('limit', limit.toString());

    const response = await fetch(`${apiUrl}/executions?${params}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    const result = await handleResponse<{ data: N8nExecution[] }>(response);
    return result.data || [];
  },

  async getById(id: string): Promise<N8nExecution | null> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/executions/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (response.status === 404) return null;
    return handleResponse<N8nExecution>(response);
  },

  async delete(id: string): Promise<void> {
    const apiUrl = getApiUrl();
    
    await fetch(`${apiUrl}/executions/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

// ============================================================
// CREDENTIALS & TAGS API
// ============================================================

export const n8nCredentialsApi = {
  async list(): Promise<N8nCredential[]> {
    const apiUrl = getApiUrl();

    const response = await fetch(`${apiUrl}/credentials`, {
      method: 'GET',
      headers: createHeaders(),
    });

    const result = await handleResponse<{ data: N8nCredential[] }>(response);
    return result.data || [];
  },
};

export const n8nTagsApi = {
  async list(): Promise<N8nTag[]> {
    const apiUrl = getApiUrl();

    const response = await fetch(`${apiUrl}/tags`, {
      method: 'GET',
      headers: createHeaders(),
    });

    const result = await handleResponse<{ data: N8nTag[] }>(response);
    return result.data || [];
  },
};

// ============================================================
// HEALTH CHECK
// ============================================================

export const n8nHealthApi = {
  async check(): Promise<{ healthy: boolean; version?: string; error?: string }> {
    const { apiKey } = getN8nConfig();
    const apiUrl = getApiUrl();
    
    if (!import.meta.env.DEV && !apiKey) {
      return { healthy: false, error: 'n8n API key not configured' };
    }

    try {
      const response = await fetch(`${apiUrl}/workflows?limit=1`, {
        method: 'GET',
        headers: createHeaders(),
      });

      if (response.ok) {
        return { healthy: true };
      }
      
      return { healthy: false, error: `HTTP ${response.status}` };
    } catch (err) {
      return { 
        healthy: false, 
        error: err instanceof Error ? err.message : 'Connection failed' 
      };
    }
  },
};

// ============================================================
// EXPORT ALL
// ============================================================

export const n8nApi = {
  workflows: n8nWorkflowsApi,
  executions: n8nExecutionsApi,
  credentials: n8nCredentialsApi,
  tags: n8nTagsApi,
  health: n8nHealthApi,
  saveConfig: saveN8nConfig,
};

export default n8nApi;
