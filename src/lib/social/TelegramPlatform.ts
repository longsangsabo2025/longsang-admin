/**
 * =================================================================
 * TELEGRAM PLATFORM - Telegram Bot API Integration
 * =================================================================
 * Supports: Channels & Groups
 * API: Telegram Bot API
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

export class TelegramPlatform extends BaseSocialPlatform {
  private readonly API_BASE = "https://api.telegram.org";

  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super("telegram", credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/bot${this.credentials.botToken}/getMe`);

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

      const chatId = this.credentials.channelId || "";
      let text = request.text;

      if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
        const hashtags = this.formatHashtags(request.hashtags);
        text = `${text}\n\n${hashtags.join(" ")}`;
      }

      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: request.options?.telegramParseMode || "HTML",
        disable_notification: request.options?.telegramDisableNotification || false,
      };

      const response = await fetch(`${this.API_BASE}/bot${this.credentials.botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
      }

      const data = (await response.json()) as {
        result: { message_id: number; chat: { id: number; username?: string } };
      };

      return {
        platform: "telegram",
        success: true,
        postId: data.result.message_id.toString(),
        postUrl: data.result.chat.username
          ? `https://t.me/${data.result.chat.username}/${data.result.message_id}`
          : undefined,
        status: "published",
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: "telegram",
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
      platform: "telegram",
      connected: isHealthy,
      health: {
        status: isHealthy ? "healthy" : "error",
        lastChecked: new Date(),
        message: isHealthy ? "Connected" : "Invalid bot token",
      },
      credentials: this.credentials,
      settings: this.settings,
    };
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: "telegram",
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
        location: false,
        analytics: false,
        comments: true,
        reactions: true,
      },
      limits: {
        textLength: 4096,
        hashtagsMax: 50,
        imagesMax: 10,
        videoDurationMax: 3600,
        fileSizeMax: 2000, // 2GB
        postsPerDay: 1000,
      },
    };
  }
}
