/**
 * 🧠 Copilot Planner Service
 *
 * Plans execution steps from parsed commands
 * Handles step decomposition, dependency resolution, parallelization
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const contextRetrieval = require('./context-retrieval');
const businessContext = require('./business-context');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Plan execution steps from parsed command
 * @param {object} parsedCommand - Parsed command with tool calls
 * @param {object} options - Planning options
 * @returns {Promise<object>} Execution plan
 */
async function createPlan(parsedCommand, options = {}) {
  try {
    const {
      command,
      context,
      userId,
      projectId,
    } = options;

    // Step 1: Decompose into atomic steps
    const steps = await decomposeCommand(parsedCommand, {
      command,
      context,
      projectId,
    });

    // Step 2: Resolve dependencies
    const stepsWithDependencies = resolveDependencies(steps);

    // Step 3: Identify parallelizable steps
    const parallelizable = identifyParallelizableSteps(stepsWithDependencies);

    // Step 4: Optimize execution order
    const optimizedSteps = optimizeExecutionOrder(stepsWithDependencies, parallelizable);

    // Step 5: Validate plan
    const validation = validatePlan(optimizedSteps);

    return {
      success: validation.valid,
      plan: {
        steps: optimizedSteps,
        estimatedDuration: estimateDuration(optimizedSteps),
        parallelGroups: parallelizable.groups,
        dependencies: stepsWithDependencies.map(s => ({
          stepId: s.id,
          dependsOn: s.dependsOn || [],
        })),
        totalSteps: optimizedSteps.length,
        parallelSteps: parallelizable.count,
        sequentialSteps: optimizedSteps.length - parallelizable.count,
      },
      validation: validation,
      metadata: {
        command,
        createdAt: new Date().toISOString(),
        userId,
        projectId,
      },
    };
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
}

/**
 * Decompose command into atomic steps
 * @param {object} parsedCommand - Parsed command
 * @param {object} options - Options
 * @returns {Promise<Array>} Array of execution steps
 */
async function decomposeCommand(parsedCommand, options = {}) {
  try {
    const { command, context, projectId } = options;
    const toolCalls = parsedCommand.toolCalls || [];

    if (!toolCalls || toolCalls.length === 0) {
      return [];
    }

    // Load business context for better planning
    const businessContextData = await businessContext.load();

    // Use LLM to decompose into detailed steps
    const systemPrompt = buildDecompositionPrompt(businessContextData, projectId);

    const userPrompt = `Command: "${command}"

Parsed Functions:
${toolCalls.map((tc, i) => `${i + 1}. ${tc.function}(${JSON.stringify(tc.arguments || {})})`).join('\n')}

Phân tích command này và tạo danh sách các bước thực thi chi tiết. Mỗi bước phải:
- Atomic (chỉ làm 1 việc)
- Có ID duy nhất
- Mô tả rõ ràng
- Có ước tính thời gian
- Có thể có dependencies với bước khác

Trả về JSON array với format:
[
  {
    "id": "step-1",
    "name": "Load project context",
    "description": "Load thông tin project từ database",
    "function": "load_project",
    "arguments": {...},
    "estimatedTime": "~2s",
    "canParallel": false
  },
  ...
]`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more deterministic planning
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    const llmSteps = Array.isArray(content.steps) ? content.steps : [];

    // Merge LLM steps with parsed tool calls
    const steps = [];
    let stepIndex = 1;

    // Add initial context loading step if needed
    if (projectId || context) {
      steps.push({
        id: `step-${stepIndex++}`,
        name: 'Load Business Context',
        description: 'Load project and workflow context',
        function: 'load_context',
        arguments: { projectId, context },
        estimatedTime: '~1s',
        canParallel: false,
        priority: 'high',
      });
    }

    // Add decomposed steps
    for (const llmStep of llmSteps) {
      steps.push({
        id: llmStep.id || `step-${stepIndex++}`,
        name: llmStep.name,
        description: llmStep.description || llmStep.name,
        function: llmStep.function,
        arguments: llmStep.arguments || {},
        estimatedTime: llmStep.estimatedTime || '~5s',
        canParallel: llmStep.canParallel !== false,
        dependsOn: llmStep.dependsOn || [],
        priority: llmStep.priority || 'medium',
      });
    }

    // If LLM didn't provide steps, create from tool calls
    if (steps.length === 1 && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        steps.push({
          id: `step-${stepIndex++}`,
          name: formatFunctionName(toolCall.function),
          description: `Execute ${toolCall.function}`,
          function: toolCall.function,
          arguments: toolCall.arguments || {},
          estimatedTime: estimateStepTime(toolCall.function),
          canParallel: canFunctionParallel(toolCall.function),
          priority: 'medium',
        });
      }
    }

    return steps;
  } catch (error) {
    console.error('Error decomposing command:', error);
    // Fallback: create simple steps from tool calls
    return createFallbackSteps(parsedCommand);
  }
}

/**
 * Build decomposition prompt
 */
function buildDecompositionPrompt(businessContextData, projectId) {
  return `Bạn là AI planning system cho LongSang Admin platform.

Nhiệm vụ: Phân tích commands và tạo execution plan chi tiết.

Business Context:
- Domain: ${businessContextData.domain || 'longsang'}
- Projects: ${(businessContextData.currentProjects || []).map(p => p.name).join(', ') || 'None'}

${projectId ? `- Current Project: ${businessContextData.currentProjects?.find(p => p.id === projectId)?.name || projectId}` : ''}

Nguyên tắc:
1. Mỗi step phải atomic (chỉ làm 1 việc)
2. Steps có thể phụ thuộc nhau (dependencies)
3. Steps độc lập có thể chạy parallel
4. Ước tính thời gian realistic
5. Priority: high/medium/low

Trả về JSON với format:
{
  "steps": [...]
}`;
}

/**
 * Resolve dependencies between steps
 * @param {Array} steps - Steps array
 * @returns {Array} Steps with resolved dependencies
 */
function resolveDependencies(steps) {
  const stepMap = new Map(steps.map(s => [s.id, s]));

  // Validate dependencies exist
  return steps.map(step => {
    if (step.dependsOn && Array.isArray(step.dependsOn)) {
      const validDeps = step.dependsOn.filter(depId => stepMap.has(depId));

      return {
        ...step,
        dependsOn: validDeps,
        dependsOnCount: validDeps.length,
      };
    }

    return {
      ...step,
      dependsOn: [],
      dependsOnCount: 0,
    };
  });
}

/**
 * Identify steps that can run in parallel
 * @param {Array} steps - Steps with dependencies
 * @returns {object} Parallelization info
 */
function identifyParallelizableSteps(steps) {
  const groups = [];
  const stepStatus = new Map(steps.map(s => [s.id, { step: s, scheduled: false }]));

  // Group steps by dependency level
  let currentLevel = 0;
  const levelGroups = [];

  while (stepStatus.size > 0) {
    const readySteps = [];

    for (const [stepId, status] of stepStatus.entries()) {
      if (status.scheduled) continue;

      const step = status.step;
      const allDepsScheduled = (step.dependsOn || []).every(depId => {
        const depStatus = stepStatus.get(depId);
        return !depStatus || depStatus.scheduled;
      });

      if (allDepsScheduled) {
        readySteps.push(stepId);
      }
    }

    if (readySteps.length === 0) {
      // Circular dependency or error - break
      break;
    }

    // Group parallelizable steps
    const parallelGroup = readySteps
      .map(id => stepStatus.get(id).step)
      .filter(step => step.canParallel !== false);

    if (parallelGroup.length > 1) {
      levelGroups.push({
        level: currentLevel,
        steps: parallelGroup.map(s => s.id),
        canParallel: true,
      });
    } else if (parallelGroup.length === 1) {
      levelGroups.push({
        level: currentLevel,
        steps: [parallelGroup[0].id],
        canParallel: false,
      });
    }

    // Mark as scheduled
    readySteps.forEach(id => {
      stepStatus.get(id).scheduled = true;
    });

    currentLevel++;
  }

  return {
    groups: levelGroups,
    count: levelGroups.filter(g => g.canParallel).reduce((sum, g) => sum + g.steps.length, 0),
    levels: currentLevel,
  };
}

/**
 * Optimize execution order
 * @param {Array} steps - Steps
 * @param {object} parallelizable - Parallelization info
 * @returns {Array} Optimized steps
 */
function optimizeExecutionOrder(steps, parallelizable) {
  const stepMap = new Map(steps.map(s => [s.id, s]));
  const optimized = [];

  // Execute by level
  for (const group of parallelizable.groups) {
    for (const stepId of group.steps) {
      const step = stepMap.get(stepId);
      if (step) {
        optimized.push({
          ...step,
          executionLevel: group.level,
          canParallel: group.canParallel,
        });
      }
    }
  }

  return optimized;
}

/**
 * Validate execution plan
 * @param {Array} steps - Steps to validate
 * @returns {object} Validation result
 */
function validatePlan(steps) {
  const errors = [];
  const warnings = [];

  // Check for circular dependencies
  const visited = new Set();
  const recursionStack = new Set();

  function checkCircular(stepId, stepMap) {
    if (recursionStack.has(stepId)) {
      errors.push(`Circular dependency detected involving step: ${stepId}`);
      return true;
    }

    if (visited.has(stepId)) {
      return false;
    }

    visited.add(stepId);
    recursionStack.add(stepId);

    const step = stepMap.get(stepId);
    if (step && step.dependsOn) {
      for (const depId of step.dependsOn) {
        checkCircular(depId, stepMap);
      }
    }

    recursionStack.delete(stepId);
    return false;
  }

  const stepMap = new Map(steps.map(s => [s.id, s]));

  for (const step of steps) {
    checkCircular(step.id, stepMap);

    // Validate dependencies exist
    if (step.dependsOn) {
      for (const depId of step.dependsOn) {
        if (!stepMap.has(depId)) {
          warnings.push(`Step ${step.id} depends on non-existent step: ${depId}`);
        }
      }
    }

    // Validate function exists
    if (!step.function) {
      errors.push(`Step ${step.id} missing function`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stepCount: steps.length,
  };
}

/**
 * Estimate total duration
 * @param {Array} steps - Steps
 * @returns {string} Estimated duration
 */
function estimateDuration(steps) {
  if (steps.length === 0) return '~0s';

  // Simple estimation: sum sequential steps, max for parallel groups
  const levelGroups = {};

  for (const step of steps) {
    const level = step.executionLevel || 0;
    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(step);
  }

  let totalSeconds = 0;

  for (const level of Object.keys(levelGroups).sort((a, b) => a - b)) {
    const groupSteps = levelGroups[level];
    const parallel = groupSteps[0]?.canParallel;

    if (parallel) {
      // Parallel: take max time
      const maxTime = Math.max(...groupSteps.map(s => parseTime(s.estimatedTime)));
      totalSeconds += maxTime;
    } else {
      // Sequential: sum time
      const sumTime = groupSteps.reduce((sum, s) => sum + parseTime(s.estimatedTime), 0);
      totalSeconds += sumTime;
    }
  }

  return formatDuration(totalSeconds);
}

/**
 * Helper: Parse time string to seconds
 */
function parseTime(timeStr) {
  if (!timeStr) return 5; // Default 5 seconds

  const match = timeStr.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (timeStr.includes('min')) return num * 60;
    if (timeStr.includes('s')) return num;
    return num; // Default to seconds
  }

  return 5; // Default
}

/**
 * Helper: Format seconds to duration string
 */
function formatDuration(seconds) {
  if (seconds < 60) return `~${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`;
}

/**
 * Helper: Format function name
 */
function formatFunctionName(funcName) {
  return funcName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper: Estimate step time based on function
 */
function estimateStepTime(functionName) {
  const estimates = {
    load_context: '~1s',
    create_post: '~30s',
    backup_database: '~2m',
    generate_workflow: '~1m',
    execute_workflow: '~30s',
  };

  return estimates[functionName] || '~5s';
}

/**
 * Helper: Check if function can run in parallel
 */
function canFunctionParallel(functionName) {
  const parallelizable = [
    'generate_content',
    'create_post',
    'analyze_data',
  ];

  const nonParallel = [
    'backup_database',
    'load_context',
  ];

  if (nonParallel.includes(functionName)) return false;
  if (parallelizable.includes(functionName)) return true;
  return true; // Default to parallelizable
}

/**
 * Fallback: Create simple steps from parsed command
 */
function createFallbackSteps(parsedCommand) {
  const toolCalls = parsedCommand.toolCalls || [];
  const steps = [];

  toolCalls.forEach((tc, index) => {
    steps.push({
      id: `step-${index + 1}`,
      name: formatFunctionName(tc.function),
      description: `Execute ${tc.function}`,
      function: tc.function,
      arguments: tc.arguments || {},
      estimatedTime: estimateStepTime(tc.function),
      canParallel: canFunctionParallel(tc.function),
      dependsOn: index > 0 ? [`step-${index}`] : [],
      priority: 'medium',
    });
  });

  return steps;
}

module.exports = {
  createPlan,
  decomposeCommand,
  resolveDependencies,
  identifyParallelizableSteps,
  optimizeExecutionOrder,
  validatePlan,
  estimateDuration,
};

