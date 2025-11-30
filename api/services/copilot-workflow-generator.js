/**
 * ⚙️ Copilot-Enhanced Workflow Generator
 *
 * Enhanced workflow generation with AI Copilot integration
 * Supports complex patterns, optimization suggestions, and template learning
 *
 * @author LongSang Admin
 * @version 2.0.0
 */

const OpenAI = require('openai');
const workflowGenerator = require('./workflow-generator');
const copilotPlanner = require('./copilot-planner');
const contextRetrieval = require('./context-retrieval');
const businessContext = require('./business-context');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Generate workflow from command with Copilot enhancement
 * @param {string} command - Natural language command
 * @param {object} options - Generation options
 * @returns {Promise<object>} Generated workflow
 */
async function generateFromCommand(command, options = {}) {
  try {
    const {
      userId,
      projectId,
      usePlanning = true,
      includeOptimization = true,
    } = options;

    // Step 1: Parse command and create plan
    const commandParser = require('./command-parser');
    const AVAILABLE_FUNCTIONS = require('../routes/ai-command').AVAILABLE_FUNCTIONS || [];

    const parseResult = await commandParser.parseCommand(command, AVAILABLE_FUNCTIONS, {
      projectId,
      userContext: { userId },
    });

    if (!parseResult.success || !parseResult.toolCalls?.length) {
      throw new Error('Failed to parse command');
    }

    // Step 2: Create execution plan
    let plan = null;
    if (usePlanning) {
      plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId,
        projectId,
      });
    }

    // Step 3: Load context for better generation
    const context = await contextRetrieval.retrieveEnhancedContext(command, {
      projectId,
      maxResults: 5,
    });

    const businessContextData = await businessContext.load();

    // Step 4: Generate workflow with AI assistance
    const workflow = await generateWorkflowWithAI({
      command,
      parseResult,
      plan,
      context,
      businessContext: businessContextData,
      projectId,
      userId,
    });

    // Step 5: Optimize workflow if requested
    if (includeOptimization && workflow) {
      const workflowOptimizer = require('./workflow-optimizer');
      const optimized = await workflowOptimizer.optimizeWorkflow(workflow, {
        projectId,
        context: businessContextData,
      });

      if (optimized) {
        workflow.optimization = optimized;
        workflow.nodes = optimized.nodes || workflow.nodes;
      }
    }

    return {
      success: true,
      workflow,
      plan,
      metadata: {
        command,
        projectId,
        userId,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating workflow with Copilot:', error);
    throw error;
  }
}

/**
 * Generate workflow using AI assistance
 * @param {object} params - Generation parameters
 * @returns {Promise<object>} Generated workflow
 */
async function generateWorkflowWithAI(params) {
  const {
    command,
    parseResult,
    plan,
    context,
    businessContext,
    projectId,
    userId,
  } = params;

  // Get first tool call (main function)
  const toolCall = parseResult.toolCalls[0];
  if (!toolCall) {
    throw new Error('No tool calls found');
  }

  // Use AI to generate complex workflow structure
  const systemPrompt = buildWorkflowGenerationPrompt(businessContext, projectId);

  const userPrompt = `Command: "${command}"

Function: ${toolCall.function}
Arguments: ${JSON.stringify(toolCall.arguments, null, 2)}

${plan ? `Execution Plan:
${plan.plan.steps.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n')}` : ''}

Context:
${context.semantic?.summary || 'No specific context'}

Tạo n8n workflow JSON structure chi tiết cho function này. Workflow phải:
1. Có structure đúng n8n format
2. Include các nodes cần thiết
3. Có connections hợp lý
4. Support error handling
5. Optimize cho performance

Trả về JSON với format:
{
  "name": "Workflow name",
  "nodes": [...],
  "connections": {...},
  "settings": {...},
  "description": "Workflow description"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);

    // Merge with existing workflow generator logic
    const baseWorkflow = await workflowGenerator.generateFromCommand(
      toolCall.function,
      toolCall.arguments,
      businessContext
    );

    // Enhance with AI-generated structure
    const enhancedWorkflow = {
      ...baseWorkflow,
      name: content.name || baseWorkflow.name,
      nodes: content.nodes || baseWorkflow.nodes,
      connections: content.connections || baseWorkflow.connections,
      settings: {
        ...baseWorkflow.settings,
        ...(content.settings || {}),
      },
      description: content.description || baseWorkflow.description,
      aiEnhanced: true,
      aiGeneratedAt: new Date().toISOString(),
    };

    return enhancedWorkflow;
  } catch (error) {
    console.error('Error generating workflow with AI:', error);
    // Fallback to base workflow generator
    return await workflowGenerator.generateFromCommand(
      toolCall.function,
      toolCall.arguments,
      businessContext
    );
  }
}

/**
 * Generate complex workflow pattern
 * @param {string} patternName - Pattern name (e.g., 'multi-platform-post', 'seo-campaign')
 * @param {object} parameters - Pattern parameters
 * @returns {Promise<object>} Generated workflow
 */
async function generateComplexPattern(patternName, parameters = {}) {
  try {
    const patterns = {
      'multi-platform-post': generateMultiPlatformPostPattern,
      'seo-campaign': generateSEOCampaignPattern,
      'content-pipeline': generateContentPipelinePattern,
      'analytics-dashboard': generateAnalyticsDashboardPattern,
    };

    const patternGenerator = patterns[patternName];
    if (!patternGenerator) {
      throw new Error(`Unknown pattern: ${patternName}`);
    }

    return await patternGenerator(parameters);
  } catch (error) {
    console.error(`Error generating pattern ${patternName}:`, error);
    throw error;
  }
}

/**
 * Generate multi-platform post pattern
 */
async function generateMultiPlatformPostPattern(parameters) {
  const { topic, platforms, schedule } = parameters;

  // Complex pattern: Generate content -> Optimize per platform -> Schedule -> Post
  return {
    name: `Multi-Platform Post: ${topic}`,
    nodes: [
      // Content generation
      // Platform-specific optimization
      // Scheduling
      // Posting
    ],
    connections: {},
    description: 'Complex workflow for multi-platform posting',
  };
}

/**
 * Generate SEO campaign pattern
 */
async function generateSEOCampaignPattern(parameters) {
  // Complex SEO workflow pattern
  return {
    name: 'SEO Campaign Workflow',
    nodes: [],
    connections: {},
    description: 'Complete SEO campaign workflow',
  };
}

/**
 * Generate content pipeline pattern
 */
async function generateContentPipelinePattern(parameters) {
  // Content creation pipeline
  return {
    name: 'Content Pipeline',
    nodes: [],
    connections: {},
    description: 'Content creation and publishing pipeline',
  };
}

/**
 * Generate analytics dashboard pattern
 */
async function generateAnalyticsDashboardPattern(parameters) {
  // Analytics collection and visualization
  return {
    name: 'Analytics Dashboard',
    nodes: [],
    connections: {},
    description: 'Analytics data collection and dashboard',
  };
}

/**
 * Suggest workflow optimizations
 * @param {object} workflow - Workflow to optimize
 * @param {object} context - Context information
 * @returns {Promise<Array>} Optimization suggestions
 */
async function suggestOptimizations(workflow, context = {}) {
  try {
    const workflowAnalysis = analyzeWorkflow(workflow);

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Bạn là workflow optimization expert. Phân tích workflows và đề xuất optimizations.',
        },
        {
          role: 'user',
          content: `Workflow Analysis:
- Nodes: ${workflowAnalysis.nodeCount}
- Connections: ${workflowAnalysis.connectionCount}
- Estimated execution time: ${workflowAnalysis.estimatedTime}
- Complex nodes: ${workflowAnalysis.complexNodes?.join(', ') || 'None'}

Đề xuất optimizations để:
1. Giảm execution time
2. Giảm costs
3. Tăng reliability
4. Cải thiện error handling

Trả về JSON array với format:
[
  {
    "type": "optimization_type",
    "priority": "high|medium|low",
    "description": "...",
    "impact": "...",
    "estimatedImprovement": "..."
  }
]`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    const suggestions = Array.isArray(content.suggestions) ? content.suggestions : [];

    return suggestions;
  } catch (error) {
    console.error('Error suggesting optimizations:', error);
    return [];
  }
}

/**
 * Analyze workflow structure
 */
function analyzeWorkflow(workflow) {
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || {};

  return {
    nodeCount: nodes.length,
    connectionCount: Object.keys(connections).length,
    estimatedTime: estimateWorkflowTime(nodes),
    complexNodes: nodes
      .filter(n => isComplexNode(n))
      .map(n => n.name),
    hasErrorHandling: nodes.some(n => n.type?.includes('error') || n.type?.includes('catch')),
    hasParallelExecution: hasParallelPaths(connections),
  };
}

/**
 * Check if node is complex
 */
function isComplexNode(node) {
  const complexTypes = ['function', 'code', 'httpRequest', 'openAi'];
  return complexTypes.some(type => node.type?.includes(type));
}

/**
 * Check if workflow has parallel paths
 */
function hasParallelPaths(connections) {
  // Simple check: if multiple nodes connect from one node
  for (const nodeConnections of Object.values(connections)) {
    if (nodeConnections.main && nodeConnections.main[0]?.length > 1) {
      return true;
    }
  }
  return false;
}

/**
 * Estimate workflow execution time
 */
function estimateWorkflowTime(nodes) {
  const nodeTimes = {
    webhook: 0,
    openAi: 30000, // 30s
    httpRequest: 5000, // 5s
    function: 2000, // 2s
    default: 1000, // 1s
  };

  let totalTime = 0;
  for (const node of nodes) {
    const nodeType = node.type || 'default';
    const time = Object.keys(nodeTimes).find(key => nodeType.includes(key))
      ? nodeTimes[Object.keys(nodeTimes).find(key => nodeType.includes(key))]
      : nodeTimes.default;
    totalTime += time;
  }

  return `${Math.round(totalTime / 1000)}s`;
}

/**
 * Build workflow generation prompt
 */
function buildWorkflowGenerationPrompt(businessContext, projectId) {
  return `Bạn là n8n workflow generation expert cho LongSang Admin platform.

Nhiệm vụ: Tạo n8n workflow JSON structure hoàn chỉnh từ commands.

Business Context:
- Domain: ${businessContext.domain || 'longsang'}
- Projects: ${(businessContext.currentProjects || []).map(p => p.name).join(', ') || 'None'}

Nguyên tắc:
1. Tạo nodes đúng format n8n
2. Connections phải hợp lý
3. Include error handling
4. Optimize cho performance
5. Support parallel execution khi có thể

Trả về JSON workflow structure.`;
}

/**
 * Learn from workflow templates
 * @param {Array} templates - Workflow templates
 * @returns {Promise<object>} Learned patterns
 */
async function learnFromTemplates(templates) {
  try {
    // Analyze templates to extract common patterns
    const patterns = {
      commonNodes: {},
      commonConnections: {},
      nodeSequences: [],
    };

    for (const template of templates) {
      // Extract node types
      (template.nodes || []).forEach(node => {
        const type = node.type || 'unknown';
        patterns.commonNodes[type] = (patterns.commonNodes[type] || 0) + 1;
      });

      // Extract connection patterns
      const connections = template.connections || {};
      Object.keys(connections).forEach(fromNode => {
        const toNodes = connections[fromNode]?.main?.[0] || [];
        toNodes.forEach(toNode => {
          const patternKey = `${fromNode}->${toNode.name}`;
          patterns.commonConnections[patternKey] = (patterns.commonConnections[patternKey] || 0) + 1;
        });
      });
    }

    return patterns;
  } catch (error) {
    console.error('Error learning from templates:', error);
    return {};
  }
}

module.exports = {
  generateFromCommand,
  generateWorkflowWithAI,
  generateComplexPattern,
  suggestOptimizations,
  analyzeWorkflow,
  learnFromTemplates,
};

