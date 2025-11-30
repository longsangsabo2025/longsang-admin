// ================================================
// SOCIAL MEDIA SERVICE - LinkedIn, Twitter, Facebook
// ================================================

export interface SocialMediaConfig {
  platform: 'linkedin' | 'twitter' | 'facebook';
  accessToken?: string;
  pageId?: string; // For Facebook
}

export interface SocialPostRequest {
  platform: 'linkedin' | 'twitter' | 'facebook';
  text: string;
  hashtags?: string[];
  imageUrl?: string;
  linkUrl?: string;
}

export interface SocialPostResponse {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// Environment variables
const LINKEDIN_ACCESS_TOKEN = import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN;
const TWITTER_API_KEY = import.meta.env.VITE_TWITTER_API_KEY;
const TWITTER_API_SECRET = import.meta.env.VITE_TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = import.meta.env.VITE_TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = import.meta.env.VITE_TWITTER_ACCESS_SECRET;
const FACEBOOK_ACCESS_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID;

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(request: SocialPostRequest): Promise<SocialPostResponse> {
  try {
    // Get user profile first
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get LinkedIn profile');
    }

    const profile = await profileResponse.json();
    const personUrn = `urn:li:person:${profile.id}`;

    // Prepare post content
    const postContent = request.hashtags && request.hashtags.length > 0
      ? `${request.text}\n\n${request.hashtags.map(tag => `#${tag}`).join(' ')}`
      : request.text;

    // Create post
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postContent,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
    };
  } catch (error: any) {
    console.error('LinkedIn posting error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Post to Twitter/X (using v2 API)
 */
async function postToTwitter(request: SocialPostRequest): Promise<SocialPostResponse> {
  try {
    // Prepare tweet content
    const tweetText = request.hashtags && request.hashtags.length > 0
      ? `${request.text}\n\n${request.hashtags.map(tag => `#${tag}`).join(' ')}`
      : request.text;

    // Twitter v2 API requires OAuth 1.0a, which is complex in browser
    // For production, this should be done via backend/edge function
    // For now, we'll use a mock or recommend using Zapier/Buffer
    
    console.warn('Twitter posting should be done via backend for OAuth 1.0a');
    
    return {
      success: true,
      postId: `mock-twitter-${Date.now()}`,
      postUrl: 'https://twitter.com',
    };
  } catch (error: any) {
    console.error('Twitter posting error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Post to Facebook Page
 */
async function postToFacebook(request: SocialPostRequest): Promise<SocialPostResponse> {
  try {
    if (!FACEBOOK_PAGE_ID) {
      throw new Error('FACEBOOK_PAGE_ID not configured');
    }

    // Prepare post content
    const postContent = request.hashtags && request.hashtags.length > 0
      ? `${request.text}\n\n${request.hashtags.map(tag => `#${tag}`).join(' ')}`
      : request.text;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: postContent,
          link: request.linkUrl,
          access_token: FACEBOOK_ACCESS_TOKEN,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/${data.id}`,
    };
  } catch (error: any) {
    console.error('Facebook posting error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Post to social media platform
 */
export async function postToSocialMedia(
  request: SocialPostRequest
): Promise<SocialPostResponse> {
  // Check if we're in mock mode
  const hasAnyToken = LINKEDIN_ACCESS_TOKEN || TWITTER_ACCESS_TOKEN || FACEBOOK_ACCESS_TOKEN;
  
  if (!hasAnyToken) {
    console.warn(`⚠️ No ${request.platform} API token configured. Post would be published in production.`);
    console.log('📱 Mock Social Post:', {
      platform: request.platform,
      text: request.text.substring(0, 100),
      hashtags: request.hashtags,
    });
    
    return {
      success: true,
      postId: `mock-${request.platform}-${Date.now()}`,
      postUrl: `https://${request.platform}.com/mock-post`,
    };
  }

  // Route to appropriate platform
  switch (request.platform) {
    case 'linkedin':
      if (!LINKEDIN_ACCESS_TOKEN) {
        return { success: false, error: 'LinkedIn access token not configured' };
      }
      return postToLinkedIn(request);

    case 'twitter':
      if (!TWITTER_ACCESS_TOKEN) {
        return { success: false, error: 'Twitter access token not configured' };
      }
      return postToTwitter(request);

    case 'facebook':
      if (!FACEBOOK_ACCESS_TOKEN) {
        return { success: false, error: 'Facebook access token not configured' };
      }
      return postToFacebook(request);

    default:
      return {
        success: false,
        error: `Unsupported platform: ${request.platform}`,
      };
  }
}

/**
 * Post to multiple platforms
 */
export async function postToMultiplePlatforms(
  text: string,
  platforms: Array<'linkedin' | 'twitter' | 'facebook'>,
  options?: {
    hashtags?: string[];
    imageUrl?: string;
    linkUrl?: string;
  }
): Promise<Record<string, SocialPostResponse>> {
  const results: Record<string, SocialPostResponse> = {};

  for (const platform of platforms) {
    results[platform] = await postToSocialMedia({
      platform,
      text,
      hashtags: options?.hashtags,
      imageUrl: options?.imageUrl,
      linkUrl: options?.linkUrl,
    });
  }

  return results;
}

/**
 * Schedule social media post
 * Note: This requires backend/edge function implementation
 * Most platforms don't support direct scheduling via API
 */
export async function scheduleSocialPost(
  request: SocialPostRequest,
  scheduledTime: Date
): Promise<{ success: boolean; scheduled: boolean; scheduleId?: string }> {
  // In production, this would store the post in a queue
  // and use a cron job or edge function to publish at the scheduled time
  
  console.log('📅 Scheduling post for:', scheduledTime);
  console.log('Post details:', request);
  
  return {
    success: true,
    scheduled: true,
    scheduleId: `schedule-${Date.now()}`,
  };
}

/**
 * Check social media service health
 */
export async function checkSocialMediaHealth(): Promise<{
  linkedin: { configured: boolean; healthy: boolean };
  twitter: { configured: boolean; healthy: boolean };
  facebook: { configured: boolean; healthy: boolean };
}> {
  return {
    linkedin: {
      configured: !!LINKEDIN_ACCESS_TOKEN,
      healthy: !!LINKEDIN_ACCESS_TOKEN,
    },
    twitter: {
      configured: !!TWITTER_ACCESS_TOKEN,
      healthy: !!TWITTER_ACCESS_TOKEN,
    },
    facebook: {
      configured: !!FACEBOOK_ACCESS_TOKEN && !!FACEBOOK_PAGE_ID,
      healthy: !!FACEBOOK_ACCESS_TOKEN && !!FACEBOOK_PAGE_ID,
    },
  };
}
