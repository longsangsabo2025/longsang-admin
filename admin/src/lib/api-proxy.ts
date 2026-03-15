/**
 * API Proxy Interceptor
 *
 * Intercepts fetch('/api/...') calls and redirects them to the actual API server.
 * This avoids relying on Vercel's rewrite proxy (which has Host header issues with Render).
 *
 * Usage: import this file once in main.tsx (before any API calls).
 */

// Only activate in production builds — in dev, Vite's server proxy handles /api/* forwarding
const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL || '' : '';

if (API_BASE) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: string;

    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      return originalFetch(input, init);
    }

    // Only intercept relative /api/ paths
    if (url.startsWith('/api/')) {
      const targetUrl = `${API_BASE}${url}`;

      if (input instanceof Request) {
        // Clone the request with new URL
        const newRequest = new Request(targetUrl, input);
        return originalFetch(newRequest, init);
      }

      return originalFetch(targetUrl, init);
    }

    return originalFetch(input, init);
  };

  console.log(`[API Proxy] Redirecting /api/* → ${API_BASE}/api/*`);
}
