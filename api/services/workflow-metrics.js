/**
 * 📊 Workflow Metrics Service
 *
 * Collects and analyzes workflow metrics
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Record workflow execution metrics
 * @param {string} workflowId - Workflow ID
 * @param {string} executionId - Execution ID
 * @param {object} metrics - Metrics data
 */
async function recordMetrics(workflowId, executionId, metrics) {
  try {
    const { error } = await supabase.from('workflow_metrics').insert({
      workflow_id: workflowId,
      execution_id: executionId,
      node_id: metrics.nodeId,
      execution_time_ms: metrics.executionTime,
      success: metrics.success,
      cost_usd: metrics.cost,
      metadata: metrics.metadata || {},
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording metrics:', error);
  }
}

/**
 * Get workflow metrics
 * @param {string} workflowId - Workflow ID
 * @param {object} options - Query options
 */
async function getMetrics(workflowId, options = {}) {
  const { limit = 100, startDate, endDate } = options;

  let query = supabase
    .from('workflow_metrics')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Analyze workflow performance
 * @param {string} workflowId - Workflow ID
 */
async function analyzePerformance(workflowId) {
  const metrics = await getMetrics(workflowId, { limit: 1000 });

  if (metrics.length === 0) {
    return {
      workflowId,
      totalExecutions: 0,
      averageExecutionTime: 0,
      successRate: 0,
      averageCost: 0,
      bottlenecks: [],
    };
  }

  const totalExecutions = metrics.length;
  const successful = metrics.filter((m) => m.success).length;
  const successRate = successful / totalExecutions;

  const executionTimes = metrics.filter((m) => m.execution_time_ms).map((m) => m.execution_time_ms);
  const averageExecutionTime =
    executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

  const costs = metrics.filter((m) => m.cost_usd).map((m) => parseFloat(m.cost_usd));
  const averageCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;

  // Identify bottlenecks (nodes with longest execution time)
  const nodeTimes = {};
  metrics.forEach((m) => {
    if (m.node_id && m.execution_time_ms) {
      if (!nodeTimes[m.node_id]) {
        nodeTimes[m.node_id] = [];
      }
      nodeTimes[m.node_id].push(m.execution_time_ms);
    }
  });

  const bottlenecks = Object.entries(nodeTimes)
    .map(([nodeId, times]) => ({
      nodeId,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      count: times.length,
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 5);

  return {
    workflowId,
    totalExecutions,
    successfulExecutions: successful,
    failedExecutions: totalExecutions - successful,
    successRate,
    averageExecutionTime: Math.round(averageExecutionTime),
    averageCost: parseFloat(averageCost.toFixed(4)),
    bottlenecks: bottlenecks.map((b) => ({
      ...b,
      averageTime: Math.round(b.averageTime),
      optimization: b.averageTime > 5000 ? 'Consider caching or parallelization' : null,
    })),
  };
}

module.exports = {
  recordMetrics,
  getMetrics,
  analyzePerformance,
};
