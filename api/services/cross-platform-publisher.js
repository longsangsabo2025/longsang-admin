/**
 * 📱 Cross-Platform Publisher
 * 
 * Publish content across multiple social media platforms
 * - Facebook → Instagram → Threads → LinkedIn
 * 
 * Features:
 * - Platform-specific content adaptation
 * - Optimal timing per platform
 * - Image resizing/optimization
 * - Hashtag optimization per platform
 * - Retry logic for failed API calls
 * 
 * @author LongSang Admin
 * @version 2.0.0 - Added retry logic
 */

const OpenAI = require('openai');
const fetch = require('node-fetch');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ═══════════════════════════════════════════════════════════════════════════
// RETRY LOGIC CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET', 
    'ENOTFOUND',
    'ESOCKETTIMEDOUT',
    'rate_limit',
    'timeout',
    'network_error',
    '429', // Too Many Requests
    '500', // Internal Server Error
    '502', // Bad Gateway
    '503', // Service Unavailable
    '504', // Gateway Timeout
  ],
};

/**
 * Retry wrapper for async functions
 */
async function withRetry(fn, options = {}) {
  const { 
    maxRetries = RETRY_CONFIG.maxRetries,
    context = 'API Call',
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = error.message || error.code || String(error);
      
      // Check if error is retryable
      const isRetryable = RETRY_CONFIG.retryableErrors.some(
        e => errorMessage.toLowerCase().includes(e.toLowerCase())
      );
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`❌ [${context}] Failed after ${attempt} attempts:`, errorMessage);
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`⚠️ [${context}] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Platform configurations
 */
const PLATFORMS = {
  facebook: {
    name: 'Facebook',
    maxLength: 63206,
    hashtagLimit: 30,
    imageSize: { width: 1200, height: 630 },
    aspectRatios: ['1:1', '4:5', '1.91:1'],
    features: ['links', 'long_form', 'events', 'stories'],
    optimalTimes: ['09:00', '13:00', '16:00'],
  },
  instagram: {
    name: 'Instagram',
    maxLength: 2200,
    hashtagLimit: 30,
    imageSize: { width: 1080, height: 1080 },
    aspectRatios: ['1:1', '4:5', '9:16'],
    features: ['visual_focus', 'stories', 'reels', 'carousel'],
    optimalTimes: ['11:00', '14:00', '19:00'],
    noLinks: true,
  },
  threads: {
    name: 'Threads',
    maxLength: 500,
    hashtagLimit: 5,
    imageSize: { width: 1080, height: 1080 },
    aspectRatios: ['1:1', '4:5'],
    features: ['conversations', 'short_form'],
    optimalTimes: ['08:00', '12:00', '18:00'],
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    hashtagLimit: 5,
    imageSize: { width: 1200, height: 627 },
    aspectRatios: ['1.91:1', '1:1'],
    features: ['professional', 'articles', 'documents'],
    optimalTimes: ['08:00', '10:00', '12:00'],
  },
  tiktok: {
    name: 'TikTok',
    maxLength: 2200,
    hashtagLimit: 5,
    imageSize: { width: 1080, height: 1920 },
    aspectRatios: ['9:16'],
    features: ['video_only', 'short_form', 'trending'],
    optimalTimes: ['19:00', '21:00', '12:00'],
    videoOnly: true,
  },
};

/**
 * Cross-post content to multiple platforms
 * @param {object} content - Original content
 * @param {object} options - Cross-posting options
 * @returns {Promise<object>} Results for each platform
 */
async function crossPost(content, options = {}) {
  try {
    const {
      platforms = ['facebook', 'instagram'],
      sourcePageId = 'sabo_arena',
      adaptContent = true,
      staggerMinutes = 15,
      generatePlatformImages = false,
    } = options;

    console.log(`📱 [CrossPost] Publishing to ${platforms.length} platforms`);

    const results = {
      success: true,
      sourceContent: content,
      platforms: {},
      summary: {
        total: platforms.length,
        successful: 0,
        failed: 0,
      },
    };

    // Adapt content for each platform
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      
      try {
        console.log(`  → Preparing for ${platform}...`);

        // Adapt content for platform
        let adaptedContent = content;
        if (adaptContent) {
          adaptedContent = await adaptContentForPlatform(content, platform);
        }

        // Get publisher for platform
        const publishResult = await publishToPlatform(platform, adaptedContent, {
          sourcePageId,
          delay: i * staggerMinutes * 60 * 1000,
        });

        results.platforms[platform] = {
          success: publishResult.success,
          postId: publishResult.postId,
          adaptedContent: adaptedContent,
          publishedAt: publishResult.publishedAt,
        };

        if (publishResult.success) {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      } catch (error) {
        console.error(`  ✗ Error publishing to ${platform}:`, error.message);
        results.platforms[platform] = {
          success: false,
          error: error.message,
        };
        results.summary.failed++;
      }
    }

    results.success = results.summary.failed === 0;
    return results;
  } catch (error) {
    console.error('[CrossPost] Error:', error);
    throw error;
  }
}

/**
 * Adapt content for a specific platform
 */
async function adaptContentForPlatform(content, platform) {
  const platformConfig = PLATFORMS[platform];
  if (!platformConfig) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Bạn là Social Media Expert chuyên tối ưu nội dung cho từng platform.

Platform: ${platformConfig.name}
Max Length: ${platformConfig.maxLength} characters
Hashtag Limit: ${platformConfig.hashtagLimit}
Features: ${platformConfig.features.join(', ')}
${platformConfig.noLinks ? 'NOTE: Links are not clickable on this platform!' : ''}

Quy tắc tối ưu:
1. Giữ nguyên ý chính nhưng điều chỉnh tone
2. Tối ưu độ dài theo platform
3. Điều chỉnh hashtags (số lượng và style)
4. Thêm/bớt emoji phù hợp
5. Adapt CTA cho platform

Trả về JSON:
{
  "content": "Nội dung đã adapt",
  "hashtags": ["hashtag1", "hashtag2"],
  "changes": ["Thay đổi 1", "Thay đổi 2"],
  "engagementTips": "Gợi ý tăng engagement"
}`,
      },
      {
        role: 'user',
        content: `Adapt nội dung sau cho ${platform}:\n\n${typeof content === 'string' ? content : content.message || content.content}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const result = JSON.parse(response.choices[0].message.content);
  
  return {
    original: content,
    adapted: result.content,
    hashtags: result.hashtags,
    platform,
    changes: result.changes,
    tips: result.engagementTips,
  };
}

/**
 * Publish to a specific platform with retry logic
 */
async function publishToPlatform(platform, content, options = {}) {
  const { sourcePageId, delay = 0, useRetry = true } = options;

  // Wait if staggered
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Wrap platform calls with retry logic for resilience
  const publishWithRetry = useRetry 
    ? (fn, name) => withRetry(fn, name)
    : (fn) => fn();

  switch (platform) {
    case 'facebook':
      return await publishWithRetry(
        () => publishToFacebook(content, sourcePageId),
        'Facebook Publish'
      );
    
    case 'instagram':
      return await publishWithRetry(
        () => publishToInstagram(content, sourcePageId),
        'Instagram Publish'
      );
    
    case 'threads':
      return await publishWithRetry(
        () => publishToThreads(content, sourcePageId),
        'Threads Publish'
      );
    
    case 'linkedin':
      return await publishWithRetry(
        () => publishToLinkedIn(content),
        'LinkedIn Publish'
      );
    
    default:
      return {
        success: false,
        error: `Platform ${platform} not implemented`,
        scheduled: true,
        message: `Content prepared for manual posting to ${platform}`,
      };
  }
}

/**
 * Publish to Facebook
 */
async function publishToFacebook(content, pageId) {
  try {
    const facebookPublisher = require('./facebook-publisher');
    const message = typeof content === 'string' ? content : content.adapted || content.content;
    
    const result = await facebookPublisher.createPost(pageId, {
      message,
      imageUrl: content.imageUrl,
    });

    return {
      success: true,
      platform: 'facebook',
      postId: result.id,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Facebook: ${error.message}`);
  }
}

/**
 * Publish to Instagram (via Facebook Graph API)
 */
async function publishToInstagram(content, sourcePageId) {
  try {
    // Instagram publishing requires:
    // 1. Image must be hosted publicly
    // 2. Use Instagram Graph API through Facebook
    
    const facebookPublisher = require('./facebook-publisher');
    const normalizedPageId = sourcePageId.replace(/_/g, '-');
    const pageConfig = facebookPublisher.pages[normalizedPageId];
    
    // Support both instagram_id and instagramAccountId for backward compatibility
    const instagramId = pageConfig?.instagramAccountId || pageConfig?.instagram_id;
    
    if (!pageConfig) {
      return {
        success: false,
        error: `Page not found: ${normalizedPageId}. Available pages: ${Object.keys(facebookPublisher.pages).join(', ')}`,
        prepared: {
          content: content.adapted || content.content,
          hashtags: content.hashtags,
        },
      };
    }
    
    if (!instagramId) {
      return {
        success: false,
        error: `Instagram account not linked to page: ${pageConfig.name}`,
        prepared: {
          content: content.adapted || content.content,
          hashtags: content.hashtags,
        },
      };
    }

    const message = typeof content === 'string' ? content : content.adapted || content.content;
    const imageUrl = content.imageUrl || content.original?.imageUrl;

    if (!imageUrl) {
      return {
        success: false,
        error: 'Instagram requires an image',
        prepared: { content: message },
      };
    }

    console.log(`📸 [Instagram] Publishing to account ID: ${instagramId} using page token from ${pageConfig.name}`);
    
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: message,
          access_token: pageConfig.token,
        }),
      }
    );

    const container = await containerResponse.json();
    
    if (container.error) {
      console.error(`❌ [Instagram] Container creation failed:`, container.error);
      throw new Error(container.error.message);
    }
    
    console.log(`✅ [Instagram] Container created: ${container.id}`);

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: pageConfig.token,
        }),
      }
    );

    const published = await publishResponse.json();
    
    if (published.error) {
      throw new Error(published.error.message);
    }

    return {
      success: true,
      platform: 'instagram',
      postId: published.id,
      containerId: container.id,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Instagram: ${error.message}`);
  }
}

/**
 * Publish to Threads (Meta's text-based platform)
 */
async function publishToThreads(content, sourcePageId) {
  try {
    // Threads API is similar to Instagram API
    const facebookPublisher = require('./facebook-publisher');
    const pageConfig = facebookPublisher.pages[sourcePageId.replace(/_/g, '-')];
    
    if (!pageConfig?.threadsAccountId) {
      return {
        success: false,
        error: 'Threads account not linked',
        prepared: {
          content: content.adapted || content.content,
        },
      };
    }

    const message = typeof content === 'string' ? content : content.adapted || content.content;

    // Create Threads post (text only for now)
    const response = await fetch(
      `https://graph.threads.net/v1.0/${pageConfig.threadsAccountId}/threads`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageConfig.threadsToken || pageConfig.token}`,
        },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: message,
        }),
      }
    );

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      platform: 'threads',
      postId: result.id,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Threads API might not be available yet
    return {
      success: false,
      error: `Threads: ${error.message}`,
      prepared: {
        content: content.adapted || content.content,
        message: 'Content prepared for manual posting',
      },
    };
  }
}

/**
 * Publish to LinkedIn
 */
async function publishToLinkedIn(content) {
  try {
    const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const linkedinPersonId = process.env.LINKEDIN_PERSON_ID;

    if (!linkedinToken || !linkedinPersonId) {
      return {
        success: false,
        error: 'LinkedIn credentials not configured',
        prepared: {
          content: content.adapted || content.content,
        },
      };
    }

    const message = typeof content === 'string' ? content : content.adapted || content.content;

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedinToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${linkedinPersonId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: message },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const result = await response.json();
    
    if (result.status && result.status !== 201) {
      throw new Error(result.message || 'LinkedIn API error');
    }

    return {
      success: true,
      platform: 'linkedin',
      postId: result.id,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: `LinkedIn: ${error.message}`,
      prepared: {
        content: content.adapted || content.content,
      },
    };
  }
}

/**
 * Preview how content will look on each platform
 */
async function previewCrossPost(content, platforms = ['facebook', 'instagram', 'threads']) {
  const previews = {};

  for (const platform of platforms) {
    const adapted = await adaptContentForPlatform(content, platform);
    const config = PLATFORMS[platform];
    
    previews[platform] = {
      content: adapted.adapted,
      hashtags: adapted.hashtags,
      changes: adapted.changes,
      tips: adapted.tips,
      characterCount: adapted.adapted.length,
      maxLength: config.maxLength,
      withinLimit: adapted.adapted.length <= config.maxLength,
      optimalPostingTimes: config.optimalTimes,
    };
  }

  return {
    success: true,
    previews,
    recommendation: generateCrossPostRecommendation(previews),
  };
}

/**
 * Generate cross-posting recommendations
 */
function generateCrossPostRecommendation(previews) {
  const recommendations = [];

  if (previews.instagram && !previews.instagram.withinLimit) {
    recommendations.push('Instagram: Cần rút gọn nội dung để phù hợp giới hạn ký tự');
  }

  if (previews.threads && previews.threads.hashtags?.length > 5) {
    recommendations.push('Threads: Giảm số hashtag xuống tối đa 5');
  }

  if (Object.values(previews).every(p => p.withinLimit)) {
    recommendations.push('✅ Nội dung phù hợp với tất cả platforms');
  }

  return recommendations;
}

/**
 * Get optimal cross-posting schedule
 */
function getCrossPostSchedule(platforms) {
  const schedule = [];
  const baseTime = new Date();

  platforms.forEach((platform, index) => {
    const config = PLATFORMS[platform];
    if (!config) return;

    const optimalTime = config.optimalTimes[0];
    const [hour, minute] = optimalTime.split(':').map(Number);
    
    const postTime = new Date(baseTime);
    postTime.setHours(hour, minute, 0, 0);
    
    // If time already passed today, schedule for tomorrow
    if (postTime <= baseTime) {
      postTime.setDate(postTime.getDate() + 1);
    }

    // Stagger by 30 minutes if multiple posts at same time
    postTime.setMinutes(postTime.getMinutes() + index * 30);

    schedule.push({
      platform,
      scheduledTime: postTime.toISOString(),
      localTime: postTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      reason: `Optimal time for ${platform}: ${optimalTime}`,
    });
  });

  return schedule.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
}

module.exports = {
  // Main API functions (aliased for routes)
  publishToAll: crossPost,
  adaptContentForPlatform,
  publishToPlatform,
  getAvailablePlatforms: async () => {
    const facebookPublisher = require('./facebook-publisher');
    
    return Object.entries(PLATFORMS).map(([key, config]) => {
      let status = 'not_configured';
      
      if (key === 'facebook') {
        status = facebookPublisher.pages ? 'connected' : 'not_configured';
      } else if (key === 'instagram') {
        // Check if any page has Instagram linked
        const hasInstagram = Object.values(facebookPublisher.pages || {}).some(p => p.instagramAccountId);
        status = hasInstagram ? 'connected' : 'not_configured';
      } else if (key === 'linkedin') {
        status = process.env.LINKEDIN_ACCESS_TOKEN ? 'connected' : 'not_configured';
      }
      
      return {
        id: key,
        name: config.name,
        status,
        features: config.features,
        maxLength: config.maxLength,
        hashtagLimit: config.hashtagLimit,
        optimalTimes: config.optimalTimes,
      };
    });
  },
  getPlatformStats: async (pageId, days = 30) => {
    // Return mock stats for now (would integrate with actual platform analytics)
    return {
      pageId: pageId || 'all',
      period: `${days} days`,
      platforms: {
        facebook: { posts: 0, engagement: 0, reach: 0 },
        instagram: { posts: 0, engagement: 0, reach: 0 },
        threads: { posts: 0, engagement: 0, reach: 0 },
        linkedin: { posts: 0, engagement: 0, reach: 0 },
      },
      topPlatform: 'facebook',
      recommendation: 'Continue focusing on Facebook while building Instagram presence',
    };
  },
  syncConnectedAccounts: async () => {
    const facebookPublisher = require('./facebook-publisher');
    const accounts = [];
    
    // Sync Facebook pages
    if (facebookPublisher.pages) {
      Object.entries(facebookPublisher.pages).forEach(([key, page]) => {
        accounts.push({
          platform: 'facebook',
          id: page.id,
          name: page.name,
          status: 'connected',
        });
        
        if (page.instagramAccountId) {
          accounts.push({
            platform: 'instagram',
            id: page.instagramAccountId,
            linkedTo: page.name,
            status: 'connected',
          });
        }
      });
    }
    
    return {
      success: true,
      accounts,
      lastSync: new Date().toISOString(),
    };
  },
  
  // Original exports
  crossPost,
  previewCrossPost,
  getCrossPostSchedule,
  PLATFORMS,
  
  // Retry utilities (can be used by other services)
  withRetry,
  RETRY_CONFIG,
};
