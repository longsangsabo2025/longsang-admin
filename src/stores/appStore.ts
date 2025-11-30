/**
 * 🗄️ App Store - Global State Management với Zustand
 *
 * Store này giữ state giữa các lần chuyển tab, tránh bị reset.
 * Sử dụng persist middleware để lưu vào localStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

interface TabState {
  // Tab đang active trong mỗi section
  activeAdminTab: string;
  activeAITab: string;
  activeMarketingTab: string;

  // Scroll positions của mỗi page
  scrollPositions: Record<string, number>;

  // Data đã load (cache)
  cachedData: Record<string, unknown>;

  // UI preferences
  sidebarCollapsed: boolean;
  lastVisitedPage: string;
}

interface TabActions {
  // Tab navigation
  setActiveAdminTab: (tab: string) => void;
  setActiveAITab: (tab: string) => void;
  setActiveMarketingTab: (tab: string) => void;

  // Scroll management
  saveScrollPosition: (pageId: string, position: number) => void;
  getScrollPosition: (pageId: string) => number;

  // Cache management
  setCachedData: (key: string, data: unknown) => void;
  getCachedData: <T>(key: string) => T | undefined;
  clearCache: () => void;

  // UI preferences
  toggleSidebar: () => void;
  setLastVisitedPage: (page: string) => void;

  // Reset
  resetStore: () => void;
}

type AppStore = TabState & TabActions;

// ============================================
// Initial State
// ============================================

const initialState: TabState = {
  activeAdminTab: 'dashboard',
  activeAITab: 'workspace',
  activeMarketingTab: 'projects',
  scrollPositions: {},
  cachedData: {},
  sidebarCollapsed: false,
  lastVisitedPage: '/admin',
};

// ============================================
// Store with Persist
// ============================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Tab actions
      setActiveAdminTab: (tab) => set({ activeAdminTab: tab }),
      setActiveAITab: (tab) => set({ activeAITab: tab }),
      setActiveMarketingTab: (tab) => set({ activeMarketingTab: tab }),

      // Scroll position management
      saveScrollPosition: (pageId, position) =>
        set((state) => ({
          scrollPositions: {
            ...state.scrollPositions,
            [pageId]: position,
          },
        })),

      getScrollPosition: (pageId) => get().scrollPositions[pageId] ?? 0,

      // Cache management
      setCachedData: (key, data) =>
        set((state) => ({
          cachedData: {
            ...state.cachedData,
            [key]: data,
          },
        })),

      getCachedData: <T>(key: string) => get().cachedData[key] as T | undefined,

      clearCache: () => set({ cachedData: {} }),

      // UI preferences
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setLastVisitedPage: (page) => set({ lastVisitedPage: page }),

      // Reset store
      resetStore: () => set(initialState),
    }),
    {
      name: 'longsang-admin-store', // Key trong localStorage
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist những fields quan trọng
      partialize: (state) => ({
        activeAdminTab: state.activeAdminTab,
        activeAITab: state.activeAITab,
        activeMarketingTab: state.activeMarketingTab,
        scrollPositions: state.scrollPositions,
        sidebarCollapsed: state.sidebarCollapsed,
        lastVisitedPage: state.lastVisitedPage,
        // Không persist cachedData để tránh localStorage quá lớn
      }),
    }
  )
);

// ============================================
// Selector Hooks (optimized re-renders)
// ============================================

export const useActiveAdminTab = () => useAppStore((s) => s.activeAdminTab);
export const useActiveAITab = () => useAppStore((s) => s.activeAITab);
export const useSidebarCollapsed = () => useAppStore((s) => s.sidebarCollapsed);
export const useLastVisitedPage = () => useAppStore((s) => s.lastVisitedPage);
