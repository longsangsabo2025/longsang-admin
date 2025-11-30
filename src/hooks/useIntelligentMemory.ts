/**
 * 🧠 useIntelligentMemory Hook
 * 
 * React hook for the Intelligent Memory Manager
 * Provides Copilot-level memory management for AI chat
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  getMemoryManager, 
  IntelligentMemoryManager,
  MemorySession,
  MemoryMessage,
  TokenBudget,
  ConversationContext,
  MemoryConfig,
} from '../services/intelligentMemory';
import { AssistantType } from './useAssistant';

export interface UseIntelligentMemoryOptions {
  userId: string;
  assistantType: AssistantType;
  config?: Partial<MemoryConfig>;
}

export interface UseIntelligentMemoryReturn {
  // State
  session: MemorySession | null;
  messages: MemoryMessage[];
  tokenBudget: TokenBudget;
  isNearLimit: boolean;
  conversations: MemorySession[];
  activeConversationId: string | null;
  
  // Actions
  addMessage: (role: 'user' | 'assistant', content: string) => MemoryMessage;
  getContext: (systemPrompt: string) => ConversationContext;
  getAPIMessages: (systemPrompt: string) => Array<{ role: string; content: string }>;
  clearSession: () => void;
  triggerSummarization: () => { systemPrompt: string; userMessage: string } | null;
  applySummary: (summary: string) => void;
  
  // Conversation management
  startNewConversation: () => void;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  
  // Stats
  getStats: () => {
    messageCount: number;
    totalTokens: number;
    availableTokens: number;
    percentUsed: number;
    hasSummary: boolean;
  };
}

export function useIntelligentMemory(
  options: UseIntelligentMemoryOptions
): UseIntelligentMemoryReturn {
  const { userId, assistantType, config } = options;
  
  const manager = useMemo(() => getMemoryManager(config), [config]);
  
  const [session, setSession] = useState<MemorySession | null>(null);
  const [conversations, setConversations] = useState<MemorySession[]>([]);
  const [tokenBudget, setTokenBudget] = useState<TokenBudget>({
    total: 0,
    system: 0,
    history: 0,
    context: 0,
    available: 128000,
    maxTokens: 128000,
  });

  // Refresh session and conversations
  const refreshState = useCallback(() => {
    const currentSession = manager.getSession(userId, assistantType);
    setSession(currentSession);
    setConversations(manager.getUserConversations(userId));
    setTokenBudget(manager.getTokenStats(userId, assistantType));
  }, [manager, userId, assistantType]);

  // Load session on mount and when assistant changes
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Add message
  const addMessage = useCallback((
    role: 'user' | 'assistant', 
    content: string
  ): MemoryMessage => {
    const message = manager.addMessage(userId, assistantType, role, content);
    
    // Update local state immediately
    refreshState();
    
    return message;
  }, [manager, userId, assistantType, refreshState]);

  // Get optimized context
  const getContext = useCallback((systemPrompt: string): ConversationContext => {
    return manager.getOptimizedContext(userId, assistantType, systemPrompt);
  }, [manager, userId, assistantType]);

  // Get API-ready messages
  const getAPIMessages = useCallback((systemPrompt: string): Array<{ role: string; content: string }> => {
    const context = manager.getOptimizedContext(userId, assistantType, systemPrompt);
    return manager.buildAPIMessages(context);
  }, [manager, userId, assistantType]);

  // Clear session
  const clearSession = useCallback(() => {
    manager.clearSession(userId, assistantType);
    refreshState();
  }, [manager, userId, assistantType, refreshState]);

  // Trigger summarization
  const triggerSummarization = useCallback(() => {
    return manager.getSummaryRequest(userId, assistantType);
  }, [manager, userId, assistantType]);

  // Apply summary
  const applySummary = useCallback((summary: string) => {
    manager.applySummary(userId, assistantType, summary);
    refreshState();
  }, [manager, userId, assistantType, refreshState]);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    manager.startNewConversation(userId, assistantType);
    refreshState();
  }, [manager, userId, assistantType, refreshState]);

  // Switch conversation
  const switchConversation = useCallback((conversationId: string) => {
    manager.switchConversation(conversationId);
    refreshState();
  }, [manager, refreshState]);

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    manager.deleteConversation(conversationId);
    refreshState();
  }, [manager, refreshState]);

  // Get stats
  const getStats = useCallback(() => {
    const stats = manager.getTokenStats(userId, assistantType);
    const currentSession = manager.getSession(userId, assistantType);
    
    return {
      messageCount: currentSession.messages.length,
      totalTokens: stats.total,
      availableTokens: stats.available,
      percentUsed: Math.round((stats.total / stats.maxTokens) * 100),
      hasSummary: !!currentSession.summary,
    };
  }, [manager, userId, assistantType]);

  // Check if near token limit (>80%)
  const isNearLimit = useMemo(() => {
    return tokenBudget.total > tokenBudget.maxTokens * 0.8;
  }, [tokenBudget]);

  return {
    session,
    messages: session?.messages || [],
    tokenBudget,
    isNearLimit,
    conversations,
    activeConversationId: manager.getActiveConversationId(),
    addMessage,
    getContext,
    getAPIMessages,
    clearSession,
    triggerSummarization,
    applySummary,
    startNewConversation,
    switchConversation,
    deleteConversation,
    getStats,
  };
}

export default useIntelligentMemory;
