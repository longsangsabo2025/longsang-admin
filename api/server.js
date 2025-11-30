const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ============================================
// 🛡️ GLOBAL ERROR HANDLERS - Keep Server Alive
// ============================================
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - keep server running
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

const app = express();
// Chuẩn hóa: API_PORT từ .env, fallback 3001 - Ensure PORT is a number
const PORT = parseInt(process.env.API_PORT || process.env.PORT || '3001', 10);

// Rate limiting middleware
const {
  apiLimiter,
  strictLimiter,
  aiLimiter,
  documentLimiter,
} = require('./middleware/rateLimiter');

// Request metrics middleware
const requestMetricsMiddleware = require('./middleware/requestMetrics');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply request metrics to all API routes (before rate limiting)
app.use('/api/', requestMetricsMiddleware);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
const googleDriveRoutes = require('./google-drive');
const googleAnalyticsRoutes = require('./routes/google/analytics');
const googleCalendarRoutes = require('./routes/google/calendar');
const googleGmailRoutes = require('./routes/google/gmail');
const googleMapsRoutes = require('./routes/google/maps');
const googleIndexingRoutes = require('./routes/google/indexing');
const googleSheetsRoutes = require('./routes/google/sheets');
const credentialsRoutes = require('./routes/credentials');
// const stripeRoutes = require('./routes/stripe'); // Temporarily disabled - missing API key
const emailRoutes = require('./routes/email');
const vnpayRoutes = require('./routes/vnpay');
const agentsRoutes = require('./routes/agents');
const seoRoutes = require('./routes/seo');
const investmentRoutes = require('./routes/investment');
const projectInterestRoutes = require('./routes/project-interest');
const aiAssistantRoutes = require('./routes/ai-assistant');
const aiReviewRoutes = require('./routes/ai-review');
const webVitalsRoutes = require('./routes/analytics/web-vitals');
const n8nRoutes = require('./routes/n8n');
const projectsRoutes = require('./routes/projects');
const envRoutes = require('./routes/env');
const workflowImportRoutes = require('./routes/workflow-import');
const workflowTemplatesRoutes = require('./routes/workflow-templates');
const socialRoutes = require('./routes/social');
const backupRoutes = require('./backup');
const aiCommandRoutes = require('./routes/ai-command');
const aiSuggestionsRoutes = require('./routes/ai-suggestions');
const aiAlertsRoutes = require('./routes/ai-alerts');
const aiOrchestrateRoutes = require('./routes/ai-orchestrate');
const searchConsoleRoutes = require('./routes/google/search-console');
const contextIndexingRoutes = require('./routes/context-indexing');
const contextRetrievalRoutes = require('./routes/context-retrieval');
const copilotRoutes = require('./routes/copilot');
const copilotPlanningRoutes = require('./routes/copilot-planning');
const copilotAnalyticsRoutes = require('./routes/copilot-analytics');
const metricsRoutes = require('./routes/metrics');
const adCampaignsRoutes = require('./routes/ad-campaigns');
const campaignRoutes = require('./routes/campaigns');
const videoAdsRoutes = require('./routes/video-ads');
const campaignOptimizerRoutes = require('./routes/campaign-optimizer');
const multiPlatformRoutes = require('./routes/multi-platform-deployment');
const budgetReallocationRoutes = require('./routes/budget-reallocation');
const campaignMonitoringRoutes = require('./routes/campaign-monitoring');
const aiAssistantsRoutes = require('./routes/ai-assistants');

// Middleware
const { errorHandler } = require('./middleware/error-handler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const aiAssistantsVercelRoutes = require('./routes/ai-assistants-vercel');
const aiWorkspaceN8nRoutes = require('./routes/ai-workspace-n8n');
const documentsRoutes = require('./routes/documents');
const aiWorkspaceAnalyticsRoutes = require('./routes/ai-workspace-analytics');
const memoryRoutes = require('./routes/memory');
const knowledgeRoutes = require('./routes/knowledge');
const settingsRoutes = require('./routes/settings');
const facebookMarketingRoutes = require('./routes/facebook-marketing');
const bugSystemRoutes = require('./routes/bug-system');
// Note: No users route needed - single user admin app

// Workspace AI Chat
const workspaceRoutes = require('./routes/workspace');
const aiWorkspaceChatRoutes = require('./routes/ai-workspace-chat');

// Documentation Management
const docsRoutes = require('./routes/docs');

// System Dashboard (Unified Connector)
const systemRoutes = require('./routes/system');

// Copilot Bridge API (Web UI to VS Code Copilot communication)
const copilotBridgeRoutes = require('./routes/copilot-bridge');

// Sentry Webhook API (Production error tracking)
const sentryRoutes = require('./routes/sentry');

// Solo Hub AI Chat (Backend proxy for OpenAI/Anthropic)
const soloHubChatRoutes = require('./routes/solo-hub-chat');

// Smart Content Features
const abTestingRoutes = require('./routes/ab-testing');
const carouselRoutes = require('./routes/carousel');
const schedulerRoutes = require('./routes/scheduler');
const crossPlatformRoutes = require('./routes/cross-platform');

// AI Feedback & Learning API
const feedbackRoutes = require('./routes/feedback');

// Fix Request API (File watcher integration for Copilot)
const fixRequestRoutes = require('./routes/fix-request');

// WebSocket Bridge (Real-time communication)
const { getBridge } = require('./services/websocket-bridge');

// Sentry Poller (No ngrok needed - polls Sentry API directly)
const { startSentryPoller, getPollerStats } = require('./services/sentry-poller.js');

// AI Second Brain routes
const brainDomainsRoutes = require('./brain/routes/domains');
const brainKnowledgeRoutes = require('./brain/routes/knowledge');
const brainDomainAgentsRoutes = require('./brain/routes/domain-agents');
const brainDomainStatsRoutes = require('./brain/routes/domain-stats');
const brainBulkOperationsRoutes = require('./brain/routes/bulk-operations');
const brainCoreLogicRoutes = require('./brain/routes/core-logic');
const brainKnowledgeAnalysisRoutes = require('./brain/routes/knowledge-analysis');
const brainMultiDomainRoutes = require('./brain/routes/multi-domain');
const brainMasterBrainRoutes = require('./brain/routes/master-brain');
const brainKnowledgeGraphRoutes = require('./brain/routes/knowledge-graph');
// Phase 5 routes
const brainActionsRoutes = require('./brain/routes/actions');
const brainWorkflowsRoutes = require('./brain/routes/workflows');
const brainTasksRoutes = require('./brain/routes/tasks');
const brainNotificationsRoutes = require('./brain/routes/notifications');
// Phase 6 routes
const brainHealthRoutes = require('./brain/routes/health');
const brainLearningRoutes = require('./brain/routes/learning');
const brainAnalyticsRoutes = require('./brain/routes/analytics');
const brainSuggestionsRoutes = require('./brain/routes/suggestions');
const brainCollaborationRoutes = require('./brain/routes/collaboration');
const brainIntegrationsRoutes = require('./brain/routes/integrations');

app.use('/api/drive', googleDriveRoutes);
app.use('/api/google/analytics', googleAnalyticsRoutes);
app.use('/api/google/calendar', googleCalendarRoutes);
app.use('/api/google/gmail', googleGmailRoutes);
app.use('/api/google/maps', googleMapsRoutes);
app.use('/api/google/indexing', googleIndexingRoutes);
app.use('/api/google/sheets', googleSheetsRoutes);
app.use('/api/google/search-console', searchConsoleRoutes);
app.use('/api/credentials', strictLimiter, credentialsRoutes);
app.use('/api/email', strictLimiter, emailRoutes);
app.use('/api/vnpay', strictLimiter, vnpayRoutes);
app.use('/api/agents', aiLimiter, agentsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/project', projectInterestRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/ai-review', aiReviewRoutes);
app.use('/api/analytics', webVitalsRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/env', strictLimiter, envRoutes);
app.use('/api/workflow-import', workflowImportRoutes);
app.use('/api/workflow-templates', workflowTemplatesRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/ai', aiLimiter, aiCommandRoutes);
app.use('/api/ai', aiLimiter, aiSuggestionsRoutes);
app.use('/api/ai', aiLimiter, aiAlertsRoutes);
app.use('/api/ai', aiLimiter, aiOrchestrateRoutes);
app.use('/api/context/index', contextIndexingRoutes);
app.use('/api/context', contextRetrievalRoutes);
app.use('/api/copilot', aiLimiter, copilotRoutes);
app.use('/api/copilot', aiLimiter, copilotPlanningRoutes);
app.use('/api/copilot', copilotAnalyticsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/assistants', aiLimiter, aiAssistantsRoutes);
app.use('/api/assistants', aiLimiter, aiAssistantsVercelRoutes);
app.use('/api/ai-workspace/n8n', aiLimiter, aiWorkspaceN8nRoutes);
app.use('/api/documents', documentLimiter, documentsRoutes);
app.use('/api/ai-workspace/analytics', aiLimiter, aiWorkspaceAnalyticsRoutes);
app.use('/api/memory', aiLimiter, memoryRoutes);
app.use('/api/knowledge', aiLimiter, knowledgeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/facebook', facebookMarketingRoutes);
app.use('/api/ad-campaigns', aiLimiter, adCampaignsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/video-ads', aiLimiter, videoAdsRoutes);
app.use('/api/campaign-optimizer', aiLimiter, campaignOptimizerRoutes);
app.use('/api/multi-platform', aiLimiter, multiPlatformRoutes);
app.use('/api/budget-reallocation', aiLimiter, budgetReallocationRoutes);
app.use('/api/campaign-monitoring', campaignMonitoringRoutes);
const robynRoutes = require('./routes/robyn');
app.use('/api/robyn', aiLimiter, robynRoutes);

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AI Advertising Platform API',
  })
);
app.use('/api/bug-system', bugSystemRoutes);
// Single user - no users API needed

// Workspace API - file access and AI chat
app.use('/api/workspace', workspaceRoutes);
app.use('/api/ai', aiWorkspaceChatRoutes);

// Documentation Management API
app.use('/api/docs', docsRoutes);

// Copilot Bridge API (Web UI to VS Code Copilot communication)
app.use('/api/copilot-bridge', copilotBridgeRoutes);

// Sentry Webhook API (Production error tracking → WebSocket → VS Code)
app.use('/api/sentry', sentryRoutes);

// Solo Hub AI Chat API (Backend proxy for OpenAI/Anthropic)
app.use('/api/solo-hub', aiLimiter, soloHubChatRoutes);

// Smart Content Features API
app.use('/api/ab-testing', aiLimiter, abTestingRoutes);
app.use('/api/carousel', aiLimiter, carouselRoutes);
app.use('/api/scheduler', aiLimiter, schedulerRoutes);
app.use('/api/cross-platform', aiLimiter, crossPlatformRoutes);

// AI Feedback & Learning API
app.use('/api/ai/feedback', aiLimiter, feedbackRoutes);

// GitHub API (Workflow runs, PRs, Issues - for auto-fix dashboard)
const githubRoutes = require('./routes/github');
app.use('/api/github', githubRoutes);

// Fix Request API (File watcher for Copilot - no Claude needed!)
app.use('/api/fix-request', fixRequestRoutes);

// AI Second Brain API
app.use('/api/brain/domains', aiLimiter, brainDomainsRoutes);
app.use('/api/brain/knowledge', aiLimiter, brainKnowledgeRoutes);
app.use('/api/brain/domains', aiLimiter, brainDomainAgentsRoutes);
app.use('/api/brain/domains', aiLimiter, brainDomainStatsRoutes);
app.use('/api/brain/knowledge', aiLimiter, brainBulkOperationsRoutes);
app.use('/api/brain/domains', aiLimiter, brainCoreLogicRoutes);
app.use('/api/brain/domains', aiLimiter, brainKnowledgeAnalysisRoutes);
app.use('/api/brain', aiLimiter, brainMultiDomainRoutes);
app.use('/api/brain/master', aiLimiter, brainMasterBrainRoutes);
app.use('/api/brain/graph', aiLimiter, brainKnowledgeGraphRoutes);
// Phase 5 API
app.use('/api/brain/actions', aiLimiter, brainActionsRoutes);
app.use('/api/brain/workflows', aiLimiter, brainWorkflowsRoutes);
app.use('/api/brain/tasks', aiLimiter, brainTasksRoutes);
app.use('/api/brain/notifications', aiLimiter, brainNotificationsRoutes);
// Phase 6 API
app.use('/api/brain/health', brainHealthRoutes);
app.use('/api/brain/learning', aiLimiter, brainLearningRoutes);
app.use('/api/brain/analytics', aiLimiter, brainAnalyticsRoutes);
app.use('/api/brain/suggestions', aiLimiter, brainSuggestionsRoutes);
app.use('/api/brain/predictions', aiLimiter, brainSuggestionsRoutes);
app.use('/api/brain/collaboration', aiLimiter, brainCollaborationRoutes);
app.use('/api/brain/integrations', aiLimiter, brainIntegrationsRoutes);

// System Dashboard API (Unified Connector)
app.use('/api/system', systemRoutes);

// Ultra-fast ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Fast health check endpoint (no DB calls by default)
const healthCheck = require('./services/health-check');
app.get('/api/health', async (req, res) => {
  try {
    // Use deep=true query param for full health check
    const deep = req.query.deep === 'true';
    const health = await healthCheck.performHealthCheck(deep);
    const statusCode = healthCheck.getStatusCode(health);
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Express Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start background monitoring with try-catch
try {
  const backgroundMonitor = require('./services/background-monitor');
  backgroundMonitor.startMonitoring(5); // Check every 5 minutes
} catch (err) {
  console.warn('⚠️ Background monitor failed to start:', err.message);
  // Don't crash - continue without background monitor
}

// Start Scheduled Posts Processor (every 1 minute)
try {
  const postScheduler = require('./services/post-scheduler');
  setInterval(async () => {
    try {
      const result = await postScheduler.processDuePosts();
      if (result.processed > 0) {
        console.log(`📬 [Scheduler] Processed ${result.processed} scheduled posts`);
      }
    } catch (err) {
      console.warn('⚠️ Post scheduler tick failed:', err.message);
    }
  }, 60 * 1000); // Every 1 minute
  console.log('📅 Scheduled Posts Processor started (every 1 min)');
} catch (err) {
  console.warn('⚠️ Post Scheduler failed to start:', err.message);
}

// Initialize Unified Connector (System Connection Hub)
try {
  const unifiedConnector = require('./services/unified-connector');
  unifiedConnector
    .initialize()
    .then(() => {
      console.log('🔗 Unified Connector initialized');
    })
    .catch((err) => {
      console.warn('⚠️ Unified Connector initialization warning:', err.message);
    });
} catch (err) {
  console.warn('⚠️ Unified Connector failed to load:', err.message);
}

// Initialize WebSocket Bridge for real-time communication
try {
  const wsBridge = getBridge({ port: 3003 });
  wsBridge.start();
  console.log('🌐 WebSocket Bridge started on port 3003');

  // Start Sentry Poller (polls every 30s - no ngrok needed!)
  startSentryPoller();
} catch (err) {
  console.warn('⚠️ WebSocket Bridge failed to start:', err.message);
}

// Start server with error handling
let server;
const startServer = (port) => {
  // Create HTTP server for WebSocket support
  const http = require('http');
  server = http.createServer(app);

  // WebSocket Monitoring Server (Phase 3)
  try {
    const WebSocketMonitoringServer = require('./services/websocket-monitoring');
    const wsMonitoring = new WebSocketMonitoringServer(server);
    console.log('📡 WebSocket monitoring server initialized');
  } catch (error) {
    console.warn('⚠️ WebSocket monitoring not available:', error.message);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚀 API Server running on http://localhost:${port}`);
    console.log(`📡 WebSocket monitoring: ws://localhost:${port}/ws/campaign-monitoring`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📁 Google Drive API: /api/drive`);
    console.log(`📊 Google Analytics: /api/google/analytics`);
    console.log(`🔍 Search Console:   /api/google/search-console`);
    console.log(`🎯 SEO API:          /api/seo`);
    console.log(`🤖 AI Command:       /api/ai`);
    console.log(`💾 Backup:           /api/backup`);
    console.log('───────────────────────────────────────────────────────────');
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log(`📊 PID: ${process.pid}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = parseInt(port) + 10;
      console.error(`❌ Port ${port} is already in use. Trying port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('❌ Server error:', err);
    }
  });

  // Keep-alive settings for stability
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Error handler (must be last)
  app.use(errorHandler);
};

startServer(PORT);

module.exports = { app, server };
module.exports = app;
