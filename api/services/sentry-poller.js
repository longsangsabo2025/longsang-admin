/**
 * Sentry Poller Service v2
 * 
 * ✅ KHÔNG dùng Claude API
 * ✅ Ghi error ra file → VS Code Copilot tự fix
 * ✅ Polling Sentry API mỗi 30 giây
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { getBridge } = require('./websocket-bridge');

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = process.env.SENTRY_ORG || 'sabo-od';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'javascript-react';
const POLL_INTERVAL = 30000; // 30 seconds
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS';
const WATCH_DIR = path.join(WORKSPACE_ROOT, '.copilot-errors');
const REQUEST_FILE = path.join(WATCH_DIR, 'fix-request.json');

// Track processed issues to avoid duplicates
const processedIssues = new Set();

// Ensure directory exists
if (!fs.existsSync(WATCH_DIR)) {
  fs.mkdirSync(WATCH_DIR, { recursive: true });
}

/**
 * Fetch latest issues from Sentry API
 */
async function fetchSentryIssues() {
  if (!SENTRY_AUTH_TOKEN) {
    console.log('[Sentry Poller] ⚠️ No auth token configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=is:unresolved&statsPeriod=24h`,
      {
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Sentry API error: ${response.status}`);
    }

    const issues = await response.json();
    return issues;
  } catch (error) {
    console.error('[Sentry Poller] ❌ Fetch error:', error.message);
    return [];
  }
}

/**
 * Get issue details including stacktrace
 */
async function getIssueDetails(issueId) {
  try {
    const response = await fetch(
      `https://sentry.io/api/0/issues/${issueId}/events/latest/`,
      {
        headers: {
          'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[Sentry Poller] ❌ Issue details error:', error.message);
    return null;
  }
}

/**
 * Write error to file for Copilot (NO CLAUDE!)
 */
function writeErrorForCopilot(issue, eventDetails) {
  // Extract stacktrace
  const stacktrace = eventDetails?.entries?.find(e => e.type === 'exception')?.data?.values?.[0]?.stacktrace?.frames || [];
  
  // Find file and line from stacktrace
  let file = null;
  let line = null;
  
  if (stacktrace.length > 0) {
    const lastFrame = stacktrace[stacktrace.length - 1];
    file = lastFrame.filename;
    line = lastFrame.lineno;
    
    // Try to resolve to local path
    if (file && !path.isAbsolute(file)) {
      const possiblePaths = [
        path.join(WORKSPACE_ROOT, '00-MASTER-ADMIN/longsang-admin/src', file),
        path.join(WORKSPACE_ROOT, '00-MASTER-ADMIN/longsang-admin', file),
        path.join(WORKSPACE_ROOT, file)
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          file = p;
          break;
        }
      }
    }
  }

  const request = {
    id: issue.shortId || issue.id,
    timestamp: new Date().toISOString(),
    error: issue.title,
    message: issue.metadata?.value || issue.culprit,
    file,
    line,
    column: stacktrace[stacktrace.length - 1]?.colno || null,
    stacktrace: stacktrace.slice(-10).map(f => 
      `  at ${f.function || 'anonymous'} (${f.filename}:${f.lineno}:${f.colno || 0})`
    ).reverse().join('\n'),
    context: null,
    project: SENTRY_PROJECT,
    environment: eventDetails?.environment || 'production',
    count: issue.count,
    userCount: issue.userCount,
    sentryId: issue.shortId,
    permalink: issue.permalink
  };

  // Write to file - this triggers the local watcher!
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2), 'utf8');
  
  console.log(`[Sentry Poller] 📝 Written to fix-request.json`);
  console.log(`[Sentry Poller] 👀 Local watcher will open VS Code + Copilot`);
  
  return request;
}

/**
 * Process new issues - NO CLAUDE, just file write!
 */
async function processNewIssues(issues) {
  const bridge = getBridge();
  
  for (const issue of issues) {
    // Skip already processed
    if (processedIssues.has(issue.id)) continue;
    
    // Mark as processed
    processedIssues.add(issue.id);
    
    // Keep set manageable
    if (processedIssues.size > 1000) {
      const oldest = Array.from(processedIssues).slice(0, 500);
      oldest.forEach(id => processedIssues.delete(id));
    }

    console.log(`[Sentry Poller] 🆕 New issue: ${issue.title}`);

    // Get detailed event info
    const eventDetails = await getIssueDetails(issue.id);
    
    // Write to file for Copilot (NO CLAUDE!)
    const request = writeErrorForCopilot(issue, eventDetails);

    // Format error for WebSocket Bridge (for Dashboard)
    const errorData = {
      id: issue.id,
      shortId: issue.shortId,
      title: issue.title,
      culprit: issue.culprit,
      level: issue.level,
      platform: issue.platform,
      count: issue.count,
      userCount: issue.userCount,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
      status: issue.status,
      permalink: issue.permalink,
      metadata: issue.metadata,
      // No Claude analysis - Copilot will do it!
      analysis: '⏳ Open COPILOT_TASK.md in VS Code and use Copilot Chat (Ctrl+I) to analyze',
      suggestedFix: null,
      eventDetails: eventDetails ? {
        environment: eventDetails.environment,
        tags: eventDetails.tags,
        contexts: eventDetails.contexts
      } : null,
      // Add file info for "Open in VS Code" button
      fileInfo: {
        file: request.file,
        line: request.line
      }
    };

    // Broadcast to WebSocket clients (Dashboard)
    if (bridge) {
      bridge.broadcastError({
        type: 'sentry_error',
        source: 'poller',
        error: errorData,
        timestamp: new Date().toISOString()
      });
    }

    // Log summary
    console.log(`[Sentry Poller] 📊 Issue ${issue.shortId}:`);
    console.log(`   - Title: ${issue.title}`);
    console.log(`   - Count: ${issue.count} | Users: ${issue.userCount}`);
    console.log(`   - File: ${request.file || 'N/A'}`);
    console.log(`   - Line: ${request.line || 'N/A'}`);
  }
}

/**
 * Main polling loop
 */
let pollInterval = null;

function startSentryPoller() {
  if (pollInterval) {
    console.log('[Sentry Poller] Already running');
    return;
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║    🔍 SENTRY POLLER v2 - Copilot File Watcher Mode     ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Org:        ${SENTRY_ORG.padEnd(42)}║`);
  console.log(`║  Project:    ${SENTRY_PROJECT.padEnd(42)}║`);
  console.log(`║  Interval:   ${(POLL_INTERVAL/1000 + 's').padEnd(42)}║`);
  console.log(`║  Mode:       📁 File Watcher (No Claude API!)          ║`);
  console.log(`║  Status:     ✅ Active                                  ║`);
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📁 Errors will be written to: ${WATCH_DIR}`);
  console.log(`👀 Run local-watcher.js to auto-open VS Code + Copilot`);
  console.log('');

  // Initial poll
  poll();

  // Schedule recurring polls
  pollInterval = setInterval(poll, POLL_INTERVAL);
}

async function poll() {
  console.log(`[Sentry Poller] 🔄 Polling at ${new Date().toLocaleTimeString()}`);
  
  const issues = await fetchSentryIssues();
  
  if (issues.length > 0) {
    console.log(`[Sentry Poller] 📥 Found ${issues.length} unresolved issues`);
    await processNewIssues(issues);
  } else {
    console.log('[Sentry Poller] ✅ No new issues');
  }
}

function stopSentryPoller() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('[Sentry Poller] 🛑 Stopped');
  }
}

function getPollerStats() {
  return {
    running: !!pollInterval,
    processedCount: processedIssues.size,
    pollInterval: POLL_INTERVAL,
    org: SENTRY_ORG,
    project: SENTRY_PROJECT,
    mode: 'file-watcher',
    watchDir: WATCH_DIR
  };
}

module.exports = {
  startSentryPoller,
  stopSentryPoller,
  getPollerStats,
  poll,
  writeErrorForCopilot
};

// Auto-start if run directly
if (require.main === module) {
  startSentryPoller();
}
