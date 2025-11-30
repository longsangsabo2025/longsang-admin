/**
 * 🤖 Copilot Bridge API
 * 
 * Bridge để Web UI/Mobile gửi message trực tiếp cho VS Code Copilot
 * Hỗ trợ 2 mode:
 * - Instant: Xử lý ngay bằng AI và trả response
 * - Queue: Lưu vào queue để VS Code Copilot xử lý (cho các task phức tạp)
 * 
 * @author LongSang Admin
 * @version 3.0.0
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// MCP Client for tool execution
let mcpClient;
try {
  mcpClient = require('../services/mcp-client');
} catch (e) {
  console.warn('[Copilot Bridge] MCP Client not available:', e.message);
}

// AI Chat service
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.startsWith('sk-') ? process.env.OPENAI_API_KEY : null;
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

// Queue directory - using workspace root
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:/0.PROJECTS';
const BRIDGE_DIR = path.join(WORKSPACE_ROOT, '.copilot-bridge');
const QUEUE_DIR = path.join(BRIDGE_DIR, 'queue');
const RESPONSES_DIR = path.join(BRIDGE_DIR, 'responses');
const PROCESSED_DIR = path.join(BRIDGE_DIR, 'processed');

// Copilot Errors directory (for Sentry auto-fix)
const COPILOT_ERRORS_DIR = path.join(WORKSPACE_ROOT, '.copilot-errors');
const FIX_HISTORY_FILE = path.join(COPILOT_ERRORS_DIR, 'fix-history.json');
const FIX_REQUEST_FILE = path.join(COPILOT_ERRORS_DIR, 'fix-request.json');

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(QUEUE_DIR, { recursive: true });
  await fs.mkdir(RESPONSES_DIR, { recursive: true });
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
}

// Initialize on load
ensureDirs().catch(console.error);

console.log('[Copilot Bridge] 🌉 Bridge initialized');
console.log(`[Copilot Bridge] 📁 Queue dir: ${QUEUE_DIR}`);

/**
 * POST /api/copilot-bridge/send
 * Send a message to Copilot queue
 */
router.post('/send', async (req, res) => {
  try {
    const { message, context, priority = 'normal', type = 'chat' } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }
    
    await ensureDirs();
    
    // Create message object
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const msgObj = {
      id: messageId,
      message,
      context: context || {},
      priority, // 'high', 'normal', 'low'
      type, // 'chat', 'fix', 'code', 'review'
      timestamp: new Date().toISOString(),
      source: req.headers['x-source'] || 'web-ui'
    };
    
    // Save message to queue directory as individual file
    const msgFile = path.join(QUEUE_DIR, `${messageId}.json`);
    await fs.writeFile(msgFile, JSON.stringify(msgObj, null, 2), 'utf-8');
    
    console.log(`[Copilot Bridge] 📨 Message queued: ${messageId}`);
    
    res.json({
      success: true,
      messageId,
      status: 'queued',
      message: 'Message sent to Copilot queue'
    });
    
  } catch (error) {
    console.error('[Copilot Bridge] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/copilot-bridge/chat
 * 🚀 INSTANT CHAT - Xử lý tin nhắn ngay lập tức bằng AI
 * Dùng Gemini hoặc OpenAI để trả lời ngay, không cần queue
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context = {}, model = 'gemini' } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }
    
    console.log(`[Copilot Bridge] 💬 Instant chat: "${message.substring(0, 50)}..."`);
    
    let response;
    
    // Build system prompt
    const systemPrompt = `Bạn là VS Code Copilot Assistant - trợ lý AI thông minh cho LongSang Admin.
Bạn có thể:
- Trả lời câu hỏi về code, project
- Giúp debug và fix lỗi
- Gợi ý cải tiến code
- Thực thi các tác vụ qua MCP tools (nếu cần)

Workspace: D:/0.PROJECTS
Current page: ${context.currentPage || 'unknown'}

Trả lời ngắn gọn, hữu ích bằng tiếng Việt.`;

    // Try Gemini first (faster and free)
    if (GEMINI_API_KEY && model !== 'openai') {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt + '\n\nUser: ' + message }] }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
              }
            })
          }
        );
        
        const data = await geminiResponse.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          response = data.candidates[0].content.parts[0].text;
          console.log('[Copilot Bridge] ✅ Gemini response received');
        }
      } catch (e) {
        console.warn('[Copilot Bridge] Gemini error:', e.message);
      }
    }
    
    // Fallback to OpenAI
    if (!response && OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: 2048,
            temperature: 0.7
          })
        });
        
        const data = await openaiResponse.json();
        if (data.choices?.[0]?.message?.content) {
          response = data.choices[0].message.content;
          console.log('[Copilot Bridge] ✅ OpenAI response received');
        }
      } catch (e) {
        console.warn('[Copilot Bridge] OpenAI error:', e.message);
      }
    }
    
    // No AI available - return helpful message
    if (!response) {
      response = `⚠️ Không có AI API available. Tin nhắn của bạn đã được lưu vào queue.
      
Tin nhắn: "${message}"

VS Code Copilot sẽ xử lý khi online.`;
      
      // Also save to queue as backup
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await ensureDirs();
      const msgFile = path.join(QUEUE_DIR, `${messageId}.json`);
      await fs.writeFile(msgFile, JSON.stringify({
        id: messageId,
        message,
        context,
        timestamp: new Date().toISOString(),
        source: 'web-ui-fallback'
      }, null, 2), 'utf-8');
    }
    
    res.json({
      success: true,
      response,
      model: response.includes('⚠️') ? 'fallback' : (GEMINI_API_KEY ? 'gemini' : 'openai'),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Copilot Bridge] Chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/copilot-bridge/messages
 * Get all pending messages (for Copilot to poll)
 */
router.get('/messages', async (req, res) => {
  try {
    await ensureDirs();
    
    const files = await fs.readdir(QUEUE_DIR);
    const messages = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(QUEUE_DIR, file), 'utf-8');
          messages.push(JSON.parse(data));
        } catch (e) {
          console.warn(`[Copilot Bridge] Failed to read ${file}:`, e.message);
        }
      }
    }
    
    // Sort by timestamp (oldest first)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json({
      success: true,
      count: messages.length,
      messages
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/copilot-bridge/respond/:messageId
 * Post response from VS Code Copilot
 */
router.post('/respond/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { response, status = 'completed' } = req.body;
    
    if (!response) {
      return res.status(400).json({ success: false, error: 'Response required' });
    }
    
    await ensureDirs();
    
    // Create response file
    const responseObj = {
      messageId,
      response,
      status,
      processedAt: new Date().toISOString(),
      processedBy: 'VS Code Copilot'
    };
    
    const responseFile = path.join(RESPONSES_DIR, `${messageId}.json`);
    await fs.writeFile(responseFile, JSON.stringify(responseObj, null, 2), 'utf-8');
    
    // Move original message to processed folder
    const queueFile = path.join(QUEUE_DIR, `${messageId}.json`);
    const processedFile = path.join(PROCESSED_DIR, `${messageId}.json`);
    
    try {
      // Read original message
      const originalData = await fs.readFile(queueFile, 'utf-8');
      const original = JSON.parse(originalData);
      
      // Add processing info
      original.processedAt = responseObj.processedAt;
      original.responseFile = responseFile;
      
      // Save to processed
      await fs.writeFile(processedFile, JSON.stringify(original, null, 2), 'utf-8');
      
      // Remove from queue
      await fs.unlink(queueFile);
    } catch (e) {
      // Original might not exist, that's ok
    }
    
    console.log(`[Copilot Bridge] ✅ Response saved: ${messageId}`);
    
    res.json({
      success: true,
      messageId,
      status: 'response_saved'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/copilot-bridge/response/:messageId
 * Poll for response to a specific message
 */
router.get('/response/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await ensureDirs();
    
    const responseFile = path.join(RESPONSES_DIR, `${messageId}.json`);
    
    try {
      const data = await fs.readFile(responseFile, 'utf-8');
      const response = JSON.parse(data);
      
      res.json({
        success: true,
        ...response
      });
    } catch (e) {
      // Check if still in queue (pending)
      const queueFile = path.join(QUEUE_DIR, `${messageId}.json`);
      
      try {
        await fs.access(queueFile);
        res.json({
          success: true,
          status: 'pending',
          message: 'Still waiting for Copilot to process...'
        });
      } catch {
        res.json({
          success: false,
          status: 'not_found',
          error: 'Message not found'
        });
      }
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/copilot-bridge/message/:messageId
 * Delete a message and its response
 */
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    await ensureDirs();
    
    // Try to delete from all locations
    const files = [
      path.join(QUEUE_DIR, `${messageId}.json`),
      path.join(RESPONSES_DIR, `${messageId}.json`),
      path.join(PROCESSED_DIR, `${messageId}.json`)
    ];
    
    let deleted = 0;
    for (const file of files) {
      try {
        await fs.unlink(file);
        deleted++;
      } catch {
        // File might not exist
      }
    }
    
    res.json({
      success: true,
      deleted,
      messageId
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/copilot-bridge/stats
 * Get bridge statistics
 */
router.get('/stats', async (req, res) => {
  try {
    await ensureDirs();
    
    // Count files in each directory
    let pendingMessages = 0;
    let awaitingPickup = 0;
    let totalProcessed = 0;
    
    try {
      const queueFiles = await fs.readdir(QUEUE_DIR);
      pendingMessages = queueFiles.filter(f => f.endsWith('.json')).length;
    } catch { /* empty */ }
    
    try {
      const responseFiles = await fs.readdir(RESPONSES_DIR);
      awaitingPickup = responseFiles.filter(f => f.endsWith('.json')).length;
    } catch { /* empty */ }
    
    try {
      const processedFiles = await fs.readdir(PROCESSED_DIR);
      totalProcessed = processedFiles.filter(f => f.endsWith('.json')).length;
    } catch { /* empty */ }
    
    res.json({
      success: true,
      bridgeActive: true,
      bridgeDir: BRIDGE_DIR,
      pendingMessages,
      awaitingPickup,
      totalProcessed
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/copilot-bridge/clear
 * Clear all messages (admin only)
 */
router.delete('/clear', async (req, res) => {
  try {
    await ensureDirs();
    
    // Clear all directories
    for (const dir of [QUEUE_DIR, RESPONSES_DIR, PROCESSED_DIR]) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            await fs.unlink(path.join(dir, file));
          }
        }
      } catch { /* empty */ }
    }
    
    console.log('[Copilot Bridge] 🗑️ All messages cleared');
    
    res.json({ success: true, message: 'All messages cleared' });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/copilot-bridge/execute
 * Execute MCP tool directly
 */
router.post('/execute', async (req, res) => {
  try {
    const { tool, params } = req.body;
    
    if (!tool) {
      return res.status(400).json({ success: false, error: 'Tool name required' });
    }
    
    if (!mcpClient) {
      return res.status(503).json({ success: false, error: 'MCP Client not available' });
    }
    
    console.log(`[Copilot Bridge] 🔧 Executing tool: ${tool}`, params);
    
    const result = await mcpClient.callTool(tool, params || {});
    
    res.json({
      success: true,
      tool,
      result
    });
    
  } catch (error) {
    console.error('[Copilot Bridge] Execute error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/copilot-bridge/tools
 * List available MCP tools
 */
router.get('/tools', async (req, res) => {
  try {
    if (!mcpClient) {
      return res.status(503).json({ success: false, error: 'MCP Client not available' });
    }
    
    const tools = mcpClient.tools || [];
    
    res.json({
      success: true,
      count: tools.length,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description
      }))
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// 🔧 COPILOT AUTO-FIX HISTORY ENDPOINTS
// ============================================

/**
 * GET /api/copilot-bridge/fix-history
 * Get all Copilot auto-fix history entries
 */
router.get('/fix-history', async (req, res) => {
  try {
    if (!fsSync.existsSync(FIX_HISTORY_FILE)) {
      return res.json([]);
    }

    const content = await fs.readFile(FIX_HISTORY_FILE, 'utf8');
    let data;
    
    try {
      data = JSON.parse(content);
    } catch (e) {
      data = [];
    }

    // Ensure it's always an array
    if (!Array.isArray(data)) {
      data = [data].filter(Boolean);
    }

    // Sort by timestamp descending
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(data);
  } catch (error) {
    console.error('[Copilot Bridge] Error reading fix history:', error);
    res.status(500).json({ error: 'Failed to read fix history', message: error.message });
  }
});

/**
 * GET /api/copilot-bridge/current-request
 * Get current fix request from Sentry watcher
 */
router.get('/current-request', async (req, res) => {
  try {
    if (!fsSync.existsSync(FIX_REQUEST_FILE)) {
      return res.json(null);
    }

    const content = await fs.readFile(FIX_REQUEST_FILE, 'utf8');
    const data = JSON.parse(content);
    res.json(data);
  } catch (error) {
    console.error('[Copilot Bridge] Error reading current request:', error);
    res.status(500).json({ error: 'Failed to read current request', message: error.message });
  }
});

/**
 * POST /api/copilot-bridge/trigger-fix
 * Manually trigger a fix request (simulate Sentry error)
 */
router.post('/trigger-fix', async (req, res) => {
  try {
    const { error, file, line, context, project } = req.body;

    if (!error || !file) {
      return res.status(400).json({ error: 'Missing required fields: error, file' });
    }

    // Ensure directory exists
    if (!fsSync.existsSync(COPILOT_ERRORS_DIR)) {
      fsSync.mkdirSync(COPILOT_ERRORS_DIR, { recursive: true });
    }

    const request = {
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      error,
      file,
      line: line || 1,
      column: null,
      stacktrace: null,
      context: context || null,
      project: project || 'longsang-admin',
      environment: 'development',
      count: 1,
      userCount: 1,
      sentryId: null,
      permalink: null,
      source: 'manual-trigger'
    };

    await fs.writeFile(FIX_REQUEST_FILE, JSON.stringify(request, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: 'Fix request triggered - Copilot watcher will pick it up',
      request 
    });
  } catch (error) {
    console.error('[Copilot Bridge] Error triggering fix:', error);
    res.status(500).json({ error: 'Failed to trigger fix', message: error.message });
  }
});

/**
 * POST /api/copilot-bridge/log-fix
 * Log a completed fix to history
 */
router.post('/log-fix', async (req, res) => {
  try {
    const { error, file, line, status, fixApplied, sentryId } = req.body;

    if (!error || !file) {
      return res.status(400).json({ error: 'Missing required fields: error, file' });
    }

    // Ensure directory exists
    if (!fsSync.existsSync(COPILOT_ERRORS_DIR)) {
      fsSync.mkdirSync(COPILOT_ERRORS_DIR, { recursive: true });
    }

    const fixEntry = {
      id: `fix_${Date.now()}`,
      timestamp: new Date().toISOString(),
      error,
      file,
      line: line || null,
      status: status || 'auto-fixed',
      fixApplied: fixApplied || null,
      sentryId: sentryId || null
    };

    // Read existing history
    let history = [];
    if (fsSync.existsSync(FIX_HISTORY_FILE)) {
      try {
        const content = await fs.readFile(FIX_HISTORY_FILE, 'utf8');
        const parsed = JSON.parse(content);
        history = Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
      } catch (e) {
        history = [];
      }
    }

    // Add new entry at beginning
    history.unshift(fixEntry);

    // Keep last 100 entries
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    // Write back
    await fs.writeFile(FIX_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: 'Fix logged successfully',
      entry: fixEntry 
    });
  } catch (error) {
    console.error('[Copilot Bridge] Error logging fix:', error);
    res.status(500).json({ error: 'Failed to log fix', message: error.message });
  }
});

/**
 * GET /api/copilot-bridge/fix-stats
 * Get statistics about auto-fixes
 */
router.get('/fix-stats', async (req, res) => {
  try {
    let history = [];
    if (fsSync.existsSync(FIX_HISTORY_FILE)) {
      try {
        const content = await fs.readFile(FIX_HISTORY_FILE, 'utf8');
        const parsed = JSON.parse(content);
        history = Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
      } catch (e) {
        history = [];
      }
    }

    const stats = {
      totalFixes: history.length,
      autoFixed: history.filter(h => h.status === 'auto-fixed').length,
      triggered: history.filter(h => h.status === 'auto-fix-triggered').length,
      failed: history.filter(h => h.status === 'failed').length,
      pending: history.filter(h => h.status === 'pending').length,
      successRate: history.length > 0 
        ? Math.round((history.filter(h => h.status === 'auto-fixed').length / history.length) * 100)
        : 0,
      lastFix: history[0]?.timestamp || null,
      uniqueFiles: [...new Set(history.map(h => h.file).filter(Boolean))].length
    };

    res.json(stats);
  } catch (error) {
    console.error('[Copilot Bridge] Error getting fix stats:', error);
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
});

/**
 * DELETE /api/copilot-bridge/fix-history
 * Clear all fix history
 */
router.delete('/fix-history', async (req, res) => {
  try {
    if (fsSync.existsSync(FIX_HISTORY_FILE)) {
      await fs.writeFile(FIX_HISTORY_FILE, '[]', 'utf8');
    }
    res.json({ success: true, message: 'Fix history cleared' });
  } catch (error) {
    console.error('[Copilot Bridge] Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history', message: error.message });
  }
});

module.exports = router;
