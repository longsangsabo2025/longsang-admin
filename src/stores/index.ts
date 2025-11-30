/**
 * 🗄️ Stores Index
 *
 * Central export point for all Zustand stores.
 * Import stores from here to ensure consistent usage.
 */

// Main app store
export { useAppStore, useActiveAdminTab, useActiveAITab, useSidebarCollapsed, useLastVisitedPage } from './appStore';

// AI Workspace store
export {
  useAIWorkspaceStore,
  useCurrentConversation,
  useConversationsByAssistant,
  type Message,
  type Conversation,
} from './aiWorkspaceStore';
