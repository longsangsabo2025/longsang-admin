/**
 * Hooks Index - Export all custom hooks
 */

// State Management Hooks
export { usePersistedState, useSessionState, useScrollRestore } from './usePersistedState';

// AI Workspace Hooks
export { useAssistant } from './useAssistant';
export type { AssistantType } from './useAssistant';
export { useAISettings } from './useAISettings';
export { useDocumentUpload } from './useDocumentUpload';
export { useUploadManager } from './useUploadManager';

// Enhanced AI Features (Elon Musk Edition 🚀)
export { useVoiceInput } from './useVoiceInput';
export { useStreamingChat } from './useStreamingChat';
export { useConversationMemory } from './useConversationMemory';

// Intelligent Memory - Copilot Level 🧠
export { default as useIntelligentMemory } from './useIntelligentMemory';

// UI Hooks
export { useToast } from './use-toast';
