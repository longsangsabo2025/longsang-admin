/**
 * =================================================================
 * AUTO-PUBLISH SERVICE
 * =================================================================
 * Handles automatic publishing of content to social media
 */

import { supabase } from "@/integrations/supabase/client";
import { getSocialMediaManager } from "@/lib/social";
import type { SocialPlatform, SocialPostRequest } from "@/types/social-media";

interface AutoPublishSettings {
  enabled: boolean;
  platforms: SocialPlatform[];
  auto_approve: boolean;
  add_hashtags: boolean;
  include_link: boolean;
}

export class AutoPublishService {
  private static instance: AutoPublishService;

  private constructor() {}

  static getInstance(): AutoPublishService {
    if (!AutoPublishService.instance) {
      AutoPublishService.instance = new AutoPublishService();
    }
    return AutoPublishService.instance;
  }

  /**
   * Get auto-publish settings
   */
  async getSettings(): Promise<AutoPublishSettings | null> {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "auto_publish_settings")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return (data?.value as AutoPublishSettings) || null;
    } catch (error) {
      console.error("Failed to get auto-publish settings:", error);
      return null;
    }
  }

  /**
   * Check if auto-publish is enabled
   */
  async isEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings?.enabled || false;
  }

  /**
   * Process content for auto-publish
   * Called when new content is added to content_queue
   */
  async processContent(contentId: string): Promise<void> {
    try {
      // Check if auto-publish is enabled
      const settings = await this.getSettings();
      if (!settings || !settings.enabled || settings.platforms.length === 0) {
        console.log("Auto-publish disabled or no platforms configured");
        return;
      }

      // Get content from queue
      const { data: content, error: contentError } = await supabase
        .from("content_queue")
        .select("*")
        .eq("id", contentId)
        .single();

      if (contentError) throw contentError;
      if (!content) {
        console.error("Content not found:", contentId);
        return;
      }

      // Skip if already published or not pending
      if (content.status !== "pending") {
        console.log("Content not pending, skipping auto-publish");
        return;
      }

      // Auto-approve if configured
      if (settings.auto_approve) {
        await supabase
          .from("content_queue")
          .update({
            status: "approved",
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", contentId);
      }

      // Prepare post content
      const postText = this.extractPostText(content);
      const hashtags = settings.add_hashtags ? this.extractHashtags(content) : [];
      const linkUrl = settings.include_link ? this.extractLinkUrl(content) : undefined;
      const imageUrl = this.extractImageUrl(content);

      // Create post request
      const postRequest: SocialPostRequest = {
        platforms: settings.platforms,
        contentType: "text",
        text: postText,
        hashtags,
        linkUrl,
        media: imageUrl ? [{ type: "image", url: imageUrl }] : undefined,
      };

      // Publish to social media
      const manager = getSocialMediaManager();
      const result = await manager.postToMultiplePlatforms(postRequest);

      // Update content_queue with results
      const metadata = {
        ...content.metadata,
        auto_published: true,
        social_posts: {
          posted_at: new Date().toISOString(),
          platforms: settings.platforms,
          results: result.results,
          summary: result.summary,
        },
      };

      await supabase
        .from("content_queue")
        .update({
          metadata: metadata as any,
          status: "published",
        } as any)
        .eq("id", contentId);

      console.log(`Auto-published content ${contentId} to ${result.summary.successful} platforms`);
    } catch (error) {
      console.error("Auto-publish failed:", error);

      // Update content with error
      await supabase
        .from("content_queue")
        .update({
          metadata: {
            auto_publish_error: error instanceof Error ? error.message : "Unknown error",
            auto_publish_failed_at: new Date().toISOString(),
          } as any,
        } as any)
        .eq("id", contentId);
    }
  }

  /**
   * Extract post text from content (first 280 chars)
   */
  private extractPostText(content: any): string {
    const body = content.content?.body || "";
    // Remove markdown formatting
    const cleaned = body.replace(/[#*\n]+/g, " ").trim();
    // Take first 280 chars
    return cleaned.substring(0, 280);
  }

  /**
   * Extract hashtags from content metadata
   */
  private extractHashtags(content: any): string[] {
    const tags = content.metadata?.tags || content.content?.seo?.tags || [];
    return Array.isArray(tags) ? tags : [];
  }

  /**
   * Extract link URL from content metadata
   */
  private extractLinkUrl(content: any): string | undefined {
    return content.metadata?.url || content.metadata?.link_url || undefined;
  }

  /**
   * Extract image URL from content
   */
  private extractImageUrl(content: any): string | undefined {
    return content.metadata?.image_url || content.content?.featured_image || undefined;
  }
}

/**
 * Get singleton instance
 */
export const getAutoPublishService = () => AutoPublishService.getInstance();
