/**
 * Google Indexing API - Browser-Safe Version
 * Calls API server endpoints for Google Indexing operations
 */

import { supabase } from '@/integrations/supabase/client';

const API_BASE = 'http://localhost:3001/api/google/indexing';

export type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

export interface IndexingResult {
  url: string;
  action: IndexingAction;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

// ============================================================
// API FUNCTIONS - Call through API server
// ============================================================

export async function submitUrlToGoogle(
  url: string,
  action: IndexingAction = 'URL_UPDATED'
): Promise<IndexingResult> {
  const response = await fetch(`${API_BASE}/submit-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, action }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit URL');
  }

  await response.json(); // consume response
  return {
    url,
    action,
    status: 'success',
    message: 'URL submitted successfully',
    timestamp: new Date().toISOString(),
  };
}

export async function batchSubmitUrls(
  urls: string[],
  action: IndexingAction = 'URL_UPDATED'
): Promise<IndexingResult[]> {
  const response = await fetch(`${API_BASE}/batch-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, action }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to batch submit URLs');
  }

  return response.json();
}

export async function removeUrlFromGoogle(url: string): Promise<IndexingResult> {
  return submitUrlToGoogle(url, 'URL_DELETED');
}

export async function getIndexingStatus(url: string) {
  const response = await fetch(`${API_BASE}/status?url=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get indexing status');
  }

  return response.json();
}

export async function autoSubmitNewContent(contentId: string, contentType: string) {
  const response = await fetch(`${API_BASE}/auto-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentId, contentType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to auto-submit content');
  }

  return response.json();
}

export async function getSearchConsoleData(siteUrl: string) {
  const response = await fetch(
    `${API_BASE}/search-console?siteUrl=${encodeURIComponent(siteUrl)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get search console data');
  }

  return response.json();
}

// ============================================================
// WORKING FUNCTIONS - SUPABASE ONLY (SAFE IN BROWSER)
// ============================================================

/**
 * Get indexing statistics from database
 */
export async function getIndexingStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('google_indexing_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data?.length || 0;
    const successful = data?.filter((log) => log.status === 'success').length || 0;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      recentLogs: data?.slice(0, 10) || [],
    };
  } catch (error) {
    console.error('Error getting indexing stats:', error);
    throw error;
  }
}

/**
 * Get recent indexing logs
 */
export async function getRecentIndexingLogs(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('google_indexing_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting recent logs:', error);
    throw error;
  }
}

/**
 * Log indexing action to database (internal use)
 */
async function _logIndexingAction(result: IndexingResult) {
  try {
    await supabase.from('google_indexing_logs').insert({
      url: result.url,
      action: result.action,
      status: result.status,
      message: result.message,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Error logging indexing action:', error);
  }
}
