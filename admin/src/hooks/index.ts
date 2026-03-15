/**
 * Hooks Index - Export all custom hooks
 */

// UI Hooks
export { useToast } from './use-toast';
export { type AIAgent, useAIAgents } from './useAIAgents';
export { useAISettings } from './useAISettings';
export type { AssistantType } from './useAssistant';
// AI Workspace Hooks
export { useAssistant } from './useAssistant';
export { type ContentItem, useContentQueue } from './useContentQueue';
export { useConversationMemory } from './useConversationMemory';
// 📊 Dashboard & Data Hooks
export { type DashboardStats, useDashboardStats } from './useDashboardStats';
export { useDocumentUpload } from './useDocumentUpload';

// Intelligent Memory - Copilot Level 🧠
export { default as useIntelligentMemory } from './useIntelligentMemory';
// State Management Hooks
export { usePersistedState, useScrollRestore, useSessionState } from './usePersistedState';
export { type Project, useProjects } from './useProjects';
export { useStreamingChat } from './useStreamingChat';
export { useUploadManager } from './useUploadManager';
// Enhanced AI Features (Elon Musk Edition 🚀)
export { useVoiceInput } from './useVoiceInput';
export { useWorkflows, type Workflow } from './useWorkflows';
