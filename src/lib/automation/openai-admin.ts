// ================================================
// OPENAI ADMIN API - Cost Tracking & Management
// ================================================

const OPENAI_ADMIN_KEY = import.meta.env.OPENAI_ADMIN_KEY;
const OPENAI_API_BASE = 'https://api.openai.com/v1';

interface OpenAIUsage {
  organization_id: string;
  aggregation_timestamp: number;
  n_requests: number;
  operation: string;
  snapshot_id: string;
  n_context_tokens_total: number;
  n_generated_tokens_total: number;
}

interface CostBreakdown {
  model: string;
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

// Model pricing (as of 2025)
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 0.03, completion: 0.06 }, // per 1K tokens
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-opus-4': { prompt: 0.015, completion: 0.075 },
  'claude-sonnet-4': { prompt: 0.003, completion: 0.015 },
  'claude-3.5-sonnet': { prompt: 0.003, completion: 0.015 },
};

/**
 * Calculate cost from token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4'];
  
  const promptCost = (promptTokens / 1000) * pricing.prompt;
  const completionCost = (completionTokens / 1000) * pricing.completion;
  
  return promptCost + completionCost;
}

/**
 * Get organization usage from OpenAI
 */
export async function getOrganizationUsage(
  startDate?: Date,
  endDate?: Date
): Promise<OpenAIUsage[]> {
  if (!OPENAI_ADMIN_KEY) {
    throw new Error('OPENAI_ADMIN_KEY not configured');
  }

  const params = new URLSearchParams();
  if (startDate) params.append('date', startDate.toISOString().split('T')[0]);
  if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

  const response = await fetch(
    `${OPENAI_API_BASE}/organization/usage?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get cost breakdown by model
 */
export async function getCostBreakdown(
  startDate: Date,
  endDate: Date
): Promise<CostBreakdown[]> {
  const usage = await getOrganizationUsage(startDate, endDate);
  
  const breakdown: Record<string, CostBreakdown> = {};

  for (const item of usage) {
    const model = item.operation.split('/')[0] || 'unknown';
    
    if (!breakdown[model]) {
      breakdown[model] = {
        model,
        requests: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost_usd: 0,
      };
    }

    breakdown[model].requests += item.n_requests;
    breakdown[model].prompt_tokens += item.n_context_tokens_total;
    breakdown[model].completion_tokens += item.n_generated_tokens_total;
    breakdown[model].total_tokens += 
      item.n_context_tokens_total + item.n_generated_tokens_total;
    
    breakdown[model].cost_usd += calculateCost(
      model,
      item.n_context_tokens_total,
      item.n_generated_tokens_total
    );
  }

  return Object.values(breakdown);
}

/**
 * Create a new API key for an agent
 */
export async function createAgentAPIKey(
  agentName: string,
  scopes: string[] = ['model.request']
): Promise<{ key: string; id: string }> {
  if (!OPENAI_ADMIN_KEY) {
    throw new Error('OPENAI_ADMIN_KEY not configured');
  }

  const response = await fetch(`${OPENAI_API_BASE}/organization/api_keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Agent: ${agentName}`,
      scopes,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create API key: ${error}`);
  }

  const data = await response.json();
  return {
    key: data.key.value,
    id: data.key.id,
  };
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(keyId: string): Promise<void> {
  if (!OPENAI_ADMIN_KEY) {
    throw new Error('OPENAI_ADMIN_KEY not configured');
  }

  const response = await fetch(
    `${OPENAI_API_BASE}/organization/api_keys/${keyId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to revoke API key: ${error}`);
  }
}

/**
 * List all API keys
 */
export async function listAPIKeys(): Promise<any[]> {
  if (!OPENAI_ADMIN_KEY) {
    throw new Error('OPENAI_ADMIN_KEY not configured');
  }

  const response = await fetch(`${OPENAI_API_BASE}/organization/api_keys`, {
    headers: {
      'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list API keys: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  startTime?: Date,
  endTime?: Date
): Promise<any[]> {
  if (!OPENAI_ADMIN_KEY) {
    throw new Error('OPENAI_ADMIN_KEY not configured');
  }

  const params = new URLSearchParams();
  if (startTime) params.append('effective_at[gt]', Math.floor(startTime.getTime() / 1000).toString());
  if (endTime) params.append('effective_at[lt]', Math.floor(endTime.getTime() / 1000).toString());

  const response = await fetch(
    `${OPENAI_API_BASE}/organization/audit_logs?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get audit logs: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}
