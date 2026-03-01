/**
 * 🚀 MVP Marketplace Service
 * Handle agent activation, execution tracking, and usage billing
 */

import { supabase } from '@/integrations/supabase/client';
import { MVPAgent } from '@/data/mvp-agents';

// ============================================
// TYPES
// ============================================

export interface UserAgent {
  id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_type: string;
  status: 'active' | 'inactive';
  free_runs_remaining: number;
  total_runs: number;
  total_cost: number;
  activated_at: string;
  last_used_at?: string;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  user_id?: string; // Optional for demo mode
  created_by?: string; // DB field name
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: any;
  output_data?: any;
  error_message?: string;
  execution_time_ms?: number;
  cost_usd: number;
  started_at: string;
  completed_at?: string;
}

// ============================================
// AGENT ACTIVATION
// ============================================

/**
 * Activate an agent for current user
 */
export async function activateAgent(agent: MVPAgent) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || 'demo-user-' + Math.random().toString(36).substring(2, 11);

  if (!user) {
    console.warn('⚠️ No authenticated user - using demo mode with ID:', userId);
  }

  // Check if agent already activated
  const { data: existing } = await supabase
    .from('agents')
    .select('id')
    .eq('name', agent.id)
    .single();

  let agentDbId = existing?.id;

  // Create agent in DB if doesn't exist
  if (!existing) {
    const insertData = {
      name: agent.id,
      role: agent.name,
      agent_type: agent.category,
      description: agent.description,
      status: 'active',
      // Only include created_by if user is authenticated (UUID format)
      ...(user?.id ? { created_by: user.id } : {}),
      config: {
        model: agent.config.model,
        temperature: agent.config.temperature,
        max_tokens: agent.config.max_tokens,
        system_prompt: agent.system_prompt,
        pricing: agent.pricing,
      },
      capabilities: agent.use_cases,
      metadata: {
        icon: agent.icon,
        tagline: agent.tagline,
        features: agent.features,
        rating: agent.rating,
      },
    };

    console.log('🚀 Inserting agent with data:', insertData);

    const { data: newAgent, error } = await supabase
      .from('agents')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to insert agent:', error);
      throw error;
    }

    agentDbId = newAgent.id;
    console.log('✅ Agent created in database:', agentDbId);
  }

  // Create user_agent relationship (we'll use a custom view or separate tracking)
  // For now, we track in usage_tracking table

  return {
    success: true,
    agent_id: agentDbId,
    free_runs_remaining: agent.pricing.free_trial_runs,
  };
}

/**
 * Get user's activated agents
 */
export async function getUserActivatedAgents(): Promise<UserAgent[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get all agents the user has executed
  const { data: executions } = await supabase
    .from('agent_executions')
    .select(
      `
      agent_id,
      agents (
        id,
        name,
        role,
        agent_type,
        status,
        config,
        total_executions,
        total_cost_usd
      )
    `
    )
    .eq('created_by', user.id);

  if (!executions) return [];

  // Group by agent and calculate stats
  const agentMap = new Map();

  executions.forEach((exec: any) => {
    const agent = exec.agents;
    if (!agentMap.has(agent.id)) {
      agentMap.set(agent.id, {
        id: agent.id,
        user_id: user.id,
        agent_id: agent.id,
        agent_name: agent.role,
        agent_type: agent.agent_type,
        status: agent.status,
        free_runs_remaining: 0, // Calculate from config
        total_runs: agent.total_executions || 0,
        total_cost: parseFloat(agent.total_cost_usd || 0),
        activated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      });
    }
  });

  return Array.from(agentMap.values());
}

// ============================================
// AGENT EXECUTION
// ============================================

/**
 * Execute an agent with input data
 */
export async function executeAgent(
  agentId: string,
  inputData: any,
  costUsd: number = 0
): Promise<AgentExecution> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || 'demo-user-' + Math.random().toString(36).substring(2, 11);

  if (!user) {
    console.warn('⚠️ No authenticated user - executing in demo mode');
  }

  // Create execution record
  const { data: execution, error } = await supabase
    .from('agent_executions')
    .insert({
      agent_id: agentId,
      created_by: userId,
      status: 'pending',
      input_data: inputData,
      cost_usd: costUsd,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return execution as AgentExecution;
}

/**
 * Update execution status and results
 */
export async function updateExecution(
  executionId: string,
  updates: {
    status?: 'running' | 'completed' | 'failed';
    output_data?: any;
    error_message?: string;
    execution_time_ms?: number;
  }
) {
  const { error } = await supabase
    .from('agent_executions')
    .update({
      ...updates,
      completed_at:
        updates.status === 'completed' || updates.status === 'failed'
          ? new Date().toISOString()
          : undefined,
    })
    .eq('id', executionId);

  if (error) throw error;

  // Update agent stats
  if (updates.status === 'completed') {
    await supabase.rpc('increment_agent_executions', {
      agent_id: executionId, // This needs the agent_id, adjust RPC
    });
  }
}

/**
 * Get execution history for user
 */
export async function getUserExecutions(limit: number = 50): Promise<AgentExecution[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('agent_executions')
    .select(
      `
      id,
      agent_id,
      status,
      input_data,
      output_data,
      error_message,
      execution_time_ms,
      cost_usd,
      started_at,
      completed_at,
      agents (
        name,
        role
      )
    `
    )
    .eq('created_by', user.id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((exec: any) => ({
    ...exec,
    user_id: user.id,
  }));
}

// ============================================
// USAGE & BILLING
// ============================================

/**
 * Track usage for current period
 */
export async function trackUsage(type: 'api_call' | 'workflow' | 'agent', count: number = 1) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Get or create current period usage
  const periodStart = new Date();
  periodStart.setDate(1); // First day of month
  periodStart.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', user.id)
    .gte('period_start', periodStart.toISOString())
    .single();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (type === 'api_call') {
    updateData.api_calls_count = (existing?.api_calls_count || 0) + count;
  } else if (type === 'workflow') {
    updateData.workflows_executed = (existing?.workflows_executed || 0) + count;
  } else if (type === 'agent') {
    // Track as workflows for now
    updateData.workflows_executed = (existing?.workflows_executed || 0) + count;
  }

  if (existing) {
    await supabase.from('usage_tracking').update(updateData).eq('id', existing.id);
  } else {
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      period_start: periodStart.toISOString(),
      ...updateData,
    });
  }
}

/**
 * Get current usage stats
 */
export async function getCurrentUsage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      api_calls: 0,
      workflows: 0,
      storage_mb: 0,
      agents: 0,
    };
  }

  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', user.id)
    .gte('period_start', periodStart.toISOString())
    .single();

  return {
    api_calls: data?.api_calls_count || 0,
    workflows: data?.workflows_executed || 0,
    storage_mb: data?.storage_used_mb || 0,
    agents: data?.agents_created || 0,
  };
}

/**
 * Calculate total cost for user this month
 */
export async function getMonthlySpend() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('agent_executions')
    .select('cost_usd')
    .eq('created_by', user.id)
    .gte('started_at', monthStart.toISOString());

  if (!data) return 0;

  return data.reduce((sum, exec) => sum + parseFloat(exec.cost_usd || 0), 0);
}

/**
 * Check if user has free runs remaining for agent
 */
export async function checkFreeRuns(
  agentId: string,
  freeTrialLimit: number
): Promise<{
  has_free_runs: boolean;
  runs_used: number;
  runs_remaining: number;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      has_free_runs: false,
      runs_used: 0,
      runs_remaining: 0,
    };
  }

  const { data, error } = await supabase
    .from('agent_executions')
    .select('id')
    .eq('agent_id', agentId)
    .eq('created_by', user.id);

  const runsUsed = data?.length || 0;
  const runsRemaining = Math.max(0, freeTrialLimit - runsUsed);

  return {
    has_free_runs: runsRemaining > 0,
    runs_used: runsUsed,
    runs_remaining: runsRemaining,
  };
}

// ============================================
// AGENT STATS
// ============================================

/**
 * Get agent performance stats
 */
export async function getAgentStats(agentId: string) {
  const { data } = await supabase
    .from('agents')
    .select(
      'total_executions, successful_executions, failed_executions, avg_execution_time_ms, total_cost_usd'
    )
    .eq('id', agentId)
    .single();

  return {
    total_runs: data?.total_executions || 0,
    successful_runs: data?.successful_executions || 0,
    failed_runs: data?.failed_executions || 0,
    avg_time_ms: data?.avg_execution_time_ms || 0,
    total_cost: parseFloat(data?.total_cost_usd || 0),
    success_rate: data?.total_executions
      ? ((data.successful_executions / data.total_executions) * 100).toFixed(1)
      : 0,
  };
}
