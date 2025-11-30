/**
 * n8n Integration Service
 * Handles all workflow automation and marketing automation through n8n
 */

interface WorkflowTriggerData {
  [key: string]: any;
}

interface WorkflowResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface SocialMediaCampaign {
  content: string;
  platforms: ("linkedin" | "facebook" | "twitter" | "instagram")[];
  scheduledTime?: string;
  imageUrl?: string;
  hashtags?: string[];
  targetAudience?: {
    location?: string[];
    interests?: string[];
    demographics?: {
      ageRange?: [number, number];
      gender?: "all" | "male" | "female";
    };
  };
}

interface EmailCampaign {
  subject: string;
  content: string;
  recipients: string[];
  templateId?: string;
  segmentId?: string;
  scheduledTime?: string;
  attachments?: {
    filename: string;
    url: string;
  }[];
}

interface ContentRepurposingJob {
  sourceType: "blog" | "video" | "podcast" | "article";
  sourceUrl: string;
  targetFormats: ("social-post" | "email" | "carousel" | "thread")[];
  aiPrompt?: string;
}

export class N8NService {
  private baseUrl: string;
  private webhookBaseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_N8N_URL || "http://localhost:5678";
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
   * Automatically posts to LinkedIn, Facebook, Twitter with AI-optimized content
   */
  async createSocialMediaCampaign(campaign: SocialMediaCampaign): Promise<WorkflowResponse> {
    return this.triggerWorkflow("social-media-campaign", {
      content: campaign.content,
      platforms: campaign.platforms,
      scheduledTime: campaign.scheduledTime,
      imageUrl: campaign.imageUrl,
      hashtags: campaign.hashtags,
      targetAudience: campaign.targetAudience,
      // AI will automatically:
      // 1. Optimize content for each platform
      // 2. Generate platform-specific hashtags
      // 3. Resize/optimize images
      // 4. Schedule at optimal times
      aiOptimization: true,
    });
  }

  /**
   * Email Marketing Campaign
   * Send emails via Mautic with segmentation and tracking
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
   * Content Repurposing
   * Takes one piece of content and creates multiple formats
   */
  async repurposeContent(job: ContentRepurposingJob): Promise<WorkflowResponse> {
    return this.triggerWorkflow("content-repurposing", {
      sourceType: job.sourceType,
      sourceUrl: job.sourceUrl,
      targetFormats: job.targetFormats,
      aiPrompt: job.aiPrompt,
      // AI will automatically:
      // 1. Extract key points
      // 2. Generate LinkedIn carousel
      // 3. Create Twitter thread
      // 4. Write email newsletter
      // 5. Create Instagram captions
    });
  }

  /**
   * Lead Nurturing Workflow
   * Automated drip campaign based on user behavior
   */
  async startLeadNurturing(leadData: {
    email: string;
    name: string;
    source: string;
    interests?: string[];
    leadScore?: number;
  }): Promise<WorkflowResponse> {
    return this.triggerWorkflow("lead-nurturing", {
      ...leadData,
      campaignType: "welcome-series",
      // Workflow will:
      // 1. Send welcome email immediately
      // 2. Track engagement
      // 3. Send value email after 3 days
      // 4. Send offer email after 7 days
      // 5. Score lead based on engagement
      // 6. Alert if high-value lead
    });
  }

  /**
   * Social Media Engagement Bot
   * Auto-like, comment, and engage with target audience
   */
  async startEngagementBot(settings: {
    platform: "linkedin" | "facebook" | "twitter";
    targetHashtags?: string[];
    targetProfiles?: string[];
    engagementType: ("like" | "comment" | "share")[];
    commentTemplates?: string[];
    maxEngagementsPerDay?: number;
  }): Promise<WorkflowResponse> {
    return this.triggerWorkflow("engagement-bot", {
      ...settings,
      // AI will:
      // 1. Find relevant posts
      // 2. Generate contextual comments
      // 3. Avoid spam detection
      // 4. Track engagement metrics
      aiGenerated: true,
    });
  }

  /**
   * Analytics Aggregator
   * Collect and unify metrics from all platforms
   */
  async syncAnalytics(platforms: string[]): Promise<WorkflowResponse> {
    return this.triggerWorkflow("analytics-sync", {
      platforms,
      metrics: ["impressions", "reach", "engagement", "clicks", "conversions", "revenue"],
      timeRange: "7d",
    });
  }

  /**
   * Auto-Scheduler
   * Find optimal posting times based on audience data
   */
  async getOptimalPostingTimes(platform: string): Promise<WorkflowResponse> {
    return this.triggerWorkflow("optimal-timing", {
      platform,
      // Returns best times to post based on:
      // 1. Historical engagement data
      // 2. Audience timezone
      // 3. Platform algorithms
      // 4. Competitor analysis
    });
  }

  /**
   * Bulk Social Media Posting
   * Schedule multiple posts across multiple platforms
   */
  async scheduleBulkPosts(
    posts: Array<{
      content: string;
      platform: string;
      scheduledTime: string;
      imageUrl?: string;
    }>
  ): Promise<WorkflowResponse> {
    return this.triggerWorkflow("bulk-schedule", {
      posts,
      validateSchedule: true,
      optimizeContent: true,
    });
  }

  /**
   * WhatsApp Bulk Messaging
   * Send personalized WhatsApp messages to leads
   */
  async sendWhatsAppCampaign(campaign: {
    recipients: Array<{ phone: string; name: string; variables?: object }>;
    templateId: string;
    messageContent?: string;
  }): Promise<WorkflowResponse> {
    return this.triggerWorkflow("whatsapp-campaign", {
      ...campaign,
      // Uses WhatsApp Business API
      compliance: {
        optInVerified: true,
        rateLimited: true,
      },
    });
  }

  /**
   * A/B Test Manager
   * Automatically test different content variations
   */
  async startABTest(test: {
    type: "social-post" | "email-subject" | "landing-page";
    variations: string[];
    metric: "engagement" | "clicks" | "conversions";
    sampleSize: number;
    duration: number; // hours
  }): Promise<WorkflowResponse> {
    return this.triggerWorkflow("ab-test", {
      ...test,
      // Will automatically:
      // 1. Split traffic
      // 2. Track metrics
      // 3. Determine winner
      // 4. Report results
    });
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
export const n8nService = new N8NService();
