/**
 * =================================================================
 * TWITTER/X PLATFORM - Twitter API v2 Integration
 * =================================================================
 * Supports: Personal accounts
 * API: Twitter API v2
 */

import {
  PlatformCapabilities,
  PlatformConnection,
  PlatformCredentials,
  PlatformSettings,
  SocialPostRequest,
  SocialPostResponse,
} from "@/types/social-media";
import { BaseSocialPlatform } from "./BaseSocialPlatform";

export class TwitterPlatform extends BaseSocialPlatform {
  private readonly API_BASE = "https://api.twitter.com/2";

  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super("twitter", credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${this.credentials.bearerToken}`,
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

      // Format tweet content
      let tweetText = request.text;

      if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
        const hashtags = this.formatHashtags(request.hashtags);
        tweetText = `${tweetText}\n\n${hashtags.join(" ")}`;
      }

      // Create tweet payload
      const payload: { text: string; media?: { media_ids: string[] } } = {
        text: tweetText.slice(0, 280), // Twitter limit
      };

      // TODO: Handle media upload separately
      // Media upload requires separate endpoint and OAuth 1.0a

      const response = await fetch(`${this.API_BASE}/tweets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.bearerToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter API error: ${JSON.stringify(error)}`);
      }

      const data = (await response.json()) as { data: { id: string; text: string } };

      return {
        platform: "twitter",
        success: true,
        postId: data.data.id,
        postUrl: `https://twitter.com/i/web/status/${data.data.id}`,
        status: "published",
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: "twitter",
        success: false,
        status: "failed",
        error: {
          code: "POST_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
          details: error,
        },
      };
    }
  }

  async getConnectionStatus(): Promise<PlatformConnection> {
    const isHealthy = await this.testConnection();

    return {
      platform: "twitter",
      connected: isHealthy,
      health: {
        status: isHealthy ? "healthy" : "error",
        lastChecked: new Date(),
        message: isHealthy ? "Connected" : "Authentication failed",
      },
      credentials: this.credentials,
      settings: this.settings,
    };
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: "twitter",
      features: {
        textPosts: true,
        imagePosts: true,
        videoPosts: true,
        linkPosts: true,
        carouselPosts: false,
        stories: false,
        reels: false,
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
        textLength: 280,
        hashtagsMax: 10,
        imagesMax: 4,
        videoDurationMax: 140, // 2:20 for most accounts
        fileSizeMax: 512, // MB for video
        postsPerDay: 300,
      },
    };
  }
}
