import * as Sentry from '@sentry/react';

// Check if we should enable Sentry (production OR local preview with DSN)
const shouldEnableSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProduction = import.meta.env.PROD;
  const isLocalPreview =
    window.location.hostname === 'localhost' && window.location.port === '4173';

  // Enable if: has DSN AND (is production OR is local preview)
  return !!dsn && (isProduction || isLocalPreview);
};

export const initSentry = () => {
  const enabled = shouldEnableSentry();

  if (enabled) {
    console.log('[Sentry] Initializing error tracking...');
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Environment: differentiate local-preview from production
    environment: window.location.hostname === 'localhost' ? 'local-preview' : import.meta.env.MODE,
    // ALWAYS enable if DSN exists (for local testing)
    enabled: enabled,
    // Debug mode for local
    debug: window.location.hostname === 'localhost',
    // Before send hook - also trigger local Copilot Bridge
    beforeSend(event, hint) {
      // Try to send to local Copilot Bridge API
      if (window.location.hostname === 'localhost') {
        sendToLocalCopilotBridge(event, hint);
      }
      return event;
    },
  });
};

// Send error to local Copilot Bridge for VS Code integration
async function sendToLocalCopilotBridge(event: Sentry.Event, hint: Sentry.EventHint) {
  try {
    const exception = hint.originalException as Error;
    const stacktrace = event.exception?.values?.[0]?.stacktrace?.frames || [];
    const lastFrame = stacktrace[stacktrace.length - 1];

    // Extract file path from stacktrace
    let file = lastFrame?.filename || '';
    const line = lastFrame?.lineno || 1;

    // Convert URL to local path
    if (file.includes('localhost')) {
      file = file.replace(
        /http:\/\/localhost:\d+\//,
        'D:/0.PROJECTS/00-MASTER-ADMIN/longsang-admin/'
      );
    }

    const payload = {
      file,
      line,
      error: event.message || exception?.message || 'Unknown error',
      stacktrace: stacktrace
        .map((f) => `  at ${f.function || 'anonymous'} (${f.filename}:${f.lineno}:${f.colno})`)
        .reverse()
        .join('\n'),
      context: exception?.stack,
      project: 'longsang-admin',
      environment: 'local-preview',
      sentryId: event.event_id,
    };

    // Send to local API
    await fetch('http://localhost:3001/api/fix-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('[Sentry → Copilot Bridge] Error sent to VS Code!');
  } catch (e) {
    // Silently fail - API might not be running
    console.log('[Sentry → Copilot Bridge] API not available');
  }
}

export default Sentry;
