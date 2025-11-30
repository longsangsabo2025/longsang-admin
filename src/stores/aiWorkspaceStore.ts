/**
 * 🤖 AI Workspace Store
 *
 * Giữ state của AI Workspace page giữa các lần navigate.
 * - Conversation history
 * - Selected assistant
 * - User preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  assistantId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  assistantId: string;
  createdAt: number;
  updatedAt: number;
}

interface AIWorkspaceState {
  // Current session
  selectedAssistantId: string | null;
  currentConversationId: string | null;

  // Conversations cache
  conversations: Conversation[];

  // UI state
  inputValue: string;
  isStreaming: boolean;
  sidebarOpen: boolean;

  // Settings
  temperature: number;
  maxTokens: number;
}

interface AIWorkspaceActions {
  // Assistant selection
  selectAssistant: (id: string) => void;

  // Conversation management
  createConversation: (assistantId: string, title?: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // Messages
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // UI state
  setInputValue: (value: string) => void;
  setIsStreaming: (value: boolean) => void;
  toggleSidebar: () => void;

  // Settings
  setTemperature: (value: number) => void;
  setMaxTokens: (value: number) => void;

  // Reset
  resetWorkspace: () => void;
}

type AIWorkspaceStore = AIWorkspaceState & AIWorkspaceActions;

// ============================================
// Initial State
// ============================================

const initialState: AIWorkspaceState = {
  selectedAssistantId: null,
  currentConversationId: null,
  conversations: [],
  inputValue: '',
  isStreaming: false,
  sidebarOpen: true,
  temperature: 0.7,
  maxTokens: 4096,
};

// ============================================
// Helper functions
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// ============================================
// Store
// ============================================

export const useAIWorkspaceStore = create<AIWorkspaceStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      selectAssistant: (id) => {
        set({ selectedAssistantId: id });
        // Optionally create a new conversation for this assistant
        const existingConv = get().conversations.find(
          (c) => c.assistantId === id && c.messages.length === 0
        );
        if (!existingConv) {
          get().createConversation(id);
        }
      },

      createConversation: (assistantId, title) => {
        const id = generateId();
        const conversation: Conversation = {
          id,
          title: title || `Chat ${new Date().toLocaleDateString('vi-VN')}`,
          messages: [],
          assistantId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
        }));

        return id;
      },

      selectConversation: (id) => {
        const conversation = get().conversations.find((c) => c.id === id);
        if (conversation) {
          set({
            currentConversationId: id,
            selectedAssistantId: conversation.assistantId,
          });
        }
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            currentConversationId:
              state.currentConversationId === id
                ? filtered[0]?.id ?? null
                : state.currentConversationId,
          };
        });
      },

      addMessage: (message) => {
        const state = get();
        const convId = state.currentConversationId;
        if (!convId) return;

        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === convId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  updatedAt: Date.now(),
                }
              : conv
          ),
        }));
      },

      clearMessages: () => {
        const convId = get().currentConversationId;
        if (!convId) return;

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === convId ? { ...conv, messages: [], updatedAt: Date.now() } : conv
          ),
        }));
      },

      setInputValue: (value) => set({ inputValue: value }),
      setIsStreaming: (value) => set({ isStreaming: value }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTemperature: (value) => set({ temperature: value }),
      setMaxTokens: (value) => set({ maxTokens: value }),

      resetWorkspace: () => set(initialState),
    }),
    {
      name: 'longsang-ai-workspace', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist these fields
        selectedAssistantId: state.selectedAssistantId,
        currentConversationId: state.currentConversationId,
        conversations: state.conversations.slice(0, 50), // Limit to 50 conversations
        sidebarOpen: state.sidebarOpen,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        // Don't persist: inputValue, isStreaming
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const useCurrentConversation = () =>
  useAIWorkspaceStore((state) => {
    const id = state.currentConversationId;
    return state.conversations.find((c) => c.id === id) ?? null;
  });

export const useConversationsByAssistant = (assistantId: string) =>
  useAIWorkspaceStore((state) =>
    state.conversations.filter((c) => c.assistantId === assistantId)
  );
