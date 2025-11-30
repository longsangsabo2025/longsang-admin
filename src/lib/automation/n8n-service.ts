// n8n Service - Complete MCP Integration
// Handles n8n API operations and database synchronization with Model Context Protocol support

import { supabase } from '@/integrations/supabase/client';

// ================================================
// Type Definitions
// ================================================

type WorkflowCreateData = Omit<N8nWorkflow, 'id' | 'created_at' | 'updated_at'>;
type McpServerCreateData = Omit<McpServer, 'id' | 'created_at' | 'updated_at'>;
type McpConnectionCreateData = Omit<McpWorkflowConnection, 'id'>;

export interface N8nWorkflow {
  id?: string;
  n8n_workflow_id?: string;
  name: string;
  description?: string;
  category: string;
  workflow_data: any;
  status: 'active' | 'inactive' | 'error';
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  created_by: string;
}

export interface N8nExecution {
  id?: string;
  workflow_id: string;
  n8n_execution_id?: string;
  status: 'success' | 'error' | 'running' | 'cancelled';
  input_data?: any;
  output_data?: any;
  execution_time?: number;
  error_message?: string;
  executed_at?: string;
}

export interface N8nWorkflowTemplate {
  id?: string;
  name: string;
  description?: string;
  category: string;
  template_data: any;
  tags?: string[];
  is_public?: boolean;
  usage_count?: number;
}

// ================================================
// MCP Types and Interfaces
// ================================================

export interface McpServer {
  id: string;
  name: string;
  description?: string;
  url: string;
  protocol_version: string;
  server_type: 'stdio' | 'sse' | 'websocket';
  status: 'active' | 'inactive' | 'error' | 'testing';
  capabilities: {
    tools?: string[];
    resources?: string[];
    prompts?: string[];
  };
  connection_config: any;
  health_check_url?: string;
  last_ping_at?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface McpTool {
  id: string;
  server_id: string;
  tool_name: string;
  description?: string;
  input_schema?: any;
  output_schema?: any;
  tool_category?: string;
  usage_count: number;
  last_used_at?: string;
  is_enabled: boolean;
}

export interface McpResource {
  id: string;
  server_id: string;
  resource_uri: string;
  resource_name?: string;
  resource_type?: string;
  mime_type?: string;
  description?: string;
  metadata?: any;
  access_count: number;
  last_accessed_at?: string;
  is_enabled: boolean;
}

export interface McpPrompt {
  id: string;
  server_id: string;
  prompt_name: string;
  description?: string;
  prompt_template?: string;
  arguments?: any[];
  prompt_category?: string;
  usage_count: number;
  last_used_at?: string;
  is_enabled: boolean;
}

export interface McpWorkflowConnection {
  id: string;
  workflow_id: string;
  server_id: string;
  connection_type: 'server' | 'client' | 'bidirectional';
  node_id?: string;
  node_type?: string;
  configuration?: any;
  is_active: boolean;
}

// ================================================
// N8n API Client
// ================================================

class N8nApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_N8N_API_URL || 'http://localhost:5678/api/v1';
    this.apiKey = import.meta.env.VITE_N8N_API_KEY || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`N8n API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Workflow operations
  async getWorkflows() {
    return this.request('/workflows');
  }

  async getWorkflow(id: string) {
    return this.request(`/workflows/${id}`);
  }

  async createWorkflow(workflowData: any) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async updateWorkflow(id: string, workflowData: any) {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async activateWorkflow(id: string) {
    return this.request(`/workflows/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(id: string) {
    return this.request(`/workflows/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // Execution operations
  async executeWorkflow(id: string, inputData?: any) {
    return this.request(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ data: inputData }),
    });
  }

  async getExecutions(workflowId?: string) {
    const params = workflowId ? `?workflowId=${workflowId}` : '';
    return this.request(`/executions${params}`);
  }

  async getExecution(id: string) {
    return this.request(`/executions/${id}`);
  }
}

// ================================================
// Database Service
// ================================================

class N8nDatabaseService {
  // Workflow operations
  async createWorkflow(data: WorkflowCreateData) {
    const { data: workflow, error } = await supabase
      .from('n8n_workflows')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return workflow;
  }

  async getWorkflows() {
    const { data, error } = await supabase
      .from('n8n_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getWorkflow(id: string) {
    const { data, error } = await supabase.from('n8n_workflows').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  async updateWorkflow(id: string, updates: Partial<N8nWorkflow>) {
    const { data, error } = await supabase
      .from('n8n_workflows')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkflow(id: string) {
    const { error } = await supabase.from('n8n_workflows').delete().eq('id', id);

    if (error) throw error;
  }

  // Execution operations
  async logExecution(data: Omit<N8nExecution, 'id' | 'executed_at'>) {
    const { data: execution, error } = await supabase
      .from('n8n_executions')
      .insert({
        ...data,
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return execution;
  }

  async getExecutions(workflowId?: string) {
    let query = supabase.from('n8n_executions').select(`
        *,
        n8n_workflows (
          name,
          category
        )
      `);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query.order('executed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getExecution(id: string) {
    const { data, error } = await supabase
      .from('n8n_executions')
      .select(
        `
        *,
        n8n_workflows (
          name,
          category
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Template operations
  async createWorkflowTemplate(data: Omit<N8nWorkflowTemplate, 'id'>) {
    const { data: template, error } = await supabase
      .from('n8n_workflow_templates')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return template;
  }

  async getWorkflowTemplates() {
    const { data, error } = await supabase
      .from('n8n_workflow_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getWorkflowTemplate(id: string) {
    const { data, error } = await supabase
      .from('n8n_workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async incrementTemplateUsage(templateId: string) {
    const { error } = await supabase.rpc('increment_template_usage', { template_id: templateId });

    if (error) throw error;
  }

  // ================================================
  // MCP Server Management
  // ================================================

  async createMcpServer(data: McpServerCreateData) {
    const server = await supabase.from('mcp_servers').insert(data).select().single();

    if (server.error) throw server.error;
    return server.data;
  }

  async getMcpServers() {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getMcpServer(id: string) {
    const { data, error } = await supabase.from('mcp_servers').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  async updateMcpServer(id: string, updates: Partial<McpServer>) {
    const { data, error } = await supabase
      .from('mcp_servers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMcpServer(id: string) {
    // First delete related connections
    await supabase.from('mcp_workflow_connections').delete().eq('server_id', id);

    // Then delete the server
    const { error } = await supabase.from('mcp_servers').delete().eq('id', id);

    if (error) throw error;
  }

  // ================================================
  // MCP Tools Management
  // ================================================

  async getMcpTools(serverId?: string) {
    let query = supabase.from('mcp_tools').select(`
        *,
        mcp_servers (
          name,
          status
        )
      `);

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query.order('last_used_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getMcpTool(id: string) {
    const { data, error } = await supabase
      .from('mcp_tools')
      .select(
        `
        *,
        mcp_servers (
          name,
          url,
          status
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateMcpToolUsage(toolId: string) {
    const { error } = await supabase
      .from('mcp_tools')
      .update({
        usage_count: supabase.rpc('increment', { x: 1, field_name: 'usage_count' }),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', toolId);

    if (error) throw error;
  }

  // ================================================
  // MCP Resources Management
  // ================================================

  async getMcpResources(serverId?: string) {
    let query = supabase.from('mcp_resources').select(`
        *,
        mcp_servers (
          name,
          status
        )
      `);

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query.order('last_accessed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateMcpResourceAccess(resourceId: string) {
    const { error } = await supabase
      .from('mcp_resources')
      .update({
        access_count: supabase.rpc('increment', { x: 1, field_name: 'access_count' }),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', resourceId);

    if (error) throw error;
  }

  // ================================================
  // MCP Workflow Connections
  // ================================================

  async createMcpWorkflowConnection(data: McpConnectionCreateData) {
    const { data: connection, error } = await supabase
      .from('mcp_workflow_connections')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return connection;
  }

  async getMcpWorkflowConnections(workflowId?: string) {
    let query = supabase.from('mcp_workflow_connections').select(`
        *,
        mcp_servers (
          name,
          status,
          url
        )
      `);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async deleteMcpWorkflowConnection(id: string) {
    const { error } = await supabase.from('mcp_workflow_connections').delete().eq('id', id);

    if (error) throw error;
  }

  // ================================================
  // MCP Analytics and Logging
  // ================================================

  async logMcpExecution(data: {
    server_id: string;
    workflow_id?: string;
    operation_type: string;
    operation_data?: any;
    execution_time_ms?: number;
    status: 'success' | 'error';
    error_message?: string;
  }) {
    const { error } = await supabase.from('mcp_execution_logs').insert({
      ...data,
      executed_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async getMcpAnalytics(serverId?: string, timeRange?: { start: string; end: string }) {
    let query = supabase.from('mcp_analytics').select('*');

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    if (timeRange) {
      query = query.gte('date', timeRange.start).lte('date', timeRange.end);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data;
  }
}

// ================================================
// Main Service Class
// ================================================

export class N8nIntegrationService {
  private readonly api: N8nApiClient;
  private readonly db: N8nDatabaseService;

  constructor() {
    this.api = new N8nApiClient();
    this.db = new N8nDatabaseService();
  }

  // Workflow operations
  async createWorkflow(workflowData: any) {
    // First create in n8n
    const n8nWorkflow = await this.api.createWorkflow(workflowData);

    // Then store in database
    const dbWorkflow = await this.db.createWorkflow({
      n8n_workflow_id: n8nWorkflow.id,
      name: workflowData.name,
      description: workflowData.description,
      category: workflowData.category || 'general',
      workflow_data: n8nWorkflow,
      status: 'active',
      tags: workflowData.tags || [],
      created_by: 'system',
    });

    return dbWorkflow;
  }

  async getWorkflows() {
    return this.db.getWorkflows();
  }

  async getWorkflow(id: string) {
    return this.db.getWorkflow(id);
  }

  async updateWorkflow(id: string, updates: any) {
    // Update both n8n and database
    const workflow = await this.db.getWorkflow(id);
    if (workflow.n8n_workflow_id) {
      await this.api.updateWorkflow(workflow.n8n_workflow_id, updates);
    }

    return this.db.updateWorkflow(id, updates);
  }

  async deleteWorkflow(id: string) {
    const workflow = await this.db.getWorkflow(id);
    if (workflow.n8n_workflow_id) {
      await this.api.deleteWorkflow(workflow.n8n_workflow_id);
    }

    return this.db.deleteWorkflow(id);
  }

  async executeWorkflow(id: string, inputData?: any) {
    const workflow = await this.db.getWorkflow(id);
    if (!workflow.n8n_workflow_id) {
      throw new Error('No n8n workflow ID found');
    }

    const execution = await this.api.executeWorkflow(workflow.n8n_workflow_id, inputData);

    // Log execution
    await this.db.logExecution({
      workflow_id: id,
      n8n_execution_id: execution.id,
      status: execution.status || 'running',
      input_data: inputData,
      output_data: execution.data,
      execution_time: execution.executionTime,
      error_message: execution.error?.message,
    });

    return execution;
  }

  async getExecutions(workflowId?: string) {
    return this.db.getExecutions(workflowId);
  }

  async getExecution(id: string) {
    return this.db.getExecution(id);
  }

  // Template operations
  async createTemplate(templateData: any) {
    return this.db.createWorkflowTemplate(templateData);
  }

  async getTemplates() {
    return this.db.getWorkflowTemplates();
  }

  async getTemplate(id: string) {
    return this.db.getWorkflowTemplate(id);
  }

  async useTemplate(templateId: string, customizations?: any) {
    const template = await this.db.getWorkflowTemplate(templateId);

    // Increment usage count
    await this.db.incrementTemplateUsage(templateId);

    // Create workflow from template
    const workflowData = {
      ...template.template_data,
      ...customizations,
      name: customizations?.name || `${template.name} - ${new Date().toISOString()}`,
    };

    return this.createWorkflow(workflowData);
  }

  // Dashboard and analytics
  async getDashboardData() {
    const [workflows, executions, templates] = await Promise.all([
      this.db.getWorkflows(),
      this.db.getExecutions(),
      this.db.getWorkflowTemplates(),
    ]);

    return {
      workflows,
      executions: executions.slice(0, 10), // Latest 10 executions
      templates,
      stats: {
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter((w) => w.status === 'active').length,
        totalExecutions: executions.length,
        successfulExecutions: executions.filter((e) => e.status === 'success').length,
      },
    };
  }

  // ================================================
  // MCP Integration methods
  // ================================================

  async getMcpServers() {
    return this.db.getMcpServers();
  }

  async createMcpServer(data: McpServerCreateData) {
    return this.db.createMcpServer(data);
  }

  async updateMcpServer(id: string, updates: Partial<McpServer>) {
    return this.db.updateMcpServer(id, updates);
  }

  async deleteMcpServer(id: string) {
    return this.db.deleteMcpServer(id);
  }

  async getMcpTools(serverId?: string) {
    return this.db.getMcpTools(serverId);
  }

  async updateMcpToolUsage(toolId: string) {
    return this.db.updateMcpToolUsage(toolId);
  }

  async getMcpResources(serverId?: string) {
    return this.db.getMcpResources(serverId);
  }

  async updateMcpResourceAccess(resourceId: string) {
    return this.db.updateMcpResourceAccess(resourceId);
  }

  async createMcpWorkflowConnection(data: McpConnectionCreateData) {
    return this.db.createMcpWorkflowConnection(data);
  }

  async getMcpWorkflowConnections(workflowId?: string) {
    return this.db.getMcpWorkflowConnections(workflowId);
  }

  async deleteMcpWorkflowConnection(id: string) {
    return this.db.deleteMcpWorkflowConnection(id);
  }

  async logMcpExecution(data: {
    server_id: string;
    workflow_id?: string;
    operation_type: string;
    operation_data?: any;
    execution_time_ms?: number;
    status: 'success' | 'error';
    error_message?: string;
  }) {
    return this.db.logMcpExecution(data);
  }

  async getMcpAnalytics(serverId?: string, timeRange?: { start: string; end: string }) {
    return this.db.getMcpAnalytics(serverId, timeRange);
  }

  // ================================================
  // MCP Server Health and Testing
  // ================================================

  async testMcpServer(serverId: string) {
    const server = await this.db.getMcpServer(serverId);

    try {
      // Test server health check
      if (server.health_check_url) {
        const response = await fetch(server.health_check_url);
        if (response.ok) {
          await this.db.updateMcpServer(serverId, {
            status: 'active',
            last_ping_at: new Date().toISOString(),
          });
          return { status: 'success', message: 'Server is healthy' };
        }
      }

      // Update server status
      await this.db.updateMcpServer(serverId, {
        status: 'error',
        last_ping_at: new Date().toISOString(),
      });

      return { status: 'error', message: 'Server health check failed' };
    } catch (error) {
      await this.db.updateMcpServer(serverId, {
        status: 'error',
        last_ping_at: new Date().toISOString(),
      });

      return { status: 'error', message: error.message };
    }
  }

  async discoverMcpServerCapabilities(serverId: string) {
    try {
      // This would integrate with the actual MCP protocol
      // For now, we'll simulate the discovery process

      const capabilities = {
        tools: ['example_tool_1', 'example_tool_2'],
        resources: ['example_resource_1'],
        prompts: ['example_prompt_1'],
      };

      await this.db.updateMcpServer(serverId, {
        capabilities,
        status: 'active',
        last_ping_at: new Date().toISOString(),
      });

      return capabilities;
    } catch (error) {
      await this.logMcpExecution({
        server_id: serverId,
        operation_type: 'capability_discovery',
        status: 'error',
        error_message: error.message,
      });

      throw error;
    }
  }

  // Database and API access getters
  get database() {
    return this.db;
  }

  get n8nApi() {
    return this.api;
  }
}

// Export singleton instance
export const n8nService = new N8nIntegrationService();
export { N8nApiClient, N8nDatabaseService };
