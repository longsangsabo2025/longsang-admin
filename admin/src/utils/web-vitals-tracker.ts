/**
 * Core Web Vitals Tracking
 * Monitors LCP, INP, CLS and reports to analytics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Rating thresholds theo Google
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(
  name: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: WebVitalMetric) {
  // Send to your analytics service
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { gtag?: unknown }).gtag) {
    (globalThis as unknown as { gtag: Function }).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
      metric_rating: metric.rating,
    });
  }

  // Send to custom analytics endpoint (if configured)
  sendToCustomEndpoint(metric);
}

async function sendToCustomEndpoint(metric: WebVitalMetric) {
  // Skip custom endpoint in development mode (backend may not be running)
  // This prevents console spam from failed proxy requests
  if (import.meta.env.DEV) {
    return;
  }

  try {
    const response = await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        page: globalThis.location?.pathname || '/',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => null); // Silently fail if endpoint unavailable

    // Ignore errors - analytics is optional
    if (!response?.ok) {
      return;
    }
  } catch {
    // Silently fail - endpoint is optional
  }
}

/**
 * Initialize Core Web Vitals tracking
 * Call this once when your app loads
 */
export function initWebVitals() {
  // Largest Contentful Paint
  onLCP((metric) => {
    sendToAnalytics({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
      delta: metric.delta,
      id: metric.id,
    });
  });

  // Interaction to Next Paint (replaces FID in web-vitals v4)
  onINP((metric) => {
    sendToAnalytics({
      name: 'INP',
      value: metric.value,
      rating: getRating('INP', metric.value),
      delta: metric.delta,
      id: metric.id,
    });
  });

  // Cumulative Layout Shift
  onCLS((metric) => {
    sendToAnalytics({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
      delta: metric.delta,
      id: metric.id,
    });
  });

  // First Contentful Paint
  onFCP((metric) => {
    sendToAnalytics({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
      delta: metric.delta,
      id: metric.id,
    });
  });

  // Time to First Byte
  onTTFB((metric) => {
    sendToAnalytics({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
      delta: metric.delta,
      id: metric.id,
    });
  });

  // Interaction to Next Paint (replaces FID)
  onINP((metric) => {
    sendToAnalytics({
      name: 'INP',
      value: metric.value,
      rating: getRating('INP', metric.value),
      delta: metric.delta,
      id: metric.id,
    });
  });
}

/**
 * Get current Web Vitals status
 */
export async function getWebVitalsStatus() {
  return new Promise((resolve) => {
    const metrics: Record<string, WebVitalMetric> = {};
    let collected = 0;
    const expected = 6;

    const checkComplete = () => {
      if (collected >= expected) {
        resolve(metrics);
      }
    };

    onLCP((metric) => {
      metrics.LCP = {
        name: 'LCP',
        value: metric.value,
        rating: getRating('LCP', metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      collected++;
      checkComplete();
    });

    onINP((metric) => {
      metrics.INP = {
        name: 'INP',
        value: metric.value,
        rating: getRating('INP', metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      collected++;
      checkComplete();
    });

    onCLS((metric) => {
      metrics.CLS = {
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      collected++;
      checkComplete();
    });

    onFCP((metric) => {
      metrics.FCP = {
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      collected++;
      checkComplete();
    });

    onTTFB((metric) => {
      metrics.TTFB = {
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      collected++;
      checkComplete();
    });

    onINP((metric) => {
      metrics.INP = {
        name: 'INP',
        value: metric.value,
        rating: getRating('INP', metric.value),
        delta: metric.delta,
        id: metric.id,
      };
      collected++;
      checkComplete();
    });

    // Timeout after 10 seconds
    setTimeout(() => resolve(metrics), 10000);
  });
}
