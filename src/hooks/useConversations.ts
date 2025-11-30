/**
 * useConversations Hook
 * Hook để quản lý conversations (fetch, delete, rename)
 */

import { useState, useCallback } from 'react';
import { AssistantType } from './useAssistant';

export interface Conversation {
  id: string;
  user_id: string;
  assistant_type: AssistantType;
  title: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseConversationsOptions {
  assistantType?: AssistantType;
  userId?: string;
}

export function useConversations({ assistantType, userId }: UseConversationsOptions) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch conversations for an assistant type
   */
  const fetchConversations = useCallback(async () => {
    if (!userId || !assistantType) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assistants/${assistantType}/conversations`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err: any) {
      setError(err);
      console.error('[useConversations] Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assistantType, userId]);

  /**
   * Fetch ALL conversations for user (across all assistant types)
   */
  const fetchAllConversations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assistants/all-conversations`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err: any) {
      setError(err);
      console.error('[useConversations] Error fetching all conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Get single conversation by ID
   */
  const getConversation = useCallback(async (conversationId: string): Promise<Conversation | null> => {
    if (!userId) return null;

    try {
      const response = await fetch(`/api/assistants/conversation/${conversationId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.conversation || null;
    } catch (err: any) {
      console.error('[useConversations] Error getting conversation:', err);
      return null;
    }
  }, [assistantType, userId]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!userId || !assistantType) return false;

    try {
      const response = await fetch(`/api/assistants/${assistantType}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      return true;
    } catch (err: any) {
      console.error('[useConversations] Error deleting conversation:', err);
      return false;
    }
  }, [assistantType, userId]);

  /**
   * Rename a conversation
   */
  const renameConversation = useCallback(async (conversationId: string, newTitle: string): Promise<boolean> => {
    if (!userId || !assistantType) return false;

    try {
      const response = await fetch(`/api/assistants/${assistantType}/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title: newTitle } : c))
      );
      return true;
    } catch (err: any) {
      console.error('[useConversations] Error renaming conversation:', err);
      return false;
    }
  }, [assistantType, userId]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    fetchAllConversations,
    getConversation,
    deleteConversation,
    renameConversation,
  };
}