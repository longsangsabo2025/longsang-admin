/**
 * Google Analytics Data API v4 Integration
 * Browser-safe version - Calls API server for all Google API operations
 */

const API_BASE = 'http://localhost:3001/api/google/analytics';

export interface AnalyticsMetrics {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  date: string;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  conversionRate: number;
}

export interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface DeviceBreakdown {
  device: string;
  sessions: number;
  users: number;
  percentage: number;
}

export interface PerformanceComparison {
  current: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  changes: {
    sessions: number;
    users: number;
    conversions: number;
    pageViews: number;
    bounceRate: number;
  };
}

/**
 * Helper function to make API calls
 */
async function apiCall<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Lấy metrics tổng quan theo khoảng thời gian
 */
export async function getAnalyticsOverview(
  propertyId: string,
  startDate: string = '7daysAgo',
  endDate: string = 'today'
): Promise<AnalyticsMetrics[]> {
  return apiCall<AnalyticsMetrics[]>('/overview', { propertyId, startDate, endDate });
}

/**
 * Lấy traffic sources (Organic, Paid, Social, etc.)
 */
export async function getTrafficSources(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<TrafficSource[]> {
  return apiCall<TrafficSource[]>('/traffic-sources', { propertyId, startDate, endDate });
}

/**
 * Lấy top pages theo pageviews
 */
export async function getTopPages(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today',
  limit: number = 20
): Promise<TopPage[]> {
  return apiCall<TopPage[]>('/top-pages', { propertyId, startDate, endDate, limit });
}

/**
 * Lấy real-time active users
 */
export async function getRealtimeUsers(propertyId: string): Promise<number> {
  const result = await apiCall<{ activeUsers: number }>('/realtime-users', { propertyId });
  return result.activeUsers;
}

/**
 * So sánh performance giữa 2 khoảng thời gian
 */
export async function comparePerformance(
  propertyId: string,
  currentStart: string = '7daysAgo',
  currentEnd: string = 'today',
  previousStart: string = '14daysAgo',
  previousEnd: string = '8daysAgo'
): Promise<PerformanceComparison | null> {
  try {
    return await apiCall<PerformanceComparison>('/compare-performance', {
      propertyId,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    });
  } catch {
    return null;
  }
}

/**
 * Lấy conversion paths (user journey)
 */
export async function getConversionPaths(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<Array<{ path: string; conversions: number; value: number }>> {
  return apiCall('/conversion-paths', { propertyId, startDate, endDate });
}

/**
 * Lấy device breakdown (Mobile, Desktop, Tablet)
 */
export async function getDeviceBreakdown(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<DeviceBreakdown[]> {
  return apiCall<DeviceBreakdown[]>('/device-breakdown', { propertyId, startDate, endDate });
}
