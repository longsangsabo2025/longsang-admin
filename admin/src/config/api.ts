/**
 * API Configuration
 *
 * ⚠️ CHUẨN HÓA PORTS - KHÔNG ĐỔI! ⚠️
 * - Frontend Vite: 8080
 * - API Server: 3001
 * - OAuth Callback: 3333
 *
 * Automatically switches between development and production
 */

// Chuẩn: API Server luôn ở port 3001 trong development
const DEV_API_PORT = 3001;

// Get base API URL based on environment
export const getApiUrl = () => {
  // In production (deployed on Vercel), use relative path — Vercel rewrites to Render
  if (import.meta.env.PROD) {
    return '/api';
  }

  // In development, use VITE_API_URL from .env or default to localhost:3001
  return import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `http://localhost:${DEV_API_PORT}/api`;
};

// Export as constant for convenience
export const API_URL = getApiUrl();

// API endpoints
export const API_ENDPOINTS = {
  // AI Agents
  AGENTS: {
    EXECUTE: (agentId: string) => `${API_URL}/agents/${agentId}`,
    STATUS: (agentId: string) => `${API_URL}/agents/${agentId}/status`,
    LIST: `${API_URL}/agents`,
  },

  // Google Drive
  DRIVE: {
    LIST: (folderId?: string) =>
      folderId ? `${API_URL}/drive/list/${folderId}` : `${API_URL}/drive/list`,
    FOLDERS: `${API_URL}/drive/folders`,
    UPLOAD: (parentId?: string) =>
      parentId ? `${API_URL}/drive/upload/${parentId}` : `${API_URL}/drive/upload`,
    FOLDER: `${API_URL}/drive/folder`,
    DELETE: (fileId: string) => `${API_URL}/drive/${fileId}`,
    SHARED_DRIVES: `${API_URL}/drive/shared-drives`,
  },

  // Google Services
  ANALYTICS: `${API_URL}/google/analytics`,
  CALENDAR: `${API_URL}/google/calendar`,
  GMAIL: `${API_URL}/google/gmail`,
  MAPS: `${API_URL}/google/maps`,
  INDEXING: `${API_URL}/google/indexing`,
  SHEETS: `${API_URL}/google/sheets`,

  // Other APIs
  SEO: `${API_URL}/seo`,
  ENV: `${API_URL}/env`,
  SOCIAL: `${API_URL}/social`,
};

export default {
  API_URL,
  API_ENDPOINTS,
  getApiUrl,
};
