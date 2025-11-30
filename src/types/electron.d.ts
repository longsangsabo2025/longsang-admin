/**
 * 🔷 TypeScript Definitions for Electron API
 *
 * These types are exposed via preload script.
 * Use in React/TypeScript components.
 */

export interface AppInfo {
  name: string;
  id: string;
  version: string;
  description: string;
  author: string;
  website: string;
  github: string;
  electron: string;
  chrome: string;
  node: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  memory: NodeJS.MemoryUsage;
  uptime: number;
}

export interface ServiceStatus {
  name: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  port: number;
  running: boolean;
  lastError: string | null;
}

export interface DialogOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

export interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface ElectronAPI {
  // App
  getAppInfo: () => Promise<AppInfo>;
  quit: () => Promise<void>;
  restart: () => Promise<void>;

  // Window
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  toggleFullscreen: () => Promise<boolean>;
  openDevTools: () => Promise<void>;

  // Settings
  settings: {
    get: <T = any>(key: string, defaultValue?: T) => Promise<T>;
    set: <T = any>(key: string, value: T) => Promise<boolean>;
    getAll: () => Promise<Record<string, any>>;
  };

  // Services
  services: {
    start: (name: string) => Promise<{ success: boolean; error?: string }>;
    stop: (name: string) => Promise<{ success: boolean; error?: string }>;
    status: (name: string) => Promise<ServiceStatus>;
    restart: (name: string) => Promise<{ success: boolean; error?: string }>;
  };

  // Shell
  shell: {
    openExternal: (url: string) => Promise<boolean>;
    openPath: (path: string) => Promise<boolean>;
    showItem: (path: string) => Promise<boolean>;
  };

  // Dialog
  dialog: {
    message: (options: DialogOptions) => Promise<{ response: number; checkboxChecked: boolean }>;
    error: (title: string, content: string) => Promise<void>;
    openFile: (options?: OpenFileOptions) => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveFile: (options?: SaveFileOptions) => Promise<{ canceled: boolean; filePath?: string }>;
  };

  // System
  system: {
    info: () => Promise<SystemInfo>;
    paths: () => Promise<{
      userData: string;
      logs: string;
      config: string;
      cache: string;
    }>;
  };

  // Events
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
}

export interface Platform {
  isElectron: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  arch: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    platform?: Platform;
  }
}

export {};
