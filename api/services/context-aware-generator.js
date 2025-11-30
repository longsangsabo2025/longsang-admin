/**
 * 🎯 Context-Aware Workflow Generator
 *
 * Generates workflows with business context awareness
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const workflowGenerator = require('./workflow-generator');
const businessContext = require('./business-context');

/**
 * Generate context-aware workflow from command
 * @param {string} functionName - Function name
 * @param {object} functionArgs - Function arguments
 * @param {object} context - Business context (optional, will load if not provided)
 * @returns {Promise<object>} Context-aware workflow
 */
async function generateContextAware(functionName, functionArgs, context = null) {
  // Load context if not provided
  const businessContextData = context || (await businessContext.load());

  // Generate base workflow
  let workflow = await workflowGenerator.generateFromCommand(
    functionName,
    functionArgs,
    businessContextData
  );

  // Apply context-aware customizations
  workflow = await applyContextCustomizations(workflow, businessContextData, functionArgs);

  return workflow;
}

/**
 * Apply context-based customizations to workflow
 */
async function applyContextCustomizations(workflow, context, args) {
  // Customize based on domain
  if (context.domain === 'real-estate') {
    workflow = customizeForRealEstate(workflow, context, args);
  } else if (context.domain === 'marketing') {
    workflow = customizeForMarketing(workflow, context, args);
  }

  // Check for conflicts
  const conflicts = checkConflicts(workflow, context);
  if (conflicts.length > 0) {
    workflow.warnings = conflicts;
  }

  // Optimize timing based on context
  workflow = optimizeTiming(workflow, context);

  return workflow;
}

/**
 * Customize workflow for real estate domain
 */
function customizeForRealEstate(workflow, context, args) {
  // Add real estate specific nodes
  if (workflow.name.includes('post') || workflow.name.includes('Post')) {
    // Add project information to post
    const projectNode = workflow.nodes.find((n) => n.name === 'Generate Content');
    if (projectNode && context.currentProjects.length > 0) {
      const project = context.currentProjects[0];
      projectNode.parameters.messages.values[0].content += `\n\nDự án: ${project.name}\nMô tả: ${
        project.description || 'N/A'
      }`;
    }
  }

  return workflow;
}

/**
 * Customize workflow for marketing domain
 */
function customizeForMarketing(workflow, context, args) {
  // Add marketing specific optimizations
  if (workflow.name.includes('post') || workflow.name.includes('Post')) {
    // Add campaign tracking
    const trackingNode = {
      id: 'tracking-1',
      name: 'Track Campaign',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [1250, 300],
      parameters: {
        method: 'POST',
        url: 'http://localhost:3001/api/analytics/track',
        body: {
          event: 'post_created',
          source: 'ai_command',
        },
      },
    };

    workflow.nodes.push(trackingNode);

    // Update connections
    const lastNode = workflow.nodes[workflow.nodes.length - 2]; // Before tracking
    if (workflow.connections[lastNode.name]) {
      workflow.connections[lastNode.name].main[0].push({
        node: 'Track Campaign',
        type: 'main',
        index: 0,
      });
    }
  }

  return workflow;
}

/**
 * Check for conflicts with existing workflows
 */
function checkConflicts(workflow, context) {
  const warnings = [];

  // Check for too many posts
  if (workflow.name.includes('post') || workflow.name.includes('Post')) {
    const recentPosts = context.recentWorkflows.filter(
      (w) => w.name?.toLowerCase().includes('post') || w.name?.toLowerCase().includes('social')
    );

    if (recentPosts.length >= 5) {
      warnings.push('Đã có nhiều bài post gần đây. Cân nhắc spacing thời gian đăng.');
    }
  }

  // Check for duplicate workflows
  const similarWorkflows = context.recentWorkflows.filter((w) => w.name === workflow.name);

  if (similarWorkflows.length > 0) {
    warnings.push('Đã có workflow tương tự. Có thể bạn muốn sử dụng workflow hiện có?');
  }

  return warnings;
}

/**
 * Optimize workflow timing based on context
 */
function optimizeTiming(workflow, context) {
  // Add best posting times for social media
  if (workflow.name.includes('post') || workflow.name.includes('Post')) {
    // Best times: 9am, 2pm, 7pm
    const bestTimes = ['09:00', '14:00', '19:00'];
    const currentHour = new Date().getHours();

    let suggestedTime = bestTimes[0];
    for (const time of bestTimes) {
      const hour = parseInt(time.split(':')[0]);
      if (hour > currentHour) {
        suggestedTime = time;
        break;
      }
    }

    workflow.suggestedSchedule = suggestedTime;
    workflow.meta = {
      ...workflow.meta,
      bestPostingTime: suggestedTime,
      reason: 'Thời gian tốt nhất để đăng bài dựa trên engagement patterns',
    };
  }

  return workflow;
}

module.exports = {
  generateContextAware,
};
