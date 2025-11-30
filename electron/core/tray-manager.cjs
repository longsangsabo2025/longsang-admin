/**
 * 🔔 System Tray
 * 
 * System tray icon with context menu.
 */

const { Tray, Menu, nativeImage, shell, app } = require('electron');
const path = require('path');
const { TRAY, PATHS, PORTS, APP_INFO, URLS } = require('./config.cjs');
const { loggers } = require('./logger.cjs');
const { windowManager } = require('./window-manager.cjs');
const { serviceManager } = require('./service-manager.cjs');

const log = loggers.tray;

class TrayManager {
  constructor() {
    this.tray = null;
  }

  create() {
    if (this.tray) return this.tray;

    log.info('Creating system tray');

    // Create tray icon (use app icon or create simple icon)
    let icon;
    try {
      icon = nativeImage.createFromPath(PATHS.trayIcon);
      if (icon.isEmpty()) {
        icon = nativeImage.createFromPath(PATHS.icon);
      }
    } catch {
      // Create a simple colored icon as fallback
      icon = nativeImage.createEmpty();
    }

    // Resize for tray (16x16 on Windows, 22x22 on macOS)
    if (!icon.isEmpty()) {
      icon = icon.resize({ width: 16, height: 16 });
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip(TRAY.tooltip);

    // Build context menu
    this._updateMenu();

    // Double-click to show window
    this.tray.on('double-click', () => {
      windowManager.focusMainWindow();
    });

    // Update menu when service status changes
    serviceManager.on('service-status-change', () => {
      this._updateMenu();
    });

    return this.tray;
  }

  _updateMenu() {
    if (!this.tray) return;

    const statuses = serviceManager.getAllStatuses();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '📊 Open LongSang Admin',
        click: () => windowManager.focusMainWindow(),
        type: 'normal',
      },
      { type: 'separator' },
      {
        label: '🔧 Services',
        submenu: [
          {
            label: `n8n ${statuses.n8n?.running ? '✅' : '❌'}`,
            submenu: [
              {
                label: 'Open Editor',
                click: () => shell.openExternal(`http://localhost:${PORTS.n8n}`),
              },
              {
                label: statuses.n8n?.running ? 'Restart' : 'Start',
                click: async () => {
                  if (statuses.n8n?.running) {
                    await serviceManager.restartService('n8n');
                  } else {
                    await serviceManager.startService('n8n');
                  }
                },
              },
              {
                label: 'Stop',
                enabled: statuses.n8n?.running,
                click: () => serviceManager.stopService('n8n'),
              },
            ],
          },
          {
            label: `Vite Dev ${statuses.vite?.running ? '✅' : '❌'}`,
            visible: statuses.vite !== undefined,
            submenu: [
              {
                label: 'Restart',
                click: () => serviceManager.restartService('vite'),
              },
            ],
          },
        ],
      },
      { type: 'separator' },
      {
        label: '🔗 Quick Links',
        submenu: [
          {
            label: '📈 Supabase Dashboard',
            click: () => shell.openExternal(URLS.supabase),
          },
          {
            label: '📚 GitHub Repository',
            click: () => shell.openExternal(URLS.github),
          },
          {
            label: '📖 Documentation',
            click: () => shell.openExternal(URLS.docs),
          },
        ],
      },
      { type: 'separator' },
      {
        label: '⚙️ DevTools',
        click: () => {
          const mainWindow = windowManager.getMainWindow();
          if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
          }
        },
      },
      {
        label: '🔄 Reload App',
        click: () => {
          const mainWindow = windowManager.getMainWindow();
          if (mainWindow) {
            mainWindow.reload();
          }
        },
      },
      { type: 'separator' },
      {
        label: `ℹ️ ${APP_INFO.name} v${APP_INFO.version}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: '❌ Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

// Singleton
const trayManager = new TrayManager();

module.exports = {
  TrayManager,
  trayManager,
};
