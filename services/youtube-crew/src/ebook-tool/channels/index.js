/**
 * Channel Registry — Auto-discover and load channel configs
 */
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHANNELS_DIR = __dirname;

/**
 * Load a single channel config by ID.
 * @param {string} channelId - e.g. 'dungdaydi', 'riseshine'
 * @returns {Promise<object>} channel config
 */
export async function loadChannel(channelId) {
  const configPath = join(CHANNELS_DIR, channelId, 'config.js');
  const mod = await import(`file://${configPath.replace(/\\/g, '/')}`);
  return mod.default;
}

/**
 * List all available channel IDs by scanning directory.
 * @returns {Promise<string[]>}
 */
export async function listChannels() {
  const entries = await readdir(CHANNELS_DIR, { withFileTypes: true });
  const ids = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      ids.push(entry.name);
    }
  }
  return ids;
}

/**
 * Load all channel configs.
 * @returns {Promise<object[]>}
 */
export async function loadAllChannels() {
  const ids = await listChannels();
  return Promise.all(ids.map(loadChannel));
}
