/**
 * 🔗 n8n API Service
 * 
 * Kết nối và quản lý workflows từ n8n instance
 * 
 * Flow: n8n Workflows → Ideas Library → Production AI Agents
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

// ============================================================
// TYPES
// ============================================================

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: N8nTag[];
  nodes?: N8nNode[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  staticData?: Record<string, unknown>;
  // Computed fields
  nodeCount?: number;
  triggerType?: string;
  description?: string;
}

export interface N8nTag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
      error?: {
        message: string;
        stack?: string;
      };
    };
  };
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const getN8nConfig = (): N8nConfig => {
  // Try to get from environment or localStorage
  const baseUrl = import.meta.env.VITE_N8N_BASE_URL || 
                  localStorage.getItem('n8n_base_url') || 
                  'http://localhost:5678';
  
  const apiKey = import.meta.env.VITE_N8N_API_KEY || 
                 localStorage.getItem('n8n_api_key') || 
                 '';

  return { baseUrl, apiKey };
};

// Use proxy in development to bypass CORS
const getApiUrl = (): string => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/n8n-api'; // Proxied to n8n via vite.config.ts
  }
  // In production, use direct URL (need server proxy)
  const { baseUrl } = getN8nConfig();
  return `${baseUrl}/api/v1`;
};

// Save config to localStorage
export const saveN8nConfig = (config: Partial<N8nConfig>) => {
  if (config.baseUrl) localStorage.setItem('n8n_base_url', config.baseUrl);
  if (config.apiKey) localStorage.setItem('n8n_api_key', config.apiKey);
};

// ============================================================
// API CLIENT
// ============================================================

const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Only add API key header if not using Vite proxy (proxy adds it server-side)
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
// WORKFLOWS API
// ============================================================

export const n8nWorkflowsApi = {
  /**
   * Get all workflows from n8n
   */
  async list(): Promise<N8nWorkflow[]> {
    const { apiKey } = getN8nConfig();
    const apiUrl = getApiUrl();
    
    if (!apiKey && !import.meta.env.DEV) {
      throw new Error('n8n API key not configured. Please set it in Settings.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Only add API key header if not using proxy (proxy adds it server-side)
    if (!import.meta.env.DEV && apiKey) {
      headers['X-N8N-API-KEY'] = apiKey;
    }

    const response = await fetch(`${apiUrl}/workflows`, {
      method: 'GET',
      headers,
    });

    const result = await handleResponse<{ data: N8nWorkflow[] }>(response);
    
    // Enhance workflow data
    return (result.data || []).map(workflow => ({
      ...workflow,
      nodeCount: workflow.nodes?.length || 0,
      triggerType: detectTriggerType(workflow.nodes || []),
      description: extractDescription(workflow),
    }));
  },

  /**
   * Get single workflow by ID
   */
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

  /**
   * Activate workflow
   */
  async activate(id: string): Promise<N8nWorkflow> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/workflows/${id}/activate`, {
      method: 'POST',
      headers: createHeaders(),
    });

    return handleResponse<N8nWorkflow>(response);
  },

  /**
   * Deactivate workflow
   */
  async deactivate(id: string): Promise<N8nWorkflow> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/workflows/${id}/deactivate`, {
      method: 'POST',
      headers: createHeaders(),
    });

    return handleResponse<N8nWorkflow>(response);
  },

  /**
   * Execute workflow manually
   */
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
  /**
   * Get executions for a workflow
   */
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

  /**
   * Get execution by ID
   */
  async getById(id: string): Promise<N8nExecution | null> {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/executions/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (response.status === 404) return null;
    return handleResponse<N8nExecution>(response);
  },

  /**
   * Delete execution
   */
  async delete(id: string): Promise<void> {
    const apiUrl = getApiUrl();
    
    await fetch(`${apiUrl}/executions/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

// ============================================================
// CREDENTIALS API
// ============================================================

export const n8nCredentialsApi = {
  /**
   * Get all credentials
   */
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

// ============================================================
// TAGS API
// ============================================================

export const n8nTagsApi = {
  /**
   * Get all tags
   */
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
  /**
   * Check if n8n is accessible
   */
  async check(): Promise<{ healthy: boolean; version?: string; error?: string }> {
    const { apiKey } = getN8nConfig();
    const apiUrl = getApiUrl();
    
    // In dev mode, proxy handles auth. In prod, need API key
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
// HELPER FUNCTIONS
// ============================================================

/**
 * Detect trigger type from workflow nodes
 */
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

/**
 * Extract description from workflow
 */
function extractDescription(workflow: N8nWorkflow): string {
  // Try to get from settings or first node
  const settings = workflow.settings as { description?: string } | undefined;
  if (settings?.description) return settings.description;

  // Generate from nodes
  const nodes = workflow.nodes || [];
  if (nodes.length === 0) return 'Empty workflow';

  const nodeTypes = [...new Set(nodes.map(n => n.type.replace('n8n-nodes-base.', '')))];
  return `${nodes.length} nodes: ${nodeTypes.slice(0, 3).join(', ')}${nodeTypes.length > 3 ? '...' : ''}`;
}

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
