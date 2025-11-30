/**
 * AI Workspace Chat API
 * Chat endpoint that integrates with workspace context and Brain knowledge
 * Now with MCP Server integration for tool calling!
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// MCP Client for workspace tools
const mcpClient = require('../services/mcp-client');

// OpenAI/Anthropic client setup - Check for valid keys (not just truthy)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.startsWith('sk-') ? process.env.OPENAI_API_KEY : null;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-') ? process.env.ANTHROPIC_API_KEY : null;

console.log('[AI Chat] API Keys loaded - OpenAI:', !!OPENAI_API_KEY, 'Anthropic:', !!ANTHROPIC_API_KEY);

// Initialize MCP Client on startup
(async () => {
  const mcpAvailable = await mcpClient.initialize();
  console.log('[AI Chat] MCP Server:', mcpAvailable ? 'Connected' : 'Not available');
})();

// Workspace root
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 'D:\\0.PROJECTS';

// Default user ID for single-user mode
const DEFAULT_USER_ID = '6490f4e9-ed96-4121-9c70-bb4ad1feb71d';

// In-memory chat history (for session persistence)
const chatSessions = new Map();

/**
 * POST /api/ai/workspace-chat
 * Main chat endpoint with workspace context and MCP tool calling
 */
router.post('/workspace-chat', async (req, res) => {
  try {
    console.log('[AI Chat] Request received:', JSON.stringify(req.body));
    console.log('[AI Chat] ENV Keys - OPENAI:', !!OPENAI_API_KEY, 'ANTHROPIC:', !!ANTHROPIC_API_KEY);
    
    const { 
      message, 
      sessionId = 'default',
      includeWorkspaceContext = true,
      includeBrainContext = true,
      useMCPTools = true, // Enable MCP tool calling
      project = null,
      model = 'gpt-4o-mini' // Default to fast model
    } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message required' 
      });
    }

    // Get or create session
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, {
        messages: [],
        createdAt: new Date().toISOString()
      });
    }
    const session = chatSessions.get(sessionId);

    // Build context
    console.log('[AI Chat] Building system prompt...');
    let systemContext = buildSystemPrompt(useMCPTools && mcpClient.initialized);
    
    // Add workspace context
    if (includeWorkspaceContext) {
      console.log('[AI Chat] Getting workspace context...');
      const workspaceContext = await getWorkspaceContext(project);
      systemContext += `\n\n## Workspace Context:\n${workspaceContext}`;
    }

    // Add Brain knowledge context
    if (includeBrainContext) {
      console.log('[AI Chat] Getting brain context...');
      const brainContext = await getBrainContext(message);
      if (brainContext) {
        systemContext += `\n\n## Relevant Knowledge from Brain:\n${brainContext}`;
      }
    }

    // Add user message to history
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Prepare messages for AI
    const aiMessages = [
      { role: 'system', content: systemContext },
      ...session.messages.slice(-10).map(m => ({ // Last 10 messages for context
        role: m.role,
        content: m.content
      }))
    ];

    console.log('[AI Chat] Calling AI with', aiMessages.length, 'messages');
    
    // Get MCP tools if available
    const mcpTools = (useMCPTools && mcpClient.initialized) ? mcpClient.getOpenAITools() : [];
    console.log('[AI Chat] MCP tools available:', mcpTools.length);
    
    // Call AI API with tool support
    let aiResponse;
    let toolCalls = [];
    
    if (OPENAI_API_KEY) {
      console.log('[AI Chat] Using OpenAI with tools:', mcpTools.length);
      const result = await callOpenAIWithTools(aiMessages, model, mcpTools);
      aiResponse = result.response;
      toolCalls = result.toolCalls || [];
    } else if (ANTHROPIC_API_KEY) {
      console.log('[AI Chat] Using Anthropic');
      aiResponse = await callAnthropic(aiMessages, model);
    } else {
      console.log('[AI Chat] Using Mock (no API keys)');
      // Fallback: Mock response for testing
      aiResponse = generateMockResponse(message, systemContext);
    }

    // Add AI response to history
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    });

    // Limit session history
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-30);
    }

    res.json({
      success: true,
      response: aiResponse,
      sessionId,
      messageCount: session.messages.length,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      mcpConnected: mcpClient.initialized,
      contextUsed: {
        workspace: includeWorkspaceContext,
        brain: includeBrainContext,
        mcp: useMCPTools && mcpClient.initialized,
        project
      }
    });

  } catch (error) {
    console.error('Workspace chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/workspace-chat/stream
 * Streaming chat endpoint - shows AI thinking and tool calls in realtime
 * Like watching Copilot work!
 */
router.post('/workspace-chat/stream', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // Helper to send SSE events
  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };
  
  try {
    const { 
      message, 
      sessionId = 'default',
      includeWorkspaceContext = true,
      includeBrainContext = true,
      useMCPTools = true,
      project = null,
      model = 'gpt-4o-mini'
    } = req.body;

    if (!message) {
      sendEvent('error', { error: 'Message required' });
      res.end();
      return;
    }

    sendEvent('start', { message: 'Bắt đầu xử lý...', sessionId });

    // Get or create session
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, {
        messages: [],
        createdAt: new Date().toISOString()
      });
    }
    const session = chatSessions.get(sessionId);

    // Build context
    sendEvent('status', { message: '📋 Đang xây dựng context...' });
    let systemContext = buildSystemPrompt(useMCPTools && mcpClient.initialized);
    
    if (includeWorkspaceContext) {
      sendEvent('status', { message: '📁 Đang lấy thông tin workspace...' });
      const workspaceContext = await getWorkspaceContext(project);
      systemContext += `\n\n## Workspace Context:\n${workspaceContext}`;
    }

    if (includeBrainContext) {
      sendEvent('status', { message: '🧠 Đang tìm kiếm trong Brain...' });
      const brainContext = await getBrainContext(message);
      if (brainContext) {
        systemContext += `\n\n## Relevant Knowledge from Brain:\n${brainContext}`;
        sendEvent('brain', { found: true, preview: brainContext.substring(0, 200) });
      }
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Prepare messages
    const aiMessages = [
      { role: 'system', content: systemContext },
      ...session.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    sendEvent('status', { message: '🤖 Đang gọi AI...' });

    // Get MCP tools
    const mcpTools = (useMCPTools && mcpClient.initialized) ? mcpClient.getOpenAITools() : [];
    
    if (mcpTools.length > 0) {
      sendEvent('tools', { 
        available: mcpTools.length, 
        names: mcpTools.map(t => t.function.name).slice(0, 5) 
      });
    }

    // Call AI with streaming tool support
    let aiResponse = '';
    let toolCalls = [];

    if (OPENAI_API_KEY) {
      const result = await callOpenAIWithToolsStreaming(aiMessages, model, mcpTools, sendEvent);
      aiResponse = result.response;
      toolCalls = result.toolCalls || [];
    } else if (ANTHROPIC_API_KEY) {
      sendEvent('status', { message: '🤖 Sử dụng Anthropic...' });
      aiResponse = await callAnthropic(aiMessages, model);
    } else {
      sendEvent('status', { message: '⚠️ Mock mode - không có API key' });
      aiResponse = generateMockResponse(message, systemContext);
    }

    // Save to history
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    });

    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-30);
    }

    // Send final response
    sendEvent('complete', {
      response: aiResponse,
      sessionId,
      messageCount: session.messages.length,
      toolCalls: toolCalls,
      mcpConnected: mcpClient.initialized
    });

    sendEvent('done', {});
    res.end();

  } catch (error) {
    console.error('Streaming chat error:', error);
    sendEvent('error', { error: error.message });
    res.end();
  }
});

/**
 * GET /api/ai/workspace-chat/sessions
 * List chat sessions
 */
router.get('/workspace-chat/sessions', (req, res) => {
  const sessions = Array.from(chatSessions.entries()).map(([id, data]) => ({
    id,
    messageCount: data.messages.length,
    createdAt: data.createdAt,
    lastMessage: data.messages[data.messages.length - 1]?.timestamp
  }));

  res.json({
    success: true,
    sessions
  });
});

/**
 * GET /api/ai/workspace-chat/history/:sessionId
 * Get chat history for a session
 */
router.get('/workspace-chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = chatSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ 
      success: false, 
      error: 'Session not found' 
    });
  }

  res.json({
    success: true,
    sessionId,
    messages: session.messages,
    createdAt: session.createdAt
  });
});

/**
 * DELETE /api/ai/workspace-chat/sessions/:sessionId
 * Clear a chat session
 */
router.delete('/workspace-chat/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  chatSessions.delete(sessionId);

  res.json({
    success: true,
    message: `Session ${sessionId} cleared`
  });
});

/**
 * GET /api/ai/workspace-chat/mcp-status
 * Check MCP Server connection status
 */
router.get('/workspace-chat/mcp-status', async (req, res) => {
  try {
    const isConnected = mcpClient.initialized;
    const tools = isConnected ? mcpClient.tools.map(t => t.name) : [];
    
    res.json({
      success: true,
      mcp: {
        connected: isConnected,
        sessionId: mcpClient.sessionId,
        toolsCount: tools.length,
        tools: tools
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/workspace-chat/mcp-reconnect
 * Force reconnect to MCP Server
 */
router.post('/workspace-chat/mcp-reconnect', async (req, res) => {
  try {
    mcpClient.initialized = false;
    mcpClient.sessionId = null;
    
    const connected = await mcpClient.initialize();
    
    res.json({
      success: true,
      connected,
      tools: mcpClient.tools.map(t => t.name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/workspace-chat/mcp-tool
 * Directly call an MCP tool
 */
router.post('/workspace-chat/mcp-tool', async (req, res) => {
  try {
    const { tool, args = {} } = req.body;
    
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: 'Tool name required'
      });
    }
    
    if (!mcpClient.initialized) {
      await mcpClient.initialize();
    }
    
    const result = await mcpClient.callTool(tool, args);
    
    res.json({
      success: true,
      tool,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/workspace-chat/action
 * Execute an action suggested by AI
 */
router.post('/workspace-chat/action', async (req, res) => {
  try {
    const { action, params } = req.body;

    const result = await executeAction(action, params);

    res.json({
      success: true,
      action,
      result
    });
  } catch (error) {
    console.error('Action execution error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// Helper Functions
// ============================================

function buildSystemPrompt(hasMCPTools = false) {
  let prompt = `Bạn là AI Assistant của LongSang Admin - một hệ thống quản lý đa dự án.

## Vai trò:
- Hỗ trợ developer quản lý workspace gồm nhiều projects
- Giúp debug, review code, và tìm kiếm thông tin
- Trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào vấn đề

## Khả năng:
- Đọc files trong workspace
- Tìm kiếm code và tài liệu
- Truy cập AI Second Brain knowledge base
- Xem errors từ Bug System
- Gợi ý code fixes

## Quy tắc:
1. Trả lời ngắn gọn, súc tích
2. Sử dụng code blocks với syntax highlighting
3. Đề xuất actions cụ thể khi có thể

## Format output:
- Dùng markdown
- Code blocks với language tag
- Bullet points cho danh sách`;

  if (hasMCPTools) {
    prompt += `

## MCP Tools Available:
Bạn có thể sử dụng các tools sau để thực hiện actions trực tiếp:

### File Operations:
- \`read_file\` - Đọc nội dung file
- \`write_file\` - Ghi file mới hoặc ghi đè
- \`edit_file\` - Sửa một phần file
- \`delete_file\` - Xóa file

### Search:
- \`search_files\` - Tìm kiếm text trong workspace
- \`list_files\` - Liệt kê files trong folder

### Commands:
- \`run_command\` - Chạy terminal commands (npm, git, etc.)

### Git:
- \`git_status\` - Xem git status
- \`git_diff\` - Xem changes
- \`git_log\` - Xem commit history
- \`git_commit\` - Commit changes
- \`git_push\` / \`git_pull\` - Push/Pull

### Projects:
- \`list_projects\` - Liệt kê tất cả projects
- \`get_project_info\` - Chi tiết project

### Brain (Knowledge Base):
- \`brain_search\` - Tìm kiếm knowledge
- \`brain_list_domains\` - Xem domains
- \`brain_add\` - Thêm knowledge mới
- \`brain_stats\` - Thống kê

Khi user yêu cầu đọc file, tìm kiếm, chạy command, etc. - HÃY SỬ DỤNG TOOLS!
Không cần hỏi lại, cứ gọi tool trực tiếp.`;
  }

  return prompt;
}

async function getWorkspaceContext(project) {
  let context = `Workspace: ${WORKSPACE_ROOT}\n`;
  
  // Get list of projects
  const mainDirs = ['00-MASTER-ADMIN', '01-MAIN-PRODUCTS', '02-SABO-ECOSYSTEM'];
  const projects = [];
  
  for (const dir of mainDirs) {
    try {
      const entries = await fs.readdir(path.join(WORKSPACE_ROOT, dir), { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          projects.push(`${dir}/${entry.name}`);
        }
      }
    } catch (err) {
      // Skip
    }
  }
  
  context += `\nProjects: ${projects.join(', ')}\n`;

  // If specific project, add more details
  if (project) {
    const projectPath = path.join(WORKSPACE_ROOT, project);
    try {
      // Package.json info
      const pkgPath = path.join(projectPath, 'package.json');
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
      context += `\nCurrent Project: ${pkg.name || project}`;
      context += `\nVersion: ${pkg.version || 'N/A'}`;
      context += `\nDependencies: ${Object.keys(pkg.dependencies || {}).slice(0, 10).join(', ')}`;
    } catch (err) {
      context += `\nCurrent Project: ${project}`;
    }
  }

  return context;
}

async function getBrainContext(query) {
  try {
    // Search Brain API internally
    const brainService = require('../brain/services/brain-service');
    // Correct parameter order: query, options, userId
    const results = await brainService.searchKnowledge(query, {
      matchThreshold: 0.3,
      matchCount: 3
    }, DEFAULT_USER_ID);

    if (results && results.length > 0) {
      return results.map(r => 
        `### ${r.title}\n${r.content.substring(0, 500)}${r.content.length > 500 ? '...' : ''}`
      ).join('\n\n');
    }
  } catch (err) {
    console.error('Brain context error:', err.message);
  }
  return null;
}

async function callOpenAI(messages, model) {
  console.log('[AI] Calling OpenAI with model:', model || 'gpt-4o-mini');
  console.log('[AI] API Key present:', !!OPENAI_API_KEY, 'Length:', OPENAI_API_KEY?.length || 0);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  console.log('[AI] OpenAI response status:', response.status);
  
  if (data.error) {
    console.error('[AI] OpenAI error:', JSON.stringify(data.error));
    throw new Error(`OpenAI: ${data.error.message || JSON.stringify(data.error)}`);
  }

  if (!data.choices || !data.choices[0]) {
    console.error('[AI] Unexpected response:', JSON.stringify(data));
    throw new Error('Invalid OpenAI response format');
  }

  return data.choices[0].message.content;
}

/**
 * Call OpenAI with function/tool calling support
 */
async function callOpenAIWithTools(messages, model, tools = []) {
  console.log('[AI] Calling OpenAI with tools:', tools.length);
  
  const requestBody = {
    model: model || 'gpt-4o-mini',
    messages,
    max_tokens: 2000,
    temperature: 0.7
  };
  
  // Add tools if available
  if (tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = 'auto';
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('[AI] OpenAI error:', JSON.stringify(data.error));
    throw new Error(`OpenAI: ${data.error.message || JSON.stringify(data.error)}`);
  }

  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid OpenAI response format');
  }

  const assistantMessage = data.choices[0].message;
  
  // Check if AI wants to call tools
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    console.log('[AI] Tool calls requested:', assistantMessage.tool_calls.length);
    
    // Execute tool calls via MCP
    const toolResults = [];
    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      
      console.log(`[AI] Executing tool: ${toolName}`, toolArgs);
      
      const result = await mcpClient.callTool(toolName, toolArgs);
      
      toolResults.push({
        tool_call_id: toolCall.id,
        name: toolName,
        args: toolArgs,
        result: result
      });
    }
    
    // Add tool results to messages and get final response
    const toolMessages = [
      ...messages,
      assistantMessage,
      ...toolResults.map(tr => ({
        role: 'tool',
        tool_call_id: tr.tool_call_id,
        content: JSON.stringify(tr.result)
      }))
    ];
    
    // Get final response after tool execution
    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: toolMessages,
        max_tokens: 2000,
        temperature: 0.7
      })
    });
    
    const finalData = await finalResponse.json();
    
    if (finalData.error) {
      throw new Error(`OpenAI: ${finalData.error.message}`);
    }
    
    return {
      response: finalData.choices[0].message.content,
      toolCalls: toolResults.map(tr => ({
        tool: tr.name,
        args: tr.args,
        success: tr.result?.success !== false
      }))
    };
  }
  
  // No tool calls, return direct response
  return {
    response: assistantMessage.content,
    toolCalls: []
  };
}

/**
 * Call OpenAI with streaming tool execution and SSE events
 */
async function callOpenAIWithToolsStreaming(messages, model, tools = [], sendEvent) {
  sendEvent('thinking', { message: '💭 AI đang suy nghĩ...' });
  
  const requestBody = {
    model: model || 'gpt-4o-mini',
    messages,
    max_tokens: 2000,
    temperature: 0.7
  };
  
  if (tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = 'auto';
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`OpenAI: ${data.error.message || JSON.stringify(data.error)}`);
  }

  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid OpenAI response format');
  }

  const assistantMessage = data.choices[0].message;
  
  // Check if AI wants to call tools
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    sendEvent('tool_start', { 
      message: `🔧 AI quyết định sử dụng ${assistantMessage.tool_calls.length} tool(s)`,
      count: assistantMessage.tool_calls.length
    });
    
    const toolResults = [];
    
    for (let i = 0; i < assistantMessage.tool_calls.length; i++) {
      const toolCall = assistantMessage.tool_calls[i];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      
      // Send tool execution event
      sendEvent('tool_call', {
        index: i + 1,
        total: assistantMessage.tool_calls.length,
        tool: toolName,
        args: toolArgs,
        message: `⚡ Đang gọi: ${toolName}`
      });
      
      // Execute tool
      const result = await mcpClient.callTool(toolName, toolArgs);
      
      // Send tool result event
      const success = result?.success !== false;
      sendEvent('tool_result', {
        tool: toolName,
        success,
        message: success ? `✅ ${toolName} hoàn thành` : `❌ ${toolName} thất bại`,
        preview: typeof result === 'object' ? 
          JSON.stringify(result).substring(0, 200) : 
          String(result).substring(0, 200)
      });
      
      toolResults.push({
        tool_call_id: toolCall.id,
        name: toolName,
        args: toolArgs,
        result: result
      });
    }
    
    sendEvent('thinking', { message: '💭 AI đang xử lý kết quả tools...' });
    
    // Build messages with tool results
    const toolMessages = [
      ...messages,
      assistantMessage,
      ...toolResults.map(tr => ({
        role: 'tool',
        tool_call_id: tr.tool_call_id,
        content: JSON.stringify(tr.result)
      }))
    ];
    
    // Get final response
    sendEvent('status', { message: '📝 Đang tạo câu trả lời cuối cùng...' });
    
    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: toolMessages,
        max_tokens: 2000,
        temperature: 0.7
      })
    });
    
    const finalData = await finalResponse.json();
    
    if (finalData.error) {
      throw new Error(`OpenAI: ${finalData.error.message}`);
    }
    
    return {
      response: finalData.choices[0].message.content,
      toolCalls: toolResults.map(tr => ({
        tool: tr.name,
        args: tr.args,
        success: tr.result?.success !== false
      }))
    };
  }
  
  // No tool calls
  sendEvent('status', { message: '📝 AI trả lời trực tiếp (không cần tools)' });
  
  return {
    response: assistantMessage.content,
    toolCalls: []
  };
}

async function callAnthropic(messages, model) {
  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: systemMessage,
      messages: chatMessages
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.content[0].text;
}

function generateMockResponse(message, context) {
  // Mock response for testing without API keys
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('project') || lowerMessage.includes('dự án')) {
    return `📁 **Các Projects Trong Workspace:**

1. **longsang-admin** - Admin dashboard chính
2. **ai_secretary** - AI Secretary app
3. **vungtau-dream-homes** - Real estate platform
4. **sabo-arena** - Gaming platform
5. **sabo-hub** - Central hub

Bạn muốn xem chi tiết project nào?`;
  }
  
  if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('lỗi')) {
    return `🐛 **Để kiểm tra errors:**

1. Mở Bug System: \`/admin/bugs\`
2. Hoặc gọi API: \`GET /api/bug-system/errors\`

Bạn muốn tôi check errors gần đây không?`;
  }
  
  if (lowerMessage.includes('brain') || lowerMessage.includes('kiến thức')) {
    return `🧠 **AI Second Brain Status:**

- 20 Domains đã được cấu hình
- 17 Knowledge items
- Vector search enabled

Bạn có thể hỏi bất kỳ câu hỏi nào, tôi sẽ tìm trong knowledge base!`;
  }

  return `Tôi đã nhận được tin nhắn của bạn: "${message}"

⚠️ **Lưu ý:** Đang chạy ở chế độ MOCK (không có API key).

Để sử dụng AI thật, hãy thêm vào \`.env\`:
\`\`\`
OPENAI_API_KEY=sk-xxx
# hoặc
ANTHROPIC_API_KEY=sk-ant-xxx
\`\`\`

Bạn cần hỗ trợ gì?`;
}

async function executeAction(action, params) {
  switch (action) {
    case 'read_file':
      const content = await fs.readFile(
        path.join(WORKSPACE_ROOT, params.file), 
        'utf-8'
      );
      return { file: params.file, content: content.substring(0, 5000) };
    
    case 'search':
      // Delegate to workspace search
      return { message: 'Use /api/workspace/search instead' };
    
    case 'list_errors':
      // Fetch from bug system
      return { message: 'Use /api/bug-system/errors instead' };
    
    default:
      return { error: `Unknown action: ${action}` };
  }
}

module.exports = router;
