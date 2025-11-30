/**
 * Health Check Routes
 * Monitor system health and dependencies
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const cacheService = require('../services/cache-service');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Basic health check
 * GET /api/brain/health
 */
router.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'brain-api',
  });
});

/**
 * Detailed health check
 * GET /api/brain/health/detailed
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'brain-api',
    checks: {},
  };

  let allHealthy = true;

  // Database check
  try {
    const startTime = Date.now();
    const { error } = await supabase.from('brain_domains').select('id').limit(1);
    const duration = Date.now() - startTime;

    health.checks.database = {
      status: error ? 'unhealthy' : 'healthy',
      responseTime: `${duration}ms`,
      error: error ? error.message : null,
    };

    if (error) allHealthy = false;
  } catch (err) {
    health.checks.database = {
      status: 'unhealthy',
      error: err.message,
    };
    allHealthy = false;
  }

  // Redis/Cache check
  try {
    const cacheAvailable = cacheService.isAvailable();
    if (cacheAvailable) {
      const startTime = Date.now();
      await cacheService.set('health:check', 'ok', 10);
      const value = await cacheService.get('health:check');
      const duration = Date.now() - startTime;

      health.checks.cache = {
        status: value === 'ok' ? 'healthy' : 'unhealthy',
        responseTime: `${duration}ms`,
        available: true,
      };

      if (value !== 'ok') allHealthy = false;
    } else {
      health.checks.cache = {
        status: 'not_configured',
        available: false,
      };
    }
  } catch (err) {
    health.checks.cache = {
      status: 'unhealthy',
      error: err.message,
    };
    allHealthy = false;
  }

  // External API check (OpenAI - optional)
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    health.checks.openai = {
      status: openaiKey ? 'configured' : 'not_configured',
      available: !!openaiKey,
    };
  } catch (err) {
    health.checks.openai = {
      status: 'error',
      error: err.message,
    };
  }

  // Memory usage
  const memoryUsage = process.memoryUsage();
  health.checks.memory = {
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
  };

  // Uptime
  health.checks.uptime = {
    seconds: Math.floor(process.uptime()),
    formatted: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
  };

  health.status = allHealthy ? 'ok' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Readiness check (for Kubernetes)
 * GET /api/brain/health/ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    const { error } = await supabase.from('brain_domains').select('id').limit(1);
    if (error) {
      return res.status(503).json({
        status: 'not_ready',
        error: 'Database connection failed',
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      error: err.message,
    });
  }
});

/**
 * Liveness check (for Kubernetes)
 * GET /api/brain/health/live
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;


