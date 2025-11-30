/**
 * 🤖 VS CODE COPILOT LISTENER
 * 
 * Background service that:
 * 1. Connects to WebSocket Bridge
 * 2. Receives error alerts from Sentry
 * 3. Analyzes and suggests fixes
 * 4. Can auto-commit fixes via Git hooks
 * 
 * Run: node api/services/vscode-listener.js
 * 
 * @author LongSang Admin
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

// Load env
const projectRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });
require('dotenv').config({ path: path.join(projectRoot, '.env.local'), override: true });

// Configuration
const WS_URL = process.env.WS_BRIDGE_URL || 'ws://localhost:3003';
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AUTO_FIX_ENABLED = process.env.AUTO_FIX_ENABLED === 'true';

// State
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

// Task queue
const taskQueue = [];
let isProcessing = false;

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        🤖 VS CODE COPILOT LISTENER - Auto-Fix Agent           ║
╠═══════════════════════════════════════════════════════════════╣
║  WebSocket:  ${WS_URL.padEnd(45)} ║
║  Workspace:  ${WORKSPACE_ROOT.substring(0, 45).padEnd(45)} ║
║  Auto-Fix:   ${AUTO_FIX_ENABLED ? '✅ Enabled' : '❌ Disabled'}                                       ║
║  Claude:     ${ANTHROPIC_API_KEY ? '✅ Available' : '❌ Not configured'}                                  ║
╚═══════════════════════════════════════════════════════════════╝
`);

/**
 * Connect to WebSocket Bridge
 */
function connect() {
  console.log(`[Listener] 🔌 Connecting to ${WS_URL}...`);
  
  ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('[Listener] ✅ Connected to WebSocket Bridge');
    reconnectAttempts = 0;
    
    // Register as VS Code client
    ws.send(JSON.stringify({
      type: 'register',
      clientType: 'vscode',
      capabilities: ['analyze', 'fix', 'git'],
      workspace: WORKSPACE_ROOT
    }));
  });
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(message);
    } catch (e) {
      console.error('[Listener] ❌ Error parsing message:', e.message);
    }
  });
  
  ws.on('close', () => {
    console.log('[Listener] 🔌 Disconnected from WebSocket Bridge');
    scheduleReconnect();
  });
  
  ws.on('error', (error) => {
    console.error('[Listener] ❌ WebSocket error:', error.message);
  });
}

/**
 * Schedule reconnection
 */
function scheduleReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`[Listener] 🔄 Reconnecting in ${RECONNECT_DELAY/1000}s... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(connect, RECONNECT_DELAY);
  } else {
    console.error('[Listener] ❌ Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message) {
  console.log(`[Listener] 📨 Received: ${message.type}`);
  
  switch (message.type) {
    case 'welcome':
      console.log(`[Listener] 👋 Welcome! Client ID: ${message.clientId}`);
      break;
      
    case 'error_alert':
      await handleErrorAlert(message);
      break;
      
    case 'task_request':
      await handleTaskRequest(message);
      break;
      
    case 'pong':
      // Heartbeat response
      break;
      
    default:
      console.log(`[Listener] ℹ️ Unhandled message type: ${message.type}`);
  }
}

/**
 * Handle error alert from Sentry
 */
async function handleErrorAlert(message) {
  const error = message.error;
  
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🚨 ERROR ALERT RECEIVED                    ║
╠═══════════════════════════════════════════════════════════════╣
║  Message:   ${(error.message || 'Unknown').substring(0, 47).padEnd(47)} ║
║  Level:     ${(error.level || 'error').padEnd(47)} ║
║  Location:  ${(error.culprit || 'Unknown').substring(0, 47).padEnd(47)} ║
║  Project:   ${(error.project || 'Unknown').substring(0, 47).padEnd(47)} ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Queue for processing
  taskQueue.push({
    type: 'error_fix',
    error,
    context: message.context,
    timestamp: message.timestamp
  });
  
  // Process queue
  processTaskQueue();
}

/**
 * Handle task request from Web UI
 */
async function handleTaskRequest(message) {
  console.log(`[Listener] 📋 Task: ${message.task}`);
  
  taskQueue.push({
    type: 'task',
    taskId: message.taskId,
    task: message.task,
    params: message.params,
    requester: message.requester
  });
  
  processTaskQueue();
}

/**
 * Process task queue
 */
async function processTaskQueue() {
  if (isProcessing || taskQueue.length === 0) return;
  
  isProcessing = true;
  
  while (taskQueue.length > 0) {
    const task = taskQueue.shift();
    
    try {
      let result;
      
      switch (task.type) {
        case 'error_fix':
          result = await analyzeAndFixError(task);
          break;
          
        case 'task':
          result = await executeTask(task);
          break;
          
        default:
          result = { status: 'error', message: 'Unknown task type' };
      }
      
      // Send response
      if (task.taskId) {
        sendResponse(task.taskId, result);
      }
      
    } catch (error) {
      console.error(`[Listener] ❌ Task error:`, error.message);
      
      if (task.taskId) {
        sendResponse(task.taskId, {
          status: 'error',
          message: error.message
        });
      }
    }
  }
  
  isProcessing = false;
}

/**
 * Analyze error and suggest fix using Claude
 */
async function analyzeAndFixError(task) {
  const { error, context } = task;
  
  console.log('[Listener] 🔍 Analyzing error with Claude...');
  
  if (!ANTHROPIC_API_KEY) {
    return {
      status: 'error',
      message: 'Claude API not configured'
    };
  }
  
  // Try to find the file
  let fileContent = null;
  let filePath = null;
  
  if (error.culprit) {
    // Try to locate file in workspace
    filePath = await findFileInWorkspace(error.culprit);
    if (filePath) {
      try {
        fileContent = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        console.log(`[Listener] ⚠️ Could not read file: ${filePath}`);
      }
    }
  }
  
  // Build context for Claude
  const systemPrompt = `Bạn là một expert debugger và code fixer.
Nhiệm vụ: Phân tích error và đề xuất fix.

Workspace: ${WORKSPACE_ROOT}
Auto-fix enabled: ${AUTO_FIX_ENABLED}

Khi trả lời:
1. Giải thích nguyên nhân error
2. Đề xuất fix cụ thể
3. Nếu có thể, cung cấp code patch

Format response:
## Phân tích
[Giải thích nguyên nhân]

## Đề xuất Fix
[Mô tả cách fix]

## Code Patch (nếu có)
\`\`\`diff
[diff format]
\`\`\``;

  const userMessage = `
Error: ${error.message}
Level: ${error.level}
Location: ${error.culprit}
Project: ${error.project}

${context?.stacktrace ? `Stacktrace:\n${JSON.stringify(context.stacktrace, null, 2)}` : ''}

${fileContent ? `\nFile content (${filePath}):\n\`\`\`\n${fileContent.substring(0, 5000)}\n\`\`\`` : ''}

Hãy phân tích và đề xuất fix.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    
    const data = await response.json();
    
    if (data.content && data.content[0]) {
      const analysis = data.content[0].text;
      
      console.log('[Listener] ✅ Analysis complete');
      console.log('─'.repeat(60));
      console.log(analysis.substring(0, 500) + '...');
      console.log('─'.repeat(60));
      
      // If auto-fix enabled and we have a diff, apply it
      if (AUTO_FIX_ENABLED && analysis.includes('```diff')) {
        console.log('[Listener] 🔧 Auto-fix enabled, attempting to apply patch...');
        // TODO: Parse and apply diff
      }
      
      // Notify Web UI
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error_analysis',
          errorId: error.id,
          analysis,
          filePath,
          timestamp: new Date().toISOString()
        }));
      }
      
      return {
        status: 'analyzed',
        analysis,
        filePath,
        canAutoFix: analysis.includes('```diff')
      };
    }
    
    return {
      status: 'error',
      message: data.error?.message || 'Analysis failed'
    };
    
  } catch (err) {
    console.error('[Listener] ❌ Claude API error:', err.message);
    return {
      status: 'error',
      message: err.message
    };
  }
}

/**
 * Find file in workspace
 */
async function findFileInWorkspace(culprit) {
  // Common patterns to extract filename
  const patterns = [
    /([a-zA-Z0-9_\-./]+\.[a-zA-Z]+)/, // Any file path
    /at\s+([a-zA-Z0-9_\-./]+:\d+)/, // Stack trace format
  ];
  
  for (const pattern of patterns) {
    const match = culprit.match(pattern);
    if (match) {
      const filename = match[1].split(':')[0];
      
      // Search in common locations
      const searchPaths = [
        path.join(WORKSPACE_ROOT, filename),
        path.join(WORKSPACE_ROOT, '00-MASTER-ADMIN/longsang-admin', filename),
        path.join(WORKSPACE_ROOT, '00-MASTER-ADMIN/longsang-admin/src', filename),
        path.join(WORKSPACE_ROOT, '00-MASTER-ADMIN/longsang-admin/api', filename),
      ];
      
      for (const searchPath of searchPaths) {
        try {
          await fs.access(searchPath);
          return searchPath;
        } catch {
          // File not found, continue
        }
      }
    }
  }
  
  return null;
}

/**
 * Execute generic task
 */
async function executeTask(task) {
  const { task: taskName, params } = task;
  
  switch (taskName) {
    case 'git_status':
      return executeGitCommand('status', params?.path);
      
    case 'git_diff':
      return executeGitCommand('diff', params?.path);
      
    case 'read_file':
      return readFile(params?.path);
      
    case 'list_files':
      return listFiles(params?.path);
      
    case 'analyze_file':
      return analyzeFile(params?.path);
      
    default:
      return { status: 'error', message: `Unknown task: ${taskName}` };
  }
}

/**
 * Execute git command
 */
function executeGitCommand(command, cwd = WORKSPACE_ROOT) {
  try {
    const result = execSync(`git ${command}`, { 
      cwd, 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    return { status: 'success', output: result };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Read file
 */
async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { status: 'success', content, path: filePath };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * List files
 */
async function listFiles(dirPath = WORKSPACE_ROOT) {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    return {
      status: 'success',
      files: files.map(f => ({
        name: f.name,
        isDirectory: f.isDirectory()
      }))
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Analyze file with Claude
 */
async function analyzeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Use Claude to analyze
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Analyze this file and identify potential issues, bugs, or improvements:\n\nFile: ${filePath}\n\`\`\`\n${content.substring(0, 8000)}\n\`\`\``
        }]
      })
    });
    
    const data = await response.json();
    
    return {
      status: 'success',
      analysis: data.content?.[0]?.text || 'No analysis available'
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Send response back to bridge
 */
function sendResponse(taskId, result) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'task_response',
      taskId,
      result,
      status: result.status,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Heartbeat
 */
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n[Listener] 👋 Shutting down...');
  if (ws) ws.close();
  process.exit(0);
});

// Start
connect();
