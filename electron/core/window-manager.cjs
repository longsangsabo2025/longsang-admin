/**
 * 🪟 Window Manager
 * 
 * Manages application windows with state persistence.
 */

const { BrowserWindow, screen } = require('electron');
const { WINDOW, WEB_PREFERENCES, PATHS, isDev, PORTS } = require('./config.cjs');
const { loggers } = require('./logger.cjs');
const { stores } = require('./store.cjs');

const log = loggers.window;

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.mainWindow = null;
  }

  createMainWindow(vitePort = PORTS.vite) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    // Get saved window state
    const savedState = stores.windowState.getAll();
    
    // Validate bounds are on screen
    const bounds = this._validateBounds(savedState);

    log.info('Creating main window', bounds);

    this.mainWindow = new BrowserWindow({
      ...WINDOW.main,
      ...bounds,
      title: 'LongSang Admin',
      icon: PATHS.icon,
      webPreferences: {
        ...WEB_PREFERENCES,
        preload: require('path').join(__dirname, '../preload.cjs'),
      },
      show: false,
    });

    // Load URL
    const url = isDev 
      ? `http://localhost:${vitePort}`
      : `file://${PATHS.dist}/index.html`;
    
    log.info(`Loading URL: ${url}`);
    this.mainWindow.loadURL(url);

    // Set Content Security Policy to suppress Electron warning
    // In dev mode, we need eval for Vite HMR
    this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            isDev
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* https:; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:* ws://localhost:* https:;"
              : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https:;"
          ]
        }
      });
    });

    // Show when ready
    this.mainWindow.once('ready-to-show', () => {
      if (savedState.isMaximized) {
        this.mainWindow.maximize();
      }
      this.mainWindow.show();
      
      // Open DevTools in dev mode
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Track window state changes
    this._trackWindowState();

    // Handle close
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      this.windows.delete('main');
    });

    this.windows.set('main', this.mainWindow);
    return this.mainWindow;
  }

  _validateBounds(state) {
    const displays = screen.getAllDisplays();
    let isOnScreen = false;

    // Check if saved position is on any display
    if (state.x !== undefined && state.y !== undefined) {
      for (const display of displays) {
        const { x, y, width, height } = display.bounds;
        if (
          state.x >= x && 
          state.x < x + width &&
          state.y >= y && 
          state.y < y + height
        ) {
          isOnScreen = true;
          break;
        }
      }
    }

    if (isOnScreen) {
      return {
        x: state.x,
        y: state.y,
        width: state.width || WINDOW.main.width,
        height: state.height || WINDOW.main.height,
      };
    }

    // Default: center on primary display
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const width = state.width || WINDOW.main.width;
    const height = state.height || WINDOW.main.height;

    return {
      width,
      height,
      x: Math.floor((screenWidth - width) / 2),
      y: Math.floor((screenHeight - height) / 2),
    };
  }

  _trackWindowState() {
    if (!this.mainWindow) return;

    const saveState = () => {
      if (this.mainWindow.isDestroyed()) return;
      
      const bounds = this.mainWindow.getBounds();
      stores.windowState.merge({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: this.mainWindow.isMaximized(),
      });
    };

    // Debounce save
    let saveTimeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveState, 500);
    };

    this.mainWindow.on('resize', debouncedSave);
    this.mainWindow.on('move', debouncedSave);
    this.mainWindow.on('maximize', saveState);
    this.mainWindow.on('unmaximize', saveState);
  }

  createSplashWindow() {
    const splash = new BrowserWindow({
      ...WINDOW.splash,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      center: true,
    });

    // Load splash HTML
    splash.loadFile(require('path').join(__dirname, '../assets/splash.html'));
    
    this.windows.set('splash', splash);
    return splash;
  }

  closeSplash() {
    const splash = this.windows.get('splash');
    if (splash && !splash.isDestroyed()) {
      splash.close();
    }
    this.windows.delete('splash');
  }

  getMainWindow() {
    return this.mainWindow;
  }

  focusMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  }

  closeAll() {
    this.windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.windows.clear();
    this.mainWindow = null;
  }
}

// Singleton
const windowManager = new WindowManager();

module.exports = {
  WindowManager,
  windowManager,
};
