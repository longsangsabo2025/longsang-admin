/**
 * React Hook for Facebook SDK Integration
 * Provides easy-to-use Facebook functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  waitForFBSDK,
  isFBSDKLoaded,
  getFBLoginStatus,
  loginWithFacebook,
  logoutFromFacebook,
  getFBUserProfile,
  getFBPages,
  shareToFacebook,
  postToFacebookPage,
  FB_CONFIG,
} from '@/services/facebook';

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  accessToken?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  category: string;
}

interface UseFacebookReturn {
  // State
  isSDKLoaded: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  user: FacebookUser | null;
  pages: FacebookPage[];
  error: string | null;
  
  // Actions
  login: (scopes?: string) => Promise<void>;
  logout: () => Promise<void>;
  share: (url: string, quote?: string, hashtag?: string) => Promise<{ post_id?: string }>;
  postToPage: (pageId: string, message: string, link?: string) => Promise<{ id: string }>;
  refreshPages: () => Promise<void>;
  clearError: () => void;
}

export const useFacebook = (): UseFacebookReturn => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<FacebookUser | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize SDK and check login status
  useEffect(() => {
    const initFacebook = async () => {
      try {
        await waitForFBSDK();
        setIsSDKLoaded(true);
        
        // Check current login status
        const status = await getFBLoginStatus();
        
        if (status.status === 'connected' && status.authResponse) {
          setIsLoggedIn(true);
          setAccessToken(status.authResponse.accessToken);
          
          // Fetch user profile
          const profile = await getFBUserProfile();
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            picture: profile.picture?.data?.url,
            accessToken: status.authResponse.accessToken,
          });
          
          // Fetch pages
          try {
            const pagesResponse = await getFBPages();
            setPages(pagesResponse.data.map(page => ({
              id: page.id,
              name: page.name,
              accessToken: page.access_token,
              category: page.category,
            })));
          } catch {
            // User may not have pages or permission
          }
        }
      } catch (err) {
        console.error('Facebook SDK initialization error:', err);
        setError('Không thể khởi tạo Facebook SDK');
      } finally {
        setIsLoading(false);
      }
    };

    initFacebook();
  }, []);

  // Login handler
  const login = useCallback(async (scopes?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginWithFacebook(scopes);
      
      if (response.authResponse) {
        setIsLoggedIn(true);
        setAccessToken(response.authResponse.accessToken);
        
        // Fetch user profile
        const profile = await getFBUserProfile();
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          picture: profile.picture?.data?.url,
          accessToken: response.authResponse.accessToken,
        });
        
        // Fetch pages with page management scope
        if (scopes?.includes('pages_')) {
          try {
            const pagesResponse = await getFBPages();
            setPages(pagesResponse.data.map(page => ({
              id: page.id,
              name: page.name,
              accessToken: page.access_token,
              category: page.category,
            })));
          } catch {
            // Permission not granted
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập Facebook thất bại';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await logoutFromFacebook();
      setIsLoggedIn(false);
      setUser(null);
      setPages([]);
      setAccessToken(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng xuất thất bại';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Share handler
  const share = useCallback(async (url: string, quote?: string, hashtag?: string) => {
    setError(null);
    
    try {
      return await shareToFacebook({ url, quote, hashtag });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chia sẻ thất bại';
      setError(message);
      throw err;
    }
  }, []);

  // Post to page handler
  const postToPage = useCallback(async (pageId: string, message: string, link?: string) => {
    setError(null);
    
    const page = pages.find(p => p.id === pageId);
    if (!page) {
      throw new Error('Không tìm thấy trang');
    }
    
    try {
      return await postToFacebookPage(pageId, page.accessToken, message, link);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng bài thất bại';
      setError(message);
      throw err;
    }
  }, [pages]);

  // Refresh pages
  const refreshPages = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const pagesResponse = await getFBPages();
      setPages(pagesResponse.data.map(page => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
      })));
    } catch (err) {
      console.error('Failed to refresh pages:', err);
    }
  }, [isLoggedIn]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSDKLoaded,
    isLoggedIn,
    isLoading,
    user,
    pages,
    error,
    login,
    logout,
    share,
    postToPage,
    refreshPages,
    clearError,
  };
};

export default useFacebook;
