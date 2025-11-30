const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Get all agents
async function getAgents(req, res) {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Get single agent by ID
async function getAgent(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Create new agent
async function createAgent(req, res) {
  try {
    const agentData = req.body;

    const { data, error } = await supabase
      .from('agents')
      .insert([agentData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Update agent
async function updateAgent(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Delete agent
async function deleteAgent(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Execute agent (placeholder for AI integration)
async function executeAgent(req, res) {
  try {
    const { id } = req.params;
    const { input } = req.body;

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentError) throw agentError;

    // Create execution record
    const executionStart = Date.now();
    
    const { data: execution, error: execError } = await supabase
      .from('agent_executions')
      .insert([{
        agent_id: id,
        status: 'running',
        input_data: input,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (execError) throw execError;

    // TODO: Actual AI execution will go here
    // For now, simulate execution
    const mockOutput = {
      message: `Agent "${agent.name}" executed successfully`,
      input: input,
      timestamp: new Date().toISOString()
    };

    const executionTime = Date.now() - executionStart;

    // Update execution record
    await supabase
      .from('agent_executions')
      .update({
        status: 'completed',
        output_data: mockOutput,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', execution.id);

    // Update agent stats
    await supabase
      .from('agents')
      .update({
        total_executions: agent.total_executions + 1,
        successful_executions: agent.successful_executions + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({
      success: true,
      execution_id: execution.id,
      output: mockOutput
    });

  } catch (error) {
    console.error('Error executing agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Get agent executions
async function getAgentExecutions(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('agent_executions')
      .select('*')
      .eq('agent_id', id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  executeAgent,
  getAgentExecutions
};
