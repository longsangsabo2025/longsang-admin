/**
 * Multi-Platform Deployment Service
 * Phase 3: Deploy campaigns to multiple platforms (Facebook, Google Ads, TikTok)
 */

const { FacebookAdsManager } = require('./facebook-ads-manager');
const GoogleAdsManager = require('./google-ads-manager');
const TikTokAdsManager = require('./tiktok-ads-manager');

class MultiPlatformDeploymentService {
  constructor() {
    this.facebookAds = new FacebookAdsManager();
    this.googleAds = new GoogleAdsManager();
    this.tiktokAds = new TikTokAdsManager();
    this.platforms = {
      facebook: this.facebookAds,
      google: this.googleAds,
      tiktok: this.tiktokAds,
    };
  }

  /**
   * Deploy campaign to multiple platforms
   * @param {Object} config - Deployment configuration
   * @returns {Promise<Object>} Deployment results
   */
  async deployCampaign(config) {
    const {
      campaign_name,
      product_info,
      platforms = ['facebook'], // Default to Facebook only
      budget,
      start_date,
      end_date,
      targeting = {},
      creatives = []
    } = config;

    const results = {
      success: true,
      deployments: [],
      errors: []
    };

    // Deploy to each platform
    for (const platform of platforms) {
      if (!this.platforms[platform]) {
        results.errors.push({
          platform,
          error: `Platform ${platform} not supported`
        });
        continue;
      }

      try {
        let deploymentResult;

        if (platform === 'facebook') {
          deploymentResult = await this.deployToFacebook({
            campaign_name: `${campaign_name} - Facebook`,
            product_info,
            budget,
            start_date,
            end_date,
            targeting,
            creatives
          });
        } else if (platform === 'google') {
          deploymentResult = await this.deployToGoogle({
            campaign_name: `${campaign_name} - Google`,
            product_info,
            budget,
            start_date,
            end_date,
            targeting,
            creatives
          });
        } else if (platform === 'tiktok') {
          deploymentResult = await this.deployToTikTok({
            campaign_name: `${campaign_name} - TikTok`,
            product_info,
            budget,
            start_date,
            end_date,
            targeting,
            creatives
          });
        }

        results.deployments.push({
          platform,
          success: true,
          ...deploymentResult
        });
      } catch (error) {
        results.errors.push({
          platform,
          error: error.message
        });
        results.success = false;
      }
    }

    return results;
  }

  /**
   * Deploy to Facebook
   * @param {Object} config - Facebook deployment config
   * @returns {Promise<Object>} Deployment result
   */
  async deployToFacebook(config) {
    const {
      campaign_name,
      product_info,
      budget,
      start_date,
      end_date,
      targeting,
      creatives
    } = config;

    // Use existing Facebook Ads Manager
    const campaign = await this.facebookAds.createCampaign({
      name: campaign_name,
      objective: 'CONVERSIONS',
      status: 'PAUSED', // Start paused for review
      special_ad_categories: [],
      daily_budget: budget ? budget / 30 : 1000, // Daily budget
    });

    // Create ad set
    const adSet = await this.facebookAds.createAdSet({
      campaign_id: campaign.id,
      name: `${campaign_name} - Ad Set`,
      optimization_goal: 'OFFSITE_CONVERSIONS',
      billing_event: 'IMPRESSIONS',
      bid_amount: 100,
      daily_budget: budget ? budget / 30 : 1000,
      targeting: targeting,
      start_time: start_date,
      end_time: end_date,
    });

    // Create creatives
    const createdCreatives = [];
    for (const creative of creatives) {
      const adCreative = await this.facebookAds.createAdCreative({
        name: `${campaign_name} - Creative ${createdCreatives.length + 1}`,
        page_id: targeting.page_id,
        message: creative.message || product_info.description,
        link: creative.link || product_info.url,
        image_url: creative.image_url,
      });

      // Create ad
      const ad = await this.facebookAds.createAd({
        ad_set_id: adSet.id,
        creative_id: adCreative.id,
        name: `${campaign_name} - Ad ${createdCreatives.length + 1}`,
        status: 'PAUSED',
      });

      createdCreatives.push({
        creative_id: adCreative.id,
        ad_id: ad.id
      });
    }

    return {
      campaign_id: campaign.id,
      ad_set_id: adSet.id,
      creatives: createdCreatives
    };
  }

  /**
   * Deploy to Google Ads
   * @param {Object} config - Google deployment config
   * @returns {Promise<Object>} Deployment result
   */
  async deployToGoogle(config) {
    const {
      campaign_name,
      product_info,
      budget,
      start_date,
      end_date,
      targeting,
      creatives
    } = config;

    // Create Google Ads campaign
    const campaign = await this.googleAds.createCampaign({
      name: campaign_name,
      budget_amount_micros: budget ? budget * 1000000 : 10000000, // Convert to micros
      start_date: start_date ? start_date.replace(/-/g, '') : null,
      end_date: end_date ? end_date.replace(/-/g, '') : null,
      advertising_channel_type: 'SEARCH',
      campaign_type: 'SEARCH',
    });

    // Create ad group
    const adGroup = await this.googleAds.createAdGroup({
      campaign_id: campaign.campaign_id,
      name: `${campaign_name} - Ad Group`,
      cpc_bid_micros: 1000000, // $1 default
      keywords: targeting.keywords || [product_info.name, product_info.category],
    });

    // Create ads
    const createdAds = [];
    for (const creative of creatives) {
      const ad = await this.googleAds.createAd({
        ad_group_id: adGroup.ad_group_id,
        headlines: creative.headlines || [
          product_info.name,
          `Buy ${product_info.name} Now`,
          `Best ${product_info.name} Online`
        ],
        descriptions: creative.descriptions || [
          product_info.description,
          'Free shipping on orders over $50',
          'Limited time offer'
        ],
        final_urls: [creative.link || product_info.url],
        images: creative.images || [],
      });

      createdAds.push({
        ad_id: ad.ad_id
      });
    }

    return {
      campaign_id: campaign.campaign_id,
      ad_group_id: adGroup.ad_group_id,
      ads: createdAds
    };
  }

  /**
   * Deploy to TikTok
   * @param {Object} config - TikTok deployment config
   * @returns {Promise<Object>} Deployment result
   */
  async deployToTikTok(config) {
    const {
      campaign_name,
      product_info,
      budget,
      start_date,
      end_date,
      targeting,
      creatives
    } = config;

    if (!this.tiktokAds.isConfigured()) {
      throw new Error('TikTok Ads credentials not configured');
    }

    // Create TikTok campaign
    const campaign = await this.tiktokAds.createCampaign({
      campaign_name,
      budget_mode: 'BUDGET_MODE_DAY',
      budget: budget ? budget / 30 : 50, // Daily budget
      objective_type: 'CONVERSIONS',
      operation_status: 'ENABLE'
    });

    if (!campaign.success) {
      throw new Error(campaign.error || 'Failed to create TikTok campaign');
    }

    // Create ad group
    const adGroup = await this.tiktokAds.createAdGroup({
      campaign_id: campaign.campaign_id,
      adgroup_name: `${campaign_name} - Ad Group`,
      budget_mode: 'BUDGET_MODE_DAY',
      budget: budget ? budget / 30 : 50,
      optimization_goal: 'CONVERSION',
      audience_type: 'AUDIENCE_TYPE_CUSTOM'
    });

    if (!adGroup.success) {
      throw new Error(adGroup.error || 'Failed to create TikTok ad group');
    }

    // Upload images and create ads
    const createdAds = [];
    for (const creative of creatives) {
      let imageIds = [];

      if (creative.image_url) {
        // Download and upload image
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(__dirname, '../../temp', `tiktok_${Date.now()}.jpg`);

        try {
          // Download image
          const imageResponse = await axios.get(creative.image_url, { responseType: 'stream' });
          const dir = path.dirname(tempPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          const writer = fs.createWriteStream(tempPath);
          imageResponse.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          // Upload to TikTok
          const uploadResult = await this.tiktokAds.uploadImage(tempPath);
          if (uploadResult.success) {
            imageIds.push(uploadResult.image_id);
          }

          // Clean up temp file
          fs.unlinkSync(tempPath);
        } catch (error) {
          console.error('Error uploading image to TikTok:', error);
        }
      }

      // Create ad
      const ad = await this.tiktokAds.createAd({
        adgroup_id: adGroup.adgroup_id,
        ad_name: `${campaign_name} - Ad ${createdAds.length + 1}`,
        ad_text: creative.message || product_info.description,
        image_ids: imageIds,
        call_to_action: 'LEARN_MORE'
      });

      if (ad.success) {
        createdAds.push({
          ad_id: ad.ad_id
        });
      }
    }

    return {
      campaign_id: campaign.campaign_id,
      adgroup_id: adGroup.adgroup_id,
      ads: createdAds
    };
  }

  /**
   * Get unified metrics across platforms
   * @param {Object} config - Metrics configuration
   * @returns {Promise<Object>} Unified metrics
   */
  async getUnifiedMetrics(config) {
    const {
      campaign_ids,
      start_date,
      end_date
    } = config;

    const metrics = {
      total_impressions: 0,
      total_clicks: 0,
      total_spend: 0,
      total_conversions: 0,
      platforms: {}
    };

    // Get Facebook metrics
    if (campaign_ids.facebook) {
      try {
        const fbMetrics = await this.facebookAds.getCampaignInsights(campaign_ids.facebook, {
          start_date,
          end_date
        });

        metrics.platforms.facebook = {
          impressions: fbMetrics.impressions || 0,
          clicks: fbMetrics.clicks || 0,
          spend: fbMetrics.spend || 0,
          conversions: fbMetrics.conversions || 0,
          ctr: fbMetrics.ctr || 0,
          cpc: fbMetrics.cpc || 0,
        };

        metrics.total_impressions += metrics.platforms.facebook.impressions;
        metrics.total_clicks += metrics.platforms.facebook.clicks;
        metrics.total_spend += metrics.platforms.facebook.spend;
        metrics.total_conversions += metrics.platforms.facebook.conversions;
      } catch (error) {
        console.error('Error getting Facebook metrics:', error);
      }
    }

    // Get Google Ads metrics
    if (campaign_ids.google) {
      try {
        const googleMetrics = await this.googleAds.getCampaignMetrics(
          campaign_ids.google,
          start_date,
          end_date
        );

        const aggregated = googleMetrics.metrics.reduce((acc, m) => ({
          impressions: acc.impressions + m.impressions,
          clicks: acc.clicks + m.clicks,
          spend: acc.spend + (m.cost_micros / 1000000),
          conversions: acc.conversions + m.conversions,
        }), { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

        metrics.platforms.google = {
          impressions: aggregated.impressions,
          clicks: aggregated.clicks,
          spend: aggregated.spend,
          conversions: aggregated.conversions,
          ctr: aggregated.clicks / aggregated.impressions || 0,
          cpc: aggregated.spend / aggregated.clicks || 0,
        };

        metrics.total_impressions += metrics.platforms.google.impressions;
        metrics.total_clicks += metrics.platforms.google.clicks;
        metrics.total_spend += metrics.platforms.google.spend;
        metrics.total_conversions += metrics.platforms.google.conversions;
      } catch (error) {
        console.error('Error getting Google Ads metrics:', error);
      }
    }

    // Get TikTok metrics
    if (campaign_ids.tiktok) {
      try {
        const tiktokMetrics = await this.tiktokAds.getCampaignInsights(campaign_ids.tiktok, {
          start_date,
          end_date
        });

        metrics.platforms.tiktok = {
          impressions: tiktokMetrics.impressions || 0,
          clicks: tiktokMetrics.clicks || 0,
          spend: tiktokMetrics.spend || 0,
          conversions: tiktokMetrics.conversions || 0,
          ctr: tiktokMetrics.ctr || 0,
          cpc: tiktokMetrics.cpc || 0,
        };

        metrics.total_impressions += metrics.platforms.tiktok.impressions;
        metrics.total_clicks += metrics.platforms.tiktok.clicks;
        metrics.total_spend += metrics.platforms.tiktok.spend;
        metrics.total_conversions += metrics.platforms.tiktok.conversions;
      } catch (error) {
        console.error('Error getting TikTok metrics:', error);
      }
    }

    // Calculate overall metrics
    metrics.overall_ctr = metrics.total_clicks / metrics.total_impressions || 0;
    metrics.overall_cpc = metrics.total_spend / metrics.total_clicks || 0;
    metrics.overall_cpa = metrics.total_spend / metrics.total_conversions || 0;

    return metrics;
  }

  /**
   * Get supported platforms
   * @returns {Array} List of supported platforms
   */
  getSupportedPlatforms() {
    return Object.keys(this.platforms).filter(
      platform => this.platforms[platform] !== null
    );
  }
}

module.exports = MultiPlatformDeploymentService;

