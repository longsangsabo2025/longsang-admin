/**
 * 💾 Persistent Storage
 * 
 * Simple key-value store with file persistence.
 * Used for app settings, window state, preferences.
 */

const fs = require('fs');
const path = require('path');
const { PATHS } = require('./config.cjs');
const { loggers } = require('./logger.cjs');

const log = loggers.main.child('store');

class Store {
  constructor(options = {}) {
    this.name = options.name || 'settings';
    this.defaults = options.defaults || {};
    this.filePath = path.join(PATHS.config, `${this.name}.json`);
    this.data = {};
    
    this._init();
  }

  _init() {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(PATHS.config)) {
        fs.mkdirSync(PATHS.config, { recursive: true });
      }

      // Load existing data or create with defaults
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        log.debug(`Loaded store: ${this.name}`, { keys: Object.keys(this.data) });
      } else {
        this.data = { ...this.defaults };
        this._save();
        log.info(`Created store: ${this.name}`);
      }
    } catch (err) {
      log.error(`Failed to load store: ${this.name}`, err);
      this.data = { ...this.defaults };
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
      log.trace(`Saved store: ${this.name}`);
    } catch (err) {
      log.error(`Failed to save store: ${this.name}`, err);
    }
  }

  // Get value by key (supports dot notation)
  get(key, defaultValue = undefined) {
    if (!key) return this.data;
    
    const keys = key.split('.');
    let value = this.data;
    
    for (const k of keys) {
      if (value === undefined || value === null) return defaultValue;
      value = value[k];
    }
    
    return value !== undefined ? value : defaultValue;
  }

  // Set value by key (supports dot notation)
  set(key, value) {
    if (!key) return;
    
    const keys = key.split('.');
    let obj = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (typeof obj[k] !== 'object') obj[k] = {};
      obj = obj[k];
    }
    
    obj[keys[keys.length - 1]] = value;
    this._save();
  }

  // Delete key
  delete(key) {
    if (!key) return;
    
    const keys = key.split('.');
    let obj = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (typeof obj[k] !== 'object') return;
      obj = obj[k];
    }
    
    delete obj[keys[keys.length - 1]];
    this._save();
  }

  // Check if key exists
  has(key) {
    return this.get(key) !== undefined;
  }

  // Clear all data
  clear() {
    this.data = {};
    this._save();
    log.info(`Cleared store: ${this.name}`);
  }

  // Get all data
  getAll() {
    return { ...this.data };
  }

  // Merge data
  merge(obj) {
    this.data = { ...this.data, ...obj };
    this._save();
  }
}

// Pre-defined stores
const stores = {
  // App settings
  settings: new Store({
    name: 'settings',
    defaults: {
      theme: 'dark',
      language: 'vi',
      notifications: true,
      startMinimized: false,
      closeToTray: true,
      autoStart: false,
      devTools: true,
    },
  }),

  // Window state
  windowState: new Store({
    name: 'window-state',
    defaults: {
      width: 1400,
      height: 900,
      x: undefined,
      y: undefined,
      isMaximized: false,
    },
  }),

  // Service states
  services: new Store({
    name: 'services',
    defaults: {
      n8n: { autoStart: true, lastStatus: null },
      api: { autoStart: true, lastStatus: null },
    },
  }),

  // Recent items
  recent: new Store({
    name: 'recent',
    defaults: {
      projects: [],
      workflows: [],
      agents: [],
    },
  }),

  // User preferences
  preferences: new Store({
    name: 'preferences',
    defaults: {
      dashboard: {
        widgets: ['stats', 'projects', 'workflows', 'agents'],
        layout: 'grid',
      },
      sidebar: {
        collapsed: false,
        width: 240,
      },
    },
  }),
};

module.exports = {
  Store,
  stores,
};
