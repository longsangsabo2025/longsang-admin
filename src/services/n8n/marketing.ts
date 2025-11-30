/**
 * n8n Marketing Automation Service
 * 
 * High-level business logic for marketing campaigns via n8n workflows
 */

import type {
  WorkflowTriggerData,
  WorkflowResponse,
  SocialMediaCampaign,
  EmailCampaign,
  ContentRepurposingJob,
  LeadNurturingData,
  EngagementBotSettings,
  ABTest,
  BulkPost,
  WhatsAppCampaign,
} from './types';

// ============================================================
// MARKETING SERVICE CLASS
// ============================================================

class N8NMarketingService {
  private readonly baseUrl: string;
  private readonly webhookBaseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_N8N_URL || 
                   import.meta.env.VITE_N8N_BASE_URL || 
                   "http://localhost:5678";
    this.webhookBaseUrl = `${this.baseUrl}/webhook`;
  }

  /**
   * Generic method to trigger any n8n workflow via webhook
   */
  private async triggerWorkflow(
    workflowId: string,
    data: WorkflowTriggerData
  ): Promise<WorkflowResponse> {
    try {
      const response = await fetch(`${this.webhookBaseUrl}/${workflowId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: "longsang-platform",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Error triggering workflow ${workflowId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Multi-Platform Social Media Campaign
   */
  async createSocialMediaCampaign(campaign: SocialMediaCampaign): Promise<WorkflowResponse> {
    return this.triggerWorkflow("social-media-campaign", {
      content: campaign.content,
      platforms: campaign.platforms,
      scheduledTime: campaign.scheduledTime,
      imageUrl: campaign.imageUrl,
      hashtags: campaign.hashtags,
      targetAudience: campaign.targetAudience,
      aiOptimization: true,
    });
  }

  /**
   * Email Marketing Campaign via Mautic
   */
  async createEmailCampaign(campaign: EmailCampaign): Promise<WorkflowResponse> {
    return this.triggerWorkflow("email-campaign", {
      subject: campaign.subject,
      content: campaign.content,
      recipients: campaign.recipients,
      templateId: campaign.templateId,
      segmentId: campaign.segmentId,
      scheduledTime: campaign.scheduledTime,
      attachments: campaign.attachments,
      tracking: {
        opens: true,
        clicks: true,
        conversions: true,
      },
    });
  }

  /**
   * Content Repurposing - One content to multiple formats
   */
  async repurposeContent(job: ContentRepurposingJob): Promise<WorkflowResponse> {
    return this.triggerWorkflow("content-repurposing", {
      sourceType: job.sourceType,
      sourceUrl: job.sourceUrl,
      targetFormats: job.targetFormats,
      aiPrompt: job.aiPrompt,
    });
  }

  /**
   * Lead Nurturing - Automated drip campaigns
   */
  async startLeadNurturing(leadData: LeadNurturingData): Promise<WorkflowResponse> {
    return this.triggerWorkflow("lead-nurturing", {
      ...leadData,
      campaignType: "welcome-series",
    });
  }

  /**
   * Social Media Engagement Bot
   */
  async startEngagementBot(settings: EngagementBotSettings): Promise<WorkflowResponse> {
    return this.triggerWorkflow("engagement-bot", {
      ...settings,
      aiGenerated: true,
    });
  }

  /**
   * Analytics Aggregator - Collect metrics from all platforms
   */
  async syncAnalytics(platforms: string[]): Promise<WorkflowResponse> {
    return this.triggerWorkflow("analytics-sync", {
      platforms,
      metrics: ["impressions", "reach", "engagement", "clicks", "conversions", "revenue"],
      timeRange: "7d",
    });
  }

  /**
   * Get Optimal Posting Times based on audience data
   */
  async getOptimalPostingTimes(platform: string): Promise<WorkflowResponse> {
    return this.triggerWorkflow("optimal-timing", { platform });
  }

  /**
   * Bulk Social Media Posting
   */
  async scheduleBulkPosts(posts: BulkPost[]): Promise<WorkflowResponse> {
    return this.triggerWorkflow("bulk-schedule", {
      posts,
      validateSchedule: true,
      optimizeContent: true,
    });
  }

  /**
   * WhatsApp Bulk Messaging
   */
  async sendWhatsAppCampaign(campaign: WhatsAppCampaign): Promise<WorkflowResponse> {
    return this.triggerWorkflow("whatsapp-campaign", {
      ...campaign,
      compliance: {
        optInVerified: true,
        rateLimited: true,
      },
    });
  }

  /**
   * A/B Test Manager
   */
  async startABTest(test: ABTest): Promise<WorkflowResponse> {
    return this.triggerWorkflow("ab-test", test);
  }

  /**
   * Get Workflow Execution Status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error getting execution status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * List Active Workflows
   */
  async listActiveWorkflows(): Promise<WorkflowResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Error listing workflows:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Singleton instance
export const n8nMarketing = new N8NMarketingService();

// Also export class for testing
export { N8NMarketingService };

export default n8nMarketing;
