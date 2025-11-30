/**
 * 🔄 Auto-Updater
 * 
 * Handles automatic application updates using electron-updater.
 * In development mode, update checks are disabled.
 */

const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow } = require('electron');
const { AUTO_UPDATE, isDev, APP_INFO } = require('./config.cjs');
const { loggers } = require('./logger.cjs');

const log = loggers.main;

class UpdateManager {
  constructor() {
    this.isChecking = false;
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.updateInfo = null;
  }

  /**
   * Initialize auto-updater
   */
  init() {
    if (isDev) {
      log.info('Auto-updater disabled in development mode');
      return;
    }

    if (!AUTO_UPDATE.enabled) {
      log.info('Auto-updater is disabled in config');
      return;
    }

    // Configure auto-updater
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = AUTO_UPDATE.allowPrerelease;

    // Set up event handlers
    this._setupEventHandlers();

    // Check for updates on startup
    if (AUTO_UPDATE.checkOnStartup) {
      setTimeout(() => {
        this.checkForUpdates(true);
      }, 5000); // Wait 5 seconds after app start
    }

    // Set up periodic update checks
    if (AUTO_UPDATE.checkInterval > 0) {
      setInterval(() => {
        this.checkForUpdates(true);
      }, AUTO_UPDATE.checkInterval);
    }

    log.info('Auto-updater initialized');
  }

  /**
   * Set up auto-updater event handlers
   */
  _setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.isChecking = true;
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version);
      this.isChecking = false;
      this.updateAvailable = true;
      this.updateInfo = info;
      
      this._showUpdateAvailableDialog(info);
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('No update available. Current version is up to date.');
      this.isChecking = false;
      this.updateAvailable = false;
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Download speed: ${this._formatBytes(progressObj.bytesPerSecond)}/s - ` +
        `Downloaded ${progressObj.percent.toFixed(1)}% ` +
        `(${this._formatBytes(progressObj.transferred)}/${this._formatBytes(progressObj.total)})`;
      log.info(logMessage);
      
      // Send progress to renderer
      this._sendToWindow('update-download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version);
      this.updateDownloaded = true;
      this.updateInfo = info;
      
      this._showUpdateDownloadedDialog(info);
    });

    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
      this.isChecking = false;
      
      // Don't show error dialog for network errors in silent mode
      if (!error.message.includes('net::')) {
        this._showErrorDialog(error);
      }
    });
  }

  /**
   * Check for updates
   * @param {boolean} silent - If true, don't show "no update" dialog
   */
  async checkForUpdates(silent = false) {
    if (isDev) {
      if (!silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Development Mode',
          message: 'Auto-updates are disabled in development mode.',
        });
      }
      return;
    }

    if (this.isChecking) {
      log.warn('Already checking for updates');
      return;
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      
      if (!result && !silent) {
        dialog.showMessageBox({
          type: 'info',
          title: 'No Updates',
          message: `${APP_INFO.name} is up to date!`,
          detail: `Current version: ${APP_INFO.version}`,
        });
      }
    } catch (error) {
      log.error('Error checking for updates:', error);
      if (!silent) {
        this._showErrorDialog(error);
      }
    }
  }

  /**
   * Install update and restart app
   */
  quitAndInstall() {
    if (this.updateDownloaded) {
      log.info('Installing update and restarting...');
      autoUpdater.quitAndInstall(false, true);
    } else {
      log.warn('No update downloaded yet');
    }
  }

  /**
   * Show dialog when update is available
   */
  _showUpdateAvailableDialog(info) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version of ${APP_INFO.name} is available!`,
      detail: `Version ${info.version} is now available.\n\nThe update will be downloaded automatically.`,
      buttons: ['OK'],
    });
  }

  /**
   * Show dialog when update is downloaded
   */
  _showUpdateDownloadedDialog(info) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded!',
      detail: `Version ${info.version} has been downloaded.\n\nRestart the application to apply the update.`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        this.quitAndInstall();
      }
    });
  }

  /**
   * Show error dialog
   */
  _showErrorDialog(error) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Error',
      message: 'Failed to check for updates',
      detail: error.message,
    });
  }

  /**
   * Send message to main window
   */
  _sendToWindow(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }

  /**
   * Format bytes to human readable string
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get current update status
   */
  getStatus() {
    return {
      isChecking: this.isChecking,
      updateAvailable: this.updateAvailable,
      updateDownloaded: this.updateDownloaded,
      updateInfo: this.updateInfo,
      currentVersion: APP_INFO.version,
    };
  }
}

// Singleton
const updateManager = new UpdateManager();

module.exports = {
  UpdateManager,
  updateManager,
};
