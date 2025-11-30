const express = require('express');
const router = express.Router();

// Dynamically import ES module
let executeAgentFunction;
(async () => {
  const module = await import('../execute-agent.js');
  executeAgentFunction = module.default || module.executeAgent;
})();

// Agent execution route
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const input = req.body || {};

    console.log(`📥 Received execution request for agent: ${id}`);

    if (!executeAgentFunction) {
      return res.status(503).json({
        success: false,
        error: 'Agent execution service is initializing, please try again',
      });
    }

    const result = await executeAgentFunction(id, input);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('❌ Error executing agent:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Agent status route
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      agentId: id,
      status: 'ready',
      lastExecution: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
