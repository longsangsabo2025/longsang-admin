/**
 * 📝 Logging System
 * 
 * Centralized logging for the desktop app.
 * Supports multiple transports: console, file, remote.
 */

const fs = require('fs');
const path = require('path');
const { PATHS, LOGGING, APP_INFO } = require('./config.cjs');

// Log Levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// ANSI Colors for console
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// Level Colors
const LEVEL_COLORS = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.green,
  debug: COLORS.cyan,
  trace: COLORS.gray,
};

// Emoji prefixes
const LEVEL_EMOJI = {
  error: '❌',
  warn: '⚠️',
  info: '✅',
  debug: '🔍',
  trace: '📋',
};

class Logger {
  constructor(options = {}) {
    this.namespace = options.namespace || 'app';
    this.level = LOG_LEVELS[options.level || LOGGING.level] || LOG_LEVELS.info;
    this.logFile = null;
    this.logStream = null;
    
    // Initialize log directory and file
    this._initLogFile();
  }

  _initLogFile() {
    if (!LOGGING.enabled) return;

    try {
      // Ensure log directory exists
      if (!fs.existsSync(PATHS.logs)) {
        fs.mkdirSync(PATHS.logs, { recursive: true });
      }

      // Create log file name with date
      const date = new Date().toISOString().split('T')[0];
      this.logFile = path.join(PATHS.logs, `${APP_INFO.id}-${date}.log`);

      // Create write stream
      this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    } catch (err) {
      console.error('Failed to initialize log file:', err);
    }
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const emoji = LEVEL_EMOJI[level];
    const color = LEVEL_COLORS[level];
    
    // Console format (colorful)
    const consoleMsg = `${color}${emoji} [${timestamp}] [${this.namespace}] ${message}${COLORS.reset}`;
    
    // File format (JSON)
    const fileMsg = JSON.stringify({
      timestamp,
      level,
      namespace: this.namespace,
      message,
      data: data || null,
    });

    return { consoleMsg, fileMsg };
  }

  _log(level, message, data) {
    if (!this._shouldLog(level)) return;

    const { consoleMsg, fileMsg } = this._formatMessage(level, message, data);

    // Console output
    if (level === 'error') {
      console.error(consoleMsg, data ? data : '');
    } else if (level === 'warn') {
      console.warn(consoleMsg, data ? data : '');
    } else {
      console.log(consoleMsg, data ? data : '');
    }

    // File output
    if (this.logStream) {
      this.logStream.write(fileMsg + '\n');
    }
  }

  // Public logging methods
  error(message, data) {
    this._log('error', message, data);
  }

  warn(message, data) {
    this._log('warn', message, data);
  }

  info(message, data) {
    this._log('info', message, data);
  }

  debug(message, data) {
    this._log('debug', message, data);
  }

  trace(message, data) {
    this._log('trace', message, data);
  }

  // Create child logger with namespace
  child(namespace) {
    return new Logger({
      namespace: `${this.namespace}:${namespace}`,
      level: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === this.level),
    });
  }

  // Close log stream
  close() {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}

// Default logger instance
const logger = new Logger({ namespace: 'main' });

// Named loggers for different modules
const loggers = {
  main: logger,
  window: logger.child('window'),
  service: logger.child('service'),
  ipc: logger.child('ipc'),
  tray: logger.child('tray'),
  update: logger.child('update'),
};

module.exports = {
  Logger,
  logger,
  loggers,
};
