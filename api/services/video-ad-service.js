/**
 * Video Ad Service
 * Phase 2: Generate short-form video ads (15-60s) for TikTok, Reels, Shorts
 *
 * Integrates with MCP Server video generation service
 */

const axios = require('axios');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

class VideoAdService {
  constructor() {
    this.mcpServerUrl = MCP_SERVER_URL;
  }

  /**
   * Generate video ad from product info
   * @param {Object} config - Video generation config
   * @returns {Promise<Object>} Video generation result
   */
  async generateVideoAd(config) {
    const {
      product_info,
      ad_style = "product",
      duration = 15,
      aspect_ratio = "9:16", // TikTok/Reels format
      num_images = 3
    } = config;

    try {
      const response = await axios.post(
        `${this.mcpServerUrl}/mcp/video/generate`,
        {
          product_info,
          ad_style,
          duration,
          aspect_ratio,
          num_images
        },
        {
          timeout: 300000 // 5 minutes for video generation
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Video generation failed');
      }

      return {
        success: true,
        video_path: response.data.video_path,
        duration: response.data.duration,
        aspect_ratio: response.data.aspect_ratio,
        num_images: response.data.num_images,
        generated_images: response.data.generated_images,
        file_size: response.data.file_size,
        method: response.data.method || 'ffmpeg_slideshow'
      };
    } catch (error) {
      console.error('Error generating video ad:', error.message);
      throw error;
    }
  }

  /**
   * Generate video from existing images
   * @param {Object} config - Video generation config
   * @returns {Promise<Object>} Video generation result
   */
  async generateVideoFromImages(config) {
    const {
      image_paths,
      duration = 15,
      fps = 30,
      transition = "fade",
      audio_path = null,
      aspect_ratio = "9:16"
    } = config;

    try {
      const response = await axios.post(
        `${this.mcpServerUrl}/mcp/video/generate_from_images`,
        {
          image_paths,
          duration,
          fps,
          transition,
          audio_path,
          aspect_ratio
        },
        {
          timeout: 300000 // 5 minutes
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Video generation failed');
      }

      return {
        success: true,
        video_path: response.data.video_path,
        duration: response.data.duration,
        fps: response.data.fps,
        aspect_ratio: response.data.aspect_ratio,
        file_size: response.data.file_size,
        method: response.data.method || 'ffmpeg_slideshow'
      };
    } catch (error) {
      console.error('Error generating video from images:', error.message);
      throw error;
    }
  }

  /**
   * Generate multiple video variants for A/B testing
   * @param {Object} config - Video generation config
   * @returns {Promise<Array>} Array of video generation results
   */
  async generateVideoVariants(config) {
    const {
      product_info,
      num_variants = 3,
      ad_styles = ["product", "lifestyle", "social"],
      duration = 15,
      aspect_ratio = "9:16"
    } = config;

    const variants = [];

    for (let i = 0; i < num_variants; i++) {
      const ad_style = ad_styles[i % ad_styles.length];

      try {
        const result = await this.generateVideoAd({
          product_info,
          ad_style,
          duration,
          aspect_ratio,
          num_images: 3
        });

        variants.push({
          variant_id: i + 1,
          ad_style,
          ...result
        });
      } catch (error) {
        console.error(`Error generating variant ${i + 1}:`, error.message);
        // Continue with other variants
      }
    }

    return {
      success: variants.length > 0,
      variants,
      count: variants.length
    };
  }

  /**
   * Get video formats for different platforms
   * @returns {Object} Platform-specific video formats
   */
  getPlatformFormats() {
    return {
      tiktok: {
        aspect_ratio: "9:16",
        duration: { min: 15, max: 60 },
        resolution: "1080x1920",
        fps: 30
      },
      instagram_reels: {
        aspect_ratio: "9:16",
        duration: { min: 15, max: 90 },
        resolution: "1080x1920",
        fps: 30
      },
      youtube_shorts: {
        aspect_ratio: "9:16",
        duration: { min: 15, max: 60 },
        resolution: "1080x1920",
        fps: 30
      },
      facebook_reels: {
        aspect_ratio: "9:16",
        duration: { min: 15, max: 60 },
        resolution: "1080x1920",
        fps: 30
      },
      instagram_square: {
        aspect_ratio: "1:1",
        duration: { min: 3, max: 60 },
        resolution: "1080x1080",
        fps: 30
      },
      youtube_horizontal: {
        aspect_ratio: "16:9",
        duration: { min: 15, max: 60 },
        resolution: "1920x1080",
        fps: 30
      }
    };
  }
}

module.exports = VideoAdService;

