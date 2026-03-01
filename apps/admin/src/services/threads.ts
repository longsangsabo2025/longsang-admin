/**
 * Threads API Service
 *
 * Official Threads API integration for posting text, images, and videos.
 * Threads uses a 2-step process similar to Instagram: Create container → Publish
 *
 * API Documentation: https://developers.facebook.com/docs/threads
 */

const THREADS_API_VERSION = 'v1.0';
const THREADS_API_BASE = `https://graph.threads.net/${THREADS_API_VERSION}`;

// Default account configuration
export const THREADS_CONFIG = {
  userId: import.meta.env.VITE_THREADS_USER_ID || '25295715200066837',
  username: import.meta.env.VITE_THREADS_USERNAME || 'baddie.4296',
  accessToken: import.meta.env.VITE_THREADS_ACCESS_TOKEN || '',
};

export type ThreadsMediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';

interface ThreadsPostResult {
  success: boolean;
  postId?: string;
  containerId?: string;
  error?: string;
}

interface ThreadsProfile {
  id: string;
  username: string;
  threadsProfilePictureUrl?: string;
  threadsBiography?: string;
}

interface ThreadsInsights {
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
}

/**
 * Get Threads profile information
 */
export async function getThreadsProfile(
  userId: string = THREADS_CONFIG.userId,
  accessToken: string = THREADS_CONFIG.accessToken
): Promise<ThreadsProfile> {
  const fields = 'id,username,threads_profile_picture_url,threads_biography';
  const response = await fetch(
    `${THREADS_API_BASE}/${userId}?fields=${fields}&access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    id: data.id,
    username: data.username,
    threadsProfilePictureUrl: data.threads_profile_picture_url,
    threadsBiography: data.threads_biography,
  };
}

/**
 * Create a thread container
 */
async function createThreadContainer(
  userId: string,
  accessToken: string,
  options: {
    mediaType: ThreadsMediaType;
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    children?: string[]; // For carousel
    replyToId?: string;
    linkAttachment?: string;
  }
): Promise<{ id: string }> {
  const params = new URLSearchParams({
    media_type: options.mediaType,
    access_token: accessToken,
  });

  if (options.text) {
    params.append('text', options.text);
  }

  if (options.imageUrl) {
    params.append('image_url', options.imageUrl);
  }

  if (options.videoUrl) {
    params.append('video_url', options.videoUrl);
  }

  if (options.children && options.children.length > 0) {
    params.append('children', options.children.join(','));
  }

  if (options.replyToId) {
    params.append('reply_to_id', options.replyToId);
  }

  if (options.linkAttachment) {
    params.append('link_attachment', options.linkAttachment);
  }

  const response = await fetch(`${THREADS_API_BASE}/${userId}/threads`, {
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
 * Publish a thread container
 */
async function publishThread(
  userId: string,
  containerId: string,
  accessToken: string
): Promise<{ id: string }> {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const response = await fetch(`${THREADS_API_BASE}/${userId}/threads_publish`, {
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
 * Post a text-only thread
 */
export async function postTextThread(
  text: string,
  options?: {
    userId?: string;
    accessToken?: string;
    replyToId?: string;
    linkAttachment?: string;
  }
): Promise<ThreadsPostResult> {
  const userId = options?.userId || THREADS_CONFIG.userId;
  const accessToken = options?.accessToken || THREADS_CONFIG.accessToken;

  try {
    // Step 1: Create container
    const container = await createThreadContainer(userId, accessToken, {
      mediaType: 'TEXT',
      text,
      replyToId: options?.replyToId,
      linkAttachment: options?.linkAttachment,
    });

    // Step 2: Wait briefly
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Publish
    const result = await publishThread(userId, container.id, accessToken);

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
 * Post an image thread
 */
export async function postImageThread(
  imageUrl: string,
  text?: string,
  options?: {
    userId?: string;
    accessToken?: string;
    replyToId?: string;
  }
): Promise<ThreadsPostResult> {
  const userId = options?.userId || THREADS_CONFIG.userId;
  const accessToken = options?.accessToken || THREADS_CONFIG.accessToken;

  try {
    // Step 1: Create container
    const container = await createThreadContainer(userId, accessToken, {
      mediaType: 'IMAGE',
      imageUrl,
      text,
      replyToId: options?.replyToId,
    });

    // Step 2: Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 3: Publish
    const result = await publishThread(userId, container.id, accessToken);

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
 * Post a video thread
 */
export async function postVideoThread(
  videoUrl: string,
  text?: string,
  options?: {
    userId?: string;
    accessToken?: string;
    replyToId?: string;
  }
): Promise<ThreadsPostResult> {
  const userId = options?.userId || THREADS_CONFIG.userId;
  const accessToken = options?.accessToken || THREADS_CONFIG.accessToken;

  try {
    // Step 1: Create container
    const container = await createThreadContainer(userId, accessToken, {
      mediaType: 'VIDEO',
      videoUrl,
      text,
      replyToId: options?.replyToId,
    });

    // Step 2: Poll for video processing completion
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusRes = await fetch(
        `${THREADS_API_BASE}/${container.id}?fields=status,error_message&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();
      if (statusData.status === 'FINISHED') break;
      if (statusData.status === 'ERROR') {
        throw new Error(statusData.error_message || 'Video processing failed');
      }
    }

    // Step 3: Publish
    const result = await publishThread(userId, container.id, accessToken);

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
 * Post a carousel thread (multiple images/videos)
 */
export async function postCarouselThread(
  mediaItems: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
  text?: string,
  options?: {
    userId?: string;
    accessToken?: string;
  }
): Promise<ThreadsPostResult> {
  const userId = options?.userId || THREADS_CONFIG.userId;
  const accessToken = options?.accessToken || THREADS_CONFIG.accessToken;

  try {
    // Step 1: Create containers for each item
    const childContainerIds: string[] = [];

    for (const item of mediaItems) {
      const params = new URLSearchParams({
        media_type: item.type,
        access_token: accessToken,
        is_carousel_item: 'true',
      });

      if (item.type === 'IMAGE') {
        params.append('image_url', item.url);
      } else {
        params.append('video_url', item.url);
      }

      const response = await fetch(`${THREADS_API_BASE}/${userId}/threads`, {
        method: 'POST',
        body: params,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      childContainerIds.push(data.id);
    }

    // Wait for items to process
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Step 2: Create carousel container
    const container = await createThreadContainer(userId, accessToken, {
      mediaType: 'CAROUSEL',
      text,
      children: childContainerIds,
    });

    // Step 3: Publish
    const result = await publishThread(userId, container.id, accessToken);

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
 * Reply to a thread
 */
export async function replyToThread(
  replyToId: string,
  text: string,
  options?: {
    userId?: string;
    accessToken?: string;
    imageUrl?: string;
  }
): Promise<ThreadsPostResult> {
  const userId = options?.userId || THREADS_CONFIG.userId;
  const accessToken = options?.accessToken || THREADS_CONFIG.accessToken;

  try {
    const mediaType = options?.imageUrl ? 'IMAGE' : 'TEXT';

    const container = await createThreadContainer(userId, accessToken, {
      mediaType,
      text,
      imageUrl: options?.imageUrl,
      replyToId,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await publishThread(userId, container.id, accessToken);

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
 * Get insights for a thread post
 */
export async function getThreadInsights(
  mediaId: string,
  accessToken: string = THREADS_CONFIG.accessToken
): Promise<ThreadsInsights> {
  const metrics = 'views,likes,replies,reposts,quotes';
  const response = await fetch(
    `${THREADS_API_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  const insights: ThreadsInsights = {};

  for (const item of data.data || []) {
    switch (item.name) {
      case 'views':
        insights.views = item.values[0]?.value;
        break;
      case 'likes':
        insights.likes = item.values[0]?.value;
        break;
      case 'replies':
        insights.replies = item.values[0]?.value;
        break;
      case 'reposts':
        insights.reposts = item.values[0]?.value;
        break;
      case 'quotes':
        insights.quotes = item.values[0]?.value;
        break;
    }
  }

  return insights;
}

/**
 * Get recent threads from user
 */
export async function getRecentThreads(
  userId: string = THREADS_CONFIG.userId,
  accessToken: string = THREADS_CONFIG.accessToken,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    mediaType: string;
    text?: string;
    permalink: string;
    timestamp: string;
  }>
> {
  const fields = 'id,media_type,text,permalink,timestamp';
  const response = await fetch(
    `${THREADS_API_BASE}/${userId}/threads?fields=${fields}&limit=${limit}&access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return (data.data || []).map((item: any) => ({
    id: item.id,
    mediaType: item.media_type,
    text: item.text,
    permalink: item.permalink,
    timestamp: item.timestamp,
  }));
}

export default {
  THREADS_CONFIG,
  getThreadsProfile,
  postTextThread,
  postImageThread,
  postVideoThread,
  postCarouselThread,
  replyToThread,
  getThreadInsights,
  getRecentThreads,
};
