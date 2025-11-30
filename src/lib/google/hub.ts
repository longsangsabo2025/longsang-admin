/**
 * Google Services Hub - Unified Integration Center
 * Quản lý tất cả Google Services: Analytics, Sheets, Search Console, Calendar, Drive
 */

import {
  getAnalyticsOverview,
  getTrafficSources,
  comparePerformance,
  getDeviceBreakdown,
  type AnalyticsMetrics,
} from './analytics-api';

import { supabase } from '@/integrations/supabase/client';

// ========================================
// CONFIGURATION TYPES
// ========================================

export interface GoogleServicesConfig {
  id: string;
  user_id: string;

  // Analytics
  analytics_property_id: string | null;
  analytics_enabled: boolean;

  // Sheets
  reporting_spreadsheet_id: string | null;
  sheets_auto_sync: boolean;

  // Search Console (từ SEO Center)
  search_console_enabled: boolean;

  // Automation
  daily_sync_enabled: boolean;
  sync_time: string; // HH:MM format
  email_reports: boolean;
  report_recipients: string[]; // email addresses

  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  service: 'analytics' | 'sheets' | 'search-console' | 'calendar' | 'drive';
  status: 'success' | 'failed' | 'running';
  records_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  analytics: {
    last7Days: AnalyticsMetrics[];
    totalSessions: number;
    totalUsers: number;
    avgBounceRate: number;
    conversions: number;
    comparison: {
      sessionsChange: number;
      usersChange: number;
      conversionsChange: number;
    };
  };
  seo: {
    totalClicks: number;
    totalImpressions: number;
    avgCTR: number;
    avgPosition: number;
    topKeywords: Array<{ keyword: string; clicks: number; position: number }>;
  };
  sheets: {
    lastSyncTime: string | null;
    totalReports: number;
    spreadsheetUrl: string | null;
  };
  traffic: {
    sources: Array<{ source: string; sessions: number; percentage: number }>;
    devices: Array<{ device: string; sessions: number; percentage: number }>;
  };
}

// ========================================
// CONFIGURATION MANAGEMENT
// ========================================

/**
 * Lấy Google Services config
 */
export async function getGoogleConfig(): Promise<GoogleServicesConfig | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('google_services_config')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Cập nhật hoặc tạo config
 */
export async function saveGoogleConfig(config: Partial<GoogleServicesConfig>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const existing = await getGoogleConfig();

  if (existing) {
    const { data, error } = await supabase
      .from('google_services_config')
      .update({
        ...config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('google_services_config')
      .insert({
        user_id: user.id,
        ...config,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ========================================
// UNIFIED DASHBOARD DATA
// ========================================

/**
 * Lấy tất cả metrics cho dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const config = await getGoogleConfig();

  if (!config) {
    throw new Error(
      'Google Services not configured. Please set up your Google Analytics Property ID.'
    );
  }

  // Analytics Data
  let analyticsData: DashboardMetrics['analytics'] = {
    last7Days: [],
    totalSessions: 0,
    totalUsers: 0,
    avgBounceRate: 0,
    conversions: 0,
    comparison: {
      sessionsChange: 0,
      usersChange: 0,
      conversionsChange: 0,
    },
  };

  if (config.analytics_enabled && config.analytics_property_id) {
    const [overview, comparison] = await Promise.all([
      getAnalyticsOverview(config.analytics_property_id, '7daysAgo', 'today'),
      comparePerformance(config.analytics_property_id),
    ]);

    analyticsData = {
      last7Days: overview,
      totalSessions: overview.reduce((sum, day) => sum + day.sessions, 0),
      totalUsers: overview.reduce((sum, day) => sum + day.users, 0),
      avgBounceRate: overview.reduce((sum, day) => sum + day.bounceRate, 0) / overview.length,
      conversions: overview.reduce((sum, day) => sum + day.conversions, 0),
      comparison: comparison
        ? {
            sessionsChange: comparison.changes.sessions,
            usersChange: comparison.changes.users,
            conversionsChange: comparison.changes.conversions,
          }
        : analyticsData.comparison,
    };
  }

  // SEO Data (từ SEO Center)
  const { data: seoData } = await supabase
    .from('seo_keywords')
    .select('keyword, current_position')
    .order('current_position', { ascending: true })
    .limit(10);

  const seoMetrics = {
    totalClicks: 0,
    totalImpressions: 0,
    avgCTR: 0,
    avgPosition:
      seoData?.reduce((sum, k) => sum + (k.current_position || 0), 0) / (seoData?.length || 1) || 0,
    topKeywords:
      seoData?.map((k) => ({
        keyword: k.keyword,
        clicks: 0, // Will be populated from Search Console API
        position: k.current_position || 0,
      })) || [],
  };

  // Traffic Sources
  const trafficSources =
    config.analytics_enabled && config.analytics_property_id
      ? await getTrafficSources(config.analytics_property_id)
      : [];

  const totalTraffic = trafficSources.reduce((sum, s) => sum + s.sessions, 0);
  const traffic = {
    sources: trafficSources.slice(0, 5).map((s) => ({
      source: s.source,
      sessions: s.sessions,
      percentage: totalTraffic > 0 ? (s.sessions / totalTraffic) * 100 : 0,
    })),
    devices:
      config.analytics_enabled && config.analytics_property_id
        ? (await getDeviceBreakdown(config.analytics_property_id)).map((d) => ({
            device: d.device,
            sessions: d.sessions,
            percentage: totalTraffic > 0 ? (d.sessions / totalTraffic) * 100 : 0,
          }))
        : [],
  };

  // Sheets Info
  const { data: lastSync } = await supabase
    .from('google_sync_logs')
    .select('completed_at')
    .eq('service', 'sheets')
    .eq('status', 'success')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const sheets = {
    lastSyncTime: lastSync?.completed_at || null,
    totalReports: 0, // Will count from sheets
    spreadsheetUrl: config.reporting_spreadsheet_id
      ? `https://docs.google.com/spreadsheets/d/${config.reporting_spreadsheet_id}`
      : null,
  };

  return {
    analytics: analyticsData,
    seo: seoMetrics,
    sheets,
    traffic,
  };
}

// ========================================
// AUTO-SYNC WORKFLOWS
// ========================================

/**
 * Sync tất cả data vào Google Sheets
 */
export async function syncToGoogleSheets(): Promise<{
  recordsSynced: number;
  spreadsheetUrl: string;
}> {
  const config = await getGoogleConfig();
  if (!config?.reporting_spreadsheet_id) {
    throw new Error('Google Sheets not configured. Please set up a reporting spreadsheet first.');
  }

  const response = await fetch('http://localhost:3001/api/google/sheets/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spreadsheetId: config.reporting_spreadsheet_id,
      propertyId: config.analytics_property_id,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Sync failed' }));
    throw new Error(error.error || 'Sync failed');
  }

  return response.json();
}

/**
 * Tạo Dashboard Report tự động
 */
export async function generateDashboardReport(): Promise<{ spreadsheetUrl: string }> {
  const config = await getGoogleConfig();
  if (!config?.analytics_property_id) {
    throw new Error('Google Analytics not configured. Please set up Analytics first.');
  }

  // First create a new spreadsheet if no reporting spreadsheet exists
  if (!config.reporting_spreadsheet_id) {
    const createResponse = await fetch('http://localhost:3001/api/google/sheets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'LongSang Admin Dashboard Report' }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create spreadsheet');
    }

    const { spreadsheetId, spreadsheetUrl } = await createResponse.json();

    // Save the spreadsheet ID to config
    await saveGoogleConfig({ reporting_spreadsheet_id: spreadsheetId });

    return { spreadsheetUrl };
  }

  // Sync data to existing spreadsheet
  await syncToGoogleSheets();

  return {
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${config.reporting_spreadsheet_id}`,
  };
}

// ========================================
// SYNC LOGS MANAGEMENT
// ========================================

async function createSyncLog(service: SyncLog['service']): Promise<string> {
  const { data, error } = await supabase
    .from('google_sync_logs')
    .insert({
      service,
      status: 'running',
      records_synced: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function completeSyncLog(logId: string, recordsSynced: number) {
  await supabase
    .from('google_sync_logs')
    .update({
      status: 'success',
      records_synced: recordsSynced,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

async function failSyncLog(logId: string, errorMessage: string) {
  await supabase
    .from('google_sync_logs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId);
}

/**
 * Lấy sync logs
 */
export async function getSyncLogs(limit = 50): Promise<SyncLog[]> {
  const { data, error } = await supabase
    .from('google_sync_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ========================================
// QUICK ACTIONS
// ========================================

/**
 * Setup wizard - Tạo spreadsheet và config ban đầu
 */
export async function setupGoogleServices(analyticsPropertyId: string) {
  const response = await fetch('http://localhost:3001/api/google/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId: analyticsPropertyId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Setup failed' }));
    throw new Error(error.error || 'Setup failed');
  }

  return response.json();
}

/**
 * Test connection - Verify Google APIs
 */
export async function testGoogleConnection(analyticsPropertyId: string) {
  try {
    const response = await fetch('http://localhost:3001/api/google/analytics/overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: analyticsPropertyId,
        startDate: '1daysAgo',
        endDate: 'today',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Connection failed' }));
      return {
        success: false,
        message: error.error || 'Connection failed',
        recordsFound: 0,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Successfully connected to Google Analytics',
      recordsFound: Array.isArray(data) ? data.length : 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
      recordsFound: 0,
    };
  }
}
