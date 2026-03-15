/**
 * 🤖 AI Assistant Service
 * Standalone microservice for AI chat/assistant
 * 
 * Port: 3013
 * Features: Multi-model chat (OpenAI, Gemini, Anthropic)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'api', '.env') });

const app = express();
const PORT = process.env.AI_ASSISTANT_PORT || 3013;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// =============================================================================
// CONFIGURATION
// =============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MODELS = {
  // OpenAI
  'gpt-4o': { provider: 'openai', name: 'GPT-4o', description: '🧠 Most capable' },
  'gpt-4o-mini': { provider: 'openai', name: 'GPT-4o Mini', description: '⚡ Fast & cheap' },
  'gpt-4-turbo': { provider: 'openai', name: 'GPT-4 Turbo', description: '💪 Powerful' },
  
  // Gemini
  'gemini-2.5-flash': { provider: 'gemini', name: 'Gemini 2.5 Flash', description: '⚡ Fast, free' },
  'gemini-2.5-pro': { provider: 'gemini', name: 'Gemini 2.5 Pro', description: '🧠 Quality' },
  'gemini-1.5-flash': { provider: 'gemini', name: 'Gemini 1.5 Flash', description: '⚡ Legacy fast' },
  
  // Anthropic
  'claude-3-5-sonnet': { provider: 'anthropic', name: 'Claude 3.5 Sonnet', description: '📝 Best writing' },
  'claude-3-opus': { provider: 'anthropic', name: 'Claude 3 Opus', description: '🎯 Most capable' },
};

const isConfigured = () => !!(OPENAI_API_KEY || GEMINI_API_KEY || ANTHROPIC_API_KEY);

// =============================================================================
// CHAT FUNCTIONS
// =============================================================================

async function chatWithOpenAI(messages, model, options = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4096
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
}

async function chatWithGemini(messages, model, options = {}) {
  // Convert messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Handle system message
  let systemInstruction = null;
  if (messages[0]?.role === 'system') {
    systemInstruction = { parts: [{ text: messages[0].content }] };
    contents.shift();
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.max_tokens || 4096
        }
      })
    }
  );

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return {
    content: text,
    usage: data.usageMetadata,
    model: model
  };
}

async function chatWithAnthropic(messages, model, options = {}) {
  // Extract system message
  let system = '';
  const filteredMessages = messages.filter(m => {
    if (m.role === 'system') {
      system = m.content;
      return false;
    }
    return true;
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: options.max_tokens || 4096,
      system: system,
      messages: filteredMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    content: data.content[0].text,
    usage: data.usage,
    model: data.model
  };
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'ai-assistant',
    status: 'healthy',
    configured: isConfigured(),
    providers: {
      openai: !!OPENAI_API_KEY,
      gemini: !!GEMINI_API_KEY,
      anthropic: !!ANTHROPIC_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// Status
app.get('/api/ai/status', (req, res) => {
  res.json({
    success: true,
    service: 'ai-assistant-service',
    port: PORT,
    configured: isConfigured(),
    available_models: Object.keys(MODELS).filter(m => {
      const model = MODELS[m];
      if (model.provider === 'openai') return !!OPENAI_API_KEY;
      if (model.provider === 'gemini') return !!GEMINI_API_KEY;
      if (model.provider === 'anthropic') return !!ANTHROPIC_API_KEY;
      return false;
    })
  });
});

// Models info
app.get('/api/ai/models', (req, res) => {
  const availableModels = {};
  
  for (const [key, model] of Object.entries(MODELS)) {
    let available = false;
    if (model.provider === 'openai' && OPENAI_API_KEY) available = true;
    if (model.provider === 'gemini' && GEMINI_API_KEY) available = true;
    if (model.provider === 'anthropic' && ANTHROPIC_API_KEY) available = true;
    
    availableModels[key] = { ...model, available };
  }
  
  res.json({
    success: true,
    models: availableModels,
    recommended: {
      free: 'gemini-2.5-flash',
      quality: 'gpt-4o',
      writing: 'claude-3-5-sonnet'
    }
  });
});

// Main chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  const startTime = Date.now();

  try {
    if (!isConfigured()) {
      return res.status(503).json({ 
        success: false, 
        error: 'No AI provider configured' 
      });
    }

    const {
      messages,
      model = 'gemini-2.5-flash',
      temperature = 0.7,
      max_tokens = 4096,
      stream = false
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    const modelConfig = MODELS[model];
    if (!modelConfig) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid model: ${model}. Available: ${Object.keys(MODELS).join(', ')}` 
      });
    }

    console.log(`[${modelConfig.name}] 💬 Chat:`, {
      messages: messages.length,
      temperature,
      max_tokens
    });

    let result;
    const options = { temperature, max_tokens };

    switch (modelConfig.provider) {
      case 'openai':
        if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
        result = await chatWithOpenAI(messages, model, options);
        break;
        
      case 'gemini':
        if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
        result = await chatWithGemini(messages, model, options);
        break;
        
      case 'anthropic':
        if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
        result = await chatWithAnthropic(messages, model, options);
        break;
        
      default:
        throw new Error(`Unknown provider: ${modelConfig.provider}`);
    }

    const durationMs = Date.now() - startTime;
    console.log(`[${modelConfig.name}] ✅ Response in ${durationMs}ms`);

    return res.json({
      success: true,
      content: result.content,
      model: result.model,
      provider: modelConfig.provider,
      usage: result.usage,
      duration_ms: durationMs
    });

  } catch (error) {
    console.error('[AI] Chat error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

// Simple completion endpoint
app.post('/api/ai/complete', async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.5-flash', ...options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    // Convert to messages format
    const messages = [{ role: 'user', content: prompt }];
    
    // Forward to chat endpoint logic
    req.body = { messages, model, ...options };
    
    // Reuse chat logic
    const chatHandler = app._router.stack.find(r => r.route?.path === '/api/ai/chat');
    // Just call the handler directly by reconstructing the request
    
    // Simpler: just duplicate minimal logic
    const modelConfig = MODELS[model];
    if (!modelConfig) {
      return res.status(400).json({ success: false, error: `Invalid model: ${model}` });
    }

    let result;
    
    if (modelConfig.provider === 'gemini' && GEMINI_API_KEY) {
      result = await chatWithGemini(messages, model, options);
    } else if (modelConfig.provider === 'openai' && OPENAI_API_KEY) {
      result = await chatWithOpenAI(messages, model, options);
    } else if (modelConfig.provider === 'anthropic' && ANTHROPIC_API_KEY) {
      result = await chatWithAnthropic(messages, model, options);
    } else {
      throw new Error('No suitable AI provider available');
    }

    return res.json({
      success: true,
      content: result.content,
      model: result.model
    });

  } catch (error) {
    console.error('[AI] Complete error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🤖 ═══════════════════════════════════════════════════════');
  console.log('   AI ASSISTANT SERVICE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Port:       ${PORT}`);
  console.log(`   OpenAI:     ${OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Gemini:     ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Anthropic:  ${ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('');
  console.log('   Endpoints:');
  console.log('   - GET  /health');
  console.log('   - GET  /api/ai/status');
  console.log('   - GET  /api/ai/models');
  console.log('   - POST /api/ai/chat');
  console.log('   - POST /api/ai/complete');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

module.exports = app;
