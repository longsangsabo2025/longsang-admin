import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  server: {
    host: "0.0.0.0",  // Listen on all interfaces
    port: 8080,
    open: "/admin", // 🚀 Auto open admin dashboard
    allowedHosts: true,  // Allow ALL hosts (for ngrok remote access)
    // HMR disabled for ngrok - use manual refresh on mobile
    hmr: process.env.NGROK_MODE ? false : { host: 'localhost' },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        configure: (proxy) => {
          // Suppress ALL proxy errors for optional endpoints (analytics, etc.)
          // Backend API is optional - analytics works without it
          proxy.on('error', (_err, _req, res) => {
            // Silently handle - don't log anything
            // Send empty response to prevent client-side errors
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Backend service unavailable' }));
            }
          });
        },
      },
      // n8n API proxy to bypass CORS
      "/n8n-api": {
        target: env.VITE_N8N_BASE_URL || "http://localhost:5678",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, "/api/v1"),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Forward n8n API key from env
            const apiKey = env.VITE_N8N_API_KEY;
            if (apiKey) {
              proxyReq.setHeader('X-N8N-API-KEY', apiKey);
            }
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Disable PWA in development to avoid caching issues
    mode !== "development" &&
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
        manifest: {
          name: "SABO ARENA - AI Automation Platform",
          short_name: "SABO ARENA",
          description: "Vietnam's leading gaming platform with AI automation",
          theme_color: "#3b82f6",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20MB limit (temporary for large vendor chunks)
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    // Bundle analyzer - generates stats.html
    mode === "analyze" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    exclude: [
      "googleapis",
      "google-auth-library",
      "@google-analytics/data",
      "google-spreadsheet",
      "gaxios",
      "gcp-metadata",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    // Increase chunk size warning limit (we know vendor is large)
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [
        "googleapis",
        "google-auth-library",
        "@google-analytics/data",
        "google-spreadsheet",
      ],
      output: {
        // SIMPLE & STABLE: Only split by page, let Vite handle vendor
        manualChunks(id) {
          // App pages - lazy loaded anyway
          if (id.includes("/pages/")) {
            // Admin pages
            if (id.includes("/pages/Admin")) {
              return "pages-admin";
            }
            // Agent pages  
            if (id.includes("/pages/Agent")) {
              return "pages-agent";
            }
            // Investment pages
            if (id.includes("/pages/Investment")) {
              return "pages-investment";
            }
            // Showcase pages
            if (id.includes("Showcase")) {
              return "pages-showcase";
            }
          }
          
          // Let Vite handle node_modules automatically
          // This ensures proper dependency ordering
          return undefined;
        },
      },
    },
  },
};
});
