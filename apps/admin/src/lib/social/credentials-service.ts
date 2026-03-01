/**
 * =================================================================
 * SOCIAL MEDIA CREDENTIALS SERVICE
 * =================================================================
 * Manages storage and retrieval of platform credentials from database
 */

import { supabase } from '@/integrations/supabase/client';
import type { PlatformCredentials, PlatformSettings, SocialPlatform } from '@/types/social-media';

export interface StoredCredential {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  credentials: PlatformCredentials;
  settings?: PlatformSettings;
  is_active: boolean;
  last_tested_at?: string;
  last_error?: string;
  account_info?: {
    name?: string;
    username?: string;
    avatar?: string;
    followers?: number;
    profileUrl?: string;
  };
  created_at: string;
  updated_at: string;
}

export class SocialCredentialsService {
  private static instance: SocialCredentialsService;

  private constructor() {}

  static getInstance(): SocialCredentialsService {
    if (!SocialCredentialsService.instance) {
      SocialCredentialsService.instance = new SocialCredentialsService();
    }
    return SocialCredentialsService.instance;
  }

  /**
   * Save or update credentials for a platform
   */
  async saveCredentials(
    platform: SocialPlatform,
    credentials: PlatformCredentials,
    settings?: PlatformSettings
  ): Promise<StoredCredential> {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert credentials
      const { data, error } = await supabase
        .from('social_media_credentials')
        .upsert(
          {
            user_id: user.id,
            platform,
            credentials: credentials as any,
            settings: settings as any,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,platform',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as StoredCredential;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      throw error;
    }
  }

  /**
   * Get credentials for a specific platform
   */
  async getCredentials(platform: SocialPlatform): Promise<StoredCredential | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('social_media_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as StoredCredential | null;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }

  /**
   * Get all active credentials for current user
   */
  async getAllCredentials(): Promise<StoredCredential[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('social_media_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StoredCredential[];
    } catch (error) {
      console.error('Failed to get all credentials:', error);
      return [];
    }
  }

  /**
   * Delete credentials for a platform
   */
  async deleteCredentials(platform: SocialPlatform): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('social_media_credentials')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      throw error;
    }
  }

  /**
   * Update connection status after testing
   */
  async updateConnectionStatus(
    platform: SocialPlatform,
    success: boolean,
    errorMessage?: string,
    accountInfo?: any
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('social_media_credentials')
        .update({
          last_tested_at: new Date().toISOString(),
          last_error: success ? null : errorMessage,
          account_info: accountInfo || undefined,
        } as any)
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update connection status:', error);
    }
  }

  /**
   * Deactivate credentials without deleting
   */
  async deactivateCredentials(platform: SocialPlatform): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('social_media_credentials')
        .update({ is_active: false } as any)
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to deactivate credentials:', error);
      throw error;
    }
  }
}

/**
 * Get singleton instance
 */
export const getSocialCredentialsService = () => SocialCredentialsService.getInstance();
