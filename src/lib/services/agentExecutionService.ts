/**
 * AI Agent Execution Service
 * Integrates with existing AI service to execute agent tasks
 */

import { supabase } from '@/integrations/supabase/client';
import { generateWithAI } from '@/lib/automation/ai-service';

/**
 * Calculate cost for GPT-4o mini model
 * Input: $0.15 per 1M tokens, Output: $0.60 per 1M tokens
 * Simplified estimation: Average cost $0.375 per 1M tokens
 */
/**
 * Calculate cost from tokens (legacy, kept for compatibility)
 */
function _calculateCost(_promptTokens: number, _completionTokens: number): number {
  const COST_PER_1M_TOKENS = 0.375; // Average of input/output costs
  return (tokens / 1_000_000) * COST_PER_1M_TOKENS;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  type: string;
  status: string;
  description: string;
  capabilities: string[];
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
}

interface AgentExecution {
  id: string;
  agent_id: string;
  task: string;
  status: string;
  output?: string;
  error?: string;
  execution_time_ms?: number;
  cost_usd?: number;
}

export interface AgentExecutionInput {
  agentId: string;
  task: string;
  context?: Record<string, unknown>;
}

export interface AgentExecutionResult {
  executionId: string;
  success: boolean;
  output: string | Record<string, unknown>;
  executionTimeMs: number;
  costUsd: number;
  error?: string;
}

/**
 * Execute an AI agent task using existing AI service
 */
export async function executeAgent(input: AgentExecutionInput): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    // Get agent details from database
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', input.agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    const agentData = agent as unknown as Agent;

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('agent_executions')
      .insert({
        agent_id: input.agentId,
        status: 'running',
        input_data: { task: input.task, context: input.context },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (execError) {
      throw new Error('Failed to create execution record');
    }

    // Build system prompt based on agent configuration
    const systemPrompt = buildSystemPrompt(agent);

    // Call AI service (uses existing ai-service.ts)
    const aiResponse = await generateWithAI({
      prompt: input.task,
      config: {
        model: 'gpt-4o-mini', // Ultra cheap: $0.15/$0.60 per 1M tokens!
        temperature: 0.7,
        max_tokens: 2000,
        system_prompt: systemPrompt,
      },
    });

    const output = aiResponse.content;

    // Calculate cost (approximate based on tokens)
    const tokensUsed = aiResponse.tokens_used || 1500;
    const costUsd = calculateCostFromTokens(tokensUsed);

    const executionTimeMs = Date.now() - startTime;

    // Update execution record
    await supabase
      .from('agent_executions')
      .update({
        status: 'completed',
        output_data: {
          result: output,
          model: aiResponse.model,
          tokens: tokensUsed,
        },
        execution_time_ms: executionTimeMs,
        cost_usd: costUsd,
        completed_at: new Date().toISOString(),
      })
      .eq('id', (execution as unknown as AgentExecution).id);

    // Update agent stats (reuse agentData from above)
    await supabase
      .from('agents')
      .update({
        total_executions: agentData.total_executions + 1,
        successful_executions: agentData.successful_executions + 1,
        total_cost_usd: agentData.total_cost_usd + costUsd,
        last_used_at: new Date().toISOString(),
        avg_execution_time_ms: Math.round(
          (agentData.avg_execution_time_ms * agentData.total_executions + executionTimeMs) /
            (agentData.total_executions + 1)
        ),
      })
      .eq('id', input.agentId);

    return {
      executionId: (execution as unknown as AgentExecution).id,
      success: true,
      output,
      executionTimeMs,
      costUsd,
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Agent execution error:', error);

    // Try to update execution record with error
    try {
      await supabase
        .from('agent_executions')
        .update({
          status: 'failed',
          error_message: errorMessage,
          execution_time_ms: executionTimeMs,
          completed_at: new Date().toISOString(),
        })
        .eq('agent_id', input.agentId)
        .order('started_at', { ascending: false })
        .limit(1);

      // Update failed count
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', input.agentId)
        .single();

      if (agent) {
        const failedAgentData = agent as unknown as Agent;
        await supabase
          .from('agents')
          .update({
            total_executions: failedAgentData.total_executions + 1,
            failed_executions: failedAgentData.failed_executions + 1,
          })
          .eq('id', input.agentId);
      }
    } catch (updateError) {
      console.error('Failed to update execution error:', updateError);
    }

    return {
      executionId: '',
      success: false,
      output: '',
      executionTimeMs,
      costUsd: 0,
      error: errorMessage,
    };
  }
}

/**
 * Build system prompt based on agent configuration
 */
function buildSystemPrompt(agent: Agent): string {
  const capabilities = agent.capabilities || [];
  const description = agent.description || '';

  return `You are an AI agent named "${agent.name}".

Role: ${agent.role}
Description: ${description}

Your capabilities include:
${capabilities.map((c: string) => `- ${c}`).join('\n')}

Please assist the user with their task professionally and efficiently. Leverage your capabilities to provide the best possible solution.`;
}

/**
 * Calculate approximate cost for OpenAI API call
 * GPT-4o mini pricing (ULTRA CHEAP!):
 * - Input: $0.15 per 1M tokens = $0.00015 per 1K tokens
/**
 * Get agent execution history
 */
export async function getAgentExecutions(agentId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('agent_executions')
    .select('*')
    .eq('agent_id', agentId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching executions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all agents with their stats
 */
export async function getAllAgentsWithStats() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }

  return data || [];
}
