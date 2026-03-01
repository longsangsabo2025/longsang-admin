/**
 * 🧠 useConversationMemory Hook - Elon Musk Edition
 *
 * Persistent conversation memory using localStorage + Supabase
 *
 * Features:
 * - Local storage for instant access
 * - Supabase sync for cross-device
 * - Conversation context window
 * - Auto-summarization for long conversations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantType } from './useAssistant';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  assistantType: AssistantType;
  title: string;
  messages: ConversationMessage[];
  createdAt: number;
  updatedAt: number;
  summary?: string;
}

export interface UseConversationMemoryOptions {
  userId: string;
  assistantType: AssistantType;
  maxMessages?: number; // Max messages to keep in context
  autoSave?: boolean;
}

export interface UseConversationMemoryReturn {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createConversation: (title?: string) => Conversation;
  selectConversation: (id: string) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  deleteConversation: (id: string) => void;
  clearCurrentConversation: () => void;
  renameConversation: (id: string, title: string) => void;
  getContextMessages: () => ConversationMessage[];
  syncToCloud: () => Promise<void>;
}

const STORAGE_KEY_PREFIX = 'ai_conversations_';
const MAX_LOCAL_CONVERSATIONS = 50;

export function useConversationMemory(
  options: UseConversationMemoryOptions
): UseConversationMemoryReturn {
  const { userId, assistantType, maxMessages = 20, autoSave = true } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${userId}_${assistantType}`;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        setConversations(parsed);

        // Auto-select most recent conversation
        if (parsed.length > 0) {
          const mostRecent = parsed.sort((a, b) => b.updatedAt - a.updatedAt)[0];
          setCurrentConversationId(mostRecent.id);
        }
      }
    } catch (err) {
      console.error('[ConversationMemory] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (!autoSave || isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Keep only recent conversations
        const toSave = conversations
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, MAX_LOCAL_CONVERSATIONS);

        localStorage.setItem(storageKey, JSON.stringify(toSave));
        console.log('[ConversationMemory] Saved', toSave.length, 'conversations');
      } catch (err) {
        console.error('[ConversationMemory] Failed to save:', err);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [conversations, autoSave, isLoading, storageKey]);

  // Get current conversation
  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null;

  /**
   * Create new conversation
   */
  const createConversation = useCallback(
    (title?: string): Conversation => {
      const newConversation: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assistantType,
        title: title || `New Chat ${new Date().toLocaleDateString('vi-VN')}`,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);

      console.log('[ConversationMemory] Created conversation:', newConversation.id);
      return newConversation;
    },
    [assistantType]
  );

  /**
   * Select a conversation
   */
  const selectConversation = useCallback(
    (id: string) => {
      const exists = conversations.find((c) => c.id === id);
      if (exists) {
        setCurrentConversationId(id);
      }
    },
    [conversations]
  );

  /**
   * Add message to current conversation
   */
  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      if (!currentConversationId) {
        // Create new conversation if none exists
        const newConv = createConversation();
        setCurrentConversationId(newConv.id);
      }

      const message: ConversationMessage = {
        role,
        content,
        timestamp: Date.now(),
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            // Auto-generate title from first user message
            let newTitle = conv.title;
            if (role === 'user' && conv.messages.length === 0) {
              newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '');
            }

            return {
              ...conv,
              title: newTitle,
              messages: [...conv.messages, message],
              updatedAt: Date.now(),
            };
          }
          return conv;
        })
      );
    },
    [currentConversationId, createConversation]
  );

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    },
    [currentConversationId]
  );

  /**
   * Clear current conversation messages
   */
  const clearCurrentConversation = useCallback(() => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [],
            updatedAt: Date.now(),
          };
        }
        return conv;
      })
    );
  }, [currentConversationId]);

  /**
   * Rename a conversation
   */
  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === id) {
          return { ...conv, title, updatedAt: Date.now() };
        }
        return conv;
      })
    );
  }, []);

  /**
   * Get messages for AI context (last N messages)
   */
  const getContextMessages = useCallback((): ConversationMessage[] => {
    if (!currentConversation) return [];

    const messages = currentConversation.messages;

    // Return last N messages for context
    if (messages.length <= maxMessages) {
      return messages;
    }

    // For long conversations, include summary + recent messages
    const recentMessages = messages.slice(-maxMessages);

    // Add system message with context
    if (currentConversation.summary) {
      return [
        {
          role: 'system' as const,
          content: `Previous conversation summary: ${currentConversation.summary}`,
          timestamp: Date.now(),
        },
        ...recentMessages,
      ];
    }

    return recentMessages;
  }, [currentConversation, maxMessages]);

  /**
   * Sync to Supabase (for cross-device)
   */
  const syncToCloud = useCallback(async () => {
    // TODO: Implement Supabase sync
    console.log('[ConversationMemory] Cloud sync not implemented yet');
  }, []);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    createConversation,
    selectConversation,
    addMessage,
    deleteConversation,
    clearCurrentConversation,
    renameConversation,
    getContextMessages,
    syncToCloud,
  };
}

export default useConversationMemory;
