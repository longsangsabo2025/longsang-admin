/**
 * 📇 Context Indexing API Routes
 *
 * API endpoints for indexing entities into vector database
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const indexingService = require('../services/indexing-service');

/**
 * POST /api/context/index/project/:projectId
 * Index a specific project
 */
router.post('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await indexingService.indexProject(projectId);

    res.json({
      success: true,
      message: `Project ${projectId} indexed successfully`,
      result,
    });
  } catch (error) {
    console.error('Error indexing project:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index project',
    });
  }
});

/**
 * POST /api/context/index/workflow/:workflowId
 * Index a specific workflow
 */
router.post('/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;

    const result = await indexingService.indexWorkflow(workflowId);

    res.json({
      success: true,
      message: `Workflow ${workflowId} indexed successfully`,
      result,
    });
  } catch (error) {
    console.error('Error indexing workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index workflow',
    });
  }
});

/**
 * POST /api/context/index/execution/:executionId
 * Index a specific execution
 */
router.post('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    const result = await indexingService.indexExecution(executionId);

    res.json({
      success: true,
      message: `Execution ${executionId} indexed successfully`,
      result,
    });
  } catch (error) {
    console.error('Error indexing execution:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index execution',
    });
  }
});

/**
 * POST /api/context/index/all
 * Run full indexing pipeline for all entities
 */
router.post('/all', async (req, res) => {
  try {
    const { limit, offset, executionsLimit } = req.body;

    const result = await indexingService.runFullIndexing({
      limit: limit || 100,
      offset: offset || 0,
      executionsLimit: executionsLimit || 50,
    });

    res.json({
      success: true,
      message: `Full indexing completed. Indexed ${result.totalIndexed} entities.`,
      result,
    });
  } catch (error) {
    console.error('Error in full indexing:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run full indexing',
    });
  }
});

/**
 * POST /api/context/index/projects
 * Index all projects
 */
router.post('/projects', async (req, res) => {
  try {
    const { limit, offset } = req.body;

    const result = await indexingService.indexAllProjects({
      limit: limit || 100,
      offset: offset || 0,
    });

    res.json({
      success: true,
      message: `Indexed ${result.indexed} projects`,
      result,
    });
  } catch (error) {
    console.error('Error indexing projects:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index projects',
    });
  }
});

/**
 * POST /api/context/index/workflows
 * Index all workflows
 */
router.post('/workflows', async (req, res) => {
  try {
    const { limit, offset } = req.body;

    const result = await indexingService.indexAllWorkflows({
      limit: limit || 100,
      offset: offset || 0,
    });

    res.json({
      success: true,
      message: `Indexed ${result.indexed} workflows`,
      result,
    });
  } catch (error) {
    console.error('Error indexing workflows:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index workflows',
    });
  }
});

/**
 * POST /api/context/index/executions
 * Index recent executions
 */
router.post('/executions', async (req, res) => {
  try {
    const { limit } = req.body;

    const result = await indexingService.indexRecentExecutions({
      limit: limit || 50,
    });

    res.json({
      success: true,
      message: `Indexed ${result.indexed} executions`,
      result,
    });
  } catch (error) {
    console.error('Error indexing executions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to index executions',
    });
  }
});

module.exports = router;


