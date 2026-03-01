/**
 * Types for Social Media Connections Dashboard
 */

import { type Project, type ProjectSocialAccount } from '@/lib/projects';

export interface StoredCredential {
  id: string;
  platform: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  account_info: {
    name?: string;
    username?: string;
    id?: string;
    followers?: number;
    subscribers?: number;
    videos?: number;
    views?: number;
    pages?: number;
    accounts?: number;
    profileUrl?: string;
    channelId?: string;
    mainPageId?: string;
    fans?: number;
    primaryId?: string;
  };
  is_active: boolean;
  last_tested_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  name: string;
  username?: string;
  type: 'page' | 'profile' | 'channel' | 'account';
  followers?: number;
  tokenStatus: 'permanent' | 'active' | 'expiring' | 'expired';
  tokenExpiry?: string;
  lastPost?: string;
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
  accounts: SocialAccount[];
  capabilities: string[];
  notes?: string;
}

export interface ProjectWithSocial extends Project {
  social_accounts?: ProjectSocialAccount[];
}
