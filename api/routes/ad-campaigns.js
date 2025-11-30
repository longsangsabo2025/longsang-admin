/**
 * Ad Campaigns API Routes
 * Phase 1: AI-powered ad campaign generation
 */

const express = require('express');
const router = express.Router();
const FacebookAdsManager = require('../services/facebook-ads-manager');
const AdCreativeService = require('../services/ad-creative-service');
const CampaignStrategyService = require('../services/campaign-strategy-service');

// Initialize services
let facebookAdsManager = null;
let adCreativeService = null;
let campaignStrategyService = null;

// Initialize Facebook Ads Manager (lazy initialization)
function getFacebookAdsManager() {
  if (!facebookAdsManager) {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      throw new Error('Facebook Ads credentials not configured');
    }

    facebookAdsManager = new FacebookAdsManager(accessToken, adAccountId);
    adCreativeService = new AdCreativeService(facebookAdsManager);
    campaignStrategyService = new CampaignStrategyService();
  }

  return { facebookAdsManager, adCreativeService, campaignStrategyService };
}

/**
 * POST /api/ad-campaigns/generate-strategy
 * Generate campaign strategy using Brain domain agent
 */
router.post('/generate-strategy', async (req, res) => {
  try {
    const { product_info, domain_id, target_audience } = req.body;

    if (!product_info) {
      return res.status(400).json({ error: 'product_info is required' });
    }

    const { campaignStrategyService } = getFacebookAdsManager();

    const strategy = await campaignStrategyService.generateStrategy({
      product_info,
      domain_id,
      target_audience
    });

    res.json({
      success: true,
      strategy
    });
  } catch (error) {
    console.error('Error generating campaign strategy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ad-campaigns/generate-image
 * Generate ad image using Google Imagen
 */
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, aspect_ratio, ad_style, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const { adCreativeService } = getFacebookAdsManager();

    const imageResult = await adCreativeService.generateAdImage({
      prompt,
      aspect_ratio: aspect_ratio || "16:9",
      ad_style: ad_style || "product",
      style
    });

    res.json(imageResult);
  } catch (error) {
    console.error('Error generating ad image:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ad-campaigns/generate-creatives
 * Generate multiple creative variants for A/B testing
 */
router.post('/generate-creatives', async (req, res) => {
  try {
    const { product_info, num_variants = 3 } = req.body;

    if (!product_info) {
      return res.status(400).json({ error: 'product_info is required' });
    }

    const { adCreativeService } = getFacebookAdsManager();

    const variants = await adCreativeService.generateCreativeVariants(
      product_info,
      num_variants
    );

    res.json({
      success: true,
      variants,
      count: variants.length
    });
  } catch (error) {
    console.error('Error generating creatives:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ad-campaigns/create-creative
 * Create Facebook ad creative with AI-generated image
 */
router.post('/create-creative', async (req, res) => {
  try {
    const {
      name,
      page_id,
      message,
      link,
      product_info,
      ad_style,
      aspect_ratio,
      image_url,
      generate_image = true
    } = req.body;

    if (!page_id) {
      return res.status(400).json({ error: 'page_id is required' });
    }

    if (generate_image && !product_info && !image_url) {
      return res.status(400).json({
        error: 'product_info or image_url is required when generate_image is true'
      });
    }

    const { adCreativeService } = getFacebookAdsManager();

    const creative = await adCreativeService.createAICreative({
      name,
      page_id,
      message,
      link,
      product_info,
      ad_style,
      aspect_ratio,
      image_url,
      generate_image
    });

    res.json(creative);
  } catch (error) {
    console.error('Error creating AI creative:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ad-campaigns/create-campaign
 * Create complete campaign with AI-generated creatives
 */
router.post('/create-campaign', async (req, res) => {
  try {
    const {
      campaign_name,
      objective,
      budget,
      page_id,
      product_info,
      message,
      link,
      num_creatives = 3,
      target_audience,
      domain_id
    } = req.body;

    if (!campaign_name || !page_id || !product_info) {
      return res.status(400).json({
        error: 'campaign_name, page_id, and product_info are required'
      });
    }

    const { adCreativeService, campaignStrategyService } = getFacebookAdsManager();

    // Step 1: Generate campaign strategy (optional, uses Brain if domain_id provided)
    let strategy = null;
    if (domain_id) {
      try {
        strategy = await campaignStrategyService.generateStrategy({
          product_info,
          domain_id,
          target_audience
        });
      } catch (error) {
        console.warn('Strategy generation failed, continuing without strategy:', error);
      }
    }

    // Step 2: Create campaign with AI creatives
    const campaign = await adCreativeService.createCampaignWithAICreatives({
      campaign_name,
      objective: objective || 'CONVERSIONS',
      budget,
      page_id,
      product_info,
      message,
      link,
      num_creatives
    });

    res.json({
      success: true,
      campaign,
      strategy,
      message: 'Campaign created successfully with AI-generated creatives'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ad-campaigns/styles
 * Get available ad style presets
 */
router.get('/styles', (req, res) => {
  const styles = {
    product: {
      name: 'Product',
      description: 'Professional product photography with clean background',
      use_case: 'E-commerce, product showcases'
    },
    lifestyle: {
      name: 'Lifestyle',
      description: 'Product in real-world context, natural setting',
      use_case: 'Brand storytelling, relatable content'
    },
    testimonial: {
      name: 'Testimonial',
      description: 'Friendly, trustworthy portrait photography',
      use_case: 'Customer testimonials, social proof'
    },
    social: {
      name: 'Social',
      description: 'Vibrant, eye-catching social media optimized',
      use_case: 'Social media ads, engagement campaigns'
    },
    minimalist: {
      name: 'Minimalist',
      description: 'Clean, elegant, sophisticated design',
      use_case: 'Premium brands, luxury products'
    }
  };

  res.json({
    success: true,
    styles,
    count: Object.keys(styles).length
  });
});

module.exports = router;

