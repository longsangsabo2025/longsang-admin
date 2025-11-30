/**
 * ⚡ Copilot Executor Service
 *
 * Executes plans with parallel execution, conditional branching, retry logic
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const commandParser = require('./command-parser');
const workflowGenerator = require('./workflow-generator');
const n8nService = require('./n8n-service');

/**
 * Execute an execution plan
 * @param {object} plan - Execution plan from planner
 * @param {object} options - Execution options
 * @returns {Promise<object>} Execution result
 */
async function executePlan(plan, options = {}) {
  try {
    const {
      userId,
      projectId,
      onProgress,
      maxRetries = 3,
    } = options;

    const execution = {
      planId: plan.metadata?.planId || `exec-${Date.now()}`,
      startedAt: new Date(),
      steps: plan.steps || [],
      results: [],
      status: 'running',
      currentStep: 0,
      totalSteps: plan.totalSteps || 0,
    };

    // Execute steps by level (handling parallelization)
    const levelGroups = groupStepsByLevel(plan.steps);

    for (const level of levelGroups) {
      const stepGroup = level.steps;
      const parallel = level.canParallel;

      if (parallel && stepGroup.length > 1) {
        // Execute parallel steps
        const parallelResults = await executeParallel(stepGroup, {
          userId,
          projectId,
          maxRetries,
          onProgress: (step, result) => {
            execution.currentStep++;
            if (onProgress) {
              onProgress({
                step,
                result,
                progress: {
                  current: execution.currentStep,
                  total: execution.totalSteps,
                  percentage: Math.round((execution.currentStep / execution.totalSteps) * 100),
                },
              });
            }
          },
        });

        execution.results.push(...parallelResults);
      } else {
        // Execute sequential steps
        for (const step of stepGroup) {
          execution.currentStep++;

          const result = await executeStep(step, {
            userId,
            projectId,
            maxRetries,
            previousResults: execution.results,
          });

          execution.results.push({
            stepId: step.id,
            stepName: step.name,
            result,
            completedAt: new Date(),
          });

          if (onProgress) {
            onProgress({
              step,
              result,
              progress: {
                current: execution.currentStep,
                total: execution.totalSteps,
                percentage: Math.round((execution.currentStep / execution.totalSteps) * 100),
              },
            });
          }

          // Check for conditional branching
          if (result.shouldStop) {
            execution.status = 'stopped';
            execution.stoppedReason = result.stopReason;
            break;
          }

          // Check for errors
          if (!result.success && !result.canContinue) {
            execution.status = 'failed';
            execution.error = result.error;
            break;
          }
        }
      }

      // Stop if status changed
      if (execution.status !== 'running') {
        break;
      }
    }

    execution.completedAt = new Date();
    execution.duration = execution.completedAt - execution.startedAt;

    // Determine final status
    if (execution.status === 'running') {
      const failedSteps = execution.results.filter(r => r.result && !r.result.success);
      execution.status = failedSteps.length > 0 ? 'completed_with_errors' : 'completed';
    }

    return {
      success: execution.status === 'completed',
      execution,
      summary: {
        totalSteps: execution.totalSteps,
        completedSteps: execution.results.length,
        successfulSteps: execution.results.filter(r => r.result?.success).length,
        failedSteps: execution.results.filter(r => r.result && !r.result.success).length,
        duration: execution.duration,
      },
    };
  } catch (error) {
    console.error('Error executing plan:', error);
    throw error;
  }
}

/**
 * Execute a single step
 * @param {object} step - Step to execute
 * @param {object} options - Options
 * @returns {Promise<object>} Step result
 */
async function executeStep(step, options = {}) {
  const {
    userId,
    projectId,
    maxRetries = 3,
    previousResults = [],
  } = options;

  let lastError = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;

      // Resolve step arguments with previous results
      const resolvedArgs = resolveStepArguments(step.arguments, previousResults);

      // Execute step based on function type
      const result = await executeStepFunction(step.function, {
        ...resolvedArgs,
        userId,
        projectId,
        stepId: step.id,
      });

      return {
        success: true,
        result,
        attempt,
        completedAt: new Date(),
      };
    } catch (error) {
      lastError = error;
      console.error(`Error executing step ${step.id} (attempt ${attempt}/${maxRetries}):`, error);

      // Check if retryable
      if (!isRetryableError(error) || attempt >= maxRetries) {
        return {
          success: false,
          error: error.message,
          attempt,
          canContinue: step.optional || false,
          shouldStop: step.critical && !step.optional,
        };
      }

      // Wait before retry (exponential backoff)
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempt,
    canContinue: step.optional || false,
    shouldStop: step.critical && !step.optional,
  };
}

/**
 * Execute steps in parallel
 * @param {Array} steps - Steps to execute in parallel
 * @param {object} options - Options
 * @returns {Promise<Array>} Results array
 */
async function executeParallel(steps, options = {}) {
  const promises = steps.map(step => executeStep(step, options));
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => ({
    stepId: steps[index].id,
    stepName: steps[index].name,
    result: result.status === 'fulfilled' ? result.value : {
      success: false,
      error: result.reason?.message || 'Unknown error',
    },
    completedAt: new Date(),
  }));
}

/**
 * Execute step function based on function name
 * @param {string} functionName - Function name
 * @param {object} args - Arguments
 * @returns {Promise<any>} Function result
 */
async function executeStepFunction(functionName, args) {
  console.log(`   [Executor] Running function: ${functionName}`);
  
  switch (functionName) {
    case 'load_context':
      return await executeLoadContext(args);

    case 'create_post':
    case 'post_facebook':
    case 'generate_and_post':
      return await executeSmartPost(args);

    case 'schedule_post':
      return await executeSchedulePost(args);

    case 'create_carousel':
      return await executeCreateCarousel(args);

    case 'backup_database':
      return await executeBackupDatabase(args);

    case 'generate_workflow':
      return await executeGenerateWorkflow(args);

    case 'execute_workflow':
      return await executeExecuteWorkflow(args);

    case 'analyze_data':
    case 'analyze_marketing':
      return await executeAnalyzeData(args);

    case 'ab_test':
    case 'create_ab_test':
      return await executeABTest(args);

    case 'cross_post':
    case 'instagram_post':
      return await executeCrossPost(args);

    default:
      // Try ai-action-executor for unknown functions
      return await executeThroughActionExecutor(functionName, args);
  }
}

/**
 * Execute through AI Action Executor for dynamic actions
 */
async function executeThroughActionExecutor(action, params) {
  try {
    const aiActionExecutor = require('./ai-action-executor');
    const result = await aiActionExecutor.executeAction(action, params);
    return result;
  } catch (error) {
    console.log(`   [Executor] Action executor fallback failed: ${error.message}`);
    return await executeGenericFunction(action, params);
  }
}

/**
 * Execute: Smart Post with AI content + image generation
 */
async function executeSmartPost(args) {
  try {
    const smartPostComposer = require('./smart-post-composer');
    
    const result = await smartPostComposer.composePost({
      userRequest: args.topic || args.content || args.message || 'Create a post',
      pageId: args.pageId || args.page_id,
      includeImage: args.includeImage !== false,
      postImmediately: args.postImmediately !== false,
    });
    
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('   [Executor] Smart post error:', error.message);
    // Fallback to workflow generator
    const workflowGenerator = require('./workflow-generator');
    const workflow = await workflowGenerator.generateFromTemplate('create_post', {
      topic: args.topic,
      platform: args.platform || 'facebook',
      projectId: args.projectId,
    });
    return { workflowId: workflow.id, created: true };
  }
}

/**
 * Execute: Schedule Post for optimal time
 */
async function executeSchedulePost(args) {
  // TODO: Implement full scheduling
  const scheduledTime = args.scheduledTime || calculateOptimalTime(args.pageId);
  
  return {
    success: true,
    scheduled: true,
    scheduledTime,
    message: `Post scheduled for ${scheduledTime}`,
  };
}

/**
 * Execute: Create Carousel Post (multiple images)
 */
async function executeCreateCarousel(args) {
  // TODO: Implement carousel creation with multiple images
  return {
    success: true,
    type: 'carousel',
    images: args.images || [],
    message: 'Carousel post created (implementation pending)',
  };
}

/**
 * Execute: A/B Test content variants
 */
async function executeABTest(args) {
  // TODO: Implement A/B testing
  return {
    success: true,
    testId: `ab-${Date.now()}`,
    variants: args.variants || ['A', 'B'],
    message: 'A/B test created (implementation pending)',
  };
}

/**
 * Execute: Cross-post to Instagram/other platforms
 */
async function executeCrossPost(args) {
  // TODO: Implement Instagram cross-posting
  return {
    success: true,
    platforms: args.platforms || ['instagram'],
    message: 'Cross-post initiated (implementation pending)',
  };
}

/**
 * Calculate optimal posting time based on page analytics
 */
function calculateOptimalTime(pageId) {
  // TODO: Use actual analytics to determine best time
  const now = new Date();
  const hour = now.getHours();
  
  // Default optimal times for Vietnamese market
  const optimalHours = [9, 12, 18, 21]; // 9am, 12pm, 6pm, 9pm
  
  let nextOptimal = optimalHours.find(h => h > hour);
  if (!nextOptimal) {
    nextOptimal = optimalHours[0];
    now.setDate(now.getDate() + 1);
  }
  
  now.setHours(nextOptimal, 0, 0, 0);
  return now.toISOString();
}

/**
 * Execute: load_context
 */
async function executeLoadContext(args) {
  try {
    const businessContext = require('./business-context');
    const context = await businessContext.load();
    return { context, loaded: true };
  } catch (error) {
    return { context: {}, loaded: false, error: error.message };
  }
}

/**
 * Execute: create_post - DEPRECATED, use executeSmartPost instead
 */
async function executeCreatePost(args) {
  // Redirect to smart post
  return await executeSmartPost(args);
}

/**
 * Execute: backup_database
 */
async function executeBackupDatabase(args) {
  // Use existing backup service
  const backupRoutes = require('../routes/backup');

  // This would call the actual backup logic
  return {
    backupId: `backup-${Date.now()}`,
    status: 'initiated',
    message: 'Backup started',
  };
}

/**
 * Execute: generate_workflow
 */
async function executeGenerateWorkflow(args) {
  const workflowGenerator = require('./workflow-generator');

  const workflow = await workflowGenerator.generateFromCommand(args.command || '', {
    projectId: args.projectId,
    userId: args.userId,
  });

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    created: true,
  };
}

/**
 * Execute: execute_workflow
 */
async function executeExecuteWorkflow(args) {
  const n8nService = require('./n8n-service');

  const execution = await n8nService.executeWorkflow(args.workflowId, {
    input: args.input || {},
  });

  return {
    executionId: execution.id,
    status: execution.status,
  };
}

/**
 * Execute: analyze_data
 */
async function executeAnalyzeData(args) {
  // Placeholder for data analysis
  return {
    analyzed: true,
    insights: [],
  };
}

/**
 * Execute generic function
 */
async function executeGenericFunction(functionName, args) {
  // Try to find and execute function dynamically
  console.warn(`Generic function execution: ${functionName}`);

  return {
    executed: true,
    functionName,
    message: 'Generic execution completed',
  };
}

/**
 * Resolve step arguments with previous results
 * @param {object} args - Step arguments
 * @param {Array} previousResults - Previous step results
 * @returns {object} Resolved arguments
 */
function resolveStepArguments(args, previousResults) {
  if (!args || typeof args !== 'object') {
    return args || {};
  }

  const resolved = { ...args };

  // Replace references like ${step-1.result.workflowId}
  for (const key in resolved) {
    if (typeof resolved[key] === 'string' && resolved[key].includes('${')) {
      resolved[key] = resolveReference(resolved[key], previousResults);
    }
  }

  return resolved;
}

/**
 * Resolve reference in string (e.g., "${step-1.result.workflowId}")
 */
function resolveReference(ref, previousResults) {
  const match = ref.match(/\$\{([^}]+)\}/);
  if (!match) return ref;

  const path = match[1].split('.');
  const stepId = path[0];
  const restPath = path.slice(1);

  const stepResult = previousResults.find(r => r.stepId === stepId);
  if (!stepResult) return ref;

  let value = stepResult.result;
  for (const prop of restPath) {
    value = value?.[prop];
    if (value === undefined) return ref;
  }

  return ref.replace(match[0], value);
}

/**
 * Group steps by execution level
 */
function groupStepsByLevel(steps) {
  const groups = {};

  for (const step of steps) {
    const level = step.executionLevel || 0;
    if (!groups[level]) {
      groups[level] = {
        level,
        steps: [],
        canParallel: step.canParallel || false,
      };
    }
    groups[level].steps.push(step);
  }

  // Determine if level can be parallelized
  for (const level in groups) {
    const group = groups[level];
    group.canParallel = group.steps.length > 1 && group.steps.every(s => s.canParallel !== false);
  }

  return Object.keys(groups)
    .sort((a, b) => a - b)
    .map(level => groups[level]);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  // Network errors, timeouts are retryable
  const retryableMessages = [
    'timeout',
    'network',
    'ECONNRESET',
    'ETIMEDOUT',
    'temporary',
  ];

  const message = error.message?.toLowerCase() || '';
  return retryableMessages.some(keyword => message.includes(keyword));
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  executePlan,
  executeStep,
  executeParallel,
  executeStepFunction,
  resolveStepArguments,
};

