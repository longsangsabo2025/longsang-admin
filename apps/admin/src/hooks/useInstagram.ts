import { useState, useCallback } from 'react';
import {
  INSTAGRAM_ACCOUNTS,
  type InstagramAccountKey,
  getInstagramAccountInfo,
  postImageToInstagram,
  postVideoToInstagram,
  postCarouselToInstagram,
  getRecentMedia,
} from '../services/instagram';

interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
}

interface UseInstagramState {
  isLoading: boolean;
  error: string | null;
  accounts: Record<InstagramAccountKey, InstagramAccount | null>;
  lastPostId: string | null;
}

interface UseInstagramActions {
  loadAccountInfo: (accountKey: InstagramAccountKey) => Promise<InstagramAccount | null>;
  postImage: (
    accountKey: InstagramAccountKey,
    imageUrl: string,
    caption: string
  ) => Promise<{ success: boolean; postId?: string; error?: string }>;
  postVideo: (
    accountKey: InstagramAccountKey,
    videoUrl: string,
    caption: string
  ) => Promise<{ success: boolean; postId?: string; error?: string }>;
  postCarousel: (
    accountKey: InstagramAccountKey,
    mediaItems: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
    caption: string
  ) => Promise<{ success: boolean; postId?: string; error?: string }>;
  fetchRecentMedia: (accountKey: InstagramAccountKey, limit?: number) => Promise<any[]>;
  clearError: () => void;
}

/**
 * Get the page access token for an Instagram account
 */
function getPageToken(accountKey: InstagramAccountKey): string {
  const account = INSTAGRAM_ACCOUNTS[accountKey];
  const envKey = account.pageTokenEnv;

  // Map env key to actual env variable
  const tokenMap: Record<string, string> = {
    FACEBOOK_PAGE_ACCESS_TOKEN: import.meta.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN || '',
    FACEBOOK_PAGE_SABO_MEDIA_TOKEN: import.meta.env.VITE_FACEBOOK_PAGE_SABO_MEDIA_TOKEN || '',
    FACEBOOK_PAGE_AI_NEWBIE_VN_TOKEN: import.meta.env.VITE_FACEBOOK_PAGE_AI_NEWBIE_VN_TOKEN || '',
    FACEBOOK_PAGE_SABO_BILLIARD_SHOP_TOKEN:
      import.meta.env.VITE_FACEBOOK_PAGE_SABO_BILLIARD_SHOP_TOKEN || '',
    FACEBOOK_PAGE_AI_ART_NEWBIE_TOKEN: import.meta.env.VITE_FACEBOOK_PAGE_AI_ART_NEWBIE_TOKEN || '',
  };

  return tokenMap[envKey] || '';
}

export function useInstagram(): UseInstagramState & UseInstagramActions {
  const [state, setState] = useState<UseInstagramState>({
    isLoading: false,
    error: null,
    accounts: {
      saboBilliards: null,
      saboMedia: null,
      aiNewbieVn: null,
      saboBidaShop: null,
      lsFusionLab: null,
    },
    lastPostId: null,
  });

  const loadAccountInfo = useCallback(async (accountKey: InstagramAccountKey) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const account = INSTAGRAM_ACCOUNTS[accountKey];
      const token = getPageToken(accountKey);

      if (!token) {
        throw new Error(`No access token found for ${accountKey}`);
      }

      const info = await getInstagramAccountInfo(account.id, token);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        accounts: {
          ...prev.accounts,
          [accountKey]: info,
        },
      }));

      return info;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load account info';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const postImage = useCallback(
    async (accountKey: InstagramAccountKey, imageUrl: string, caption: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const account = INSTAGRAM_ACCOUNTS[accountKey];
        const token = getPageToken(accountKey);

        if (!token) {
          throw new Error(`No access token found for ${accountKey}`);
        }

        const result = await postImageToInstagram(account.id, token, imageUrl, caption);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastPostId: result.postId || null,
          error: result.error || null,
        }));

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to post image';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const postVideo = useCallback(
    async (accountKey: InstagramAccountKey, videoUrl: string, caption: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const account = INSTAGRAM_ACCOUNTS[accountKey];
        const token = getPageToken(accountKey);

        if (!token) {
          throw new Error(`No access token found for ${accountKey}`);
        }

        const result = await postVideoToInstagram(account.id, token, videoUrl, caption);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastPostId: result.postId || null,
          error: result.error || null,
        }));

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to post video';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const postCarousel = useCallback(
    async (
      accountKey: InstagramAccountKey,
      mediaItems: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
      caption: string
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const account = INSTAGRAM_ACCOUNTS[accountKey];
        const token = getPageToken(accountKey);

        if (!token) {
          throw new Error(`No access token found for ${accountKey}`);
        }

        const result = await postCarouselToInstagram(account.id, token, mediaItems, caption);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastPostId: result.postId || null,
          error: result.error || null,
        }));

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to post carousel';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const fetchRecentMedia = useCallback(
    async (accountKey: InstagramAccountKey, limit: number = 10) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const account = INSTAGRAM_ACCOUNTS[accountKey];
        const token = getPageToken(accountKey);

        if (!token) {
          throw new Error(`No access token found for ${accountKey}`);
        }

        const media = await getRecentMedia(account.id, token, limit);

        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        return media;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch media';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return [];
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadAccountInfo,
    postImage,
    postVideo,
    postCarousel,
    fetchRecentMedia,
    clearError,
  };
}

export default useInstagram;
