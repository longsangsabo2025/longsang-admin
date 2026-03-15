/**
 * 🗄️ Stores Index
 *
 * Central export point for all Zustand stores.
 * Import stores from here to ensure consistent usage.
 */

// AI Workspace store
export {
  type Conversation,
  type Message,
  useAIWorkspaceStore,
  useConversationsByAssistant,
  useCurrentConversation,
} from './aiWorkspaceStore';
// Main app store
export {
  useActiveAdminTab,
  useActiveAITab,
  useAppStore,
  useLastVisitedPage,
  useSidebarCollapsed,
} from './appStore';
