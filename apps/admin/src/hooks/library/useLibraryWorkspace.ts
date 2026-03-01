/**
 * 🚀 useLibraryWorkspace Hook - GLOBAL SYNC VERSION
 * Uses global store + event system for cross-component sync
 * When AI Generator saves → Library page updates instantly!
 * + Auto-uploads to Google Drive!
 * + Auto-fetches from Google Drive on first load!
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { WorkspaceItem, MediaItem, ActivityAction } from './types';
import { workspaceStore, libraryActions, librarySync } from './libraryStore';

interface UseWorkspaceOptions {
  onActivityLog?: (action: ActivityAction, description: string, count?: number) => void;
  autoSync?: boolean; // Auto-sync from Google Drive on mount
}

export function useLibraryWorkspace(options: UseWorkspaceOptions = {}) {
  const { onActivityLog, autoSync = true } = options;
  
  // ⚡ Load from global store
  const [items, setItems] = useState<WorkspaceItem[]>(() => workspaceStore.getItems());
  const [syncing, setSyncing] = useState(false);
  
  // Loading state - instant for localStorage
  const loading = false;

  // 🔄 Subscribe to global store changes - THIS IS THE KEY!
  useEffect(() => {
    const unsubscribe = workspaceStore.subscribe(() => {
      setItems(workspaceStore.getItems());
    });
    return unsubscribe;
  }, []);

  // 🌐 Auto-sync from Google Drive on first mount
  useEffect(() => {
    if (autoSync) {
      setSyncing(true);
      librarySync.syncWorkspace().finally(() => {
        setSyncing(false);
        setItems(workspaceStore.getItems()); // Refresh after sync
      });
    }
  }, [autoSync]);

  // Add items to workspace (with Google Drive upload)
  const addItems = useCallback(async (newMediaItems: MediaItem[], uploadToDrive = true) => {
    let addedCount = 0;
    
    for (const item of newMediaItems) {
      const success = await libraryActions.addToWorkspace(item, uploadToDrive);
      if (success) addedCount++;
    }
    
    if (addedCount === 0) {
      toast.info('Files đã có trong Workspace');
      return;
    }

    onActivityLog?.('add_workspace', `Thêm ${addedCount} files vào Workspace`, addedCount);
    toast.success(`✅ Đã thêm ${addedCount} files vào Workspace${uploadToDrive ? ' + Google Drive' : ''}`);
  }, [onActivityLog]);

  // Remove item from workspace
  const removeItem = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const success = workspaceStore.removeItem(itemId);
    if (success) {
      onActivityLog?.('remove_workspace', `Xóa "${item.name}" khỏi Workspace`, 1);
      toast.success('Đã xóa khỏi Workspace');
    }
  }, [items, onActivityLog]);

  // Clear all items from workspace
  const clearAll = useCallback(() => {
    const count = workspaceStore.clearAll();
    if (count === 0) return;

    onActivityLog?.('clear_workspace', `Xóa tất cả ${count} files khỏi Workspace`, count);
    toast.success('Đã xóa tất cả khỏi Workspace');
  }, [onActivityLog]);

  // Check if item is in workspace
  const isInWorkspace = useCallback((itemId: string) => {
    return workspaceStore.isInWorkspace(itemId);
  }, []);

  // Refresh - re-read from store
  const refresh = useCallback(() => {
    setItems(workspaceStore.getItems());
  }, []);

  // Force refetch from Google Drive
  const refetch = useCallback(async () => {
    setSyncing(true);
    librarySync.resetSync(); // Reset so it fetches again
    await librarySync.syncWorkspace();
    setItems(workspaceStore.getItems());
    setSyncing(false);
  }, []);

  return {
    items,
    loading,
    syncing,
    addItems,
    removeItem,
    clearAll,
    isInWorkspace,
    refresh,
    refetch,
  };
}
