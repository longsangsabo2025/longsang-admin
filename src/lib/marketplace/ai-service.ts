/**
 * 🤖 AI Execution Service
 * Connect marketplace agents to real AI (OpenAI GPT-4o-mini)
 */

import OpenAI from 'openai';
import { MVPAgent } from '@/data/mvp-agents';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For client-side usage
});

// ============================================
// TYPES
// ============================================

export interface AIExecutionResult {
  success: boolean;
  output: any;
  execution_time_ms: number;
  tokens_used: number;
  cost_usd: number;
  error?: string;
}

// ============================================
// COST CALCULATION
// ============================================

/**
 * Calculate cost for GPT-4o-mini
 * Pricing: $0.150/1M input tokens, $0.600/1M output tokens
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.15;
  const outputCost = (outputTokens / 1_000_000) * 0.6;
  return Number((inputCost + outputCost).toFixed(4));
}

// ============================================
// EXECUTE AGENT WITH REAL AI
// ============================================

/**
 * Execute agent with OpenAI GPT-4o-mini
 */
export async function executeAgentWithAI(
  agent: MVPAgent,
  inputData: any
): Promise<AIExecutionResult> {
  const startTime = Date.now();

  try {
    // Format input based on agent type
    const userMessage = formatInputForAgent(agent, inputData);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: agent.system_prompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: agent.config.temperature,
      max_tokens: agent.config.max_tokens,
      response_format: { type: 'json_object' }, // Force JSON output
    });

    const executionTime = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '{}';

    // Parse output
    let output;
    try {
      output = JSON.parse(content);
    } catch {
      output = { result: content };
    }

    // Calculate cost
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    const cost = calculateCost(inputTokens, outputTokens);

    return {
      success: true,
      output,
      execution_time_ms: executionTime,
      tokens_used: totalTokens,
      cost_usd: cost,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      output: null,
      execution_time_ms: executionTime,
      tokens_used: 0,
      cost_usd: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// INPUT FORMATTING
// ============================================

/**
 * Format input data into prompt based on agent type
 */
function formatInputForAgent(agent: MVPAgent, inputData: any): string {
  // If input is already a string, use it
  if (typeof inputData === 'string') {
    return inputData;
  }

  // Format based on agent category
  switch (agent.category) {
    case 'sales':
      return formatSalesInput(inputData);

    case 'content':
      return formatContentInput(inputData);

    case 'marketing':
      return formatMarketingInput(inputData);

    case 'data':
      return formatDataInput(inputData);

    default:
      return JSON.stringify(inputData, null, 2);
  }
}

function formatSalesInput(data: any): string {
  if (data.name || data.email || data.company) {
    return `Analyze this lead:

Name: ${data.name || 'N/A'}
Email: ${data.email || 'N/A'}
Company: ${data.company || 'N/A'}
Position: ${data.position || 'N/A'}
Phone: ${data.phone || 'N/A'}
Message: ${data.message || 'N/A'}

Please provide:
1. Lead score (0-100)
2. Quality rating (COLD/WARM/HOT)
3. Qualification reason
4. Next action recommendation
5. Estimated deal size
6. Personalized follow-up email draft`;
  }

  return JSON.stringify(data, null, 2);
}

function formatContentInput(data: any): string {
  if (data.topic || data.primary_keyword) {
    return `Write a blog post with these requirements:

Topic: ${data.topic || 'N/A'}
Primary Keyword: ${data.primary_keyword || 'N/A'}
Secondary Keywords: ${data.secondary_keywords?.join(', ') || 'N/A'}
Target Audience: ${data.target_audience || 'General'}
Tone: ${data.tone || 'Professional'}
Word Count: ${data.word_count || 1500}

Please provide:
1. SEO-optimized title
2. Meta description (150-160 chars)
3. Full article content with H2/H3 structure
4. Internal linking suggestions
5. Image recommendations
6. Strong CTA`;
  }

  return JSON.stringify(data, null, 2);
}

function formatMarketingInput(data: any): string {
  if (data.topic || data.key_message) {
    return `Create social media posts:

Topic: ${data.topic || 'N/A'}
Key Message: ${data.key_message || 'N/A'}
Target Audience: ${data.target_audience || 'General'}
CTA: ${data.cta || 'N/A'}
Link: ${data.link || 'N/A'}
Brand Voice: ${data.brand_voice || 'Professional'}

Create optimized posts for:
1. LinkedIn (professional, 150-200 words)
2. Facebook (conversational, 100-150 words)
3. Twitter/X (concise, 200-250 chars)
4. Instagram (caption + hashtags)
5. TikTok (short video script)

Include hashtags and best posting times.`;
  }

  return JSON.stringify(data, null, 2);
}

function formatDataInput(data: any): string {
  if (data.data_source || data.questions) {
    return `Analyze this data:

Data Source: ${data.data_source || 'N/A'}
Columns: ${data.columns?.join(', ') || 'N/A'}
Questions: ${data.questions?.join('\n- ') || 'N/A'}
Report Type: ${data.report_type || 'Executive Summary'}

Please provide:
1. Executive summary (2-3 paragraphs)
2. Key insights (5-7 bullet points)
3. Trends and patterns
4. Anomalies or concerns
5. Actionable recommendations
6. Visualization suggestions`;
  }

  return JSON.stringify(data, null, 2);
}

// ============================================
// MOCK EXECUTION (Fallback)
// ============================================

/**
 * Mock execution for testing without API key
 */
export async function mockExecuteAgent(
  agent: MVPAgent,
  _inputData: any
): Promise<AIExecutionResult> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  return {
    success: true,
    output: JSON.parse(agent.output_example.value),
    execution_time_ms: 1200 + Math.floor(Math.random() * 800),
    tokens_used: 500 + Math.floor(Math.random() * 1000),
    cost_usd: agent.pricing.price,
  };
}

// ============================================
// EXECUTE WITH FALLBACK
// ============================================

/**
 * Execute agent - try real AI, fallback to mock
 */
export async function executeAgentSmart(
  agent: MVPAgent,
  inputData: any
): Promise<AIExecutionResult> {
  // Check if API key is available
  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  if (hasApiKey) {
    try {
      return await executeAgentWithAI(agent, inputData);
    } catch (error) {
      console.error('AI execution failed, using mock:', error);
      return await mockExecuteAgent(agent, inputData);
    }
  } else {
    console.warn('No OpenAI API key found, using mock execution');
    return await mockExecuteAgent(agent, inputData);
  }
}
