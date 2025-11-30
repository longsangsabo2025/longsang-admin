/**
 * TikTok Ads Manager Service
 * Phase 3: TikTok Ads API integration (community SDK)
 *
 * TikTok Marketing API Documentation:
 * https://ads.tiktok.com/marketing_api/docs
 */

const axios = require('axios');

class TikTokAdsManager {
  constructor(accessToken, advertiserId) {
    this.accessToken = accessToken || process.env.TIKTOK_ACCESS_TOKEN;
    this.advertiserId = advertiserId || process.env.TIKTOK_ADVERTISER_ID;
    this.apiBase = 'https://business-api.tiktok.com/open_api/v1.3';
  }

  /**
   * Create a TikTok campaign
   * @param {Object} config - Campaign configuration
   * @returns {Promise<Object>} Created campaign
   */
  async createCampaign(config) {
    const {
      campaign_name,
      budget_mode = 'BUDGET_MODE_DAY', // BUDGET_MODE_DAY, BUDGET_MODE_TOTAL
      budget = 100,
      objective_type = 'CONVERSIONS', // TRAFFIC, CONVERSIONS, APP_INSTALL, etc.
      operation_status = 'ENABLE'
    } = config;

    try {
      const response = await axios.post(
        `${this.apiBase}/campaign/create/`,
        {
          advertiser_id: this.advertiserId,
          campaign_name,
          budget_mode,
          budget,
          objective_type,
          operation_status
        },
        {
          headers: {
            'Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'TikTok campaign creation failed');
      }

      return {
        success: true,
        campaign_id: response.data.data.campaign_id,
        campaign: response.data.data
      };
    } catch (error) {
      console.error('TikTok campaign creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create TikTok campaign'
      };
    }
  }

  /**
   * Create a TikTok ad group
   * @param {Object} config - Ad group configuration
   * @returns {Promise<Object>} Created ad group
   */
  async createAdGroup(config) {
    const {
      campaign_id,
      adgroup_name,
      placement_type = ['AUTOMATIC'], // AUTOMATIC, PANGLE, TIKTOK
      budget_mode = 'BUDGET_MODE_DAY',
      budget = 50,
      bid_type = 'BID_TYPE_NO_BID', // BID_TYPE_NO_BID, BID_TYPE_CUSTOM
      optimization_goal = 'CONVERSION', // CONVERSION, CLICK, IMPRESSION
      audience_type = 'AUDIENCE_TYPE_CUSTOM'
    } = config;

    try {
      const response = await axios.post(
        `${this.apiBase}/adgroup/create/`,
        {
          advertiser_id: this.advertiserId,
          campaign_id,
          adgroup_name,
          placement_type,
          budget_mode,
          budget,
          bid_type,
          optimization_goal,
          audience_type
        },
        {
          headers: {
            'Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'TikTok ad group creation failed');
      }

      return {
        success: true,
        adgroup_id: response.data.data.adgroup_id,
        adgroup: response.data.data
      };
    } catch (error) {
      console.error('TikTok ad group creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create TikTok ad group'
      };
    }
  }

  /**
   * Create a TikTok ad
   * @param {Object} config - Ad configuration
   * @returns {Promise<Object>} Created ad
   */
  async createAd(config) {
    const {
      adgroup_id,
      ad_name,
      creative_material_mode = 'CUSTOM', // CUSTOM, PROGRAMMATIC
      ad_text,
      image_ids = [],
      video_ids = [],
      call_to_action = 'LEARN_MORE'
    } = config;

    try {
      const response = await axios.post(
        `${this.apiBase}/ad/create/`,
        {
          advertiser_id: this.advertiserId,
          adgroup_id,
          ad_name,
          creative_material_mode,
          ad_text,
          image_ids,
          video_ids,
          call_to_action
        },
        {
          headers: {
            'Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'TikTok ad creation failed');
      }

      return {
        success: true,
        ad_id: response.data.data.ad_id,
        ad: response.data.data
      };
    } catch (error) {
      console.error('TikTok ad creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create TikTok ad'
      };
    }
  }

  /**
   * Upload image to TikTok
   * @param {String} imagePath - Local image path
   * @returns {Promise<Object>} Uploaded image info
   */
  async uploadImage(imagePath) {
    const fs = require('fs');
    const FormData = require('form-data');

    try {
      const form = new FormData();
      form.append('advertiser_id', this.advertiserId);
      form.append('upload_type', 'UPLOAD_BY_FILE');
      form.append('image_file', fs.createReadStream(imagePath));

      const response = await axios.post(
        `${this.apiBase}/file/image/ad/upload/`,
        form,
        {
          headers: {
            'Access-Token': this.accessToken,
            ...form.getHeaders()
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'TikTok image upload failed');
      }

      return {
        success: true,
        image_id: response.data.data.image_id,
        image_url: response.data.data.image_url
      };
    } catch (error) {
      console.error('TikTok image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image to TikTok'
      };
    }
  }

  /**
   * Get campaign insights
   * @param {String} campaignId - Campaign ID
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>} Campaign insights
   */
  async getCampaignInsights(campaignId, dateRange = {}) {
    const {
      start_date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date = new Date().toISOString().split('T')[0]
    } = dateRange;

    try {
      const response = await axios.get(
        `${this.apiBase}/reports/integrated/get/`,
        {
          params: {
            advertiser_id: this.advertiserId,
            campaign_ids: JSON.stringify([campaignId]),
            start_date,
            end_date,
            metrics: JSON.stringify([
              'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions', 'cpa'
            ])
          },
          headers: {
            'Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to get TikTok insights');
      }

      const data = response.data.data.list[0] || {};

      return {
        impressions: parseInt(data.impressions || 0),
        clicks: parseInt(data.clicks || 0),
        spend: parseFloat(data.spend || 0),
        conversions: parseInt(data.conversions || 0),
        ctr: parseFloat(data.ctr || 0),
        cpc: parseFloat(data.cpc || 0),
        cpa: parseFloat(data.cpa || 0)
      };
    } catch (error) {
      console.error('TikTok insights error:', error);
      return {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0
      };
    }
  }

  /**
   * Check if TikTok credentials are configured
   * @returns {Boolean}
   */
  isConfigured() {
    return !!(this.accessToken && this.advertiserId);
  }
}

module.exports = TikTokAdsManager;

