/**
 * YouTube Harvester — Constants
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** LocalStorage key for saving harvester state */
export const STORAGE_KEY = 'youtube-harvester-state';

export const STEPS = ['Nhập URL', 'Xem Transcript', 'AI Phân Tích', 'Review', 'Hoàn tất'];
