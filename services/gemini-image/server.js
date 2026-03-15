/**
 * 🍌 Gemini Image Generation Service
 * Standalone microservice for AI image generation
 * 
 * Port: 3010
 * Endpoint: /api/gemini/image
 * 
 * Models (Official Google Docs):
 * - Nano Banana = gemini-2.5-flash-image (Fast, max 3 refs, 1024px)
 * - Nano Banana Pro = gemini-3-pro-image-preview (Advanced, max 14 refs, up to 4K)
 * - Imagen 3/4 = Dedicated image generation
 * 
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env from multiple locations
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'api', '.env') });

const app = express();
const PORT = process.env.GEMINI_IMAGE_PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const MODELS = {
  'nano-banana': {
    id: 'gemini-2.5-flash-image',
    name: 'Nano Banana',
    endpoint: 'generateContent',
    description: '⚡ Fast (1024px, 3 refs)',
    maxRefImages: 3,
    supportedResolutions: ['1K']
  },
  'nano-banana-pro': {
    id: 'gemini-3-pro-image-preview',
    name: 'Nano Banana Pro',
    endpoint: 'generateContent',
    description: '🚀 Advanced (4K, 14 refs)',
    maxRefImages: 14,
    supportedResolutions: ['1K', '2K', '4K']
  },
  'imagen-3': {
    id: 'imagen-3.0-generate-002',
    name: 'Imagen 3',
    endpoint: 'predict',
    description: '🎨 Photorealistic',
    maxRefImages: 0,
    supportedResolutions: ['1K']
  },
  'imagen-4': {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4',
    endpoint: 'predict',
    description: '✨ Latest quality',
    maxRefImages: 0,
    supportedResolutions: ['1K']
  }
};

const VALID_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

const isConfigured = () => !!GEMINI_API_KEY;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

async function fetchImageAsBase64(url) {
  try {
    if (url.startsWith('data:')) {
      const base64Match = url.match(/base64,(.+)$/);
      return base64Match ? base64Match[1] : null;
    }
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('[Image] Failed to fetch:', error.message);
    return null;
  }
}

function getMimeType(url) {
  if (url.includes('.png') || url.startsWith('data:image/png')) return 'image/png';
  if (url.includes('.gif') || url.startsWith('data:image/gif')) return 'image/gif';
  if (url.includes('.webp') || url.startsWith('data:image/webp')) return 'image/webp';
  return 'image/jpeg';
}

// =============================================================================
// GENERATION FUNCTIONS
// =============================================================================

async function generateWithGemini(model, prompt, referenceImages = [], aspectRatio = '9:16', resolution = '1K') {
  try {
    const parts = [{ text: prompt }];
    
    // Add reference images (respect model limit)
    const maxRefs = model.maxRefImages || 3;
    const imagesToProcess = referenceImages.slice(0, maxRefs);
    
    for (const imgUrl of imagesToProcess) {
      const base64 = await fetchImageAsBase64(imgUrl);
      if (base64) {
        parts.push({
          inlineData: {
            mimeType: getMimeType(imgUrl),
            data: base64
          }
        });
      }
    }
    
    // Build generation config
    const generationConfig = {
      responseModalities: ['IMAGE', 'TEXT']
    };

    // Add imageConfig
    if (model.id === 'gemini-3-pro-image-preview') {
      generationConfig.imageConfig = {
        aspectRatio: aspectRatio,
        imageSize: resolution
      };
    } else {
      generationConfig.imageConfig = {
        aspectRatio: aspectRatio
      };
    }

    const response = await fetch(
      `${API_BASE}/models/${model.id}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message, details: data.error };
    }

    // Extract image
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          return { success: true, image: imageUrl };
        }
      }
      
      const textPart = data.candidates[0].content.parts.find(p => p.text);
      if (textPart) {
        return { success: false, error: 'Model returned text instead of image', details: textPart.text.substring(0, 200) };
      }
    }

    return { success: false, error: 'No image in response', details: JSON.stringify(data).substring(0, 300) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function generateWithImagen(model, prompt, aspectRatio, count) {
  try {
    const response = await fetch(
      `${API_BASE}/models/${model.id}:predict?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: Math.min(count, 4),
            aspectRatio: aspectRatio,
            personGeneration: 'allow_adult'
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error.message, details: data.error };
    }

    if (data.predictions?.length > 0) {
      const images = data.predictions
        .filter(p => p.bytesBase64Encoded)
        .map(p => `data:image/png;base64,${p.bytesBase64Encoded}`);
      
      if (images.length > 0) {
        return { success: true, image: images[0], all_images: images };
      }
    }

    return { success: false, error: 'No images generated', details: JSON.stringify(data).substring(0, 300) };
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
    service: 'gemini-image',
    status: 'healthy',
    configured: isConfigured(),
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/api/gemini/image/status', (req, res) => {
  res.json({
    success: true,
    service: 'gemini-image-service',
    port: PORT,
    configured: isConfigured(),
    available_modes: Object.keys(MODELS),
    models: Object.fromEntries(
      Object.entries(MODELS).map(([key, model]) => [
        key,
        {
          id: model.id,
          name: model.name,
          description: model.description,
          maxRefImages: model.maxRefImages,
          supportedResolutions: model.supportedResolutions
        }
      ])
    ),
    supported_aspect_ratios: VALID_ASPECT_RATIOS,
    documentation: 'https://ai.google.dev/gemini-api/docs/image-generation'
  });
});

// Models info
app.get('/api/gemini/image/models', (req, res) => {
  res.json({
    success: true,
    models: MODELS,
    aspectRatios: VALID_ASPECT_RATIOS,
    recommended: {
      fast: 'nano-banana',
      quality: 'nano-banana-pro',
      photorealistic: 'imagen-4'
    }
  });
});

// Main image generation endpoint
app.post('/api/gemini/image', async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!isConfigured()) {
      return res.status(503).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

    const {
      prompt,
      mode = 'nano-banana',
      aspect_ratio = '9:16',
      resolution = '1K',
      style = 'cinematic',
      number_of_images = 1,
      reference_images = []
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const model = MODELS[mode];
    if (!model) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid mode: ${mode}. Available: ${Object.keys(MODELS).join(', ')}` 
      });
    }

    if (!VALID_ASPECT_RATIOS.includes(aspect_ratio)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid aspect_ratio. Valid: ${VALID_ASPECT_RATIOS.join(', ')}` 
      });
    }

    console.log(`[${model.name}] 🎨 Generating:`, {
      prompt: prompt.substring(0, 60) + '...',
      aspect_ratio,
      resolution,
      ref_images: reference_images.length
    });

    // Style enhancement
    const styles = {
      cinematic: 'cinematic lighting, 4K quality, professional cinematography',
      anime: 'anime style, vibrant colors, detailed illustration',
      realistic: 'photorealistic, natural lighting, sharp details',
      artistic: 'artistic style, creative composition, painterly quality',
      professional: 'professional photography, studio lighting, high-end'
    };
    const enhancedPrompt = `${prompt}. ${styles[style] || styles.cinematic}`;

    let result;

    if (model.endpoint === 'generateContent') {
      result = await generateWithGemini(model, enhancedPrompt, reference_images, aspect_ratio, resolution);
    } else {
      result = await generateWithImagen(model, enhancedPrompt, aspect_ratio, number_of_images);
    }

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`[${model.name}] ✅ Success in ${duration}ms`);
      return res.json({
        success: true,
        output: result.image,
        image_url: result.image,
        all_images: result.all_images || [result.image],
        model: model.id,
        mode: mode,
        provider: 'google-gemini',
        duration_ms: duration
      });
    } else {
      console.error(`[${model.name}] ❌ Failed:`, result.error);
      return res.status(500).json({ 
        success: false, 
        error: result.error,
        details: result.details,
        duration_ms: duration
      });
    }

  } catch (error) {
    console.error('[Gemini Image] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      duration_ms: Date.now() - startTime
    });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🍌 ═══════════════════════════════════════════════════════');
  console.log('   GEMINI IMAGE SERVICE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Port:     ${PORT}`);
  console.log(`   Status:   ${isConfigured() ? '✅ Configured' : '❌ Missing GEMINI_API_KEY'}`);
  console.log(`   Models:   ${Object.keys(MODELS).join(', ')}`);
  console.log('');
  console.log('   Endpoints:');
  console.log(`   - GET  /health`);
  console.log(`   - GET  /api/gemini/image/status`);
  console.log(`   - GET  /api/gemini/image/models`);
  console.log(`   - POST /api/gemini/image`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

module.exports = app;
