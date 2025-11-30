/**
 * 📊 System Status Dashboard Routes
 * 
 * Real-time system status and metrics API for the System Map dashboard
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// Initialize unified connector
const unifiedConnector = require('../services/unified-connector');

/**
 * GET /api/system/status
 * Get comprehensive system status
 */
router.get('/status', async (req, res) => {
  try {
    // Get status without re-initializing (already done at server startup)
    const status = unifiedConnector.getSystemStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('[System API] Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/metrics
 * Get performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = unifiedConnector.getMetrics();
    
    res.json({
      success: true,
      ...metrics
    });
  } catch (error) {
    console.error('[System API] Metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/services
 * Get detailed service status
 */
router.get('/services', async (req, res) => {
  try {
    const services = {};
    
    // API Server
    services.apiServer = {
      name: 'API Server',
      status: 'running',
      port: process.env.API_PORT || 3001,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    };

    // MCP Server
    const mcpService = unifiedConnector.getService('mcp');
    services.mcpServer = {
      name: 'MCP Server',
      status: mcpService?.status || 'unknown',
      port: mcpService?.port || 3002,
      tools: mcpService?.client?.tools?.length || 0
    };

    // Brain System
    const brainService = unifiedConnector.getService('brain');
    services.brainSystem = {
      name: 'Brain System',
      status: brainService?.status || 'unknown',
      servicesCount: brainService?.count || 0,
      services: brainService?.services?.map(s => ({
        name: s.name,
        loaded: s.loaded
      })) || []
    };

    // Database
    const dbService = unifiedConnector.getService('database');
    services.database = {
      name: 'Supabase Database',
      status: dbService?.status || 'unknown',
      type: 'PostgreSQL',
      responseTime: dbService?.responseTime
    };

    // Cache
    const cacheService = unifiedConnector.getService('cache');
    services.cache = {
      name: 'Cache Service',
      status: cacheService?.status || 'unknown',
      type: cacheService?.type || 'memory',
      memorySize: unifiedConnector.memoryCache?.size || 0
    };

    // External APIs
    const externalApis = unifiedConnector.getService('externalApis');
    services.externalApis = {};
    
    if (externalApis instanceof Map) {
      for (const [name, info] of externalApis) {
        services.externalApis[name] = {
          configured: info.configured,
          type: info.type
        };
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services
    });
  } catch (error) {
    console.error('[System API] Services error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/architecture
 * Get architecture data for visualization
 */
router.get('/architecture', async (req, res) => {
  try {
    // Get architecture without re-initializing

    // Define nodes for React Flow
    const nodes = [
      // Frontend Layer
      {
        id: 'frontend',
        type: 'group',
        label: 'Frontend Layer',
        position: { x: 0, y: 0 },
        style: { width: 600, height: 150, backgroundColor: 'rgba(34, 197, 94, 0.1)' }
      },
      {
        id: 'admin-panel',
        label: 'Admin Panel',
        sublabel: '83 Pages',
        type: 'frontend',
        status: 'running',
        position: { x: 50, y: 50 },
        parentNode: 'frontend'
      },
      {
        id: 'ai-workspace',
        label: 'AI Workspace',
        sublabel: '6 Agents',
        type: 'frontend',
        status: 'running',
        position: { x: 250, y: 50 },
        parentNode: 'frontend'
      },
      {
        id: 'brain-ui',
        label: 'Brain System',
        sublabel: 'Knowledge Base',
        type: 'frontend',
        status: 'running',
        position: { x: 450, y: 50 },
        parentNode: 'frontend'
      },

      // Backend Layer
      {
        id: 'backend',
        type: 'group',
        label: 'Backend Layer',
        position: { x: 0, y: 200 },
        style: { width: 600, height: 150, backgroundColor: 'rgba(59, 130, 246, 0.1)' }
      },
      {
        id: 'api-server',
        label: 'API Server',
        sublabel: `Express :${process.env.API_PORT || 3001}`,
        type: 'backend',
        status: 'running',
        position: { x: 150, y: 250 },
        parentNode: 'backend',
        metrics: {
          routes: '50+',
          uptime: Math.floor(process.uptime())
        }
      },
      {
        id: 'mcp-server',
        label: 'MCP Server',
        sublabel: 'Python :3002',
        type: 'backend',
        status: unifiedConnector.getService('mcp')?.status || 'unknown',
        position: { x: 400, y: 250 },
        parentNode: 'backend',
        metrics: {
          tools: unifiedConnector.getService('mcp')?.client?.tools?.length || 47
        }
      },

      // AI Layer
      {
        id: 'ai-layer',
        type: 'group',
        label: 'AI Layer',
        position: { x: 0, y: 400 },
        style: { width: 600, height: 150, backgroundColor: 'rgba(139, 92, 246, 0.1)' }
      },
      {
        id: 'gemini',
        label: 'Gemini 2.5',
        sublabel: 'Flash + Pro',
        type: 'ai',
        status: process.env.GEMINI_API_KEY ? 'connected' : 'not-configured',
        position: { x: 50, y: 450 },
        parentNode: 'ai-layer'
      },
      {
        id: 'vertex-ai',
        label: 'Vertex AI',
        sublabel: 'Imagen 3.0',
        type: 'ai',
        status: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'connected' : 'not-configured',
        position: { x: 200, y: 450 },
        parentNode: 'ai-layer'
      },
      {
        id: 'openai',
        label: 'OpenAI',
        sublabel: 'Embeddings',
        type: 'ai',
        status: process.env.OPENAI_API_KEY ? 'connected' : 'not-configured',
        position: { x: 350, y: 450 },
        parentNode: 'ai-layer'
      },
      {
        id: 'brain-services',
        label: 'Brain Services',
        sublabel: '23 Services',
        type: 'ai',
        status: unifiedConnector.getService('brain')?.status || 'unknown',
        position: { x: 500, y: 450 },
        parentNode: 'ai-layer'
      },

      // Data Layer
      {
        id: 'data-layer',
        type: 'group',
        label: 'Data Layer',
        position: { x: 650, y: 200 },
        style: { width: 200, height: 350, backgroundColor: 'rgba(249, 115, 22, 0.1)' }
      },
      {
        id: 'supabase',
        label: 'Supabase',
        sublabel: 'PostgreSQL',
        type: 'database',
        status: unifiedConnector.getService('database')?.status || 'unknown',
        position: { x: 700, y: 250 },
        parentNode: 'data-layer'
      },
      {
        id: 'cache',
        label: 'Cache',
        sublabel: unifiedConnector.getService('cache')?.type || 'Memory',
        type: 'database',
        status: unifiedConnector.getService('cache')?.status || 'memory-fallback',
        position: { x: 700, y: 350 },
        parentNode: 'data-layer'
      },

      // External APIs
      {
        id: 'external-layer',
        type: 'group',
        label: 'External APIs',
        position: { x: 0, y: 600 },
        style: { width: 850, height: 120, backgroundColor: 'rgba(236, 72, 153, 0.1)' }
      },
      {
        id: 'google-apis',
        label: 'Google APIs',
        sublabel: 'Drive, Calendar, SEO',
        type: 'external',
        status: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'connected' : 'not-configured',
        position: { x: 50, y: 650 },
        parentNode: 'external-layer'
      },
      {
        id: 'youtube-api',
        label: 'YouTube API',
        sublabel: 'Upload, Analytics',
        type: 'external',
        status: process.env.YOUTUBE_ACCESS_TOKEN ? 'connected' : 'not-configured',
        position: { x: 200, y: 650 },
        parentNode: 'external-layer'
      },
      {
        id: 'meta-api',
        label: 'Meta API',
        sublabel: 'FB, IG, Threads',
        type: 'external',
        status: process.env.FACEBOOK_PAGE_ACCESS_TOKEN ? 'connected' : 'not-configured',
        position: { x: 350, y: 650 },
        parentNode: 'external-layer'
      },
      {
        id: 'n8n',
        label: 'n8n',
        sublabel: 'Workflows :5678',
        type: 'external',
        status: process.env.VITE_N8N_API_KEY ? 'connected' : 'not-configured',
        position: { x: 500, y: 650 },
        parentNode: 'external-layer'
      },
      {
        id: 'linkedin-api',
        label: 'LinkedIn',
        sublabel: 'Social Publishing',
        type: 'external',
        status: process.env.LINKEDIN_ACCESS_TOKEN ? 'connected' : 'not-configured',
        position: { x: 650, y: 650 },
        parentNode: 'external-layer'
      }
    ];

    // Define edges (connections)
    const edges = [
      // Frontend to Backend
      { id: 'e1', source: 'admin-panel', target: 'api-server', type: 'rest', label: 'REST API' },
      { id: 'e2', source: 'ai-workspace', target: 'api-server', type: 'rest', label: 'REST API' },
      { id: 'e3', source: 'brain-ui', target: 'api-server', type: 'rest', label: 'REST API' },
      
      // API Server connections
      { id: 'e4', source: 'api-server', target: 'mcp-server', type: 'mcp', label: 'MCP Protocol' },
      { id: 'e5', source: 'api-server', target: 'supabase', type: 'sql', label: 'Supabase Client' },
      { id: 'e6', source: 'api-server', target: 'cache', type: 'cache', label: 'Cache' },
      
      // MCP to AI services
      { id: 'e7', source: 'mcp-server', target: 'gemini', type: 'ai', label: 'google-genai SDK' },
      { id: 'e8', source: 'mcp-server', target: 'supabase', type: 'sql', label: 'Supabase Client' },
      
      // API to AI
      { id: 'e9', source: 'api-server', target: 'gemini', type: 'ai', label: 'google-genai SDK' },
      { id: 'e10', source: 'api-server', target: 'openai', type: 'ai', label: 'Embeddings' },
      { id: 'e11', source: 'api-server', target: 'brain-services', type: 'internal', label: 'Brain API' },
      
      // External APIs
      { id: 'e12', source: 'api-server', target: 'google-apis', type: 'oauth', label: 'OAuth2' },
      { id: 'e13', source: 'api-server', target: 'youtube-api', type: 'oauth', label: 'OAuth2' },
      { id: 'e14', source: 'api-server', target: 'meta-api', type: 'oauth', label: 'Access Token' },
      { id: 'e15', source: 'api-server', target: 'n8n', type: 'webhook', label: 'Webhooks' },
      { id: 'e16', source: 'api-server', target: 'linkedin-api', type: 'oauth', label: 'OAuth2' },
      
      // MCP external
      { id: 'e17', source: 'mcp-server', target: 'google-apis', type: 'oauth', label: 'Google Integration' },
      { id: 'e18', source: 'mcp-server', target: 'youtube-api', type: 'oauth', label: 'YouTube Tools' },
      
      // Brain connections
      { id: 'e19', source: 'brain-services', target: 'supabase', type: 'sql', label: 'pgvector' },
      { id: 'e20', source: 'brain-services', target: 'cache', type: 'cache', label: 'Cache Layer' },
      { id: 'e21', source: 'brain-services', target: 'openai', type: 'ai', label: 'Embeddings' }
    ];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      architecture: {
        nodes,
        edges,
        stats: {
          totalNodes: nodes.length,
          totalConnections: edges.length,
          layers: ['frontend', 'backend', 'ai', 'data', 'external']
        }
      }
    });
  } catch (error) {
    console.error('[System API] Architecture error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/mcp/tools
 * Get available MCP tools
 */
router.get('/mcp/tools', async (req, res) => {
  try {
    const tools = await unifiedConnector.getMCPTools();
    
    // Group tools by category
    const groupedTools = {
      file: [],
      git: [],
      brain: [],
      google: [],
      deployment: [],
      project: [],
      other: []
    };

    for (const tool of tools) {
      const name = tool.name.toLowerCase();
      
      if (name.includes('file') || name.includes('read') || name.includes('write') || name.includes('edit') || name.includes('search') || name.includes('list_files')) {
        groupedTools.file.push(tool);
      } else if (name.includes('git')) {
        groupedTools.git.push(tool);
      } else if (name.includes('brain')) {
        groupedTools.brain.push(tool);
      } else if (name.includes('gemini') || name.includes('google') || name.includes('youtube') || name.includes('drive') || name.includes('calendar') || name.includes('seo')) {
        groupedTools.google.push(tool);
      } else if (name.includes('deploy') || name.includes('vercel')) {
        groupedTools.deployment.push(tool);
      } else if (name.includes('project')) {
        groupedTools.project.push(tool);
      } else {
        groupedTools.other.push(tool);
      }
    }

    res.json({
      success: true,
      total: tools.length,
      grouped: groupedTools,
      tools
    });
  } catch (error) {
    console.error('[System API] MCP tools error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/system/initialize
 * Initialize or reinitialize system connections
 */
router.post('/initialize', async (req, res) => {
  try {
    const results = await unifiedConnector.initialize();
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('[System API] Initialize error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/health
 * Combined health check (replaces old health endpoint)
 */
router.get('/health', async (req, res) => {
  try {
    // Get existing health check
    const healthCheck = require('../services/health-check');
    const health = await healthCheck.performHealthCheck();
    
    // Add unified connector status
    const connectorStatus = unifiedConnector.getSystemStatus();
    
    res.json({
      ...health,
      connector: connectorStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
