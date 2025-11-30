/**
 * 🔄 COPILOT FILE WATCHER SYSTEM
 * 
 * Flow:
 * 1. Sentry Poller lấy error mới
 * 2. Ghi error vào file `.copilot-errors/latest.md`
 * 3. VS Code detect file change
 * 4. Bạn mở file → Copilot Chat tự động suggest fix
 * 
 * Không cần Claude API! Dùng Copilot trong IDE!
 */

const fs = require('fs');
const path = require('path');

const ERRORS_DIR = path.join(process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS', '.copilot-errors');

// Ensure directory exists
if (!fs.existsSync(ERRORS_DIR)) {
  fs.mkdirSync(ERRORS_DIR, { recursive: true });
}

/**
 * Write error to file for Copilot to analyze
 */
function writeErrorForCopilot(error, eventDetails = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `error-${timestamp}.md`;
  const filepath = path.join(ERRORS_DIR, filename);
  
  // Also update latest.md for quick access
  const latestPath = path.join(ERRORS_DIR, 'LATEST_ERROR.md');
  
  const stacktrace = eventDetails?.entries?.find(e => e.type === 'exception')?.data?.values?.[0]?.stacktrace?.frames || [];
  const stackLines = stacktrace.slice(-10).map(f => 
    `  at ${f.function || 'anonymous'} (${f.filename}:${f.lineno}:${f.colno || 0})`
  ).reverse().join('\n');

  const content = `# 🚨 SENTRY ERROR - Fix with Copilot

> **Tip:** Select all text (Ctrl+A) → Press Ctrl+I → Ask Copilot: "Fix this error"

---

## Error Details

| Field | Value |
|-------|-------|
| **ID** | ${error.id || error.shortId || 'N/A'} |
| **Title** | ${error.title} |
| **Level** | ${error.level || 'error'} |
| **Platform** | ${error.platform || 'javascript'} |
| **Environment** | ${eventDetails?.environment || error.environment || 'production'} |
| **Occurrences** | ${error.count || 1} |
| **Users Affected** | ${error.userCount || 1} |
| **First Seen** | ${error.firstSeen || 'N/A'} |
| **Last Seen** | ${error.lastSeen || new Date().toISOString()} |

---

## Error Message

\`\`\`
${error.title}
${error.metadata?.value || error.message || ''}
\`\`\`

---

## Location

\`\`\`
${error.culprit || 'Unknown location'}
\`\`\`

---

## Stack Trace

\`\`\`javascript
${stackLines || 'No stack trace available'}
\`\`\`

---

## Context

${eventDetails?.contexts ? `
**Browser:** ${eventDetails.contexts.browser?.name || 'N/A'} ${eventDetails.contexts.browser?.version || ''}
**OS:** ${eventDetails.contexts.os?.name || 'N/A'} ${eventDetails.contexts.os?.version || ''}
**Device:** ${eventDetails.contexts.device?.family || 'N/A'}
` : 'No context available'}

---

## Tags

${eventDetails?.tags ? eventDetails.tags.map(t => `- **${t.key}:** ${t.value}`).join('\n') : 'No tags'}

---

## 🤖 Instructions for Copilot

Please analyze this error and:

1. **Identify the root cause** - What's causing this error?
2. **Suggest a fix** - Provide code to fix this issue
3. **Prevent regression** - How to prevent this in the future?

---

## Sentry Link

${error.permalink ? `[View in Sentry](${error.permalink})` : 'No link available'}

---

*Generated: ${new Date().toLocaleString('vi-VN')}*
`;

  // Write individual error file
  fs.writeFileSync(filepath, content, 'utf8');
  
  // Update latest error file (this triggers VS Code file watcher)
  fs.writeFileSync(latestPath, content, 'utf8');
  
  console.log(`[Copilot Writer] 📝 Error written to: ${filename}`);
  console.log(`[Copilot Writer] 📌 Latest updated: LATEST_ERROR.md`);
  
  // Also create a summary file listing all errors
  updateErrorIndex();
  
  return { filepath, latestPath };
}

/**
 * Update error index file
 */
function updateErrorIndex() {
  const files = fs.readdirSync(ERRORS_DIR)
    .filter(f => f.startsWith('error-') && f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, 20); // Keep last 20
  
  const indexContent = `# 📋 Sentry Errors Index

> Open any file and use Copilot Chat (Ctrl+I) to analyze and fix

## Recent Errors (Last 20)

| # | File | Time |
|---|------|------|
${files.map((f, i) => {
  const time = f.replace('error-', '').replace('.md', '').replace(/-/g, ':').slice(0, 19);
  return `| ${i + 1} | [${f}](./${f}) | ${time} |`;
}).join('\n')}

---

## Quick Actions

1. **Open LATEST_ERROR.md** - Most recent error
2. **Select all content** (Ctrl+A)
3. **Open Copilot Chat** (Ctrl+I)
4. **Ask:** "Analyze this error and suggest a fix"

---

*Updated: ${new Date().toLocaleString('vi-VN')}*
`;

  fs.writeFileSync(path.join(ERRORS_DIR, 'INDEX.md'), indexContent, 'utf8');
}

/**
 * Clear old error files (keep last N)
 */
function cleanupOldErrors(keepCount = 50) {
  const files = fs.readdirSync(ERRORS_DIR)
    .filter(f => f.startsWith('error-') && f.endsWith('.md'))
    .sort()
    .reverse();
  
  if (files.length > keepCount) {
    const toDelete = files.slice(keepCount);
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(ERRORS_DIR, f));
    });
    console.log(`[Copilot Writer] 🗑️ Cleaned up ${toDelete.length} old error files`);
  }
}

/**
 * Get stats
 */
function getStats() {
  const files = fs.readdirSync(ERRORS_DIR).filter(f => f.endsWith('.md'));
  return {
    totalFiles: files.length,
    directory: ERRORS_DIR,
    latestFile: path.join(ERRORS_DIR, 'LATEST_ERROR.md'),
    indexFile: path.join(ERRORS_DIR, 'INDEX.md')
  };
}

module.exports = {
  writeErrorForCopilot,
  updateErrorIndex,
  cleanupOldErrors,
  getStats,
  ERRORS_DIR
};
