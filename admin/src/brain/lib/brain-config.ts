const DEFAULT_BRAIN_API_BASE = 'http://localhost:3001';
const AUTH_STORAGE_KEY = 'longsang-admin-auth';
const USER_ID_STORAGE_KEY = 'userId';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function readSupabaseSessionUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawSession) {
    return '';
  }

  try {
    const parsed = JSON.parse(rawSession) as {
      user?: { id?: string };
      currentSession?: { user?: { id?: string } };
    };

    return parsed.user?.id || parsed.currentSession?.user?.id || '';
  } catch {
    return '';
  }
}

export function getBrainApiBase(): string {
  const configuredBase = import.meta.env.VITE_BRAIN_API_URL || import.meta.env.VITE_API_URL;
  return trimTrailingSlash(configuredBase || DEFAULT_BRAIN_API_BASE);
}

export function getBrainApiUrl(): string {
  const base = getBrainApiBase();
  return base.endsWith('/api') ? base : `${base}/api`;
}

export function getBrainUserId(): string {
  if (typeof window === 'undefined') {
    return (import.meta.env.VITE_BRAIN_USER_ID || '').trim();
  }

  const storedUserId = window.localStorage.getItem(USER_ID_STORAGE_KEY)?.trim();
  if (storedUserId) {
    return storedUserId;
  }

  const sessionUserId = readSupabaseSessionUserId().trim();
  if (sessionUserId) {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, sessionUserId);
    return sessionUserId;
  }

  const configuredUserId = (import.meta.env.VITE_BRAIN_USER_ID || '').trim();
  if (configuredUserId) {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, configuredUserId);
  }

  return configuredUserId;
}

export function requireBrainUserId(): string {
  const userId = getBrainUserId();
  if (!userId) {
    throw new Error('Missing Brain user identity. Set localStorage userId or VITE_BRAIN_USER_ID.');
  }
  return userId;
}

export const BRAIN_API_BASE = getBrainApiBase();
export const BRAIN_API_URL = getBrainApiUrl();
