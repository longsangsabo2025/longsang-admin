/**
 * 🤖 Multi-Agent Orchestrator Service (Enhanced)
 *
 * Enhanced orchestrator with intelligent agent selection,
 * result aggregation, and agent communication patterns
 *
 * @author LongSang Admin
 * @version 2.0.0
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const contextRetrieval = require('./context-retrieval');
const copilotPlanner = require('./copilot-planner');
const copilotExecutor = require('./copilot-executor');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Agent types and capabilities
 */
const AGENT_TYPES = {
  content_creator: {
    name: 'Content Creator',
    capabilities: ['generate_content', 'create_post', 'write_article', 'create_social_post'],
    description: 'Tạo nội dung, bài viết, post cho social media',
  },
  data_analyst: {
    name: 'Data Analyst',
    capabilities: ['analyze_data', 'generate_stats', 'analyze_keywords', 'performance_analysis'],
    description: 'Phân tích dữ liệu, thống kê, keywords',
  },
  seo_specialist: {
    name: 'SEO Specialist',
    capabilities: ['optimize_seo', 'keyword_research', 'seo_analysis', 'content_optimization'],
    description: 'Tối ưu SEO, nghiên cứu keywords',
  },
  workflow_automation: {
    name: 'Workflow Automation',
    capabilities: ['create_workflow', 'optimize_workflow', 'automate_task'],
    description: 'Tạo và tối ưu workflows',
  },
  research_agent: {
    name: 'Research Agent',
    capabilities: ['research_topic', 'gather_information', 'analyze_trends'],
    description: 'Nghiên cứu topics, gather information',
  },
};

/**
 * Intelligent agent selection using LLM
 * @param {string} command - Natural language command
 * @param {object} context - Context information
 * @returns {Promise<Array>} Selected agents with confidence scores
 */
async function selectAgents(command, context = {}) {
  try {
    // Build agent capabilities description
    const capabilitiesDescription = Object.entries(AGENT_TYPES)
      .map(([type, info]) => `- ${type}: ${info.description} (${info.capabilities.join(', ')})`)
      .join('\n');

    const systemPrompt = `Bạn là AI agent selector cho hệ thống LongSang Admin.

Nhiệm vụ: Phân tích command và chọn agents phù hợp nhất.

Available Agents:
${capabilitiesDescription}

Context:
${context.projectId ? `- Project ID: ${context.projectId}` : ''}
${context.availableAgents ? `- Available Agents: ${context.availableAgents.join(', ')}` : ''}

Nguyên tắc:
1. Chọn agents dựa trên capabilities, không chỉ keywords
2. Ưu tiên agents có thể làm việc parallel
3. Trả về confidence score (0-1) cho mỗi agent
4. Giải thích lý do chọn agent

Trả về JSON array với format:
[
  {
    "type": "agent_type",
    "confidence": 0.9,
    "reason": "Lý do chọn agent này",
    "role": "Vai trò cụ thể",
    "canParallel": true
  }
]`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Command: "${command}"` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = JSON.parse(response.choices[0].message.content);
    const selectedAgents = Array.isArray(content.agents) ? content.agents : [];

    // Verify agents exist and are available
    const verifiedAgents = await verifyAgents(selectedAgents, context);

    // Sort by confidence descending
    return verifiedAgents.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error selecting agents:', error);
    // Fallback to keyword-based selection
    return fallbackAgentSelection(command);
  }
}

/**
 * Verify agents exist and are available
 */
async function verifyAgents(selectedAgents, context = {}) {
  const verified = [];

  for (const agent of selectedAgents) {
    // Check if agent type is valid
    if (!AGENT_TYPES[agent.type]) {
      continue;
    }

    // Check if agent exists in database (if context has availableAgents)
    if (context.availableAgents && !context.availableAgents.includes(agent.type)) {
      continue;
    }

    // Check agent status in database
    try {
      const { data } = await supabase
        .from('ai_agents')
        .select('id, type, status')
        .eq('type', agent.type)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (data) {
        verified.push({
          ...agent,
          agentId: data.id,
          available: true,
        });
      } else {
        // Agent type exists but no active instance
        verified.push({
          ...agent,
          available: false,
          warning: `No active ${agent.type} agent found`,
        });
      }
    } catch (error) {
      // Assume agent is available if database check fails
      verified.push({
        ...agent,
        available: true,
      });
    }
  }

  return verified;
}

/**
 * Fallback keyword-based agent selection
 */
function fallbackAgentSelection(command) {
  const agents = [];
  const commandLower = command.toLowerCase();

  if (commandLower.includes('content') || commandLower.includes('bài') || commandLower.includes('post')) {
    agents.push({
      type: 'content_creator',
      confidence: 0.8,
      reason: 'Command requires content creation',
      role: 'Generate content',
      canParallel: true,
      available: true,
    });
  }

  if (commandLower.includes('seo') || commandLower.includes('keyword')) {
    agents.push({
      type: 'seo_specialist',
      confidence: 0.9,
      reason: 'Command requires SEO expertise',
      role: 'SEO optimization',
      canParallel: true,
      available: true,
    });
  }

  if (commandLower.includes('thống kê') || commandLower.includes('analytics') || commandLower.includes('stats')) {
    agents.push({
      type: 'data_analyst',
      confidence: 0.85,
      reason: 'Command requires data analysis',
      role: 'Analyze data',
      canParallel: true,
      available: true,
    });
  }

  if (commandLower.includes('workflow') || commandLower.includes('automation')) {
    agents.push({
      type: 'workflow_automation',
      confidence: 0.9,
      reason: 'Command requires workflow automation',
      role: 'Create/optimize workflow',
      canParallel: false,
      available: true,
    });
  }

  return agents;
}

/**
 * Create tasks with dependencies and parallelization
 * @param {Array} agents - Selected agents
 * @param {string} command - Original command
 * @param {object} context - Context information
 * @returns {Array} Task definitions
 */
function createAgentTasks(agents, command, context = {}) {
  const tasks = [];

  // Group agents by parallel capability
  const parallelGroup = agents.filter(a => a.canParallel !== false);
  const sequentialAgents = agents.filter(a => a.canParallel === false);

  // Create tasks for parallel agents
  if (parallelGroup.length > 0) {
    parallelGroup.forEach((agent, index) => {
      tasks.push({
        id: `task-parallel-${index}`,
        agent: agent.type,
        agentId: agent.agentId,
        role: agent.role || agent.reason,
        command: command,
        confidence: agent.confidence,
        canParallel: true,
        dependencies: [],
        status: 'pending',
        priority: agent.confidence > 0.8 ? 'high' : 'medium',
      });
    });
  }

  // Create tasks for sequential agents (after parallel)
  sequentialAgents.forEach((agent, index) => {
    tasks.push({
      id: `task-sequential-${index}`,
      agent: agent.type,
      agentId: agent.agentId,
      role: agent.role || agent.reason,
      command: command,
      confidence: agent.confidence,
      canParallel: false,
      dependencies: parallelGroup.length > 0 ? [`task-parallel-0`] : [], // Wait for first parallel task
      status: 'pending',
      priority: agent.confidence > 0.8 ? 'high' : 'medium',
    });
  });

  return tasks;
}

/**
 * Execute agent tasks with parallelization and communication
 * @param {Array} tasks - Task definitions
 * @param {object} options - Execution options
 * @returns {Promise<Array>} Task results
 */
async function executeAgentTasks(tasks, options = {}) {
  const { userId, projectId, onProgress } = options;
  const results = [];

  // Group tasks by parallel capability
  const parallelTasks = tasks.filter(t => t.canParallel);
  const sequentialTasks = tasks.filter(t => !t.canParallel);

  // Execute parallel tasks
  if (parallelTasks.length > 0) {
    const parallelResults = await Promise.allSettled(
      parallelTasks.map(task => executeAgentTask(task, { userId, projectId }))
    );

    parallelTasks.forEach((task, index) => {
      const result = parallelResults[index];
      const taskResult = {
        taskId: task.id,
        agent: task.agent,
        status: result.status === 'fulfilled' ? 'completed' : 'failed',
        result: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason?.message : null,
        completedAt: new Date(),
      };
      results.push(taskResult);

      if (onProgress) {
        onProgress({
          task: task.id,
          agent: task.agent,
          status: taskResult.status,
          progress: {
            completed: results.length,
            total: tasks.length,
          },
        });
      }
    });
  }

  // Execute sequential tasks
  for (const task of sequentialTasks) {
    // Wait for dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const depResults = task.dependencies.map(depId =>
        results.find(r => r.taskId === depId)
      );

      // Pass dependency results as context
      const depContext = depResults.reduce((acc, dep) => {
        if (dep && dep.result) {
          acc[dep.agent] = dep.result;
        }
        return acc;
      }, {});
    }

    const taskResult = await executeAgentTask(task, {
      userId,
      projectId,
      context: results, // Pass all previous results as context
    });

    results.push({
      taskId: task.id,
      agent: task.agent,
      status: taskResult.success ? 'completed' : 'failed',
      result: taskResult.result || null,
      error: taskResult.error || null,
      completedAt: new Date(),
    });

    if (onProgress) {
      onProgress({
        task: task.id,
        agent: task.agent,
        status: taskResult.success ? 'completed' : 'failed',
        progress: {
          completed: results.length,
          total: tasks.length,
        },
      });
    }
  }

  return results;
}

/**
 * Execute a single agent task
 * Uses AI Action Executor for intelligent execution
 */
async function executeAgentTask(task, options = {}) {
  try {
    const { userId, projectId, context = [] } = options;
    const aiActionExecutor = require('./ai-action-executor');

    console.log(`[Orchestrator] Executing task: ${task.agent} - "${task.command?.substring(0, 50)}..."`);

    // Map agent type to action
    const agentToAction = {
      content_creator: 'post_facebook',
      data_analyst: 'analyze_data',
      seo_specialist: 'analyze_seo',
      workflow_automation: 'create_workflow',
      research_agent: 'research',
    };

    // Build context from previous results
    const contextSummary = context
      .filter(r => r.result)
      .map(r => `${r.agent}: ${JSON.stringify(r.result).substring(0, 100)}`)
      .join('\n');

    // Detect action from command
    const { action, reasoning } = await aiActionExecutor.detectIntent(task.command);
    console.log(`[Orchestrator] Detected action: ${action}, reason: ${reasoning?.substring(0, 50)}...`);

    if (action && action !== 'chat') {
      // Execute real action through AI Action Executor
      const result = await aiActionExecutor.processWithActions(task.command, task.role || 'marketing');
      
      return {
        success: result.type === 'action_executed' || result.type === 'action',
        result: result,
        agentType: task.agent,
        action: action,
        executionTime: Date.now(),
      };
    }

    // Fallback: Try database agent if no action detected
    let agent;
    if (task.agentId) {
      const { data } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', task.agentId)
        .single();
      agent = data;
    }

    if (!agent) {
      const { data } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('type', task.agent)
        .eq('status', 'active')
        .limit(1)
        .single();
      agent = data;
    }

    if (!agent) {
      // No agent in DB - use AI directly
      console.log(`[Orchestrator] No DB agent, using direct AI for ${task.agent}`);
      
      const openaiResponse = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Bạn là ${AGENT_TYPES[task.agent]?.name || task.agent}.
${AGENT_TYPES[task.agent]?.description || ''}
Context: ${contextSummary}
Hãy thực hiện nhiệm vụ và trả lời bằng tiếng Việt.`,
          },
          { role: 'user', content: task.command },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      return {
        success: true,
        result: {
          message: openaiResponse.choices[0].message.content,
          agentType: task.agent,
        },
        agentType: task.agent,
        executionTime: Date.now(),
      };
    }

    // Execute agent via API
    const response = await fetch(`http://localhost:3001/api/agents/${agent.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: task.command,
        role: task.role,
        context: contextSummary,
        userId,
        projectId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      result: data.result || data,
      agentType: task.agent,
      executionTime: Date.now(),
    };
  } catch (error) {
    console.error(`Error executing agent task ${task.id}:`, error);
    return {
      success: false,
      error: error.message,
      agentType: task.agent,
    };
  }
}

/**
 * Aggregate results from multiple agents intelligently
 * @param {Array} results - Task results
 * @param {object} options - Aggregation options
 * @returns {object} Aggregated result
 */
async function aggregateResults(results, options = {}) {
  try {
    const successfulResults = results.filter(r => r.status === 'completed' && r.result);
    const failedResults = results.filter(r => r.status === 'failed');

    // Simple aggregation - combine all successful results
    let aggregated = {
      success: failedResults.length === 0,
      totalAgents: results.length,
      successfulAgents: successfulResults.length,
      failedAgents: failedResults.length,
      agentResults: results.map(r => ({
        agent: r.agent,
        status: r.status,
        result: r.result || null,
        error: r.error || null,
      })),
    };

    // Use LLM to synthesize if multiple successful results
    if (successfulResults.length > 1) {
      try {
        const synthesis = await synthesizeResults(successfulResults, options);
        aggregated.synthesis = synthesis;
        aggregated.summary = synthesis.summary;
      } catch (error) {
        console.warn('Error synthesizing results:', error);
        // Continue without synthesis
      }
    } else if (successfulResults.length === 1) {
      aggregated.summary = `Agent ${successfulResults[0].agent} completed successfully`;
      aggregated.finalResult = successfulResults[0].result;
    }

    return aggregated;
  } catch (error) {
    console.error('Error aggregating results:', error);
    throw error;
  }
}

/**
 * Synthesize multiple agent results using LLM
 */
async function synthesizeResults(results, options = {}) {
  const resultsSummary = results
    .map(r => `${r.agent}:\n${JSON.stringify(r.result, null, 2)}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Bạn là AI synthesis system. Tổng hợp kết quả từ nhiều agents thành một kết quả coherent và hữu ích. Trả về JSON format.',
      },
      {
        role: 'user',
        content: `Tổng hợp các kết quả sau và trả về JSON:\n\n${resultsSummary}\n\nTạo summary và final result dạng JSON.`,
      },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const content = JSON.parse(response.choices[0].message.content);
  return {
    summary: content.summary || 'Results synthesized',
    finalResult: content.finalResult || content,
    synthesized: true,
  };
}

/**
 * Main orchestration function
 * @param {string} command - Natural language command
 * @param {object} options - Orchestration options
 * @returns {Promise<object>} Orchestrated result
 */
async function orchestrate(command, options = {}) {
  try {
    const {
      userId,
      projectId,
      usePlanning = true,
      onProgress,
    } = options;

    // Step 1: Load context
    const context = await contextRetrieval.retrieveEnhancedContext(command, {
      projectId,
      maxResults: 5,
    });

    // Step 2: Select agents intelligently
    const selectedAgents = await selectAgents(command, {
      projectId,
      context: context.business,
    });

    if (selectedAgents.length === 0) {
      return {
        success: false,
        error: 'No suitable agents found for this command',
        suggestion: 'Try rephrasing your command or check available agents',
      };
    }

    // Step 3: Create execution plan if needed
    let plan = null;
    if (usePlanning && selectedAgents.length > 1) {
      // Create plan using copilot planner
      const parseResult = {
        success: true,
        toolCalls: selectedAgents.map(agent => ({
          function: agent.type,
          arguments: { command, role: agent.role },
        })),
      };

      plan = await copilotPlanner.createPlan(parseResult, {
        command,
        userId,
        projectId,
      });
    }

    // Step 4: Create agent tasks
    const tasks = createAgentTasks(selectedAgents, command, { projectId });

    // Step 5: Execute tasks
    const results = await executeAgentTasks(tasks, {
      userId,
      projectId,
      onProgress,
    });

    // Step 6: Aggregate results
    const aggregated = await aggregateResults(results, {
      command,
      projectId,
    });

    return {
      success: aggregated.success,
      command,
      selectedAgents: selectedAgents.map(a => ({
        type: a.type,
        confidence: a.confidence,
        reason: a.reason,
      })),
      plan: plan?.plan || null,
      results: aggregated,
      summary: aggregated.summary,
      metadata: {
        totalAgents: aggregated.totalAgents,
        successfulAgents: aggregated.successfulAgents,
        failedAgents: aggregated.failedAgents,
        orchestratedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error in orchestration:', error);
    throw error;
  }
}

module.exports = {
  orchestrate,
  selectAgents,
  createAgentTasks,
  executeAgentTasks,
  aggregateResults,
  synthesizeResults,
  AGENT_TYPES,
};

