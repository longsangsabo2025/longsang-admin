import { STORAGE_KEY, SETTINGS_KEY, MOTION_PRESETS } from './constants';
import type { VideoResult, VideoSettings } from './types';

// Load history from localStorage
export const loadHistory = (): VideoResult[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Save history to localStorage
export const saveHistory = (history: VideoResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
  } catch {
    console.error('Failed to save video history');
  }
};

// Load settings from localStorage
export const loadSettings = (): Partial<VideoSettings> => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save settings to localStorage
export const saveSettings = (settings: VideoSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.error('Failed to save video settings');
  }
};

// Get motion suffix for a preset
export const getMotionSuffix = (motionPreset: string): string => {
  const preset = MOTION_PRESETS.find(p => p.id === motionPreset);
  return preset?.suffix || '';
};
