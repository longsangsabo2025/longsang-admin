/**
 * 🔌 IPC Handler
 * 
 * Inter-Process Communication between main and renderer.
 * Secure, typed, and well-organized.
 */

const { ipcMain, shell, dialog, app, BrowserWindow } = require('electron');
const { loggers } = require('./logger.cjs');
const { stores } = require('./store.cjs');
const { APP_INFO, URLS, PATHS } = require('./config.cjs');

const log = loggers.ipc;

// IPC Channel names
const CHANNELS = {
  // App
  APP_INFO: 'app:info',
  APP_QUIT: 'app:quit',
  APP_RESTART: 'app:restart',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
  
  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TOGGLE_FULLSCREEN: 'window:toggle-fullscreen',
  WINDOW_OPEN_DEVTOOLS: 'window:open-devtools',
  
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',
  
  // Services
  SERVICE_START: 'service:start',
  SERVICE_STOP: 'service:stop',
  SERVICE_STATUS: 'service:status',
  SERVICE_RESTART: 'service:restart',
  
  // Shell
  SHELL_OPEN_EXTERNAL: 'shell:open-external',
  SHELL_OPEN_PATH: 'shell:open-path',
  SHELL_SHOW_ITEM: 'shell:show-item',
  
  // Dialog
  DIALOG_MESSAGE: 'dialog:message',
  DIALOG_ERROR: 'dialog:error',
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_SAVE_FILE: 'dialog:save-file',
  
  // System
  SYSTEM_INFO: 'system:info',
  SYSTEM_PATHS: 'system:paths',
  
  // Notifications
  NOTIFICATION_SEND: 'notification:send',
};

// Service manager reference (set later)
let serviceManager = null;

function setServiceManager(manager) {
  serviceManager = manager;
}

// Initialize IPC handlers
function initIPC() {
  log.info('Initializing IPC handlers...');

  // ============================================================
  // APP HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.APP_INFO, () => {
    return {
      ...APP_INFO,
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    };
  });

  ipcMain.handle(CHANNELS.APP_QUIT, () => {
    app.quit();
  });

  ipcMain.handle(CHANNELS.APP_RESTART, () => {
    app.relaunch();
    app.quit();
  });

  // ============================================================
  // WINDOW HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
  });

  ipcMain.handle(CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
      return win.isMaximized();
    }
    return false;
  });

  ipcMain.handle(CHANNELS.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.close();
  });

  ipcMain.handle(CHANNELS.WINDOW_TOGGLE_FULLSCREEN, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setFullScreen(!win.isFullScreen());
      return win.isFullScreen();
    }
    return false;
  });

  ipcMain.handle(CHANNELS.WINDOW_OPEN_DEVTOOLS, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.webContents.toggleDevTools();
  });

  // ============================================================
  // SETTINGS HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.SETTINGS_GET, (event, key, defaultValue) => {
    return stores.settings.get(key, defaultValue);
  });

  ipcMain.handle(CHANNELS.SETTINGS_SET, (event, key, value) => {
    stores.settings.set(key, value);
    return true;
  });

  ipcMain.handle(CHANNELS.SETTINGS_GET_ALL, () => {
    return stores.settings.getAll();
  });

  // ============================================================
  // SERVICE HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.SERVICE_START, async (event, serviceName) => {
    if (!serviceManager) {
      log.error('Service manager not initialized');
      return { success: false, error: 'Service manager not initialized' };
    }
    try {
      await serviceManager.startService(serviceName);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(CHANNELS.SERVICE_STOP, async (event, serviceName) => {
    if (!serviceManager) {
      return { success: false, error: 'Service manager not initialized' };
    }
    try {
      await serviceManager.stopService(serviceName);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(CHANNELS.SERVICE_STATUS, async (event, serviceName) => {
    if (!serviceManager) {
      return { running: false };
    }
    return serviceManager.getServiceStatus(serviceName);
  });

  ipcMain.handle(CHANNELS.SERVICE_RESTART, async (event, serviceName) => {
    if (!serviceManager) {
      return { success: false, error: 'Service manager not initialized' };
    }
    try {
      await serviceManager.restartService(serviceName);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================================
  // SHELL HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.SHELL_OPEN_EXTERNAL, async (event, url) => {
    // Security: Only allow http/https URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await shell.openExternal(url);
      return true;
    }
    log.warn('Blocked non-http URL:', url);
    return false;
  });

  ipcMain.handle(CHANNELS.SHELL_OPEN_PATH, async (event, filePath) => {
    await shell.openPath(filePath);
    return true;
  });

  ipcMain.handle(CHANNELS.SHELL_SHOW_ITEM, async (event, filePath) => {
    shell.showItemInFolder(filePath);
    return true;
  });

  // ============================================================
  // DIALOG HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.DIALOG_MESSAGE, async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showMessageBox(win, options);
  });

  ipcMain.handle(CHANNELS.DIALOG_ERROR, async (event, title, content) => {
    dialog.showErrorBox(title, content);
  });

  ipcMain.handle(CHANNELS.DIALOG_OPEN_FILE, async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showOpenDialog(win, options);
  });

  ipcMain.handle(CHANNELS.DIALOG_SAVE_FILE, async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showSaveDialog(win, options);
  });

  // ============================================================
  // SYSTEM HANDLERS
  // ============================================================
  
  ipcMain.handle(CHANNELS.SYSTEM_INFO, () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  });

  ipcMain.handle(CHANNELS.SYSTEM_PATHS, () => {
    return {
      userData: PATHS.userData,
      logs: PATHS.logs,
      config: PATHS.config,
      cache: PATHS.cache,
    };
  });

  log.info('IPC handlers initialized');
}

// Cleanup IPC handlers
function cleanupIPC() {
  Object.values(CHANNELS).forEach(channel => {
    ipcMain.removeHandler(channel);
  });
  log.info('IPC handlers cleaned up');
}

module.exports = {
  CHANNELS,
  initIPC,
  cleanupIPC,
  setServiceManager,
};
