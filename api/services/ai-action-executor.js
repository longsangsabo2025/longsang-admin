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
    params: ['page', 'content', 'imageUrl?', 'scheduledTime?'],
    executor: async (params) => {
      return await facebookPublisher.createPost(params.page || 'sabo_billiards', {
        message: params.content,
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
- post_facebook: Đăng bài lên Facebook
- schedule_posts: Lên lịch đăng bài
- create_ad_campaign: Tạo chiến dịch quảng cáo Facebook
- list_campaigns: Xem danh sách chiến dịch
- get_campaign_stats: Xem thống kê chiến dịch
- trigger_workflow: Kích hoạt workflow n8n
- generate_and_post: Tạo nội dung và đăng
- none: Chỉ chat, không cần thực hiện action

Trả về JSON với format:
{
  "action": "action_name hoặc none",
  "confidence": 0.0-1.0,
  "params": { các tham số được trích xuất },
  "clarification_needed": "câu hỏi nếu cần thêm thông tin"
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
