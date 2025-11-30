/**
 * 🏥 Comprehensive Health Check Service
 *
 * Performs comprehensive health checks for all services
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const { createClient } = require('@supabase/supabase-js');
const performanceOptimizer = require('./performance-optimizer');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Perform comprehensive health check
 * @param {boolean} deep - If true, perform deep checks (database queries). Default false for fast response.
 * @returns {Promise<object>} Health check results
 */
async function performHealthCheck(deep = false) {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    services: {},
    checks: {},
  };

  // Quick check - just verify credentials configured (no DB calls)
  if (!deep) {
    health.services.database = {
      status: (supabaseUrl && supabaseKey) ? 'OK' : 'WARN',
      message: (supabaseUrl && supabaseKey) ? 'Configured' : 'Not configured',
    };
    health.checks.database = !!(supabaseUrl && supabaseKey);
    
    health.services.openai = {
      status: process.env.OPENAI_API_KEY ? 'OK' : 'WARN',
      message: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
    };
    health.checks.openai = !!process.env.OPENAI_API_KEY;
    
    health.services.cache = { status: 'OK', message: 'Available' };
    health.checks.cache = true;
    
    health.checks.summary = { passed: Object.values(health.checks).filter(v => v === true).length, total: 3 };
    return health;
  }

  // Deep check - original full implementation
  // Check database connectivity
  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const startTime = Date.now();

      const { data, error } = await Promise.race([
        supabase.from('projects').select('id').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ]);

      const responseTime = Date.now() - startTime;

      health.services.database = {
        status: error ? 'ERROR' : 'OK',
        message: error ? error.message : 'Connected',
        responseTime: `${responseTime}ms`,
      };
      health.checks.database = !error && responseTime < 1000;
    } else {
      health.services.database = {
        status: 'WARN',
        message: 'Database credentials not configured',
      };
      health.checks.database = false;
    }
  } catch (error) {
    health.services.database = {
      status: 'ERROR',
      message: error.message,
    };
    health.checks.database = false;
  }

  // Check OpenAI API configuration
  health.services.openai = {
    status: process.env.OPENAI_API_KEY ? 'OK' : 'WARN',
    message: process.env.OPENAI_API_KEY
      ? 'API key configured'
      : 'API key not configured',
  };
  health.checks.openai = !!process.env.OPENAI_API_KEY;

  // Check cache availability
  try {
    const cacheStats = performanceOptimizer.getCacheStats();
    const totalKeys = Object.values(cacheStats).reduce(
      (sum, stats) => sum + (stats.keys || 0),
      0
    );

    health.services.cache = {
      status: 'OK',
      stats: {
        totalKeys,
        ...cacheStats,
      },
    };
    health.checks.cache = true;
  } catch (error) {
    health.services.cache = {
      status: 'WARN',
      message: error.message,
    };
    health.checks.cache = false;
  }

  // Check vector database (pgvector)
  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try to call match_documents function (AI Workspace RAG)
      const { data, error } = await Promise.race([
        supabase.rpc('match_documents', {
          query_embedding: new Array(1536).fill(0.1),
          match_threshold: 0.7,
          match_count: 1,
          filter_user_id: null,
          filter_source_types: null,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);

      health.services.vectorDB = {
        status: error ? 'ERROR' : 'OK',
        message: error
          ? error.message
          : 'pgvector extension and match_documents function available',
      };
      health.checks.vectorDB = !error;
    } else {
      health.services.vectorDB = {
        status: 'WARN',
        message: 'Cannot check - database not configured',
      };
      health.checks.vectorDB = false;
    }
  } catch (error) {
    health.services.vectorDB = {
      status: error.message.includes('Timeout') ? 'WARN' : 'ERROR',
      message: error.message,
    };
    health.checks.vectorDB = false;
  }

  // Check required tables exist
  try {
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const requiredTables = [
        'documents',
        'conversations',
        'agent_executions',
        'response_cache',
        'news_digests',
      ];

      const tableChecks = await Promise.all(
        requiredTables.map(async (table) => {
          try {
            const { error } = await supabase.from(table).select('id').limit(1);
            return { table, exists: !error || error.code !== 'PGRST116' };
          } catch {
            return { table, exists: false };
          }
        })
      );

      const existingTables = tableChecks.filter((check) => check.exists).length;
      const missingTables = tableChecks
        .filter((check) => !check.exists)
        .map((check) => check.table);

      health.services.tables = {
        status: missingTables.length === 0 ? 'OK' : 'WARN',
        message:
          missingTables.length === 0
            ? 'All required tables exist'
            : `Missing tables: ${missingTables.join(', ')}`,
        existing: existingTables,
        total: requiredTables.length,
        missing: missingTables,
      };
      health.checks.tables = missingTables.length === 0;
    } else {
      health.services.tables = {
        status: 'WARN',
        message: 'Cannot check - database not configured',
      };
      health.checks.tables = false;
    }
  } catch (error) {
    health.services.tables = {
      status: 'ERROR',
      message: error.message,
    };
    health.checks.tables = false;
  }

  // Calculate overall status
  const allChecks = Object.values(health.checks);
  const passedChecks = allChecks.filter((check) => check === true).length;
  const totalChecks = allChecks.length;

  health.checks.summary = {
    passed: passedChecks,
    total: totalChecks,
    percentage: totalChecks > 0 ? (passedChecks / totalChecks * 100).toFixed(1) : 0,
  };

  // Determine overall status
  if (passedChecks === totalChecks) {
    health.status = 'OK';
  } else if (passedChecks >= totalChecks * 0.7) {
    health.status = 'DEGRADED';
  } else {
    health.status = 'ERROR';
  }

  return health;
}

/**
 * Get HTTP status code for health check result
 * @param {object} health - Health check result
 * @returns {number} HTTP status code
 */
function getStatusCode(health) {
  switch (health.status) {
    case 'OK':
      return 200;
    case 'DEGRADED':
      return 200; // Still OK but with warnings
    case 'ERROR':
      return 503; // Service unavailable
    default:
      return 500;
  }
}

module.exports = {
  performHealthCheck,
  getStatusCode,
};

