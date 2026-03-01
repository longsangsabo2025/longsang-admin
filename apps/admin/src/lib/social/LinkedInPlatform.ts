/**
 * =================================================================
 * LINKEDIN PLATFORM - LinkedIn API Integration
 * =================================================================
 * Supports: Personal profile + Company pages
 * API: LinkedIn Marketing API v2
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

export class LinkedInPlatform extends BaseSocialPlatform {
  private readonly API_BASE = 'https://api.linkedin.com/v2';

  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super('linkedin', credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      });

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

      // Get user profile
      const profileResponse = await fetch(`${this.API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to get LinkedIn profile');
      }

      const profile = (await profileResponse.json()) as { id: string };
      const authorUrn = `urn:li:person:${profile.id}`;

      // Format content
      const content = this.formatContent(request);

      // Create post payload
      const payload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: request.media && request.media.length > 0 ? 'IMAGE' : 'NONE',
            ...(request.media &&
              request.media.length > 0 && {
                media: request.media.map((media) => ({
                  status: 'READY',
                  media: media.url,
                  description: {
                    text: media.alt || '',
                  },
                })),
              }),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility':
            this.settings.defaultVisibility?.toUpperCase() || 'PUBLIC',
        },
      };

      // Post to LinkedIn
      const response = await fetch(`${this.API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
      }

      const data = (await response.json()) as { id: string };

      return {
        platform: 'linkedin',
        success: true,
        postId: data.id,
        postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
        status: 'published',
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: 'linkedin',
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
    if (isHealthy && this.credentials.accessToken) {
      try {
        const response = await fetch(`${this.API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
          },
        });

        if (response.ok) {
          const profile = (await response.json()) as {
            id: string;
            localizedFirstName: string;
            localizedLastName: string;
            profilePicture?: { displayImage?: string };
          };

          accountInfo = {
            id: profile.id,
            username: profile.id,
            displayName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
            profileUrl: `https://www.linkedin.com/in/${profile.id}`,
            avatarUrl: profile.profilePicture?.displayImage,
          };
        }
      } catch (error) {
        console.error('Failed to get LinkedIn account info:', error);
      }
    }

    return {
      platform: 'linkedin',
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
      platform: 'linkedin',
      features: {
        textPosts: true,
        imagePosts: true,
        videoPosts: true,
        linkPosts: true,
        carouselPosts: true,
        stories: false,
        reels: false,
        scheduling: true,
        autoPublish: true,
        hashtags: true,
        mentions: true,
        location: false,
        analytics: true,
        comments: true,
        reactions: true,
      },
      limits: {
        textLength: 3000,
        hashtagsMax: 30,
        imagesMax: 9,
        videoDurationMax: 600, // 10 minutes
        fileSizeMax: 200, // MB
        postsPerDay: 100,
      },
    };
  }

  private formatContent(request: SocialPostRequest): string {
    let content = request.text;

    if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
      const hashtags = this.formatHashtags(request.hashtags);
      content = `${content}\n\n${hashtags.join(' ')}`;
    }

    if (request.linkUrl) {
      content = `${content}\n\n${request.linkUrl}`;
    }

    return content;
  }
}
