/**
 * 🚀 Service Manager
 * 
 * Manages external services like n8n, API server, etc.
 * Features: auto-start, health checks, restart on crash.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const http = require('http');
const { EventEmitter } = require('events');
const { SERVICES, PATHS, PORTS, isDev } = require('./config.cjs');
const { loggers } = require('./logger.cjs');
const { stores } = require('./store.cjs');

const log = loggers.service;

// Service status enum
const ServiceStatus = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error',
};

class Service extends EventEmitter {
  constructor(name, config) {
    super();
    this.name = name;
    this.config = config;
    this.process = null;
    this.status = ServiceStatus.STOPPED;
    this.port = config.port;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 3;
    this.lastError = null;
  }

  async start() {
    if (this.status === ServiceStatus.RUNNING || this.status === ServiceStatus.STARTING) {
      log.warn(`Service ${this.name} already running/starting`);
      return;
    }

    // Check if already running on port FIRST
    const isPortInUse = await this._checkPort();
    if (isPortInUse) {
      log.info(`Service ${this.name} already running on port ${this.port}`);
      this.status = ServiceStatus.RUNNING;
      this.restartAttempts = 0; // Reset restart counter
      this.emit('status-change', this.status);
      return; // Don't spawn - service is already running
    }

    this.status = ServiceStatus.STARTING;
    this.emit('status-change', this.status);
    log.info(`Starting service: ${this.name}`);

    return this._spawn();
  }

  async _spawn() {
    throw new Error('Must implement _spawn in subclass');
  }

  async stop() {
    if (this.status === ServiceStatus.STOPPED) {
      log.warn(`Service ${this.name} already stopped`);
      return;
    }

    this.status = ServiceStatus.STOPPING;
    this.emit('status-change', this.status);
    log.info(`Stopping service: ${this.name}`);

    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }

    this.status = ServiceStatus.STOPPED;
    this.emit('status-change', this.status);
  }

  async restart() {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  async _checkPort() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        method: 'GET',
        timeout: 1000,
      }, (res) => {
        resolve(true);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  }

  async healthCheck() {
    return this._checkPort();
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      port: this.port,
      running: this.status === ServiceStatus.RUNNING,
      lastError: this.lastError,
    };
  }
}

// ============================================================
// N8N SERVICE
// ============================================================

class N8nService extends Service {
  constructor() {
    super('n8n', SERVICES.n8n);
  }

  async _spawn() {
    return new Promise((resolve, reject) => {
      this.process = spawn('n8n', ['start'], {
        shell: true,
        detached: false,
        stdio: 'pipe',
        env: {
          ...process.env,
          ...this.config.env,
        },
      });

      let resolved = false;

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        log.debug(`[n8n] ${output.trim()}`);
        
        if (output.includes('Editor is now accessible') && !resolved) {
          resolved = true;
          this.status = ServiceStatus.RUNNING;
          this.restartAttempts = 0;
          this.emit('status-change', this.status);
          log.info('n8n is ready');
          resolve();
        }
      });

      this.process.stderr.on('data', (data) => {
        const error = data.toString();
        log.warn(`[n8n error] ${error.trim()}`);
      });

      this.process.on('error', (err) => {
        this.lastError = err.message;
        this.status = ServiceStatus.ERROR;
        this.emit('status-change', this.status);
        log.error('n8n process error:', err);
        if (!resolved) reject(err);
      });

      this.process.on('close', (code) => {
        if (this.status !== ServiceStatus.STOPPING) {
          this.status = ServiceStatus.STOPPED;
          this.emit('status-change', this.status);
          log.warn(`n8n process exited with code ${code}`);
          
          // Auto-restart if crash
          if (this.restartAttempts < this.maxRestartAttempts) {
            this.restartAttempts++;
            log.info(`Auto-restarting n8n (attempt ${this.restartAttempts})`);
            setTimeout(() => this.start(), 3000);
          }
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.status = ServiceStatus.RUNNING;
          this.emit('status-change', this.status);
          resolve();
        }
      }, this.config.startupTimeout);
    });
  }
}

// ============================================================
// VITE DEV SERVER
// ============================================================

class ViteService extends Service {
  constructor() {
    super('vite', SERVICES.vite);
    this.actualPort = PORTS.vite;
  }

  async _spawn() {
    return new Promise((resolve, reject) => {
      this.process = spawn('npm', ['run', 'dev:frontend'], {
        shell: true,
        cwd: PATHS.root,
        stdio: 'pipe',
        env: process.env,
      });

      let resolved = false;

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        log.debug(`[Vite] ${output.trim()}`);
        
        // Detect actual port
        const portMatch = output.match(/localhost:(\d+)/);
        if (portMatch) {
          this.actualPort = parseInt(portMatch[1], 10);
          this.port = this.actualPort;
        }
        
        if ((output.includes('ready') || output.includes('Local:')) && !resolved) {
          resolved = true;
          this.status = ServiceStatus.RUNNING;
          this.emit('status-change', this.status);
          log.info(`Vite is ready on port ${this.actualPort}`);
          resolve();
        }
      });

      this.process.stderr.on('data', (data) => {
        log.warn(`[Vite error] ${data.toString().trim()}`);
      });

      this.process.on('error', (err) => {
        this.lastError = err.message;
        this.status = ServiceStatus.ERROR;
        this.emit('status-change', this.status);
        if (!resolved) reject(err);
      });

      this.process.on('close', (code) => {
        if (this.status !== ServiceStatus.STOPPING) {
          this.status = ServiceStatus.STOPPED;
          this.emit('status-change', this.status);
          log.warn(`Vite process exited with code ${code}`);
        }
      });

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.status = ServiceStatus.RUNNING;
          this.emit('status-change', this.status);
          resolve();
        }
      }, this.config.startupTimeout);
    });
  }

  getActualPort() {
    return this.actualPort;
  }
}

// ============================================================
// SERVICE MANAGER
// ============================================================

class ServiceManager extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    
    // Register services
    if (SERVICES.n8n.enabled) {
      this.services.set('n8n', new N8nService());
    }
    if (SERVICES.vite.enabled && isDev) {
      this.services.set('vite', new ViteService());
    }

    // Forward status events
    this.services.forEach((service, name) => {
      service.on('status-change', (status) => {
        this.emit('service-status-change', { name, status });
        // Persist status
        stores.services.set(`${name}.lastStatus`, status);
      });
    });
  }

  async startAll() {
    log.info('Starting all services...');
    const promises = [];
    
    this.services.forEach((service, name) => {
      if (service.config.autoStart) {
        promises.push(
          service.start().catch(err => {
            log.error(`Failed to start ${name}:`, err);
          })
        );
      }
    });

    await Promise.allSettled(promises);
    log.info('All services started');
  }

  async stopAll() {
    log.info('Stopping all services...');
    const promises = [];
    
    this.services.forEach((service) => {
      promises.push(service.stop());
    });

    await Promise.allSettled(promises);
    log.info('All services stopped');
  }

  async startService(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    return service.start();
  }

  async stopService(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    return service.stop();
  }

  async restartService(name) {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    return service.restart();
  }

  getServiceStatus(name) {
    const service = this.services.get(name);
    if (!service) return { name, status: ServiceStatus.STOPPED, running: false };
    return service.getStatus();
  }

  getAllStatuses() {
    const statuses = {};
    this.services.forEach((service, name) => {
      statuses[name] = service.getStatus();
    });
    return statuses;
  }

  getService(name) {
    return this.services.get(name);
  }
}

// Singleton instance
const serviceManager = new ServiceManager();

module.exports = {
  ServiceStatus,
  Service,
  N8nService,
  ViteService,
  ServiceManager,
  serviceManager,
};
