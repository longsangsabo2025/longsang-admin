/**
 * 🚀 useLibraryProducts Hook - GLOBAL SYNC VERSION
 * Uses global store + event system for cross-component sync
 * When AI Generator saves → Library page updates instantly!
 * + Auto-uploads to Google Drive!
 * + Auto-fetches from Google Drive on first load!
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { ProductItem, MediaItem, ProductStatus, STATUS_CONFIG, ActivityAction } from './types';
import { productsStore, libraryActions, librarySync } from './libraryStore';

interface UseProductsOptions {
  onActivityLog?: (action: ActivityAction, description: string, count?: number) => void;
  autoSync?: boolean; // Auto-sync from Google Drive on mount
}

export function useLibraryProducts(options: UseProductsOptions = {}) {
  const { onActivityLog, autoSync = true } = options;
  
  // ⚡ Load from global store
  const [items, setItems] = useState<ProductItem[]>(() => productsStore.getItems());
  const [syncing, setSyncing] = useState(false);
  
  // Loading state - instant for localStorage
  const loading = false;

  // 🔄 Subscribe to global store changes - THIS IS THE KEY!
  useEffect(() => {
    const unsubscribe = productsStore.subscribe(() => {
      setItems(productsStore.getItems());
    });
    return unsubscribe;
  }, []);

  // 🌐 Auto-sync from Google Drive on first mount
  useEffect(() => {
    if (autoSync) {
      setSyncing(true);
      librarySync.syncProducts().finally(() => {
        setSyncing(false);
        setItems(productsStore.getItems()); // Refresh after sync
      });
    }
  }, [autoSync]);

  // Calculate stats
  const stats = useMemo(() => {
    return productsStore.getStats();
  }, [items]);

  // Add items to products (with Google Drive upload)
  const addItems = useCallback(async (newMediaItems: MediaItem[], defaultStatus: ProductStatus = 'draft', uploadToDrive = true) => {
    let addedCount = 0;
    
    for (const item of newMediaItems) {
      const success = await libraryActions.addToProducts(item, defaultStatus, uploadToDrive);
      if (success) addedCount++;
    }

    if (addedCount === 0) {
      toast.info('Files đã có trong Products');
      return;
    }

    onActivityLog?.('add_products', `Thêm ${addedCount} files vào Products (${STATUS_CONFIG[defaultStatus].label})`, addedCount);
    toast.success(`✅ Đã thêm ${addedCount} files vào Products${uploadToDrive ? ' + Google Drive' : ''}`);
  }, [onActivityLog]);

  // Remove item from products
  const removeItem = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const success = productsStore.removeItem(itemId);
    if (success) {
      onActivityLog?.('remove_products', `Xóa "${item.name}" khỏi Products`, 1);
      toast.success('Đã xóa khỏi Products');
    }
  }, [items, onActivityLog]);

  // Update item status
  const updateStatus = useCallback((itemId: string, newStatus: ProductStatus) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const success = productsStore.updateStatus(itemId, newStatus);
    if (success) {
      onActivityLog?.(
        'status_change',
        `Chuyển "${item.name}" sang ${STATUS_CONFIG[newStatus].label}`,
        1
      );
    }
  }, [items, onActivityLog]);

  // Batch update status
  const batchUpdateStatus = useCallback((itemIds: string[], newStatus: ProductStatus) => {
    if (itemIds.length === 0) return;

    const count = productsStore.batchUpdateStatus(itemIds, newStatus);
    if (count > 0) {
      onActivityLog?.(
        'batch_status',
        `Chuyển ${count} items sang ${STATUS_CONFIG[newStatus].label}`,
        count
      );
      toast.success(`Đã cập nhật ${count} items`);
    }
  }, [onActivityLog]);

  // Batch delete
  const batchDelete = useCallback((itemIds: string[]) => {
    if (itemIds.length === 0) return;

    let deleted = 0;
    itemIds.forEach(id => {
      if (productsStore.removeItem(id)) deleted++;
    });
    
    if (deleted > 0) {
      onActivityLog?.('batch_delete', `Xóa ${deleted} items`, deleted);
      toast.success(`Đã xóa ${deleted} items`);
    }
  }, [onActivityLog]);

  // Update single item (for notes, tags, etc.)
  const updateItem = useCallback((itemId: string, updates: Partial<ProductItem>) => {
    // For complex updates, we need to modify the store directly
    const currentItems = productsStore.getItems();
    const index = currentItems.findIndex(i => i.id === itemId);
    if (index === -1) return;

    currentItems[index] = { 
      ...currentItems[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    
    // Manually update localStorage and emit
    localStorage.setItem('library-products', JSON.stringify(currentItems));
    setItems([...currentItems]);
  }, []);

  // Update all items
  const updateAllItems = useCallback((newItems: ProductItem[]) => {
    localStorage.setItem('library-products', JSON.stringify(newItems));
    setItems(newItems);
  }, []);

  // Clear all items
  const clearAll = useCallback(() => {
    const count = productsStore.clearAll();
    if (count === 0) return;

    onActivityLog?.('clear_products', `Xóa tất cả ${count} products`, count);
    toast.success('Đã xóa tất cả Products');
  }, [onActivityLog]);

  // Check if item is in products
  const isInProducts = useCallback((itemId: string) => {
    return productsStore.isInProducts(itemId);
  }, []);

  // Get items by status
  const getByStatus = useCallback((status: ProductStatus) => {
    return items.filter(item => item.status === status);
  }, [items]);

  // Refresh - re-read from store
  const refresh = useCallback(() => {
    setItems(productsStore.getItems());
  }, []);

  // Force refetch from Google Drive
  const refetch = useCallback(async () => {
    setSyncing(true);
    librarySync.resetSync();
    await librarySync.syncProducts();
    setItems(productsStore.getItems());
    setSyncing(false);
  }, []);

  return {
    items,
    loading,
    syncing,
    stats,
    addItems,
    removeItem,
    updateStatus,
    batchUpdateStatus,
    batchDelete,
    updateItem,
    updateAllItems,
    clearAll,
    isInProducts,
    getByStatus,
    refresh,
    refetch,
  };
}
