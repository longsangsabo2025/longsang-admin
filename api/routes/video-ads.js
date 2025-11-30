/**
 * Video Ads API Routes
 * Phase 2: Video generation endpoints
 */

const express = require('express');
const router = express.Router();
const VideoAdService = require('../services/video-ad-service');

const videoAdService = new VideoAdService();

/**
 * POST /api/video-ads/generate
 * Generate video ad from product info
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      product_info,
      ad_style = "product",
      duration = 15,
      aspect_ratio = "9:16",
      num_images = 3
    } = req.body;

    if (!product_info) {
      return res.status(400).json({
        success: false,
        error: 'product_info is required'
      });
    }

    const result = await videoAdService.generateVideoAd({
      product_info,
      ad_style,
      duration,
      aspect_ratio,
      num_images
    });

    res.json(result);
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Video generation failed'
    });
  }
});

/**
 * POST /api/video-ads/generate-from-images
 * Generate video from existing images
 */
router.post('/generate-from-images', async (req, res) => {
  try {
    const {
      image_paths,
      duration = 15,
      fps = 30,
      transition = "fade",
      audio_path = null,
      aspect_ratio = "9:16"
    } = req.body;

    if (!image_paths || !Array.isArray(image_paths) || image_paths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'image_paths array is required'
      });
    }

    const result = await videoAdService.generateVideoFromImages({
      image_paths,
      duration,
      fps,
      transition,
      audio_path,
      aspect_ratio
    });

    res.json(result);
  } catch (error) {
    console.error('Video from images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Video generation failed'
    });
  }
});

/**
 * POST /api/video-ads/generate-variants
 * Generate multiple video variants for A/B testing
 */
router.post('/generate-variants', async (req, res) => {
  try {
    const {
      product_info,
      num_variants = 3,
      ad_styles = ["product", "lifestyle", "social"],
      duration = 15,
      aspect_ratio = "9:16"
    } = req.body;

    if (!product_info) {
      return res.status(400).json({
        success: false,
        error: 'product_info is required'
      });
    }

    const result = await videoAdService.generateVideoVariants({
      product_info,
      num_variants,
      ad_styles,
      duration,
      aspect_ratio
    });

    res.json(result);
  } catch (error) {
    console.error('Video variants generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Video variants generation failed'
    });
  }
});

/**
 * GET /api/video-ads/platform-formats
 * Get video formats for different platforms
 */
router.get('/platform-formats', (req, res) => {
  try {
    const formats = videoAdService.getPlatformFormats();
    res.json({
      success: true,
      formats
    });
  } catch (error) {
    console.error('Platform formats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get platform formats'
    });
  }
});

module.exports = router;

