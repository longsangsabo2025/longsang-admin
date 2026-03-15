/**
 * Helper functions for Channel Builder settings persistence
 */

import { CHANNEL_SETTINGS_KEY, type ChannelAISettings } from './types';

/** Load settings from localStorage (fast local cache) */
export const loadChannelSettings = (): Partial<ChannelAISettings> => {
  try {
    const saved = localStorage.getItem(CHANNEL_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

/** Save settings to localStorage cache */
export const saveChannelSettingsLocal = (settings: Partial<ChannelAISettings>) => {
  try {
    const current = loadChannelSettings();
    localStorage.setItem(CHANNEL_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch (e) {
    console.error('Failed to save channel settings:', e);
  }
};

/** Save settings to Supabase (remote) */
export const saveChannelSettingsToSupabase = async (settings: Record<string, unknown>) => {
  try {
    await fetch('/api/channels/settings/ai', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch (error) {
    console.error('Failed to save channel AI settings:', error);
  }
};
