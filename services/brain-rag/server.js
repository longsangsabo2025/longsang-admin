/**
 * 🧠 Brain RAG Service
 * Standalone microservice for RAG (Retrieval Augmented Generation)
 * 
 * Port: 3012
 * Features: Knowledge search, RAG context, Smart chat
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'api', '.env') });

const app = express();
const PORT = process.env.BRAIN_SERVICE_PORT || 3012;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// =============================================================================
// CONFIGURATION
// =============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Load the local Brain RAG core so this service can run outside the monorepo api.
let brainRAG = null;
try {
  const brainRAGModule = require('./lib/standalone-brain-rag');
  brainRAG = brainRAGModule.brainRAG;
  console.log('[Brain] ✅ Loaded standalone brainRAG service');
} catch (e) {
  console.warn('[Brain] ⚠️ brainRAG service not available:', e.message);
}

const isConfigured = () => !!(OPENAI_API_KEY || GEMINI_API_KEY) && !!SUPABASE_URL;

// =============================================================================
// FALLBACK FUNCTIONS (when brainRAG not available)
// =============================================================================

async function searchKnowledge(query, limit = 5) {
  if (brainRAG) {
    return brainRAG.searchKnowledge(query, limit);
  }
  
  // Fallback: Direct Supabase query
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return [];
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/brain_knowledge?select=*&limit=${limit}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    return await response.json();
  } catch (e) {
    console.error('[Brain] Search error:', e);
    return [];
  }
}

async function buildRAGContext(query, options = {}) {
  if (brainRAG) {
    return brainRAG.buildRAGContext(query, options);
  }
  
  const results = await searchKnowledge(query, options.limit || 5);
  return {
    context: results.map(r => r.content || r.summary).join('\n\n'),
    sources: results,
    count: results.length
  };
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'brain-rag',
    status: 'healthy',
    configured: isConfigured(),
    brainRAGLoaded: !!brainRAG,
    providers: {
      openai: !!OPENAI_API_KEY,
      gemini: !!GEMINI_API_KEY,
      supabase: !!SUPABASE_URL
    },
    timestamp: new Date().toISOString()
  });
});

// Status
app.get('/api/brain/status', (req, res) => {
  res.json({
    success: true,
    service: 'brain-rag-service',
    port: PORT,
    configured: isConfigured(),
    brainRAGAvailable: !!brainRAG
  });
});

// Search knowledge
app.post('/api/brain/rag/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await searchKnowledge(query, limit);
    
    res.json({
      success: true,
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('[Brain] Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Build RAG context
app.post('/api/brain/rag/context', async (req, res) => {
  try {
    const { query, limit = 5, minRelevance = 30 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const context = await buildRAGContext(query, { limit, minRelevance });
    
    res.json({
      success: true,
      query,
      ...context
    });
  } catch (error) {
    console.error('[Brain] Context error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RAG Chat
app.post('/api/brain/rag/chat', async (req, res) => {
  try {
    if (!brainRAG) {
      return res.status(503).json({ 
        error: 'brainRAG service not available in standalone mode' 
      });
    }

    const { 
      messages, 
      model = 'gpt-4o-mini',
      temperature = 0.7,
      systemPrompt = 'Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.'
    } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await brainRAG.generateWithRAG(messages, {
      model,
      temperature,
      systemPrompt
    });
    
    res.json({
      success: true,
      response: response.content,
      usage: response.usage,
      ragApplied: response.ragApplied
    });
  } catch (error) {
    console.error('[Brain] Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Smart RAG Chat
app.post('/api/brain/rag/smart-chat', async (req, res) => {
  try {
    if (!brainRAG) {
      return res.status(503).json({ 
        error: 'brainRAG service not available in standalone mode' 
      });
    }

    const { 
      messages, 
      model = 'gpt-4o-mini',
      temperature = 0.7,
      systemPrompt = 'Bạn là trợ lý AI thông minh, trả lời bằng tiếng Việt.',
      brainEnabled = true,
      forceRAG = false,
      minRelevance = 50
    } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await brainRAG.generateWithSmartRAG(messages, {
      model,
      temperature,
      systemPrompt,
      brainEnabled,
      forceRAG,
      minRelevance
    });
    
    res.json({
      success: true,
      response: response.content,
      usage: response.usage,
      ragApplied: response.ragApplied,
      ragReason: response.ragReason,
      sources: response.sources
    });
  } catch (error) {
    console.error('[Brain] Smart chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check relevance
app.post('/api/brain/rag/check-relevance', async (req, res) => {
  try {
    if (!brainRAG || typeof brainRAG.isQueryRelevant !== 'function') {
      return res.status(503).json({ error: 'brainRAG service not available in standalone mode' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const isRelevant = brainRAG.isQueryRelevant(query);
    res.json({
      success: true,
      query,
      isRelevant,
      willTriggerRAG: isRelevant,
    });
  } catch (error) {
    console.error('[Brain] Check relevance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for brainRAG
app.get('/api/brain/rag/health', async (req, res) => {
  try {
    if (brainRAG) {
      const health = await brainRAG.healthCheck();
      return res.json(health);
    }
    
    res.json({
      status: 'degraded',
      message: 'brainRAG service not loaded',
      supabase: !!SUPABASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🧠 ═══════════════════════════════════════════════════════');
  console.log('   BRAIN RAG SERVICE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Port:       ${PORT}`);
  console.log(`   BrainRAG:   ${brainRAG ? '✅ Loaded' : '⚠️ Fallback mode'}`);
  console.log(`   OpenAI:     ${OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Gemini:     ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Supabase:   ${SUPABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log('');
  console.log('   Endpoints:');
  console.log('   - GET  /health');
  console.log('   - GET  /api/brain/status');
  console.log('   - POST /api/brain/rag/search');
  console.log('   - POST /api/brain/rag/context');
  console.log('   - POST /api/brain/rag/chat');
  console.log('   - POST /api/brain/rag/smart-chat');
  console.log('   - POST /api/brain/rag/check-relevance');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

module.exports = app;
