import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from './components/auth/AuthProvider';
import "./i18n/config";
import "./index.css";
import './lib/bug-system/autoSetup'; // Auto-initialize bug system
import { initSentry } from './lib/sentry';
import { initWebVitals } from './utils/web-vitals-tracker';
import { registerServiceWorker, setupInstallPrompt } from './lib/pwa';

// Initialize Sentry BEFORE React render (CRITICAL for error tracking)
// Enable for: production builds OR local preview (port 4173)
const isLocalPreview = window.location.hostname === 'localhost' && window.location.port === '4173';
if (import.meta.env.PROD || isLocalPreview) {
  initSentry();
}

// Initialize Core Web Vitals tracking
initWebVitals();

// Register PWA Service Worker
registerServiceWorker();
setupInstallPrompt();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
