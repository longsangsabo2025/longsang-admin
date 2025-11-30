/**
 * 🖼️ Image Generator Service
 * 
 * Features:
 * 1. Generate images with DALL-E 3
 * 2. Save images to Supabase Storage
 * 3. Return permanent URLs (not expiring DALL-E URLs)
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Storage bucket name
const BUCKET_NAME = 'post-images';

/**
 * Ensure storage bucket exists
 */
async function ensureBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!exists) {
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error('Failed to create bucket:', error);
        return false;
      }
      console.log('✅ Created storage bucket:', BUCKET_NAME);
    }
    return true;
  } catch (error) {
    console.error('Bucket check error:', error);
    return false;
  }
}

/**
 * Generate image with DALL-E and save to Supabase Storage
 */
async function generateImage(prompt, options = {}) {
  const {
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
    saveToStorage = true,
    folder = 'generated',
  } = options;

  console.log(`🎨 Generating image: "${prompt.substring(0, 50)}..."`);
  
  try {
    // Step 1: Generate with DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality,
      style: style,
    });

    const dalleUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;
    
    console.log(`   ✅ DALL-E generated image`);

    // Step 2: Save to Supabase Storage (optional but recommended)
    if (saveToStorage) {
      const permanentUrl = await saveImageToStorage(dalleUrl, folder);
      if (permanentUrl) {
        console.log(`   ✅ Saved to Supabase Storage`);
        return {
          success: true,
          url: permanentUrl,
          originalUrl: dalleUrl,
          revisedPrompt,
          source: 'supabase',
          expiresAt: null, // Permanent URL
        };
      }
    }

    // Fallback: Return DALL-E URL (expires in ~1 hour)
    return {
      success: true,
      url: dalleUrl,
      originalUrl: dalleUrl,
      revisedPrompt,
      source: 'dalle',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // ~1 hour
    };

  } catch (error) {
    console.error('Image generation error:', error.message);
    return {
      success: false,
      error: error.message,
      url: null,
    };
  }
}

/**
 * Download image from URL and upload to Supabase Storage
 */
async function saveImageToStorage(imageUrl, folder = 'generated') {
  try {
    // Ensure bucket exists
    await ensureBucket();

    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Generate unique filename
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const timestamp = Date.now();
    const extension = contentType.includes('jpeg') ? 'jpg' : 'png';
    const filename = `${folder}/${timestamp}-${hash}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Save to storage error:', error);
    return null;
  }
}

/**
 * Upload image from buffer or base64
 */
async function uploadImage(imageData, options = {}) {
  const {
    filename = `upload-${Date.now()}.png`,
    folder = 'uploads',
    contentType = 'image/png',
  } = options;

  try {
    await ensureBucket();

    let buffer;
    if (typeof imageData === 'string') {
      // Base64 string
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = imageData;
    }

    const fullPath = `${folder}/${filename}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullPath, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fullPath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: fullPath,
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List images in storage
 */
async function listImages(folder = '', limit = 100) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    // Add public URLs
    const images = data.map(file => {
      const path = folder ? `${folder}/${file.name}` : file.name;
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);
      
      return {
        ...file,
        url: urlData.publicUrl,
      };
    });

    return { success: true, images };
  } catch (error) {
    return { success: false, error: error.message, images: [] };
  }
}

/**
 * Delete image from storage
 */
async function deleteImage(path) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate social media image with specific dimensions
 */
async function generateSocialImage(prompt, platform = 'facebook') {
  const sizes = {
    facebook: '1024x1024',      // 1:1 for feed
    instagram: '1024x1024',     // 1:1 for feed  
    linkedin: '1792x1024',      // 16:9 landscape
    twitter: '1792x1024',       // 16:9 landscape
    story: '1024x1792',         // 9:16 vertical
  };

  const size = sizes[platform] || '1024x1024';
  
  // Enhance prompt for social media
  const enhancedPrompt = `${prompt}. 
Professional social media post image for ${platform}. 
High quality, engaging, modern design. 
No text overlay. Clean composition.`;

  return generateImage(enhancedPrompt, {
    size,
    quality: 'standard',
    style: 'vivid',
    saveToStorage: true,
    folder: `social/${platform}`,
  });
}

module.exports = {
  generateImage,
  saveImageToStorage,
  uploadImage,
  listImages,
  deleteImage,
  generateSocialImage,
  ensureBucket,
  BUCKET_NAME,
};
