/**
 * =================================================================
 * SOCIAL MEDIA TYPES - Unified Types for All Social Platforms
 * =================================================================
 * Supports: LinkedIn, Twitter/X, Facebook, Instagram, YouTube, Telegram, Discord
 */

// Supported social media platforms
export type SocialPlatform =
  | "linkedin" // LinkedIn (personal + company)
  | "twitter" // Twitter/X
  | "facebook" // Facebook Page
  | "instagram" // Instagram Business
  | "youtube" // YouTube Channel
  | "telegram" // Telegram Channel/Group
  | "discord" // Discord Channel
  | "threads"; // Threads (Meta)

// Platform account types
export type AccountType = "personal" | "business" | "company" | "channel" | "group";

// Post content types
export type ContentType = "text" | "image" | "video" | "link" | "carousel" | "story" | "reel";

// Post status
export type PostStatus = "draft" | "scheduled" | "published" | "failed" | "deleted";

/**
 * Platform Configuration Interface
 */
export interface PlatformConfig {
  platform: SocialPlatform;
  accountType: AccountType;
  enabled: boolean;
  credentials: PlatformCredentials;
  settings?: PlatformSettings;
}

/**
 * Platform Credentials (varies by platform)
 */
export interface PlatformCredentials {
  // OAuth tokens
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;

  // Platform-specific IDs
  pageId?: string; // Facebook Page ID
  channelId?: string; // YouTube/Telegram/Discord Channel ID
  businessAccountId?: string; // Instagram Business Account ID

  // API Keys (for platforms that need them)
  apiKey?: string;
  apiSecret?: string;
  bearerToken?: string;

  // Telegram/Discord specific
  botToken?: string;
  webhookUrl?: string;
}

/**
 * Platform Settings
 */
export interface PlatformSettings {
  // Posting preferences
  defaultVisibility?: "public" | "private" | "connections" | "followers";
  autoHashtags?: boolean;
  maxHashtags?: number;

  // Media settings
  imageQuality?: "high" | "medium" | "low";
  videoFormat?: string;
  maxFileSize?: number; // in MB

  // Rate limits
  maxPostsPerDay?: number;
  minIntervalMinutes?: number;

  // Advanced
  autoScheduleOptimal?: boolean; // Auto-schedule at best time
  crossPostEnabled?: boolean;
  notifyOnError?: boolean;
}

/**
 * Social Post Request
 */
export interface SocialPostRequest {
  // Target platform(s)
  platforms: SocialPlatform[];

  // Content
  text: string;
  contentType: ContentType;

  // Media
  media?: MediaAttachment[];

  // Metadata
  hashtags?: string[];
  mentions?: string[];
  linkUrl?: string;
  linkPreview?: boolean;

  // Scheduling
  publishAt?: Date;
  timezone?: string;

  // Advanced options
  options?: PostOptions;
}

/**
 * Media Attachment
 */
export interface MediaAttachment {
  type: "image" | "video" | "gif";
  url: string;
  thumbnail?: string;
  alt?: string;
  width?: number;
  height?: number;
  duration?: number; // for videos
  size?: number; // file size in bytes
}

/**
 * Post Options (platform-specific)
 */
export interface PostOptions {
  // LinkedIn specific
  linkedinVisibility?: "PUBLIC" | "CONNECTIONS";
  linkedinCommentable?: boolean;

  // Twitter specific
  twitterReplySettings?: "everyone" | "following" | "mentioned";
  twitterQuoteTweet?: boolean;

  // Facebook specific
  facebookTargeting?: {
    locales?: string[];
    ageMin?: number;
    ageMax?: number;
  };

  // Instagram specific
  instagramLocation?: {
    name: string;
    id: string;
  };
  instagramCollaborators?: string[];

  // YouTube specific
  youtubeCategory?: string;
  youtubeTags?: string[];
  youtubePrivacy?: "public" | "private" | "unlisted";

  // Telegram specific
  telegramDisableNotification?: boolean;
  telegramParseMode?: "Markdown" | "HTML";

  // Discord specific
  discordEmbed?: boolean;
  discordTTS?: boolean;
}

/**
 * Social Post Response
 */
export interface SocialPostResponse {
  platform: SocialPlatform;
  success: boolean;

  // Post information
  postId?: string;
  postUrl?: string;

  // Status
  status: PostStatus;
  publishedAt?: Date;

  // Error handling
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  // Metadata
  metadata?: {
    reach?: number;
    impressions?: number;
    engagement?: number;
  };
}

/**
 * Bulk Post Response (multi-platform)
 */
export interface BulkPostResponse {
  requestId: string;
  timestamp: Date;
  results: SocialPostResponse[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
}

/**
 * Platform Capabilities
 */
export interface PlatformCapabilities {
  platform: SocialPlatform;
  features: {
    textPosts: boolean;
    imagePosts: boolean;
    videoPosts: boolean;
    linkPosts: boolean;
    carouselPosts: boolean;
    stories: boolean;
    reels: boolean;

    scheduling: boolean;
    autoPublish: boolean;

    hashtags: boolean;
    mentions: boolean;
    location: boolean;

    analytics: boolean;
    comments: boolean;
    reactions: boolean;
  };

  limits: {
    textLength: number;
    hashtagsMax: number;
    imagesMax: number;
    videoDurationMax: number; // in seconds
    fileSizeMax: number; // in MB
    postsPerDay: number;
  };
}

/**
 * Platform Connection Status
 */
export interface PlatformConnection {
  platform: SocialPlatform;
  connected: boolean;
  accountInfo?: {
    id: string;
    username: string;
    displayName: string;
    profileUrl?: string;
    avatarUrl?: string;
    followerCount?: number;
    verified?: boolean;
  };
  health: {
    status: "healthy" | "warning" | "error";
    lastChecked: Date;
    lastPost?: Date;
    errorCount?: number;
    message?: string;
  };
  credentials: PlatformCredentials;
  settings: PlatformSettings;
}

/**
 * Post Analytics
 */
export interface PostAnalytics {
  postId: string;
  platform: SocialPlatform;
  publishedAt: Date;

  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    clicks?: number;

    // Platform-specific
    retweets?: number; // Twitter
    replies?: number; // Twitter
    reactions?: {
      // Facebook
      like: number;
      love: number;
      haha: number;
      wow: number;
      sad: number;
      angry: number;
    };
  };

  performance: {
    engagementRate: number; // percentage
    viralityScore: number; // 0-100
    bestPerformingTime: string;
  };
}

/**
 * Content Template
 */
export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;

  platforms: SocialPlatform[];
  contentType: ContentType;

  template: {
    text: string;
    hashtags: string[];
    variables?: Record<string, string>; // For dynamic content
  };

  settings: {
    autoSchedule?: boolean;
    optimalTime?: boolean;
    recurring?: {
      enabled: boolean;
      frequency: "daily" | "weekly" | "monthly";
      days?: number[]; // day of week (0-6)
      time?: string; // HH:mm
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Campaign
 */
export interface SocialCampaign {
  id: string;
  name: string;
  description?: string;

  platforms: SocialPlatform[];
  posts: SocialPostRequest[];

  schedule: {
    startDate: Date;
    endDate?: Date;
    frequency?: "once" | "daily" | "weekly" | "custom";
  };

  status: "draft" | "active" | "paused" | "completed";

  analytics?: {
    totalPosts: number;
    totalReach: number;
    totalEngagement: number;
    avgEngagementRate: number;
    topPerformingPost?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error Types
 */
export class SocialMediaError extends Error {
  constructor(
    public platform: SocialPlatform,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "SocialMediaError";
  }
}

export class AuthenticationError extends SocialMediaError {
  constructor(platform: SocialPlatform, message: string = "Authentication failed") {
    super(platform, "AUTH_ERROR", message);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends SocialMediaError {
  constructor(
    platform: SocialPlatform,
    public retryAfter?: number,
    message: string = "Rate limit exceeded"
  ) {
    super(platform, "RATE_LIMIT", message);
    this.name = "RateLimitError";
  }
}

export class ValidationError extends SocialMediaError {
  constructor(platform: SocialPlatform, message: string, public field?: string) {
    super(platform, "VALIDATION_ERROR", message, { field });
    this.name = "ValidationError";
  }
}
