import { useState, useCallback } from 'react';
import {
  THREADS_CONFIG,
  getThreadsProfile,
  postTextThread,
  postImageThread,
  postVideoThread,
  postCarouselThread,
  replyToThread,
  getRecentThreads,
} from '../services/threads';

interface ThreadsProfile {
  id: string;
  username: string;
  threadsProfilePictureUrl?: string;
  threadsBiography?: string;
}

interface UseThreadsState {
  isLoading: boolean;
  error: string | null;
  profile: ThreadsProfile | null;
  lastPostId: string | null;
}

interface UseThreadsActions {
  loadProfile: () => Promise<ThreadsProfile | null>;
  postText: (text: string, options?: { linkAttachment?: string }) => Promise<{ success: boolean; postId?: string; error?: string }>;
  postImage: (imageUrl: string, text?: string) => Promise<{ success: boolean; postId?: string; error?: string }>;
  postVideo: (videoUrl: string, text?: string) => Promise<{ success: boolean; postId?: string; error?: string }>;
  postCarousel: (
    mediaItems: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
    text?: string
  ) => Promise<{ success: boolean; postId?: string; error?: string }>;
  reply: (replyToId: string, text: string, imageUrl?: string) => Promise<{ success: boolean; postId?: string; error?: string }>;
  fetchRecentThreads: (limit?: number) => Promise<any[]>;
  clearError: () => void;
}

export function useThreads(): UseThreadsState & UseThreadsActions {
  const [state, setState] = useState<UseThreadsState>({
    isLoading: false,
    error: null,
    profile: null,
    lastPostId: null,
  });

  const loadProfile = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const profile = await getThreadsProfile();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        profile,
      }));
      
      return profile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  const postText = useCallback(async (
    text: string,
    options?: { linkAttachment?: string }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await postTextThread(text, { linkAttachment: options?.linkAttachment });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastPostId: result.postId || null,
        error: result.error || null,
      }));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const postImage = useCallback(async (imageUrl: string, text?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await postImageThread(imageUrl, text);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastPostId: result.postId || null,
        error: result.error || null,
      }));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post image';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const postVideo = useCallback(async (videoUrl: string, text?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await postVideoThread(videoUrl, text);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastPostId: result.postId || null,
        error: result.error || null,
      }));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post video';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const postCarousel = useCallback(async (
    mediaItems: Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>,
    text?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await postCarouselThread(mediaItems, text);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastPostId: result.postId || null,
        error: result.error || null,
      }));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post carousel';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const reply = useCallback(async (
    replyToId: string,
    text: string,
    imageUrl?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await replyToThread(replyToId, text, { imageUrl });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastPostId: result.postId || null,
        error: result.error || null,
      }));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reply';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const fetchRecentThreads = useCallback(async (limit: number = 10) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const threads = await getRecentThreads(
        THREADS_CONFIG.userId,
        THREADS_CONFIG.accessToken,
        limit
      );
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return threads;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch threads';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadProfile,
    postText,
    postImage,
    postVideo,
    postCarousel,
    reply,
    fetchRecentThreads,
    clearError,
  };
}

export default useThreads;
