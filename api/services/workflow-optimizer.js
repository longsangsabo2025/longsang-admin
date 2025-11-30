/**
 * ⚡ Workflow Optimizer Service (Enhanced)
 *
 * Analyzes and optimizes workflows with Copilot integration
 *
 * @author LongSang Admin
 * @version 2.0.0
 */

const workflowMetrics = require('./workflow-metrics');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze workflow and suggest optimizations
 * @param {string} workflowId - Workflow ID
 */
async function analyzeOptimizations(workflowId) {
  const performance = await workflowMetrics.analyzePerformance(workflowId);

  const optimizations = [];

  // Check for slow nodes
  performance.bottlenecks.forEach((bottleneck) => {
    if (bottleneck.averageTime > 5000) {
      optimizations.push({
        type: 'performance',
        nodeId: bottleneck.nodeId,
        issue: `Node ${bottleneck.nodeId} takes ${bottleneck.averageTime}ms on average`,
        suggestion: 'Consider caching results or parallelizing this step',
        impact: 'high',
        estimatedImprovement: `${Math.round(bottleneck.averageTime * 0.3)}ms faster`,
      });
    }
  });

  // Check for low success rate
  if (performance.successRate < 0.8) {
    optimizations.push({
      type: 'reliability',
      issue: `Success rate is ${(performance.successRate * 100).toFixed(1)}%`,
      suggestion: 'Add error handling and retry logic',
      impact: 'high',
      estimatedImprovement: '20-30% better success rate',
    });
  }

  // Check for high cost
  if (performance.averageCost > 0.01) {
    optimizations.push({
      type: 'cost',
      issue: `Average cost is $${performance.averageCost.toFixed(4)} per execution`,
      suggestion: 'Consider using cheaper models or caching expensive operations',
      impact: 'medium',
      estimatedImprovement: '30-50% cost reduction',
    });
  }

  return {
    workflowId,
    performance,
    optimizations,
    hasOptimizations: optimizations.length > 0,
  };
}

/**
 * Generate optimized workflow version
 * @param {object} workflow - Original workflow
 * @param {Array} optimizations - Suggested optimizations
 */
function generateOptimizedWorkflow(workflow, optimizations) {
  const optimized = JSON.parse(JSON.stringify(workflow)); // Deep clone

  optimizations.forEach((opt) => {
    if (opt.type === 'performance' && opt.nodeId) {
      // Add caching node before slow node
      const nodeIndex = optimized.nodes.findIndex((n) => n.id === opt.nodeId);
      if (nodeIndex > -1) {
        const cacheNode = {
          id: `cache-${opt.nodeId}`,
          name: 'Cache Check',
          type: 'n8n-nodes-base.if',
          typeVersion: 1,
          position: [
            optimized.nodes[nodeIndex].position[0] - 200,
            optimized.nodes[nodeIndex].position[1],
          ],
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
              },
              conditions: [
                {
                  id: 'cache-hit',
                  leftValue: '={{ $json.cached }}',
                  rightValue: true,
                  operator: {
                    type: 'boolean',
                    operation: 'equals',
                  },
                },
              ],
              combinator: 'and',
            },
            options: {},
          },
        };

        optimized.nodes.splice(nodeIndex, 0, cacheNode);
        // Update connections
        // TODO: Update connections properly
      }
    }
  });

  return optimized;
}

/**
 * Optimize workflow with AI suggestions
 * @param {object} workflow - Workflow to optimize
 * @param {object} options - Optimization options
 * @returns {Promise<object>} Optimized workflow
 */
async function optimizeWorkflow(workflow, options = {}) {
  try {
    const { projectId, context } = options;

    // Analyze workflow structure
    const analysis = analyzeWorkflowStructure(workflow);

    // Get AI suggestions
    const suggestions = await getAIOptimizationSuggestions(workflow, analysis, context);

    // Apply optimizations
    const optimized = applyOptimizations(workflow, suggestions);

    return optimized;
  } catch (error) {
    console.error('Error optimizing workflow:', error);
    return workflow; // Return original on error
  }
}

/**
 * Analyze workflow structure
 */
function analyzeWorkflowStructure(workflow) {
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || {};

  return {
    nodeCount: nodes.length,
    hasParallelPaths: checkParallelPaths(connections),
    hasErrorHandling: nodes.some(n => n.type?.includes('error') || n.type?.includes('catch')),
    expensiveNodes: nodes.filter(n => isExpensiveNode(n)),
    sequentialChains: findSequentialChains(connections),
  };
}

/**
 * Get AI optimization suggestions
 */
async function getAIOptimizationSuggestions(workflow, analysis, context) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Bạn là workflow optimization expert. Phân tích và đề xuất optimizations cụ thể.',
        },
        {
          role: 'user',
          content: `Workflow Analysis:
- Nodes: ${analysis.nodeCount}
- Has parallel paths: ${analysis.hasParallelPaths}
- Has error handling: ${analysis.hasErrorHandling}
- Expensive nodes: ${analysis.expensiveNodes.length}

Đề xuất optimizations cụ thể với:
- Type (performance, cost, reliability)
- Priority
- Description
- Impact estimate

Trả về JSON với suggestions array.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    return Array.isArray(content.suggestions) ? content.suggestions : [];
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return [];
  }
}

/**
 * Apply optimizations to workflow
 */
function applyOptimizations(workflow, suggestions) {
  const optimized = JSON.parse(JSON.stringify(workflow));

  // Apply high-priority optimizations
  const highPriority = suggestions.filter(s => s.priority === 'high');

  for (const suggestion of highPriority) {
    // Apply specific optimizations based on type
    if (suggestion.type === 'parallel') {
      optimized = addParallelExecution(optimized, suggestion);
    } else if (suggestion.type === 'cache') {
      optimized = addCaching(optimized, suggestion);
    } else if (suggestion.type === 'error_handling') {
      optimized = addErrorHandling(optimized, suggestion);
    }
  }

  return optimized;
}

/**
 * Helper functions
 */
function checkParallelPaths(connections) {
  for (const nodeConnections of Object.values(connections)) {
    if (nodeConnections.main && nodeConnections.main[0]?.length > 1) {
      return true;
    }
  }
  return false;
}

function isExpensiveNode(node) {
  const expensiveTypes = ['openAi', 'dalle', 'httpRequest'];
  return expensiveTypes.some(type => node.type?.includes(type));
}

function findSequentialChains(connections) {
  // Find long sequential chains that could be parallelized
  return [];
}

function addParallelExecution(workflow, suggestion) {
  // Implementation for adding parallel execution
  return workflow;
}

function addCaching(workflow, suggestion) {
  // Implementation for adding caching
  return workflow;
}

function addErrorHandling(workflow, suggestion) {
  // Implementation for adding error handling
  return workflow;
}

module.exports = {
  analyzeOptimizations,
  generateOptimizedWorkflow,
  optimizeWorkflow,
  analyzeWorkflowStructure,
};
