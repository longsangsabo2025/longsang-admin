/**
 * 📋 Application Menu
 * 
 * Native application menu with all features.
 */

const { Menu, shell, app, dialog, BrowserWindow } = require('electron');
const { URLS, APP_INFO, PORTS, isDev } = require('./config.cjs');
const { loggers } = require('./logger.cjs');
const { windowManager } = require('./window-manager.cjs');
const { serviceManager } = require('./service-manager.cjs');

const log = loggers.main.child('menu');

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Could implement multi-window if needed
            windowManager.focusMainWindow();
          },
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.reload();
          },
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.reloadIgnoringCache();
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' },
        ]),
      ],
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.toggleDevTools();
          },
        },
        {
          label: 'Toggle DevTools (Alt)',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.setZoomLevel(0);
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              const level = win.webContents.getZoomLevel();
              win.webContents.setZoomLevel(level + 0.5);
            }
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              const level = win.webContents.getZoomLevel();
              win.webContents.setZoomLevel(level - 0.5);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.setFullScreen(!win.isFullScreen());
          },
        },
      ],
    },

    // Services Menu
    {
      label: 'Services',
      submenu: [
        {
          label: '🔗 Open n8n Editor',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => shell.openExternal(`http://localhost:${PORTS.n8n}`),
        },
        {
          label: '🔄 Restart n8n',
          click: async () => {
            await serviceManager.restartService('n8n');
            dialog.showMessageBox({
              type: 'info',
              title: 'Service Restarted',
              message: 'n8n has been restarted successfully.',
            });
          },
        },
        { type: 'separator' },
        {
          label: '📊 Open Supabase',
          click: () => shell.openExternal(URLS.supabase),
        },
        { type: 'separator' },
        {
          label: '📈 Service Status',
          click: () => {
            const statuses = serviceManager.getAllStatuses();
            const message = Object.entries(statuses)
              .map(([name, status]) => `${name}: ${status.running ? '✅ Running' : '❌ Stopped'}`)
              .join('\n');
            
            dialog.showMessageBox({
              type: 'info',
              title: 'Service Status',
              message: 'Current Service Status:',
              detail: message,
            });
          },
        },
      ],
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: '📚 Documentation',
          click: () => shell.openExternal(URLS.docs),
        },
        {
          label: '💻 GitHub Repository',
          click: () => shell.openExternal(URLS.github),
        },
        { type: 'separator' },
        {
          label: '🐛 Report Issue',
          click: () => shell.openExternal(`${URLS.github}/issues/new`),
        },
        { type: 'separator' },
        {
          label: 'ℹ️ About',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: `About ${APP_INFO.name}`,
              message: APP_INFO.name,
              detail: [
                `Version: ${APP_INFO.version}`,
                `Description: ${APP_INFO.description}`,
                '',
                `Electron: ${process.versions.electron}`,
                `Chrome: ${process.versions.chrome}`,
                `Node: ${process.versions.node}`,
                '',
                `© 2025 ${APP_INFO.author}`,
              ].join('\n'),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  log.info('Application menu created');
  return menu;
}

module.exports = {
  createMenu,
};
