/**
 * 🔗 Unified Service Connector
 * 
 * Central hub that connects all system components:
 * - API Server ↔ MCP Server
 * - Brain System ↔ Cache Service
 * - All services ↔ Health Monitor
 * 
 * This creates the "connection network" shown in the architecture diagram
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const EventEmitter = require('events');

class UnifiedConnector extends EventEmitter {
  constructor() {
    super();
    
    // Service registry
    this.services = new Map();
    
    // Connection status
    this.connections = new Map();
    
    // Performance metrics
    this.metrics = {
      requests: new Map(),
      latency: new Map(),
      errors: new Map(),
      lastUpdated: Date.now()
    };
    
    // In-memory cache for when Redis is not available
    this.memoryCache = new Map();
    this.memoryCacheTTL = new Map();
    
    // Circuit breaker state
    this.circuitBreaker = new Map();
    
    this.initialized = false;
  }

  /**
   * Initialize all connections
   */
  async initialize() {
    console.log('🔗 [Unified Connector] Initializing system connections...');
    
    const startTime = Date.now();
    const results = {
      success: [],
      failed: [],
      warnings: []
    };

    // 1. Initialize MCP Client
    try {
      const mcpClient = require('./mcp-client');
      const mcpAvailable = await mcpClient.isAvailable();
      
      this.services.set('mcp', {
        client: mcpClient,
        status: mcpAvailable ? 'connected' : 'disconnected',
        type: 'external',
        port: process.env.MCP_PORT || 3002
      });
      
      if (mcpAvailable) {
        results.success.push('MCP Server');
        this.emit('service:connected', { name: 'mcp', port: 3002 });
      } else {
        results.warnings.push('MCP Server (offline)');
      }
    } catch (error) {
      results.failed.push(`MCP Server: ${error.message}`);
      this.services.set('mcp', { status: 'error', error: error.message });
    }

    // 2. Initialize Brain Services
    try {
      const brainServices = await this._initializeBrainServices();
      this.services.set('brain', {
        services: brainServices,
        status: 'connected',
        type: 'internal',
        count: brainServices.length
      });
      results.success.push(`Brain System (${brainServices.length} services)`);
    } catch (error) {
      results.failed.push(`Brain System: ${error.message}`);
    }

    // 3. Initialize Cache
    try {
      const cacheService = require('../brain/services/cache-service');
      const cacheAvailable = cacheService.isAvailable();
      
      this.services.set('cache', {
        client: cacheService,
        status: cacheAvailable ? 'connected' : 'memory-fallback',
        type: cacheAvailable ? 'redis' : 'memory'
      });
      
      if (cacheAvailable) {
        results.success.push('Redis Cache');
      } else {
        results.warnings.push('Redis (using memory fallback)');
      }
    } catch (error) {
      results.warnings.push(`Cache: ${error.message} (using memory fallback)`);
      this.services.set('cache', { status: 'memory-fallback', type: 'memory' });
    }

    // 4. Initialize Database connection check
    try {
      const dbStatus = await this._checkDatabaseConnection();
      this.services.set('database', {
        status: dbStatus.connected ? 'connected' : 'error',
        type: 'supabase',
        responseTime: dbStatus.responseTime
      });
      
      if (dbStatus.connected) {
        results.success.push('Supabase Database');
      } else {
        results.failed.push('Supabase Database');
      }
    } catch (error) {
      results.failed.push(`Database: ${error.message}`);
    }

    // 5. Initialize External APIs status
    const externalApis = await this._checkExternalApis();
    this.services.set('externalApis', externalApis);
    
    externalApis.forEach((api, name) => {
      if (api.configured) {
        results.success.push(name);
      } else {
        results.warnings.push(`${name} (not configured)`);
      }
    });

    this.initialized = true;
    
    const initTime = Date.now() - startTime;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔗 [Unified Connector] System Status');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Connected: ${results.success.join(', ')}`);
    if (results.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${results.warnings.join(', ')}`);
    }
    if (results.failed.length > 0) {
      console.log(`❌ Failed: ${results.failed.join(', ')}`);
    }
    console.log(`⏱️  Init time: ${initTime}ms`);
    console.log('═══════════════════════════════════════════════════════════');

    this.emit('initialized', { results, initTime });
    
    return results;
  }

  /**
   * Initialize Brain Services
   */
  async _initializeBrainServices() {
    const services = [];
    const serviceNames = [
      'brain-service', 'cache-service', 'embedding-service',
      'retrieval-service', 'knowledge-graph-service', 'analytics-service',
      'prediction-service', 'suggestion-service', 'learning-service',
      'collaboration-service', 'workflow-engine-service', 'master-brain-orchestrator'
    ];

    for (const serviceName of serviceNames) {
      try {
        const service = require(`../brain/services/${serviceName}`);
        services.push({ name: serviceName, loaded: true });
      } catch (error) {
        services.push({ name: serviceName, loaded: false, error: error.message });
      }
    }

    return services;
  }

  /**
   * Check database connection
   */
  async _checkDatabaseConnection() {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { connected: false, error: 'Credentials not configured' };
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const startTime = Date.now();
      
      const { error } = await Promise.race([
        supabase.from('projects').select('id').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      return {
        connected: !error,
        responseTime: Date.now() - startTime,
        error: error?.message
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * Check external APIs configuration
   */
  async _checkExternalApis() {
    const apis = new Map();

    // Google APIs
    apis.set('Gemini AI', {
      configured: !!process.env.GEMINI_API_KEY,
      type: 'ai'
    });

    apis.set('YouTube', {
      configured: !!process.env.YOUTUBE_ACCESS_TOKEN,
      type: 'social'
    });

    apis.set('Google Drive', {
      configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      type: 'storage'
    });

    // Social APIs
    apis.set('Facebook', {
      configured: !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
      type: 'social'
    });

    apis.set('LinkedIn', {
      configured: !!process.env.LINKEDIN_ACCESS_TOKEN,
      type: 'social'
    });

    apis.set('Threads', {
      configured: !!process.env.THREADS_ACCESS_TOKEN,
      type: 'social'
    });

    // Other APIs
    apis.set('OpenAI', {
      configured: !!process.env.OPENAI_API_KEY,
      type: 'ai'
    });

    apis.set('n8n', {
      configured: !!process.env.VITE_N8N_API_KEY,
      type: 'automation'
    });

    return apis;
  }

  // ═══════════════════════════════════════════════════════════
  // 🧠 BRAIN INTEGRATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Query Brain System with caching
   */
  async queryBrain(query, options = {}) {
    const cacheKey = `brain:query:${Buffer.from(query).toString('base64').slice(0, 50)}`;
    
    // Check cache first
    const cached = await this.getCache(cacheKey);
    if (cached && !options.skipCache) {
      this.recordMetric('brain', 'cache_hit');
      return { ...cached, fromCache: true };
    }

    // Query brain service
    const startTime = Date.now();
    try {
      const brainService = require('../brain/services/brain-service');
      const result = await brainService.query(query, options);
      
      // Cache result
      await this.setCache(cacheKey, result, options.cacheTTL || 300);
      
      this.recordMetric('brain', 'query', Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordMetric('brain', 'error');
      throw error;
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query, domain = null, limit = 10) {
    const cacheKey = `brain:search:${domain || 'all'}:${Buffer.from(query).toString('base64').slice(0, 50)}`;
    
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const brainService = require('../brain/services/brain-service');
      const results = await brainService.searchKnowledge(query, {
        matchThreshold: 0.3,
        matchCount: limit,
        domainIds: domain ? [domain] : null
      });
      
      await this.setCache(cacheKey, results, 300);
      return results;
    } catch (error) {
      console.error('[Unified Connector] Search error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🤖 MCP INTEGRATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Call MCP tool with retry and circuit breaker
   */
  async callMCPTool(toolName, args = {}, options = {}) {
    const mcpService = this.services.get('mcp');
    
    if (!mcpService || mcpService.status !== 'connected') {
      // Check circuit breaker
      const breaker = this.circuitBreaker.get('mcp');
      if (breaker && breaker.open && Date.now() < breaker.resetTime) {
        throw new Error('MCP circuit breaker is open');
      }

      // Try to reconnect
      try {
        const mcpClient = require('./mcp-client');
        const connected = await mcpClient.initialize();
        
        if (!connected) {
          this._openCircuitBreaker('mcp');
          throw new Error('MCP Server not available');
        }
        
        this.services.set('mcp', {
          ...mcpService,
          client: mcpClient,
          status: 'connected'
        });
        this._closeCircuitBreaker('mcp');
      } catch (error) {
        this._openCircuitBreaker('mcp');
        throw error;
      }
    }

    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mcpClient = this.services.get('mcp').client;
        const result = await mcpClient.callTool(toolName, args);
        
        this.recordMetric('mcp', toolName, Date.now() - startTime);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`[Unified Connector] MCP tool ${toolName} attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await this._delay(1000 * attempt);
        }
      }
    }

    this.recordMetric('mcp', 'error');
    throw lastError;
  }

  /**
   * Get available MCP tools
   */
  async getMCPTools() {
    const mcpService = this.services.get('mcp');
    if (mcpService?.client) {
      return mcpService.client.tools || [];
    }
    return [];
  }

  // ═══════════════════════════════════════════════════════════
  // 💾 CACHE MANAGEMENT (Redis + Memory Fallback)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get from cache (Redis or memory)
   */
  async getCache(key) {
    // Clean expired memory cache
    this._cleanExpiredMemoryCache();
    
    // Try Redis first
    const cacheService = this.services.get('cache');
    if (cacheService?.status === 'connected') {
      try {
        return await cacheService.client.get(key);
      } catch (error) {
        console.warn('[Unified Connector] Redis get error, falling back to memory');
      }
    }
    
    // Fallback to memory cache
    return this.memoryCache.get(key);
  }

  /**
   * Set in cache (Redis + memory)
   */
  async setCache(key, value, ttlSeconds = 300) {
    // Always set in memory (for fast access)
    this.memoryCache.set(key, value);
    this.memoryCacheTTL.set(key, Date.now() + (ttlSeconds * 1000));
    
    // Limit memory cache size
    if (this.memoryCache.size > 1000) {
      this._evictOldestMemoryCache();
    }
    
    // Try Redis if available
    const cacheService = this.services.get('cache');
    if (cacheService?.status === 'connected') {
      try {
        await cacheService.client.set(key, value, ttlSeconds);
      } catch (error) {
        console.warn('[Unified Connector] Redis set error:', error.message);
      }
    }
    
    return true;
  }

  /**
   * Delete from cache
   */
  async deleteCache(key) {
    this.memoryCache.delete(key);
    this.memoryCacheTTL.delete(key);
    
    const cacheService = this.services.get('cache');
    if (cacheService?.status === 'connected') {
      try {
        await cacheService.client.del(key);
      } catch (error) {
        console.warn('[Unified Connector] Redis delete error:', error.message);
      }
    }
    
    return true;
  }

  /**
   * Clean expired memory cache entries
   */
  _cleanExpiredMemoryCache() {
    const now = Date.now();
    for (const [key, expiry] of this.memoryCacheTTL) {
      if (expiry < now) {
        this.memoryCache.delete(key);
        this.memoryCacheTTL.delete(key);
      }
    }
  }

  /**
   * Evict oldest 10% of memory cache
   */
  _evictOldestMemoryCache() {
    const entries = Array.from(this.memoryCacheTTL.entries());
    entries.sort((a, b) => a[1] - b[1]);
    
    const toEvict = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toEvict; i++) {
      const key = entries[i][0];
      this.memoryCache.delete(key);
      this.memoryCacheTTL.delete(key);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📊 METRICS & MONITORING
  // ═══════════════════════════════════════════════════════════

  /**
   * Record metric
   */
  recordMetric(service, action, latency = null) {
    const key = `${service}:${action}`;
    
    // Increment request count
    const current = this.metrics.requests.get(key) || 0;
    this.metrics.requests.set(key, current + 1);
    
    // Record latency
    if (latency !== null) {
      const latencies = this.metrics.latency.get(key) || [];
      latencies.push(latency);
      
      // Keep only last 100 latencies
      if (latencies.length > 100) {
        latencies.shift();
      }
      
      this.metrics.latency.set(key, latencies);
    }
    
    // Record errors
    if (action === 'error') {
      const errors = this.metrics.errors.get(service) || 0;
      this.metrics.errors.set(service, errors + 1);
    }
    
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const services = {};
    
    for (const [name, info] of this.services) {
      if (info instanceof Map) {
        services[name] = Object.fromEntries(info);
      } else {
        services[name] = {
          status: info.status,
          type: info.type,
          ...(info.count && { count: info.count }),
          ...(info.responseTime && { responseTime: info.responseTime })
        };
      }
    }

    return {
      initialized: this.initialized,
      timestamp: new Date().toISOString(),
      services,
      cache: {
        memory: {
          size: this.memoryCache.size,
          maxSize: 1000
        },
        redis: this.services.get('cache')?.status || 'unknown'
      },
      circuitBreakers: Object.fromEntries(this.circuitBreaker)
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const metrics = {
      requests: Object.fromEntries(this.metrics.requests),
      errors: Object.fromEntries(this.metrics.errors),
      latency: {},
      lastUpdated: new Date(this.metrics.lastUpdated).toISOString()
    };

    // Calculate latency stats
    for (const [key, latencies] of this.metrics.latency) {
      if (latencies.length > 0) {
        const sorted = [...latencies].sort((a, b) => a - b);
        metrics.latency[key] = {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          count: latencies.length
        };
      }
    }

    return metrics;
  }

  // ═══════════════════════════════════════════════════════════
  // 🔌 CIRCUIT BREAKER
  // ═══════════════════════════════════════════════════════════

  _openCircuitBreaker(service, resetMs = 30000) {
    this.circuitBreaker.set(service, {
      open: true,
      openedAt: Date.now(),
      resetTime: Date.now() + resetMs
    });
    console.warn(`[Unified Connector] Circuit breaker OPEN for ${service}`);
  }

  _closeCircuitBreaker(service) {
    this.circuitBreaker.delete(service);
    console.log(`[Unified Connector] Circuit breaker CLOSED for ${service}`);
  }

  // ═══════════════════════════════════════════════════════════
  // 🛠️ UTILITIES
  // ═══════════════════════════════════════════════════════════

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service by name
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(name) {
    const service = this.services.get(name);
    return service && service.status === 'connected';
  }
}

// Singleton instance
const unifiedConnector = new UnifiedConnector();

module.exports = unifiedConnector;
