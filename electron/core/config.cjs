/**
 * 🔧 Desktop App Configuration
 * 
 * Centralized configuration for the entire desktop application.
 * All settings in one place for easy management.
 */

const path = require('path');
const os = require('os');

// Determine environment
const isDev = process.env.NODE_ENV !== 'production';

// App Info
const APP_INFO = {
  name: 'LongSang Admin',
  id: 'com.longsang.admin',
  version: '1.0.0',
  description: 'Master Admin Dashboard - AI-Powered Business Automation',
  author: 'LongSang Team',
  website: 'https://longsang.com',
  github: 'https://github.com/longsang/long-sang-forge',
};

// Paths
const PATHS = {
  // App directories
  root: path.join(__dirname, '../..'),
  electron: path.join(__dirname, '..'),
  dist: path.join(__dirname, '../../dist'),
  
  // Data directories
  userData: isDev 
    ? path.join(__dirname, '../../.electron-data')
    : path.join(os.homedir(), '.longsang-admin'),
  logs: isDev 
    ? path.join(__dirname, '../../.electron-data/logs')
    : path.join(os.homedir(), '.longsang-admin/logs'),
  config: isDev 
    ? path.join(__dirname, '../../.electron-data/config')
    : path.join(os.homedir(), '.longsang-admin/config'),
  cache: isDev 
    ? path.join(__dirname, '../../.electron-data/cache')
    : path.join(os.homedir(), '.longsang-admin/cache'),
    
  // Assets
  icon: path.join(__dirname, '../assets/icon.png'),
  trayIcon: path.join(__dirname, '../assets/tray-icon.png'),
};

// Ports
const PORTS = {
  vite: 8080,
  api: 3001,
  n8n: 5678,
  analytics: 3002,
};

// Services Configuration
const SERVICES = {
  n8n: {
    enabled: true,
    autoStart: true,
    port: PORTS.n8n,
    healthCheckUrl: `http://localhost:${PORTS.n8n}/healthz`,
    editorUrl: `http://localhost:${PORTS.n8n}`,
    startupTimeout: 30000, // 30 seconds
    env: {
      N8N_RUNNERS_ENABLED: 'true',
      DB_SQLITE_POOL_SIZE: '5',
      N8N_METRICS: 'true',
      // Fix deprecation warnings
      N8N_BLOCK_ENV_ACCESS_IN_NODE: 'false', // Allow env access in Code Node
      N8N_GIT_NODE_DISABLE_BARE_REPOS: 'true', // Disable bare repos for security
    },
  },
  vite: {
    enabled: isDev,
    autoStart: isDev, // Auto-start only in dev mode
    port: PORTS.vite,
    startupTimeout: 15000,
  },
  api: {
    enabled: true,
    port: PORTS.api,
    startupTimeout: 10000,
  },
};

// Window Configuration
const WINDOW = {
  main: {
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    center: true,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0a',
  },
  splash: {
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
  },
};

// Web Preferences (Security)
const WEB_PREFERENCES = {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  devTools: isDev || true, // Always allow in this app
  spellcheck: true,
  enableRemoteModule: false,
  allowRunningInsecureContent: false,
};

// Auto-Update Configuration
const AUTO_UPDATE = {
  enabled: !isDev,
  checkOnStartup: true,
  checkInterval: 4 * 60 * 60 * 1000, // 4 hours
  allowPrerelease: false,
  feedUrl: 'https://releases.longsang.com/admin',
};

// Logging Configuration
const LOGGING = {
  enabled: true,
  level: isDev ? 'debug' : 'info',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  format: 'json',
};

// Tray Configuration
const TRAY = {
  enabled: true,
  showOnStartup: true,
  tooltip: APP_INFO.name,
  closeToTray: true,
  minimizeToTray: true,
};

// Keyboard Shortcuts (Global)
const SHORTCUTS = {
  showWindow: 'CommandOrControl+Shift+L',
  devTools: 'F12',
  reload: 'CommandOrControl+R',
  forceReload: 'CommandOrControl+Shift+R',
  quit: 'CommandOrControl+Q',
};

// External URLs
const URLS = {
  supabase: 'https://app.supabase.com/project/diexsbzqwsbpilsymnfb',
  github: 'https://github.com/longsang/long-sang-forge',
  docs: 'https://docs.longsang.com',
  support: 'https://support.longsang.com',
};

module.exports = {
  isDev,
  APP_INFO,
  PATHS,
  PORTS,
  SERVICES,
  WINDOW,
  WEB_PREFERENCES,
  AUTO_UPDATE,
  LOGGING,
  TRAY,
  SHORTCUTS,
  URLS,
};
