/**
 * 🤖 COPILOT WORKER - Background Agent
 * 
 * Autonomous worker that:
 * 1. Polls queue for new messages
 * 2. Processes with Claude API (Anthropic)
 * 3. Executes MCP tools if needed
 * 4. Sends response back
 * 
 * Run: node api/services/copilot-worker.js
 * 
 * @author LongSang Admin (Elon Musk Mode 🚀)
 */

const fs = require('fs').promises;
const path = require('path');

// Get the project root (2 levels up from services/)
const projectRoot = path.resolve(__dirname, '..', '..');

// Load env from both .env and .env.local (local overrides)
require('dotenv').config({ path: path.join(projectRoot, '.env') });
require('dotenv').config({ path: path.join(projectRoot, '.env.local'), override: true });

// Debug: Log API key status
console.log('[Worker] Loading config from:', projectRoot);
console.log('[Worker] ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...` : 'NOT SET');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS';
const BRIDGE_DIR = path.join(WORKSPACE_ROOT, '.copilot-bridge');
const QUEUE_DIR = path.join(BRIDGE_DIR, 'queue');
const RESPONSES_DIR = path.join(BRIDGE_DIR, 'responses');
const PROCESSED_DIR = path.join(BRIDGE_DIR, 'processed');

const POLL_INTERVAL = 3000; // 3 seconds

// MCP Client for tool execution
let mcpClient;
try {
  mcpClient = require('./mcp-client');
} catch (e) {
  console.warn('[Worker] MCP Client not available');
}

// Determine which AI to use
const AI_PROVIDER = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY.startsWith('sk-ant-') 
  ? 'anthropic' 
  : (OPENAI_API_KEY ? 'openai' : null);

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🤖 COPILOT WORKER - Autonomous Agent                ║
╠═══════════════════════════════════════════════════════════════╣
║  Mode:      Background Processor                              ║
║  Queue:     ${QUEUE_DIR.substring(0, 45).padEnd(45)} ║
║  Interval:  ${POLL_INTERVAL}ms                                         ║
║  Provider:  ${AI_PROVIDER === 'anthropic' ? '🟣 Claude (Anthropic)' : (AI_PROVIDER === 'openai' ? '🟢 GPT-4 (OpenAI)' : '❌ No API')}                            ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(QUEUE_DIR, { recursive: true });
  await fs.mkdir(RESPONSES_DIR, { recursive: true });
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
}

// Get pending messages
async function getPendingMessages() {
  try {
    const files = await fs.readdir(QUEUE_DIR);
    const messages = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(QUEUE_DIR, file), 'utf-8');
        messages.push(JSON.parse(data));
      }
    }
    
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (e) {
    return [];
  }
}

// Process message with Claude
async function processWithClaude(message) {
  if (!ANTHROPIC_API_KEY) {
    return {
      response: '⚠️ Claude API not configured. Please set ANTHROPIC_API_KEY.',
      status: 'error'
    };
  }
  
  const systemPrompt = `Bạn là VS Code Copilot Assistant - một AI agent tự động.
Bạn đang chạy như một background worker, xử lý tin nhắn từ Web UI.

Workspace: ${WORKSPACE_ROOT}
Current context: ${JSON.stringify(message.context || {})}

Bạn có thể:
- Đọc/sửa file trong workspace
- Chạy commands
- Thực hiện git operations
- Tìm kiếm code
- Trả lời câu hỏi

Trả lời ngắn gọn, hữu ích bằng tiếng Việt.
Nếu cần thực thi tool, hãy nói rõ tool nào và tham số gì.`;

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
        messages: [
          { role: 'user', content: message.message }
        ]
      })
    });
    
    const data = await response.json();
    
    if (data.content && data.content[0]) {
      return {
        response: data.content[0].text,
        status: 'completed',
        model: 'claude-sonnet-4'
      };
    } else if (data.error) {
      console.error('[Worker] Claude error:', data.error);
      return {
        response: `❌ Claude error: ${data.error.message}`,
        status: 'error'
      };
    }
  } catch (error) {
    console.error('[Worker] API error:', error);
    return {
      response: `❌ API error: ${error.message}`,
      status: 'error'
    };
  }
  
  return {
    response: '❌ Unknown error',
    status: 'error'
  };
}

// Save response and move message to processed
async function saveResponse(messageId, result) {
  const responseObj = {
    messageId,
    response: result.response,
    status: result.status,
    model: result.model || 'unknown',
    processedAt: new Date().toISOString(),
    processedBy: 'Copilot Worker'
  };
  
  // Save response
  await fs.writeFile(
    path.join(RESPONSES_DIR, `${messageId}.json`),
    JSON.stringify(responseObj, null, 2),
    'utf-8'
  );
  
  // Move original to processed
  const queueFile = path.join(QUEUE_DIR, `${messageId}.json`);
  const processedFile = path.join(PROCESSED_DIR, `${messageId}.json`);
  
  try {
    const original = JSON.parse(await fs.readFile(queueFile, 'utf-8'));
    original.processedAt = responseObj.processedAt;
    await fs.writeFile(processedFile, JSON.stringify(original, null, 2), 'utf-8');
    await fs.unlink(queueFile);
  } catch (e) {
    // Original might not exist
  }
}

// Main processing loop
async function processQueue() {
  const messages = await getPendingMessages();
  
  if (messages.length > 0) {
    console.log(`[Worker] 📨 Found ${messages.length} pending message(s)`);
    
    for (const msg of messages) {
      console.log(`[Worker] 🔄 Processing: ${msg.id}`);
      console.log(`[Worker] 💬 Message: "${msg.message.substring(0, 50)}..."`);
      
      const result = await processWithClaude(msg);
      
      await saveResponse(msg.id, result);
      
      console.log(`[Worker] ✅ Completed: ${msg.id}`);
      console.log(`[Worker] 📝 Response: "${result.response.substring(0, 50)}..."`);
    }
  }
}

// Start worker
async function startWorker() {
  await ensureDirs();
  
  console.log('[Worker] 🚀 Starting autonomous agent...');
  console.log('[Worker] 👀 Watching queue for new messages...\n');
  
  // Initial check
  await processQueue();
  
  // Poll continuously
  setInterval(async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error('[Worker] Error:', error);
    }
  }, POLL_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Worker] 👋 Shutting down...');
  process.exit(0);
});

// Run
startWorker();
