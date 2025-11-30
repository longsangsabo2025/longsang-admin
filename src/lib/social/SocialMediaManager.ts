/**
 * =================================================================
 * SOCIAL MEDIA MANAGER - Unified Manager for All Platforms
 * =================================================================
 * Central hub for managing all social media platforms
 */

import {
  BulkPostResponse,
  PlatformCapabilities,
  PlatformConnection,
  PlatformCredentials,
  PlatformSettings,
  SocialPlatform,
  SocialPostRequest,
  SocialPostResponse,
} from "@/types/social-media";

import { BaseSocialPlatform } from "./BaseSocialPlatform";
import { DiscordPlatform } from "./DiscordPlatform";
import { FacebookPlatform } from "./FacebookPlatform";
import { InstagramPlatform } from "./InstagramPlatform";
import { LinkedInPlatform } from "./LinkedInPlatform";
import { TelegramPlatform } from "./TelegramPlatform";
import { TwitterPlatform } from "./TwitterPlatform";
import { YouTubePlatform } from "./YouTubePlatform";

export class SocialMediaManager {
  private platforms: Map<SocialPlatform, BaseSocialPlatform>;

  constructor() {
    this.platforms = new Map();
  }

  /**
   * Register a platform with credentials
   */
  registerPlatform(
    platform: SocialPlatform,
    credentials: PlatformCredentials,
    settings?: PlatformSettings
  ): void {
    let platformInstance: BaseSocialPlatform;

    switch (platform) {
      case "linkedin":
        platformInstance = new LinkedInPlatform(credentials, settings);
        break;
      case "twitter":
        platformInstance = new TwitterPlatform(credentials, settings);
        break;
      case "telegram":
        platformInstance = new TelegramPlatform(credentials, settings);
        break;
      case "facebook":
        platformInstance = new FacebookPlatform(credentials, settings);
        break;
      case "instagram":
        platformInstance = new InstagramPlatform(credentials, settings);
        break;
      case "youtube":
        platformInstance = new YouTubePlatform(credentials, settings);
        break;
      case "discord":
        platformInstance = new DiscordPlatform(credentials, settings);
        break;
      default:
        throw new Error(`Platform ${platform} is not supported`);
    }

    this.platforms.set(platform, platformInstance);
  }

  /**
   * Unregister a platform
   */
  unregisterPlatform(platform: SocialPlatform): void {
    this.platforms.delete(platform);
  }

  /**
   * Check if platform is registered
   */
  isPlatformRegistered(platform: SocialPlatform): boolean {
    return this.platforms.has(platform);
  }

  /**
   * Get registered platforms
   */
  getRegisteredPlatforms(): SocialPlatform[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Post to a single platform
   */
  async postToPlatform(
    platform: SocialPlatform,
    request: SocialPostRequest
  ): Promise<SocialPostResponse> {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      return {
        platform,
        success: false,
        status: "failed",
        error: {
          code: "PLATFORM_NOT_REGISTERED",
          message: `Platform ${platform} is not registered`,
        },
      };
    }

    return await platformInstance.post(request);
  }

  /**
   * Post to multiple platforms simultaneously
   */
  async postToMultiplePlatforms(request: SocialPostRequest): Promise<BulkPostResponse> {
    const requestId = `bulk-${Date.now()}`;
    const timestamp = new Date();
    const results: SocialPostResponse[] = [];

    // Post to all specified platforms in parallel
    const postPromises = request.platforms.map(async (platform) => {
      const platformRequest: SocialPostRequest = {
        ...request,
        platforms: [platform], // Single platform per request
      };

      const result = await this.postToPlatform(platform, platformRequest);
      results.push(result);
      return result;
    });

    await Promise.allSettled(postPromises);

    // Calculate summary
    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success && r.status === "failed").length,
      pending: results.filter((r) => r.status === "scheduled").length,
    };

    return {
      requestId,
      timestamp,
      results,
      summary,
    };
  }

  /**
   * Test connection for a platform
   */
  async testConnection(platform: SocialPlatform): Promise<boolean> {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      throw new Error(`Platform ${platform} is not registered`);
    }

    return await platformInstance.testConnection();
  }

  /**
   * Test connections for all registered platforms
   */
  async testAllConnections(): Promise<Record<SocialPlatform, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [platform, instance] of this.platforms.entries()) {
      results[platform] = await instance.testConnection();
    }

    return results as Record<SocialPlatform, boolean>;
  }

  /**
   * Get connection status for a platform
   */
  async getConnectionStatus(platform: SocialPlatform): Promise<PlatformConnection> {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      throw new Error(`Platform ${platform} is not registered`);
    }

    return await platformInstance.getConnectionStatus();
  }

  /**
   * Get connection status for all registered platforms
   */
  async getAllConnectionStatuses(): Promise<PlatformConnection[]> {
    const statuses: PlatformConnection[] = [];

    for (const instance of this.platforms.values()) {
      const status = await instance.getConnectionStatus();
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Get capabilities for a platform
   */
  getCapabilities(platform: SocialPlatform): PlatformCapabilities {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      throw new Error(`Platform ${platform} is not registered`);
    }

    return platformInstance.getCapabilities();
  }

  /**
   * Get capabilities for all registered platforms
   */
  getAllCapabilities(): PlatformCapabilities[] {
    const capabilities: PlatformCapabilities[] = [];

    for (const instance of this.platforms.values()) {
      capabilities.push(instance.getCapabilities());
    }

    return capabilities;
  }

  /**
   * Update platform credentials
   */
  updateCredentials(platform: SocialPlatform, credentials: Partial<PlatformCredentials>): void {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      throw new Error(`Platform ${platform} is not registered`);
    }

    platformInstance.updateCredentials(credentials);
  }

  /**
   * Update platform settings
   */
  updateSettings(platform: SocialPlatform, settings: Partial<PlatformSettings>): void {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      throw new Error(`Platform ${platform} is not registered`);
    }

    platformInstance.updateSettings(settings);
  }

  /**
   * Get platform settings
   */
  getSettings(platform: SocialPlatform): PlatformSettings {
    const platformInstance = this.platforms.get(platform);

    if (!platformInstance) {
      throw new Error(`Platform ${platform} is not registered`);
    }

    return platformInstance.getSettings();
  }

  /**
   * Get health status for all platforms
   */
  async getHealthStatus(): Promise<{
    healthy: number;
    warning: number;
    error: number;
    total: number;
    platforms: Record<SocialPlatform, "healthy" | "warning" | "error">;
  }> {
    const statuses = await this.getAllConnectionStatuses();

    const healthMap: Record<string, "healthy" | "warning" | "error"> = {};
    let healthy = 0;
    let warning = 0;
    let error = 0;

    for (const status of statuses) {
      healthMap[status.platform] = status.health.status;

      if (status.health.status === "healthy") healthy++;
      else if (status.health.status === "warning") warning++;
      else error++;
    }

    return {
      healthy,
      warning,
      error,
      total: statuses.length,
      platforms: healthMap as Record<SocialPlatform, "healthy" | "warning" | "error">,
    };
  }
}

// Singleton instance
let managerInstance: SocialMediaManager | null = null;

/**
 * Get or create singleton instance of SocialMediaManager
 */
export function getSocialMediaManager(): SocialMediaManager {
  if (!managerInstance) {
    managerInstance = new SocialMediaManager();
  }
  return managerInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetSocialMediaManager(): void {
  managerInstance = null;
}
