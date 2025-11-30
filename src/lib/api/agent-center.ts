/**
 * AI Agent Center API Client
 * 
 * Provides type-safe API calls to the Agent Center backend
 */

const API_BASE = '/v1/agent-center';

// Types
export interface Agent {
  id: string;
  name: string;
  role: string;
  type: string;
  status: string;
  description: string;
  capabilities: string[];
  config: Record<string, any>;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time_ms: number;
  total_cost_usd: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  type: string;
  description: string;
  definition: Record<string, any>;
  agents_used: string[];
  status: string;
  is_template: boolean;
  tags: string[];
  total_executions: number;
  avg_execution_time_ms: number;
  success_rate: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  cost_usd: number;
  current_step?: string;
  total_steps: number;
  completed_steps: number;
  intermediate_results: Record<string, any>;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  author: string;
  requires_api_key: boolean;
  cost_per_use: number;
  avg_execution_time_ms: number;
  tags: string[];
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  status: string;
  is_builtin: boolean;
}

export interface AnalyticsOverview {
  agents: {
    total: number;
    active: number;
  };
  tools: {
    total: number;
    total_calls: number;
  };
  workflows: {
    total_executed: number;
    successful: number;
    success_rate: number;
  };
  timestamp: string;
}

// API Client
export const agentCenterAPI = {
  // ============================================
  // AGENTS
  // ============================================
  
  /**
   * Get all agents
   */
  getAgents: async (): Promise<Agent[]> => {
    const response = await fetch(`${API_BASE}/agents`);
    if (!response.ok) throw new Error('Failed to fetch agents');
    return response.json();
  },

  /**
   * Get agent by ID
   */
  getAgent: async (id: string): Promise<Agent> => {
    const response = await fetch(`${API_BASE}/agents/${id}`);
    if (!response.ok) throw new Error('Failed to fetch agent');
    return response.json();
  },

  /**
   * Create new agent
   */
  createAgent: async (data: Partial<Agent>): Promise<Agent> => {
    const response = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create agent');
    return response.json();
  },

  /**
   * Update agent
   */
  updateAgent: async (id: string, data: Partial<Agent>): Promise<Agent> => {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update agent');
    return response.json();
  },

  /**
   * Delete agent
   */
  deleteAgent: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete agent');
  },

  // ============================================
  // WORKFLOWS
  // ============================================

  /**
   * Get all workflows
   */
  getWorkflows: async (): Promise<Workflow[]> => {
    const response = await fetch(`${API_BASE}/workflows`);
    if (!response.ok) throw new Error('Failed to fetch workflows');
    return response.json();
  },

  /**
   * Get workflow by ID
   */
  getWorkflow: async (id: string): Promise<Workflow> => {
    const response = await fetch(`${API_BASE}/workflows/${id}`);
    if (!response.ok) throw new Error('Failed to fetch workflow');
    return response.json();
  },

  /**
   * Create new workflow
   */
  createWorkflow: async (data: Partial<Workflow>): Promise<Workflow> => {
    const response = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    return response.json();
  },

  /**
   * Execute workflow
   */
  executeWorkflow: async (params: {
    workflow_type: string;
    task: string;
    context?: Record<string, any>;
    agents?: string[];
    stream?: boolean;
  }): Promise<any> => {
    const response = await fetch(`${API_BASE}/workflows/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to execute workflow');
    return response.json();
  },

  /**
   * Get workflow execution history
   */
  getWorkflowHistory: async (limit: number = 10): Promise<any> => {
    const response = await fetch(`${API_BASE}/workflows/history?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch workflow history');
    return response.json();
  },

  /**
   * Get execution status
   */
  getExecutionStatus: async (executionId: string): Promise<WorkflowExecution> => {
    const response = await fetch(`${API_BASE}/workflows/execution/${executionId}`);
    if (!response.ok) throw new Error('Failed to fetch execution status');
    return response.json();
  },

  // ============================================
  // CREWS (CrewAI)
  // ============================================

  /**
   * Execute a CrewAI crew
   */
  executeCrew: async (params: {
    crew_type: string;
    topic: string;
    keywords?: string[];
    tone?: string;
    additional_context?: Record<string, any>;
  }): Promise<any> => {
    const response = await fetch(`${API_BASE}/crews/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to execute crew');
    return response.json();
  },

  /**
   * Research only (content crew)
   */
  crewResearchOnly: async (topic: string, keywords?: string[]): Promise<any> => {
    const response = await fetch(`${API_BASE}/crews/content/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, keywords }),
    });
    if (!response.ok) throw new Error('Failed to execute research');
    return response.json();
  },

  // ============================================
  // TOOLS
  // ============================================

  /**
   * Get all tools
   */
  getTools: async (category?: string): Promise<{ total: number; tools: Record<string, any> }> => {
    const url = category 
      ? `${API_BASE}/tools?category=${category}`
      : `${API_BASE}/tools`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tools');
    return response.json();
  },

  /**
   * Get tool by name
   */
  getTool: async (name: string): Promise<Tool> => {
    const response = await fetch(`${API_BASE}/tools/${name}`);
    if (!response.ok) throw new Error('Failed to fetch tool');
    return response.json();
  },

  /**
   * Search tools
   */
  searchTools: async (query: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/tools/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search tools');
    return response.json();
  },

  /**
   * Get tool categories
   */
  getToolCategories: async (): Promise<{ categories: string[] }> => {
    const response = await fetch(`${API_BASE}/tools/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get analytics overview
   */
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    const response = await fetch(`${API_BASE}/analytics/overview`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  /**
   * Get tool usage statistics
   */
  getToolUsageStats: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/analytics/tools/usage`);
    if (!response.ok) throw new Error('Failed to fetch tool usage stats');
    return response.json();
  },

  // ============================================
  // HEALTH & STATUS
  // ============================================

  /**
   * Health check
   */
  healthCheck: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  /**
   * Get system status
   */
  getSystemStatus: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) throw new Error('Failed to fetch system status');
    return response.json();
  },
};

// Export default
export default agentCenterAPI;
