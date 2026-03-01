/**
 * 🏢 Agent Company Service
 * Connects to the `agent-company` Edge Function + `agent_registry` table
 * Real-time data for 45 AI agents across 9 departments
 *
 * @author CTO (Copilot)
 * @version 1.0.0
 * @date 2026-02-25
 */

import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'idle' | 'busy' | 'error' | 'disabled' | 'maintenance';

export type Department =
  | 'content'
  | 'marketing'
  | 'sales'
  | 'entertainment'
  | 'infrastructure'
  | 'operations'
  | 'sports'
  | 'realestate'
  | 'education';

export interface RegistryAgent {
  id: string;
  name: string;
  codename: string;
  emoji: string;
  department: Department;
  role: string;
  status: AgentStatus;
  type: string;
  model: string;
  description: string;
  capabilities: string[];
  cost_per_run: number;
  total_cost_usd: number;
  total_revenue_usd: number;
  success_rate: number;
  total_executions: number;
  success_count: number;
  fail_count: number;
  avg_execution_time_ms: number;
  last_active: string | null;
  source_project: string;
  source_file: string;
  schedule: string | null;
  reports_to: string | null;
  quality_score: number;
  tools: unknown[];
  skills: unknown[];
  created_at: string;
  updated_at: string;
}

export interface DepartmentStats {
  total: number;
  active: number;
  idle: number;
  busy: number;
  error: number;
  total_cost: number;
  total_revenue: number;
  total_executions: number;
  agents: RegistryAgent[];
}

export interface CompanyDashboard {
  name: string;
  total_agents: number;
  active: number;
  idle: number;
  busy: number;
  error: number;
  total_cost: number;
  total_revenue: number;
  departments: Record<Department, DepartmentStats>;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  action: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  cost_usd: number;
  duration_ms: number;
  error_message: string | null;
  pipeline_id: string | null;
  pipeline_step: number | null;
  triggered_by: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message_type: 'report' | 'request' | 'alert' | 'handoff' | 'decision';
  content: Record<string, unknown>;
  priority: number;
  read: boolean;
  created_at: string;
}

export interface MorningBriefingData {
  greeting: string;
  summary: {
    total_agents: number;
    active_yesterday: number;
    executions_yesterday: number;
    cost_yesterday: number;
    success_rate: number;
  };
  errors: Array<{
    agent_name: string;
    error_message: string;
    timestamp: string;
  }>;
  pending_decisions: AgentMessage[];
  top_agents: Array<{
    name: string;
    executions: number;
    success_rate: number;
  }>;
}

// ─── Edge Function Helper ────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

async function callEdgeFunction<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  const url = `${SUPABASE_URL}/functions/v1/agent-company?action=${action}`;
  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge Function error (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Direct Supabase Queries (faster for lists) ─────────────────────────────

async function queryRegistry(filters?: {
  department?: Department;
  status?: AgentStatus;
  search?: string;
}): Promise<RegistryAgent[]> {
  let query = supabase
    .from('agent_registry')
    .select('*')
    .order('department')
    .order('name');

  if (filters?.department) query = query.eq('department', filters.department);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,codename.ilike.%${filters.search}%,description.ilike.%${filters.search}%,department.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Registry query failed: ${error.message}`);

  // Map DB column names to our interface
  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    emoji: row.avatar_emoji || '🤖',
    role: row.description || row.codename || '',
    capabilities: row.skills || [],
    last_active: row.last_active_at || null,
  })) as RegistryAgent[];
}

// ─── Service APIs ────────────────────────────────────────────────────────────

export const agentCompanyApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    /** Get full company dashboard with department stats */
    async get(): Promise<CompanyDashboard> {
      const res = await callEdgeFunction<{ success: boolean; company: CompanyDashboard }>('dashboard');
      return res.company;
    },
  },

  // ── Agents ─────────────────────────────────────────────────────────────────
  agents: {
    /** Get all agents (optionally filtered) */
    async list(filters?: {
      department?: Department;
      status?: AgentStatus;
      search?: string;
    }): Promise<RegistryAgent[]> {
      return queryRegistry(filters);
    },

    /** Get single agent by ID */
    async getById(id: string): Promise<RegistryAgent | null> {
      const { data, error } = await supabase
        .from('agent_registry')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as RegistryAgent;
    },

    /** Get agents by department with stats */
    async getByDepartment(department: Department): Promise<{
      agents: RegistryAgent[];
      stats: { total: number; active: number; idle: number; busy: number; error: number };
    }> {
      const agents = await queryRegistry({ department });
      return {
        agents,
        stats: {
          total: agents.length,
          active: agents.filter((a) => a.status === 'active').length,
          idle: agents.filter((a) => a.status === 'idle').length,
          busy: agents.filter((a) => a.status === 'busy').length,
          error: agents.filter((a) => a.status === 'error').length,
        },
      };
    },

    /** Update agent status */
    async updateStatus(id: string, status: AgentStatus): Promise<void> {
      const { error } = await supabase
        .from('agent_registry')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(`Failed to update agent status: ${error.message}`);
    },

    /** Get aggregate stats */
    async getStats(): Promise<{
      total: number;
      active: number;
      idle: number;
      busy: number;
      error: number;
      totalCost: number;
      totalRevenue: number;
      avgSuccessRate: number;
      totalExecutions: number;
    }> {
      const agents = await queryRegistry();
      return {
        total: agents.length,
        active: agents.filter((a) => a.status === 'active').length,
        idle: agents.filter((a) => a.status === 'idle').length,
        busy: agents.filter((a) => a.status === 'busy').length,
        error: agents.filter((a) => a.status === 'error').length,
        totalCost: agents.reduce((s, a) => s + (a.total_cost_usd || 0), 0),
        totalRevenue: agents.reduce((s, a) => s + (a.total_revenue_usd || 0), 0),
        avgSuccessRate:
          agents.length > 0
            ? agents.reduce((s, a) => s + (a.success_rate || 0), 0) / agents.length
            : 0,
        totalExecutions: agents.reduce((s, a) => s + (a.total_executions || 0), 0),
      };
    },
  },

  // ── Executions ─────────────────────────────────────────────────────────────
  executions: {
    /** Get recent executions */
    async list(limit = 50): Promise<AgentExecution[]> {
      const { data, error } = await supabase
        .from('agent_execution_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`Execution query failed: ${error.message}`);
      return (data || []) as AgentExecution[];
    },

    /** Start an agent execution */
    async start(agentId: string, action: string, inputData?: Record<string, unknown>): Promise<void> {
      await callEdgeFunction('execute', {
        agent_id: agentId,
        action,
        input_data: inputData || {},
      });
    },

    /** Execute agent via agent-runner (LLM execution with actual prompts) */
    async executeViaRunner(codename: string, message: string, context?: string): Promise<{
      success: boolean;
      codename: string;
      model: string;
      response: string;
      execution_time_ms: number;
    }> {
      const url = `${SUPABASE_URL}/functions/v1/agent-runner`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'execute',
          codename,
          message,
          context,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Agent runner error (${res.status}): ${text}`);
      }
      return res.json();
    },

    /** List agents available in agent-runner */
    async listRunnerAgents(): Promise<{ success: boolean; agents: Array<{ codename: string; name: string; department: string; avatar_emoji: string; description: string; status: string }>; total: number }> {
      const url = `${SUPABASE_URL}/functions/v1/agent-runner`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'list' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Agent runner error (${res.status}): ${text}`);
      }
      return res.json();
    },

    /** Complete an execution */
    async complete(
      executionId: string,
      result: { success: boolean; output?: Record<string, unknown>; error?: string; cost?: number }
    ): Promise<void> {
      await callEdgeFunction('complete', {
        execution_id: executionId,
        ...result,
      });
    },
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  messages: {
    /** Get agent messages */
    async list(limit = 50): Promise<AgentMessage[]> {
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`Messages query failed: ${error.message}`);
      return (data || []) as AgentMessage[];
    },

    /** Get unread count */
    async unreadCount(): Promise<number> {
      const { count, error } = await supabase
        .from('agent_messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      if (error) return 0;
      return count || 0;
    },

    /** Send message */
    async send(msg: {
      from_agent: string;
      to_agent: string;
      message_type: AgentMessage['message_type'];
      content: Record<string, unknown>;
      priority?: number;
    }): Promise<void> {
      await callEdgeFunction('message', msg);
    },
  },

  // ── Morning Briefing ──────────────────────────────────────────────────────
  briefing: {
    /** Get AI-generated morning briefing */
    async get(): Promise<MorningBriefingData> {
      const res = await callEdgeFunction<{ success: boolean; briefing: MorningBriefingData }>(
        'morning-briefing'
      );
      return res.briefing;
    },
  },

  // ── Subscriptions (Realtime) ──────────────────────────────────────────────
  subscriptions: {
    /** Subscribe to agent status changes */
    onAgentChange(callback: (agent: RegistryAgent) => void) {
      return supabase
        .channel('agent_registry_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agent_registry' },
          (payload) => callback(payload.new as RegistryAgent)
        )
        .subscribe();
    },

    /** Subscribe to new executions */
    onExecution(callback: (execution: AgentExecution) => void) {
      return supabase
        .channel('agent_execution_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'agent_execution_log' },
          (payload) => callback(payload.new as AgentExecution)
        )
        .subscribe();
    },

    /** Subscribe to new messages */
    onMessage(callback: (message: AgentMessage) => void) {
      return supabase
        .channel('agent_messages_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'agent_messages' },
          (payload) => callback(payload.new as AgentMessage)
        )
        .subscribe();
    },
  },
};

export default agentCompanyApi;
