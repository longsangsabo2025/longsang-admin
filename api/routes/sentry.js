/**
 * 🚨 SENTRY WEBHOOK ROUTES
 * 
 * Receives webhooks from Sentry and:
 * 1. Forwards to WebSocket Bridge
 * 2. Stores in database for history
 * 3. Triggers auto-fix if enabled
 * 
 * Setup in Sentry:
 * - Go to Settings > Integrations > Webhooks
 * - Add URL: https://your-ngrok-url/api/sentry/webhook
 * 
 * @author LongSang Admin
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getBridge } = require('../services/websocket-bridge');
const { getPollerStats } = require('../services/sentry-poller.js');

// Store recent errors in memory (last 100)
const recentErrors = [];
const MAX_ERRORS = 100;

// Sentry webhook secret (optional, for signature verification)
const SENTRY_WEBHOOK_SECRET = process.env.SENTRY_WEBHOOK_SECRET;

/**
 * Verify Sentry webhook signature
 */
function verifySignature(payload, signature) {
  if (!SENTRY_WEBHOOK_SECRET || !signature) {
    return true; // Skip verification if no secret configured
  }
  
  const hmac = crypto.createHmac('sha256', SENTRY_WEBHOOK_SECRET);
  hmac.update(payload, 'utf8');
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/sentry/webhook
 * Receive Sentry webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['sentry-hook-signature'];
    const rawBody = req.body.toString();
    
    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.error('[Sentry] ❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const webhookData = JSON.parse(rawBody);
    const resourceType = req.headers['sentry-hook-resource'];
    
    console.log(`[Sentry] 📨 Webhook received: ${resourceType}`);
    
    // Process based on resource type
    let processedError = null;
    
    switch (resourceType) {
      case 'event_alert':
      case 'issue':
      case 'error':
        processedError = processErrorWebhook(webhookData);
        break;
        
      case 'metric_alert':
        processMetricAlert(webhookData);
        break;
        
      default:
        console.log(`[Sentry] ℹ️ Unhandled resource type: ${resourceType}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Webhook processed',
      errorId: processedError?.error?.id
    });
    
  } catch (error) {
    console.error('[Sentry] ❌ Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Process error webhook
 */
function processErrorWebhook(webhookData) {
  const event = webhookData.event || webhookData.data?.event || webhookData;
  
  const errorInfo = {
    id: event.event_id || event.id || `sentry_${Date.now()}`,
    title: event.title || event.message,
    message: event.message || event.metadata?.value,
    level: event.level || 'error',
    platform: event.platform,
    culprit: event.culprit || event.metadata?.filename,
    url: webhookData.url,
    project: webhookData.project?.name || event.project,
    environment: event.environment || 'production',
    user: event.user,
    tags: event.tags,
    timestamp: event.timestamp || new Date().toISOString(),
    stacktrace: extractStacktrace(event),
    breadcrumbs: event.breadcrumbs?.slice(-10), // Last 10 breadcrumbs
    context: {
      browser: event.contexts?.browser,
      os: event.contexts?.os,
      device: event.contexts?.device,
      extra: event.extra
    }
  };
  
  // Store in recent errors
  recentErrors.unshift({
    ...errorInfo,
    receivedAt: new Date().toISOString()
  });
  
  // Trim to max
  if (recentErrors.length > MAX_ERRORS) {
    recentErrors.pop();
  }
  
  // Forward to WebSocket Bridge
  const bridge = getBridge();
  if (bridge) {
    bridge.handleSentryWebhook({
      event: errorInfo,
      url: webhookData.url,
      project: webhookData.project
    });
  }
  
  console.log(`[Sentry] 🚨 Error processed: ${errorInfo.title}`);
  console.log(`[Sentry] 📍 Location: ${errorInfo.culprit}`);
  console.log(`[Sentry] 🌍 Environment: ${errorInfo.environment}`);
  
  return { error: errorInfo };
}

/**
 * Extract stacktrace from event
 */
function extractStacktrace(event) {
  const exception = event.exception?.values?.[0];
  if (!exception) return null;
  
  const frames = exception.stacktrace?.frames;
  if (!frames) return null;
  
  // Return last 10 frames (most relevant)
  return frames.slice(-10).map(frame => ({
    filename: frame.filename,
    function: frame.function,
    lineno: frame.lineno,
    colno: frame.colno,
    context_line: frame.context_line,
    pre_context: frame.pre_context?.slice(-2),
    post_context: frame.post_context?.slice(0, 2)
  }));
}

/**
 * Process metric alert
 */
function processMetricAlert(webhookData) {
  console.log(`[Sentry] 📊 Metric Alert: ${webhookData.metric_alert?.alert_rule?.name}`);
  
  const bridge = getBridge();
  if (bridge) {
    bridge._sendToType('webui', {
      type: 'metric_alert',
      alert: webhookData.metric_alert,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET /api/sentry/errors
 * Get recent errors
 */
router.get('/errors', (req, res) => {
  const { limit = 20, level, project } = req.query;
  
  let filtered = [...recentErrors];
  
  if (level) {
    filtered = filtered.filter(e => e.level === level);
  }
  
  if (project) {
    filtered = filtered.filter(e => e.project === project);
  }
  
  res.json({
    success: true,
    total: filtered.length,
    errors: filtered.slice(0, parseInt(limit))
  });
});

/**
 * GET /api/sentry/errors/:id
 * Get error details
 */
router.get('/errors/:id', (req, res) => {
  const error = recentErrors.find(e => e.id === req.params.id);
  
  if (!error) {
    return res.status(404).json({ error: 'Error not found' });
  }
  
  res.json({ success: true, error });
});

/**
 * POST /api/sentry/test
 * Send test error to WebSocket Bridge
 */
router.post('/test', (req, res) => {
  const testError = {
    event: {
      event_id: `test_${Date.now()}`,
      title: req.body.title || 'Test Error from API',
      message: req.body.message || 'This is a test error to verify the webhook integration',
      level: req.body.level || 'error',
      platform: 'javascript',
      culprit: 'test/webhook.js',
      environment: 'development',
      timestamp: new Date().toISOString()
    },
    project: { name: 'longsang-admin' },
    url: 'http://localhost:3001/api/sentry/test'
  };
  
  const result = processErrorWebhook(testError);
  
  res.json({
    success: true,
    message: 'Test error sent to WebSocket Bridge',
    error: result.error
  });
});

/**
 * POST /api/sentry/trigger-autofix
 * Trigger GitHub Actions auto-fix pipeline for an error
 */
router.post('/trigger-autofix', async (req, res) => {
  try {
    const { errorId, errorTitle, errorMessage, filePath, lineNumber } = req.body;
    
    // GitHub repository details
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'longsangsabo2025';
    const REPO_NAME = process.env.GITHUB_REPO_NAME || 'ainewbie-vision';
    
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ 
        success: false, 
        error: 'GITHUB_TOKEN not configured' 
      });
    }
    
    // Trigger repository_dispatch event
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'sentry-error',
          client_payload: {
            error_id: errorId || `sentry_${Date.now()}`,
            error_title: errorTitle || 'Unknown Error',
            error_message: errorMessage || 'Error details not available',
            file_path: filePath || 'unknown',
            line_number: lineNumber || '1',
            triggered_at: new Date().toISOString(),
            project: 'longsang-admin'
          }
        })
      }
    );
    
    if (response.ok || response.status === 204) {
      console.log(`[Sentry] ✅ Auto-fix pipeline triggered for: ${errorTitle}`);
      res.json({ 
        success: true, 
        message: 'Auto-fix pipeline triggered',
        details: {
          errorTitle,
          filePath,
          lineNumber
        }
      });
    } else {
      const errorText = await response.text();
      console.error(`[Sentry] ❌ Failed to trigger pipeline: ${errorText}`);
      res.status(response.status).json({ 
        success: false, 
        error: 'Failed to trigger GitHub Actions',
        details: errorText
      });
    }
    
  } catch (error) {
    console.error('[Sentry] ❌ Auto-fix trigger error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/sentry/stats
 * Get error statistics
 */
router.get('/stats', (req, res) => {
  const stats = {
    totalErrors: recentErrors.length,
    byLevel: {},
    byProject: {},
    byEnvironment: {},
    last24h: 0,
    lastHour: 0
  };
  
  const now = Date.now();
  const hourAgo = now - 3600000;
  const dayAgo = now - 86400000;
  
  for (const error of recentErrors) {
    // By level
    stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
    
    // By project
    stats.byProject[error.project || 'unknown'] = (stats.byProject[error.project || 'unknown'] || 0) + 1;
    
    // By environment
    stats.byEnvironment[error.environment || 'unknown'] = (stats.byEnvironment[error.environment || 'unknown'] || 0) + 1;
    
    // Time-based
    const errorTime = new Date(error.timestamp).getTime();
    if (errorTime > hourAgo) stats.lastHour++;
    if (errorTime > dayAgo) stats.last24h++;
  }
  
  res.json({ success: true, stats });
});

/**
 * GET /api/sentry/poller
 * Get Sentry poller status (no ngrok alternative)
 */
router.get('/poller', (req, res) => {
  const pollerStats = getPollerStats();
  res.json({ 
    success: true, 
    poller: pollerStats,
    message: 'Poller fetches errors directly from Sentry API - no ngrok needed!'
  });
});

module.exports = router;
