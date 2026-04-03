/**
 * YouTube Harvester — Constants
 */

import { BRAIN_API_BASE } from '@/brain/lib/brain-config';

export const API_BASE = BRAIN_API_BASE;

/** LocalStorage key for saving harvester state */
export const STORAGE_KEY = 'youtube-harvester-state';

export const STEPS = ['Nhập URL', 'Xem Transcript', 'AI Phân Tích', 'Review', 'Hoàn tất'];
