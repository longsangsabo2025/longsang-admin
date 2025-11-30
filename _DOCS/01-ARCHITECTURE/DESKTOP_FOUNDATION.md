# 🖥️ LongSang Admin Desktop Foundation

> **Enterprise-grade Electron desktop application framework**
> 
> Version: 1.0.0 | Last Updated: November 25, 2025

---

## 📋 Tổng quan

Desktop Foundation được thiết kế với mục tiêu:

1. **Modular Architecture** - Mỗi module độc lập, dễ test và maintain
2. **Scalability** - Dễ dàng thêm services mới, features mới
3. **Type Safety** - TypeScript types cho React integration
4. **Production Ready** - Logging, error handling, auto-update
5. **Developer Experience** - DevTools, hot reload, debugging

---

## 📁 Cấu trúc thư mục

```
electron/
├── main.cjs                 # 🚀 Entry point - khởi động app
├── preload.cjs              # 🔐 Secure bridge (main ↔ renderer)
│
├── core/                    # 🧱 Core modules
│   ├── config.cjs           # ⚙️ Configuration (ports, paths, settings)
│   ├── logger.cjs           # 📝 Logging system (console + file)
│   ├── store.cjs            # 💾 Persistent storage (settings, window state)
│   ├── ipc-handler.cjs      # 🔌 IPC communication handlers
│   ├── service-manager.cjs  # 🚀 Service lifecycle (n8n, vite, api)
│   ├── window-manager.cjs   # 🪟 Window state & management
│   ├── tray-manager.cjs     # 🔔 System tray integration
│   └── menu.cjs             # 📋 Application menu
│
└── assets/                  # 🎨 Static assets
    ├── splash.html          # Loading splash screen
    ├── icon.png             # App icon (256x256)
    └── tray-icon.png        # Tray icon (16x16)
```

---

## 🧱 Core Modules

### ⚙️ Config (`core/config.cjs`)

Centralized configuration cho toàn app:

```javascript
const { isDev, APP_INFO, PORTS, SERVICES } = require('./core/config.cjs');

// Available exports:
// - isDev: boolean
// - APP_INFO: { name, id, version, ... }
// - PATHS: { root, userData, logs, config, cache }
// - PORTS: { vite: 8080, n8n: 5678, api: 3001 }
// - SERVICES: Service configurations
// - WINDOW: Window size/position defaults
// - WEB_PREFERENCES: Electron security settings
// - LOGGING, TRAY, SHORTCUTS, URLS
```

### 📝 Logger (`core/logger.cjs`)

Structured logging với file output:

```javascript
const { loggers } = require('./core/logger.cjs');

const log = loggers.main;  // or .window, .service, .ipc, .tray

log.info('Application started');
log.warn('Warning message', { data });
log.error('Error occurred', error);
log.debug('Debug info');  // Only in dev
```

Log files saved to: `~/.longsang-admin/logs/`

### 💾 Store (`core/store.cjs`)

Persistent key-value storage:

```javascript
const { stores } = require('./core/store.cjs');

// Pre-defined stores:
stores.settings.get('theme');           // 'dark'
stores.settings.set('theme', 'light');

stores.windowState.get('width');        // 1400
stores.windowState.get('isMaximized');  // false

stores.services.get('n8n.autoStart');   // true
stores.recent.get('projects');          // []
stores.preferences.get('dashboard.layout'); // 'grid'
```

### 🚀 Service Manager (`core/service-manager.cjs`)

Quản lý external services:

```javascript
const { serviceManager } = require('./core/service-manager.cjs');

// Start all configured services
await serviceManager.startAll();

// Individual control
await serviceManager.startService('n8n');
await serviceManager.stopService('n8n');
await serviceManager.restartService('n8n');

// Get status
const status = serviceManager.getServiceStatus('n8n');
// { name: 'n8n', status: 'running', port: 5678, running: true }

// Get all statuses
const all = serviceManager.getAllStatuses();

// Events
serviceManager.on('service-status-change', ({ name, status }) => {
  console.log(`${name} is now ${status}`);
});
```

**Thêm service mới:**

```javascript
// In service-manager.cjs, add new class:
class MyService extends Service {
  constructor() {
    super('myservice', { port: 3000, ... });
  }
  
  async _spawn() {
    // Implement startup logic
  }
}

// Register in ServiceManager constructor
this.services.set('myservice', new MyService());
```

### 🪟 Window Manager (`core/window-manager.cjs`)

Window state management với persistence:

```javascript
const { windowManager } = require('./core/window-manager.cjs');

// Create main window (auto-restores position/size)
windowManager.createMainWindow(vitePort);

// Get current window
const win = windowManager.getMainWindow();

// Focus/show
windowManager.focusMainWindow();

// Splash screen
windowManager.createSplashWindow();
windowManager.closeSplash();
```

### 🔌 IPC Handler (`core/ipc-handler.cjs`)

Secure main ↔ renderer communication:

```javascript
const { initIPC, setServiceManager, CHANNELS } = require('./core/ipc-handler.cjs');

// Initialize (call once in main.cjs)
initIPC();
setServiceManager(serviceManager);

// Available channels:
// - app:info, app:quit, app:restart
// - window:minimize, window:maximize, window:close
// - settings:get, settings:set, settings:get-all
// - service:start, service:stop, service:status, service:restart
// - shell:open-external, shell:open-path
// - dialog:message, dialog:error, dialog:open-file
// - system:info, system:paths
```

---

## 🎨 React Integration

### TypeScript Types

```typescript
// src/types/electron.d.ts
import type { ElectronAPI, AppInfo, ServiceStatus } from '@/types/electron';

// Global window types
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    platform?: Platform;
  }
}
```

### useElectron Hook

```tsx
import { useElectron, isElectron } from '@/hooks/useElectron';

function MyComponent() {
  const {
    // State
    isElectron,      // boolean
    platform,        // { isWindows, isMac, isLinux }
    
    // App
    getAppInfo,      // () => Promise<AppInfo>
    quit,            // () => Promise<void>
    restart,         // () => Promise<void>
    
    // Window
    minimize,
    maximize,
    toggleFullscreen,
    openDevTools,
    
    // Settings
    getSetting,      // (key, default) => Promise<T>
    setSetting,      // (key, value) => Promise<boolean>
    
    // Services
    getServiceStatus,
    startService,
    stopService,
    restartService,
    
    // Shell
    openExternal,    // (url) => Promise<boolean>
    showInFolder,    // (path) => Promise<boolean>
    
    // Dialog
    showMessage,     // (options) => Promise<response>
    showError,       // (title, content) => Promise<void>
    
    // System
    getSystemInfo,
  } = useElectron();

  // Safe to call even in browser - gracefully degrades
  const info = await getAppInfo(); // null if not in Electron
}
```

### ServiceStatusPanel Component

```tsx
import { ServiceStatusPanel, ServiceStatusBadges } from '@/components/desktop';

// Full panel (only renders in Electron)
<ServiceStatusPanel />

// Compact badges for header
<ServiceStatusBadges />
```

---

## 🛠️ Development

### Scripts

```bash
# Development (with DevTools, hot reload)
npm run desktop:dev

# Build for production
npm run desktop:build        # Current platform
npm run desktop:build:win    # Windows
npm run desktop:build:mac    # macOS
npm run desktop:build:linux  # Linux
```

### Debugging

1. **DevTools**: Press `F12` or `Ctrl+Shift+I`
2. **Menu**: View → Toggle DevTools
3. **Logs**: Check `~/.longsang-admin/logs/`

### Adding New IPC Channel

1. Add channel name in `core/ipc-handler.cjs`:
```javascript
const CHANNELS = {
  // ...existing
  MY_CHANNEL: 'my:channel',
};
```

2. Add handler:
```javascript
ipcMain.handle(CHANNELS.MY_CHANNEL, async (event, arg1, arg2) => {
  // Handle and return result
  return { success: true, data: result };
});
```

3. Add to preload (`preload.cjs`):
```javascript
myMethod: (arg1, arg2) => ipcRenderer.invoke(CHANNELS.MY_CHANNEL, arg1, arg2),
```

4. Add TypeScript type (`src/types/electron.d.ts`):
```typescript
myMethod: (arg1: string, arg2: number) => Promise<MyResult>;
```

5. Add to hook (`src/hooks/useElectron.ts`):
```typescript
const myMethod = useCallback(async (arg1: string, arg2: number) => {
  if (!api) return null;
  return api.myMethod(arg1, arg2);
}, [api]);
```

---

## 📦 Production Build

### electron-builder Configuration

Add to `package.json`:

```json
{
  "build": {
    "appId": "com.longsang.admin",
    "productName": "LongSang Admin",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "!electron/**/*.map"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "electron/assets/icon.ico"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "electron/assets/icon.icns",
      "category": "public.app-category.developer-tools"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "electron/assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### Auto-Update (Future)

```javascript
// In main.cjs
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // Notify user
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
```

---

## 🔒 Security Best Practices

1. **Context Isolation**: Always enabled
2. **Node Integration**: Disabled in renderer
3. **Preload Script**: Only expose necessary APIs
4. **URL Validation**: Only allow http/https external links
5. **CSP**: Set Content Security Policy in production

---

## 🚀 Roadmap

- [ ] Auto-updater with GitHub releases
- [ ] Crash reporting (Sentry integration)
- [ ] Protocol handler (`longsang://`)
- [ ] Native notifications
- [ ] Multi-window support
- [ ] Plugin system
- [ ] Offline mode

---

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [Best Practices](https://www.electronjs.org/docs/tutorial/security)

---

*Maintained by LongSang Team | November 2025*
