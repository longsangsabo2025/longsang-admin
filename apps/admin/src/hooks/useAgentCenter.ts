/**
 * Custom hooks for AI Command Center
 * Provides reusable state management and data fetching logic
 */

import { useState, useEffect, useCallback } from 'react';
import { agentCenterApi } from '@/services/agent-center.service';
import {
  AIAgent,
  Workflow,
  WorkflowExecution,
  AITool,
  AnalyticsData,
  AgentStatus,
  WorkflowStatus,
} from '@/types/agent-center.types';

// Type aliases for complex Omit types
type CreateAgentData = Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>;
type CreateWorkflowData = Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Hook for managing AI Agents
 */
export function useAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentCenterApi.agents.list();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (agent: CreateAgentData) => {
    const newAgent = await agentCenterApi.agents.create(agent);
    setAgents((prev) => [...prev, newAgent]);
    return newAgent;
  }, []);

  const updateAgent = useCallback(async (id: string, updates: Partial<AIAgent>) => {
    const updated = await agentCenterApi.agents.update(id, updates);
    setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const deleteAgent = useCallback(async (id: string) => {
    await agentCenterApi.agents.delete(id);
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAgentStatus = useCallback(
    async (id: string, status: AgentStatus) => {
      return updateAgent(id, { status });
    },
    [updateAgent]
  );

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const activeAgents = agents.filter((a) => a.status === 'active');
  const inactiveAgents = agents.filter((a) => a.status === 'inactive');

  return {
    agents,
    activeAgents,
    inactiveAgents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
  };
}

/**
 * Hook for managing Workflows
 */
export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentCenterApi.workflows.list();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch workflows'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (workflow: CreateWorkflowData) => {
    const newWorkflow = await agentCenterApi.workflows.create(workflow);
    setWorkflows((prev) => [...prev, newWorkflow]);
    return newWorkflow;
  }, []);

  const updateWorkflow = useCallback(async (id: string, updates: Partial<Workflow>) => {
    const updated = await agentCenterApi.workflows.update(id, updates);
    setWorkflows((prev) => prev.map((w) => (w.id === id ? updated : w)));
    return updated;
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    await agentCenterApi.workflows.delete(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const toggleWorkflowStatus = useCallback(
    async (id: string, status: WorkflowStatus) => {
      return updateWorkflow(id, { status });
    },
    [updateWorkflow]
  );

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const activeWorkflows = workflows.filter((w) => w.status === 'active');
  const inactiveWorkflows = workflows.filter((w) => w.status === 'inactive');

  return {
    workflows,
    activeWorkflows,
    inactiveWorkflows,
    loading,
    error,
    refetch: fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
  };
}

/**
 * Hook for managing Executions
 */
export function useExecutions(limit = 50) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentCenterApi.executions.list(limit);
      setExecutions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch executions'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const runningExecutions = executions.filter((e) => e.status === 'running');
  const completedExecutions = executions.filter((e) => e.status === 'completed');
  const failedExecutions = executions.filter((e) => e.status === 'failed');

  const stats = {
    total: executions.length,
    running: runningExecutions.length,
    completed: completedExecutions.length,
    failed: failedExecutions.length,
    successRate: executions.length > 0 ? (completedExecutions.length / executions.length) * 100 : 0,
  };

  return {
    executions,
    runningExecutions,
    completedExecutions,
    failedExecutions,
    stats,
    loading,
    error,
    refetch: fetchExecutions,
  };
}

/**
 * Hook for managing Tools
 */
export function useTools() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentCenterApi.tools.list();
      setTools(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tools'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const freeTools = tools.filter((t) => t.isFree);
  const paidTools = tools.filter((t) => !t.isFree);

  const toolsByCategory = tools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, AITool[]>
  );

  return {
    tools,
    freeTools,
    paidTools,
    toolsByCategory,
    loading,
    error,
    refetch: fetchTools,
  };
}

/**
 * Hook for Analytics
 */
export function useAnalytics(timeRange: '24h' | '7d' | '30d' | '90d' = '7d') {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Convert time range string to days number
  const getDays = (range: string): number => {
    switch (range) {
      case '24h':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 7;
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const days = getDays(timeRange);
      const overview = await agentCenterApi.analytics.getOverview(days);

      // Transform AnalyticsOverview to AnalyticsData
      setAnalytics({
        totalExecutions: overview.executions.total,
        successRate: overview.executions.successRate,
        totalCost: overview.costs.total,
        avgDuration: overview.performance.avgTimeMs,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

/**
 * Hook for Dashboard Stats
 */
export function useDashboardStats() {
  const { agents, loading: agentsLoading } = useAgents();
  const { workflows, loading: workflowsLoading } = useWorkflows();
  const { stats: executionStats, loading: executionsLoading } = useExecutions();
  const { tools, loading: toolsLoading } = useTools();

  const loading = agentsLoading || workflowsLoading || executionsLoading || toolsLoading;

  const stats = {
    agents: {
      total: agents.length,
      active: agents.filter((a) => a.status === 'active').length,
    },
    workflows: {
      total: workflows.length,
      active: workflows.filter((w) => w.status === 'active').length,
    },
    executions: executionStats,
    tools: {
      total: tools.length,
      free: tools.filter((t) => t.isFree).length,
    },
  };

  return {
    stats,
    loading,
  };
}
