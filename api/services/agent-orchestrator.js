/**
 * 🤖 Agent Orchestrator Service
 *
 * Coordinates multiple agents to work together
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Identify required agents from command
 * @param {string} command - Natural language command
 * @returns {Promise<Array>} List of required agents
 */
async function identifyAgents(command) {
  const agents = [];

  // Simple keyword-based identification (can be enhanced with AI)
  if (command.includes('content') || command.includes('bài') || command.includes('post')) {
    agents.push({ type: 'content_creator', role: 'Generate content' });
  }

  if (command.includes('SEO') || command.includes('seo')) {
    agents.push({ type: 'content_creator', role: 'Generate SEO content' });
    agents.push({ type: 'data_analyst', role: 'Analyze keywords' });
  }

  if (command.includes('thống kê') || command.includes('analytics') || command.includes('stats')) {
    agents.push({ type: 'data_analyst', role: 'Analyze data' });
  }

  if (command.includes('research') || command.includes('nghiên cứu')) {
    agents.push({ type: 'research_agent', role: 'Research topic' });
  }

  return agents;
}

/**
 * Create tasks for agents
 * @param {Array} agents - List of agents
 * @param {string} command - Original command
 * @returns {Array} Tasks for each agent
 */
function createTasks(agents, command) {
  return agents.map((agent, index) => ({
    id: `task-${index + 1}`,
    agent: agent.type,
    role: agent.role,
    command: command,
    dependencies: index > 0 ? [`task-${index}`] : [], // Sequential for now
    status: 'pending',
  }));
}

/**
 * Execute agent tasks
 * @param {Array} tasks - List of tasks
 * @returns {Promise<Array>} Results from each agent
 */
async function executeTasks(tasks) {
  const results = [];

  for (const task of tasks) {
    try {
      // Wait for dependencies
      if (task.dependencies.length > 0) {
        const depResults = task.dependencies.map((depId) =>
          results.find((r) => r.taskId === depId)
        );
        // Use dependency results in task
      }

      // Execute agent
      const result = await executeAgent(task);
      results.push({
        taskId: task.id,
        agent: task.agent,
        status: 'completed',
        result: result,
      });
    } catch (error) {
      results.push({
        taskId: task.id,
        agent: task.agent,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Execute a single agent
 */
async function executeAgent(task) {
  // Get agent from database
  const { data: agent } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('type', task.agent)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!agent) {
    throw new Error(`Agent ${task.agent} not found or inactive`);
  }

  // Execute via API
  const response = await fetch(`http://localhost:3001/api/agents/${agent.id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: task.command,
      role: task.role,
    }),
  });

  const data = await response.json();
  return data;
}

/**
 * Coordinate results from multiple agents
 * @param {Array} results - Results from agents
 * @returns {object} Coordinated result
 */
function coordinateResults(results) {
  const successful = results.filter((r) => r.status === 'completed');
  const failed = results.filter((r) => r.status === 'failed');

  return {
    success: failed.length === 0,
    totalAgents: results.length,
    successfulAgents: successful.length,
    failedAgents: failed.length,
    results: results.map((r) => ({
      agent: r.agent,
      status: r.status,
      result: r.result || r.error,
    })),
    summary: `Executed ${successful.length}/${results.length} agents successfully`,
  };
}

/**
 * Orchestrate multi-agent execution
 * @param {string} command - Natural language command
 * @returns {Promise<object>} Orchestrated result
 */
async function orchestrate(command) {
  // Step 1: Identify agents
  const agents = await identifyAgents(command);

  if (agents.length === 0) {
    return {
      success: false,
      error: 'No agents identified for this command',
    };
  }

  // Step 2: Create tasks
  const tasks = createTasks(agents, command);

  // Step 3: Execute tasks
  const results = await executeTasks(tasks);

  // Step 4: Coordinate results
  const coordinated = coordinateResults(results);

  return coordinated;
}

module.exports = {
  orchestrate,
  identifyAgents,
  createTasks,
  executeTasks,
  coordinateResults,
};
