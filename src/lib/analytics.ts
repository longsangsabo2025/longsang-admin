/**
 * Analytics Tracker - Unified tracking for all 4 products
 * LongSang, VungTauLand, SABO Arena, LS Secretary
 */

import React from "react";
import { supabase } from "./supabase";

export type ProductName = "longsang" | "vungtau" | "sabo-arena" | "ls-secretary";

export type EventType =
  | "page_view"
  | "click"
  | "form_submit"
  | "error"
  | "conversion"
  | "feature_used"
  | "user_action";

export interface AnalyticsEvent {
  productName: ProductName;
  eventType: EventType;
  eventName: string;
  eventCategory?: string;
  userId?: string;
  sessionId?: string;
  anonymousId?: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  properties?: Record<string, any>;
  pageLoadTime?: number;
  timeOnPage?: number;
}

export interface DailyStats {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  avgTime: number;
  conversions: number;
}

export interface ProductMetrics {
  product: string;
  activeUsers: number;
  totalUsers: number;
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
}

class AnalyticsTracker {
  private readonly productName: ProductName;
  private readonly sessionId: string;
  private readonly anonymousId: string;
  private pageLoadTime: number;
  private readonly pageStartTime: number;

  constructor(productName: ProductName) {
    this.productName = productName;
    this.sessionId = this.getOrCreateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.pageLoadTime = 0;
    this.pageStartTime = Date.now();

    // Track page load time using modern Performance API
    if (typeof globalThis.window !== "undefined") {
      globalThis.window.addEventListener("load", () => {
        // Use modern PerformanceNavigationTiming API
        const perfEntries = globalThis.window.performance.getEntriesByType(
          "navigation"
        ) as PerformanceNavigationTiming[];
        if (perfEntries.length > 0) {
          const perfData = perfEntries[0];
          this.pageLoadTime = perfData.loadEventEnd - perfData.fetchStart;
        }
      });
    }
  }

  /**
   * Track a custom event
   */
  async track(
    eventType: EventType,
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        productName: this.productName,
        eventType,
        eventName,
        sessionId: this.sessionId,
        anonymousId: this.anonymousId,
        pageUrl: globalThis.window.location.href,
        pageTitle: document.title,
        referrer: document.referrer,
        deviceType: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        properties: properties || {},
        pageLoadTime: this.pageLoadTime,
      };

      // Get user ID if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        event.userId = user.id;
      }

      // Send to Supabase
      const { error } = await supabase.rpc("track_analytics_event", {
        p_product_name: event.productName,
        p_event_type: event.eventType,
        p_event_name: event.eventName,
        p_user_id: event.userId || null,
        p_session_id: event.sessionId,
        p_properties: event.properties,
      });

      if (error) {
        console.error("Analytics tracking error:", error);
      }
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(pageName?: string): Promise<void> {
    await this.track("page_view", pageName || document.title, {
      url: globalThis.window.location.href,
      path: globalThis.window.location.pathname,
      referrer: document.referrer,
    });
  }

  /**
   * Track button click
   */
  async trackClick(buttonName: string, properties?: Record<string, any>): Promise<void> {
    await this.track("click", buttonName, properties);
  }

  /**
   * Track form submission
   */
  async trackFormSubmit(formName: string, properties?: Record<string, any>): Promise<void> {
    await this.track("form_submit", formName, properties);
  }

  /**
   * Track error
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.track("error", error.message, {
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Track conversion
   */
  async trackConversion(conversionName: string, value?: number): Promise<void> {
    await this.track("conversion", conversionName, {
      value,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName: string, properties?: Record<string, any>): Promise<void> {
    await this.track("feature_used", featureName, properties);
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  /**
   * Get or create anonymous ID
   */
  private getOrCreateAnonymousId(): string {
    let anonymousId = localStorage.getItem("analytics_anonymous_id");
    if (!anonymousId) {
      anonymousId = this.generateId();
      localStorage.setItem("analytics_anonymous_id", anonymousId);
    }
    return anonymousId;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): "desktop" | "mobile" | "tablet" {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  /**
   * Get browser name
   */
  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Opera")) return "Opera";
    return "Unknown";
  }

  /**
   * Get OS name
   */
  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Win")) return "Windows";
    if (ua.includes("Mac")) return "MacOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS")) return "iOS";
    return "Unknown";
  }

  /**
   * Track time on page (call when user leaves)
   */
  trackTimeOnPage(): void {
    const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000);
    this.track("page_view", "Page Exit", {
      timeOnPage,
      url: globalThis.window.location.href,
    });
  }
}

// ====================================================
// ANALYTICS API
// ====================================================

/**
 * Get daily stats for a product
 */
export async function getDailyStats(
  productName: ProductName,
  days: number = 7
): Promise<DailyStats[]> {
  const { data, error } = await supabase.rpc("get_daily_stats", {
    p_product_name: productName,
    p_days: days,
  });

  if (error) {
    console.error("Error fetching daily stats:", error);
    return [];
  }

  return data || [];
}

/**
 * Get product overview
 */
export async function getProductOverview(productName?: ProductName): Promise<ProductMetrics[]> {
  const { data, error } = await supabase.rpc("get_product_overview", {
    p_product_name: productName || null,
  });

  if (error) {
    console.error("Error fetching product overview:", error);
    return [];
  }

  return data || [];
}

/**
 * Get analytics events with filters
 */
export async function getAnalyticsEvents(filters: {
  productName?: ProductName;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let query = supabase
    .from("analytics_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.productName) {
    query = query.eq("product_name", filters.productName);
  }

  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  return data || [];
}

/**
 * Get 24-hour overview for all products
 */
export async function get24HourOverview() {
  const { data, error } = await supabase.from("analytics_24h_overview").select("*");

  if (error) {
    console.error("Error fetching 24h overview:", error);
    return [];
  }

  return data || [];
}

/**
 * Update product metrics
 */
export async function updateProductMetrics(
  productName: ProductName,
  metrics: {
    activeUsers?: number;
    uptime?: number;
    responseTime?: number;
    errorRate?: number;
  }
) {
  const { error } = await supabase.rpc("update_product_metrics", {
    p_product_name: productName,
    p_active_users: metrics.activeUsers || null,
    p_uptime: metrics.uptime || null,
    p_response_time: metrics.responseTime || null,
    p_error_rate: metrics.errorRate || null,
  });

  if (error) {
    console.error("Error updating product metrics:", error);
  }
}

// ====================================================
// REACT HOOKS
// ====================================================

/**
 * React Hook: Use Analytics Tracker
 */
export function useAnalytics(productName: ProductName) {
  const [tracker] = React.useState(() => new AnalyticsTracker(productName));

  React.useEffect(() => {
    // Track page view on mount
    tracker.trackPageView();

    // Track page exit
    const handleBeforeUnload = () => {
      tracker.trackTimeOnPage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [tracker]);

  return tracker;
}

/**
 * React Hook: Use Analytics Data
 */
export function useAnalyticsData(productName?: ProductName, days: number = 7) {
  const [stats, setStats] = React.useState<DailyStats[]>([]);
  const [overview, setOverview] = React.useState<ProductMetrics[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [dailyStats, productOverview] = await Promise.all([
        productName ? getDailyStats(productName, days) : Promise.resolve([]),
        getProductOverview(productName),
      ]);

      setStats(dailyStats);
      setOverview(productOverview);
      setLoading(false);
    }

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [productName, days]);

  return { stats, overview, loading };
}

// Export singleton instance for convenience
export const analytics = {
  longsang: new AnalyticsTracker("longsang"),
  vungtau: new AnalyticsTracker("vungtau"),
  saboArena: new AnalyticsTracker("sabo-arena"),
  lsSecretary: new AnalyticsTracker("ls-secretary"),
};

export default AnalyticsTracker;
