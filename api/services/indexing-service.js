/**
 * 📇 Indexing Service
 *
 * Indexes entities (projects, workflows, executions) into vector database
 * Handles batch indexing, update triggers, and indexing pipeline
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');
const embeddingService = require('./embedding-service');

const supabaseUrl = process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Index a single project
 * @param {string} projectId - Project UUID
 * @returns {Promise<object>} Indexing result
 */
async function indexProject(projectId) {
  try {
    // Load project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Generate and store embedding
    const embedding = await embeddingService.generateAndStoreEmbedding({
      entityType: 'project',
      entityId: project.id,
      entityName: project.name,
      entityDescription: project.description || '',
      projectId: project.id,
      metadata: {
        slug: project.slug,
        is_active: project.is_active,
        settings: project.settings,
      },
    });

    return {
      success: true,
      entityType: 'project',
      entityId: project.id,
      embedding: embedding,
    };
  } catch (error) {
    console.error(`Error indexing project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Index a workflow
 * @param {string} workflowId - Workflow UUID
 * @returns {Promise<object>} Indexing result
 */
async function indexWorkflow(workflowId) {
  try {
    // Load workflow
    const { data: workflow, error } = await supabase
      .from('project_workflows')
      .select('*, project:projects(id, name)')
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Build description from workflow metadata
    const description = workflow.description || '';
    const projectName = workflow.project?.name || '';

    // Generate and store embedding
    const embedding = await embeddingService.generateAndStoreEmbedding({
      entityType: 'workflow',
      entityId: workflow.id,
      entityName: workflow.name || workflow.id,
      entityDescription: `${description} ${projectName ? `Project: ${projectName}` : ''}`.trim(),
      projectId: workflow.project_id || null,
      metadata: {
        status: workflow.status,
        n8n_workflow_id: workflow.n8n_workflow_id,
        created_at: workflow.created_at,
      },
    });

    return {
      success: true,
      entityType: 'workflow',
      entityId: workflow.id,
      embedding: embedding,
    };
  } catch (error) {
    console.error(`Error indexing workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Index an execution (summarized)
 * @param {string} executionId - Execution UUID
 * @returns {Promise<object>} Indexing result
 */
async function indexExecution(executionId) {
  try {
    // Load execution with workflow relation to get project_id
    const { data: execution, error } = await supabase
      .from('workflow_executions')
      .select('*, workflow:project_workflows(id, name, project_id)')
      .eq('id', executionId)
      .single();

    if (error || !execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Build description from execution
    const description = `Execution of workflow ${execution.workflow?.name || execution.workflow_id}. Status: ${execution.status}. ${execution.error_message ? `Error: ${execution.error_message.substring(0, 100)}` : 'Success'}`;

    // Generate and store embedding
    const embedding = await embeddingService.generateAndStoreEmbedding({
      entityType: 'execution',
      entityId: execution.id,
      entityName: `Execution ${execution.id.substring(0, 8)}`,
      entityDescription: description,
      projectId: execution.project_id || execution.workflow?.project_id || null,
      metadata: {
        workflow_id: execution.workflow_id,
        status: execution.status,
        started_at: execution.started_at,
        execution_time_ms: execution.execution_time_ms,
      },
    });

    return {
      success: true,
      entityType: 'execution',
      entityId: execution.id,
      embedding: embedding,
    };
  } catch (error) {
    console.error(`Error indexing execution ${executionId}:`, error);
    throw error;
  }
}

/**
 * Index all projects
 * @param {object} options - Indexing options
 * @returns {Promise<object>} Batch indexing result
 */
async function indexAllProjects(options = {}) {
  try {
    const { limit = 100, offset = 0 } = options;

    // Load projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, description, slug, is_active, settings')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const results = [];
    const errors = [];

    for (const project of projects || []) {
      try {
        const result = await indexProject(project.id);
        results.push(result);
      } catch (error) {
        errors.push({ projectId: project.id, error: error.message });
      }
    }

    return {
      success: true,
      indexed: results.length,
      errors: errors.length,
      details: {
        successful: results,
        failed: errors,
      },
    };
  } catch (error) {
    console.error('Error in indexAllProjects:', error);
    throw error;
  }
}

/**
 * Index all workflows
 * @param {object} options - Indexing options
 * @returns {Promise<object>} Batch indexing result
 */
async function indexAllWorkflows(options = {}) {
  try {
    const { limit = 100, offset = 0 } = options;

    // Load workflows
    const { data: workflows, error } = await supabase
      .from('project_workflows')
      .select('id, name, description, status, project_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const results = [];
    const errors = [];

    for (const workflow of workflows || []) {
      try {
        const result = await indexWorkflow(workflow.id);
        results.push(result);
      } catch (error) {
        errors.push({ workflowId: workflow.id, error: error.message });
      }
    }

    return {
      success: true,
      indexed: results.length,
      errors: errors.length,
      details: {
        successful: results,
        failed: errors,
      },
    };
  } catch (error) {
    console.error('Error in indexAllWorkflows:', error);
    throw error;
  }
}

/**
 * Index recent executions (last N)
 * @param {object} options - Indexing options
 * @returns {Promise<object>} Batch indexing result
 */
async function indexRecentExecutions(options = {}) {
  try {
    const { limit = 50 } = options;

    // Load recent executions with workflow relation to get project_id
    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('id, workflow_id, status, error_message, started_at, execution_time_ms, workflow:project_workflows(project_id)')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const results = [];
    const errors = [];

    for (const execution of executions || []) {
      try {
        // Extract project_id from workflow relation if available
        const projectId = execution.workflow?.project_id || null;
        const result = await indexExecution(execution.id);
        results.push(result);
      } catch (error) {
        errors.push({ executionId: execution.id, error: error.message });
      }
    }

    return {
      success: true,
      indexed: results.length,
      errors: errors.length,
      details: {
        successful: results,
        failed: errors,
      },
    };
  } catch (error) {
    console.error('Error in indexRecentExecutions:', error);
    throw error;
  }
}

/**
 * Full indexing pipeline - indexes all entities
 * @param {object} options - Indexing options
 * @returns {Promise<object>} Full indexing result
 */
async function runFullIndexing(options = {}) {
  try {
    console.log('🚀 Starting full indexing pipeline...');

    const results = {
      projects: null,
      workflows: null,
      executions: null,
    };

    // Index projects
    console.log('📁 Indexing projects...');
    results.projects = await indexAllProjects(options);

    // Index workflows
    console.log('⚙️  Indexing workflows...');
    results.workflows = await indexAllWorkflows(options);

    // Index recent executions
    console.log('▶️  Indexing recent executions...');
    results.executions = await indexRecentExecutions({ limit: options.executionsLimit || 50 });

    const totalIndexed =
      results.projects.indexed +
      results.workflows.indexed +
      results.executions.indexed;

    console.log(`✅ Full indexing complete. Indexed ${totalIndexed} entities.`);

    return {
      success: true,
      totalIndexed,
      results,
    };
  } catch (error) {
    console.error('Error in runFullIndexing:', error);
    throw error;
  }
}

/**
 * Log indexing operation
 * @param {object} params - Log parameters
 * @returns {Promise<object>} Log entry
 */
async function logIndexingOperation({
  entityType,
  entityId,
  status,
  errorMessage = null,
  tokensUsed = 0,
}) {
  try {
    const { data, error } = await supabase
      .from('context_indexing_log')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        status: status,
        error_message: errorMessage,
        tokens_used: tokensUsed,
        completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error logging indexing operation:', error);
    // Don't throw - logging errors shouldn't break indexing
    return null;
  }
}

module.exports = {
  indexProject,
  indexWorkflow,
  indexExecution,
  indexAllProjects,
  indexAllWorkflows,
  indexRecentExecutions,
  runFullIndexing,
  logIndexingOperation,
};


