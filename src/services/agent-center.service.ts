/**
 * 🎯 AI Command Center - API Service
 * 
 * Theo tài liệu: docs/ai-command-center/09-API-REFERENCE.md
 * 
 * @author LongSang Admin
 * @version 2.0.0
 * 
 * @ts-nocheck - Temporarily disable type checking until Supabase types are regenerated
 * TODO: Remove @ts-nocheck after running `npx supabase gen types typescript`
 */

// @ts-nocheck

import { supabase } from "@/integrations/supabase/client";

// Type-safe table accessors (bypass generated types for now)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const aiAgentsTable = () => supabase.from('ai_agents') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workflowsTable = () => supabase.from('workflows') as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workflowExecutionsTable = () => supabase.from('workflow_executions') as any;

import {
  AIAgent,
  Workflow,
  WorkflowExecution,
  AITool,
  CreateAgentDTO,
  UpdateAgentDTO,
  CreateWorkflowDTO,
  UpdateWorkflowDTO,
  AnalyticsOverview,
  ExecutionTrend,
  CostTrend,
  AgentUsageStats,
  ToolUsageStats,
  AgentStatus,
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  DEFAULT_AGENT_CONFIG,
  CHART_COLORS,
} from "@/types/agent-center.types";

// ============================================================
// TRANSFORMERS
// ============================================================

/**
 * Transform Supabase raw data to AIAgent interface
 * Schema: id, name, type, status, description, config, last_run, last_error, total_runs, successful_runs, created_at, updated_at, category
 */
export const transformAgent = (raw: Record<string, unknown>): AIAgent => {
  const config = (raw.config as Record<string, unknown>) || {};
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string | undefined,
    status: (raw.status as AgentStatus) || 'inactive',
    type: (raw.type as AIAgent['type']) || 'work_agent',
    config: {
      model: (config.ai_model as string) || DEFAULT_AGENT_CONFIG.model,
      temperature: (config.temperature as number) || DEFAULT_AGENT_CONFIG.temperature,
      maxTokens: (config.max_tokens as number) || DEFAULT_AGENT_CONFIG.maxTokens,
      systemPrompt: config.prompt_template as string | undefined,
      ...config,
    },
    n8nWorkflowId: undefined,
    webhookUrl: undefined,
    totalExecutions: (raw.total_runs as number) || 0,
    successfulExecutions: (raw.successful_runs as number) || 0,
    failedExecutions: ((raw.total_runs as number) || 0) - ((raw.successful_runs as number) || 0),
    totalCostUsd: 0,
    lastUsedAt: raw.last_run ? new Date(raw.last_run as string) : undefined,
    createdAt: new Date(raw.created_at as string),
    updatedAt: new Date(raw.updated_at as string),
    deletedAt: undefined,
    category: raw.category as string | undefined,
  };
};

/**
 * Transform AIAgent to Supabase format for insert/update
 */
export const serializeAgent = (agent: Partial<AIAgent>): Record<string, unknown> => ({
  name: agent.name,
  description: agent.description,
  status: agent.status,
  type: agent.type,
  model: agent.config?.model,
  temperature: agent.config?.temperature,
  max_tokens: agent.config?.maxTokens,
  system_prompt: agent.config?.systemPrompt,
  config: agent.config,
  n8n_workflow_id: agent.n8nWorkflowId,
  webhook_url: agent.webhookUrl,
  updated_at: new Date().toISOString(),
});

/**
 * Transform Supabase raw data to Workflow interface
 */
export const transformWorkflow = (raw: Record<string, unknown>): Workflow => ({
  id: raw.id as string,
  name: raw.name as string,
  description: raw.description as string | undefined,
  status: (raw.status as WorkflowStatus) || 'inactive',
  n8nWorkflowId: raw.n8n_workflow_id as string | undefined,
  n8nWorkflowName: raw.n8n_workflow_name as string | undefined,
  webhookUrl: raw.webhook_url as string | undefined,
  triggers: (raw.triggers as Workflow['triggers']) || [],
  steps: (raw.steps as Workflow['steps']) || [],
  variables: (raw.variables as Record<string, unknown>) || {},
  scheduleCron: raw.schedule_cron as string | undefined,
  totalRuns: (raw.total_runs as number) || 0,
  successfulRuns: (raw.successful_runs as number) || 0,
  failedRuns: (raw.failed_runs as number) || 0,
  avgExecutionTimeMs: (raw.avg_execution_time_ms as number) || 0,
  totalCostUsd: Number.parseFloat(raw.total_cost_usd as string) || 0,
  agentId: raw.agent_id as string | undefined,
  lastRunAt: raw.last_run_at ? new Date(raw.last_run_at as string) : undefined,
  createdAt: new Date(raw.created_at as string),
  updatedAt: new Date(raw.updated_at as string),
});

/**
 * Transform Supabase raw data to WorkflowExecution interface
 */
export const transformExecution = (raw: Record<string, unknown>): WorkflowExecution => ({
  id: raw.id as string,
  workflowId: raw.workflow_id as string,
  agentId: raw.agent_id as string | undefined,
  status: (raw.status as ExecutionStatus) || 'pending',
  triggerType: (raw.trigger_type as TriggerType) || 'manual',
  inputData: (raw.input_data as Record<string, unknown>) || {},
  outputData: raw.output_data as Record<string, unknown> | undefined,
  errorMessage: raw.error_message as string | undefined,
  errorStack: raw.error_stack as string | undefined,
  executionTimeMs: raw.execution_time_ms as number | undefined,
  startedAt: raw.started_at ? new Date(raw.started_at as string) : undefined,
  completedAt: raw.completed_at ? new Date(raw.completed_at as string) : undefined,
  currentStep: (raw.current_step as number) || 0,
  totalSteps: (raw.total_steps as number) || 1,
  stepsLog: (raw.steps_log as WorkflowExecution['stepsLog']) || [],
  tokensUsed: (raw.tokens_used as number) || 0,
  costUsd: Number.parseFloat(raw.cost_usd as string) || 0,
  metadata: (raw.metadata as Record<string, unknown>) || {},
  createdAt: new Date(raw.created_at as string),
  n8nExecutionId: raw.n8n_execution_id as string | undefined,
});

/**
 * Transform Supabase raw data to AITool interface
 */
export const transformTool = (raw: Record<string, unknown>): AITool => ({
  id: raw.id as string,
  name: raw.name as string,
  displayName: raw.display_name as string | undefined,
  description: raw.description as string | undefined,
  category: (raw.category as AITool['category']) || 'utility',
  config: (raw.config as AITool['config']) || {},
  inputSchema: raw.input_schema as AITool['inputSchema'],
  outputSchema: raw.output_schema as AITool['outputSchema'],
  isFree: (raw.is_free as boolean) || false,
  costPerUse: Number.parseFloat(raw.cost_per_use as string) || 0,
  pricingModel: (raw.pricing_model as AITool['pricingModel']) || 'free',
  status: (raw.status as AITool['status']) || 'available',
  isFeatured: (raw.is_featured as boolean) || false,
  totalCalls: (raw.total_calls as number) || 0,
  successfulCalls: (raw.successful_calls as number) || 0,
  avgExecutionTimeMs: (raw.avg_execution_time_ms as number) || 0,
  fromMarketplace: (raw.from_marketplace as boolean) || false,
  marketplaceId: raw.marketplace_id as string | undefined,
  version: (raw.version as string) || '1.0.0',
  lastUsedAt: raw.last_used_at ? new Date(raw.last_used_at as string) : undefined,
  createdAt: new Date(raw.created_at as string),
  updatedAt: new Date(raw.updated_at as string),
});

// ============================================================
// AGENTS API
// ============================================================

export const agentsApi = {
  /**
   * List all agents
   */
  async list(): Promise<AIAgent[]> {
    const { data, error } = await aiAgentsTable()
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformAgent);
  },

  /**
   * Get agent by ID
   */
  async getById(id: string): Promise<AIAgent | null> {
    const { data, error } = await aiAgentsTable()
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? transformAgent(data) : null;
  },

  /**
   * Create new agent
   */
  async create(dto: CreateAgentDTO): Promise<AIAgent> {
    const config = {
      ai_model: dto.config?.model || DEFAULT_AGENT_CONFIG.model,
      temperature: dto.config?.temperature || DEFAULT_AGENT_CONFIG.temperature,
      max_tokens: dto.config?.maxTokens || DEFAULT_AGENT_CONFIG.maxTokens,
      prompt_template: dto.config?.systemPrompt,
      ...dto.config,
    };

    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        name: dto.name,
        description: dto.description,
        type: dto.type || 'work_agent',
        config,
        status: 'inactive',
        category: dto.category || 'custom',
      })
      .select()
      .single();

    if (error) throw error;
    return transformAgent(data);
  },

  /**
   * Update agent
   */
  async update(id: string, dto: UpdateAgentDTO): Promise<AIAgent> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.config) {
      updateData.config = {
        ai_model: dto.config.model,
        temperature: dto.config.temperature,
        max_tokens: dto.config.maxTokens,
        prompt_template: dto.config.systemPrompt,
        ...dto.config,
      };
    }

    const { data, error } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformAgent(data);
  },

  /**
   * Hard delete agent (no deleted_at column)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle agent status
   */
  async toggleStatus(id: string, status: AgentStatus): Promise<AIAgent> {
    return this.update(id, { status });
  },

  /**
   * Get agent stats
   */
  async getStats() {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('id, status, total_runs, successful_runs');

    if (error) throw error;

    const agents = data || [];
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalExecutions = agents.reduce((sum, a) => sum + (a.total_runs || 0), 0);
    const totalSuccessful = agents.reduce((sum, a) => sum + (a.successful_runs || 0), 0);
    const successRate = totalExecutions > 0 ? (totalSuccessful / totalExecutions) * 100 : 0;

    return {
      totalAgents,
      activeAgents,
      totalExecutions,
      totalCost: 0, // No cost tracking column yet
      successRate,
    };
  },
};

// ============================================================
// WORKFLOWS API
// ============================================================

export const workflowsApi = {
  /**
   * List all workflows
   */
  async list(): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformWorkflow);
  },

  /**
   * Get workflow by ID
   */
  async getById(id: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*, ai_agents(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const workflow = transformWorkflow(data);
    if (data.ai_agents) {
      workflow.agent = transformAgent(data.ai_agents);
    }
    return workflow;
  },

  /**
   * Create workflow
   */
  async create(dto: CreateWorkflowDTO): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        name: dto.name,
        description: dto.description,
        agent_id: dto.agentId,
        triggers: dto.triggers || [],
        steps: dto.steps || [],
        status: 'inactive',
      })
      .select()
      .single();

    if (error) throw error;
    return transformWorkflow(data);
  },

  /**
   * Update workflow
   */
  async update(id: string, dto: UpdateWorkflowDTO): Promise<Workflow> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.agentId !== undefined) updateData.agent_id = dto.agentId;
    if (dto.triggers !== undefined) updateData.triggers = dto.triggers;
    if (dto.steps !== undefined) updateData.steps = dto.steps;
    if (dto.status !== undefined) updateData.status = dto.status;

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformWorkflow(data);
  },

  /**
   * Delete workflow
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Toggle workflow status
   */
  async toggleStatus(id: string, status: WorkflowStatus): Promise<Workflow> {
    return this.update(id, { status });
  },

  /**
   * Get workflow stats
   */
  async getStats() {
    const { data, error } = await supabase
      .from('workflows')
      .select('status, total_runs, successful_runs, total_cost_usd');

    if (error) throw error;

    const workflows = data || [];
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(w => w.status === 'active').length;
    const totalRuns = workflows.reduce((sum, w) => sum + (w.total_runs || 0), 0);
    const totalSuccessful = workflows.reduce((sum, w) => sum + (w.successful_runs || 0), 0);
    const successRate = totalRuns > 0 ? (totalSuccessful / totalRuns) * 100 : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      totalRuns,
      successRate,
    };
  },
};

// ============================================================
// EXECUTIONS API
// ============================================================

export const executionsApi = {
  /**
   * List executions
   */
  async list(limit = 50): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*, workflows(id, name), ai_agents(id, name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((item) => {
      const execution = transformExecution(item);
      if (item.workflows) {
        execution.workflow = transformWorkflow(item.workflows);
      }
      if (item.ai_agents) {
        execution.agent = transformAgent(item.ai_agents);
      }
      return execution;
    });
  },

  /**
   * List executions by status
   */
  async listByStatus(status: ExecutionStatus, limit = 20): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformExecution);
  },

  /**
   * Get execution by ID
   */
  async getById(id: string): Promise<WorkflowExecution | null> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*, workflows(*), ai_agents(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const execution = transformExecution(data);
    if (data.workflows) {
      execution.workflow = transformWorkflow(data.workflows);
    }
    if (data.ai_agents) {
      execution.agent = transformAgent(data.ai_agents);
    }
    return execution;
  },

  /**
   * Create execution (trigger workflow)
   */
  async create(workflowId: string, agentId?: string, inputData?: Record<string, unknown>): Promise<WorkflowExecution> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        agent_id: agentId,
        status: 'pending',
        trigger_type: 'manual',
        input_data: inputData || {},
        total_steps: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return transformExecution(data);
  },

  /**
   * Update execution status
   */
  async updateStatus(
    id: string,
    status: ExecutionStatus,
    extras?: {
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      executionTimeMs?: number;
    }
  ): Promise<WorkflowExecution> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updateData.completed_at = new Date().toISOString();
    }

    if (extras?.outputData) updateData.output_data = extras.outputData;
    if (extras?.errorMessage) updateData.error_message = extras.errorMessage;
    if (extras?.executionTimeMs) updateData.execution_time_ms = extras.executionTimeMs;

    const { data, error } = await supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformExecution(data);
  },

  /**
   * Cancel execution
   */
  async cancel(id: string): Promise<WorkflowExecution> {
    return this.updateStatus(id, 'cancelled');
  },

  /**
   * Get execution stats
   */
  async getStats(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status, cost_usd, execution_time_ms')
      .gte('created_at', cutoff.toISOString());

    if (error) throw error;

    const executions = data || [];
    const total = executions.length;
    const completed = executions.filter(e => e.status === 'completed').length;
    const running = executions.filter(e => e.status === 'running').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const totalCost = executions.reduce((sum, e) => sum + Number.parseFloat(e.cost_usd || '0'), 0);
    const avgTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / (total || 1);

    return {
      total,
      completed,
      running,
      failed,
      totalCost,
      avgTimeMs: Math.round(avgTime),
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  },
};

// ============================================================
// TOOLS API
// ============================================================

export const toolsApi = {
  /**
   * List all tools
   */
  async list(): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('total_calls', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformTool);
  },

  /**
   * List tools by category
   */
  async listByCategory(category: AITool['category']): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('category', category)
      .eq('status', 'available')
      .order('total_calls', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformTool);
  },

  /**
   * Get tool by ID
   */
  async getById(id: string): Promise<AITool | null> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? transformTool(data) : null;
  },

  /**
   * Get tool stats
   */
  async getStats() {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('status, total_calls, successful_calls, cost_per_use');

    if (error) throw error;

    const tools = data || [];
    const totalTools = tools.length;
    const availableTools = tools.filter(t => t.status === 'available').length;
    const totalCalls = tools.reduce((sum, t) => sum + (t.total_calls || 0), 0);
    const totalSuccessful = tools.reduce((sum, t) => sum + (t.successful_calls || 0), 0);
    const successRate = totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0;

    return {
      totalTools,
      availableTools,
      totalCalls,
      successRate,
    };
  },
};

// ============================================================
// ANALYTICS API
// ============================================================

export const analyticsApi = {
  /**
   * Get analytics overview
   */
  async getOverview(days = 7): Promise<AnalyticsOverview> {
    const [agentStats, executionStats] = await Promise.all([
      agentsApi.getStats(),
      executionsApi.getStats(days),
    ]);

    // Calculate trend (mock for now - would need historical data)
    const mockTrend = (value: number) => ({
      value: Math.round(value * 0.1),
      percent: Math.round(Math.random() * 20 - 5),
      direction: Math.random() > 0.5 ? 'up' : 'down',
    } as const);

    return {
      executions: {
        total: executionStats.total,
        success: executionStats.completed,
        failed: executionStats.failed,
        successRate: executionStats.successRate,
        change: mockTrend(executionStats.total),
      },
      costs: {
        total: executionStats.totalCost,
        avgPerExecution: executionStats.total > 0 
          ? executionStats.totalCost / executionStats.total 
          : 0,
        change: mockTrend(executionStats.totalCost),
      },
      performance: {
        avgTimeMs: executionStats.avgTimeMs,
        p95TimeMs: executionStats.avgTimeMs * 1.5, // Mock P95
        change: mockTrend(executionStats.avgTimeMs),
      },
      agents: {
        total: agentStats.totalAgents,
        active: agentStats.activeAgents,
      },
    };
  },

  /**
   * Get execution trends
   */
  async getExecutionTrends(days = 7): Promise<ExecutionTrend[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status, created_at')
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped = (data || []).reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) {
        acc[date] = { total: 0, success: 0, failed: 0 };
      }
      acc[date].total++;
      if (item.status === 'completed') acc[date].success++;
      if (item.status === 'failed') acc[date].failed++;
      return acc;
    }, {} as Record<string, { total: number; success: number; failed: number }>);

    return Object.entries(grouped).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  },

  /**
   * Get cost trends
   */
  async getCostTrends(days = 7): Promise<CostTrend[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('cost_usd, created_at')
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped = (data || []).reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number.parseFloat(item.cost_usd || '0');
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, cost]) => ({
      date,
      cost,
    }));
  },

  /**
   * Get agent usage distribution
   */
  async getAgentUsage(): Promise<AgentUsageStats[]> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('id, name, total_executions, total_cost_usd')
      .gt('total_executions', 0)
      .order('total_executions', { ascending: false })
      .limit(10);

    if (error) throw error;

    const total = (data || []).reduce((sum, a) => sum + (a.total_executions || 0), 0);
    const colors = Object.values(CHART_COLORS);

    return (data || []).map((agent, index) => ({
      agentId: agent.id,
      name: agent.name,
      executions: agent.total_executions || 0,
      percentage: total > 0 ? ((agent.total_executions || 0) / total) * 100 : 0,
      cost: Number.parseFloat(agent.total_cost_usd || '0'),
      color: colors[index % colors.length],
    }));
  },

  /**
   * Get tool usage stats
   */
  async getToolUsage(): Promise<ToolUsageStats[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('id, name, total_calls, successful_calls, avg_execution_time_ms')
      .gt('total_calls', 0)
      .order('total_calls', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || []).map((tool) => ({
      toolId: tool.id,
      name: tool.name,
      calls: tool.total_calls || 0,
      successRate: tool.total_calls > 0 
        ? ((tool.successful_calls || 0) / tool.total_calls) * 100 
        : 0,
      avgTimeMs: tool.avg_execution_time_ms || 0,
    }));
  },
};

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

export const subscriptions = {
  /**
   * Subscribe to execution updates
   */
  subscribeToExecutions(callback: (payload: unknown) => void) {
    return supabase
      .channel('execution-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions',
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to agent status changes
   */
  subscribeToAgentStatus(callback: (payload: unknown) => void) {
    return supabase
      .channel('agent-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_agents',
        },
        callback
      )
      .subscribe();
  },
};

// ============================================================
// N8N WORKFLOW PROMOTION
// ============================================================

/**
 * Promote n8n workflow to production workflow in Supabase
 */
export const promoteN8nWorkflow = async (
  n8nWorkflow: {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    triggerType?: string;
    nodeCount?: number;
  },
  options: {
    agentId?: string;
    targetProject?: string;
    status?: WorkflowStatus;
    schedule?: string;
  } = {}
): Promise<Workflow | null> => {
  try {
    const workflowData: CreateWorkflowDTO = {
      name: n8nWorkflow.name,
      description: n8nWorkflow.description || `Promoted from n8n workflow ${n8nWorkflow.id}`,
      status: options.status || (n8nWorkflow.active ? 'active' : 'inactive'),
      triggerType: (n8nWorkflow.triggerType as TriggerType) || 'manual',
      schedule: options.schedule,
      config: {
        n8nWorkflowId: n8nWorkflow.id,
        sourceType: 'n8n',
        promotedAt: new Date().toISOString(),
        nodeCount: n8nWorkflow.nodeCount || 0,
      },
    };

    // Assign to agent if provided
    if (options.agentId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (workflowData as any).agent_id = options.agentId;
    }

    const result = await workflowsApi.create(workflowData);
    return result;
  } catch (err) {
    console.error('Error promoting n8n workflow:', err);
    return null;
  }
};

// ============================================================
// EXPORT ALL
// ============================================================

export const agentCenterApi = {
  agents: agentsApi,
  workflows: workflowsApi,
  executions: executionsApi,
  tools: toolsApi,
  analytics: analyticsApi,
  subscriptions,
  promoteN8nWorkflow,
};

export default agentCenterApi;
