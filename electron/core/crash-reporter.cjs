/**
 * 💥 Crash Reporter
 * 
 * Handles application crashes and sends reports to the Bug System.
 * Integrates with Supabase to store crash data.
 */

const { crashReporter, app, dialog } = require('electron');
const { isDev, APP_INFO, PATHS } = require('./config.cjs');
const { loggers } = require('./logger.cjs');
const fs = require('fs');
const path = require('path');

const log = loggers.main;

class CrashReporterManager {
  constructor() {
    this.crashesDir = path.join(PATHS.userData, 'crashes');
    this.recentCrashes = [];
  }

  /**
   * Initialize crash reporter
   */
  init() {
    // Ensure crashes directory exists
    if (!fs.existsSync(this.crashesDir)) {
      fs.mkdirSync(this.crashesDir, { recursive: true });
    }

    // Start Electron's built-in crash reporter (disabled for now - needs server)
    // crashReporter.start({
    //   productName: APP_INFO.name,
    //   companyName: 'LongSang',
    //   submitURL: 'https://api.longsang.com/crash-reports',
    //   uploadToServer: !isDev,
    // });

    // Set up custom crash handling
    this._setupProcessHandlers();

    log.info('Crash reporter initialized');
  }

  /**
   * Set up process error handlers
   */
  _setupProcessHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this._handleCrash('uncaughtException', error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this._handleCrash('unhandledRejection', error, { promise: String(promise) });
    });

    // Handle renderer process crashes
    app.on('render-process-gone', (event, webContents, details) => {
      this._handleCrash('renderProcessGone', new Error(details.reason), {
        exitCode: details.exitCode,
      });
    });

    // Handle GPU process crashes
    app.on('child-process-gone', (event, details) => {
      if (details.type === 'GPU') {
        this._handleCrash('gpuProcessGone', new Error(details.reason), {
          exitCode: details.exitCode,
        });
      }
    });
  }

  /**
   * Handle a crash event
   */
  _handleCrash(type, error, extra = {}) {
    const crashReport = {
      id: this._generateId(),
      type,
      timestamp: new Date().toISOString(),
      app: {
        name: APP_INFO.name,
        version: APP_INFO.version,
        environment: isDev ? 'development' : 'production',
      },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
      },
      extra,
    };

    log.error(`💥 Crash detected [${type}]:`, error.message);
    log.debug('Full crash report:', crashReport);

    // Save crash to file
    this._saveCrashToFile(crashReport);

    // Keep in memory (limit to 10)
    this.recentCrashes.unshift(crashReport);
    if (this.recentCrashes.length > 10) {
      this.recentCrashes.pop();
    }

    // Try to send to Bug System (async, non-blocking)
    this._sendToBugSystem(crashReport).catch((err) => {
      log.warn('Failed to send crash report to Bug System:', err.message);
    });

    // Show dialog for critical crashes
    if (type === 'uncaughtException' && !isDev) {
      this._showCrashDialog(crashReport);
    }
  }

  /**
   * Save crash report to file
   */
  _saveCrashToFile(report) {
    try {
      const filename = `crash-${report.id}.json`;
      const filepath = path.join(this.crashesDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      log.info(`Crash report saved: ${filename}`);

      // Cleanup old crash files (keep last 50)
      this._cleanupOldCrashes();
    } catch (err) {
      log.error('Failed to save crash report:', err);
    }
  }

  /**
   * Send crash report to Bug System
   */
  async _sendToBugSystem(report) {
    // Use native fetch or https module
    const https = require('https');
    const data = JSON.stringify({
      error_type: 'desktop_crash',
      error_message: `[${report.type}] ${report.error.message}`,
      stack_trace: report.error.stack,
      user_agent: `Electron/${process.versions.electron}`,
      url: 'electron://main-process',
      severity: report.type === 'uncaughtException' ? 'critical' : 'high',
      metadata: {
        app: report.app,
        system: report.system,
        extra: report.extra,
      },
    });

    // For now, just log (no server to send to)
    log.info('Would send crash report to Bug System:', report.id);
    
    // TODO: Implement when Bug System API is available
    // return new Promise((resolve, reject) => {
    //   const req = https.request({
    //     hostname: 'localhost',
    //     port: 3001,
    //     path: '/api/bug-system/errors',
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   }, (res) => {
    //     if (res.statusCode >= 200 && res.statusCode < 300) {
    //       resolve();
    //     } else {
    //       reject(new Error(`Status: ${res.statusCode}`));
    //     }
    //   });
    //   req.on('error', reject);
    //   req.write(data);
    //   req.end();
    // });
  }

  /**
   * Show crash dialog to user
   */
  _showCrashDialog(report) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Application Error',
      message: 'LongSang Admin encountered an unexpected error',
      detail: `Error: ${report.error.message}\n\nA crash report has been saved. The application will try to recover.`,
      buttons: ['Restart App', 'Close'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        app.relaunch();
        app.exit(0);
      }
    }).catch(() => {
      // Dialog failed, just log
      log.error('Failed to show crash dialog');
    });
  }

  /**
   * Cleanup old crash files
   */
  _cleanupOldCrashes() {
    try {
      const files = fs.readdirSync(this.crashesDir)
        .filter((f) => f.startsWith('crash-') && f.endsWith('.json'))
        .map((f) => ({
          name: f,
          path: path.join(this.crashesDir, f),
          time: fs.statSync(path.join(this.crashesDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only last 50 crash files
      files.slice(50).forEach((f) => {
        fs.unlinkSync(f.path);
        log.debug(`Deleted old crash file: ${f.name}`);
      });
    } catch (err) {
      log.warn('Failed to cleanup crash files:', err.message);
    }
  }

  /**
   * Generate unique crash ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get recent crashes
   */
  getRecentCrashes() {
    return this.recentCrashes;
  }

  /**
   * Get all crash files
   */
  getAllCrashFiles() {
    try {
      return fs.readdirSync(this.crashesDir)
        .filter((f) => f.startsWith('crash-') && f.endsWith('.json'))
        .map((f) => {
          const filepath = path.join(this.crashesDir, f);
          const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
          return content;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      log.error('Failed to read crash files:', err);
      return [];
    }
  }
}

// Singleton
const crashReporterManager = new CrashReporterManager();

module.exports = {
  CrashReporterManager,
  crashReporterManager,
};
