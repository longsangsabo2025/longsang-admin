/**
 * AI Action Executor
 * Connects AI Agent responses to actual service execution
 * 
 * When AI detects actionable intents, this executor runs the corresponding services
 */

const { FacebookAdsManager } = require('./facebook-ads-manager');
const facebookPublisher = require('./facebook-publisher');
const n8nService = require('./n8n-service');
const smartPostComposer = require('./smart-post-composer');
const OpenAI = require('openai');

// Create instance of FacebookAdsManager
const facebookAdsManager = new FacebookAdsManager();

// OpenAI for intent detection
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Available actions that AI can execute
 */
const AVAILABLE_ACTIONS = {
  // Facebook/Instagram Posts - Using Smart Post Composer
  'post_facebook': {
    description: 'Create and post intelligent content to Facebook page with auto-generated images',
    params: ['page', 'content', 'topic?', 'imageUrl?', 'scheduledTime?', 'includeImage?'],
    executor: async (params) => {
      const topic = params.topic || params.content || 'general update';
      const page = params.page || 'sabo_arena';
      
      console.log(`🚀 Smart Post Composer activated for: "${topic}"`);
      
      try {
        // Use Smart Post Composer for intelligent content + image
        const composedPost = await smartPostComposer.composePost(topic, {
          page,
          includeImage: params.includeImage !== false, // Default: include image
          customImageUrl: params.imageUrl,
          imageSource: params.imageUrl ? 'url' : 'auto',
        });
        
        console.log(`📝 Content: ${composedPost.content.substring(0, 100)}...`);
        console.log(`🖼️ Image: ${composedPost.imageUrl || 'none'} (${composedPost.metadata.imageSource})`);
        
        // Post to Facebook with composed content and image
        const postResult = await facebookPublisher.createPost(page, {
          message: composedPost.content,
          imageUrl: composedPost.imageUrl,
          scheduledTime: params.scheduledTime,
        });
        
        return {
          ...postResult,
          composedPost: {
            content: composedPost.content,
            imageUrl: composedPost.imageUrl,
            imageSource: composedPost.metadata.imageSource,
            analysis: composedPost.metadata.analysis,
          }
        };
      } catch (error) {
        console.error('❌ Smart compose failed, using fallback:', error.message);
        
        // Fallback to simple content generation
        const fallbackContent = await generateSmartContent(topic, getPageContext(page));
        return await facebookPublisher.createPost(page, {
          message: fallbackContent,
          imageUrl: params.imageUrl,
          scheduledTime: params.scheduledTime,
        });
      }
    },
  },
  
  'schedule_posts': {
    description: 'Schedule multiple posts for a campaign',
    params: ['page', 'posts[]'],
    executor: async (params) => {
      const results = [];
      for (const post of params.posts) {
        const result = await facebookPublisher.createPost(params.page || 'sabo_billiards', {
          message: post.content,
          scheduledTime: post.scheduledTime,
        });
        results.push(result);
      }
      return { success: true, scheduled: results.length, results };
    },
  },

  // Smart Post Scheduling - Auto-optimal times
  'schedule_post': {
    description: 'Schedule a post for optimal time (auto or specified)',
    params: ['page', 'topic', 'scheduledTime?', 'postType?'],
    executor: async (params) => {
      const postScheduler = require('./post-scheduler');
      const page = params.page || 'sabo_arena';
      const topic = params.topic || params.content;
      
      console.log(`📅 Scheduling post for ${page}: "${topic?.substring(0, 50)}..."`);
      
      // First compose the post content + image
      const composedPost = await smartPostComposer.composePost(topic, {
        page,
        includeImage: true,
        imageSource: 'auto',
      });
      
      // Then schedule it for optimal time
      const scheduleResult = await postScheduler.schedulePost({
        pageId: page,
        content: composedPost.content,
        imageUrl: composedPost.imageUrl,
        postType: params.postType || composedPost.analysis?.postType || 'default',
        preferredTime: params.scheduledTime,
      });
      
      return {
        success: true,
        ...scheduleResult,
        composedPost: {
          content: composedPost.content,
          imageUrl: composedPost.imageUrl,
          analysis: composedPost.analysis,
        },
      };
    },
  },

  'get_suggested_times': {
    description: 'Get suggested optimal posting times for a post type',
    params: ['postType?', 'count?'],
    executor: async (params) => {
      const postScheduler = require('./post-scheduler');
      const suggestions = postScheduler.getSuggestedTimes(
        params.postType || 'default',
        params.count || 5
      );
      return {
        success: true,
        postType: params.postType || 'default',
        suggestions,
      };
    },
  },

  'list_scheduled': {
    description: 'List all scheduled posts for a page',
    params: ['page?'],
    executor: async (params) => {
      const postScheduler = require('./post-scheduler');
      const posts = await postScheduler.getScheduledPosts(
        params.page || 'sabo_arena',
        { status: 'scheduled' }
      );
      return {
        success: true,
        page: params.page || 'sabo_arena',
        count: posts.length,
        posts,
      };
    },
  },

  'cancel_scheduled': {
    description: 'Cancel a scheduled post',
    params: ['postId'],
    executor: async (params) => {
      const postScheduler = require('./post-scheduler');
      return await postScheduler.cancelScheduledPost(params.postId);
    },
  },

  // A/B Testing
  'create_ab_test': {
    description: 'Create an A/B test with multiple content variants',
    params: ['topic', 'page?', 'variantCount?', 'strategy?'],
    executor: async (params) => {
      const abTesting = require('./ab-testing');
      const page = params.page || 'sabo_arena';
      
      console.log(`🧪 Creating A/B test for: "${params.topic}"`);
      
      const test = await abTesting.createTest({
        name: `A/B: ${params.topic}`,
        pageId: page,
        topic: params.topic,
        variantCount: params.variantCount || 3,
        strategy: params.strategy || 'mixed',
        duration: params.duration || 24, // hours
      });
      
      return {
        success: true,
        testId: test.id,
        variantCount: test.variants?.length || 0,
        variants: test.variants?.map(v => ({
          id: v.id,
          name: v.name,
          preview: v.content?.substring(0, 100) + '...',
        })),
        message: `A/B test created with ${test.variants?.length || 0} variants`,
      };
    },
  },

  'get_ab_results': {
    description: 'Get A/B test results and winner',
    params: ['testId'],
    executor: async (params) => {
      const abTesting = require('./ab-testing');
      const results = await abTesting.analyzeResults(params.testId);
      return {
        success: true,
        ...results,
      };
    },
  },

  'list_ab_tests': {
    description: 'List all A/B tests for a page',
    params: ['page?', 'status?'],
    executor: async (params) => {
      const abTesting = require('./ab-testing');
      const tests = await abTesting.getTests(params.page || 'sabo_arena', {
        status: params.status,
      });
      return {
        success: true,
        count: tests.length,
        tests: tests.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          variantCount: t.variants?.length || 0,
          winner: t.winner_variant_id,
        })),
      };
    },
  },

  // Carousel Posts
  'create_carousel': {
    description: 'Create a carousel post with multiple images',
    params: ['topic', 'page?', 'slideCount?', 'theme?'],
    executor: async (params) => {
      const carouselCreator = require('./carousel-creator');
      const page = params.page || 'sabo_arena';
      
      console.log(`🎠 Creating carousel for: "${params.topic}"`);
      
      const carousel = await carouselCreator.createCarousel({
        pageId: page,
        topic: params.topic,
        slideCount: params.slideCount || 5,
        theme: params.theme || 'story',
      });
      
      return {
        success: true,
        carouselId: carousel.id,
        slideCount: carousel.slides?.length || 0,
        slides: carousel.slides?.map((s, i) => ({
          index: i + 1,
          headline: s.headline,
          hasImage: !!s.imageUrl,
        })),
        message: `Carousel created with ${carousel.slides?.length || 0} slides`,
      };
    },
  },

  'publish_carousel': {
    description: 'Publish a carousel to Facebook',
    params: ['carouselId', 'page?'],
    executor: async (params) => {
      const carouselCreator = require('./carousel-creator');
      const result = await carouselCreator.publishCarousel(
        params.carouselId,
        params.page || 'sabo_arena'
      );
      return result;
    },
  },

  // Cross-Platform Publishing
  'publish_cross_platform': {
    description: 'Publish content to multiple platforms (Facebook, Instagram, Threads, LinkedIn)',
    params: ['topic', 'platforms?', 'page?', 'includeImage?'],
    executor: async (params) => {
      const crossPlatformPublisher = require('./cross-platform-publisher');
      const page = params.page || 'sabo_arena';
      const platforms = params.platforms || ['facebook', 'instagram'];
      
      console.log(`🌐 Cross-platform publish: "${params.topic}" → ${platforms.join(', ')}`);
      
      // First compose content
      const composedPost = await smartPostComposer.composePost(params.topic, {
        page,
        includeImage: params.includeImage !== false,
      });
      
      // Publish to all platforms
      const results = await crossPlatformPublisher.publishToAll({
        content: composedPost.content,
        imageUrl: composedPost.imageUrl,
        platforms,
        pageId: page,
      });
      
      return {
        success: true,
        platforms: results.map(r => ({
          platform: r.platform,
          success: r.success,
          postId: r.postId,
          error: r.error,
        })),
        composedPost: {
          content: composedPost.content,
          imageUrl: composedPost.imageUrl,
        },
      };
    },
  },

  'get_platform_stats': {
    description: 'Get cross-platform posting statistics',
    params: ['page?', 'days?'],
    executor: async (params) => {
      const crossPlatformPublisher = require('./cross-platform-publisher');
      return await crossPlatformPublisher.getPlatformStats(
        params.page || 'sabo_arena',
        params.days || 30
      );
    },
  },

  // Facebook Ads
  'create_ad_campaign': {
    description: 'Create Facebook/Instagram ad campaign',
    params: ['name', 'dailyBudget', 'targetAudience', 'adText', 'duration?'],
    executor: async (params) => {
      // Use createCampaignFromTemplate method
      return await facebookAdsManager.createCampaignFromTemplate('engagement_post', {
        name: params.name,
        daily_budget: params.dailyBudget || 50000,
      });
    },
  },

  'list_campaigns': {
    description: 'List all active ad campaigns',
    params: [],
    executor: async () => {
      return await facebookAdsManager.getCampaigns();
    },
  },

  'get_campaign_stats': {
    description: 'Get statistics for ad campaigns',
    params: ['campaignId?'],
    executor: async (params) => {
      if (params.campaignId) {
        return await facebookAdsManager.getCampaignInsights(params.campaignId);
      }
      return await facebookAdsManager.getAccountInsights();
    },
  },

  // Facebook Events
  'create_event': {
    description: 'Create a Facebook event on a page',
    params: ['page', 'name', 'description', 'startTime', 'endTime?', 'location?'],
    executor: async (params) => {
      const pageKey = params.page?.replace(/_/g, '-') || 'sabo-arena';
      const page = facebookPublisher.pages[pageKey];
      if (!page) throw new Error(`Unknown page: ${pageKey}`);
      
      const eventData = {
        name: params.name,
        description: params.description,
        start_time: params.startTime,
        access_token: page.token,
      };
      if (params.endTime) eventData.end_time = params.endTime;
      if (params.location) eventData.place = { name: params.location };
      
      const response = await fetch(`https://graph.facebook.com/v18.0/${page.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const result = await response.json();
      return { success: !result.error, eventId: result.id, ...result };
    },
  },

  'list_pages': {
    description: 'List all available Facebook pages',
    params: [],
    executor: async () => {
      const pages = Object.entries(facebookPublisher.pages).map(([key, page]) => ({
        key,
        name: page.name,
        id: page.id,
      }));
      return { success: true, pages };
    },
  },

  'get_page_posts': {
    description: 'Get recent posts from a Facebook page',
    params: ['page', 'limit?'],
    executor: async (params) => {
      const pageKey = params.page?.replace(/_/g, '-') || 'sabo-arena';
      const page = facebookPublisher.pages[pageKey];
      if (!page) throw new Error(`Unknown page: ${pageKey}`);
      
      const limit = params.limit || 5;
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/feed?fields=message,created_time,id&limit=${limit}&access_token=${page.token}`
      );
      const result = await response.json();
      return { success: !result.error, posts: result.data, ...result };
    },
  },

  // N8N Workflows
  'trigger_workflow': {
    description: 'Trigger an n8n automation workflow',
    params: ['workflowName', 'data'],
    executor: async (params) => {
      return await n8nService.triggerWebhook(params.workflowName, params.data);
    },
  },

  // Content Generation (AI generates, then posts)
  'generate_and_post': {
    description: 'Generate content with AI and post to social media',
    params: ['topic', 'platform', 'tone?'],
    executor: async (params) => {
      // Generate content
      const contentResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là content writer cho SABO Billiards - câu lạc bộ billiards tại Vũng Tàu. 
Viết bài ngắn gọn, hấp dẫn, có emoji phù hợp.
Giọng điệu: ${params.tone || 'thân thiện, chuyên nghiệp'}`,
          },
          {
            role: 'user',
            content: `Viết bài ${params.platform} về: ${params.topic}`,
          },
        ],
        max_tokens: 500,
      });

      const generatedContent = contentResponse.choices[0].message.content;

      // Post to platform
      if (params.platform === 'facebook') {
        const postResult = await facebookPublisher.createPost('sabo_billiards', {
          message: generatedContent,
        });
        return {
          success: true,
          content: generatedContent,
          posted: postResult,
        };
      }

      return {
        success: true,
        content: generatedContent,
        message: 'Content generated but not posted (platform not supported yet)',
      };
    },
  },
};

/**
 * Parse user message to detect actionable intent
 */
async function detectIntent(message) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Bạn là AI Marketing Assistant thông minh. Nhiệm vụ: phân tích intent và tự động quyết định hành động.

🎯 ACTIONS CÓ THỂ THỰC HIỆN:

📱 POSTING:
- post_facebook: Đăng bài NGAY lên Facebook (tự động kèm ảnh)
- schedule_post: Lên lịch đăng bài vào thời điểm TỐI ƯU
- get_suggested_times: Xem giờ đăng tốt nhất
- list_scheduled: Xem các bài đã lên lịch
- cancel_scheduled: Hủy bài đã lên lịch

🧪 A/B TESTING:
- create_ab_test: Tạo A/B test với nhiều biến thể nội dung
- get_ab_results: Xem kết quả A/B test (winner, stats)
- list_ab_tests: Liệt kê các A/B test

🎠 CAROUSEL POSTS:
- create_carousel: Tạo bài carousel nhiều ảnh (story-like)
- publish_carousel: Đăng carousel lên Facebook

🌐 CROSS-PLATFORM:
- publish_cross_platform: Đăng lên nhiều nền tảng (FB, IG, Threads, LinkedIn)
- get_platform_stats: Xem thống kê các nền tảng

📣 ADVERTISING:
- create_ad_campaign: Tạo chiến dịch quảng cáo
- list_campaigns: Xem danh sách chiến dịch
- get_campaign_stats: Xem thống kê chiến dịch

📍 PAGES: sabo_billiards (Vũng Tàu), sabo_arena (HCM), ai_newbie (AI community), sabo_media (production)

🧠 QUY TẮC THÔNG MINH:
1. "Đăng bài/post/viết bài" + không nói lên lịch → post_facebook (đăng NGAY)
2. "Lên lịch/schedule/hẹn giờ/sau này/tối/sáng mai" → schedule_post
3. "Giờ nào tốt/best time/khi nào nên đăng" → get_suggested_times
4. "A/B test/thử nghiệm/so sánh nội dung/test variants" → create_ab_test
5. "Carousel/nhiều ảnh/slide/story" → create_carousel
6. "Đăng lên tất cả/cross-platform/nhiều kênh/IG+FB" → publish_cross_platform
7. "Xem kết quả test/winner/variant nào tốt" → get_ab_results
8. Nếu đề cập ảnh/hình/image → set includeImage=true
9. Mặc định includeImage=true cho mọi bài post

🕐 SCHEDULE KEYWORDS (Vietnamese):
- "lên lịch", "hẹn giờ", "schedule", "đăng sau", "đăng tối", "đăng sáng"
- "ngày mai", "cuối tuần", "tối nay", "lúc X giờ"
- Nếu có từ này → dùng schedule_post thay vì post_facebook

Trả về JSON:
{
  "action": "action_name",
  "confidence": 0.0-1.0,
  "params": { 
    "page": "sabo_arena",
    "topic": "chủ đề",
    "includeImage": true,
    "imageHint": "gợi ý loại ảnh nếu có",
    "scheduledTime": "ISO string nếu user chỉ định giờ cụ thể",
    "postType": "promotion|event|entertainment|educational|default",
    "platforms": ["facebook", "instagram"],
    "variantCount": 3,
    "strategy": "tone|cta|length|hook|mixed",
    "slideCount": 5,
    "theme": "story|tips|showcase|comparison|journey|countdown"
  },
  "reasoning": "giải thích ngắn tại sao chọn action này"
}`,
      },
      {
        role: 'user',
        content: message,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content);
    console.log(`🧠 Intent detected: ${result.action} (${result.confidence}) - ${result.reasoning || ''}`);
    return result;
  } catch {
    return { action: 'none', confidence: 0 };
  }
}

/**
 * Execute detected action
 */
async function executeAction(actionName, params) {
  const action = AVAILABLE_ACTIONS[actionName];
  if (!action) {
    return {
      success: false,
      error: `Unknown action: ${actionName}`,
    };
  }

  try {
    const result = await action.executor(params);
    return {
      success: true,
      action: actionName,
      result,
    };
  } catch (error) {
    console.error(`Action ${actionName} failed:`, error);
    return {
      success: false,
      action: actionName,
      error: error.message,
    };
  }
}

/**
 * Main function: Process message, detect intent, execute if needed
 */
async function processWithActions(message, agentRole) {
  // Step 1: Detect intent
  const intent = await detectIntent(message);
  
  // Step 2: If action detected with high confidence, execute it
  if (intent.action !== 'none' && intent.confidence >= 0.7) {
    // Check if clarification needed (and is actually a question, not empty/null)
    const needsClarification = intent.clarification_needed && 
      intent.clarification_needed.trim() !== '' &&
      !intent.clarification_needed.toLowerCase().includes('không cần') &&
      !intent.clarification_needed.toLowerCase().includes('đủ thông tin');
      
    if (needsClarification) {
      return {
        type: 'clarification',
        message: intent.clarification_needed,
        detectedAction: intent.action,
      };
    }

    // Execute action
    const actionResult = await executeAction(intent.action, intent.params);
    
    return {
      type: 'action_executed',
      action: intent.action,
      params: intent.params,
      result: actionResult,
    };
  }

  // Step 3: No action needed, just return for normal chat
  return {
    type: 'chat_only',
    intent,
  };
}

/**
 * Get context info for each Facebook page
 */
function getPageContext(pageKey) {
  const pageContexts = {
    'sabo_billiards': {
      name: 'SABO Billiards',
      description: 'Câu lạc bộ Billiards chuyên nghiệp',
      location: 'Vũng Tàu',
      tone: 'thân thiện, thể thao, năng động',
      keywords: ['billiards', 'snooker', 'pool', 'carom', 'thể thao'],
    },
    'sabo_arena': {
      name: 'SABO Arena',
      description: 'Billiards club & entertainment center',
      location: '96 Bạch Đằng, Tân Bình, HCM',
      tone: 'chuyên nghiệp, trẻ trung, cộng đồng',
      keywords: ['billiards', 'gaming', 'giải đấu', 'entertainment', 'cafe'],
      highlights: ['Không gian hiện đại', 'Bàn xịn', 'Cộng đồng đông đảo', 'Giải đấu hàng tuần'],
    },
    'ai_newbie': {
      name: 'AI Newbie VN', 
      description: 'Cộng đồng học AI cho người mới',
      tone: 'học thuật nhưng dễ hiểu, khích lệ',
      keywords: ['AI', 'machine learning', 'học AI', 'ChatGPT', 'automation'],
    },
    'sabo_media': {
      name: 'SABO Media',
      description: 'Production & Creative Agency',
      tone: 'sáng tạo, chuyên nghiệp',
      keywords: ['video', 'photography', 'content', 'production'],
    },
  };
  
  return pageContexts[pageKey] || pageContexts['sabo_arena'];
}

/**
 * Generate smart, creative content using AI
 */
async function generateSmartContent(topic, pageContext) {
  const systemPrompt = `Bạn là copywriter sáng tạo cho ${pageContext.name}.

📍 Về ${pageContext.name}:
- ${pageContext.description}
${pageContext.location ? `- Địa chỉ: ${pageContext.location}` : ''}
${pageContext.highlights ? `- Điểm nổi bật: ${pageContext.highlights.join(', ')}` : ''}

🎯 Giọng điệu: ${pageContext.tone}
📝 Keywords: ${pageContext.keywords?.join(', ')}

Quy tắc viết bài:
1. Mở đầu HẤP DẪN (câu hook)
2. Nội dung cô đọng, có GIÁ TRỊ
3. Thêm emoji phù hợp 🎱🔥✨
4. Kết thúc với CALL-TO-ACTION rõ ràng
5. 3-5 hashtags thông minh
6. Độ dài: 100-250 ký tự (lý tưởng cho Facebook)

QUAN TRỌNG: Viết nội dung SÁNG TẠO và ĐỘC ĐÁO, không copy paste topic!`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Viết bài Facebook về: ${topic}` },
    ],
    temperature: 0.8, // Higher creativity
    max_tokens: 400,
  });

  return response.choices[0].message.content;
}

/**
 * Get list of available actions for AI context
 */
function getAvailableActionsDescription() {
  return Object.entries(AVAILABLE_ACTIONS).map(([name, action]) => ({
    name,
    description: action.description,
    params: action.params,
  }));
}

module.exports = {
  detectIntent,
  executeAction,
  processWithActions,
  getAvailableActionsDescription,
  AVAILABLE_ACTIONS,
};
