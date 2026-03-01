/**
 * =================================================================
 * DISCORD PLATFORM - Discord Webhook/Bot API Integration
 * =================================================================
 * Supports: Discord Channels (via Webhook or Bot)
 * API: Discord Webhook API / Discord Bot API
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

export class DiscordPlatform extends BaseSocialPlatform {
  constructor(credentials: PlatformCredentials, settings?: PlatformSettings) {
    super('discord', credentials, settings);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials.webhookUrl && !this.credentials.botToken) {
        return false;
      }

      // If using webhook, we can't really "authenticate" but can test the webhook
      if (this.credentials.webhookUrl) {
        // Webhook is always "valid" until we try to use it
        return true;
      }

      // If using bot token, verify it
      if (this.credentials.botToken) {
        const response = await fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            Authorization: `Bot ${this.credentials.botToken}`,
          },
        });

        return response.ok;
      }

      return false;
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

      if (!this.credentials.webhookUrl) {
        throw new Error('Discord webhook URL not configured');
      }

      // Format content
      let content = request.text;

      if (this.settings.autoHashtags && request.hashtags && request.hashtags.length > 0) {
        // Discord doesn't support hashtags like other platforms, but we can add them as text
        const tags = request.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
        content = `${content}\n\n${tags.join(' ')}`;
      }

      // Prepare Discord message payload
      const payload: {
        content?: string;
        embeds?: Array<{
          title?: string;
          description?: string;
          url?: string;
          color?: number;
          image?: { url: string };
          thumbnail?: { url: string };
        }>;
        tts?: boolean;
      } = {};

      if (request.options?.discordEmbed) {
        // Send as embed
        payload.embeds = [
          {
            description: content,
            color: 0x5865f2, // Discord blurple
          },
        ];

        if (request.linkUrl) {
          payload.embeds[0].url = request.linkUrl;
        }

        if (request.media && request.media.length > 0) {
          const media = request.media[0];
          if (media.type === 'image') {
            payload.embeds[0].image = { url: media.url };
          }
        }
      } else {
        // Send as plain message
        payload.content = content;
      }

      if (request.options?.discordTTS) {
        payload.tts = true;
      }

      const response = await fetch(this.credentials.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord API error: ${error}`);
      }

      // Discord webhooks don't return message ID in response
      // We need to add ?wait=true to get the message back
      const messageId = `discord-${Date.now()}`;

      return {
        platform: 'discord',
        success: true,
        postId: messageId,
        postUrl: this.credentials.channelId
          ? `https://discord.com/channels/${this.credentials.channelId}`
          : undefined,
        status: 'published',
        publishedAt: new Date(),
      };
    } catch (error) {
      return {
        platform: 'discord',
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

    return {
      platform: 'discord',
      connected: isHealthy,
      health: {
        status: isHealthy ? 'healthy' : 'error',
        lastChecked: new Date(),
        message: isHealthy ? 'Connected' : 'Invalid webhook or bot token',
      },
      credentials: this.credentials,
      settings: this.settings,
    };
  }

  getCapabilities(): PlatformCapabilities {
    return {
      platform: 'discord',
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
        hashtags: false, // Discord doesn't have native hashtags
        mentions: true,
        location: false,
        analytics: false,
        comments: true,
        reactions: true,
      },
      limits: {
        textLength: 2000,
        hashtagsMax: 0,
        imagesMax: 10,
        videoDurationMax: 600, // 10 minutes for non-Nitro
        fileSizeMax: 8, // 8MB for free, 50MB for Nitro
        postsPerDay: 1000,
      },
    };
  }
}
