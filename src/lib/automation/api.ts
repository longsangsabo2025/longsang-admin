// ================================================
// AUTOMATION API - Supabase Integration
// ================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  AIAgent,
  AutomationTrigger,
  Workflow,
  ActivityLog,
  ContentQueue,
  DashboardStats,
  AgentPerformance,
} from '@/types/automation';

// ================================================
// AI AGENTS
// ================================================

export async function getAgents() {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AIAgent[];
}

export async function getAgent(id: string) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as AIAgent;
}

export async function createAgent(agent: Partial<AIAgent>) {
  const { data, error } = await supabase
    .from('ai_agents')
    .insert(agent)
    .select()
    .single();

  if (error) throw error;
  return data as AIAgent;
}

export async function updateAgent(id: string, updates: Partial<AIAgent>) {
  const { data, error } = await supabase
    .from('ai_agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AIAgent;
}

export async function deleteAgent(id: string) {
  const { error } = await supabase
    .from('ai_agents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function pauseAgent(id: string) {
  return updateAgent(id, { status: 'paused' });
}

export async function resumeAgent(id: string) {
  return updateAgent(id, { status: 'active' });
}

// ================================================
// AUTOMATION TRIGGERS
// ================================================

export async function getTriggers(agentId?: string) {
  let query = supabase
    .from('automation_triggers')
    .select('*')
    .order('created_at', { ascending: false });

  if (agentId) {
    query = query.eq('agent_id', agentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AutomationTrigger[];
}

export async function createTrigger(trigger: Partial<AutomationTrigger>) {
  const { data, error } = await supabase
    .from('automation_triggers')
    .insert(trigger)
    .select()
    .single();

  if (error) throw error;
  return data as AutomationTrigger;
}

export async function updateTrigger(id: string, updates: Partial<AutomationTrigger>) {
  const { data, error } = await supabase
    .from('automation_triggers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AutomationTrigger;
}

export async function toggleTrigger(id: string, enabled: boolean) {
  return updateTrigger(id, { enabled });
}

// ================================================
// WORKFLOWS
// ================================================

export async function getWorkflows(agentId?: string) {
  let query = supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (agentId) {
    query = query.eq('agent_id', agentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Workflow[];
}

export async function getWorkflow(id: string) {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Workflow;
}

export async function createWorkflow(workflow: Partial<Workflow>) {
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflow)
    .select()
    .single();

  if (error) throw error;
  return data as Workflow;
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>) {
  const { data, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Workflow;
}

// ================================================
// ACTIVITY LOGS
// ================================================

export async function getActivityLogs(limit = 100, agentId?: string) {
  let query = supabase
    .from('activity_logs')
    .select(`
      *,
      ai_agents(name, type)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agentId) {
    query = query.eq('agent_id', agentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (ActivityLog & { ai_agents?: { name: string; type: string } })[];
}

export async function createActivityLog(log: Partial<ActivityLog>) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data as ActivityLog;
}

export async function getActivityLogsByDateRange(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ActivityLog[];
}

// ================================================
// CONTENT QUEUE
// ================================================

export async function getContentQueue(limit = 50, status?: string) {
  let query = supabase
    .from('content_queue')
    .select(`
      *,
      ai_agents(name, type)
    `)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (ContentQueue & { ai_agents?: { name: string; type: string } })[];
}

export async function getContentItem(id: string) {
  const { data, error } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ContentQueue;
}

export async function createContentItem(content: Partial<ContentQueue>) {
  const { data, error } = await supabase
    .from('content_queue')
    .insert(content)
    .select()
    .single();

  if (error) throw error;
  return data as ContentQueue;
}

export async function updateContentItem(id: string, updates: Partial<ContentQueue>) {
  const { data, error } = await supabase
    .from('content_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ContentQueue;
}

export async function deleteContentItem(id: string) {
  const { error } = await supabase
    .from('content_queue')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ================================================
// DASHBOARD STATS
// ================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  // Get active agents count
  const { count: activeAgents } = await supabase
    .from('ai_agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get actions today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: actionsToday } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // Get success rate (last 100 actions)
  const { data: recentLogs } = await supabase
    .from('activity_logs')
    .select('status')
    .order('created_at', { ascending: false })
    .limit(100);

  const successCount = recentLogs?.filter(log => log.status === 'success').length || 0;
  const totalCount = recentLogs?.length || 1;
  const successRate = (successCount / totalCount) * 100;

  // Get queue size
  const { count: queueSize } = await supabase
    .from('content_queue')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'scheduled']);

  return {
    activeAgents: activeAgents || 0,
    actionsToday: actionsToday || 0,
    successRate: Math.round(successRate * 10) / 10,
    queueSize: queueSize || 0,
  };
}

// ================================================
// AGENT PERFORMANCE
// ================================================

export async function getAgentPerformance(): Promise<AgentPerformance[]> {
  const { data: agents, error } = await supabase
    .from('ai_agents')
    .select(`
      id,
      name,
      total_runs,
      successful_runs,
      last_run
    `)
    .order('total_runs', { ascending: false });

  if (error) throw error;

  // Calculate performance metrics with duration from activity logs
  const performancePromises = agents.map(async (agent) => {
    const failed_runs = agent.total_runs - agent.successful_runs;
    const success_rate = agent.total_runs > 0
      ? (agent.successful_runs / agent.total_runs) * 100
      : 0;

    // Calculate average duration from recent activity logs
    let avg_duration_ms = 0;
    if (agent.total_runs > 0) {
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('duration_ms')
        .eq('agent_id', agent.id)
        .eq('status', 'completed')
        .not('duration_ms', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logs && logs.length > 0) {
        const totalDuration = logs.reduce((sum, log) => sum + (log.duration_ms || 0), 0);
        avg_duration_ms = Math.round(totalDuration / logs.length);
      }
    }

    return {
      agent_id: agent.id,
      agent_name: agent.name,
      total_runs: agent.total_runs,
      successful_runs: agent.successful_runs,
      failed_runs,
      success_rate: Math.round(success_rate * 10) / 10,
      avg_duration_ms,
      last_run: agent.last_run || undefined,
    };
  });

  return Promise.all(performancePromises);
}

// ================================================
// REAL-TIME SUBSCRIPTIONS
// ================================================

export function subscribeToAgentUpdates(callback: (payload: any) => void) {
  return supabase
    .channel('ai_agents_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ai_agents' },
      callback
    )
    .subscribe();
}

export function subscribeToActivityLogs(callback: (payload: any) => void) {
  return supabase
    .channel('activity_logs_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_logs' },
      callback
    )
    .subscribe();
}

export function subscribeToContentQueue(callback: (payload: any) => void) {
  return supabase
    .channel('content_queue_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'content_queue' },
      callback
    )
    .subscribe();
}
