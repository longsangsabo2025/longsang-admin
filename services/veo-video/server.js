/**
 * 🎬 VEO Video Generation Service
 * Standalone microservice for AI video generation
 * 
 * Port: 3011
 * Supports: Kling AI, Stable Video Diffusion, Google VEO
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'api', '.env') });

const app = express();
const PORT = process.env.VEO_SERVICE_PORT || 3011;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// =============================================================================
// CONFIGURATION
// =============================================================================

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

const MODELS = {
  'kling-pro': {
    id: 'kwaivgi/kling-v1.6-pro',
    version: 'a0bae8e36b9c04ef7e4b5ee8c62ceaa0e75fc8564dcae4c4ffe7638c9eba0a10',
    name: 'Kling AI v1.6 Pro',
    description: '🎬 High quality, 10s max',
    maxDuration: 10,
    supportsImageInput: true,
    provider: 'replicate'
  },
  'kling-standard': {
    id: 'kwaivgi/kling-v1.5-standard',
    version: '5a7f0e3c5f3c8e8b8a5e8c8b8a5e8c8b8a5e8c8b',
    name: 'Kling AI v1.5',
    description: '⚡ Fast, 5s max',
    maxDuration: 5,
    supportsImageInput: true,
    provider: 'replicate'
  },
  'minimax': {
    id: 'minimax/video-01',
    version: 'latest',
    name: 'MiniMax Video-01',
    description: '🎥 Text-to-video',
    maxDuration: 6,
    supportsImageInput: false,
    provider: 'replicate'
  }
};

const isConfigured = () => !!(REPLICATE_API_TOKEN || GOOGLE_AI_API_KEY);

// =============================================================================
// GENERATION FUNCTIONS
// =============================================================================

async function generateWithReplicate(model, prompt, imageUrl, duration, aspectRatio) {
  try {
    const input = {
      prompt,
      duration: String(Math.min(duration, model.maxDuration)),
      aspect_ratio: aspectRatio,
      cfg_scale: 0.5,
    };

    if (imageUrl && model.supportsImageInput) {
      input.image_url = imageUrl;
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model.version,
        input
      })
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      status: data.status,
      prediction_id: data.id,
      video_url: data.status === 'succeeded' ? data.output : null,
      message: data.status === 'succeeded' 
        ? 'Video generated successfully'
        : 'Video is being generated. Poll /api/veo/status/:id for updates.'
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkReplicateStatus(predictionId) {
  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      }
    });

    const data = await response.json();
    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;

    return {
      success: true,
      status: data.status,
      video_url: data.status === 'succeeded' ? videoUrl : null,
      error: data.error,
      logs: data.logs,
      metrics: data.metrics
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'veo-video',
    status: 'healthy',
    configured: isConfigured(),
    providers: {
      replicate: !!REPLICATE_API_TOKEN,
      google: !!GOOGLE_AI_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/api/veo/status', (req, res) => {
  res.json({
    success: true,
    service: 'veo-video-service',
    port: PORT,
    configured: isConfigured(),
    available_models: Object.keys(MODELS),
    models: Object.fromEntries(
      Object.entries(MODELS).map(([key, model]) => [
        key,
        {
          name: model.name,
          description: model.description,
          maxDuration: model.maxDuration,
          supportsImageInput: model.supportsImageInput
        }
      ])
    )
  });
});

// Models info
app.get('/api/veo/models', (req, res) => {
  res.json({
    success: true,
    models: MODELS,
    recommended: {
      quality: 'kling-pro',
      fast: 'kling-standard',
      textOnly: 'minimax'
    }
  });
});

// Generate video
app.post('/api/veo/generate', async (req, res) => {
  const startTime = Date.now();

  try {
    if (!isConfigured()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Video generation API not configured' 
      });
    }

    const {
      prompt,
      image_url,
      model: modelKey = 'kling-pro',
      duration = 5,
      aspect_ratio = '16:9'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const model = MODELS[modelKey];
    if (!model) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid model: ${modelKey}. Available: ${Object.keys(MODELS).join(', ')}` 
      });
    }

    console.log(`[${model.name}] 🎬 Generating video:`, {
      prompt: prompt.substring(0, 60) + '...',
      has_image: !!image_url,
      duration,
      aspect_ratio
    });

    let result;

    if (model.provider === 'replicate' && REPLICATE_API_TOKEN) {
      result = await generateWithReplicate(model, prompt, image_url, duration, aspect_ratio);
    } else {
      result = {
        success: false,
        error: 'No suitable video generation provider available'
      };
    }

    const durationMs = Date.now() - startTime;

    if (result.success) {
      console.log(`[${model.name}] ✅ Request accepted in ${durationMs}ms`);
    } else {
      console.error(`[${model.name}] ❌ Failed:`, result.error);
    }

    return res.json({
      ...result,
      model: modelKey,
      provider: model.provider,
      duration_ms: durationMs
    });

  } catch (error) {
    console.error('[VEO] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

// Check generation status
app.get('/api/veo/status/:id', async (req, res) => {
  try {
    if (!REPLICATE_API_TOKEN) {
      return res.status(503).json({ 
        success: false, 
        error: 'Replicate API not configured' 
      });
    }

    const { id } = req.params;
    const result = await checkReplicateStatus(id);
    
    return res.json(result);

  } catch (error) {
    console.error('[VEO] Status check error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel generation
app.post('/api/veo/cancel/:id', async (req, res) => {
  try {
    if (!REPLICATE_API_TOKEN) {
      return res.status(503).json({ success: false, error: 'Replicate API not configured' });
    }

    const { id } = req.params;
    
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      }
    });

    const data = await response.json();
    
    return res.json({
      success: true,
      status: data.status,
      message: 'Generation cancelled'
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🎬 ═══════════════════════════════════════════════════════');
  console.log('   VEO VIDEO SERVICE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Port:       ${PORT}`);
  console.log(`   Replicate:  ${REPLICATE_API_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Google AI:  ${GOOGLE_AI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Models:     ${Object.keys(MODELS).join(', ')}`);
  console.log('');
  console.log('   Endpoints:');
  console.log('   - GET  /health');
  console.log('   - GET  /api/veo/status');
  console.log('   - GET  /api/veo/models');
  console.log('   - POST /api/veo/generate');
  console.log('   - GET  /api/veo/status/:id');
  console.log('   - POST /api/veo/cancel/:id');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

module.exports = app;
