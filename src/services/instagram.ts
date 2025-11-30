/**
 * Instagram Graph API Service
 * 
 * This service handles posting to Instagram Business accounts via Facebook Graph API.
 * Instagram requires a 2-step process: Create container → Publish
 * 
 * Requirements:
 * - Instagram Business or Creator account linked to Facebook Page
 * - Page Access Token with instagram_content_publish permission
 */

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Instagram accounts mapped to their Page tokens
export const INSTAGRAM_ACCOUNTS = {
  saboBilliards: {
    id: '17841474279844606',
    username: 'sabobilliard',
    pageTokenEnv: 'FACEBOOK_PAGE_ACCESS_TOKEN', // Main page
  },
  saboMedia: {
    id: '17841472718907470', 
    username: 'sabomediavt',
    pageTokenEnv: 'FACEBOOK_PAGE_SABO_MEDIA_TOKEN',
  },
  aiNewbieVn: {
    id: '17841474205608601',
    username: 'newbiehocmake',
    pageTokenEnv: 'FACEBOOK_PAGE_AI_NEWBIE_VN_TOKEN',
  },
  saboBidaShop: {
    id: '17841472893889754',
    username: 'sabobidashop',
    pageTokenEnv: 'FACEBOOK_PAGE_SABO_BILLIARD_SHOP_TOKEN',
  },
  lsFusionLab: {
    id: '17841472996653110',
    username: 'lsfusionlab',
    pageTokenEnv: 'FACEBOOK_PAGE_AI_ART_NEWBIE_TOKEN',
  },
} as const;

export type InstagramAccountKey = keyof typeof INSTAGRAM_ACCOUNTS;

interface InstagramPostResult {
  success: boolean;
  postId?: string;
  containerId?: string;
  error?: string;
}

interface InstagramMediaContainer {
  id: string;
}

interface InstagramPublishResult {
  id: string;
}

interface InstagramInsights {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  saved?: number;
}

/**
 * Get Instagram account info
 */
export async function getInstagramAccountInfo(
  instagramId: string,
  accessToken: string
): Promise<{
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
}> {
  const fields = 'id,username,name,profile_picture_url,followers_count,follows_count,media_count';
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramId}?fields=${fields}&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return {
    id: data.id,
    username: data.username,
    name: data.name,
    profilePictureUrl: data.profile_picture_url,
    followersCount: data.followers_count,
    followsCount: data.follows_count,
    mediaCount: data.media_count,
  };
}

/**
 * Create a media container for Instagram
 * This is step 1 of the posting process
 */
async function createMediaContainer(
  instagramId: string,
  accessToken: string,
  options: {
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
    locationId?: string;
    userTags?: Array<{ username: string; x: number; y: number }>;
  }
): Promise<InstagramMediaContainer> {
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  if (options.imageUrl) {
    params.append('image_url', options.imageUrl);
  }
  
  if (options.videoUrl) {
    params.append('video_url', options.videoUrl);
    params.append('media_type', 'VIDEO');
  }
  
  if (options.caption) {
    params.append('caption', options.caption);
  }
  
  if (options.locationId) {
    params.append('location_id', options.locationId);
  }
  
  if (options.userTags && options.userTags.length > 0) {
    params.append('user_tags', JSON.stringify(options.userTags));
  }

  const response = await fetch(`${GRAPH_API_BASE}/${instagramId}/media`, {
    method: 'POST',
    body: params,
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data;
}

/**
 * Check if media container is ready for publishing
 */
async function checkContainerStatus(
  containerId: string,
  accessToken: string
): Promise<'FINISHED' | 'IN_PROGRESS' | 'ERROR'> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data.status_code;
}

/**
 * Publish a media container to Instagram
 * This is step 2 of the posting process
 */
async function publishMedia(
  instagramId: string,
  containerId: string,
  accessToken: string
): Promise<InstagramPublishResult> {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const response = await fetch(`${GRAPH_API_BASE}/${instagramId}/media_publish`, {
    method: 'POST',
    body: params,
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data;
}

/**
 * Post an image to Instagram
 * @param instagramId - Instagram Business Account ID
 * @param accessToken - Page Access Token with instagram_content_publish permission
 * @param imageUrl - Public URL of the image (must be accessible by Facebook servers)
 * @param caption - Caption for the post (max 2200 characters)
 */
export async function postImageToInstagram(
  instagramId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<InstagramPostResult> {
  try {
    // Step 1: Create media container
    const container = await createMediaContainer(instagramId, accessToken, {
      imageUrl,
      caption,
    });
    
    // Step 2: Wait for processing (usually instant for images)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Publish
    const result = await publishMedia(instagramId, container.id, accessToken);
    
    return {
      success: true,
      postId: result.id,
      containerId: container.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Post a video (Reel) to Instagram
 * @param instagramId - Instagram Business Account ID
 * @param accessToken - Page Access Token with instagram_content_publish permission
 * @param videoUrl - Public URL of the video (MP4, max 60s for feed, 90s for Reels)
 * @param caption - Caption for the post
 */
export async function postVideoToInstagram(
  instagramId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<InstagramPostResult> {
  try {
    // Step 1: Create media container
    const container = await createMediaContainer(instagramId, accessToken, {
      videoUrl,
      caption,
    });
    
    // Step 2: Wait for video processing (can take a while)
    let status: string = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
      status = await checkContainerStatus(container.id, accessToken);
      attempts++;
    }
    
    if (status !== 'FINISHED') {
      throw new Error(`Video processing failed or timed out. Status: ${status}`);
    }
    
    // Step 3: Publish
    const result = await publishMedia(instagramId, container.id, accessToken);
    
    return {
      success: true,
      postId: result.id,
      containerId: container.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a carousel (multiple images/videos) post
 */
export async function postCarouselToInstagram(
  instagramId: string,
  accessToken: string,
  mediaItems: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
  caption: string
): Promise<InstagramPostResult> {
  try {
    // Step 1: Create containers for each item
    const childContainerIds: string[] = [];
    
    for (const item of mediaItems) {
      const params = new URLSearchParams({
        access_token: accessToken,
        is_carousel_item: 'true',
      });
      
      if (item.type === 'IMAGE') {
        params.append('image_url', item.url);
      } else {
        params.append('video_url', item.url);
        params.append('media_type', 'VIDEO');
      }
      
      const response = await fetch(`${GRAPH_API_BASE}/${instagramId}/media`, {
        method: 'POST',
        body: params,
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      childContainerIds.push(data.id);
    }
    
    // Wait for all items to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Create carousel container
    const carouselParams = new URLSearchParams({
      access_token: accessToken,
      media_type: 'CAROUSEL',
      children: childContainerIds.join(','),
      caption,
    });
    
    const carouselResponse = await fetch(`${GRAPH_API_BASE}/${instagramId}/media`, {
      method: 'POST',
      body: carouselParams,
    });
    
    const carouselData = await carouselResponse.json();
    
    if (carouselData.error) {
      throw new Error(carouselData.error.message);
    }
    
    // Step 3: Publish carousel
    const result = await publishMedia(instagramId, carouselData.id, accessToken);
    
    return {
      success: true,
      postId: result.id,
      containerId: carouselData.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get insights for an Instagram post
 */
export async function getPostInsights(
  mediaId: string,
  accessToken: string
): Promise<InstagramInsights> {
  const metrics = 'impressions,reach,likes,comments_count,saved';
  const response = await fetch(
    `${GRAPH_API_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  const insights: InstagramInsights = {};
  
  for (const item of data.data || []) {
    switch (item.name) {
      case 'impressions':
        insights.impressions = item.values[0]?.value;
        break;
      case 'reach':
        insights.reach = item.values[0]?.value;
        break;
      case 'likes':
        insights.likes = item.values[0]?.value;
        break;
      case 'comments_count':
        insights.comments = item.values[0]?.value;
        break;
      case 'saved':
        insights.saved = item.values[0]?.value;
        break;
    }
  }
  
  return insights;
}

/**
 * Get recent media from Instagram account
 */
export async function getRecentMedia(
  instagramId: string,
  accessToken: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  caption: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}>> {
  const fields = 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count';
  const response = await fetch(
    `${GRAPH_API_BASE}/${instagramId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return (data.data || []).map((item: any) => ({
    id: item.id,
    mediaType: item.media_type,
    mediaUrl: item.media_url,
    permalink: item.permalink,
    caption: item.caption,
    timestamp: item.timestamp,
    likeCount: item.like_count,
    commentsCount: item.comments_count,
  }));
}

export default {
  INSTAGRAM_ACCOUNTS,
  getInstagramAccountInfo,
  postImageToInstagram,
  postVideoToInstagram,
  postCarouselToInstagram,
  getPostInsights,
  getRecentMedia,
};
