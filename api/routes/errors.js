/**
 * 🚨 ERROR COLLECTOR API
 * =======================
 * Nhận errors từ tất cả các apps và trigger GitHub auto-fix
 */

const express = require('express');
const router = express.Router();

// GitHub config
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = 'longsangsabo2025/longsang-admin';

// Store recent errors (in-memory, reset on restart)
const recentErrors = [];
const MAX_ERRORS = 100;

/**
 * POST /api/errors/report
 * Nhận error từ các apps
 */
router.post('/report', async (req, res) => {
  try {
    const { 
      error_title, 
      error_message, 
      file_path, 
      line_number, 
      project,
      stack_trace,
      user_agent,
      url 
    } = req.body;

    const errorRecord = {
      id: Date.now(),
      error_title: error_title || 'Unknown Error',
      error_message: error_message || 'No message',
      file_path: file_path || 'unknown',
      line_number: line_number || '0',
      project: project || 'unknown',
      stack_trace: stack_trace || '',
      user_agent: user_agent || req.headers['user-agent'],
      url: url || '',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Store error
    recentErrors.unshift(errorRecord);
    if (recentErrors.length > MAX_ERRORS) {
      recentErrors.pop();
    }

    console.log(`🚨 Error received from ${project}: ${error_title}`);

    // Trigger GitHub workflow if token available
    if (GITHUB_TOKEN) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              event_type: 'sentry-error',
              client_payload: {
                error_title: errorRecord.error_title,
                error_message: errorRecord.error_message,
                file_path: errorRecord.file_path,
                line_number: errorRecord.line_number,
                project: errorRecord.project
              }
            })
          }
        );

        if (response.ok || response.status === 204) {
          errorRecord.status = 'sent_to_github';
          console.log('✅ Triggered GitHub auto-fix workflow');
        } else {
          errorRecord.status = 'github_failed';
          console.log('⚠️ Failed to trigger GitHub:', response.status);
        }
      } catch (e) {
        errorRecord.status = 'github_error';
        console.error('GitHub webhook error:', e.message);
      }
    } else {
      errorRecord.status = 'no_token';
    }

    res.json({
      success: true,
      message: 'Error reported',
      error_id: errorRecord.id,
      status: errorRecord.status
    });

  } catch (error) {
    console.error('Error reporting failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/errors/list
 * Xem danh sách errors gần đây
 */
router.get('/list', (req, res) => {
  const { project, limit = 20 } = req.query;
  
  let errors = recentErrors;
  
  if (project) {
    errors = errors.filter(e => e.project === project);
  }
  
  res.json({
    success: true,
    total: errors.length,
    errors: errors.slice(0, parseInt(limit))
  });
});

/**
 * GET /api/errors/stats
 * Thống kê errors
 */
router.get('/stats', (req, res) => {
  const stats = {
    total: recentErrors.length,
    by_project: {},
    by_status: {},
    by_type: {},
    recent_24h: 0
  };

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  recentErrors.forEach(e => {
    // By project
    stats.by_project[e.project] = (stats.by_project[e.project] || 0) + 1;
    
    // By status
    stats.by_status[e.status] = (stats.by_status[e.status] || 0) + 1;
    
    // By type
    stats.by_type[e.error_title] = (stats.by_type[e.error_title] || 0) + 1;
    
    // Recent 24h
    if (now - new Date(e.timestamp).getTime() < day) {
      stats.recent_24h++;
    }
  });

  res.json({
    success: true,
    stats
  });
});

/**
 * POST /api/errors/test
 * Test error reporting
 */
router.post('/test', async (req, res) => {
  const testError = {
    error_title: 'TypeError: Test Error',
    error_message: 'This is a test error from longsang-admin',
    file_path: 'src/test/TestComponent.tsx',
    line_number: '42',
    project: 'longsang-admin-test'
  };

  // Forward to report endpoint
  req.body = testError;
  
  res.json({
    success: true,
    message: 'Test error sent',
    test_data: testError
  });
});

/**
 * DELETE /api/errors/clear
 * Clear all errors
 */
router.delete('/clear', (req, res) => {
  const count = recentErrors.length;
  recentErrors.length = 0;
  
  res.json({
    success: true,
    message: `Cleared ${count} errors`
  });
});

module.exports = router;
