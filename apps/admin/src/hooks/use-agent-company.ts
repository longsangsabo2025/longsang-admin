/**
 * 🏢 Agent Company — React Hooks
 * TanStack Query hooks for the agent_registry / agent-company Edge Function
 *
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { agentCompanyApi } from '@/services/agent-company.service';
import type {
  Department,
  AgentStatus,
  RegistryAgent,
  CompanyDashboard,
  MorningBriefingData,
} from '@/services/agent-company.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const companyKeys = {
  all: ['agent-company'] as const,
  dashboard: () => [...companyKeys.all, 'dashboard'] as const,
  agents: () => [...companyKeys.all, 'agents'] as const,
  agentList: (filters?: { department?: string; status?: string; search?: string }) =>
    [...companyKeys.agents(), filters ?? {}] as const,
  agentById: (id: string) => [...companyKeys.agents(), id] as const,
  agentStats: () => [...companyKeys.all, 'stats'] as const,
  department: (dept: string) => [...companyKeys.all, 'department', dept] as const,
  executions: () => [...companyKeys.all, 'executions'] as const,
  messages: () => [...companyKeys.all, 'messages'] as const,
  unreadCount: () => [...companyKeys.all, 'unread'] as const,
  briefing: () => [...companyKeys.all, 'briefing'] as const,
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

/** Full company dashboard (departments, totals, agent counts) */
export function useCompanyDashboard() {
  return useQuery<CompanyDashboard>({
    queryKey: companyKeys.dashboard(),
    queryFn: () => agentCompanyApi.dashboard.get(),
    staleTime: 30 * 1000,       // 30s
    refetchInterval: 60 * 1000, // auto-refresh every 60s
  });
}

// ─── Agents ──────────────────────────────────────────────────────────────────

/** List all agents with optional filters */
export function useRegistryAgents(filters?: {
  department?: Department;
  status?: AgentStatus;
  search?: string;
}) {
  return useQuery<RegistryAgent[]>({
    queryKey: companyKeys.agentList(filters),
    queryFn: () => agentCompanyApi.agents.list(filters),
    staleTime: 15 * 1000,
  });
}

/** Single agent by ID */
export function useRegistryAgent(id: string) {
  return useQuery<RegistryAgent | null>({
    queryKey: companyKeys.agentById(id),
    queryFn: () => agentCompanyApi.agents.getById(id),
    enabled: !!id,
  });
}

/** Aggregate stats across all agents */
export function useAgentStats() {
  return useQuery({
    queryKey: companyKeys.agentStats(),
    queryFn: () => agentCompanyApi.agents.getStats(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/** Agents grouped by department */
export function useDepartmentAgents(department: Department) {
  return useQuery({
    queryKey: companyKeys.department(department),
    queryFn: () => agentCompanyApi.agents.getByDepartment(department),
    staleTime: 15 * 1000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Update agent status (activate, pause, etc.) */
export function useUpdateAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
      agentCompanyApi.agents.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

/** Start an agent execution */
export function useStartExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, action, input }: { agentId: string; action: string; input?: Record<string, unknown> }) =>
      agentCompanyApi.executions.start(agentId, action, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.executions() });
      qc.invalidateQueries({ queryKey: companyKeys.agentStats() });
    },
  });
}

/** Execute agent via agent-runner (actual LLM call with system prompts) */
export function useExecuteAgentRunner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ codename, message, context }: { codename: string; message: string; context?: string }) =>
      agentCompanyApi.executions.executeViaRunner(codename, message, context),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.executions() });
      qc.invalidateQueries({ queryKey: companyKeys.agentStats() });
      qc.invalidateQueries({ queryKey: companyKeys.agents() });
    },
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useAgentMessages(limit = 50) {
  return useQuery({
    queryKey: companyKeys.messages(),
    queryFn: () => agentCompanyApi.messages.list(limit),
    staleTime: 10 * 1000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: companyKeys.unreadCount(),
    queryFn: () => agentCompanyApi.messages.unreadCount(),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ─── Morning Briefing ────────────────────────────────────────────────────────

export function useCompanyBriefing() {
  return useQuery<MorningBriefingData>({
    queryKey: companyKeys.briefing(),
    queryFn: () => agentCompanyApi.briefing.get(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// ─── Executions ──────────────────────────────────────────────────────────────

export function useRecentExecutions(limit = 50) {
  return useQuery({
    queryKey: companyKeys.executions(),
    queryFn: () => agentCompanyApi.executions.list(limit),
    staleTime: 10 * 1000,
  });
}

// ─── Realtime subscriptions ──────────────────────────────────────────────────

/** Auto-invalidate queries on realtime changes */
export function useAgentRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const agentSub = agentCompanyApi.subscriptions.onAgentChange(() => {
      qc.invalidateQueries({ queryKey: companyKeys.agents() });
      qc.invalidateQueries({ queryKey: companyKeys.dashboard() });
      qc.invalidateQueries({ queryKey: companyKeys.agentStats() });
    });

    const execSub = agentCompanyApi.subscriptions.onExecution(() => {
      qc.invalidateQueries({ queryKey: companyKeys.executions() });
      qc.invalidateQueries({ queryKey: companyKeys.agentStats() });
    });

    const msgSub = agentCompanyApi.subscriptions.onMessage(() => {
      qc.invalidateQueries({ queryKey: companyKeys.messages() });
      qc.invalidateQueries({ queryKey: companyKeys.unreadCount() });
    });

    return () => {
      agentSub.unsubscribe();
      execSub.unsubscribe();
      msgSub.unsubscribe();
    };
  }, [qc]);
}
