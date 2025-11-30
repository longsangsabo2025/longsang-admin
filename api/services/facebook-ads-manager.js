/**
 * Facebook Ads Manager Service
 * Foundation for Multi-Page Advertising
 * 
 * @author LongSang Admin
 * @version 1.0.0
 * @apiVersion v24.0 (Meta Marketing API)
 */

const fetch = require('node-fetch');

// =============================================================
// CONFIGURATION
// =============================================================

const FB_API_VERSION = 'v24.0';
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

/**
 * Page Registry - All Facebook Pages with their tokens and Instagram accounts
 */
const PAGE_REGISTRY = {
  // Main Page - SABO Billiards
  sabo_billiards: {
    id: process.env.FACEBOOK_PAGE_ID || '118356497898536',
    name: 'SABO Billiards - TP. Vũng Tàu',
    token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    category: 'billiards',
    instagram: {
      id: process.env.INSTAGRAM_SABO_BILLIARDS_ID || '17841474279844606',
      username: '@sabobilliard'
    }
  },
  
  // SABO Arena
  sabo_arena: {
    id: process.env.FACEBOOK_PAGE_SABO_ARENA_ID || '719273174600166',
    name: 'SABO Arena',
    token: process.env.FACEBOOK_PAGE_SABO_ARENA_TOKEN,
    category: 'entertainment',
    instagram: null
  },
  
  // AI Newbie VN
  ai_newbie_vn: {
    id: process.env.FACEBOOK_PAGE_AI_NEWBIE_VN_ID || '569671719553461',
    name: 'AI Newbie VN',
    token: process.env.FACEBOOK_PAGE_AI_NEWBIE_VN_TOKEN,
    category: 'technology',
    instagram: {
      id: process.env.INSTAGRAM_AI_NEWBIE_VN_ID || '17841474205608601',
      username: '@newbiehocmake'
    }
  },
  
  // SABO Media
  sabo_media: {
    id: process.env.FACEBOOK_PAGE_SABO_MEDIA_ID || '332950393234346',
    name: 'SABO Media',
    token: process.env.FACEBOOK_PAGE_SABO_MEDIA_TOKEN,
    category: 'media',
    instagram: {
      id: process.env.INSTAGRAM_SABO_MEDIA_ID || '17841472718907470',
      username: '@sabomediavt'
    }
  },
  
  // AI Art Newbie
  ai_art_newbie: {
    id: process.env.FACEBOOK_PAGE_AI_ART_NEWBIE_ID || '618738001318577',
    name: 'AI Art Newbie',
    token: process.env.FACEBOOK_PAGE_AI_ART_NEWBIE_TOKEN,
    category: 'art',
    instagram: {
      id: process.env.INSTAGRAM_AI_ART_NEWBIE_ID || '17841472996653110',
      username: '@lsfusionlab'
    }
  },
  
  // SABO Billiard Shop
  sabo_billiard_shop: {
    id: process.env.FACEBOOK_PAGE_SABO_BILLIARD_SHOP_ID || '569652129566651',
    name: 'SABO Billiard Shop',
    token: process.env.FACEBOOK_PAGE_SABO_BILLIARD_SHOP_TOKEN,
    category: 'ecommerce',
    instagram: {
      id: process.env.INSTAGRAM_SABO_BILLIARD_SHOP_ID || '17841472893889754',
      username: '@sabobidashop'
    }
  },
  
  // Thợ Săn Hoàng Hôn
  tho_san_hoang_hon: {
    id: process.env.FACEBOOK_PAGE_THO_SAN_HOANG_HON_ID || '519070237965883',
    name: 'Thợ Săn Hoàng Hôn',
    token: process.env.FACEBOOK_PAGE_THO_SAN_HOANG_HON_TOKEN,
    category: 'photography',
    instagram: null
  }
};

/**
 * Ad Account Configuration
 */
const AD_ACCOUNTS = {
  production: {
    id: process.env.FACEBOOK_AD_ACCOUNT_ID || '5736017743171140',
    name: 'Long Sang',
    type: 'production',
    token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  },
  sandbox: {
    id: process.env.FACEBOOK_SANDBOX_AD_ACCOUNT_ID || '832720779614345',
    name: 'New Sandbox Ad Account',
    type: 'sandbox',
    token: process.env.FACEBOOK_SANDBOX_ACCESS_TOKEN
  }
};

/**
 * Campaign Objectives (API v24.0)
 */
const CAMPAIGN_OBJECTIVES = {
  AWARENESS: 'OUTCOME_AWARENESS',
  TRAFFIC: 'OUTCOME_TRAFFIC',
  ENGAGEMENT: 'OUTCOME_ENGAGEMENT',
  LEADS: 'OUTCOME_LEADS',
  SALES: 'OUTCOME_SALES',
  APP_PROMOTION: 'OUTCOME_APP_PROMOTION'
};

/**
 * Predefined Audiences by Business Type
 */
const AUDIENCE_TEMPLATES = {
  billiards: {
    name: 'Billiards Enthusiasts - Vũng Tàu',
    targeting: {
      geo_locations: {
        cities: [{ key: '2714507', name: 'Vung Tau', country: 'VN' }],
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 55,
      genders: [1, 2], // All
      interests: [
        { id: '6003384308270', name: 'Billiards' },
        { id: '6003139666707', name: 'Pool (cue sports)' }
      ]
    }
  },
  technology: {
    name: 'Tech & AI Enthusiasts - Vietnam',
    targeting: {
      geo_locations: {
        countries: ['VN'],
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 45,
      interests: [
        { id: '6003139266461', name: 'Artificial intelligence' },
        { id: '6003397425735', name: 'Technology' },
        { id: '6003109307942', name: 'Programming' }
      ]
    }
  },
  ecommerce: {
    name: 'Online Shoppers - Vietnam',
    targeting: {
      geo_locations: {
        countries: ['VN'],
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 55,
      behaviors: [
        { id: '6002714895372', name: 'Engaged Shoppers' }
      ]
    }
  },
  art: {
    name: 'Art & Design Lovers - Vietnam',
    targeting: {
      geo_locations: {
        countries: ['VN'],
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 45,
      interests: [
        { id: '6003139418110', name: 'Digital art' },
        { id: '6003020834693', name: 'Graphic design' },
        { id: '6003139266461', name: 'Artificial intelligence' }
      ]
    }
  },

  // ========================================
  // SABO BILLIARDS - TOURNAMENT AUDIENCES
  // ========================================
  
  // Người chơi billiards tại Vũng Tàu và Bà Rịa
  billiards_vungtau_local: {
    name: 'Billiards Players - Vũng Tàu & Bà Rịa',
    targeting: {
      geo_locations: {
        cities: [
          { key: '2714507', name: 'Vung Tau', country: 'VN' },
          { key: '2714506', name: 'Ba Ria', country: 'VN' }
        ],
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 50,
      genders: [1], // Nam giới (đa số chơi billiards)
      interests: [
        { id: '6003384308270', name: 'Billiards' },
        { id: '6003139666707', name: 'Pool (cue sports)' },
        { id: '6003598795430', name: 'Snooker' }
      ]
    }
  },

  // Mở rộng ra khu vực xung quanh (cho giải lớn)
  billiards_regional: {
    name: 'Billiards Players - Miền Nam',
    targeting: {
      geo_locations: {
        regions: [
          { key: '2714510', name: 'Ho Chi Minh City' },
          { key: '2714506', name: 'Ba Ria - Vung Tau Province' },
          { key: '2714504', name: 'Dong Nai Province' },
          { key: '2714503', name: 'Binh Duong Province' }
        ],
        location_types: ['home', 'recent']
      },
      age_min: 18,
      age_max: 55,
      genders: [1, 2],
      interests: [
        { id: '6003384308270', name: 'Billiards' },
        { id: '6003139666707', name: 'Pool (cue sports)' }
      ]
    }
  },

  // Khách du lịch tại Vũng Tàu (traveling)
  billiards_tourists: {
    name: 'Tourists in Vũng Tàu',
    targeting: {
      geo_locations: {
        cities: [{ key: '2714507', name: 'Vung Tau', country: 'VN' }],
        location_types: ['recent'] // Chỉ người mới đến gần đây
      },
      age_min: 21,
      age_max: 45,
      excluded_geo_locations: {
        cities: [{ key: '2714507', name: 'Vung Tau', country: 'VN' }],
        location_types: ['home'] // Loại trừ người sống tại VT
      }
    }
  }
};

/**
 * Campaign Templates for Quick Setup
 */
const CAMPAIGN_TEMPLATES = {
  brand_awareness: {
    name: 'Brand Awareness Campaign',
    objective: CAMPAIGN_OBJECTIVES.AWARENESS,
    optimization_goal: 'REACH',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 50000, // 50,000 VND
    recommended_duration: 7 // days
  },
  traffic_website: {
    name: 'Website Traffic Campaign',
    objective: CAMPAIGN_OBJECTIVES.TRAFFIC,
    optimization_goal: 'LINK_CLICKS',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 100000, // 100,000 VND
    recommended_duration: 14
  },
  engagement_post: {
    name: 'Post Engagement Campaign',
    objective: CAMPAIGN_OBJECTIVES.ENGAGEMENT,
    optimization_goal: 'POST_ENGAGEMENT',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 50000,
    recommended_duration: 7
  },
  lead_generation: {
    name: 'Lead Generation Campaign',
    objective: CAMPAIGN_OBJECTIVES.LEADS,
    optimization_goal: 'LEAD_GENERATION',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 150000,
    recommended_duration: 14
  },
  sales_conversion: {
    name: 'Sales Conversion Campaign',
    objective: CAMPAIGN_OBJECTIVES.SALES,
    optimization_goal: 'OFFSITE_CONVERSIONS',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 200000,
    recommended_duration: 30
  },
  
  // ========================================
  // SABO BILLIARDS - TOURNAMENT TEMPLATES
  // ========================================
  billiards_tournament: {
    name: 'Giải Đấu Billiards',
    objective: CAMPAIGN_OBJECTIVES.ENGAGEMENT,
    optimization_goal: 'EVENT_RESPONSES', // Tối ưu cho đăng ký tham gia
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 100000, // 100,000 VND/ngày
    recommended_duration: 5, // 5 ngày trước giải
    description: 'Quảng bá giải đấu billiards, thu hút đăng ký'
  },
  billiards_weekend_event: {
    name: 'Sự Kiện Cuối Tuần',
    objective: CAMPAIGN_OBJECTIVES.AWARENESS,
    optimization_goal: 'REACH',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 50000, // 50,000 VND/ngày
    recommended_duration: 3, // Thứ 5 đến Chủ nhật
    description: 'Quảng bá sự kiện cuối tuần cho người chơi billiards'
  },
  billiards_promo: {
    name: 'Khuyến Mãi SABO',
    objective: CAMPAIGN_OBJECTIVES.TRAFFIC,
    optimization_goal: 'LINK_CLICKS',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget_min: 75000,
    recommended_duration: 7,
    description: 'Quảng bá khuyến mãi, giảm giá bàn chơi'
  }
};

// =============================================================
// CORE API FUNCTIONS
// =============================================================

class FacebookAdsManager {
  constructor(useSandbox = false) {
    this.useSandbox = useSandbox;
    this.adAccount = useSandbox ? AD_ACCOUNTS.sandbox : AD_ACCOUNTS.production;
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, method = 'GET', data = null, pageKey = null) {
    // Determine which token to use
    let token;
    if (pageKey && PAGE_REGISTRY[pageKey]) {
      token = PAGE_REGISTRY[pageKey].token;
    } else {
      token = this.adAccount.token;
    }

    const url = new URL(`${FB_API_BASE}${endpoint}`);
    
    if (method === 'GET' && data) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object') {
          url.searchParams.append(key, JSON.stringify(value));
        } else {
          url.searchParams.append(key, value);
        }
      });
    }
    
    url.searchParams.append('access_token', token);
    
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (method !== 'GET' && data) {
      // For POST requests, send as form data
      const formData = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      formData.append('access_token', token);
      options.body = formData;
      options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }
    
    const response = await fetch(url.toString(), options);
    return response.json();
  }

  // =============================================================
  // PAGE MANAGEMENT
  // =============================================================

  /**
   * Get all configured pages
   */
  getAllPages() {
    return Object.entries(PAGE_REGISTRY).map(([key, page]) => ({
      key,
      id: page.id,
      name: page.name,
      category: page.category,
      hasInstagram: !!page.instagram,
      instagram: page.instagram
    }));
  }

  /**
   * Get page by key
   */
  getPage(pageKey) {
    return PAGE_REGISTRY[pageKey] || null;
  }

  /**
   * Get page insights
   */
  async getPageInsights(pageKey, metrics = ['page_impressions', 'page_engaged_users', 'page_fans'], period = 'day') {
    const page = this.getPage(pageKey);
    if (!page) throw new Error(`Page not found: ${pageKey}`);

    return this.apiRequest(`/${page.id}/insights`, 'GET', {
      metric: metrics.join(','),
      period
    }, pageKey);
  }

  // =============================================================
  // AD ACCOUNT MANAGEMENT
  // =============================================================

  /**
   * Get ad account info
   */
  async getAdAccountInfo() {
    return this.apiRequest(`/act_${this.adAccount.id}`, 'GET', {
      fields: 'id,name,account_status,amount_spent,balance,currency,timezone_name,business_name,min_daily_budget'
    });
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(status = null) {
    const params = {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time,effective_status'
    };
    if (status) params.effective_status = JSON.stringify([status]);
    
    return this.apiRequest(`/act_${this.adAccount.id}/campaigns`, 'GET', params);
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId) {
    return this.apiRequest(`/${campaignId}`, 'GET', {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,stop_time,effective_status,adsets{id,name,status,targeting}'
    });
  }

  // =============================================================
  // CAMPAIGN CREATION
  // =============================================================

  /**
   * Create campaign from template
   */
  async createCampaignFromTemplate(templateKey, options = {}) {
    const template = CAMPAIGN_TEMPLATES[templateKey];
    if (!template) throw new Error(`Template not found: ${templateKey}`);

    const {
      name = `${template.name} - ${new Date().toLocaleDateString('vi-VN')}`,
      daily_budget = template.daily_budget_min,
      status = 'PAUSED', // Always start paused for safety
      special_ad_categories = []
    } = options;

    const campaignData = {
      name,
      objective: template.objective,
      status,
      special_ad_categories: JSON.stringify(special_ad_categories)
    };

    if (daily_budget) {
      campaignData.daily_budget = daily_budget;
    }

    return this.apiRequest(`/act_${this.adAccount.id}/campaigns`, 'POST', campaignData);
  }

  /**
   * Create custom campaign
   */
  async createCampaign(config) {
    const {
      name,
      objective = CAMPAIGN_OBJECTIVES.AWARENESS,
      status = 'PAUSED',
      daily_budget,
      lifetime_budget,
      special_ad_categories = []
    } = config;

    if (!name) throw new Error('Campaign name is required');

    const campaignData = {
      name,
      objective,
      status,
      special_ad_categories: JSON.stringify(special_ad_categories)
    };

    if (daily_budget) campaignData.daily_budget = daily_budget;
    if (lifetime_budget) campaignData.lifetime_budget = lifetime_budget;

    return this.apiRequest(`/act_${this.adAccount.id}/campaigns`, 'POST', campaignData);
  }

  // =============================================================
  // AD SET CREATION
  // =============================================================

  /**
   * Create ad set with audience targeting
   */
  async createAdSet(config) {
    const {
      campaign_id,
      name,
      optimization_goal = 'REACH',
      billing_event = 'IMPRESSIONS',
      bid_strategy = 'LOWEST_COST_WITHOUT_CAP',
      daily_budget,
      targeting,
      promoted_object, // { page_id: 'xxx' }
      status = 'PAUSED',
      start_time,
      end_time
    } = config;

    if (!campaign_id) throw new Error('Campaign ID is required');
    if (!name) throw new Error('Ad Set name is required');
    if (!targeting) throw new Error('Targeting is required');

    const adSetData = {
      campaign_id,
      name,
      optimization_goal,
      billing_event,
      bid_strategy,
      targeting: JSON.stringify(targeting),
      status
    };

    if (daily_budget) adSetData.daily_budget = daily_budget;
    if (promoted_object) adSetData.promoted_object = JSON.stringify(promoted_object);
    if (start_time) adSetData.start_time = start_time;
    if (end_time) adSetData.end_time = end_time;

    return this.apiRequest(`/act_${this.adAccount.id}/adsets`, 'POST', adSetData);
  }

  /**
   * Create ad set from audience template
   */
  async createAdSetFromTemplate(campaign_id, audienceTemplateKey, options = {}) {
    const audienceTemplate = AUDIENCE_TEMPLATES[audienceTemplateKey];
    if (!audienceTemplate) throw new Error(`Audience template not found: ${audienceTemplateKey}`);

    return this.createAdSet({
      campaign_id,
      name: options.name || audienceTemplate.name,
      targeting: audienceTemplate.targeting,
      ...options
    });
  }

  // =============================================================
  // AD CREATIVE
  // =============================================================

  /**
   * Create ad creative
   */
  async createAdCreative(config) {
    const {
      name,
      page_id,
      message,
      link,
      image_url,
      call_to_action_type = 'LEARN_MORE'
    } = config;

    if (!name) throw new Error('Creative name is required');
    if (!page_id) throw new Error('Page ID is required');

    const creativeData = {
      name,
      object_story_spec: JSON.stringify({
        page_id,
        link_data: {
          message,
          link,
          picture: image_url,
          call_to_action: {
            type: call_to_action_type
          }
        }
      })
    };

    return this.apiRequest(`/act_${this.adAccount.id}/adcreatives`, 'POST', creativeData);
  }

  // =============================================================
  // AD CREATION
  // =============================================================

  /**
   * Create ad
   */
  async createAd(config) {
    const {
      name,
      adset_id,
      creative_id,
      status = 'PAUSED'
    } = config;

    if (!name) throw new Error('Ad name is required');
    if (!adset_id) throw new Error('Ad Set ID is required');
    if (!creative_id) throw new Error('Creative ID is required');

    const adData = {
      name,
      adset_id,
      creative: JSON.stringify({ creative_id }),
      status
    };

    return this.apiRequest(`/act_${this.adAccount.id}/ads`, 'POST', adData);
  }

  // =============================================================
  // INSIGHTS & REPORTING
  // =============================================================

  /**
   * Get campaign insights
   */
  async getCampaignInsights(campaignId, datePreset = 'last_7d') {
    return this.apiRequest(`/${campaignId}/insights`, 'GET', {
      fields: 'impressions,reach,clicks,spend,ctr,cpc,cpm,actions',
      date_preset: datePreset
    });
  }

  /**
   * Get ad account insights
   */
  async getAccountInsights(datePreset = 'last_7d') {
    return this.apiRequest(`/act_${this.adAccount.id}/insights`, 'GET', {
      fields: 'impressions,reach,clicks,spend,ctr,cpc,cpm,actions',
      date_preset: datePreset
    });
  }

  // =============================================================
  // QUICK CAMPAIGN BUILDER
  // =============================================================

  /**
   * Build complete campaign for a page (Campaign + AdSet + Creative + Ad)
   */
  async buildQuickCampaign(config) {
    const {
      pageKey,
      templateKey = 'brand_awareness',
      audienceTemplateKey,
      campaignName,
      message,
      link,
      imageUrl,
      dailyBudget,
      callToAction = 'LEARN_MORE'
    } = config;

    const page = this.getPage(pageKey);
    if (!page) throw new Error(`Page not found: ${pageKey}`);

    const results = { steps: [], errors: [] };

    try {
      // Step 1: Create Campaign
      const template = CAMPAIGN_TEMPLATES[templateKey];
      const campaign = await this.createCampaignFromTemplate(templateKey, {
        name: campaignName || `${page.name} - ${template.name}`,
        daily_budget: dailyBudget || template.daily_budget_min
      });
      
      if (campaign.error) {
        results.errors.push({ step: 'campaign', error: campaign.error });
        return results;
      }
      results.steps.push({ step: 'campaign', id: campaign.id, status: 'success' });

      // Step 2: Create Ad Set
      const audienceTemplate = audienceTemplateKey 
        ? AUDIENCE_TEMPLATES[audienceTemplateKey] 
        : AUDIENCE_TEMPLATES[page.category] || AUDIENCE_TEMPLATES.billiards;

      const adSet = await this.createAdSet({
        campaign_id: campaign.id,
        name: `${page.name} - ${audienceTemplate.name}`,
        targeting: audienceTemplate.targeting,
        optimization_goal: template.optimization_goal,
        billing_event: template.billing_event,
        bid_strategy: template.bid_strategy,
        daily_budget: dailyBudget || template.daily_budget_min,
        promoted_object: { page_id: page.id }
      });

      if (adSet.error) {
        results.errors.push({ step: 'adset', error: adSet.error });
        return results;
      }
      results.steps.push({ step: 'adset', id: adSet.id, status: 'success' });

      // Step 3: Create Creative (if message/link provided)
      if (message || link) {
        const creative = await this.createAdCreative({
          name: `${page.name} - Creative`,
          page_id: page.id,
          message,
          link: link || `https://facebook.com/${page.id}`,
          image_url: imageUrl,
          call_to_action_type: callToAction
        });

        if (creative.error) {
          results.errors.push({ step: 'creative', error: creative.error });
          return results;
        }
        results.steps.push({ step: 'creative', id: creative.id, status: 'success' });

        // Step 4: Create Ad
        const ad = await this.createAd({
          name: `${page.name} - Ad`,
          adset_id: adSet.id,
          creative_id: creative.id
        });

        if (ad.error) {
          results.errors.push({ step: 'ad', error: ad.error });
          return results;
        }
        results.steps.push({ step: 'ad', id: ad.id, status: 'success' });
      }

      results.success = true;
      results.summary = {
        mode: this.useSandbox ? 'sandbox' : 'production',
        page: page.name,
        campaign_id: campaign.id,
        adset_id: adSet.id,
        message: this.useSandbox 
          ? 'Campaign created in SANDBOX mode (FREE - ads will not run)' 
          : 'Campaign created in PRODUCTION mode (ads will run when activated)'
      };

    } catch (error) {
      results.errors.push({ step: 'unknown', error: error.message });
    }

    return results;
  }

  // =============================================================
  // SABO BILLIARDS - TOURNAMENT QUICK SETUP
  // =============================================================

  /**
   * Tạo nhanh Campaign cho Giải Đấu Billiards
   * 
   * @param {Object} config
   * @param {string} config.tournamentName - Tên giải đấu (vd: "Giải Pool 9 Ball Cuối Tuần")
   * @param {string} config.eventDate - Ngày giải (vd: "Thứ 7, 30/11/2024")
   * @param {number} config.prizePool - Giải thưởng (VND)
   * @param {number} config.entryFee - Phí tham gia (VND)
   * @param {string} config.format - Thể lệ (vd: "9-ball", "8-ball", "Carom")
   * @param {string} config.imageUrl - Link ảnh banner
   * @param {number} config.dailyBudget - Ngân sách/ngày (VND), mặc định 100,000
   * @param {string} config.audienceType - 'local' | 'regional' | 'tourists', mặc định 'local'
   * @param {boolean} config.production - true = chạy thật, false = sandbox test
   */
  async createTournamentCampaign(config) {
    const {
      tournamentName,
      eventDate,
      prizePool = 0,
      entryFee = 0,
      format = '9-Ball',
      imageUrl,
      dailyBudget = 100000, // 100k VND default
      audienceType = 'local',
      production = false
    } = config;

    // Validate
    if (!tournamentName) throw new Error('Tên giải đấu là bắt buộc');
    if (!eventDate) throw new Error('Ngày tổ chức là bắt buộc');

    const page = this.getPage('sabo_billiards');
    if (!page) throw new Error('SABO Billiards page not found');

    // Build message
    const prizeText = prizePool > 0 
      ? `🏆 Tổng giải thưởng: ${prizePool.toLocaleString('vi-VN')} VND\n` 
      : '';
    const feeText = entryFee > 0 
      ? `💵 Phí tham gia: ${entryFee.toLocaleString('vi-VN')} VND\n` 
      : '💵 MIỄN PHÍ tham gia!\n';

    const message = `🎱 ${tournamentName.toUpperCase()} 🎱

📅 ${eventDate}
📍 SABO Billiards - TP. Vũng Tàu
🎯 Thể lệ: ${format}

${prizeText}${feeText}
👉 Đăng ký ngay tại SABO hoặc inbox fanpage!

#SABOBilliards #GiaiDauBilliards #VungTau #${format.replace(/\s/g, '')}`;

    // Select audience based on type
    const audienceMap = {
      local: 'billiards_vungtau_local',
      regional: 'billiards_regional',
      tourists: 'billiards_tourists'
    };
    const audienceKey = audienceMap[audienceType] || 'billiards_vungtau_local';

    // Use sandbox or production
    this.useSandbox = !production;
    this.adAccount = production ? AD_ACCOUNTS.production : AD_ACCOUNTS.sandbox;

    const results = {
      tournament: tournamentName,
      eventDate,
      mode: production ? 'PRODUCTION' : 'SANDBOX',
      steps: [],
      errors: []
    };

    try {
      // Step 1: Create Campaign
      const campaignName = `[${format}] ${tournamentName} - ${eventDate}`;
      const campaign = await this.createCampaign({
        name: campaignName,
        objective: CAMPAIGN_OBJECTIVES.ENGAGEMENT,
        status: 'PAUSED',
        daily_budget: dailyBudget
      });

      if (campaign.error) {
        results.errors.push({ step: 'Campaign', error: campaign.error });
        return results;
      }
      results.steps.push({ 
        step: 'Campaign', 
        id: campaign.id, 
        name: campaignName,
        status: 'success' 
      });

      // Step 2: Create Ad Set with targeting
      const audience = AUDIENCE_TEMPLATES[audienceKey];
      const adSet = await this.createAdSet({
        campaign_id: campaign.id,
        name: `${tournamentName} - ${audience.name}`,
        targeting: audience.targeting,
        optimization_goal: 'POST_ENGAGEMENT',
        billing_event: 'IMPRESSIONS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        daily_budget: dailyBudget,
        promoted_object: { page_id: page.id }
      });

      if (adSet.error) {
        results.errors.push({ step: 'AdSet', error: adSet.error });
        return results;
      }
      results.steps.push({ 
        step: 'AdSet', 
        id: adSet.id, 
        audience: audience.name,
        status: 'success' 
      });

      // Step 3: Create Creative
      const creative = await this.createAdCreative({
        name: `Creative - ${tournamentName}`,
        page_id: page.id,
        message: message,
        link: `https://facebook.com/${page.id}`,
        image_url: imageUrl,
        call_to_action_type: 'SEND_MESSAGE'
      });

      if (creative.error) {
        results.errors.push({ step: 'Creative', error: creative.error });
        return results;
      }
      results.steps.push({ 
        step: 'Creative', 
        id: creative.id, 
        status: 'success' 
      });

      // Step 4: Create Ad
      const ad = await this.createAd({
        name: `Ad - ${tournamentName}`,
        adset_id: adSet.id,
        creative_id: creative.id
      });

      if (ad.error) {
        results.errors.push({ step: 'Ad', error: ad.error });
        return results;
      }
      results.steps.push({ 
        step: 'Ad', 
        id: ad.id, 
        status: 'success' 
      });

      // Summary
      results.success = true;
      results.summary = {
        campaign_id: campaign.id,
        adset_id: adSet.id,
        ad_id: ad.id,
        daily_budget_vnd: dailyBudget.toLocaleString('vi-VN') + ' VND',
        targeting: audience.name,
        status: 'PAUSED',
        next_step: production 
          ? '⚠️ Campaign đã tạo ở PRODUCTION. Vào Ads Manager để KÍCH HOẠT khi sẵn sàng!'
          : '✅ Campaign đã tạo ở SANDBOX (miễn phí test). Set production=true để chạy thật.'
      };

    } catch (error) {
      results.errors.push({ step: 'System', error: error.message });
    }

    return results;
  }

  /**
   * Lấy danh sách giải đấu templates có sẵn
   */
  getTournamentTemplates() {
    return {
      weekly_9ball: {
        name: 'Giải 9-Ball Cuối Tuần',
        format: '9-Ball',
        prizePool: 2000000,
        entryFee: 100000,
        dailyBudget: 100000
      },
      monthly_8ball: {
        name: 'Giải 8-Ball Tháng',
        format: '8-Ball',
        prizePool: 5000000,
        entryFee: 200000,
        dailyBudget: 150000
      },
      vip_tournament: {
        name: 'Giải VIP SABO',
        format: '9-Ball',
        prizePool: 10000000,
        entryFee: 500000,
        dailyBudget: 200000
      },
      free_tournament: {
        name: 'Giải Giao Hữu',
        format: '9-Ball',
        prizePool: 0,
        entryFee: 0,
        dailyBudget: 50000
      }
    };
  }
}

// =============================================================
// EXPORTS
// =============================================================

module.exports = {
  FacebookAdsManager,
  PAGE_REGISTRY,
  AD_ACCOUNTS,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_TEMPLATES,
  AUDIENCE_TEMPLATES,
  FB_API_VERSION
};
