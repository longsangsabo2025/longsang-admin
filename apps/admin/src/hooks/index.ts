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

// 📊 Dashboard & Data Hooks
export { useDashboardStats, type DashboardStats } from './useDashboardStats';
export { useProjects, type Project } from './useProjects';
export { useWorkflows, type Workflow } from './useWorkflows';
export { useAIAgents, type AIAgent } from './useAIAgents';
export { useContentQueue, type ContentItem } from './useContentQueue';
