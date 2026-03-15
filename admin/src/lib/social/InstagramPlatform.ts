/**
 * =================================================================
 * INSTAGRAM PLATFORM - Instagram Graph API Integration
 * =================================================================
 * Supports: Business/Creator accounts only (connected to Facebook Page)
 * API: Instagram Graph API
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

export class InstagramPlatform extends BaseSocialPlatform {
  private readonly API_BASE = 'https://graph.facebook.com/v18.0';

  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super('instagram', credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials.businessAccountId || !this.credentials.accessToken) {
        return false;
      }

      const response = await fetch(
        `${this.API_BASE}/${this.credentials.businessAccountId}?fields=id,username&access_token=${this.credentials.accessToken}`
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

      if (!this.credentials.businessAccountId) {
        throw new Error('Instagram Business Account ID not configured');
      }

      // Instagram requires media for posts
      if (!request.media || request.media.length === 0) {
        throw new Error('Instagram posts require at least one image or video');
      }

      const media = request.media[0];

      // Format caption
      let caption = request.text;

      if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
        const hashtags = this.formatHashtags(request.hashtags).slice(0, 30); // Instagram limit
        caption = `${caption}\n\n${hashtags.join(' ')}`;
      }

      // Step 1: Create media container
      const containerPayload: Record<string, string> = {
        access_token: this.credentials.accessToken || '',
        caption: caption,
      };

      if (media.type === 'image') {
        containerPayload.image_url = media.url;
      } else if (media.type === 'video') {
        containerPayload.video_url = media.url;
        containerPayload.media_type = 'VIDEO';
      }

      // Add location if provided
      if (request.options?.instagramLocation) {
        containerPayload.location_id = request.options.instagramLocation.id;
      }

      // Add collaborators if provided
      if (request.options?.instagramCollaborators) {
        containerPayload.collaborators = JSON.stringify(request.options.instagramCollaborators);
      }

      const containerResponse = await fetch(
        `${this.API_BASE}/${this.credentials.businessAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(containerPayload),
        }
      );

      if (!containerResponse.ok) {
        const error = await containerResponse.json();
        throw new Error(
          `Instagram API error: ${error.error?.message || 'Failed to create media container'}`
        );
      }

      const containerData = (await containerResponse.json()) as { id: string };
      const containerId = containerData.id;

      // Step 2: Publish the media container
      const publishResponse = await fetch(
        `${this.API_BASE}/${this.credentials.businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: this.credentials.accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(`Instagram API error: ${error.error?.message || 'Failed to publish'}`);
      }

      const publishData = (await publishResponse.json()) as { id: string };

      return {
        platform: 'instagram',
        success: true,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}`,
        status: 'published',
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: 'instagram',
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
    if (isHealthy && this.credentials.businessAccountId && this.credentials.accessToken) {
      try {
        const response = await fetch(
          `${this.API_BASE}/${this.credentials.businessAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${this.credentials.accessToken}`
        );

        if (response.ok) {
          const account = (await response.json()) as {
            id: string;
            username: string;
            name: string;
            profile_picture_url?: string;
            followers_count?: number;
          };

          accountInfo = {
            id: account.id,
            username: account.username,
            displayName: account.name,
            profileUrl: `https://instagram.com/${account.username}`,
            avatarUrl: account.profile_picture_url,
            followerCount: account.followers_count,
          };
        }
      } catch (error) {
        console.error('Failed to get Instagram account info:', error);
      }
    }

    return {
      platform: 'instagram',
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
      platform: 'instagram',
      features: {
        textPosts: false, // Instagram requires media
        imagePosts: true,
        videoPosts: true,
        linkPosts: false, // Only in bio or Stories
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
        textLength: 2200,
        hashtagsMax: 30,
        imagesMax: 10,
        videoDurationMax: 60, // 60 seconds for feed, 90 for reels
        fileSizeMax: 100, // MB
        postsPerDay: 25,
      },
    };
  }
}
