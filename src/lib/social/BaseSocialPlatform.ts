/**
 * =================================================================
 * BASE SOCIAL PLATFORM - Abstract Base Class for All Platforms
 * =================================================================
 */

import {
  AuthenticationError,
  PlatformCapabilities,
  PlatformConnection,
  PlatformCredentials,
  PlatformSettings,
  RateLimitError,
  SocialPlatform,
  SocialPostRequest,
  SocialPostResponse,
  ValidationError,
} from "@/types/social-media";

export abstract class BaseSocialPlatform {
  protected platform: SocialPlatform;
  protected credentials: PlatformCredentials;
  protected settings: PlatformSettings;

  constructor(
    platform: SocialPlatform,
    credentials: PlatformCredentials,
    settings: PlatformSettings = {}
  ) {
    this.platform = platform;
    this.credentials = credentials;
    this.settings = {
      defaultVisibility: "public",
      autoHashtags: true,
      maxHashtags: 10,
      imageQuality: "high",
      maxPostsPerDay: 50,
      minIntervalMinutes: 5,
      autoScheduleOptimal: false,
      crossPostEnabled: true,
      notifyOnError: true,
      ...settings,
    };
  }

  /**
   * Abstract methods that each platform must implement
   */
  abstract authenticate(): Promise<boolean>;
  abstract post(request: SocialPostRequest): Promise<SocialPostResponse>;
  abstract validateCredentials(): Promise<boolean>;
  abstract getCapabilities(): PlatformCapabilities;
  abstract getConnectionStatus(): Promise<PlatformConnection>;

  /**
   * Refresh access token (if supported)
   */
  async refreshToken(): Promise<boolean> {
    // Default implementation - override if platform supports token refresh
    return false;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      return await this.validateCredentials();
    } catch (error) {
      console.error(`${this.platform} connection test failed:`, error);
      return false;
    }
  }

  /**
   * Format hashtags
   */
  protected formatHashtags(hashtags: string[]): string[] {
    return hashtags
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .slice(0, this.settings.maxHashtags || 10);
  }

  /**
   * Validate post content
   */
  protected validatePost(request: SocialPostRequest): void {
    const capabilities = this.getCapabilities();

    // Check text length
    if (request.text.length > capabilities.limits.textLength) {
      throw new ValidationError(
        this.platform,
        `Text exceeds maximum length of ${capabilities.limits.textLength} characters`,
        "text"
      );
    }

    // Check hashtags
    if (request.hashtags && request.hashtags.length > capabilities.limits.hashtagsMax) {
      throw new ValidationError(
        this.platform,
        `Too many hashtags. Maximum is ${capabilities.limits.hashtagsMax}`,
        "hashtags"
      );
    }

    // Check media count
    if (request.media && request.media.length > capabilities.limits.imagesMax) {
      throw new ValidationError(
        this.platform,
        `Too many media attachments. Maximum is ${capabilities.limits.imagesMax}`,
        "media"
      );
    }
  }

  /**
   * Handle API errors
   */
  protected handleError(error: unknown): never {
    const err = error as {
      response?: { status: number; data?: { message?: string }; headers?: Record<string, string> };
      message?: string;
    };

    if (err.response) {
      const status = err.response.status;
      const message = err.response.data?.message || err.message || "Unknown error";

      if (status === 401 || status === 403) {
        throw new AuthenticationError(this.platform, message);
      }

      if (status === 429) {
        const retryAfter = err.response.headers?.["retry-after"];
        throw new RateLimitError(
          this.platform,
          retryAfter ? Number.parseInt(retryAfter) : undefined,
          message
        );
      }

      throw new Error(`${this.platform} API error: ${message}`);
    }

    throw error;
  }

  /**
   * Get platform name
   */
  getPlatform(): SocialPlatform {
    return this.platform;
  }

  /**
   * Update credentials
   */
  updateCredentials(credentials: Partial<PlatformCredentials>): void {
    this.credentials = { ...this.credentials, ...credentials };
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<PlatformSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): PlatformSettings {
    return { ...this.settings };
  }
}
