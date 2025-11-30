/**
 * Carousel Posts API Routes
 * 
 * Endpoints for creating multi-image carousel posts
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const carouselCreator = require('../services/carousel-creator');

/**
 * POST /api/carousel/create
 * Create a new carousel post
 */
router.post('/create', async (req, res) => {
  try {
    const { pageId, topic, slideCount, theme, style } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'topic is required',
      });
    }

    const result = await carouselCreator.createCarousel({
      pageId: pageId || 'sabo_arena',
      topic,
      slideCount: slideCount || 5,
      theme: theme || 'story',
      style: style || 'modern',
      generateImages: false, // Skip image generation for speed (can regenerate later)
    });

    // createCarousel returns { success, carousel, metadata }
    const carousel = result.carousel;

    res.json({
      success: true,
      carousel: {
        id: carousel.id,
        topic: carousel.topic,
        theme: carousel.theme,
        caption: carousel.caption,
        slideCount: carousel.slides?.length || 0,
        slides: carousel.slides?.map((s, i) => ({
          index: i + 1,
          title: s.title,
          headline: s.title,
          description: s.description?.substring(0, 100) + '...',
          hasImage: !!s.imageUrl,
          imageUrl: s.imageUrl,
        })),
        hashtags: carousel.hashtags,
        status: carousel.status || 'draft',
      },
    });
  } catch (error) {
    console.error('❌ Create carousel error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/carousel/list
 * List all carousels
 */
router.get('/list', async (req, res) => {
  try {
    const { pageId, status, limit } = req.query;

    const carousels = await carouselCreator.getCarousels(pageId, {
      status,
      limit: parseInt(limit) || 50,
    });

    res.json({
      success: true,
      count: carousels.length,
      carousels: carousels.map(c => ({
        id: c.id,
        topic: c.topic,
        pageId: c.page_id,
        theme: c.theme,
        slideCount: c.slides?.length || 0,
        status: c.status,
        createdAt: c.created_at,
        publishedAt: c.published_at,
      })),
    });
  } catch (error) {
    console.error('❌ List carousels error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/carousel/:carouselId
 * Get carousel details
 */
router.get('/:carouselId', async (req, res) => {
  try {
    const { carouselId } = req.params;
    const carousel = await carouselCreator.getCarousel(carouselId);

    if (!carousel) {
      return res.status(404).json({
        success: false,
        error: 'Carousel not found',
      });
    }

    res.json({
      success: true,
      carousel,
    });
  } catch (error) {
    console.error('❌ Get carousel error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/carousel/:carouselId/publish
 * Publish carousel to Facebook
 */
router.post('/:carouselId/publish', async (req, res) => {
  try {
    const { carouselId } = req.params;
    const { pageId } = req.body;

    const result = await carouselCreator.publishCarousel(
      carouselId,
      pageId || 'sabo_arena'
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Publish carousel error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/carousel/:carouselId/slide/:slideIndex
 * Update a specific slide
 */
router.put('/:carouselId/slide/:slideIndex', async (req, res) => {
  try {
    const { carouselId, slideIndex } = req.params;
    const { headline, description, imageUrl } = req.body;

    const result = await carouselCreator.updateSlide(carouselId, parseInt(slideIndex), {
      headline,
      description,
      imageUrl,
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Update slide error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/carousel/:carouselId/regenerate-images
 * Regenerate all images for carousel
 */
router.post('/:carouselId/regenerate-images', async (req, res) => {
  try {
    const { carouselId } = req.params;
    const result = await carouselCreator.regenerateImages(carouselId);
    res.json(result);
  } catch (error) {
    console.error('❌ Regenerate images error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/carousel/:carouselId
 * Delete a carousel
 */
router.delete('/:carouselId', async (req, res) => {
  try {
    const { carouselId } = req.params;
    const result = await carouselCreator.deleteCarousel(carouselId);
    res.json(result);
  } catch (error) {
    console.error('❌ Delete carousel error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/carousel/themes
 * Get available carousel themes
 */
router.get('/themes/list', (req, res) => {
  res.json({
    success: true,
    themes: [
      {
        id: 'story',
        name: 'Story Sequence',
        description: 'Beginning → development → climax → resolution',
        slides: 5,
      },
      {
        id: 'tips',
        name: 'Tips & Tricks',
        description: 'Numbered tips with actionable advice',
        slides: 5,
      },
      {
        id: 'showcase',
        name: 'Product Showcase',
        description: 'Feature highlights and benefits',
        slides: 4,
      },
      {
        id: 'comparison',
        name: 'Before/After',
        description: 'Transformation comparison',
        slides: 4,
      },
      {
        id: 'journey',
        name: 'Customer Journey',
        description: 'Step-by-step process or experience',
        slides: 5,
      },
      {
        id: 'countdown',
        name: 'Countdown',
        description: 'Top N reasons, features, or benefits',
        slides: 5,
      },
    ],
  });
});

module.exports = router;
