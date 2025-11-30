/**
 * 🖥️ LongSang Admin Desktop - Main Entry
 * 
 * Enterprise-grade Electron application with:
 * - Modular architecture
 * - Service management (n8n, API)
 * - Persistent settings
 * - System tray
 * - Auto-updates
 * 
 * @author LongSang Team
 * @version 1.0.0
 */

const { app, globalShortcut } = require('electron');
const path = require('path');

// Core modules
const { isDev, APP_INFO, SHORTCUTS, TRAY } = require('./core/config.cjs');
const { logger, loggers } = require('./core/logger.cjs');
const { stores } = require('./core/store.cjs');
const { initIPC, cleanupIPC, setServiceManager } = require('./core/ipc-handler.cjs');
const { serviceManager } = require('./core/service-manager.cjs');
const { windowManager } = require('./core/window-manager.cjs');
const { trayManager } = require('./core/tray-manager.cjs');
const { createMenu } = require('./core/menu.cjs');
const { updateManager } = require('./core/auto-updater.cjs');
const { crashReporterManager } = require('./core/crash-reporter.cjs');
const { notificationManager } = require('./core/notifications.cjs');

const log = loggers.main;

// ============================================================
// APP LIFECYCLE
// ============================================================

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  log.warn('Another instance is running, quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus main window if user tries to open another instance
    windowManager.focusMainWindow();
  });
}

// App ready
app.whenReady().then(async () => {
  log.info('='.repeat(50));
  log.info(`🚀 Starting ${APP_INFO.name} v${APP_INFO.version}`);
  log.info(`Environment: ${isDev ? 'development' : 'production'}`);
  log.info('='.repeat(50));

  try {
    // 0. Initialize crash reporter first (to catch early errors)
    crashReporterManager.init();
    
    // 1. Show splash screen while loading
    log.info('Showing splash screen...');
    windowManager.createSplashWindow();

    // 2. Initialize notification manager
    notificationManager.init();

    // 3. Initialize IPC handlers
    initIPC();
    setServiceManager(serviceManager);

    // 4. Create application menu
    createMenu();

    // 5. Start services (n8n, vite in dev)
    log.info('Starting services...');
    await serviceManager.startAll();

    // 6. Get actual Vite port (may differ from default)
    let vitePort = 8080;
    const viteService = serviceManager.getService('vite');
    if (viteService && viteService.getActualPort) {
      vitePort = viteService.getActualPort();
    }

    // 7. Create main window
    const mainWindow = windowManager.createMainWindow(vitePort);

    // 8. Close splash when main window is ready
    mainWindow.once('ready-to-show', () => {
      windowManager.closeSplash();
      notificationManager.success('LongSang Admin is ready!');
    });

    // 9. Create system tray
    if (TRAY.enabled) {
      trayManager.create();
    }

    // 10. Register global shortcuts
    registerGlobalShortcuts();

    // 11. Initialize auto-updater (after window is ready)
    updateManager.init();

    log.info('✅ Application started successfully');

  } catch (error) {
    log.error('Failed to start application:', error);
    windowManager.closeSplash();
    notificationManager.error(`Startup failed: ${error.message}`);
    app.quit();
  }
});

// All windows closed
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicit quit
  if (process.platform !== 'darwin') {
    // Check if should minimize to tray instead
    const closeToTray = stores.settings.get('closeToTray', true);
    if (closeToTray && !app.isQuitting) {
      log.info('All windows closed, minimized to tray');
    } else {
      app.quit();
    }
  }
});

// App activated (macOS - click dock icon)
app.on('activate', () => {
  if (!windowManager.getMainWindow()) {
    const viteService = serviceManager.getService('vite');
    const vitePort = viteService?.getActualPort?.() || 8080;
    windowManager.createMainWindow(vitePort);
  }
});

// Before quit
app.on('before-quit', async () => {
  log.info('Application quitting...');
  app.isQuitting = true;
  
  // Unregister shortcuts
  globalShortcut.unregisterAll();
  
  // Stop all services
  await serviceManager.stopAll();
  
  // Cleanup
  cleanupIPC();
  trayManager.destroy();
  
  log.info('Cleanup complete');
});

// ============================================================
// GLOBAL SHORTCUTS
// ============================================================

function registerGlobalShortcuts() {
  // Show window shortcut (works even when app is minimized)
  const showWindowShortcut = stores.settings.get('shortcuts.showWindow', SHORTCUTS.showWindow);
  
  globalShortcut.register(showWindowShortcut, () => {
    log.debug('Global shortcut triggered: show window');
    windowManager.focusMainWindow();
  });

  log.info(`Global shortcut registered: ${showWindowShortcut}`);
}

// ============================================================
// ERROR HANDLING
// ============================================================

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  // Could send to crash reporter here
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection:', { reason, promise });
});

// ============================================================
// EXPORTS (for testing)
// ============================================================

module.exports = {
  windowManager,
  serviceManager,
  trayManager,
};
