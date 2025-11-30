/**
 * Facebook Marketing API Routes
 * Quản lý quảng cáo, pages, insights và automation
 * 
 * @author LongSang Admin
 * @version 3.0.0 - Foundation for Multi-Page Advertising
 */

const express = require('express');
const router = express.Router();

// Import Facebook Ads Manager Foundation
const { 
  FacebookAdsManager, 
  PAGE_REGISTRY, 
  AD_ACCOUNTS,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TEMPLATES,
  AUDIENCE_TEMPLATES,
  FB_API_VERSION 
} = require('../services/facebook-ads-manager');

// ============================================================
// FOUNDATION ENDPOINTS
// ============================================================

/**
 * @route GET /api/facebook/foundation
 * @desc Get all foundation configuration (pages, templates, objectives)
 */
router.get('/foundation', (req, res) => {
  res.json({
    success: true,
    apiVersion: FB_API_VERSION,
    pages: Object.entries(PAGE_REGISTRY).map(([key, page]) => ({
      key,
      id: page.id,
      name: page.name,
      category: page.category,
      hasInstagram: !!page.instagram,
      instagram: page.instagram?.username
    })),
    adAccounts: {
      production: { id: AD_ACCOUNTS.production.id, name: AD_ACCOUNTS.production.name },
      sandbox: { id: AD_ACCOUNTS.sandbox.id, name: AD_ACCOUNTS.sandbox.name, isFree: true }
    },
    objectives: CAMPAIGN_OBJECTIVES,
    campaignTemplates: Object.keys(CAMPAIGN_TEMPLATES),
    audienceTemplates: Object.keys(AUDIENCE_TEMPLATES)
  });
});

/**
 * @route GET /api/facebook/pages/all
 * @desc Get all configured pages with details
 */
router.get('/pages/all', (req, res) => {
  const manager = new FacebookAdsManager();
  res.json({
    success: true,
    pages: manager.getAllPages(),
    totalPages: Object.keys(PAGE_REGISTRY).length
  });
});

/**
 * @route GET /api/facebook/templates/campaigns
 * @desc Get all campaign templates
 */
router.get('/templates/campaigns', (req, res) => {
  res.json({
    success: true,
    templates: Object.entries(CAMPAIGN_TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      objective: template.objective,
      optimization_goal: template.optimization_goal,
      daily_budget_min: template.daily_budget_min,
      recommended_duration: template.recommended_duration
    }))
  });
});

/**
 * @route GET /api/facebook/templates/audiences
 * @desc Get all audience templates
 */
router.get('/templates/audiences', (req, res) => {
  res.json({
    success: true,
    templates: Object.entries(AUDIENCE_TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      targeting_summary: {
        locations: template.targeting.geo_locations,
        age_range: `${template.targeting.age_min || 18}-${template.targeting.age_max || 65}`,
        interests: template.targeting.interests?.map(i => i.name) || [],
        behaviors: template.targeting.behaviors?.map(b => b.name) || []
      }
    }))
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * @route GET /api/facebook/health
 * @desc Check Facebook API connection status (both Production & Sandbox)
 */
router.get('/health', async (req, res) => {
  try {
    const prodConfig = getFBConfig(false);
    const sandboxConfig = getFBConfig(true);
    
    const result = {
      status: 'ok',
      apiVersion: 'v24.0',
      timestamp: new Date().toISOString(),
      accounts: {}
    };
    
    // Check Production Account
    if (prodConfig.accessToken) {
      try {
        const prodResult = await fbApiRequest('/me', 'GET', { fields: 'id,name' }, false);
        result.accounts.production = {
          status: prodResult.error ? 'error' : 'connected',
          pageId: prodConfig.pageId,
          adAccountId: prodConfig.adAccountId,
          ...(prodResult.error ? { error: prodResult.error.message } : { page: prodResult })
        };
      } catch (e) {
        result.accounts.production = { status: 'error', error: e.message };
      }
    } else {
      result.accounts.production = { status: 'not_configured' };
    }
    
    // Check Sandbox Account
    if (sandboxConfig.accessToken && sandboxConfig.adAccountId) {
      try {
        const sandboxResult = await fbApiRequest(
          `/act_${sandboxConfig.adAccountId}`, 
          'GET', 
          { fields: 'id,name,account_status,currency' }, 
          true
        );
        result.accounts.sandbox = {
          status: sandboxResult.error ? 'error' : 'connected',
          adAccountId: sandboxConfig.adAccountId,
          isFree: true,
          note: 'Use sandbox=true parameter for testing (FREE)',
          ...(sandboxResult.error ? { error: sandboxResult.error.message } : { account: sandboxResult })
        };
      } catch (e) {
        result.accounts.sandbox = { status: 'error', error: e.message };
      }
    } else {
      result.accounts.sandbox = { status: 'not_configured' };
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================
// PAGE MANAGEMENT
// ============================================================

/**
 * @route GET /api/facebook/pages
 * @desc Get list of managed Facebook Pages
 */
router.get('/pages', async (req, res) => {
  try {
    const result = await fbApiRequest('/me/accounts', 'GET', {
      fields: 'id,name,category,access_token,fan_count,followers_count'
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      pages: result.data || [],
      count: result.data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/facebook/pages/:pageId/insights
 * @desc Get Page insights/analytics
 */
router.get('/pages/:pageId/insights', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { period = 'day', since, until } = req.query;
    
    const metrics = [
      'page_impressions',
      'page_engaged_users',
      'page_post_engagements',
      'page_fans',
      'page_views_total',
      'page_actions_post_reactions_total'
    ].join(',');
    
    const result = await fbApiRequest(`/${pageId}/insights`, 'GET', {
      metric: metrics,
      period,
      since,
      until
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      insights: result.data || [],
      pageId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/facebook/pages/:pageId/post
 * @desc Create a post on Facebook Page
 */
router.post('/pages/:pageId/post', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { message, link, published = true, scheduled_publish_time } = req.body;
    
    if (!message && !link) {
      return res.status(400).json({ error: 'Message or link is required' });
    }
    
    const postData = { message };
    if (link) postData.link = link;
    if (!published) postData.published = false;
    if (scheduled_publish_time) postData.scheduled_publish_time = scheduled_publish_time;
    
    const result = await fbApiRequest(`/${pageId}/feed`, 'POST', postData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      postId: result.id,
      message: 'Post created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ADS MANAGEMENT (Supports both Production & Sandbox)
// Add ?sandbox=true to use Sandbox account (FREE testing)
// ============================================================

/**
 * @route GET /api/facebook/ads/account
 * @desc Get Ad Account info (add ?sandbox=true for testing)
 */
router.get('/ads/account', async (req, res) => {
  try {
    const useSandbox = req.query.sandbox === 'true';
    const config = getFBConfig(useSandbox);
    
    if (!config.adAccountId) {
      return res.status(400).json({
        error: `${useSandbox ? 'Sandbox' : 'Production'} Ad Account not configured`,
        requiredEnvVar: useSandbox ? 'FACEBOOK_SANDBOX_AD_ACCOUNT_ID' : 'FACEBOOK_AD_ACCOUNT_ID'
      });
    }
    
    const result = await fbApiRequest(`/act_${config.adAccountId}`, 'GET', {
      fields: 'id,name,account_status,amount_spent,balance,currency,business_name,timezone_name'
    }, useSandbox);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      mode: useSandbox ? 'sandbox' : 'production',
      isFree: useSandbox,
      account: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/facebook/ads/campaigns
 * @desc Get list of ad campaigns (add ?sandbox=true for testing)
 */
router.get('/ads/campaigns', async (req, res) => {
  try {
    const useSandbox = req.query.sandbox === 'true';
    const config = getFBConfig(useSandbox);
    const { status } = req.query;
    
    if (!config.adAccountId) {
      return res.status(400).json({ error: 'Ad Account not configured' });
    }
    
    const params = {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time'
    };
    
    if (status) params.status = status;
    
    const result = await fbApiRequest(`/act_${config.adAccountId}/campaigns`, 'GET', params, useSandbox);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      mode: useSandbox ? 'sandbox' : 'production',
      campaigns: result.data || [],
      count: result.data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/facebook/ads/campaigns
 * @desc Create a new ad campaign (add sandbox=true in body for FREE testing)
 * 
 * Objectives (API v24.0):
 * - OUTCOME_AWARENESS: Brand awareness
 * - OUTCOME_ENGAGEMENT: Engagement
 * - OUTCOME_LEADS: Lead generation
 * - OUTCOME_SALES: Conversions
 * - OUTCOME_TRAFFIC: Traffic
 * - OUTCOME_APP_PROMOTION: App installs
 */
router.post('/ads/campaigns', async (req, res) => {
  try {
    const { 
      name, 
      objective = 'OUTCOME_AWARENESS',
      status = 'PAUSED',  // Default to PAUSED so no charges
      daily_budget,
      lifetime_budget,
      special_ad_categories = [],
      sandbox = false  // Set to true for FREE testing
    } = req.body;
    
    const useSandbox = sandbox === true || sandbox === 'true';
    const config = getFBConfig(useSandbox);
    
    if (!config.adAccountId) {
      return res.status(400).json({ 
        error: `${useSandbox ? 'Sandbox' : 'Production'} Ad Account not configured` 
      });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }
    
    const campaignData = {
      name,
      objective,
      status,
      special_ad_categories: JSON.stringify(special_ad_categories)
    };
    
    if (daily_budget) campaignData.daily_budget = daily_budget;
    if (lifetime_budget) campaignData.lifetime_budget = lifetime_budget;
    
    const result = await fbApiRequest(`/act_${config.adAccountId}/campaigns`, 'POST', campaignData, useSandbox);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message, details: result.error });
    }
    
    res.json({
      success: true,
      mode: useSandbox ? 'sandbox' : 'production',
      isFree: useSandbox,
      campaignId: result.id,
      message: `Campaign created successfully in ${useSandbox ? 'SANDBOX (FREE)' : 'PRODUCTION'} mode`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/facebook/ads/insights
 * @desc Get ads performance insights
 */
router.get('/ads/insights', async (req, res) => {
  try {
    const useSandbox = req.query.sandbox === 'true';
    const config = getFBConfig(useSandbox);
    const { 
      level = 'account',
      date_preset = 'last_7d',
      time_increment = 1
    } = req.query;
    
    if (!config.adAccountId) {
      return res.status(400).json({ error: 'Ad Account not configured' });
    }
    
    const fields = [
      'impressions',
      'clicks',
      'ctr',
      'cpc',
      'cpm',
      'spend',
      'reach',
      'frequency',
      'actions',
      'cost_per_action_type'
    ].join(',');
    
    const result = await fbApiRequest(`/act_${config.adAccountId}/insights`, 'GET', {
      fields,
      level,
      date_preset,
      time_increment
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      insights: result.data || [],
      summary: result.data?.[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// AUDIENCE MANAGEMENT
// ============================================================

/**
 * @route GET /api/facebook/audiences
 * @desc Get custom audiences
 */
router.get('/audiences', async (req, res) => {
  try {
    const config = getFBConfig();
    
    if (!config.adAccountId) {
      return res.status(400).json({ error: 'Ad Account not configured' });
    }
    
    const result = await fbApiRequest(`/act_${config.adAccountId}/customaudiences`, 'GET', {
      fields: 'id,name,description,subtype,approximate_count,delivery_status'
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      audiences: result.data || [],
      count: result.data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/facebook/audiences
 * @desc Create custom audience
 */
router.post('/audiences', async (req, res) => {
  try {
    const config = getFBConfig();
    const { name, description, subtype = 'CUSTOM' } = req.body;
    
    if (!config.adAccountId) {
      return res.status(400).json({ error: 'Ad Account not configured' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Audience name is required' });
    }
    
    const result = await fbApiRequest(`/act_${config.adAccountId}/customaudiences`, 'POST', {
      name,
      description,
      subtype
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      audienceId: result.id,
      message: 'Audience created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CONVERSIONS API (Server-side tracking)
// ============================================================

/**
 * @route POST /api/facebook/conversions
 * @desc Send conversion event (Server-side tracking)
 */
router.post('/conversions', async (req, res) => {
  try {
    const config = getFBConfig();
    const { event_name, event_time, user_data, custom_data, event_source_url } = req.body;
    
    if (!config.pageId) {
      return res.status(400).json({ error: 'Pixel ID not configured' });
    }
    
    if (!event_name || !user_data) {
      return res.status(400).json({ error: 'event_name and user_data are required' });
    }
    
    const eventData = {
      data: [{
        event_name,
        event_time: event_time || Math.floor(Date.now() / 1000),
        user_data,
        custom_data,
        event_source_url,
        action_source: 'website'
      }]
    };
    
    const pixelId = process.env.FACEBOOK_PIXEL_ID || config.pageId;
    const result = await fbApiRequest(`/${pixelId}/events`, 'POST', eventData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      events_received: result.events_received,
      message: 'Conversion event sent successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CONTENT PUBLISHING
// ============================================================

/**
 * @route POST /api/facebook/publish/photo
 * @desc Publish photo to Page
 */
router.post('/publish/photo', async (req, res) => {
  try {
    const config = getFBConfig();
    const { url, caption, published = true, pageId } = req.body;
    
    const targetPageId = pageId || config.pageId;
    
    if (!targetPageId) {
      return res.status(400).json({ error: 'Page ID not configured' });
    }
    
    if (!url) {
      return res.status(400).json({ error: 'Photo URL is required' });
    }
    
    const result = await fbApiRequest(`/${targetPageId}/photos`, 'POST', {
      url,
      caption,
      published
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      photoId: result.id,
      postId: result.post_id,
      message: 'Photo published successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/facebook/publish/video
 * @desc Publish video to Page (URL method)
 */
router.post('/publish/video', async (req, res) => {
  try {
    const config = getFBConfig();
    const { file_url, title, description, published = true, pageId } = req.body;
    
    const targetPageId = pageId || config.pageId;
    
    if (!targetPageId) {
      return res.status(400).json({ error: 'Page ID not configured' });
    }
    
    if (!file_url) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    
    const result = await fbApiRequest(`/${targetPageId}/videos`, 'POST', {
      file_url,
      title,
      description,
      published
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      videoId: result.id,
      message: 'Video published successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SCHEDULING & AUTOMATION
// ============================================================

/**
 * @route GET /api/facebook/scheduled
 * @desc Get scheduled posts
 */
router.get('/scheduled', async (req, res) => {
  try {
    const config = getFBConfig();
    const { pageId } = req.query;
    
    const targetPageId = pageId || config.pageId;
    
    if (!targetPageId) {
      return res.status(400).json({ error: 'Page ID not configured' });
    }
    
    const result = await fbApiRequest(`/${targetPageId}/scheduled_posts`, 'GET', {
      fields: 'id,message,created_time,scheduled_publish_time,status_type'
    });
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      posts: result.data || [],
      count: result.data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/facebook/schedule
 * @desc Schedule a post for future publishing
 */
router.post('/schedule', async (req, res) => {
  try {
    const config = getFBConfig();
    const { message, link, scheduled_publish_time, pageId } = req.body;
    
    const targetPageId = pageId || config.pageId;
    
    if (!targetPageId) {
      return res.status(400).json({ error: 'Page ID not configured' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!scheduled_publish_time) {
      return res.status(400).json({ error: 'Scheduled publish time is required' });
    }
    
    // Validate time is in the future (min 10 mins, max 6 months)
    const scheduleTime = new Date(scheduled_publish_time * 1000);
    const now = new Date();
    const minTime = new Date(now.getTime() + 10 * 60 * 1000);
    const maxTime = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
    
    if (scheduleTime < minTime || scheduleTime > maxTime) {
      return res.status(400).json({
        error: 'Schedule time must be between 10 minutes and 6 months from now'
      });
    }
    
    const postData = {
      message,
      published: false,
      scheduled_publish_time
    };
    
    if (link) postData.link = link;
    
    const result = await fbApiRequest(`/${targetPageId}/feed`, 'POST', postData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    
    res.json({
      success: true,
      postId: result.id,
      scheduledTime: scheduleTime.toISOString(),
      message: 'Post scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// QUICK CAMPAIGN BUILDER (Multi-Page Support)
// ============================================================

/**
 * @route POST /api/facebook/quick-campaign
 * @desc Build complete campaign for any page (Campaign + AdSet + Creative + Ad)
 * 
 * @body {
 *   pageKey: 'sabo_billiards' | 'sabo_arena' | 'ai_newbie_vn' | etc,
 *   templateKey: 'brand_awareness' | 'traffic_website' | 'engagement_post' | etc,
 *   audienceTemplateKey: 'billiards' | 'technology' | 'ecommerce' | 'art' (optional),
 *   campaignName: string (optional),
 *   message: string (optional),
 *   link: string (optional),
 *   imageUrl: string (optional),
 *   dailyBudget: number (optional, in VND),
 *   callToAction: 'LEARN_MORE' | 'SHOP_NOW' | 'CONTACT_US' | etc,
 *   sandbox: boolean (true for FREE testing)
 * }
 */
router.post('/quick-campaign', async (req, res) => {
  try {
    const {
      pageKey,
      templateKey = 'brand_awareness',
      audienceTemplateKey,
      campaignName,
      message,
      link,
      imageUrl,
      dailyBudget,
      callToAction = 'LEARN_MORE',
      sandbox = true // Default to sandbox for safety
    } = req.body;

    if (!pageKey) {
      return res.status(400).json({ 
        error: 'pageKey is required',
        availablePages: Object.keys(PAGE_REGISTRY)
      });
    }

    if (!PAGE_REGISTRY[pageKey]) {
      return res.status(400).json({ 
        error: `Invalid pageKey: ${pageKey}`,
        availablePages: Object.keys(PAGE_REGISTRY)
      });
    }

    const manager = new FacebookAdsManager(sandbox);
    
    const result = await manager.buildQuickCampaign({
      pageKey,
      templateKey,
      audienceTemplateKey,
      campaignName,
      message,
      link,
      imageUrl,
      dailyBudget,
      callToAction
    });

    if (result.errors && result.errors.length > 0) {
      return res.status(400).json({
        success: false,
        mode: sandbox ? 'sandbox' : 'production',
        errors: result.errors,
        completedSteps: result.steps
      });
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/facebook/page/:pageKey/insights
 * @desc Get insights for a specific page
 */
router.get('/page/:pageKey/insights', async (req, res) => {
  try {
    const { pageKey } = req.params;
    const { period = 'day' } = req.query;

    if (!PAGE_REGISTRY[pageKey]) {
      return res.status(400).json({ 
        error: `Invalid pageKey: ${pageKey}`,
        availablePages: Object.keys(PAGE_REGISTRY)
      });
    }

    const manager = new FacebookAdsManager();
    const result = await manager.getPageInsights(pageKey, [
      'page_impressions',
      'page_engaged_users', 
      'page_fans',
      'page_views_total'
    ], period);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      pageKey,
      pageName: PAGE_REGISTRY[pageKey].name,
      insights: result.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/facebook/campaigns/all
 * @desc Get all campaigns from ad account
 */
router.get('/campaigns/all', async (req, res) => {
  try {
    const { sandbox = 'true', status } = req.query;
    const useSandbox = sandbox === 'true';
    
    const manager = new FacebookAdsManager(useSandbox);
    const result = await manager.getCampaigns(status);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      mode: useSandbox ? 'sandbox' : 'production',
      campaigns: result.data || [],
      count: result.data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/facebook/account/insights
 * @desc Get ad account performance insights
 */
router.get('/account/insights', async (req, res) => {
  try {
    const { sandbox = 'true', date_preset = 'last_7d' } = req.query;
    const useSandbox = sandbox === 'true';
    
    const manager = new FacebookAdsManager(useSandbox);
    const result = await manager.getAccountInsights(date_preset);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      success: true,
      mode: useSandbox ? 'sandbox' : 'production',
      datePreset: date_preset,
      insights: result.data?.[0] || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SABO BILLIARDS - TOURNAMENT CAMPAIGNS
// ============================================================

/**
 * @route GET /api/facebook/sabo-billiards/tournament-templates
 * @desc Lấy danh sách templates giải đấu có sẵn
 */
router.get('/sabo-billiards/tournament-templates', (req, res) => {
  const manager = new FacebookAdsManager();
  res.json({
    success: true,
    page: {
      key: 'sabo_billiards',
      name: 'SABO Billiards - TP. Vũng Tàu',
      id: PAGE_REGISTRY.sabo_billiards.id
    },
    templates: manager.getTournamentTemplates(),
    audiences: {
      local: 'Vũng Tàu & Bà Rịa (người địa phương)',
      regional: 'Miền Nam (HCM, Đồng Nai, Bình Dương)',
      tourists: 'Khách du lịch tại Vũng Tàu'
    },
    usage: {
      endpoint: 'POST /api/facebook/sabo-billiards/tournament',
      example: {
        tournamentName: 'Giải 9-Ball Cuối Tuần',
        eventDate: 'Thứ 7, 30/11/2024, 14:00',
        prizePool: 2000000,
        entryFee: 100000,
        format: '9-Ball',
        dailyBudget: 100000,
        audienceType: 'local',
        production: false
      }
    }
  });
});

/**
 * @route POST /api/facebook/sabo-billiards/tournament
 * @desc Tạo campaign quảng bá giải đấu billiards
 * @body {
 *   tournamentName: string (required) - "Giải 9-Ball Cuối Tuần"
 *   eventDate: string (required) - "Thứ 7, 30/11/2024, 14:00"
 *   prizePool: number - Tổng giải thưởng VND
 *   entryFee: number - Phí tham gia VND (0 = miễn phí)
 *   format: string - "9-Ball", "8-Ball", "Carom"
 *   imageUrl: string - Link ảnh banner
 *   dailyBudget: number - Ngân sách/ngày VND (default: 100000)
 *   audienceType: 'local' | 'regional' | 'tourists'
 *   production: boolean - true = chạy thật, false = sandbox test (default)
 * }
 */
router.post('/sabo-billiards/tournament', async (req, res) => {
  try {
    const {
      tournamentName,
      eventDate,
      prizePool = 0,
      entryFee = 0,
      format = '9-Ball',
      imageUrl,
      dailyBudget = 100000,
      audienceType = 'local',
      production = false
    } = req.body;

    // Validation
    if (!tournamentName) {
      return res.status(400).json({
        error: 'tournamentName là bắt buộc',
        example: 'Giải 9-Ball Cuối Tuần'
      });
    }
    if (!eventDate) {
      return res.status(400).json({
        error: 'eventDate là bắt buộc',
        example: 'Thứ 7, 30/11/2024, 14:00'
      });
    }

    const manager = new FacebookAdsManager(!production);
    
    const result = await manager.createTournamentCampaign({
      tournamentName,
      eventDate,
      prizePool,
      entryFee,
      format,
      imageUrl,
      dailyBudget,
      audienceType,
      production
    });

    if (result.errors && result.errors.length > 0) {
      return res.status(400).json({
        success: false,
        ...result
      });
    }

    res.json({
      success: true,
      ...result,
      message: production 
        ? '🚀 Campaign đã tạo! Vào Ads Manager để kích hoạt.' 
        : '✅ Campaign test đã tạo (SANDBOX - miễn phí)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/facebook/sabo-billiards/quick-tournament
 * @desc Tạo nhanh từ template có sẵn
 * @body {
 *   template: 'weekly_9ball' | 'monthly_8ball' | 'vip_tournament' | 'free_tournament'
 *   eventDate: string (required) - "Thứ 7, 30/11/2024, 14:00"
 *   production: boolean
 * }
 */
router.post('/sabo-billiards/quick-tournament', async (req, res) => {
  try {
    const { 
      template = 'weekly_9ball', 
      eventDate,
      imageUrl,
      production = false 
    } = req.body;

    if (!eventDate) {
      return res.status(400).json({
        error: 'eventDate là bắt buộc',
        example: 'Thứ 7, 30/11/2024, 14:00'
      });
    }

    const manager = new FacebookAdsManager(!production);
    const templates = manager.getTournamentTemplates();
    
    if (!templates[template]) {
      return res.status(400).json({
        error: `Template không hợp lệ: ${template}`,
        availableTemplates: Object.keys(templates)
      });
    }

    const t = templates[template];
    
    const result = await manager.createTournamentCampaign({
      tournamentName: t.name,
      eventDate,
      prizePool: t.prizePool,
      entryFee: t.entryFee,
      format: t.format,
      imageUrl,
      dailyBudget: t.dailyBudget,
      audienceType: 'local',
      production
    });

    if (result.errors && result.errors.length > 0) {
      return res.status(400).json({
        success: false,
        template,
        ...result
      });
    }

    res.json({
      success: true,
      template,
      ...result,
      message: production 
        ? '🚀 Campaign đã tạo! Vào Ads Manager để kích hoạt.' 
        : '✅ Campaign test đã tạo (SANDBOX - miễn phí)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

