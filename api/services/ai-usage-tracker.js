/**
 * 📊 AI Usage Tracker
 * 
 * Tracks all AI API calls, token usage, and costs.
 * Stores data in Supabase ai_usage table.
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Model pricing (per 1000 tokens)
const MODEL_PRICING = {
  // OpenAI Models
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'dall-e-3': { per_image: 0.04 },
  'dall-e-2': { per_image: 0.02 },
  
  // Anthropic Models
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
};

// In-memory aggregator for batch saving
let usageBuffer = [];
const BUFFER_FLUSH_INTERVAL = 30000; // 30 seconds
const BUFFER_MAX_SIZE = 20;

/**
 * Calculate cost estimate for API call
 */
function calculateCost(model, inputTokens = 0, outputTokens = 0, imageCount = 0) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
  
  if (pricing.per_image) {
    return imageCount * pricing.per_image;
  }
  
  const inputCost = (inputTokens / 1000) * (pricing.input || 0);
  const outputCost = (outputTokens / 1000) * (pricing.output || 0);
  
  return inputCost + outputCost;
}

/**
 * Estimate token count from text (rough estimate)
 */
function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimate: ~4 characters per token for English
  // Vietnamese might be slightly different
  return Math.ceil(text.length / 4);
}

/**
 * Track an AI API call
 */
async function trackUsage(options = {}) {
  const {
    service = 'openai', // 'openai', 'anthropic', 'dalle'
    model = 'gpt-4o-mini',
    actionType = 'unknown',
    inputTokens = 0,
    outputTokens = 0,
    inputText = '',
    outputText = '',
    imageCount = 0,
    pageId = null,
    success = true,
    errorMessage = null,
    metadata = {},
  } = options;

  // Calculate tokens if not provided
  const actualInputTokens = inputTokens || estimateTokens(inputText);
  const actualOutputTokens = outputTokens || estimateTokens(outputText);
  const totalTokens = actualInputTokens + actualOutputTokens;
  
  // Calculate cost
  const costEstimate = calculateCost(model, actualInputTokens, actualOutputTokens, imageCount);

  const usageRecord = {
    service,
    model,
    action_type: actionType,
    tokens_used: totalTokens,
    input_tokens: actualInputTokens,
    output_tokens: actualOutputTokens,
    cost_estimate: costEstimate,
    cost_usd: costEstimate,
    page_id: pageId,
    success,
    error_message: errorMessage,
    metadata: JSON.stringify(metadata),
    created_at: new Date().toISOString(),
  };

  // Add to buffer
  usageBuffer.push(usageRecord);

  // Flush if buffer is full
  if (usageBuffer.length >= BUFFER_MAX_SIZE) {
    await flushUsageBuffer();
  }

  console.log(`📊 AI Usage tracked: ${model} - ${actionType} - ${totalTokens} tokens - $${costEstimate.toFixed(6)}`);
  
  return {
    model,
    actionType,
    tokens: totalTokens,
    cost: costEstimate,
  };
}

/**
 * Flush usage buffer to database
 */
async function flushUsageBuffer() {
  if (usageBuffer.length === 0) return;

  const recordsToSave = [...usageBuffer];
  usageBuffer = [];

  try {
    const { error } = await supabase
      .from('ai_usage')
      .insert(recordsToSave);

    if (error) {
      console.error('Failed to save AI usage:', error);
      // Re-add to buffer on failure
      usageBuffer = [...recordsToSave, ...usageBuffer];
    } else {
      console.log(`✅ Flushed ${recordsToSave.length} AI usage records to database`);
    }
  } catch (error) {
    console.error('Error flushing usage buffer:', error);
    usageBuffer = [...recordsToSave, ...usageBuffer];
  }
}

/**
 * Get usage summary for a time period
 */
async function getUsageSummary(options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate = new Date(),
    groupBy = 'model', // 'model', 'action_type', 'day', 'page_id'
  } = options;

  try {
    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Aggregate data
    const summary = {
      totalCalls: data.length,
      totalTokens: data.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      totalCost: data.reduce((sum, r) => sum + (r.cost_estimate || 0), 0),
      byModel: {},
      byActionType: {},
      byDay: {},
      byPage: {},
    };

    data.forEach(record => {
      // By model
      if (!summary.byModel[record.model]) {
        summary.byModel[record.model] = { calls: 0, tokens: 0, cost: 0 };
      }
      summary.byModel[record.model].calls++;
      summary.byModel[record.model].tokens += record.tokens_used || 0;
      summary.byModel[record.model].cost += record.cost_estimate || 0;

      // By action type
      if (!summary.byActionType[record.action_type]) {
        summary.byActionType[record.action_type] = { calls: 0, tokens: 0, cost: 0 };
      }
      summary.byActionType[record.action_type].calls++;
      summary.byActionType[record.action_type].tokens += record.tokens_used || 0;
      summary.byActionType[record.action_type].cost += record.cost_estimate || 0;

      // By day
      const day = record.created_at.split('T')[0];
      if (!summary.byDay[day]) {
        summary.byDay[day] = { calls: 0, tokens: 0, cost: 0 };
      }
      summary.byDay[day].calls++;
      summary.byDay[day].tokens += record.tokens_used || 0;
      summary.byDay[day].cost += record.cost_estimate || 0;

      // By page
      if (record.page_id) {
        if (!summary.byPage[record.page_id]) {
          summary.byPage[record.page_id] = { calls: 0, tokens: 0, cost: 0 };
        }
        summary.byPage[record.page_id].calls++;
        summary.byPage[record.page_id].tokens += record.tokens_used || 0;
        summary.byPage[record.page_id].cost += record.cost_estimate || 0;
      }
    });

    return {
      success: true,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary,
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get monthly report
 */
async function getMonthlyReport(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return getUsageSummary({ startDate, endDate });
}

/**
 * Get cost projection based on current usage
 */
async function getCostProjection(daysToProject = 30) {
  // Get last 7 days usage
  const last7Days = await getUsageSummary({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  if (!last7Days.success) {
    return { success: false, error: last7Days.error };
  }

  const dailyAvgCost = last7Days.summary.totalCost / 7;
  const dailyAvgTokens = last7Days.summary.totalTokens / 7;
  const dailyAvgCalls = last7Days.summary.totalCalls / 7;

  return {
    success: true,
    currentUsage: {
      last7DaysCost: last7Days.summary.totalCost,
      last7DaysTokens: last7Days.summary.totalTokens,
      last7DaysCalls: last7Days.summary.totalCalls,
    },
    dailyAverage: {
      cost: dailyAvgCost,
      tokens: dailyAvgTokens,
      calls: dailyAvgCalls,
    },
    projection: {
      days: daysToProject,
      estimatedCost: dailyAvgCost * daysToProject,
      estimatedTokens: dailyAvgTokens * daysToProject,
      estimatedCalls: dailyAvgCalls * daysToProject,
    },
  };
}

/**
 * Create a wrapper for OpenAI that automatically tracks usage
 */
function createTrackedOpenAI(openaiClient, defaultPageId = null) {
  const originalCreate = openaiClient.chat.completions.create.bind(openaiClient.chat.completions);
  
  openaiClient.chat.completions.create = async function(params) {
    const startTime = Date.now();
    const result = await originalCreate(params);
    const duration = Date.now() - startTime;

    // Track usage
    await trackUsage({
      model: params.model || 'gpt-4o-mini',
      actionType: params.actionType || 'chat_completion',
      inputTokens: result.usage?.prompt_tokens,
      outputTokens: result.usage?.completion_tokens,
      pageId: params.pageId || defaultPageId,
      metadata: {
        duration,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
      },
    });

    return result;
  };

  // Wrap image generation
  if (openaiClient.images) {
    const originalGenerate = openaiClient.images.generate.bind(openaiClient.images);
    
    openaiClient.images.generate = async function(params) {
      const startTime = Date.now();
      const result = await originalGenerate(params);
      const duration = Date.now() - startTime;

      await trackUsage({
        model: params.model || 'dall-e-3',
        actionType: 'image_generation',
        imageCount: params.n || 1,
        pageId: params.pageId || defaultPageId,
        metadata: {
          duration,
          size: params.size,
          quality: params.quality,
          prompt: params.prompt?.substring(0, 100),
        },
      });

      return result;
    };
  }

  return openaiClient;
}

// Auto-flush buffer periodically
setInterval(flushUsageBuffer, BUFFER_FLUSH_INTERVAL);

// Flush on process exit
process.on('beforeExit', async () => {
  await flushUsageBuffer();
});

module.exports = {
  trackUsage,
  flushUsageBuffer,
  getUsageSummary,
  getMonthlyReport,
  getCostProjection,
  calculateCost,
  estimateTokens,
  createTrackedOpenAI,
  MODEL_PRICING,
};
