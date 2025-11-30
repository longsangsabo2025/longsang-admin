/**
 * 📝 FIX REQUEST ROUTES
 * 
 * API để ghi fix request → Local watcher sẽ detect và mở VS Code
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS';
const WATCH_DIR = path.join(WORKSPACE_ROOT, '.copilot-errors');
const REQUEST_FILE = path.join(WATCH_DIR, 'fix-request.json');

// Ensure directory exists
if (!fs.existsSync(WATCH_DIR)) {
  fs.mkdirSync(WATCH_DIR, { recursive: true });
}

/**
 * POST /api/fix-request
 * Write fix request to file for local watcher
 */
router.post('/', (req, res) => {
  try {
    const {
      error,
      file,
      line,
      column,
      stacktrace,
      context,
      project,
      environment,
      count,
      userCount,
      sentryId,
      permalink
    } = req.body;

    const request = {
      id: `fix_${Date.now()}`,
      timestamp: new Date().toISOString(),
      error: error || 'Unknown error',
      file: file || null,
      line: line || null,
      column: column || null,
      stacktrace: stacktrace || null,
      context: context || null,
      project: project || 'longsang-admin',
      environment: environment || 'production',
      count: count || 1,
      userCount: userCount || 1,
      sentryId: sentryId || null,
      permalink: permalink || null
    };

    // Write to file - this triggers the watcher
    fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2), 'utf8');

    console.log(`[Fix Request] 📝 Written: ${request.id}`);
    console.log(`[Fix Request] 🐛 Error: ${error?.substring(0, 50)}...`);
    console.log(`[Fix Request] 📁 File: ${file || 'N/A'}`);

    res.json({
      success: true,
      message: 'Fix request written - VS Code will open automatically',
      requestId: request.id,
      watchFile: REQUEST_FILE
    });

  } catch (error) {
    console.error(`[Fix Request] ❌ Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fix-request/from-sentry
 * Convert Sentry error to fix request
 */
router.post('/from-sentry', (req, res) => {
  try {
    const { error: sentryError } = req.body;

    if (!sentryError) {
      return res.status(400).json({ error: 'No error data provided' });
    }

    // Extract file and line from culprit or stacktrace
    let file = null;
    let line = null;

    if (sentryError.culprit) {
      // Try to parse file path from culprit
      const match = sentryError.culprit.match(/([^:]+):(\d+)/);
      if (match) {
        file = match[1];
        line = parseInt(match[2]);
      }
    }

    // Check stacktrace for more accurate location
    if (sentryError.stacktrace && sentryError.stacktrace.length > 0) {
      const lastFrame = sentryError.stacktrace[sentryError.stacktrace.length - 1];
      if (lastFrame.filename) {
        file = lastFrame.filename;
        line = lastFrame.lineno;
      }
    }

    // Map project path
    if (file && !path.isAbsolute(file)) {
      // Try to resolve relative path
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

    const request = {
      id: sentryError.id || `fix_${Date.now()}`,
      timestamp: new Date().toISOString(),
      error: sentryError.title || sentryError.message,
      file,
      line,
      column: null,
      stacktrace: sentryError.stacktrace?.map(f => 
        `  at ${f.function || 'anonymous'} (${f.filename}:${f.lineno})`
      ).join('\n'),
      context: null,
      project: sentryError.project || 'longsang-admin',
      environment: sentryError.environment || 'production',
      count: sentryError.count || 1,
      userCount: sentryError.userCount || 1,
      sentryId: sentryError.shortId || sentryError.id,
      permalink: sentryError.permalink
    };

    // Write to file
    fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2), 'utf8');

    console.log(`[Fix Request] 📝 From Sentry: ${request.id}`);

    res.json({
      success: true,
      message: 'Fix request created from Sentry error',
      requestId: request.id,
      file: request.file,
      line: request.line
    });

  } catch (error) {
    console.error(`[Fix Request] ❌ Error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/fix-request/latest
 * Get latest fix request
 */
router.get('/latest', (req, res) => {
  try {
    if (!fs.existsSync(REQUEST_FILE)) {
      return res.json({ success: true, request: null });
    }

    const request = JSON.parse(fs.readFileSync(REQUEST_FILE, 'utf8'));
    res.json({ success: true, request });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/fix-request/status
 * Check if watcher is likely running
 */
router.get('/status', (req, res) => {
  const taskFile = path.join(WATCH_DIR, 'COPILOT_TASK.md');
  
  res.json({
    success: true,
    watchDir: WATCH_DIR,
    requestFile: REQUEST_FILE,
    taskFileExists: fs.existsSync(taskFile),
    lastRequest: fs.existsSync(REQUEST_FILE) 
      ? JSON.parse(fs.readFileSync(REQUEST_FILE, 'utf8')).timestamp 
      : null
  });
});

module.exports = router;
