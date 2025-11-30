/**
 * AI Action Executor
 * Connects AI Agent responses to actual service execution
 * 
 * When AI detects actionable intents, this executor runs the corresponding services
 */

const { FacebookAdsManager } = require('./facebook-ads-manager');
const facebookPublisher = require('./facebook-publisher');
const n8nService = require('./n8n-service');
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
  // Facebook/Instagram Posts
  'post_facebook': {
    description: 'Post content to Facebook page',
    params: ['page', 'content', 'topic?', 'imageUrl?', 'scheduledTime?'],
    executor: async (params) => {
      let finalContent = params.content;
      
      // Auto-generate smart content if content is too short or looks like a topic
      const needsGeneration = !finalContent || 
        finalContent.length < 50 || 
        !finalContent.includes(' ') || // Single word = topic
        finalContent.toLowerCase().startsWith('giới thiệu') ||
        finalContent.toLowerCase().startsWith('quảng bá');
      
      if (needsGeneration) {
        const topic = params.topic || params.content || 'general update';
        const pageInfo = getPageContext(params.page);
        
        console.log(`🎨 Auto-generating content for topic: "${topic}"`);
        
        try {
          finalContent = await generateSmartContent(topic, pageInfo);
          console.log(`✅ Generated content (${finalContent?.length} chars):`, finalContent?.substring(0, 100));
        } catch (genError) {
          console.error('❌ Content generation failed:', genError.message);
          // Fallback to original content if generation fails
          finalContent = params.content || topic;
        }
      }
      
      return await facebookPublisher.createPost(params.page || 'sabo_billiards', {
        message: finalContent,
        imageUrl: params.imageUrl,
        scheduledTime: params.scheduledTime,
      });
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
        content: `Bạn là AI assistant phân tích intent từ tin nhắn người dùng.
        
Các actions có thể thực hiện:
- post_facebook: Đăng bài lên Facebook (params: page, content, topic)
- schedule_posts: Lên lịch đăng bài
- create_ad_campaign: Tạo chiến dịch quảng cáo Facebook
- list_campaigns: Xem danh sách chiến dịch quảng cáo
- get_campaign_stats: Xem thống kê chiến dịch
- create_event: Tạo sự kiện Facebook (params: page, name, description, startTime)
- list_pages: Liệt kê các trang Facebook
- get_page_posts: Xem bài đăng gần đây (params: page, limit)
- trigger_workflow: Kích hoạt workflow n8n
- generate_and_post: Tạo nội dung và đăng

Các page có sẵn: sabo_billiards, sabo_arena, ai_newbie, sabo_media

QUAN TRỌNG - Detect intent chủ động:
1. "Đăng bài", "post", "viết bài", "đăng lên" → post_facebook
2. "Giới thiệu về X", "quảng bá X" → post_facebook với topic=X
3. Nếu có đề cập tên page → set page tương ứng
4. "Xem campaigns", "list ads" → list_campaigns
5. "Thống kê", "báo cáo" → get_campaign_stats

Nếu người dùng đề cập đến việc tạo nội dung hoặc đăng bài, LUÔN trả về action với confidence cao.
Nếu topic được đề cập, set vào params.topic (không cần content đầy đủ).

Trả về JSON với format:
{
  "action": "action_name",
  "confidence": 0.0-1.0,
  "params": { 
    "page": "detected_page hoặc mặc định sabo_arena",
    "topic": "chủ đề được đề cập",
    "content": "nội dung nếu có, nếu không thì null"
  },
  "clarification_needed": null
}`,
      },
      {
        role: 'user',
        content: message,
      },
    ],
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(response.choices[0].message.content);
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
