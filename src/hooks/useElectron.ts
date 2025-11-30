/**
 * 🔌 Electron Hook
 * 
 * React hook for using Electron APIs.
 * Returns null-safe API that works in both Electron and browser.
 */

import { useCallback, useEffect, useState } from 'react';
import type { ElectronAPI, AppInfo, ServiceStatus, SystemInfo } from '@/types/electron';

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof globalThis !== 'undefined' && 
         (globalThis as typeof globalThis & { electronAPI?: unknown }).electronAPI !== undefined &&
         (globalThis as typeof globalThis & { platform?: { isElectron?: boolean } }).platform?.isElectron === true;
};

// Get platform info
export const getPlatform = () => {
  const win = globalThis as typeof globalThis & { platform?: { isElectron: boolean; isWindows: boolean; isMac: boolean; isLinux: boolean; arch: string } };
  if (win.platform) {
    return win.platform;
  }
  // Use userAgentData if available (modern), fallback to userAgent parsing
  const nav = globalThis.navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.userAgent || '';
  return {
    isElectron: false,
    isWindows: /win/i.test(platform),
    isMac: /mac/i.test(platform),
    isLinux: /linux/i.test(platform),
    arch: 'unknown',
  };
};

/**
 * Hook to access Electron API
 */
export function useElectron() {
  const [inElectron] = useState(() => isElectron());
  const api = (globalThis as typeof globalThis & { electronAPI?: ElectronAPI }).electronAPI;

  // App methods
  const getAppInfo = useCallback(async (): Promise<AppInfo | null> => {
    if (!api) return null;
    return api.getAppInfo();
  }, [api]);

  const quit = useCallback(async () => {
    if (api) await api.quit();
  }, [api]);

  const restart = useCallback(async () => {
    if (api) await api.restart();
  }, [api]);

  // Window methods
  const minimize = useCallback(async () => {
    if (api) await api.minimize();
  }, [api]);

  const maximize = useCallback(async () => {
    if (api) return api.maximize();
    return false;
  }, [api]);

  const toggleFullscreen = useCallback(async () => {
    if (api) return api.toggleFullscreen();
    return false;
  }, [api]);

  const openDevTools = useCallback(async () => {
    if (api) await api.openDevTools();
  }, [api]);

  // Settings
  const getSetting = useCallback(async <T = any>(key: string, defaultValue?: T): Promise<T | null> => {
    if (!api) return defaultValue ?? null;
    return api.settings.get(key, defaultValue);
  }, [api]);

  const setSetting = useCallback(async <T = any>(key: string, value: T): Promise<boolean> => {
    if (!api) return false;
    return api.settings.set(key, value);
  }, [api]);

  // Services
  const startService = useCallback(async (name: string) => {
    if (!api) return { success: false, error: 'Not in Electron' };
    return api.services.start(name);
  }, [api]);

  const stopService = useCallback(async (name: string) => {
    if (!api) return { success: false, error: 'Not in Electron' };
    return api.services.stop(name);
  }, [api]);

  const getServiceStatus = useCallback(async (name: string): Promise<ServiceStatus | null> => {
    if (!api) return null;
    return api.services.status(name);
  }, [api]);

  const restartService = useCallback(async (name: string) => {
    if (!api) return { success: false, error: 'Not in Electron' };
    return api.services.restart(name);
  }, [api]);

  // Shell
  const openExternal = useCallback(async (url: string) => {
    if (api) {
      return api.shell.openExternal(url);
    }
    // Fallback for browser
    window.open(url, '_blank');
    return true;
  }, [api]);

  const showInFolder = useCallback(async (path: string) => {
    if (api) return api.shell.showItem(path);
    return false;
  }, [api]);

  // Dialog
  const showMessage = useCallback(async (options: Parameters<NonNullable<ElectronAPI>['dialog']['message']>[0]) => {
    if (!api) {
      // Fallback to browser alert
      alert(options.message);
      return { response: 0, checkboxChecked: false };
    }
    return api.dialog.message(options);
  }, [api]);

  const showError = useCallback(async (title: string, content: string) => {
    if (api) {
      await api.dialog.error(title, content);
    } else {
      alert(`${title}\n\n${content}`);
    }
  }, [api]);

  // System
  const getSystemInfo = useCallback(async (): Promise<SystemInfo | null> => {
    if (!api) return null;
    return api.system.info();
  }, [api]);

  return {
    // State
    isElectron: inElectron,
    platform: getPlatform(),

    // App
    getAppInfo,
    quit,
    restart,

    // Window
    minimize,
    maximize,
    toggleFullscreen,
    openDevTools,

    // Settings
    getSetting,
    setSetting,

    // Services
    startService,
    stopService,
    getServiceStatus,
    restartService,

    // Shell
    openExternal,
    showInFolder,

    // Dialog
    showMessage,
    showError,

    // System
    getSystemInfo,
  };
}

/**
 * Hook to subscribe to service status changes
 */
export function useServiceStatus(serviceName: string) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const { getServiceStatus } = useElectron();

  useEffect(() => {
    // Initial fetch
    getServiceStatus(serviceName).then(setStatus);

    // Subscribe to changes
    const win = globalThis as typeof globalThis & { electronAPI?: ElectronAPI };
    if (win.electronAPI) {
      const unsubscribe = win.electronAPI.on('service-status-change', ({ name, status: newStatus }) => {
        if (name === serviceName) {
          getServiceStatus(serviceName).then(setStatus);
        }
      });

      return unsubscribe;
    }
  }, [serviceName, getServiceStatus]);

  return status;
}

export default useElectron;
