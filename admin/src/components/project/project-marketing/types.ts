/**
 * Types for ProjectMarketingTab and sub-components
 */

export interface ProjectMarketingTabProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'social_media' | 'email' | 'ads';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  platforms: string[];
  content: string;
  scheduled_at: string | null;
  created_at: string;
  metrics?: {
    impressions: number;
    clicks: number;
    engagement: number;
    conversions: number;
  };
}

export interface ScheduledPost {
  id: string;
  platform: string;
  platforms?: string[];
  content: string;
  scheduled_at: string;
  status: 'pending' | 'scheduled' | 'posted' | 'published' | 'failed';
  media_url?: string;
  campaign_id?: string;
  campaign_name?: string;
}

export interface MarketingDoc {
  id: string;
  filename: string;
  title: string;
  path: string;
  size: number;
  modified: string;
  order: number;
}

export interface MarketingOverview {
  hasMarketingPack: boolean;
  quickInfo: {
    appName?: string;
    packageName?: string;
    version?: string;
    target?: string;
    category?: string;
    oneLiner?: string;
    brandColors?: { name: string; hex: string }[];
    hashtags?: string[];
  };
  usps: string[];
  documents: MarketingDoc[];
  packPath: string;
}

export interface MarketingStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalReach: number;
  totalEngagement: number;
  scheduledPosts: number;
}

export interface EditingPost {
  id: string;
  content: string;
  scheduled_at: string;
  platforms: string[];
}

export interface NewCampaign {
  name: string;
  type: 'social_media';
  content: string;
  platforms: string[];
  scheduled_at: string;
}

export interface NewPackInfo {
  name: string;
  category: string;
  oneLiner: string;
  targetMarket: string;
}
