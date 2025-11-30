/**
 * 🤖 COPILOT AUTO-FIX WATCHER
 * 
 * Khi có error từ Sentry → TỰ ĐỘNG gửi cho Copilot fix luôn!
 * Không cần user làm gì cả - fully automated.
 * 
 * Usage: node local-watcher.js
 */

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { exec, spawn, execSync } = require('child_process');

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS';
const PROJECT_ROOT = path.join(WORKSPACE_ROOT, '00-MASTER-ADMIN/longsang-admin');

// VS Code executable path - Windows default location
const VSCODE_PATH = process.env.VSCODE_PATH || 
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe');

// Check if VS Code exists
if (!fs.existsSync(VSCODE_PATH)) {
  console.error(`❌ VS Code not found at: ${VSCODE_PATH}`);
  console.error('   Set VSCODE_PATH environment variable to your VS Code installation');
}

const WATCH_DIR = path.join(WORKSPACE_ROOT, '.copilot-errors');
const REQUEST_FILE = path.join(WATCH_DIR, 'fix-request.json');
const TASK_FILE = path.join(WATCH_DIR, 'COPILOT_TASK.md');
const FIX_LOG = path.join(WATCH_DIR, 'fix-history.json');

// Track processed errors to avoid duplicates
let processedErrors = new Set();
let isProcessing = false;

// Ensure directory exists
if (!fs.existsSync(WATCH_DIR)) {
  fs.mkdirSync(WATCH_DIR, { recursive: true });
}

// Load fix history - ensure it's always an array
let fixHistory = [];
if (fs.existsSync(FIX_LOG)) {
  try {
    const data = JSON.parse(fs.readFileSync(FIX_LOG, 'utf8'));
    // Handle both single object and array formats
    if (Array.isArray(data)) {
      fixHistory = data;
    } else if (data && typeof data === 'object') {
      fixHistory = [data]; // Convert single object to array
    }
  } catch (e) { 
    console.log('⚠️ Could not parse fix-history.json, starting fresh');
    fixHistory = []; 
  }
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     🤖 COPILOT AUTO-FIX WATCHER - Fully Automated Mode        ║
╠═══════════════════════════════════════════════════════════════╣
║  Mode:       🚀 AUTO-FIX (No manual intervention needed!)     ║
║  Watching:   ${REQUEST_FILE.substring(0, 45).padEnd(45)} ║
║  Status:     🟢 Active                                         ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Initialize watcher
const watcher = chokidar.watch(REQUEST_FILE, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

watcher.on('change', async (filepath) => {
  // Prevent concurrent processing
  if (isProcessing) {
    console.log(`⏳ Already processing an error, queuing...`);
    return;
  }
  
  isProcessing = true;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📥 [${new Date().toLocaleTimeString()}] New fix request detected!`);
  
  try {
    const request = JSON.parse(fs.readFileSync(REQUEST_FILE, 'utf-8'));
    
    // Check for duplicates
    const errorKey = `${request.error}-${request.file}-${request.line}`;
    if (processedErrors.has(errorKey)) {
      console.log(`⚠️ Duplicate error, skipping...`);
      isProcessing = false;
      return;
    }
    processedErrors.add(errorKey);
    
    // Keep set manageable
    if (processedErrors.size > 100) {
      processedErrors = new Set(Array.from(processedErrors).slice(-50));
    }
    
    console.log(`🐛 Error: ${request.error?.substring(0, 60)}...`);
    console.log(`📁 File: ${request.file}`);
    console.log(`📍 Line: ${request.line}`);
    
    // 1. Create COPILOT_TASK.md
    const taskContent = generateTaskContent(request);
    fs.writeFileSync(TASK_FILE, taskContent, 'utf8');
    console.log(`📝 Task file created`);
    
    // 2. AUTO-FIX: Use VS Code Copilot Agent Mode via CLI
    await autoFixWithCopilot(request);
    
    // 3. Log to history
    logFixAttempt(request);
    
    // 4. Show notification
    showNotification(request, 'auto-fixing');
    
  } catch (error) {
    console.error(`❌ Error processing request: ${error.message}`);
  } finally {
    isProcessing = false;
  }
});

/**
 * 🤖 AUTO-FIX: Trigger Copilot to fix the error automatically
 */
async function autoFixWithCopilot(request) {
  console.log(`\n🤖 Triggering Copilot Auto-Fix...`);
  
  const targetFile = request.file;
  const errorMessage = request.error || 'Unknown error';
  const line = request.line || 1;
  const stacktrace = request.stacktrace || '';
  
  // Build the fix prompt
  const fixPrompt = `Fix this error in ${path.basename(targetFile)} at line ${line}:

ERROR: ${errorMessage}

STACKTRACE:
${stacktrace}

Please analyze and fix the bug. Apply the fix directly to the file.`;

  // Method 1: Use VS Code URI handler with Copilot Chat
  // vscode://github.copilot-chat/open?message=...
  const encodedPrompt = encodeURIComponent(fixPrompt);
  const copilotUri = `vscode://github.copilot-chat/open?message=${encodedPrompt}`;
  
  // Method 2: Create a .github/copilot-instructions file for context
  await createCopilotContext(request);
  
  // Open the error file first
  if (targetFile && fs.existsSync(targetFile)) {
    const gotoArg = `--goto "${targetFile}:${line}"`;
    
    // Open file at error location
    exec(`powershell -Command "Start-Process -FilePath '${VSCODE_PATH}' -ArgumentList '${gotoArg}'"`, (err) => {
      if (!err) {
        console.log(`✅ Opened: ${path.basename(targetFile)}:${line}`);
      }
    });
    
    // Wait for VS Code to open the file
    await sleep(1500);
    
    // Trigger Copilot Chat via URI
    exec(`powershell -Command "Start-Process '${copilotUri}'"`, (err) => {
      if (!err) {
        console.log(`🤖 Copilot Chat triggered with fix request!`);
      } else {
        console.log(`⚠️ Copilot URI failed, trying keyboard simulation...`);
        triggerCopilotViaKeyboard(fixPrompt);
      }
    });
    
    // Also trigger inline fix (Ctrl+I)
    await sleep(500);
    triggerInlineFix(targetFile, line, errorMessage);
    
  } else {
    console.log(`⚠️ File not found locally: ${targetFile}`);
    console.log(`📝 Check COPILOT_TASK.md for manual fix instructions`);
    
    // Open task file instead
    exec(`powershell -Command "Start-Process -FilePath '${VSCODE_PATH}' -ArgumentList '\"${TASK_FILE}\"'"`);
  }
}

/**
 * Create .copilot-fix-context.md for Copilot to read
 */
async function createCopilotContext(request) {
  const contextFile = path.join(PROJECT_ROOT, '.copilot-fix-context.md');
  
  const content = `# 🔧 Current Fix Task

## Error to Fix
\`\`\`
${request.error}
\`\`\`

## Location
- **File:** ${request.file}
- **Line:** ${request.line}

## Stack Trace
\`\`\`
${request.stacktrace || 'N/A'}
\`\`\`

## Instructions
Please fix this error. The bug is likely at line ${request.line}.

---
*Auto-generated by Copilot Watcher*
`;

  fs.writeFileSync(contextFile, content, 'utf8');
}

/**
 * Trigger Copilot inline fix via simulated keypresses
 */
function triggerInlineFix(file, line, error) {
  // Use PowerShell to simulate Ctrl+I (Copilot inline)
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms

# Wait for VS Code to be active
Start-Sleep -Milliseconds 500

# Send Ctrl+I to trigger Copilot Inline Chat
[System.Windows.Forms.SendKeys]::SendWait("^i")

# Wait and type the fix request
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("Fix this error: ${error.replace(/[+^%~(){}[\]"']/g, ' ').substring(0, 100)}")

# Press Enter to submit
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
`;

  // Write to temp file and execute
  const tempPs1 = path.join(WATCH_DIR, 'trigger-copilot.ps1');
  fs.writeFileSync(tempPs1, psScript, 'utf8');
  
  exec(`powershell -ExecutionPolicy Bypass -File "${tempPs1}"`, (err) => {
    if (!err) {
      console.log(`⌨️ Copilot Inline triggered via Ctrl+I`);
    }
  });
}

/**
 * Fallback: Trigger Copilot via keyboard simulation
 */
function triggerCopilotViaKeyboard(prompt) {
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Start-Sleep -Milliseconds 500

# Open Copilot Chat: Ctrl+Alt+I
[System.Windows.Forms.SendKeys]::SendWait("^%i")
Start-Sleep -Milliseconds 500

# Type: @workspace /fix
[System.Windows.Forms.SendKeys]::SendWait("@workspace /fix ")
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
`;

  const tempPs1 = path.join(WATCH_DIR, 'trigger-copilot-chat.ps1');
  fs.writeFileSync(tempPs1, psScript, 'utf8');
  
  exec(`powershell -ExecutionPolicy Bypass -File "${tempPs1}"`);
}

/**
 * Log fix attempt to history
 */
function logFixAttempt(request) {
  const entry = {
    id: `fix_${Date.now()}`,
    timestamp: new Date().toISOString(),
    error: request.error,
    file: request.file,
    line: request.line,
    status: 'auto-fix-triggered',
    sentryId: request.sentryId || null,
    project: request.project || 'longsang-admin'
  };
  
  // Add to beginning (newest first)
  fixHistory.unshift(entry);
  
  // Keep last 100 entries
  if (fixHistory.length > 100) {
    fixHistory = fixHistory.slice(0, 100);
  }
  
  // Ensure we always write an array
  fs.writeFileSync(FIX_LOG, JSON.stringify(fixHistory, null, 2), 'utf8');
  console.log(`📝 Fix logged: ${entry.id}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

watcher.on('error', (error) => {
  console.error(`❌ Watcher error: ${error.message}`);
});

/**
 * Generate task content for Copilot
 */
function generateTaskContent(request) {
  return `# 🔧 COPILOT FIX REQUEST

> **Instructions:** Select all (Ctrl+A) → Open Copilot Chat (Ctrl+I) → Ask: "Fix this error"

---

## 🚨 Error

\`\`\`
${request.error || 'Unknown error'}
\`\`\`

---

## 📁 Location

| Field | Value |
|-------|-------|
| **File** | \`${request.file || 'Unknown'}\` |
| **Line** | ${request.line || 'N/A'} |
| **Column** | ${request.column || 'N/A'} |

---

## 📜 Stack Trace

\`\`\`javascript
${request.stacktrace || 'No stack trace available'}
\`\`\`

---

## 🔍 Context

${request.context ? `\`\`\`javascript
${request.context}
\`\`\`` : 'No context available'}

---

## 📊 Metadata

| Field | Value |
|-------|-------|
| **Project** | ${request.project || 'N/A'} |
| **Environment** | ${request.environment || 'production'} |
| **Occurrences** | ${request.count || 1} |
| **Users Affected** | ${request.userCount || 1} |
| **Sentry ID** | ${request.sentryId || 'N/A'} |

---

## 🤖 Instructions for Copilot

1. **Analyze** the error above
2. **Identify** the root cause
3. **Suggest** a code fix
4. **Explain** how to prevent this in the future

---

## 🔗 Links

${request.permalink ? `- [View in Sentry](${request.permalink})` : ''}
${request.file ? `- [Open File](vscode://file/${request.file}:${request.line || 1})` : ''}

---

*Generated: ${new Date().toLocaleString('vi-VN')}*
*Request ID: ${request.id || request.timestamp || Date.now()}*
`;
}

/**
 * Show Windows notification
 */
function showNotification(request, status = 'detected') {
  const titles = {
    'detected': '🚨 Sentry Error Detected',
    'auto-fixing': '🤖 Copilot Auto-Fix Started',
    'fixed': '✅ Error Fixed by Copilot'
  };
  
  const title = titles[status] || titles['detected'];
  const message = request.error?.substring(0, 100) || 'New error needs fixing';
  
  // PowerShell notification (Windows 10/11)
  const psCommand = `
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
    $textNodes = $template.GetElementsByTagName("text")
    $textNodes.Item(0).AppendChild($template.CreateTextNode("${title.replace(/"/g, '\\"')}")) | Out-Null
    $textNodes.Item(1).AppendChild($template.CreateTextNode("${message.replace(/"/g, '\\"')}")) | Out-Null
    $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("VS Code Copilot").Show($toast)
  `;
  
  exec(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`, (err) => {
    if (!err) {
      console.log(`🔔 Notification sent: ${status}`);
    }
  });
}

console.log('🤖 AUTO-FIX MODE: Errors will be sent to Copilot automatically!\n');
console.log('👀 Watching for fix requests... Press Ctrl+C to stop.\n');

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Stopping watcher...');
  watcher.close();
  process.exit(0);
});
