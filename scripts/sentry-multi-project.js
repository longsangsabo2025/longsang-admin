/**
 * 🚨 SENTRY MULTI-PROJECT SETUP
 * ================================
 * Tự động setup Sentry cho tất cả projects trong workspace
 * Khi có error → Gửi về longsang-admin → Auto tạo PR fix
 */

const SENTRY_DSN = process.env.SENTRY_DSN || 'https://your-sentry-dsn@sentry.io/project';
const GITHUB_WEBHOOK_URL = 'https://api.github.com/repos/longsangsabo2025/longsang-admin/dispatches';

// Projects cần monitor
const PROJECTS = [
  { name: 'ainewbie-web', path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/ainewbie-web', type: 'react' },
  { name: 'ai-secretary', path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/ai_secretary', type: 'node' },
  { name: 'long-sang-forge', path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/long-sang-forge', type: 'react' },
  { name: 'vungtau-dream-homes', path: 'D:/0.PROJECTS/01-MAIN-PRODUCTS/vungtau-dream-homes', type: 'react' },
  { name: 'sabo-arena', path: 'D:/0.PROJECTS/02-SABO-ECOSYSTEM/sabo-arena', type: 'flutter' },
  { name: 'sabo-hub', path: 'D:/0.PROJECTS/02-SABO-ECOSYSTEM/sabo-hub', type: 'react' },
];

/**
 * Sentry error handler - gửi về GitHub để trigger auto-fix
 */
async function handleSentryError(error, projectName) {
  console.log(`🚨 Error from ${projectName}:`, error.message);
  
  // Gửi webhook đến GitHub để trigger Sentry Auto-Fix workflow
  try {
    const response = await fetch(GITHUB_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'sentry-error',
        client_payload: {
          error_title: error.name || 'Error',
          error_message: error.message,
          file_path: error.stack?.match(/at\s+.*?\s+\((.*?):\d+:\d+\)/)?.[1] || 'unknown',
          line_number: error.stack?.match(/:(\d+):\d+\)/)?.[1] || '0',
          project: projectName,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ Sent to GitHub for auto-fix');
    }
  } catch (e) {
    console.error('Failed to send to GitHub:', e);
  }
}

/**
 * Generate Sentry init code for React projects
 */
function getReactSentryCode(projectName) {
  return `
// 🚨 Sentry Error Tracking - Auto-fix enabled
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "${SENTRY_DSN}",
  environment: process.env.NODE_ENV,
  release: "${projectName}@" + process.env.npm_package_version,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Custom hook để gửi về longsang-admin
  beforeSend(event) {
    // Gửi webhook đến GitHub để trigger auto-fix
    if (event.exception) {
      fetch('${GITHUB_WEBHOOK_URL}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'sentry-error',
          client_payload: {
            error_title: event.exception.values?.[0]?.type || 'Error',
            error_message: event.exception.values?.[0]?.value || 'Unknown error',
            file_path: event.exception.values?.[0]?.stacktrace?.frames?.[0]?.filename || 'unknown',
            line_number: String(event.exception.values?.[0]?.stacktrace?.frames?.[0]?.lineno || 0),
            project: '${projectName}'
          }
        })
      }).catch(console.error);
    }
    return event;
  }
});
`;
}

/**
 * Generate Sentry init code for Node.js projects
 */
function getNodeSentryCode(projectName) {
  return `
// 🚨 Sentry Error Tracking - Auto-fix enabled
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "${SENTRY_DSN}",
  environment: process.env.NODE_ENV || 'development',
  release: "${projectName}@" + require('./package.json').version,
  tracesSampleRate: 1.0,
  
  // Custom hook để gửi về longsang-admin
  beforeSend(event) {
    // Gửi webhook đến GitHub để trigger auto-fix
    if (event.exception) {
      const https = require('https');
      const data = JSON.stringify({
        event_type: 'sentry-error',
        client_payload: {
          error_title: event.exception.values?.[0]?.type || 'Error',
          error_message: event.exception.values?.[0]?.value || 'Unknown error',
          file_path: event.exception.values?.[0]?.stacktrace?.frames?.[0]?.filename || 'unknown',
          line_number: String(event.exception.values?.[0]?.stacktrace?.frames?.[0]?.lineno || 0),
          project: '${projectName}'
        }
      });
      
      const req = https.request('${GITHUB_WEBHOOK_URL}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      });
      req.write(data);
      req.end();
    }
    return event;
  }
});

// Export for use
module.exports = Sentry;
`;
}

module.exports = {
  PROJECTS,
  handleSentryError,
  getReactSentryCode,
  getNodeSentryCode
};

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           🚨 SENTRY MULTI-PROJECT AUTO-FIX SYSTEM                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Projects configured for auto-fix:                               ║
║  ${PROJECTS.map(p => `• ${p.name} (${p.type})`).join('\n║  ')}
║                                                                  ║
║  Flow:                                                           ║
║  App Error → Sentry → GitHub Webhook → Auto-Fix PR               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
