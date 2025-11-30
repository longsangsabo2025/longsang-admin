/**
 * 🔐 Preload Script
 * 
 * Secure bridge between main and renderer processes.
 * Exposes only necessary APIs via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// IPC Channel names (must match ipc-handler.cjs)
const CHANNELS = {
  // App
  APP_INFO: 'app:info',
  APP_QUIT: 'app:quit',
  APP_RESTART: 'app:restart',
  
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
};

// Expose secure APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================================
  // APP
  // ============================================================
  
  /** Get app info (name, version, etc.) */
  getAppInfo: () => ipcRenderer.invoke(CHANNELS.APP_INFO),
  
  /** Quit the application */
  quit: () => ipcRenderer.invoke(CHANNELS.APP_QUIT),
  
  /** Restart the application */
  restart: () => ipcRenderer.invoke(CHANNELS.APP_RESTART),
  
  // ============================================================
  // WINDOW
  // ============================================================
  
  /** Minimize the current window */
  minimize: () => ipcRenderer.invoke(CHANNELS.WINDOW_MINIMIZE),
  
  /** Maximize/restore the current window */
  maximize: () => ipcRenderer.invoke(CHANNELS.WINDOW_MAXIMIZE),
  
  /** Close the current window */
  close: () => ipcRenderer.invoke(CHANNELS.WINDOW_CLOSE),
  
  /** Toggle fullscreen mode */
  toggleFullscreen: () => ipcRenderer.invoke(CHANNELS.WINDOW_TOGGLE_FULLSCREEN),
  
  /** Open DevTools */
  openDevTools: () => ipcRenderer.invoke(CHANNELS.WINDOW_OPEN_DEVTOOLS),
  
  // ============================================================
  // SETTINGS
  // ============================================================
  
  settings: {
    /** Get a setting value */
    get: (key, defaultValue) => ipcRenderer.invoke(CHANNELS.SETTINGS_GET, key, defaultValue),
    
    /** Set a setting value */
    set: (key, value) => ipcRenderer.invoke(CHANNELS.SETTINGS_SET, key, value),
    
    /** Get all settings */
    getAll: () => ipcRenderer.invoke(CHANNELS.SETTINGS_GET_ALL),
  },
  
  // ============================================================
  // SERVICES
  // ============================================================
  
  services: {
    /** Start a service */
    start: (name) => ipcRenderer.invoke(CHANNELS.SERVICE_START, name),
    
    /** Stop a service */
    stop: (name) => ipcRenderer.invoke(CHANNELS.SERVICE_STOP, name),
    
    /** Get service status */
    status: (name) => ipcRenderer.invoke(CHANNELS.SERVICE_STATUS, name),
    
    /** Restart a service */
    restart: (name) => ipcRenderer.invoke(CHANNELS.SERVICE_RESTART, name),
  },
  
  // ============================================================
  // SHELL
  // ============================================================
  
  shell: {
    /** Open URL in default browser */
    openExternal: (url) => ipcRenderer.invoke(CHANNELS.SHELL_OPEN_EXTERNAL, url),
    
    /** Open file/folder with default app */
    openPath: (path) => ipcRenderer.invoke(CHANNELS.SHELL_OPEN_PATH, path),
    
    /** Show file in file manager */
    showItem: (path) => ipcRenderer.invoke(CHANNELS.SHELL_SHOW_ITEM, path),
  },
  
  // ============================================================
  // DIALOG
  // ============================================================
  
  dialog: {
    /** Show message box */
    message: (options) => ipcRenderer.invoke(CHANNELS.DIALOG_MESSAGE, options),
    
    /** Show error dialog */
    error: (title, content) => ipcRenderer.invoke(CHANNELS.DIALOG_ERROR, title, content),
    
    /** Show open file dialog */
    openFile: (options) => ipcRenderer.invoke(CHANNELS.DIALOG_OPEN_FILE, options),
    
    /** Show save file dialog */
    saveFile: (options) => ipcRenderer.invoke(CHANNELS.DIALOG_SAVE_FILE, options),
  },
  
  // ============================================================
  // SYSTEM
  // ============================================================
  
  system: {
    /** Get system info */
    info: () => ipcRenderer.invoke(CHANNELS.SYSTEM_INFO),
    
    /** Get app paths */
    paths: () => ipcRenderer.invoke(CHANNELS.SYSTEM_PATHS),
  },
  
  // ============================================================
  // EVENTS (Two-way communication)
  // ============================================================
  
  /** Subscribe to events from main process */
  on: (channel, callback) => {
    const validChannels = [
      'service-status-change',
      'notification',
      'update-available',
      'update-downloaded',
    ];
    
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    
    console.warn(`Invalid channel: ${channel}`);
    return () => {};
  },
  
  /** Remove event listener */
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});

// Also expose platform info
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  arch: process.arch,
});

console.log('🔐 Preload script loaded - electronAPI exposed');
