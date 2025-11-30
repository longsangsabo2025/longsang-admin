/**
 * =================================================================
 * YOUTUBE PLATFORM - YouTube Data API Integration
 * =================================================================
 * Supports: YouTube Channels (personal or brand)
 * API: YouTube Data API v3
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

export class YouTubePlatform extends BaseSocialPlatform {
  private readonly API_BASE = "https://www.googleapis.com/youtube/v3";

  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super("youtube", credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials.accessToken) {
        return false;
      }

      const response = await fetch(`${this.API_BASE}/channels?part=id&mine=true`, {
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

      // YouTube requires video for posts
      if (!request.media || request.media.length === 0 || request.media[0].type !== "video") {
        throw new Error("YouTube posts require a video");
      }

      const video = request.media[0];

      // Format description
      let description = request.text;

      if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
        const hashtags = this.formatHashtags(request.hashtags).slice(0, 15); // YouTube limit
        description = `${description}\n\n${hashtags.join(" ")}`;
      }

      // Prepare video metadata
      const metadata = {
        snippet: {
          title: request.text.split("\n")[0].slice(0, 100), // First line as title
          description: description,
          tags: request.options?.youtubeTags || request.hashtags || [],
          categoryId: request.options?.youtubeCategory || "22", // People & Blogs
        },
        status: {
          privacyStatus: request.options?.youtubePrivacy || "public",
          selfDeclaredMadeForKids: false,
        },
      };

      // Note: Actual video upload requires resumable upload protocol
      // This is a simplified version - production needs proper implementation
      const response = await fetch(`${this.API_BASE}/videos?part=snippet,status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`YouTube API error: ${error.error?.message || "Upload failed"}`);
      }

      const data = (await response.json()) as { id: string };

      return {
        platform: "youtube",
        success: true,
        postId: data.id,
        postUrl: `https://www.youtube.com/watch?v=${data.id}`,
        status: "published",
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: "youtube",
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

    let accountInfo;
    if (isHealthy && this.credentials.accessToken) {
      try {
        const response = await fetch(
          `${this.API_BASE}/channels?part=snippet,statistics&mine=true`,
          {
            headers: {
              Authorization: `Bearer ${this.credentials.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            items: Array<{
              id: string;
              snippet: {
                title: string;
                customUrl?: string;
                thumbnails?: { default?: { url: string } };
              };
              statistics: {
                subscriberCount?: string;
              };
            }>;
          };

          if (data.items && data.items.length > 0) {
            const channel = data.items[0];

            accountInfo = {
              id: channel.id,
              username: channel.snippet.customUrl || channel.id,
              displayName: channel.snippet.title,
              profileUrl: `https://youtube.com/channel/${channel.id}`,
              avatarUrl: channel.snippet.thumbnails?.default?.url,
              followerCount: channel.statistics.subscriberCount
                ? Number.parseInt(channel.statistics.subscriberCount)
                : undefined,
            };
          }
        }
      } catch (error) {
        console.error("Failed to get YouTube channel info:", error);
      }
    }

    return {
      platform: "youtube",
      connected: isHealthy,
      accountInfo,
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
      platform: "youtube",
      features: {
        textPosts: false, // YouTube is video-first
        imagePosts: false,
        videoPosts: true,
        linkPosts: false, // Links in description only
        carouselPosts: false,
        stories: false,
        reels: true, // YouTube Shorts
        scheduling: true,
        autoPublish: true,
        hashtags: true,
        mentions: false,
        location: false,
        analytics: true,
        comments: true,
        reactions: true,
      },
      limits: {
        textLength: 5000, // Description
        hashtagsMax: 15,
        imagesMax: 0,
        videoDurationMax: 12 * 60 * 60, // 12 hours
        fileSizeMax: 256000, // 256 GB
        postsPerDay: 100,
      },
    };
  }
}
