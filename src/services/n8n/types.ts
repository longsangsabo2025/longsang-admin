/**
 * n8n Types & Interfaces
 */

// ============================================================
// CORE TYPES
// ============================================================

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: N8nTag[];
  nodes?: N8nNode[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  staticData?: Record<string, unknown>;
  // Computed fields
  nodeCount?: number;
  triggerType?: string;
  description?: string;
}

export interface N8nTag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
      error?: {
        message: string;
        stack?: string;
      };
    };
  };
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
}

// ============================================================
// MARKETING TYPES
// ============================================================

export interface WorkflowTriggerData {
  [key: string]: unknown;
}

export interface WorkflowResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface SocialMediaCampaign {
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
  [key: string]: unknown;
}

export interface EmailCampaign {
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
  [key: string]: unknown;
}

export interface ContentRepurposingJob {
  sourceType: "blog" | "video" | "podcast" | "article";
  sourceUrl: string;
  targetFormats: ("social-post" | "email" | "carousel" | "thread")[];
  aiPrompt?: string;
  [key: string]: unknown;
}

export interface LeadNurturingData {
  email: string;
  name: string;
  source: string;
  interests?: string[];
  leadScore?: number;
  [key: string]: unknown;
}

export interface EngagementBotSettings {
  platform: "linkedin" | "facebook" | "twitter";
  targetHashtags?: string[];
  targetProfiles?: string[];
  engagementType: ("like" | "comment" | "share")[];
  commentTemplates?: string[];
  maxEngagementsPerDay?: number;
  [key: string]: unknown;
}

export interface ABTest {
  type: "social-post" | "email-subject" | "landing-page";
  variations: string[];
  metric: "engagement" | "clicks" | "conversions";
  sampleSize: number;
  duration: number; // hours
  [key: string]: unknown;
}

export interface BulkPost {
  content: string;
  platform: string;
  scheduledTime: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface WhatsAppCampaign {
  recipients: Array<{ phone: string; name: string; variables?: object }>;
  templateId: string;
  messageContent?: string;
  [key: string]: unknown;
}
