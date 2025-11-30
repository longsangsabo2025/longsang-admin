/**
 * Ad Creative Service
 * Integrates AI image generation (Google Imagen) with Facebook Ads creative creation
 *
 * Phase 1: Enhance existing Facebook Ads Manager with AI-generated creatives
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// MCP Server HTTP API endpoint (Python server on port 3003)
// Note: MCP protocol runs on 3002, HTTP REST API runs on 3003
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

class AdCreativeService {
  constructor(facebookAdsManager) {
    this.facebookAdsManager = facebookAdsManager;
  }

  /**
   * Generate ad image using Google Imagen via MCP Server
   * @param {Object} config - Image generation config
   * @returns {Promise<Object>} Generated image info
   */
  async generateAdImage(config) {
    const {
      prompt,
      aspect_ratio = "16:9", // Default for Facebook feed ads
      ad_style = "product", // product, lifestyle, testimonial, social, minimalist
      style = null
    } = config;

    try {
      // Call MCP Server to generate image
      const response = await axios.post(`${MCP_SERVER_URL}/mcp/google/generate_image`, {
        prompt,
        aspect_ratio,
        ad_style,
        style
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Image generation failed');
      }

      return {
        success: true,
        image_path: response.data.image_path,
        full_prompt: response.data.full_prompt,
        aspect_ratio: response.data.aspect_ratio,
        ad_style: response.data.ad_style,
        model: response.data.model,
        provider: response.data.provider
      };
    } catch (error) {
      console.error('Error generating ad image:', error);
      throw new Error(`Failed to generate ad image: ${error.message}`);
    }
  }

  /**
   * Upload image to Facebook and get URL
   * @param {String} imagePath - Local path to image
   * @returns {Promise<String>} Facebook image URL
   */
  async uploadImageToFacebook(imagePath) {
    try {
      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      // Upload to Facebook (using Facebook Ads Manager's upload method if available)
      // For now, we'll use a simple approach - in production, use Facebook's upload API
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      // Note: This is a placeholder - actual implementation should use Facebook's upload API
      // or store image in a CDN and return public URL
      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${this.facebookAdsManager.adAccount.id}/adimages`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.facebookAdsManager.accessToken}`
          }
        }
      );

      return response.data.images ? response.data.images.hash : null;
    } catch (error) {
      console.error('Error uploading image to Facebook:', error);
      // Fallback: return local path or CDN URL
      return imagePath;
    }
  }

  /**
   * Generate multiple creative variants for A/B testing
   * @param {Object} productInfo - Product information
   * @param {Number} numVariants - Number of variants to generate
   * @returns {Promise<Array>} Array of creative variants
   */
  async generateCreativeVariants(productInfo, numVariants = 3) {
    const {
      name,
      description,
      category,
      target_audience
    } = productInfo;

    const variants = [];
    const adStyles = ['product', 'lifestyle', 'social']; // Different styles for variants

    for (let i = 0; i < numVariants; i++) {
      const adStyle = adStyles[i % adStyles.length];

      // Generate prompt based on product info
      const prompt = this.generatePrompt(productInfo, adStyle);

      try {
        // Generate image
        const imageResult = await this.generateAdImage({
          prompt,
          aspect_ratio: "16:9", // Facebook feed format
          ad_style: adStyle
        });

        variants.push({
          variant_id: i + 1,
          ad_style: adStyle,
          prompt: prompt,
          image_path: imageResult.image_path,
          full_prompt: imageResult.full_prompt,
          model: imageResult.model,
          provider: imageResult.provider
        });
      } catch (error) {
        console.error(`Error generating variant ${i + 1}:`, error);
        // Continue with other variants
      }
    }

    return variants;
  }

  /**
   * Generate prompt for product image
   * @param {Object} productInfo - Product information
   * @param {String} adStyle - Ad style preset
   * @returns {String} Generated prompt
   */
  generatePrompt(productInfo, adStyle) {
    const { name, description, category } = productInfo;

    const prompts = {
      product: `Professional product photo of ${name}. ${description || ''}. Clean white background, studio lighting, high quality commercial photography.`,
      lifestyle: `${name} being used in a natural, real-world setting. ${description || ''}. Authentic lifestyle photography, warm natural lighting, relatable scene.`,
      social: `Eye-catching social media image featuring ${name}. ${description || ''}. Vibrant colors, modern aesthetic, bold design, engaging composition.`,
      testimonial: `Friendly portrait of a satisfied customer with ${name}. Professional but approachable, trustworthy expression, natural lighting.`,
      minimalist: `Minimalist design featuring ${name}. ${description || ''}. Clean lines, simple composition, elegant and sophisticated.`
    };

    return prompts[adStyle] || prompts.product;
  }

  /**
   * Create Facebook ad creative with AI-generated image
   * @param {Object} config - Creative configuration
   * @returns {Promise<Object>} Created creative
   */
  async createAICreative(config) {
    const {
      name,
      page_id,
      message,
      link,
      product_info,
      ad_style = "product",
      aspect_ratio = "16:9",
      generate_image = true
    } = config;

    try {
      let image_url = config.image_url;

      // Generate image if not provided
      if (generate_image && !image_url && product_info) {
        const prompt = this.generatePrompt(product_info, ad_style);

        const imageResult = await this.generateAdImage({
          prompt,
          aspect_ratio,
          ad_style
        });

        // Upload to Facebook or get public URL
        image_url = await this.uploadImageToFacebook(imageResult.image_path);
      }

      if (!image_url) {
        throw new Error('Image URL is required');
      }

      // Create creative using Facebook Ads Manager
      const creative = await this.facebookAdsManager.createAdCreative({
        name: name || `AI Creative - ${product_info?.name || 'Ad'}`,
        page_id,
        message,
        link,
        image_url,
        call_to_action_type: config.call_to_action_type || 'LEARN_MORE'
      });

      return {
        success: true,
        creative,
        image_generated: generate_image,
        ad_style,
        aspect_ratio
      };
    } catch (error) {
      console.error('Error creating AI creative:', error);
      throw error;
    }
  }

  /**
   * Create complete campaign with AI-generated creatives
   * @param {Object} campaignConfig - Full campaign configuration
   * @returns {Promise<Object>} Created campaign with creatives
   */
  async createCampaignWithAICreatives(campaignConfig) {
    const {
      campaign_name,
      objective = 'CONVERSIONS',
      budget,
      page_id,
      product_info,
      num_creatives = 3
    } = campaignConfig;

    try {
      // Generate multiple creative variants
      const variants = await this.generateCreativeVariants(product_info, num_creatives);

      // Create creatives in Facebook
      const creatives = [];
      for (const variant of variants) {
        try {
          const creative = await this.createAICreative({
            name: `${campaign_name} - Variant ${variant.variant_id}`,
            page_id,
            message: campaignConfig.message || product_info.description,
            link: campaignConfig.link,
            product_info,
            ad_style: variant.ad_style,
            generate_image: false, // Already generated
            image_url: variant.image_path // Use generated image
          });

          creatives.push({
            ...creative,
            variant_info: variant
          });
        } catch (error) {
          console.error(`Error creating creative variant ${variant.variant_id}:`, error);
        }
      }

      // Build complete campaign (using existing Facebook Ads Manager method)
      const campaign = await this.facebookAdsManager.buildCompleteCampaign({
        campaign_name,
        objective,
        budget,
        page_id,
        creatives: creatives.map(c => c.creative)
      });

      return {
        success: true,
        campaign,
        creatives,
        variants_generated: variants.length
      };
    } catch (error) {
      console.error('Error creating campaign with AI creatives:', error);
      throw error;
    }
  }
}

module.exports = AdCreativeService;

