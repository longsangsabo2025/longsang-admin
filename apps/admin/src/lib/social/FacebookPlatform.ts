/**
 * =================================================================
 * FACEBOOK PLATFORM - Facebook Graph API Integration
 * =================================================================
 * Supports: Business Pages only (NOT personal profiles)
 * API: Facebook Graph API v18
 */

import {
  PlatformCapabilities,
  PlatformConnection,
  PlatformCredentials,
  PlatformSettings,
  SocialPostRequest,
  SocialPostResponse,
} from '@/types/social-media';
import { BaseSocialPlatform } from './BaseSocialPlatform';

export class FacebookPlatform extends BaseSocialPlatform {
  private readonly API_BASE = 'https://graph.facebook.com/v18.0';

  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super('facebook', credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials.pageId || !this.credentials.accessToken) {
        return false;
      }

      const response = await fetch(
        `${this.API_BASE}/${this.credentials.pageId}?fields=id,name&access_token=${this.credentials.accessToken}`
      );

      return response.ok;
    } catch (error) {
      this.handleError(error);
    }
  }

  async validateCredentials(): Promise<boolean> {
    return await this.authenticate();
  }

  async post(request: SocialPostRequest): Promise<SocialPostResponse> {
    try {
      this.validatePost(request);

      if (!this.credentials.pageId) {
        throw new Error('Facebook Page ID not configured');
      }

      // Format content
      let message = request.text;

      if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
        const hashtags = this.formatHashtags(request.hashtags);
        message = `${message}\n\n${hashtags.join(' ')}`;
      }

      // Prepare payload based on content type
      const payload: Record<string, string> = {
        message: message,
        access_token: this.credentials.accessToken || '',
      };

      // Add link if provided
      if (request.linkUrl) {
        payload.link = request.linkUrl;
      }

      // Add targeting if specified
      if (request.options?.facebookTargeting) {
        payload.targeting = JSON.stringify(request.options.facebookTargeting);
      }

      // Determine endpoint based on media
      let endpoint = `${this.API_BASE}/${this.credentials.pageId}/feed`;

      if (request.media && request.media.length > 0) {
        const media = request.media[0];
        if (media.type === 'image') {
          endpoint = `${this.API_BASE}/${this.credentials.pageId}/photos`;
          payload.url = media.url;
          payload.caption = message;
          delete payload.message;
        } else if (media.type === 'video') {
          endpoint = `${this.API_BASE}/${this.credentials.pageId}/videos`;
          payload.file_url = media.url;
          payload.description = message;
          delete payload.message;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = (await response.json()) as { id: string; post_id?: string };
      const postId = data.post_id || data.id;

      return {
        platform: 'facebook',
        success: true,
        postId: postId,
        postUrl: `https://www.facebook.com/${postId}`,
        status: 'published',
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: 'facebook',
        success: false,
        status: 'failed',
        error: {
          code: 'POST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  async getConnectionStatus(): Promise<PlatformConnection> {
    const isHealthy = await this.testConnection();

    let accountInfo;
    if (isHealthy && this.credentials.pageId && this.credentials.accessToken) {
      try {
        const response = await fetch(
          `${this.API_BASE}/${this.credentials.pageId}?fields=id,name,username,picture,fan_count,verification_status&access_token=${this.credentials.accessToken}`
        );

        if (response.ok) {
          const page = (await response.json()) as {
            id: string;
            name: string;
            username?: string;
            picture?: { data: { url: string } };
            fan_count?: number;
            verification_status?: string;
          };

          accountInfo = {
            id: page.id,
            username: page.username || page.id,
            displayName: page.name,
            profileUrl: page.username
              ? `https://facebook.com/${page.username}`
              : `https://facebook.com/${page.id}`,
            avatarUrl: page.picture?.data?.url,
            followerCount: page.fan_count,
            verified:
              page.verification_status === 'blue_verified' ||
              page.verification_status === 'gray_verified',
          };
        }
      } catch (error) {
        console.error('Failed to get Facebook page info:', error);
      }
    }

    return {
      platform: 'facebook',
      connected: isHealthy,
      accountInfo,
      health: {
        status: isHealthy ? 'healthy' : 'error',
        lastChecked: new Date(),
        message: isHealthy ? 'Connected' : 'Authentication failed',
      },
      credentials: this.credentials,
      settings: this.settings,
    };
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'facebook',
      features: {
        textPosts: true,
        imagePosts: true,
        videoPosts: true,
        linkPosts: true,
        carouselPosts: true,
        stories: true,
        reels: true,
        scheduling: true,
        autoPublish: true,
        hashtags: true,
        mentions: true,
        location: true,
        analytics: true,
        comments: true,
        reactions: true,
      },
      limits: {
        textLength: 63206,
        hashtagsMax: 30,
        imagesMax: 10,
        videoDurationMax: 240 * 60, // 240 minutes
        fileSizeMax: 4096, // 4GB for video
        postsPerDay: 200,
      },
    };
  }
}
