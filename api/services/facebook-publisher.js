/**
 * Facebook Publisher Service
 * Handles posting to Facebook Pages and Instagram
 */

const axios = require('axios');

class FacebookPublisher {
  constructor() {
    this.pages = {
      'sabo-billiards': {
        id: process.env.FACEBOOK_PAGE_ID,
        token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        name: 'SABO Billiards - TP. Vũng Tàu',
        instagram_id: process.env.INSTAGRAM_SABO_BILLIARDS_ID,
      },
      'sabo-arena': {
        id: process.env.FACEBOOK_PAGE_SABO_ARENA_ID,
        token: process.env.FACEBOOK_PAGE_SABO_ARENA_TOKEN,
        name: 'SABO Arena',
      },
      'ai-newbie': {
        id: process.env.FACEBOOK_PAGE_AI_NEWBIE_VN_ID,
        token: process.env.FACEBOOK_PAGE_AI_NEWBIE_VN_TOKEN,
        name: 'AI Newbie VN',
        instagram_id: process.env.INSTAGRAM_AI_NEWBIE_VN_ID,
      },
      'sabo-media': {
        id: process.env.FACEBOOK_PAGE_SABO_MEDIA_ID,
        token: process.env.FACEBOOK_PAGE_SABO_MEDIA_TOKEN,
        name: 'SABO Media',
        instagram_id: process.env.INSTAGRAM_SABO_MEDIA_ID,
      },
    };
    this.graphApiUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Post to Facebook Page
   */
  async postToPage(pageKey, content, options = {}) {
    const page = this.pages[pageKey];
    if (!page) {
      throw new Error(`Unknown page: ${pageKey}`);
    }

    try {
      const endpoint = `${this.graphApiUrl}/${page.id}/feed`;
      const data = {
        message: content,
        access_token: page.token,
      };

      // Add link if provided
      if (options.link) {
        data.link = options.link;
      }

      // Schedule post if time provided
      if (options.scheduledTime) {
        data.published = false;
        data.scheduled_publish_time = Math.floor(new Date(options.scheduledTime).getTime() / 1000);
      }

      const response = await axios.post(endpoint, data);
      
      return {
        success: true,
        postId: response.data.id,
        page: page.name,
        message: options.scheduledTime 
          ? `Scheduled for ${options.scheduledTime}`
          : 'Posted successfully',
      };
    } catch (error) {
      console.error('Facebook post error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Post photo to Facebook Page
   */
  async postPhotoToPage(pageKey, photoUrl, caption) {
    const page = this.pages[pageKey];
    if (!page) {
      throw new Error(`Unknown page: ${pageKey}`);
    }

    try {
      const endpoint = `${this.graphApiUrl}/${page.id}/photos`;
      const data = {
        url: photoUrl,
        caption: caption,
        access_token: page.token,
      };

      const response = await axios.post(endpoint, data);
      
      return {
        success: true,
        postId: response.data.post_id,
        page: page.name,
        message: 'Photo posted successfully',
      };
    } catch (error) {
      console.error('Facebook photo error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Post to Instagram (via Facebook Graph API)
   */
  async postToInstagram(pageKey, imageUrl, caption) {
    const page = this.pages[pageKey];
    if (!page || !page.instagram_id) {
      throw new Error(`Instagram not linked for page: ${pageKey}`);
    }

    try {
      // Step 1: Create media container
      const containerEndpoint = `${this.graphApiUrl}/${page.instagram_id}/media`;
      const containerResponse = await axios.post(containerEndpoint, {
        image_url: imageUrl,
        caption: caption,
        access_token: page.token,
      });

      const containerId = containerResponse.data.id;

      // Step 2: Publish media
      const publishEndpoint = `${this.graphApiUrl}/${page.instagram_id}/media_publish`;
      const publishResponse = await axios.post(publishEndpoint, {
        creation_id: containerId,
        access_token: page.token,
      });

      return {
        success: true,
        postId: publishResponse.data.id,
        platform: 'Instagram',
        message: 'Posted to Instagram successfully',
      };
    } catch (error) {
      console.error('Instagram post error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Schedule multiple posts for a campaign
   */
  async scheduleCampaign(pageKey, posts) {
    const results = [];
    
    for (const post of posts) {
      const result = await this.postToPage(pageKey, post.content, {
        scheduledTime: post.scheduledTime,
        link: post.link,
      });
      results.push({
        ...result,
        scheduledFor: post.scheduledTime,
      });
      
      // Rate limiting - wait 1s between posts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      success: results.every(r => r.success),
      totalPosts: results.length,
      scheduled: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }

  /**
   * Get page insights
   */
  async getPageInsights(pageKey, metrics = ['page_impressions', 'page_engaged_users']) {
    const page = this.pages[pageKey];
    if (!page) {
      throw new Error(`Unknown page: ${pageKey}`);
    }

    try {
      const endpoint = `${this.graphApiUrl}/${page.id}/insights`;
      const response = await axios.get(endpoint, {
        params: {
          metric: metrics.join(','),
          period: 'day',
          access_token: page.token,
        },
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * List available pages
   */
  getAvailablePages() {
    return Object.entries(this.pages).map(([key, page]) => ({
      key,
      name: page.name,
      hasInstagram: !!page.instagram_id,
    }));
  }
}

module.exports = new FacebookPublisher();
